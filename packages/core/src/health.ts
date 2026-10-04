import type { Food, Nutrients } from './types';
import type { State } from './state';
import { eventsToday, selfMember } from './state';
import { foodById } from './catalog';
import { clamp, minuteOfDay } from './time';

export type CheckStatus = 'ok' | 'behind' | 'critical' | 'paused';

export interface HealthCheck {
  key: 'hydration' | 'protein' | 'fibre' | 'energy-floor';
  label: string;
  actual: number;
  target: number;
  /** Amount expected by now, given time of day. */
  expected: number;
  unit: string;
  status: CheckStatus;
  note?: string;
}

export interface Targets {
  waterMl: number;
  proteinG: number;
  fibreG: number;
  floorKcal: number;
}

export const DEFAULT_WEIGHT_KG = 75;

/** Daily targets for the device owner, adjusted by today's events. */
export function targets(state: State, now: number): Targets {
  const me = selfMember(state);
  const weight = me?.weightKg ?? DEFAULT_WEIGHT_KG;
  const perKg = me?.goals.includes('more-protein') || me?.goals.includes('performance') ? 1.2 : 0.9;
  let waterMl = Math.round((weight * 33) / 100) * 100;
  let proteinG = Math.round(weight * perKg);
  for (const e of eventsToday(state, now)) {
    if (e.type === 'workout.completed') {
      waterMl += Math.round((e.minutes / 60) * 500);
      if (e.minutes >= 30 || e.intensity === 'high') proteinG += 20;
    }
  }
  return { waterMl, proteinG, fibreG: 30, floorKcal: state.profile?.floorKcal ?? 1200 };
}

/** Sum of today's intake for a member (default: device owner). */
export function intakeToday(state: State, catalog: Food[], now: number, memberId?: string): Nutrients {
  const who = memberId ?? state.profile?.selfId;
  const total: Nutrients = { kcal: 0, proteinG: 0, fibreG: 0, waterMl: 0 };
  for (const e of eventsToday(state, now)) {
    if (e.type === 'water.logged') total.waterMl += e.ml;
    if (e.type === 'intake.logged' && (e.memberId === undefined || e.memberId === who)) {
      const food = e.foodId ? foodById(catalog, e.foodId) : undefined;
      const n = { ...food?.nutrients, ...e.nutrients };
      total.kcal += n.kcal ?? 0;
      total.proteinG += n.proteinG ?? 0;
      total.fibreG += n.fibreG ?? 0;
      total.waterMl += n.waterMl ?? 0;
    }
  }
  return total;
}

/** Share of the waking day that has passed, 0..1. */
export function dayProgress(state: State, now: number): number {
  const r = state.profile?.routine;
  if (!r) return 0;
  const m = minuteOfDay(now, state.profile?.tzOffsetMin ?? 0);
  return clamp((m - r.wake) / (r.sleep - r.wake), 0, 1);
}

function status(actual: number, expected: number, progress: number): CheckStatus {
  if (progress < 0.1 || expected <= 0) return 'ok';
  const ratio = actual / expected;
  if (ratio >= 0.85) return 'ok';
  if (ratio >= 0.6) return 'behind';
  return 'critical';
}

/**
 * Watchdog checks. In safe mode only hydration and the energy floor are
 * checked; goals are paused so an ill person is never pushed.
 */
export function healthChecks(state: State, catalog: Food[], now: number): HealthCheck[] {
  const t = targets(state, now);
  const intake = intakeToday(state, catalog, now);
  const p = dayProgress(state, now);
  const safe = state.safeModeSince !== undefined;
  const make = (key: HealthCheck['key'], label: string, actual: number, target: number, unit: string): HealthCheck => {
    const expected = Math.round(target * p);
    return { key, label, actual, target, expected, unit, status: status(actual, expected, p) };
  };
  const checks: HealthCheck[] = [
    make('hydration', 'Hydration', intake.waterMl, t.waterMl, 'ml'),
    make('protein', 'Protein', intake.proteinG, t.proteinG, 'g'),
    make('fibre', 'Fibre', intake.fibreG, t.fibreG, 'g'),
  ];
  if (safe) {
    for (const c of checks) {
      if (c.key !== 'hydration') {
        c.status = 'paused';
        c.note = 'Paused while you recover';
      }
    }
  }
  // Safety floor: late in the day with very little eaten.
  const floor: HealthCheck = {
    key: 'energy-floor',
    label: 'Enough to eat',
    actual: intake.kcal,
    target: t.floorKcal,
    expected: Math.round(t.floorKcal * p),
    unit: 'kcal',
    status: 'ok',
  };
  if (p >= 0.6 && intake.kcal < t.floorKcal * p * 0.5) {
    floor.status = 'critical';
    floor.note = 'You have eaten very little today. A proper meal comes first.';
  }
  checks.push(floor);
  return checks;
}

/** Which nutrient gap is largest right now, used to steer the next meal. */
export function biggestGap(checks: HealthCheck[]): HealthCheck | undefined {
  return checks
    .filter((c) => c.key !== 'energy-floor' && c.status !== 'paused' && c.status !== 'ok')
    .sort((a, b) => a.actual / Math.max(1, a.expected) - b.actual / Math.max(1, b.expected))[0];
}
