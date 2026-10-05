import { mkdirSync, readFileSync, writeFileSync, existsSync, renameSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { Kernel, serveSync } from '@eatos/core';
import type { EatEvent, SyncRequest, SyncResponse } from '@eatos/core';

const USER_ID = /^[a-zA-Z0-9_-]{1,64}$/;

export function validUserId(id: string): boolean {
  return USER_ID.test(id);
}

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
}

/** One kernel per user, backed by an append-only JSON event log on disk. */
export class Store {
  private users = new Map<string, Entry>();

  constructor(private dir: string) {
    mkdirSync(dir, { recursive: true });
  }

  private file(userId: string) {
    return join(this.dir, `${userId}.json`);
  }

  private entry(userId: string): Entry {
    if (!validUserId(userId)) throw new Error('invalid user id');
    let entry = this.users.get(userId);
    if (!entry) {
      const path = this.file(userId);
      const raw: unknown = existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : null;
      // Older files were a bare array of events.
      const log: UserLog = Array.isArray(raw) ? { epoch: randomUUID(), events: raw } : ((raw as UserLog | null) ?? { epoch: randomUUID(), events: [] });
      const kernel = new Kernel({ events: log.events });
      // The kernel gives id-less events stable ids; keep the log in step.
      log.events = [...kernel.events];
      const created: Entry = { kernel, log, ids: new Set(log.events.map((e) => e.id!)) };
      kernel.setListener((e) => {
        if (created.ids.has(e.id!)) return;
        created.ids.add(e.id!);
        created.log.events.push(e);
        this.save(userId);
      });
      entry = created;
      this.users.set(userId, entry);
    }
    return entry;
  }

  kernel(userId: string): Kernel {
    return this.entry(userId).kernel;
  }

  private save(userId: string) {
    const entry = this.users.get(userId);
    if (!entry) return;
    const path = this.file(userId);
    const tmp = `${path}.tmp`;
    writeFileSync(tmp, JSON.stringify(entry.log));
    renameSync(tmp, path);
  }

  /** Device sync: append what the device sent, return what it lacks. */
  sync(userId: string, req: SyncRequest): SyncResponse {
    const entry = this.entry(userId);
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
  compacted(userId: string) {
    const entry = this.entry(userId);
    entry.log = { epoch: randomUUID(), events: [...entry.kernel.events] };
    entry.ids = new Set(entry.log.events.map((e) => e.id!));
    this.save(userId);
  }
}
