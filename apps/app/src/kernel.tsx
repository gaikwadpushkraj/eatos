import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Kernel, Vault, isEnvelope } from '@eatos/core';
import type { EatEvent, Envelope } from '@eatos/core';
import { defaultConfig, deleteServerData, loadConfig, saveConfig, syncWithServer } from './sync';
import type { SyncConfig, SyncStatus } from './sync';
import { randomBytes, rewriteSecrets, setActiveVault, wipeDevice } from './secure';

const KEY = 'eatos.events.v1';

/** An event without a timestamp; the provider stamps it with now. */
export type EventInput = EatEvent extends infer E ? (E extends EatEvent ? Omit<E, 'at'> & { at?: number } : never) : never;

interface KernelValue {
  kernel: Kernel;
  /** Bumps on every event so screens re-derive their views. */
  version: number;
  now: number;
  submit: (e: EventInput) => EatEvent;
  submitMany: (events: EventInput[]) => void;
  /** Merges events from a backup; returns how many were new. */
  restore: (events: EatEvent[]) => number;
  /** Deletes everything on this device, and the server copy when sync is on. */
  wipe: () => Promise<{ serverDeleted: boolean | null }>;
  /** Set after a wipe until the next event, so setup can confirm it. */
  lastWipe: { serverDeleted: boolean | null } | null;
  sync: {
    config: SyncConfig;
    status: SyncStatus;
    setConfig: (c: SyncConfig) => Promise<void>;
    now: () => Promise<void>;
  };
  security: {
    encrypted: boolean;
    /** Encrypts the event log and saved secrets on this device with a passphrase. */
    enable: (passphrase: string) => Promise<void>;
    /** Turns protection off after checking the passphrase. */
    disable: (passphrase: string) => Promise<void>;
    /** Locks the app until the passphrase is entered again. */
    lock: () => void;
  };
}

interface LockValue {
  locked: boolean;
  unlock: (passphrase: string) => Promise<void>;
  /** Forgot the passphrase: erase this device's data so the app can start over. */
  eraseLocked: () => Promise<void>;
}

const KernelContext = createContext<KernelValue | null>(null);
const LockContext = createContext<LockValue>({ locked: false, unlock: async () => {}, eraseLocked: async () => {} });

/**
 * Runs the EatOS kernel on the device. The event log is the only thing
 * stored; state is rebuilt from it on launch. With device protection on,
 * the log is stored encrypted and the app starts locked.
 */
