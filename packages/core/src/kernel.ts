import type { EatEvent, Food, Task } from './types';
import type { State } from './state';
import { emptyState, reduce, replay, selfMember } from './state';
import { CATALOG, foodById } from './catalog';
import { buildSchedule, nextMeal, nextTask } from './scheduler';
import { biggestGap, healthChecks, targets } from './health';
import type { HealthCheck } from './health';
import { recommend } from './recommend';
import type { Query, Recommendation } from './recommend';
import { parseAsk } from './ask';
import { compact, housekeeping, pantryView } from './housekeeping';
import { fitMatrix, resolveRequest } from './household';
import { explainToday } from './explain';
import { groceryList, planWeek } from './plan';
import { newId } from './time';

export interface NowView {
  next?: Task;
  nextMeal?: Task;
  suggestion?: Recommendation;
  checks: HealthCheck[];
  safeMode: boolean;
  /** One-line system status. */
  status: string;
}

export interface KernelOptions {
  events?: EatEvent[];
  catalog?: Food[];
  /** Called after every accepted event, e.g. to persist the log. */
  onEvent?: (event: EatEvent, state: State) => void;
}

/**
 * The EatOS kernel. Shells talk to it only through these syscalls, so the
 * web app, mobile app and API server behave the same.
 */
export class Kernel {
  readonly catalog: Food[];
  private s: State;
  private onEvent?: KernelOptions['onEvent'];

  constructor(opts: KernelOptions = {}) {
    this.catalog = opts.catalog ?? CATALOG;
    this.s = opts.events ? replay(opts.events) : emptyState();
    this.onEvent = opts.onEvent;
  }

  get state(): State {
    return this.s;
  }

  get events(): EatEvent[] {
    return this.s.events;
  }

  /** syscall: record something that happened. */
  submit(event: EatEvent): EatEvent {
    const e = { ...event, id: event.id ?? newId('ev') } as EatEvent;
    this.s = reduce(this.s, e);
    this.onEvent?.(e, this.s);
    return e;
  }

  schedule(now: number): Task[] {
    return buildSchedule(this.s, this.catalog, now);
  }

  next(now: number): Task | undefined {
    return nextTask(this.schedule(now), now);
  }

  health(now: number): HealthCheck[] {
    return healthChecks(this.s, this.catalog, now);
  }

  targets(now: number) {
    return targets(this.s, now);
  }

  recommend(q: Query, now: number): Recommendation[] {
    return recommend(this.s, this.catalog, q, now);
  }

  ask(text: string, now: number) {
    const parsed = parseAsk(text, this.s.profile?.selfId);
    const gap = biggestGap(this.health(now));
    const query: Query = { k: 3, ...parsed.query };
    if (!query.need && gap) query.need = gap.key as Query['need'];
    return { ...parsed, query, results: this.recommend(query, now) };
  }

  /** Everything the "Now" screen needs in one call. */
  now(now: number): NowView {
    const tasks = this.schedule(now);
    const checks = this.health(now);
    const meal = nextMeal(tasks, now);
    const gap = biggestGap(checks);
    const suggestion = meal
      ? this.recommend({ slot: meal.slot, need: meal.light ? meal.need : gap ? (gap.key as Query['need']) : meal.need, light: meal.light, k: 1 }, now)[0]
      : undefined;
    const safeMode = this.s.safeModeSince !== undefined;
    const critical = checks.some((c) => c.status === 'critical');
    const status = safeMode ? 'Safe mode' : critical ? 'Needs attention' : gap ? 'Slightly behind' : 'System steady';
    return { next: nextTask(tasks, now), nextMeal: meal, suggestion, checks, safeMode, status };
  }

  pantry(now: number) {
    return pantryView(this.s, now);
  }

  /** Runs garbage collection and submits the resulting events. */
  housekeep(now: number) {
    const result = housekeeping(this.s, now);
    for (const e of result.events) this.submit(e);
    return result;
  }

  compact(now: number, keepDays = 90): void {
    this.s = compact(this.s, now, keepDays);
  }

  household() {
    const members = this.s.profile?.members ?? [];
    return { members, matrix: (foods: Food[]) => fitMatrix(foods, members) };
  }

  resolve(foodId: string) {
    const food = foodById(this.catalog, foodId);
    if (!food) return undefined;
    return resolveRequest(food, this.s.profile?.members ?? [], this.catalog);
  }

  week(from: number, days = 7) {
    const plan = planWeek(this.s, this.catalog, from, days);
    return { plan, grocery: groceryList(this.s, plan, from) };
  }

  log(now: number) {
    return explainToday(this.s, this.catalog, now);
  }

  me() {
    return selfMember(this.s);
  }
}
