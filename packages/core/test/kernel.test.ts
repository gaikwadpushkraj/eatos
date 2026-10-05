import { describe, expect, it } from 'vitest';
import { Kernel, makeProfile } from '../src';
import type { EatEvent } from '../src';
import { DAY0, household, item, kernelWith, T } from './helpers';

describe('kernel syscalls', () => {
  it('assigns ids and notifies listeners', () => {
    const seen: EatEvent[] = [];
    const k = new Kernel({ onEvent: (e) => seen.push(e) });
    const e = k.submit({ type: 'profile.set', at: DAY0, profile: makeProfile() });
    expect(e.id).toBeTruthy();
    expect(seen).toHaveLength(1);
  });

  it('a new kernel from the same log has the same schedule', () => {
    const k = kernelWith([{ type: 'calendar.busy', at: T('09:00'), start: T('12:30'), end: T('13:30') }]);
    const copy = new Kernel({ events: k.events });
    expect(copy.schedule(T('10:00'))).toEqual(k.schedule(T('10:00')));
  });

  it('now() returns the next meal, a suggestion and status', () => {
    const k = kernelWith([item('spinach', 1), item('red lentils', 100)], household());
    const view = k.now(T('16:30'));
    expect(view.nextMeal?.slot).toBe('snack');
    expect(view.nextMeal?.light).toBe(true);
    expect(view.suggestion).toBeDefined();
    expect(view.suggestion!.food.allergens).not.toContain('nuts');
    expect(view.checks.length).toBe(4);
    expect(typeof view.status).toBe('string');
  });

  it('explains why the plan changed', () => {
    const k = kernelWith([
      { type: 'calendar.busy', at: T('15:40'), start: T('18:00'), end: T('19:00'), title: 'Meeting' },
      { type: 'workout.completed', at: T('11:05'), minutes: 45, intensity: 'moderate' },
      item('spinach', 1),
    ]);
    const log = k.log(T('16:00'));
    expect(log.map((l) => l.source)).toEqual(['Pantry', 'Calendar', 'Watch']);
  });

  it('resolve() substitutes for household conflicts', () => {
    const k = kernelWith([], household());
    expect(k.resolve('pesto-pasta')?.chosen.id).toBe('basil-pasta-nut-free');
    expect(k.resolve('nope')).toBeUndefined();
  });
});
