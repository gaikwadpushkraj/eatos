import { describe, expect, it } from 'vitest';
import { parseAppleHealth, parseHealthCsv, parseHealthDate, intensityFor } from '../src';
import type { EatEvent } from '../src';
import { DAY0, kernelWith, T } from './helpers';

const xml = `<?xml version="1.0"?><HealthData>
<Workout workoutActivityType="HKWorkoutActivityTypeRunning" duration="45" durationUnit="min" startDate="2026-10-04 06:00:00 +0000" endDate="2026-10-04 06:45:00 +0000"/>
<Workout workoutActivityType="HKWorkoutActivityTypeYoga" duration="30" durationUnit="min" startDate="2026-10-04 18:00:00 +0000" endDate="2026-10-04 18:30:00 +0000"/>
<Record type="HKCategoryTypeIdentifierSleepAnalysis" value="HKCategoryValueSleepAnalysisInBed" startDate="2026-10-03 22:30:00 +0000" endDate="2026-10-04 06:30:00 +0000"/>
<Record type="HKCategoryTypeIdentifierSleepAnalysis" value="HKCategoryValueSleepAnalysisAsleepCore" startDate="2026-10-03 23:00:00 +0000" endDate="2026-10-04 02:00:00 +0000"/>
<Record type="HKCategoryTypeIdentifierSleepAnalysis" value="HKCategoryValueSleepAnalysisAsleepDeep" startDate="2026-10-04 02:10:00 +0000" endDate="2026-10-04 04:10:00 +0000"/>
<Record type="HKCategoryTypeIdentifierSleepAnalysis" value="HKCategoryValueSleepAnalysisAsleepREM" startDate="2026-10-04 04:20:00 +0000" endDate="2026-10-04 06:20:00 +0000"/>
<Record type="HKQuantityTypeIdentifierDietaryWater" unit="mL" value="250" startDate="2026-10-04 09:00:00 +0000" endDate="2026-10-04 09:00:00 +0000"/>
<Record type="HKQuantityTypeIdentifierDietaryWater" unit="L" value="0.5" startDate="2026-10-04 11:00:00 +0000" endDate="2026-10-04 11:00:00 +0000"/>
<Record type="HKQuantityTypeIdentifierStepCount" value="900" startDate="2026-10-04 09:00:00 +0000" endDate="2026-10-04 09:10:00 +0000"/>
</HealthData>`;

describe('apple health import', () => {
  it('reads workouts, one merged night of sleep and water, ignoring other records', () => {
    const events = parseAppleHealth(xml);
    expect(events.map((e) => e.type)).toEqual(['sleep.logged', 'workout.completed', 'water.logged', 'water.logged', 'workout.completed']);
    const sleep = events[0] as Extract<EatEvent, { type: 'sleep.logged' }>;
    expect(sleep.hours).toBe(7); // 3h + 2h + 2h of actual sleep stages; in-bed time is ignored
    expect(sleep.at).toBe(T('06:20'));
    const run = events[1] as Extract<EatEvent, { type: 'workout.completed' }>;
    expect(run).toMatchObject({ minutes: 45, intensity: 'high', at: T('06:45') });
    expect((events[4] as Extract<EatEvent, { type: 'workout.completed' }>).intensity).toBe('low');
    expect((events[3] as Extract<EatEvent, { type: 'water.logged' }>).ml).toBe(500);
  });

  it('honours time zones and the import window', () => {
    expect(parseHealthDate('2026-10-04 07:00:00 +0530')).toBe(Date.UTC(2026, 9, 4, 1, 30));
    expect(parseHealthDate('2026-10-04 07:00:00 -0400')).toBe(Date.UTC(2026, 9, 4, 11, 0));
    expect(parseAppleHealth(xml, { from: T('10:00') })).toHaveLength(2); // late water + yoga
    expect(parseAppleHealth(xml, { to: T('05:00') })).toHaveLength(0);
  });

  it('feeds the kernel: workout raises targets, sleep moves the wind down, re-import is a no-op', () => {
    const k = kernelWith();
    const before = k.targets(T('12:00')).proteinG;
    for (const e of parseAppleHealth(xml)) k.submit(e);
    const n = k.events.length;
    expect(k.targets(T('12:00')).proteinG).toBe(before + 20);
    k.merge(parseAppleHealth(xml));
    expect(k.events).toHaveLength(n);
    // 7 hours is enough sleep, so no early wind-down.
    expect(k.schedule(T('12:00')).find((t) => t.id === 'routine:wind-down')!.priority).toBe(3);
  });

  it('classifies intensity', () => {
    expect(intensityFor('HKWorkoutActivityTypeYoga', 90)).toBe('low');
    expect(intensityFor('HKWorkoutActivityTypeRunning', 20)).toBe('moderate');
    expect(intensityFor('HKWorkoutActivityTypeOther', 75)).toBe('high');
  });
});

describe('health csv import', () => {
  it('reads workouts, sleep and water, skipping bad rows', () => {
    const csv = `type,start,end,value,activity
workout,2026-10-04T07:00:00Z,2026-10-04T07:50:00Z,,running
sleep,2026-10-03T23:00:00Z,2026-10-04T05:30:00Z,
water,2026-10-04T09:00:00Z,2026-10-04T09:00:00Z,300
water,not-a-date,,300
steps,2026-10-04T09:00:00Z,,1000`;
    const events = parseHealthCsv(csv);
    expect(events.map((e) => e.type)).toEqual(['sleep.logged', 'workout.completed', 'water.logged']);
    expect((events[0] as Extract<EatEvent, { type: 'sleep.logged' }>).hours).toBe(6.5);
    expect((events[1] as Extract<EatEvent, { type: 'workout.completed' }>)).toMatchObject({ minutes: 50, intensity: 'high' });
    expect(events.every((e) => e.at >= DAY0)).toBe(true);
  });
});
