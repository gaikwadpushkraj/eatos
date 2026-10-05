import { describe, expect, it } from 'vitest';
import { compareTasks, makeProfile, DEFAULT_ROUTINE, hm } from '../src';
import type { Task } from '../src';
import { kernelWith, T } from './helpers';

const byId = (tasks: Task[], id: string) => tasks.find((t) => t.id === id)!;

describe('scheduled tasks', () => {
  it('builds meals, hydration and wind down from the routine', () => {
    const tasks = kernelWith().schedule(T('06:00'));
    expect(tasks.filter((t) => t.kind === 'meal').map((t) => t.slot)).toEqual(['breakfast', 'lunch', 'snack', 'dinner']);
    expect(tasks.some((t) => t.kind === 'hydration')).toBe(true);
    expect(byId(tasks, 'routine:wind-down')).toBeDefined();
    expect(tasks.map((t) => t.at)).toEqual([...tasks.map((t) => t.at)].sort((a, b) => a - b));
  });

  it('adds P0 medication tasks with a 30 minute deadline', () => {
    const profile = makeProfile({ routine: { ...DEFAULT_ROUTINE, medication: [{ name: 'Metformin', slot: 'breakfast' }] } });
    const med = byId(kernelWith([], profile).schedule(T('06:00')), 'med:Metformin');
    expect(med.priority).toBe(0);
    expect(med.deadline - med.at).toBe(30 * 60_000);
  });
});

describe('event interrupts', () => {
  it('moves dinner after a meeting that overlaps it', () => {
    const k = kernelWith([{ type: 'calendar.busy', at: T('15:40'), start: T('18:00'), end: T('19:00'), title: 'Team meeting' }]);
    const dinner = byId(k.schedule(T('16:00')), 'meal:dinner');
    expect(dinner.at).toBe(T('19:30'));
    expect(dinner.movedFrom).toBe(T('18:30'));
    expect(dinner.reasons[0]).toMatch(/Moved from 18:30/);
  });

  it('adds a recovery snack after a long workout when no meal is near', () => {
    const k = kernelWith([{ type: 'workout.completed', at: T('10:00'), minutes: 50, intensity: 'moderate' }]);
    const tasks = k.schedule(T('10:05'));
    const rec = tasks.find((t) => t.id.startsWith('recovery'));
    expect(rec?.priority).toBe(2);
    expect(rec?.at).toBe(T('10:30'));
  });

  it('does not add a recovery snack when a main meal is close', () => {
    const k = kernelWith([{ type: 'workout.completed', at: T('12:00'), minutes: 60, intensity: 'high' }]);
    expect(k.schedule(T('12:05')).some((t) => t.id.startsWith('recovery'))).toBe(false);
  });

  it('safe mode drops the snack, softens meals and makes fluids P0', () => {
    const k = kernelWith([{ type: 'illness.started', at: T('07:00') }]);
    const tasks = k.schedule(T('09:00'));
    expect(tasks.some((t) => t.slot === 'snack')).toBe(false);
    expect(byId(tasks, 'meal:lunch').title).toBe('Gentle lunch');
    expect(tasks.filter((t) => t.kind === 'hydration').every((t) => t.priority === 0)).toBe(true);
  });

  it('short sleep raises the wind down priority', () => {
    const k = kernelWith([{ type: 'sleep.logged', at: T('07:00'), hours: 5.5 }]);
    expect(byId(k.schedule(T('08:00')), 'routine:wind-down').priority).toBe(2);
  });
});

describe('priority inversion', () => {
  it('a snack 90 min before dinner inherits its priority and is kept light', () => {
    const snack = byId(kernelWith().schedule(T('12:00')), 'meal:snack');
    // default snack 17:00, dinner 18:30
    expect(snack.priority).toBe(1);
    expect(snack.light).toBe(true);
    expect(snack.reasons.join()).toMatch(/Kept light so dinner at 18:30/);
  });

  it('a snack within 45 minutes of a meal is folded into it', () => {
    const profile = makeProfile({ routine: { ...DEFAULT_ROUTINE, meals: { ...DEFAULT_ROUTINE.meals, snack: hm('18:00') } } });
    const snack = byId(kernelWith([], profile).schedule(T('12:00')), 'meal:snack');
    expect(snack.state).toBe('deferred');
  });

  it('a snack far from any meal stays P3', () => {
    const profile = makeProfile({ routine: { ...DEFAULT_ROUTINE, meals: { ...DEFAULT_ROUTINE.meals, snack: hm('16:00'), dinner: hm('19:30') } } });
    const snack = byId(kernelWith([], profile).schedule(T('12:00')), 'meal:snack');
    expect(snack.priority).toBe(3);
    expect(snack.light).toBeUndefined();
  });
});

describe('progress and re-prioritisation', () => {
  it('marks meals done when intake is logged for the slot', () => {
    const k = kernelWith([{ type: 'intake.logged', at: T('08:10'), slot: 'breakfast', foodId: 'oats-banana' }]);
    expect(byId(k.schedule(T('09:00')), 'meal:breakfast').state).toBe('done');
  });

  it('marks hydration done once enough water is logged', () => {
    const k = kernelWith([{ type: 'water.logged', at: T('08:00'), ml: 1000 }]);
    expect(byId(k.schedule(T('09:00')), 'water:0').state).toBe('done');
  });

  it('activates the highest-priority due task, earliest deadline first', () => {
    const profile = makeProfile({ routine: { ...DEFAULT_ROUTINE, medication: [{ name: 'Pill', slot: 'breakfast' }] } });
    const tasks = kernelWith([], profile).schedule(T('08:05'));
    const active = tasks.filter((t) => t.state === 'active');
    expect(active).toHaveLength(1);
    expect(active[0]!.id).toBe('med:Pill');
  });

  it('orders by priority class then deadline', () => {
    const a = { priority: 1, deadline: 10, at: 0 } as Task;
    const b = { priority: 0, deadline: 99, at: 0 } as Task;
    const c = { priority: 1, deadline: 5, at: 0 } as Task;
    expect([a, b, c].sort(compareTasks)).toEqual([b, c, a]);
  });

  it('flags overdue tasks', () => {
    const tasks = kernelWith().schedule(T('11:00'));
    expect(byId(tasks, 'meal:breakfast').overdue).toBe(true);
  });
});

describe('missed tasks', () => {
  it('a meal past its window is missed, not active', () => {
    const tasks = kernelWith().schedule(T('19:00'));
    expect(byId(tasks, 'meal:breakfast').state).toBe('skipped');
    expect(byId(tasks, 'meal:breakfast').reasons.join()).toMatch(/Missed/);
    expect(tasks.find((t) => t.state === 'active')?.kind).not.toBe('meal');
  });

  it('missed medication stays active until taken', () => {
    const profile = makeProfile({ routine: { ...DEFAULT_ROUTINE, medication: [{ name: 'Pill', slot: 'breakfast' }] } });
    const med = byId(kernelWith([], profile).schedule(T('12:00')), 'med:Pill');
    expect(med.state).toBe('active');
    expect(med.overdue).toBe(true);
  });

  it('never asks for more than 500 ml of water at once', () => {
    const tasks = kernelWith().schedule(T('19:00'));
    for (const t of tasks.filter((x) => x.kind === 'hydration' && x.state !== 'done')) {
      expect(Number(t.title.match(/(\d+) ml/)![1])).toBeLessThanOrEqual(500);
    }
  });
});
