import { xchacha20poly1305 } from '@noble/ciphers/chacha.js';
import { scryptAsync } from '@noble/hashes/scrypt.js';
import type { EatEvent } from './types';
import { withId } from './kernel';
import { eventProblem } from './validate';

/**
 * Encryption for data at rest and for backups.
 *
 *  - Key: scrypt (memory-hard) from the passphrase and a random salt.
 *  - Cipher: XChaCha20-Poly1305 (authenticated; a random 24-byte nonce is
 *    safe for every save). The parameters and salt are bound to the
 *    ciphertext as associated data, so tampering with them fails to open.
 *  - Randomness is injected, because React Native has no WebCrypto: the
 *    app passes expo-crypto, the server passes node:crypto.
 *
 * A passphrase that is lost cannot be recovered: there is no backdoor.
 */
export type RandomBytes = (n: number) => Uint8Array;

export interface KdfParams {
  /** CPU and memory cost, a power of two. */
  N: number;
  r: number;
  p: number;
}

/** About 32 MB of memory; a second or two on a phone. */
export const DEFAULT_KDF: KdfParams = { N: 2 ** 15, r: 8, p: 1 };

export interface Envelope extends KdfParams {
  v: 1;
  alg: 'xchacha20poly1305';
  kdf: 'scrypt';
  salt: string;
  nonce: string;
  ct: string;
}

export function isEnvelope(x: unknown): x is Envelope {
  if (!x || typeof x !== 'object') return false;
  const e = x as Record<string, unknown>;
  return e.v === 1 && e.alg === 'xchacha20poly1305' && e.kdf === 'scrypt' && typeof e.salt === 'string' && typeof e.nonce === 'string' && typeof e.ct === 'string' && typeof e.N === 'number' && typeof e.r === 'number' && typeof e.p === 'number';
}

export class VaultError extends Error {
  constructor(public code: 'wrong-passphrase' | 'invalid', message: string) {
    super(message);
  }
}

// --- bytes <-> text helpers that work in every JS runtime -------------------

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function toBase64(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i]!;
    const b = bytes[i + 1];
    const c = bytes[i + 2];
    out += B64[a >> 2]! + B64[((a & 3) << 4) | ((b ?? 0) >> 4)]! + (b === undefined ? '=' : B64[((b & 15) << 2) | ((c ?? 0) >> 6)]!) + (c === undefined ? '=' : B64[c & 63]!);
  }
  return out;
}

export function fromBase64(s: string): Uint8Array {
  const clean = s.replace(/=+$/, '');
  if (/[^A-Za-z0-9+/]/.test(clean)) throw new VaultError('invalid', 'Not valid base64');
  const out = new Uint8Array(Math.floor((clean.length * 3) / 4));
  let o = 0;
  for (let i = 0; i < clean.length; i += 4) {
    const n = [0, 1, 2, 3].map((k) => (i + k < clean.length ? B64.indexOf(clean[i + k]!) : 0));
    const v = (n[0]! << 18) | (n[1]! << 12) | (n[2]! << 6) | n[3]!;
    if (o < out.length) out[o++] = (v >> 16) & 255;
    if (o < out.length) out[o++] = (v >> 8) & 255;
    if (o < out.length) out[o++] = v & 255;
  }
  return out;
}

export function utf8(s: string): Uint8Array {
  const out: number[] = [];
  for (const ch of s) {
    const c = ch.codePointAt(0)!;
    if (c < 0x80) out.push(c);
    else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 63));
    else if (c < 0x10000) out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    else out.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
  }
  return Uint8Array.from(out);
}

export function fromUtf8(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; ) {
    const b = bytes[i++]!;
    let cp: number;
    if (b < 0x80) cp = b;
    else if (b < 0xe0) cp = ((b & 31) << 6) | (bytes[i++]! & 63);
    else if (b < 0xf0) cp = ((b & 15) << 12) | ((bytes[i++]! & 63) << 6) | (bytes[i++]! & 63);
    else cp = ((b & 7) << 18) | ((bytes[i++]! & 63) << 12) | ((bytes[i++]! & 63) << 6) | (bytes[i++]! & 63);
    out += String.fromCodePoint(cp);
  }
  return out;
}

function aad(e: { N: number; r: number; p: number; salt: string }): Uint8Array {
  return utf8(`eatos:v1:scrypt:${e.N}:${e.r}:${e.p}:${e.salt}`);
}

async function deriveKey(passphrase: string, salt: Uint8Array, k: KdfParams): Promise<Uint8Array> {
  if (!passphrase) throw new VaultError('invalid', 'A passphrase is required');
  return scryptAsync(utf8(passphrase.normalize('NFKC')), salt, { N: k.N, r: k.r, p: k.p, dkLen: 32, asyncTick: 20 });
}

