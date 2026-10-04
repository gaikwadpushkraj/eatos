import { mkdirSync, readFileSync, writeFileSync, existsSync, renameSync } from 'node:fs';
import { join } from 'node:path';
import { Kernel } from '@eatos/core';
import type { EatEvent } from '@eatos/core';

const USER_ID = /^[a-zA-Z0-9_-]{1,64}$/;

export function validUserId(id: string): boolean {
  return USER_ID.test(id);
}

/** One kernel per user, backed by an append-only JSON event log on disk. */
export class Store {
  private kernels = new Map<string, Kernel>();

  constructor(private dir: string) {
    mkdirSync(dir, { recursive: true });
  }

  private file(userId: string) {
    return join(this.dir, `${userId}.json`);
  }

  kernel(userId: string): Kernel {
    if (!validUserId(userId)) throw new Error('invalid user id');
    let k = this.kernels.get(userId);
    if (!k) {
      const path = this.file(userId);
      const events: EatEvent[] = existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : [];
      k = new Kernel({ events, onEvent: (_e, s) => this.save(userId, s.events) });
      this.kernels.set(userId, k);
    }
    return k;
  }

  private save(userId: string, events: EatEvent[]) {
    const path = this.file(userId);
    const tmp = `${path}.tmp`;
    writeFileSync(tmp, JSON.stringify(events));
    renameSync(tmp, path);
  }

  /** Persist after operations that replace state (compaction). */
  flush(userId: string) {
    const k = this.kernels.get(userId);
    if (k) this.save(userId, k.events);
  }
}