export function KernelProvider({ children }: { children: ReactNode }) {
  const [kernel, setKernel] = useState<Kernel | null>(null);
  const [locked, setLocked] = useState(false);
  const [encrypted, setEncrypted] = useState(false);
  const [version, setVersion] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const vaultRef = useRef<Vault | null>(null);
  const envelopeRef = useRef<Envelope | null>(null);
  const [lastWipe, setLastWipe] = useState<{ serverDeleted: boolean | null } | null>(null);
  const [syncConfig, setSyncConfig] = useState<SyncConfig>(defaultConfig);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ state: 'off' });
  const syncing = useRef(false);

  /** Writes the event log now, encrypted when protection is on. */
  const persist = useCallback(async (events: EatEvent[]) => {
    const json = JSON.stringify(events);
    const v = vaultRef.current;
    await AsyncStorage.setItem(KEY, v ? JSON.stringify(v.seal(json, randomBytes)) : json);
  }, []);

  const make = useCallback(
    (events: EatEvent[]) => {
      const k = new Kernel({
        events,
        onEvent: (_e, s) => {
          if (saveTimer.current) clearTimeout(saveTimer.current);
          saveTimer.current = setTimeout(() => {
            persist(s.events).catch(() => {});
          }, 50);
        },
      });
      // Housekeeping on boot: drop expired pantry items, compact old events.
      k.housekeep(Date.now());
      k.compact(Date.now());
      return k;
    },
    [persist],
  );

  // Boot: plain log, encrypted log (start locked), or nothing yet.
  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        const parsed: unknown = raw ? JSON.parse(raw) : [];
        if (isEnvelope(parsed)) {
          envelopeRef.current = parsed;
          setEncrypted(true);
          setLocked(true);
        } else {
          setKernel(make(Array.isArray(parsed) ? (parsed as EatEvent[]) : []));
        }
      })
      .catch(() => setKernel(make([])));
  }, [make]);

  // Sync settings may be encrypted, so load them once the kernel is available.
  useEffect(() => {
    if (!kernel) return;
    loadConfig().then((c) => {
      setSyncConfig(c);
      setSyncStatus({ state: c.enabled ? 'idle' : 'off' });
    });
  }, [kernel]);

  const runSync = useCallback(async (k: Kernel | null, c: SyncConfig) => {
    if (!k || !c.enabled || !c.url || syncing.current) return;
    syncing.current = true;
    setSyncStatus((s) => ({ ...s, state: 'syncing' }));
    try {
      const r = await syncWithServer(k, c);
      setSyncStatus({ state: 'idle', lastSyncAt: r.at, message: r.received || r.sent ? `Sent ${r.sent}, received ${r.received}` : 'Up to date' });
      if (r.received) {
        setNow(Date.now());
        setVersion((v) => v + 1);
      }
    } catch (e) {
      setSyncStatus((s) => ({ ...s, state: 'error', message: e instanceof Error ? e.message : 'Sync failed' }));
    } finally {
      syncing.current = false;
    }
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  // Sync shortly after any change, and every minute while enabled.
  useEffect(() => {
    if (!syncConfig.enabled) return;
    const t = setTimeout(() => runSync(kernel, syncConfig), 1500);
    return () => clearTimeout(t);
  }, [kernel, version, syncConfig, runSync]);

  useEffect(() => {
    if (!syncConfig.enabled) return;
    const id = setInterval(() => runSync(kernel, syncConfig), 60_000);
    return () => clearInterval(id);
  }, [kernel, syncConfig, runSync]);

  const lockValue = useMemo<LockValue>(
    () => ({
      locked,
      unlock: async (passphrase) => {
        const env = envelopeRef.current;
        if (!env) throw new Error('Nothing to unlock');
        const { vault, data } = await Vault.unlock(env, passphrase);
        vaultRef.current = vault;
        setActiveVault(vault);
        setKernel(make(JSON.parse(data) as EatEvent[]));
        setLocked(false);
      },
      eraseLocked: async () => {
        await wipeDevice();
        envelopeRef.current = null;
        vaultRef.current = null;
        setActiveVault(null);
        setEncrypted(false);
        setLocked(false);
        setKernel(make([]));
      },
    }),
    [locked, make],
  );

  const value = useMemo<KernelValue | null>(() => {
    if (!kernel) return null;
    const bump = (t = Date.now()) => {
      setLastWipe(null);
      setNow(t);
      setVersion((v) => v + 1);
    };
    return {
      kernel,
      version,
      now,
      submit: (e) => {
        const t = Date.now();
        const ev = kernel.submit({ ...e, at: e.at ?? t } as EatEvent);
        bump(t);
        return ev;
      },
      submitMany: (events) => {
        const t = Date.now();
        for (const e of events) kernel.submit({ ...e, at: e.at ?? t } as EatEvent);
        bump(t);
      },
      restore: (events) => {
        const added = kernel.merge(events);
        if (added.length) {
          persist(kernel.events).catch(() => {});
          bump();
        }
        return added.length;
      },
      lastWipe,
      wipe: async () => {
        const serverDeleted = syncConfig.enabled ? await deleteServerData(syncConfig) : null;
        if (saveTimer.current) clearTimeout(saveTimer.current);
        await wipeDevice();
        vaultRef.current = null;
        envelopeRef.current = null;
        setActiveVault(null);
        setEncrypted(false);
        setSyncConfig(defaultConfig);
        setSyncStatus({ state: 'off' });
        setKernel(make([]));
        setVersion((v) => v + 1);
        setLastWipe({ serverDeleted });
        return { serverDeleted };
      },
      sync: {
        config: syncConfig,
        status: syncStatus,
        setConfig: async (c) => {
          await saveConfig(c, syncConfig);
          setSyncConfig(c);
          setSyncStatus({ state: c.enabled ? 'idle' : 'off' });
        },
        now: () => runSync(kernel, syncConfig),
      },
      security: {
        encrypted,
        enable: async (passphrase) => {
          const vault = await Vault.create(passphrase, randomBytes);
          if (saveTimer.current) clearTimeout(saveTimer.current);
          await rewriteSecrets(null, vault);
          vaultRef.current = vault;
          setActiveVault(vault);
          await persist(kernel.events);
          setEncrypted(true);
        },
        disable: async (passphrase) => {
          const current = vaultRef.current;
          if (!current) return;
          // Re-derive the key from what was typed: proves the passphrase before protection comes off.
          await Vault.unlock(current.seal('check', randomBytes), passphrase);
          if (saveTimer.current) clearTimeout(saveTimer.current);
          await rewriteSecrets(current, null);
          vaultRef.current = null;
          setActiveVault(null);
          await persist(kernel.events);
          setEncrypted(false);
        },
        lock: () => {
          const v = vaultRef.current;
          if (!v) return;
          if (saveTimer.current) clearTimeout(saveTimer.current);
          envelopeRef.current = v.seal(JSON.stringify(kernel.events), randomBytes);
          // Make sure what is on disk matches what was in memory.
          AsyncStorage.setItem(KEY, JSON.stringify(envelopeRef.current)).catch(() => {});
          vaultRef.current = null;
          setActiveVault(null);
          setKernel(null);
          setLocked(true);
        },
      },
    };
  }, [kernel, version, now, make, persist, syncConfig, syncStatus, runSync, encrypted, lastWipe]);

  return (
    <LockContext.Provider value={lockValue}>
      <KernelContext.Provider value={value}>{children}</KernelContext.Provider>
    </LockContext.Provider>
  );
}

export function useKernelMaybe(): KernelValue | null {
  return useContext(KernelContext);
}

export function useLock(): LockValue {
  return useContext(LockContext);
}

export function useKernel(): KernelValue {
  const v = useContext(KernelContext);
  if (!v) throw new Error('useKernel before the kernel booted');
  return v;
}
