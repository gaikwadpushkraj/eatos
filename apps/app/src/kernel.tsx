import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Kernel } from '@eatos/core';
import type { EatEvent } from '@eatos/core';
import { defaultConfig, loadConfig, saveConfig, syncWithServer } from './sync';
import type { SyncConfig, SyncStatus } from './sync';

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
  reset: () => Promise<void>;
  sync: {
    config: SyncConfig;
    status: SyncStatus;
    setConfig: (c: SyncConfig) => Promise<void>;
    now: () => Promise<void>;
  };
}

const KernelContext = createContext<KernelValue | null>(null);

/**
 * Runs the EatOS kernel on the device. The event log is the only thing
 * stored; state is rebuilt from it on launch.
 */
export function KernelProvider({ children }: { children: ReactNode }) {
  const [kernel, setKernel] = useState<Kernel | null>(null);
  const [version, setVersion] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [syncConfig, setSyncConfig] = useState<SyncConfig>(defaultConfig);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ state: 'off' });
  const syncing = useRef(false);

  useEffect(() => {
    loadConfig().then((c) => {
      setSyncConfig(c);
      setSyncStatus({ state: c.enabled ? 'idle' : 'off' });
    });
  }, []);

  const runSync = useCallback(
    async (k: Kernel | null, c: SyncConfig) => {
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
    },
    [],
  );

  const make = useCallback((events: EatEvent[]) => {
    const k = new Kernel({
      events,
      onEvent: (_e, s) => {
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => {
          AsyncStorage.setItem(KEY, JSON.stringify(s.events)).catch(() => {});
        }, 50);
      },
    });
    // Housekeeping on boot: drop expired pantry items, compact old events.
    k.housekeep(Date.now());
    k.compact(Date.now());
    return k;
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => setKernel(make(raw ? (JSON.parse(raw) as EatEvent[]) : [])))
      .catch(() => setKernel(make([])));
  }, [make]);

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

  const value = useMemo<KernelValue | null>(() => {
    if (!kernel) return null;
    const submit: KernelValue['submit'] = (e) => {
      const t = Date.now();
      const ev = kernel.submit({ ...e, at: e.at ?? t } as EatEvent);
      setNow(t);
      setVersion((v) => v + 1);
      return ev;
    };
    return {
      kernel,
      version,
      now,
      submit,
      submitMany: (events) => {
        const t = Date.now();
        for (const e of events) kernel.submit({ ...e, at: e.at ?? t } as EatEvent);
        setNow(t);
        setVersion((v) => v + 1);
      },
      reset: async () => {
        await AsyncStorage.removeItem(KEY);
        setKernel(make([]));
        setVersion((v) => v + 1);
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
    };
  }, [kernel, version, now, make, syncConfig, syncStatus, runSync]);

  return <KernelContext.Provider value={value}>{children}</KernelContext.Provider>;
}

export function useKernelMaybe(): KernelValue | null {
  return useContext(KernelContext);
}

export function useKernel(): KernelValue {
  const v = useContext(KernelContext);
  if (!v) throw new Error('useKernel before the kernel booted');
  return v;
}
