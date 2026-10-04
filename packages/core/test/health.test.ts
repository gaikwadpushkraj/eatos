import { describe, expect, it } from 'vitest';
import { makeMember, makeProfile } from '../src';
import { kernelWith, T } from './helpers';

const check = (k: ReturnType<typeof kernelWith>, now: number, key: string) => k.health(now).find((c) => c.key === key)!;

describe('health checks', () => {
  it('is ok early in the day', () => {
    expect(check(kernelWith(), T('07:30'), 'hydration').status).toBe('ok');
  });

  it('flags hydration behind or critical against the time-of-day curve', () => {
    const k = kernelWith([{ type: 'water.logged', at: T('09:00'), ml: 700 }]);
    expect(check(k, T('15:00'), 'hydration').status).toBe('critical');
    k.submit({ type: 'water.logged', at: T('14:00'), ml: 300 });
    expect(check(k, T('15:00'), 'hydration').status).toBe('behind');
  });

  it('raises protein and water targets after a workout', () => {
    const k = kernelWith();
    const before = k.targets(T('12:00'));
    k.submit({ type: 'workout.completed', at: T('11:00'), minutes: 60, intensity: 'moderate' });
    const after = k.targets(T('12:00'));
    expect(after.proteinG - before.proteinG).toBe(20);
    expect(after.waterMl - before.waterMl).toBe(500);
  });

  it('uses 1.2 g/kg protein for a more-protein goal', () => {
    const k = kernelWith([], makeProfile({ members: [makeMember({ id: 'me', name: 'You', weightKg: 80, goals: ['more-protein'] })] }));
    expect(k.targets(T('12:00')).proteinG).toBe(96);
  });

  it('pauses goals in safe mode but keeps hydration', () => {
    const k = kernelWith([{ type: 'illness.started', at: T('07:00') }]);
    expect(check(k, T('15:00'), 'protein').status).toBe('paused');
    expect(check(k, T('15:00'), 'hydration').status).not.toBe('paused');
  });

  it('safety floor goes critical when very little has been eaten late in the day', () => {
    const k = kernelWith([{ type: 'intake.logged', at: T('08:00'), nutrients: { kcal: 200 } }]);
    const floor = check(k, T('19:00'), 'energy-floor');
    expect(floor.status).toBe('critical');
    expect(floor.note).toMatch(/proper meal/);
  });
});

describe('missing data', () => {
  it('treats a day with no logs as unknown, not as eating nothing', () => {
    const k = kernelWith();
    const checks = k.health(T('19:00'));
    expect(checks.every((c) => c.status === 'ok')).toBe(true);
    expect(checks.find((c) => c.key === 'hydration')!.note).toMatch(/Nothing logged/);
    expect(k.now(T('19:00')).status).toBe('System steady');
  });
});
