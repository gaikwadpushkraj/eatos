import { createServer } from 'node:http';
import type { IncomingMessage, Server, ServerResponse } from 'node:http';
import type { EatEvent, Query, SyncRequest } from '@eatos/core';
import { makeBackup } from '@eatos/core';
import { Store, StoreLockedError, validUserId } from './store';
import type { StoreOptions } from './store';

const EVENT_TYPES = new Set<EatEvent['type']>([
  'profile.set', 'member.added', 'member.removed', 'intake.logged', 'water.logged', 'workout.completed',
  'sleep.logged', 'calendar.busy', 'illness.started', 'illness.ended', 'pantry.added', 'pantry.used',
  'pantry.removed', 'feedback', 'task.done', 'task.skipped', 'medication.taken',
]);

const MAX_BODY = 1_000_000;

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function readJson(req: IncomingMessage): Promise<unknown> {
  let size = 0;
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > MAX_BODY) throw new HttpError(413, 'body too large');
    chunks.push(chunk as Buffer);
  }
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new HttpError(400, 'invalid JSON');
  }
}

function send(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, {
    'content-type': 'application/json',
    'access-control-allow-origin': '*',
    'access-control-allow-headers': 'content-type, x-user-id',
    'access-control-allow-methods': 'GET, POST, DELETE, OPTIONS',
  });
  res.end(JSON.stringify(body));
}

function validateEvent(raw: unknown, now: number): EatEvent {
  if (!raw || typeof raw !== 'object') throw new HttpError(400, 'event must be an object');
  const e = raw as Record<string, unknown>;
  if (typeof e.type !== 'string' || !EVENT_TYPES.has(e.type as EatEvent['type'])) throw new HttpError(400, `unknown event type: ${String(e.type)}`);
  if (e.at !== undefined && typeof e.at !== 'number') throw new HttpError(400, 'at must be epoch ms');
  return { ...e, at: (e.at as number | undefined) ?? now } as EatEvent;
}

export interface ServerOptions extends StoreOptions {
  dataDir: string;
  /** Injectable clock for tests. */
  clock?: () => number;
}

/**
 * The EatOS API. Every route is a kernel syscall. The user is chosen by
 * the `x-user-id` header (auth is out of scope for the local server).
 */
export function createApi({ dataDir, clock = Date.now, dataKey, kdf }: ServerOptions): Server {
  const store = new Store(dataDir, { dataKey, kdf });

  return createServer(async (req, res) => {
    try {
      if (req.method === 'OPTIONS') return send(res, 204, {});
      const url = new URL(req.url ?? '/', 'http://local');
      if (url.pathname === '/v1/health-check' || url.pathname === '/') return send(res, 200, { ok: true, name: 'eatos-api' });

      const userId = String(req.headers['x-user-id'] ?? 'me');
      if (!validUserId(userId)) throw new HttpError(400, 'invalid x-user-id');
      const k = await store.kernel(userId);
      const nowParam = url.searchParams.get('now');
      const now = nowParam ? Number(nowParam) : clock();
      if (!Number.isFinite(now)) throw new HttpError(400, 'now must be epoch ms');
      const route = `${req.method} ${url.pathname}`;

      switch (route) {
        case 'POST /v1/events': {
          const body = await readJson(req);
          const list = Array.isArray(body) ? body : [body];
          const accepted = list.map((raw) => k.submit(validateEvent(raw, now)));
          return send(res, 201, { accepted });
        }
        case 'GET /v1/events':
          return send(res, 200, { events: k.events });
        case 'GET /v1/state':
          return send(res, 200, { profile: k.state.profile ?? null, pantry: k.pantry(now), safeMode: k.state.safeModeSince !== undefined });
        case 'GET /v1/now':
          return send(res, 200, k.now(now));
        case 'GET /v1/next':
          return send(res, 200, { task: k.next(now) ?? null });
        case 'GET /v1/schedule':
          return send(res, 200, { tasks: k.schedule(now) });
        case 'GET /v1/health':
          return send(res, 200, { checks: k.health(now), targets: k.targets(now) });
        case 'POST /v1/recommend': {
          const q = (await readJson(req)) as Query;
          return send(res, 200, { results: k.recommend(q, now) });
        }
        case 'POST /v1/ask': {
          const body = (await readJson(req)) as { text?: unknown };
          if (typeof body.text !== 'string' || !body.text.trim()) throw new HttpError(400, 'text is required');
          return send(res, 200, k.ask(body.text, now));
        }
        case 'GET /v1/pantry':
          return send(res, 200, { items: k.pantry(now) });
        case 'POST /v1/housekeeping': {
          const result = k.housekeep(now);
          k.compact(now);
          await store.compacted(userId);
          return send(res, 200, result);
        }
        case 'GET /v1/week':
          return send(res, 200, k.week(now));
        case 'GET /v1/log':
          return send(res, 200, { lines: k.log(now) });
        case 'GET /v1/resolve': {
          const food = url.searchParams.get('food') ?? '';
          const r = k.resolve(food);
          if (!r) throw new HttpError(404, `unknown food: ${food}`);
          return send(res, 200, r);
        }
        case 'POST /v1/sync': {
          const body = (await readJson(req)) as Partial<SyncRequest>;
          const since = body.since ?? 0;
          if (typeof since !== 'number' || !Number.isInteger(since)) throw new HttpError(400, 'since must be an integer');
          if (body.epoch !== undefined && typeof body.epoch !== 'string') throw new HttpError(400, 'epoch must be a string');
          const raw = Array.isArray(body.events) ? body.events : [];
          const events = raw.map((e) => {
            const ev = validateEvent(e, now);
            if (typeof ev.id !== 'string' || !ev.id) throw new HttpError(400, 'synced events need an id');
            return ev;
          });
          return send(res, 200, await store.sync(userId, { since, epoch: body.epoch, events }));
        }
        case 'GET /v1/export':
          return send(res, 200, makeBackup(k.events, now));
        case 'DELETE /v1/data':
          return send(res, 200, { deleted: await store.delete(userId) });
        case 'GET /v1/catalog':
          return send(res, 200, { foods: k.catalog });
        default:
          throw new HttpError(404, `no route ${route}`);
      }
    } catch (err) {
      if (err instanceof HttpError) return send(res, err.status, { error: err.message });
      if (err instanceof StoreLockedError) return send(res, 503, { error: err.message });
      return send(res, 500, { error: 'internal error' });
    }
  });
}
