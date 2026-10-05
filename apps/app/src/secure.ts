import AsyncStorage from '@react-native-async-storage/async-storage';
import { getRandomBytes } from 'expo-crypto';
import { Vault, isEnvelope } from '@eatos/core';
import type { RandomBytes } from '@eatos/core';

/** Cryptographically secure random bytes from the platform. */
export const randomBytes: RandomBytes = (n) => new Uint8Array(getRandomBytes(n));

/** The unlocked vault while device protection is on; null otherwise. */
let active: Vault | null = null;

export function setActiveVault(v: Vault | null): void {
  active = v;
}

/** Storage keys holding secrets (API key, sync code) that follow the device protection setting. */
export const SECRET_KEYS = ['eatos.llm.config', 'eatos.sync.config'];

/** Reads a JSON value, decrypting it when it was stored encrypted. */
export async function getSecret<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return fallback;
    const parsed: unknown = JSON.parse(raw);
    if (isEnvelope(parsed)) return active ? (JSON.parse(active.open(parsed)) as T) : fallback;
    return parsed as T;
  } catch {
    return fallback;
  }
}

/** Stores a JSON value, encrypted when device protection is on. */
export async function setSecret(key: string, value: unknown): Promise<void> {
  const json = JSON.stringify(value);
  await AsyncStorage.setItem(key, active ? JSON.stringify(active.seal(json, randomBytes)) : json);
}

/** Re-stores every secret when protection is turned on or off. */
export async function rewriteSecrets(from: Vault | null, to: Vault | null): Promise<void> {
  for (const key of SECRET_KEYS) {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) continue;
    const parsed: unknown = JSON.parse(raw);
    const json = isEnvelope(parsed) ? (from ? from.open(parsed) : undefined) : raw;
    if (json === undefined) continue;
    await AsyncStorage.setItem(key, to ? JSON.stringify(to.seal(json, randomBytes)) : json);
  }
}

/** Removes everything EatOS stored on this device. */
export async function wipeDevice(): Promise<void> {
  const keys = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith('eatos.'));
  await AsyncStorage.multiRemove(keys);
}
