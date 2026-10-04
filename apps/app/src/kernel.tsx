import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Kernel } from '@eatos/core';
import type { EatEvent } from '@eatos/core';

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
    };
  }, [kernel, version, now, make]);

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
