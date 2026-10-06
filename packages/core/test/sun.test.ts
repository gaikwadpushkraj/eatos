import { describe, expect, it } from 'vitest';
import { Kernel } from '../src/kernel';
import { makeMember, makeProfile } from '../src/defaults';
import { clock } from '../src/time';
import { sunTimes, suhoorEnds } from '../src/sun';

const IST = 330;
const day = Date.UTC(2026, 9, 14, 0, 0) - IST * 60_000;

describe('sunrise and sunset', () => {
  it('matches known values within a few minutes', () => {
    // Mumbai, mid October: sunrise about 06:36, sunset about 18:10.
    const m = sunTimes(day + 12 * 3_600_000, IST, 'mumbai');
    expect(clock(m.sunrise, IST) >= '06:30' && clock(m.sunrise, IST) <= '06:45').toBe(true);
    expect(clock(m.sunset, IST) >= '18:03' && clock(m.sunset, IST) <= '18:20').toBe(true);
    // Delhi has the earlier winter sunset.
    const d = sunTimes(Date.UTC(2026, 11, 21, 6) - IST * 60_000, IST, 'delhi');
    expect(clock(d.sunset, IST) >= '17:20' && clock(d.sunset, IST) <= '17:35').toBe(true);
    expect(suhoorEnds(m)).toBeLessThan(m.sunrise);
  });
});

describe('sun-shaped days', () => {
  const k = (member: Partial<ReturnType<typeof makeMember>>) => {
    const kernel = new Kernel();
    kernel.submit({ type: 'profile.set', at: day - 86_400_000, profile: makeProfile({ members: [makeMember({ id: 'me', name: 'You', ...member })], tzOffsetMin: IST, city: 'mumbai' }) });
    return kernel;
  };
  it('Ramzan: suhoor before dawn, iftar at sunset, no lunch, water only in the evening and before dawn', () => {
    const kernel = k({ diet: 'omnivore' });
    kernel.submit({ type: 'fasting.set', at: day + 3_600_000, kind: 'ramzan' });
    const tasks = kernel.schedule(day + 5 * 3_600_000);
    const sun = sunTimes(day + 12 * 3_600_000, IST, 'mumbai');
    expect(tasks.find((t) => t.id === 'meal:lunch')).toBeUndefined();
    expect(tasks.find((t) => t.id === 'meal:dinner')!.title).toBe('Iftar');
    expect(tasks.find((t) => t.id === 'meal:dinner')!.at).toBe(sun.sunset);
    expect(tasks.find((t) => t.id === 'meal:breakfast')!.title).toBe('Suhoor');
    expect(tasks.find((t) => t.id === 'meal:breakfast')!.at).toBeLessThan(sun.sunrise);
    for (const w of tasks.filter((t) => t.kind === 'hydration')) expect(w.at < suhoorEnds(sun) || w.at >= sun.sunset).toBe(true);
  });
  it('Ramzan is not planned for someone on insulin', () => {
    const kernel = k({ diet: 'omnivore', conditions: ['insulin'] });
    kernel.submit({ type: 'fasting.set', at: day + 3_600_000, kind: 'ramzan' });
    const tasks = kernel.schedule(day + 5 * 3_600_000);
    expect(tasks.find((t) => t.id === 'meal:lunch')).toBeDefined();
    expect(tasks.find((t) => t.id === 'meal:dinner')!.title).toBe('Dinner');
  });
  it('before-sunset households have dinner in daylight', () => {
    const kernel = k({ diet: 'vegetarian', rules: ['jain', 'before-sunset'] });
    const tasks = kernel.schedule(day + 5 * 3_600_000);
    const sun = sunTimes(day + 12 * 3_600_000, IST, 'mumbai');
    const dinner = tasks.find((t) => t.id === 'meal:dinner')!;
    expect(dinner.at).toBeLessThanOrEqual(sun.sunset - 29 * 60_000);
    expect(dinner.reasons.join(' ')).toMatch(/Before sunset/);
  });
});
