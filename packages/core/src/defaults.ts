import type { Member, Profile, Routine } from './types';
import { hm } from './time';

export const DEFAULT_ROUTINE: Routine = {
  wake: hm('07:00'),
  sleep: hm('23:00'),
  meals: {
    breakfast: hm('08:00'),
    lunch: hm('13:00'),
    snack: hm('17:00'),
    dinner: hm('18:30'),
  },
  medication: [],
};

export function makeMember(partial: Partial<Member> & Pick<Member, 'id' | 'name'>): Member {
  return {
    diet: 'omnivore',
    allergens: [],
    dislikes: [],
    goals: [],
    ...partial,
  };
}

export function makeProfile(partial: Partial<Profile> = {}): Profile {
  const self = makeMember({ id: 'me', name: 'You' });
  return {
    selfId: self.id,
    members: [self],
    routine: DEFAULT_ROUTINE,
    floorKcal: 1200,
    tzOffsetMin: 0,
    ...partial,
  };
}