/** A derived key held in memory, bound to one salt and parameter set. */
export class Vault {
  private constructor(
    private key: Uint8Array,
    private params: KdfParams,
    private salt: string,
  ) {}

  /** A new vault with a fresh random salt. */
  static async create(passphrase: string, rb: RandomBytes, params: KdfParams = DEFAULT_KDF): Promise<Vault> {
    const salt = rb(16);
    return new Vault(await deriveKey(passphrase, salt, params), params, toBase64(salt));
  }

  /** Opens an envelope with a passphrase and returns the unlocked vault and its plaintext. */
  static async unlock(env: Envelope, passphrase: string): Promise<{ vault: Vault; data: string }> {
    if (!isEnvelope(env)) throw new VaultError('invalid', 'Not an EatOS encrypted file');
    if (!Number.isInteger(Math.log2(env.N)) || env.N < 2 || env.N > 2 ** 20 || env.r < 1 || env.r > 16 || env.p < 1 || env.p > 4) throw new VaultError('invalid', 'Unsupported key settings');
    const vault = new Vault(await deriveKey(passphrase, fromBase64(env.salt), env), { N: env.N, r: env.r, p: env.p }, env.salt);
    return { vault, data: vault.open(env) };
  }

  /** Encrypts text with a fresh nonce. The salt stays the same, so one unlock covers every save. */
  seal(plaintext: string, rb: RandomBytes): Envelope {
    const nonce = rb(24);
    const head = { N: this.params.N, r: this.params.r, p: this.params.p, salt: this.salt };
    const ct = xchacha20poly1305(this.key, nonce, aad(head)).encrypt(utf8(plaintext));
    return { v: 1, alg: 'xchacha20poly1305', kdf: 'scrypt', ...head, nonce: toBase64(nonce), ct: toBase64(ct) };
  }

  open(env: Envelope): string {
    if (env.salt !== this.salt || env.N !== this.params.N || env.r !== this.params.r || env.p !== this.params.p) throw new VaultError('wrong-passphrase', 'This file was encrypted with a different passphrase');
    try {
      return fromUtf8(xchacha20poly1305(this.key, fromBase64(env.nonce), aad(env)).decrypt(fromBase64(env.ct)));
    } catch {
      throw new VaultError('wrong-passphrase', 'Wrong passphrase, or the data was changed');
    }
  }
}

// --- backups -----------------------------------------------------------------

export interface Backup {
  app: 'eatos';
  format: 1;
  exportedAt: number;
  events: EatEvent[];
}

export function makeBackup(events: EatEvent[], now: number): Backup {
  return { app: 'eatos', format: 1, exportedAt: now, events };
}

/** A passphrase-protected backup as JSON text. */
export async function encryptBackup(events: EatEvent[], passphrase: string, rb: RandomBytes, now: number, params: KdfParams = DEFAULT_KDF): Promise<string> {
  const vault = await Vault.create(passphrase, rb, params);
  return JSON.stringify(vault.seal(JSON.stringify(makeBackup(events, now)), rb));
}

export class BackupError extends Error {
  constructor(public code: 'needs-passphrase' | 'wrong-passphrase' | 'invalid', message: string) {
    super(message);
  }
}

const MAX_BACKUP_EVENTS = 500_000;

function validateBackup(raw: unknown): EatEvent[] {
  const b = raw as Partial<Backup> | null;
  if (!b || b.app !== 'eatos' || b.format !== 1 || !Array.isArray(b.events)) throw new BackupError('invalid', 'This is not an EatOS backup');
  if (b.events.length > MAX_BACKUP_EVENTS) throw new BackupError('invalid', 'This backup is too large');
  for (const e of b.events) {
    const problem = eventProblem(e);
    if (problem) throw new BackupError('invalid', `The backup contains a broken event: ${problem}`);
  }
  return (b.events as EatEvent[]).map(withId);
}

/** Reads a plain or encrypted backup. Encrypted ones need the passphrase. */
export async function readBackup(text: string, passphrase?: string): Promise<EatEvent[]> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new BackupError('invalid', 'That file is not a backup');
  }
  if (Array.isArray(parsed)) return validateBackup({ app: 'eatos', format: 1, events: parsed }); // a bare event list, as exported by older versions
  if (isEnvelope(parsed)) {
    if (!passphrase) throw new BackupError('needs-passphrase', 'This backup is encrypted. Enter its passphrase.');
    try {
      const { data } = await Vault.unlock(parsed, passphrase);
      return validateBackup(JSON.parse(data));
    } catch (e) {
      if (e instanceof BackupError) throw e;
      throw new BackupError(e instanceof VaultError && e.code === 'invalid' ? 'invalid' : 'wrong-passphrase', e instanceof Error ? e.message : 'Could not open the backup');
    }
  }
  return validateBackup(parsed);
}
