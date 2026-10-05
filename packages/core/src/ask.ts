import type { MealSlot } from './types';
import type { Query } from './recommend';
import { RESTRICTIVE, RESTRICTIVE_NOTE } from './rules';

export interface ParsedAsk {
  query: Query;
  /** What the parser understood, for "Why these?". */
  understood: string[];
  /** A kind note shown with the answer, for example about skipping meals. */
  caution?: string;
}

const TAG_WORDS: Record<string, string> = {
  warm: 'warm',
  hot: 'warm',
  cosy: 'comfort',
  cozy: 'comfort',
  comfort: 'comfort',
  cold: 'cold',
  fresh: 'cold',
  spicy: 'spicy',
  gentle: 'gentle',
  sick: 'gentle',
  easy: 'gentle',
};

const STOP = new Set(['something', 'anything', 'for', 'the', 'and', 'with', 'what', 'can', 'make', 'have', 'want', 'need', 'some', 'tonight', 'today', 'tomorrow', 'now', 'please', 'give', 'show', 'ideas', 'idea', 'meal', 'food', 'eat', 'eating', 'minutes', 'minute', 'mins', 'min', 'quick', 'fast', 'hurry', 'time', 'too', 'light', 'small', 'heavy', 'protein', 'fibre', 'fiber', 'workout', 'gym', 'just', 'only', 'myself', 'everyone', 'family', 'all', 'household', 'kids', 'that', 'this', 'are', 'you', 'got', 'good', 'nice', 'tasty', 'hungry', 'feel', 'feeling', 'like', 'least', 'grams', 'over', 'more', 'than']);

const SLOT_WORDS: Record<string, MealSlot> = {
  breakfast: 'breakfast',
  brunch: 'breakfast',
  lunch: 'lunch',
  dinner: 'dinner',
  supper: 'dinner',
  snack: 'snack',
};

/**
 * Rule-based parser for "Ask EatOS". No network and no paid model: it
 * understands time limits, moods, slots, needs, exclusions and who is
 * eating. An LLM adapter can replace it later behind the same shape.
 */
export function parseAsk(text: string, selfId = 'me'): ParsedAsk {
  const s = text.toLowerCase();
  const query: Query = {};
  const understood: string[] = [];

  const minutes = s.match(/(\d+)\s*(?:min|mins|minutes|m\b)/);
  if (minutes) {
    query.maxPrepMin = Number(minutes[1]);
    understood.push(`Ready in ${query.maxPrepMin} minutes or less`);
  } else if (/\b(quick|fast|hurry|no time)\b/.test(s)) {
    query.maxPrepMin = 15;
    understood.push('Quick, 15 minutes or less');
  }

  const tags = new Set<string>();
  for (const [word, tag] of Object.entries(TAG_WORDS)) {
    if (new RegExp(`\\b${word}\\b`).test(s)) tags.add(tag);
  }
  if (tags.size) {
    query.tags = [...tags];
    understood.push(`Something ${[...tags].join(', ')}`);
  }

  for (const [word, slot] of Object.entries(SLOT_WORDS)) {
    if (new RegExp(`\\b${word}\\b`).test(s)) {
      query.slot = slot;
      understood.push(`For ${slot}`);
      break;
    }
  }

  if (/\bprotein\b|\bworkout\b|\bgym\b/.test(s)) {
    query.need = 'protein';
    understood.push('High in protein');
  } else if (/\bfib(re|er)\b/.test(s)) {
    query.need = 'fibre';
    understood.push('High in fibre');
  }
  const minProtein = s.match(/(?:at least|over|min(?:imum)?|more than)\s*(\d{1,3})\s*g(?:rams?)?\s*(?:of\s*)?protein/);
  if (minProtein) {
    query.minProteinG = Math.min(120, Number(minProtein[1]));
    query.need = 'protein';
    understood.push(`At least ${query.minProteinG} g protein`);
  }
  if (/\b(light|small|not too heavy)\b/.test(s)) {
    query.light = true;
    understood.push('Kept light');
  }

  const excludes = [...s.matchAll(/\b(?:no|without|not|avoid)\s+([a-z]+)/g)].map((m) => m[1]!).filter((w) => !['time', 'too'].includes(w));
  if (excludes.length) {
    query.exclude = excludes;
    understood.push(`Without ${excludes.join(', ')}`);
  }

  // Words that name a dish, an ingredient or a cuisine ("dosa", "paneer", "rice and dal") steer the ranking.
  const known = new Set([...Object.keys(TAG_WORDS), ...Object.keys(SLOT_WORDS), ...(query.exclude ?? [])]);
  const include = s
    .replace(/(?:no|without|not|avoid)\s+[a-z]+/g, ' ')
    .split(/[^a-z-]+/)
    .filter((w) => w.length > 2 && !STOP.has(w) && !known.has(w));
  if (include.length) {
    query.include = [...new Set(include)].slice(0, 6);
    understood.push(`With ${query.include.join(', ')}`);
  }

  if (/\b(just me|only me|myself)\b/.test(s)) {
    query.memberIds = [selfId];
    understood.push('Just for you');
  } else if (/\b(everyone|family|all of us|household|kids)\b/.test(s)) {
    understood.push('For everyone at home');
  }

  const caution = RESTRICTIVE.test(s) ? RESTRICTIVE_NOTE : undefined;
  return { query, understood, ...(caution ? { caution } : {}) };
}
