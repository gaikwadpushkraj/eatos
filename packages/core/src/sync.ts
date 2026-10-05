import type { EatEvent } from './types';
import type { Kernel } from './kernel';

/**
 * Sync protocol between a device and the EatOS server.
 *
 * The server keeps each user's events in arrival order; an event's
 * position is its sequence number. A device remembers the server's
 * `cursor` (how many events it has seen) and which event ids the server
 * already has. Each round it sends what the server lacks and receives
 * everything after its cursor. When the server compacts its log it starts
 * a new `epoch`, and devices on an old epoch get the full log again.
 */
export interface SyncRequest {
  epoch?: string;
  since: number;
  events: EatEvent[];
}

export interface SyncResponse {
  epoch: string;
  cursor: number;
  /** Events after `since` (or the whole log on reset). */
  events: EatEvent[];
  /** True when the device's epoch or cursor was stale. */
  reset: boolean;
}

export interface SyncState {
  epoch?: string;
  cursor: number;
  /** Ids the server is known to have. */
  known: string[];
  lastSyncAt?: number;
}

export const emptySyncState = (): SyncState => ({ cursor: 0, known: [] });

/** Local events the server does not have yet. */
export function outgoing(kernel: Kernel, state: SyncState): EatEvent[] {
  const known = new Set(state.known);
  return kernel.events.filter((e) => e.id && !known.has(e.id));
}

export interface SyncResult {
  state: SyncState;
  sent: number;
  received: number;
}

/** One sync round over any transport (HTTP in the app, direct in tests). */
export async function syncOnce(
  kernel: Kernel,
  state: SyncState,
  transport: (req: SyncRequest) => Promise<SyncResponse>,
  now: number = Date.now(),
): Promise<SyncResult> {
  const events = outgoing(kernel, state);
  const res = await transport({ epoch: state.epoch, since: state.cursor, events });
  const added = kernel.merge(res.events);
  const known = new Set(state.known);
  for (const e of events) if (e.id) known.add(e.id);
  for (const e of res.events) if (e.id) known.add(e.id);
  return {
    state: { epoch: res.epoch, cursor: res.cursor, known: [...known], lastSyncAt: now },
    sent: events.length,
    received: added.length,
  };
}

/**
 * Server side of the protocol for one user's log. Pure: returns the new
 * log and the response, so storage stays the caller's concern.
 */
export function serveSync(log: EatEvent[], epoch: string, req: SyncRequest): { log: EatEvent[]; res: SyncResponse } {
  const have = new Set(log.map((e) => e.id));
  const appended = req.events.filter((e) => e.id && !have.has(e.id) && (have.add(e.id), true));
  const next = appended.length ? [...log, ...appended] : log;
  const reset = req.epoch !== epoch || req.since > log.length || req.since < 0;
  const since = reset ? 0 : req.since;
  // The device already has what it just sent, so leave those out.
  const sentIds = new Set(req.events.map((e) => e.id));
  const events = next.slice(since).filter((e) => !sentIds.has(e.id));
  return { log: next, res: { epoch, cursor: next.length, events, reset } };
}
