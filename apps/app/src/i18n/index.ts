import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CATALOG } from '@eatos/core';
import hi from './hi.json';
import hiDishes from './hi-dishes.json';

export type Lang = 'en' | 'hi';
const KEY = 'eatos.lang';

const dishByName: Record<string, string> = {};
for (const f of CATALOG) {
  const h = (hiDishes as Record<string, string>)[f.id];
  if (h) dishByName[f.name] = h;
}

let lang: Lang = 'en';
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

AsyncStorage.getItem(KEY)
  .then((v) => {
    if (v === 'hi' || v === 'en') {
      lang = v;
      emit();
    }
  })
  .catch(() => {});

export function setLang(next: Lang): void {
  lang = next;
  AsyncStorage.setItem(KEY, next).catch(() => {});
  emit();
}

/** Looks a string up by its exact English text. Anything not translated stays in English. */
export function t(s: string): string {
  if (lang === 'en') return s;
  return (hi as Record<string, string>)[s] ?? dishByName[s] ?? s;
}

/** Re-renders when the language changes, and returns the current one. */
export function useLang(): Lang {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => lang,
    () => 'en' as Lang,
  );
}
