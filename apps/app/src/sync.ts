import AsyncStorage from '@react-native-async-storage/async-storage';
import { emptySyncState, syncOnce } from '@eatos/core';
import { getSecret, setSecret } from './secure';
import type { Kernel, SyncRequest, SyncResponse, SyncState } from '@eatos/core';

export interface SyncConfig {
  enabled: boolean;
  /** e.g. http://192.168.1.20:8787 */
  url: string;
  /** Shared by all devices of one person or household. */
  code: string;
}

export interface SyncStatus {
  state: 'off' | 'idle' | 'syncing' | 'error';
  lastSyncAt?: number;
  message?: string;
}

const CONFIG_KEY = 'eatos.sync.config';
const STATE_KEY = 'eatos.sync.state';

export const defaultConfig: SyncConfig = { enabled: false, url: '', code: '' };

export async function loadConfig(): Promise<SyncConfig> {
  return { ...defaultConfig, ...(await getSecret<Partial<SyncConfig>>(CONFIG_KEY, {})) };
}

export async function saveConfig(c: SyncConfig, previous?: SyncConfig): Promise<void> {
  await setSecret(CONFIG_KEY, c);
  // A different server or code is a different log: start from scratch.
  if (previous && (previous.url !== c.url || previous.code !== c.code)) await AsyncStorage.removeItem(STATE_KEY);
}

async function loadState(): Promise<SyncState> {
  try {
    const raw = await AsyncStorage.getItem(STATE_KEY);
    return raw ? (JSON.parse(raw) as SyncState) : emptySyncState();
  } catch {
    return emptySyncState();
  }
}

export function validCode(code: string): boolean {
  return /^[a-zA-Z0-9_-]{4,64}$/.test(code);
}

/** One sync round with the EatOS API. Returns how many events arrived. */
export async function syncWithServer(kernel: Kernel, config: SyncConfig): Promise<{ received: number; sent: number; at: number }> {
  const base = config.url.replace(/\/+$/, '');
  const transport = async (req: SyncRequest): Promise<SyncResponse> => {
    const res = await fetch(`${base}/v1/sync`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-user-id': config.code },
      body: JSON.stringify(req),
    });
    if (!res.ok) throw new Error(`Server said ${res.status}`);
    return (await res.json()) as SyncResponse;
  };
  const result = await syncOnce(kernel, await loadState(), transport);
  await AsyncStorage.setItem(STATE_KEY, JSON.stringify(result.state));
  return { received: result.received, sent: result.sent, at: result.state.lastSyncAt ?? Date.now() };
}

/** Asks the server to erase this person's synced data. Returns whether it confirmed. */
export async function deleteServerData(config: SyncConfig): Promise<boolean> {
  if (!config.url || !config.code) return false;
  try {
    const res = await fetch(`${config.url.replace(/\/+$/, '')}/v1/data`, { method: 'DELETE', headers: { 'x-user-id': config.code } });
    return res.ok;
  } catch {
    return false;
  }
}
