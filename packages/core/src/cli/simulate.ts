/**
 * Day simulator: runs a synthetic household through one day and prints
 * how the kernel schedules, re-plans and recommends.
 *
 *   pnpm simulate
 */
import { Kernel, PRIORITY_LABEL, clock, hm, makeMember, makeProfile } from '../index';
import type { EatEvent } from '../index';

const DAY = Date.UTC(2026, 9, 4);
const at = (s: string) => DAY + hm(s) * 60_000;

const profile = makeProfile({
  members: [
    makeMember({ id: 'me', name: 'You', goals: ['more-protein'], weightKg: 80 }),
    makeMember({ id: 'partner', name: 'Partner', diet: 'vegetarian', dislikes: ['mushrooms'] }),
    makeMember({ id: 'kid', name: 'Kid', allergens: ['nuts', 'peanuts'], mild: true, managedBy: 'me' }),
  ],
});

const k = new Kernel();
k.submit({ type: 'profile.set', at: DAY, profile });
const pantry = (name: string, days: number): EatEvent => ({
  type: 'pantry.added',
  at: DAY,
  item: { id: name, name, qty: 1, unit: 'pc', location: 'fridge', addedAt: DAY, expiresAt: DAY + days * 86_400_000 },
});
for (const [n, d] of [['spinach', 1.5], ['red lentils', 120], ['greek yogurt', 4], ['cooked rice', 0.9], ['eggs', 10], ['onion', 20], ['garlic', 30]] as const) {
  k.submit(pantry(n, d));
}

const script: EatEvent[] = [
  { type: 'sleep.logged', at: at('07:00'), hours: 6.6 },
  { type: 'intake.logged', at: at('08:05'), slot: 'breakfast', foodId: 'oats-banana' },
  { type: 'water.logged', at: at('09:30'), ml: 500 },
  { type: 'workout.completed', at: at('11:05'), minutes: 45, intensity: 'moderate' },
  { type: 'intake.logged', at: at('13:10'), slot: 'lunch', foodId: 'chickpea-salad' },
  { type: 'water.logged', at: at('14:00'), ml: 300 },
  { type: 'calendar.busy', at: at('15:40'), start: at('18:00'), end: at('19:00'), title: 'Team meeting' },
];
for (const e of script) k.submit(e);

const now = at('16:12');
const line = (s = '') => console.log(s);

line(`EatOS day simulation, ${clock(now)}`);
line('='.repeat(60));
line('\nSchedule');
for (const t of k.schedule(now)) {
  const flags = [t.state, t.light ? 'light' : '', t.overdue ? 'overdue' : ''].filter(Boolean).join(', ');
  line(`  ${clock(t.at)}  P${t.priority} ${PRIORITY_LABEL[t.priority].padEnd(13)} ${t.title.padEnd(28)} [${flags}]`);
  for (const r of t.reasons) line(`         ↳ ${r}`);
}

line('\nHealth checks');
for (const c of k.health(now)) {
  line(`  ${c.label.padEnd(14)} ${String(c.actual).padStart(5)} / ${c.target} ${c.unit}  expected by now ${c.expected}  → ${c.status}${c.note ? `  (${c.note})` : ''}`);
}

const view = k.now(now);
line(`\nStatus: ${view.status}`);
if (view.nextMeal) line(`Next meal: ${view.nextMeal.title} at ${clock(view.nextMeal.at)}${view.nextMeal.light ? ' (light)' : ''}`);
if (view.suggestion) line(`Suggestion: ${view.suggestion.food.name} — ${view.suggestion.reasons.join('; ')}`);

line('\nAsk EatOS: "Something warm for dinner, 20 minutes"');
const ask = k.ask('Something warm for dinner, 20 minutes', now);
line(`  Understood: ${ask.understood.join(' · ')}`);
for (const r of ask.results) line(`  • ${r.food.name} (${r.food.prepMin} min) — ${r.reasons.join('; ')}`);

line('\nHousehold request: pesto pasta on Friday');
line(`  ${k.resolve('pesto-pasta')?.reason}`);

line('\nWhy the plan changed');
for (const l of k.log(now)) line(`  ${clock(l.at)} · ${l.source}: ${l.text}`);

const hk = k.housekeep(now);
line(`\nHousekeeping: ${hk.expired.length} expired removed, use soon: ${hk.useSoon.map((p) => p.name).join(', ') || 'none'}`);
