/**
 * Scales the amounts in a recipe step. Steps are written for 2 servings. Only amounts with a unit
 * (cups, spoons, grams, cloves, eggs and so on) change; times, whistles and temperatures stay as they are.
 */
const UNITS = '(?:cups?|tbsp|tsp|kg|g|ml|l|litres?|cloves?|pieces?|slices?|eggs?|sticks?|bunch(?:es)?|pinch(?:es)?)';
const AMOUNT = new RegExp(`(\\d+\\s+\\d/\\d|\\d+/\\d|\\d+(?:\\.\\d+)?)(\\s*)(${UNITS})\\b`, 'gi');

function parse(s: string): number {
  const mixed = s.match(/^(\d+)\s+(\d)\/(\d)$/);
  if (mixed) return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);
  const frac = s.match(/^(\d)\/(\d)$/);
  if (frac) return Number(frac[1]) / Number(frac[2]);
  return Number(s);
}

function show(n: number, unit: string): string {
  const u = unit.toLowerCase();
  if (u === 'g' || u === 'ml') return String(Math.max(5, Math.round(n / 5) * 5));
  if (u === 'kg' || u === 'l' || u.startsWith('litre')) return String(Math.round(n * 100) / 100);
  const q = Math.round(n * 4) / 4;
  const whole = Math.floor(q);
  const rest = q - whole;
  const f = rest === 0.25 ? '1/4' : rest === 0.5 ? '1/2' : rest === 0.75 ? '3/4' : '';
  if (q === 0) return '1/4';
  return whole ? (f ? `${whole} ${f}` : String(whole)) : f;
}

export function scaleAmounts(step: string, factor: number): string {
  if (factor === 1) return step;
  return step.replace(AMOUNT, (_m, num: string, gap: string, unit: string) => `${show(parse(num) * factor, unit)}${gap}${unit}`);
}

export function scaleSteps(steps: string[], servings: number, base = 2): string[] {
  return steps.map((s) => scaleAmounts(s, servings / base));
}
