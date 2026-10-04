import { describe, expect, it } from 'vitest';
import { emptyState, reduce, replay, makeProfile, makeMember } from '../src';
import { DAY0, item } from './helpers';

describe('event log', () => {
  it('derives the same state from a replay as from step-by-step reduction', () => {
    const events = [
      { type: 'profile.set', at: DAY0, profile: makeProfile() } as const,
      item('spinach', 1),
      { type: 'pantry.used', at: DAY0 + 10, itemId: 'p-spinach' } as const,
      { type: 'member.added', at: DAY0 + 20, member: makeMember({ id: 'kid', name: 'Kid' }) } as const,
    ];
    const stepwise = events.reduce(reduce, emptyState());
    const replayed = replay([...events].reverse());
    expect(replayed.pantry).toEqual(stepwise.pantry);
    expect(replayed.profile?.members.map((m) => m.id)).toEqual(['me', 'kid']);
    expect(replayed.pantry['p-spinach']).toBeUndefined();
  });

  it('tracks safe mode from illness events', () => {
    let s = reduce(emptyState(), { type: 'illness.started', at: 5 });
    expect(s.safeModeSince).toBe(5);
    s = reduce(s, { type: 'illness.ended', at: 9 });
    expect(s.safeModeSince).toBeUndefined();
  });

  it('partially uses pantry items', () => {
    let s = reduce(emptyState(), item('eggs', 5, { qty: 12 }));
    s = reduce(s, { type: 'pantry.used', at: DAY0, itemId: 'p-eggs', qty: 4 });
    expect(s.pantry['p-eggs']?.qty).toBe(8);
  });
});
