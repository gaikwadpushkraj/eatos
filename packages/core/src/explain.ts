import type { Food } from './types';
import type { State } from './state';
import { eventsToday } from './state';
import { useSoon } from './housekeeping';
import { clock } from './time';

export interface LogLine {
  at: number;
  source: 'Calendar' | 'Watch' | 'Pantry' | 'Sleep' | 'Health' | 'You';
  text: string;
}

/** "Why the plan changed": today's events in plain language, newest first. */
export function explainToday(state: State, _catalog: Food[], now: number): LogLine[] {
  const off = state.profile?.tzOffsetMin ?? 0;
  const lines: LogLine[] = [];
  for (const e of eventsToday(state, now)) {
    switch (e.type) {
      case 'calendar.busy':
        lines.push({ at: e.at, source: 'Calendar', text: `${e.title ?? 'Something'} from ${clock(e.start, off)} to ${clock(e.end, off)}, so meals in that window moved.` });
        break;
      case 'workout.completed':
        lines.push({ at: e.at, source: 'Watch', text: `A ${e.minutes} minute workout synced, so protein and water targets went up.` });
        break;
      case 'sleep.logged':
        if (e.hours < 7) lines.push({ at: e.at, source: 'Sleep', text: `${e.hours} h sleep, so the evening wind down is earlier.` });
        break;
      case 'illness.started':
        lines.push({ at: e.at, source: 'Health', text: 'Safe mode is on: gentle food, fluids first, goals paused.' });
        break;
      case 'illness.ended':
        lines.push({ at: e.at, source: 'Health', text: 'Safe mode is off. Normal plans are back.' });
        break;
      default:
        break;
    }
  }
  const soon = useSoon(state, now);
  if (soon.length) {
    lines.push({ at: now, source: 'Pantry', text: `${soon.map((s) => s.name).join(', ')} should be used soon, so meals with them come first.` });
  }
  return lines.sort((a, b) => b.at - a.at);
}
