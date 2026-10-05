import { useState } from 'react';
import type { Condition, Diet, DietRule, Kitchen, Member } from '@eatos/core';
import { DEFAULT_ROUTINE, RULE_LABEL, askDoctorFlags, hm } from '@eatos/core';
import type { Routine } from '@eatos/core';
import { useKernel } from './kernel';
import { Btn, Card, Chip, Row, Section, Txt } from './ui';

const DIETS: { key: Diet; label: string }[] = [
  { key: 'vegan', label: 'Vegan' },
  { key: 'vegetarian', label: 'Vegetarian' },
  { key: 'pescatarian', label: 'Fish, no meat' },
  { key: 'omnivore', label: 'Eats everything' },
];
const RULES = Object.keys(RULE_LABEL) as DietRule[];
const SPICE = [
  { key: 0, label: 'No spice' },
  { key: 1, label: 'Mild' },
  { key: 2, label: 'Medium' },
  { key: 3, label: 'Hot' },
] as const;
const CUISINES = [
  ['gujarati', 'Gujarati'],
  ['punjabi', 'Punjabi'],
  ['north-indian', 'North Indian'],
  ['south-indian', 'South Indian'],
  ['maharashtrian', 'Maharashtrian'],
  ['bengali', 'Bengali'],
  ['hyderabadi', 'Hyderabadi'],
  ['rajasthani', 'Rajasthani'],
  ['karnataka', 'Karnataka'],
  ['mumbai', 'Mumbai street'],
] as const;
const KITCHENS: { key: Kitchen; label: string }[] = [
  { key: 'full', label: 'Full kitchen' },
  { key: 'basic', label: 'Basic (no oven)' },
  { key: 'none', label: 'No kitchen' },
];
export const CONDITIONS: { key: Condition; label: string }[] = [
  { key: 'diabetes', label: 'Diabetes' },
  { key: 'prediabetes', label: 'Prediabetes' },
  { key: 'hypertension', label: 'High blood pressure' },
  { key: 'high-cholesterol', label: 'High cholesterol' },
  { key: 'pcos', label: 'PCOS' },
  { key: 'thyroid', label: 'Thyroid' },
  { key: 'anaemia', label: 'Anaemia' },
  { key: 'lactose-intolerant', label: 'Lactose intolerant' },
  { key: 'celiac', label: 'Coeliac' },
  { key: 'gout', label: 'Gout' },
  { key: 'kidney', label: 'Kidney condition' },
  { key: 'pregnancy', label: 'Pregnant' },
  { key: 'insulin', label: 'On insulin or sulfonylureas' },
  { key: 'eating-disorder-history', label: 'Eating disorder history' },
  { key: 'minor', label: 'Under 18' },
];

const NIGHT: Routine = { wake: hm('15:00'), sleep: hm('09:00'), meals: { breakfast: hm('16:00'), lunch: hm('21:00'), snack: hm('02:00'), dinner: hm('05:00') }, medication: [] };
const EARLY: Routine = { wake: hm('05:30'), sleep: hm('21:30'), meals: { breakfast: hm('06:30'), lunch: hm('12:00'), snack: hm('16:30'), dinner: hm('18:30') }, medication: [] };
const DAYS: { key: string; label: string; routine: Routine }[] = [
  { key: 'day', label: 'Regular day', routine: DEFAULT_ROUTINE },
  { key: 'early', label: 'Early riser', routine: EARLY },
  { key: 'night', label: 'Night shift', routine: NIGHT },
];

const toggle = <T,>(list: T[] | undefined, v: T): T[] => ((list ?? []).includes(v) ? (list ?? []).filter((x) => x !== v) : [...(list ?? []), v]);

/** What shapes every suggestion: diet, rules, taste, kitchen and, only if the person chooses, health conditions. */
export function FoodProfile() {
  const { kernel, submit } = useKernel();
  const [showHealth, setShowHealth] = useState(false);
  const profile = kernel.state.profile;
  const me = kernel.me();
  if (!profile || !me) return null;

  const setMember = (patch: Partial<Member>) => submit({ type: 'profile.set', profile: { ...profile, members: profile.members.map((m) => (m.id === me.id ? { ...m, ...patch } : m)) } });
  const kitchen = profile.kitchen ?? 'full';

  return (
    <>
      <Section title="Your food">
        <Card style={{ gap: 14 }}>
          <Txt v="label">What you eat</Txt>
          <Row wrap gap={8}>
            {DIETS.map((d) => (
              <Chip key={d.key} label={d.label} selected={me.diet === d.key} onPress={() => setMember({ diet: d.key })} />
            ))}
          </Row>
          <Txt v="label">Rules your household keeps</Txt>
          <Txt v="small">These are never broken. EatOS will not suggest anything that has them.</Txt>
          <Row wrap gap={8}>
            {RULES.map((r) => (
              <Chip key={r} label={RULE_LABEL[r]} selected={!!me.rules?.includes(r)} onPress={() => setMember({ rules: toggle(me.rules, r) })} />
            ))}
          </Row>
          <Txt v="label">Spice</Txt>
          <Row wrap gap={8}>
            {SPICE.map((s) => (
              <Chip key={s.key} label={s.label} selected={me.spice === s.key} onPress={() => setMember({ spice: s.key })} />
            ))}
          </Row>
          <Txt v="label">The food you grew up with</Txt>
          <Row wrap gap={8}>
            {CUISINES.map(([k, label]) => (
              <Chip key={k} label={label} selected={!!me.cuisines?.includes(k)} onPress={() => setMember({ cuisines: toggle(me.cuisines, k) })} />
            ))}
          </Row>
          <Txt v="label">Your day</Txt>
          <Txt v="small">Meals and water follow your waking hours. Medication times you set at setup stay as they are.</Txt>
          <Row wrap gap={8}>
            {DAYS.map((d) => (
              <Chip
                key={d.key}
                label={d.label}
                selected={profile.routine.wake === d.routine.wake && profile.routine.sleep === d.routine.sleep}
                onPress={() => submit({ type: 'profile.set', profile: { ...profile, routine: { ...d.routine, medication: profile.routine.medication } } })}
              />
            ))}
          </Row>
          <Txt v="label">Where you cook</Txt>
          <Row wrap gap={8}>
            {KITCHENS.map((k) => (
              <Chip key={k.key} label={k.label} selected={kitchen === k.key} onPress={() => submit({ type: 'profile.set', profile: { ...profile, kitchen: k.key } })} />
            ))}
          </Row>
        </Card>
      </Section>

      <Section title="Health (optional)">
        <Card style={{ gap: 12 }}>
          <Txt v="small">Only if you want it. This stays on this device unless you turn on sync or make a backup, and it is never sent to Claude. EatOS never works out a condition from what you eat, and never gives medical advice: it only ranks food a little differently and adds safety checks.</Txt>
          <Btn kind="outline" small label={showHealth ? 'Hide health options' : (me.conditions?.length ?? 0) > 0 ? `Health options (${me.conditions!.length} set)` : 'Add health options'} onPress={() => setShowHealth(!showHealth)} />
          {showHealth ? (
            <Row wrap gap={8}>
              {CONDITIONS.map((c) => (
                <Chip key={c.key} label={c.label} selected={!!me.conditions?.includes(c.key)} onPress={() => setMember({ conditions: toggle(me.conditions, c.key) })} />
              ))}
            </Row>
          ) : null}
          {askDoctorFlags(me).map((f) => (
            <Txt key={f} v="small">{f}</Txt>
          ))}
        </Card>
      </Section>
    </>
  );
}
