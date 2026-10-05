import { mkdirSync, readFileSync, writeFileSync, existsSync, renameSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { randomBytes, randomUUID } from 'node:crypto';
import { DEFAULT_KDF, Kernel, Vault, isEnvelope, serveSync } from '@eatos/core';
import type { EatEvent, KdfParams, SyncRequest, SyncResponse } from '@eatos/core';

const USER_ID = /^[a-zA-Z0-9_-]{1,64}$/;

export function validUserId(id: string): boolean {
  return USER_ID.test(id);
}

/** Thrown when a user's file is encrypted and no key was configured (or it is wrong). */
export class StoreLockedError extends Error {}

interface UserLog {
  /** Changes when the log is compacted, so devices know to resync fully. */
  epoch: string;
  /** Events in arrival order; position = sequence number. */
  events: EatEvent[];
}

interface Entry {
  kernel: Kernel;
  log: UserLog;
  /** Ids already in the log, so merged events are not appended twice. */
  ids: Set<string>;
  /** Present when files are encrypted at rest. */
  vault?: Vault;
}

export interface StoreOptions {
  /** Secret that encrypts every user's file at rest. Without it files are plain JSON. */
  dataKey?: string;
  /** Key-derivation cost; tests lower it. */
  kdf?: KdfParams;
}

const rb = (n: number) => new Uint8Array(randomBytes(n));

/** One kernel per user, backed by an append-only JSON event log on disk, optionally encrypted. */
export class Store {
  private users = new Map<string, Entry>();
  private loading = new Map<string, Promise<Entry>>();

  constructor(
    private dir: string,
    private opts: StoreOptions = {},
  ) {
    mkdirSync(dir, { recursive: true });
  }

  private file(userId: string) {
    return join(this.dir, `${userId}.json`);
  }

  private async load(userId: string): Promise<Entry> {
    const path = this.file(userId);
    const raw: unknown = existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : null;
    let vault: Vault | undefined;
    let body: unknown = raw;
    if (isEnvelope(raw)) {
      if (!this.opts.dataKey) throw new StoreLockedError('This data is encrypted. Set EATOS_DATA_KEY to read it.');
      try {
        const unlocked = await Vault.unlock(raw, this.opts.dataKey);
        vault = unlocked.vault;
        body = JSON.parse(unlocked.data);
      } catch {
        throw new StoreLockedError('EATOS_DATA_KEY does not open this data.');
      }
    } else if (this.opts.dataKey) {
      vault = await Vault.create(this.opts.dataKey, rb, this.opts.kdf ?? DEFAULT_KDF);
    }
    // Older files were a bare array of events.
    const log: UserLog = Array.isArray(body) ? { epoch: randomUUID(), events: body } : ((body as UserLog | null) ?? { epoch: randomUUID(), events: [] });
    const kernel = new Kernel({ events: log.events });
    // The kernel gives id-less events stable ids; keep the log in step.
    log.events = [...kernel.events];
    const entry: Entry = { kernel, log, ids: new Set(log.events.map((e) => e.id!)), vault };
    kernel.setListener((e) => {
      if (entry.ids.has(e.id!)) return;
      entry.ids.add(e.id!);
      entry.log.events.push(e);
      this.save(userId);
    });
    // Encrypt a plain legacy file as soon as a key is configured.
    if (vault && raw && !isEnvelope(raw)) {
      this.users.set(userId, entry);
      this.save(userId);
    }
    return entry;
  }

  private entry(userId: string): Promise<Entry> {
    if (!validUserId(userId)) return Promise.reject(new Error('invalid user id'));
    const have = this.users.get(userId);
    if (have) return Promise.resolve(have);
    let p = this.loading.get(userId);
    if (!p) {
      p = this.load(userId)
        .then((e) => {
          this.users.set(userId, e);
          return e;
        })
        .finally(() => this.loading.delete(userId));
      this.loading.set(userId, p);
    }
    return p;
  }

  async kernel(userId: string): Promise<Kernel> {
    return (await this.entry(userId)).kernel;
  }

  private save(userId: string) {
    const entry = this.users.get(userId);
    if (!entry) return;
    const path = this.file(userId);
    const tmp = `${path}.tmp`;
    const json = JSON.stringify(entry.log);
    writeFileSync(tmp, entry.vault ? JSON.stringify(entry.vault.seal(json, rb)) : json, { mode: 0o600 });
    renameSync(tmp, path);
  }

  /** Device sync: append what the device sent, return what it lacks. */
  async sync(userId: string, req: SyncRequest): Promise<SyncResponse> {
    const entry = await this.entry(userId);
    const { log, res } = serveSync(entry.log.events, entry.log.epoch, req);
    const added = log.slice(entry.log.events.length);
    entry.log.events = log;
    for (const e of added) entry.ids.add(e.id!);
    if (added.length) {
      entry.kernel.merge(added);
      this.save(userId);
    }
    return res;
  }

  /** After compaction the log is rewritten under a new epoch. */
  async compacted(userId: string) {
    const entry = await this.entry(userId);
    entry.log = { epoch: randomUUID(), events: [...entry.kernel.events] };
    entry.ids = new Set(entry.log.events.map((e) => e.id!));
    this.save(userId);
  }

  /** Erases everything stored for a user. */
  async delete(userId: string): Promise<boolean> {
    if (!validUserId(userId)) throw new Error('invalid user id');
    this.users.delete(userId);
    const path = this.file(userId);
    const had = existsSync(path);
    rmSync(path, { force: true });
    rmSync(`${path}.tmp`, { force: true });
    return had;
  }
}
