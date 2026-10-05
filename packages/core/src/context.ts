import type { Food } from './types';
import { MINUTE } from './time';

/** India's seasons by month (0 = January): summer Mar-May, monsoon Jun-Sep, post-monsoon Oct-Nov, winter Dec-Feb. */
export type Season = 'summer' | 'monsoon' | 'post-monsoon' | 'winter';

export function seasonOf(month: number): Season {
  if (month >= 2 && month <= 4) return 'summer';
  if (month >= 5 && month <= 8) return 'monsoon';
  if (month >= 9 && month <= 10) return 'post-monsoon';
  return 'winter';
}

export interface Context {
  season: Season;
  /** Local hour 0-23. */
  hour: number;
  lateNight: boolean;
}

export function contextAt(now: number, tzOffsetMin = 0): Context {
  const d = new Date(now + tzOffsetMin * MINUTE);
  const hour = d.getUTCHours();
  return { season: seasonOf(d.getUTCMonth()), hour, lateNight: hour >= 22 || hour < 5 };
}

/** Score change and a plain reason for how well a food suits the season and the hour. */
export function contextFit(food: Food, ctx: Context): { delta: number; reasons: string[] } {
  const t = (tag: string) => food.tags.includes(tag);
  let delta = 0;
  const reasons: string[] = [];
  if (ctx.season === 'summer') {
    if (t('cooling') || t('cold')) {
      delta += 1.5;
      reasons.push('Cooling for the heat');
    }
    if (food.nutrients.waterMl >= 250) delta += 1;
    if (t('spicy')) delta -= 1;
  }
  if (ctx.season === 'monsoon') {
    if (t('raw') || t('street')) delta -= 2.5;
    if (t('warm')) {
      delta += 1.5;
      reasons.push('Warm and freshly cooked for the monsoon');
    }
  }
  if (ctx.season === 'winter' && t('warm')) delta += 1;
  if (ctx.lateNight) {
    if (t('light')) {
      delta += 2;
      reasons.push('Light for this hour');
    }
    if (food.nutrients.kcal > 600) delta -= 2;
  }
  return { delta, reasons };
}
