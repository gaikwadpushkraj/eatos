import { describe, expect, it } from 'vitest';
import { BackupError, Kernel, Vault, VaultError, encryptBackup, fromBase64, fromUtf8, isEnvelope, readBackup, makeBackup, toBase64, utf8 } from '../src';
import type { Envelope, EatEvent } from '../src';
import { DAY0, household, kernelWith, T } from './helpers';

// Deterministic "randomness" so tests are repeatable; production code injects real randomness.
function seeded(seed = 1) {
  let s = seed;
  return (n: number) => Uint8Array.from({ length: n }, () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) >> 16) & 255);
}
const FAST = { N: 16, r: 8, p: 1 };

describe('encoding helpers', () => {
  it('round-trips base64 and utf8 for any length and character', () => {
    for (const n of [0, 1, 2, 3, 4, 31, 32, 33]) {
      const b = Uint8Array.from({ length: n }, (_, i) => (i * 37 + 11) & 255);
      expect(Array.from(fromBase64(toBase64(b)))).toEqual(Array.from(b));
    }
    expect(toBase64(utf8('hello'))).toBe('aGVsbG8=');
    for (const s of ['', 'plain', 'café', '日本語', 'emoji 🍲🥗', 'a\u0000b']) expect(fromUtf8(utf8(s))).toBe(s);
    expect(() => fromBase64('not base64!')).toThrow(VaultError);
  });
});

describe('vault', () => {
  it('encrypts and decrypts, with a fresh nonce on every save', async () => {
    const rb = seeded();
    const vault = await Vault.create('correct horse', rb, FAST);
    const a = vault.seal('secret meal log', rb);
    const b = vault.seal('secret meal log', rb);
    expect(a.ct).not.toBe(b.ct);
    expect(a.nonce).not.toBe(b.nonce);
    expect(JSON.stringify(a)).not.toContain('secret');
    expect(isEnvelope(a)).toBe(true);
    const { vault: again, data } = await Vault.unlock(a, 'correct horse');
    expect(data).toBe('secret meal log');
    expect(again.open(b)).toBe('secret meal log');
  });

  it('rejects a wrong passphrase and any tampering', async () => {
    const rb = seeded(2);
    const env = (await Vault.create('pw', rb, FAST)).seal('data', rb);
    await expect(Vault.unlock(env, 'nope')).rejects.toMatchObject({ code: 'wrong-passphrase' });
    const flipped: Envelope = { ...env, ct: toBase64(Uint8Array.from(fromBase64(env.ct), (x, i) => (i === 0 ? x ^ 1 : x))) };
    await expect(Vault.unlock(flipped, 'pw')).rejects.toMatchObject({ code: 'wrong-passphrase' });
    // Changing the key settings or salt changes the associated data and the key.
    await expect(Vault.unlock({ ...env, N: 32 }, 'pw')).rejects.toThrow();
    await expect(Vault.unlock({ ...env, salt: toBase64(seeded(9)(16)) }, 'pw')).rejects.toThrow();
  });

  it('refuses unsupported or absurd key settings before doing any work', async () => {
    const rb = seeded(3);
    const env = (await Vault.create('pw', rb, FAST)).seal('x', rb);
    for (const bad of [{ N: 3 }, { N: 2 ** 30 }, { r: 0 }, { p: 99 }]) await expect(Vault.unlock({ ...env, ...bad }, 'pw')).rejects.toMatchObject({ code: 'invalid' });
    await expect(Vault.unlock({ v: 2 } as never, 'pw')).rejects.toMatchObject({ code: 'invalid' });
    await expect(Vault.create('', rb, FAST)).rejects.toMatchObject({ code: 'invalid' });
  });

  it('treats equivalent unicode passphrases the same', async () => {
    const rb = seeded(4);
    const env = (await Vault.create('café', rb, FAST)).seal('x', rb);
    expect((await Vault.unlock(env, 'café')).data).toBe('x');
  });

  it('a vault from another passphrase cannot open an envelope', async () => {
    const rb = seeded(5);
    const a = await Vault.create('one', rb, FAST);
    const b = await Vault.create('two', rb, FAST);
    expect(() => b.open(a.seal('x', rb))).toThrow(VaultError);
  });
});

describe('backups', () => {
  const events: EatEvent[] = [{ type: 'water.logged', at: DAY0, ml: 300, id: 'w1' }, { type: 'sleep.logged', at: DAY0 + 5, hours: 7 } as EatEvent];

  it('round-trips an encrypted backup and requires the passphrase', async () => {
    const text = await encryptBackup(events, 'pw', seeded(6), DAY0, FAST);
    expect(text).not.toContain('water.logged');
    await expect(readBackup(text)).rejects.toMatchObject({ code: 'needs-passphrase' });
    await expect(readBackup(text, 'bad')).rejects.toMatchObject({ code: 'wrong-passphrase' });
    const back = await readBackup(text, 'pw');
    expect(back).toHaveLength(2);
    expect(back[1]!.id).toMatch(/^ev_h/); // id-less events get a stable id
  });

  it('reads plain backups and bare event lists, and rejects anything else', async () => {
    expect(await readBackup(JSON.stringify(makeBackup(events, DAY0)))).toHaveLength(2);
    expect(await readBackup(JSON.stringify(events))).toHaveLength(2);
    for (const bad of ['not json', '{}', JSON.stringify({ app: 'other', format: 1, events: [] }), JSON.stringify([{ type: 5 }]), JSON.stringify([null])]) {
      await expect(readBackup(bad)).rejects.toBeInstanceOf(BackupError);
    }
  });

  it('restoring into a fresh kernel reproduces the same schedule', async () => {
    const k = kernelWith([{ type: 'calendar.busy', at: T('09:00'), start: T('18:00'), end: T('19:00') }, { type: 'water.logged', at: T('09:30'), ml: 400 }], household());
    const text = await encryptBackup(k.events, 'pw', seeded(7), DAY0, FAST);
    const fresh = new Kernel();
    fresh.merge(await readBackup(text, 'pw'));
    expect(fresh.schedule(T('12:00'))).toEqual(k.schedule(T('12:00')));
  });
});
