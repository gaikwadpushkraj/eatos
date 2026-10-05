import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { DEFAULT_ROUTINE, makeMember, makeProfile } from '@eatos/core';
import type { Allergen, Diet, Goal, Member } from '@eatos/core';
import { useKernel } from '../src/kernel';
import type { EventInput } from '../src/kernel';
import { useTheme } from '../src/theme';
import { Btn, Card, Check, Chip, Field, Row, Screen, Section, Toggle, Txt } from '../src/ui';
import { capitalise, localOffset, shelfLifeDays } from '../src/format';
import { SyncSettings } from '../src/SyncSettings';

const WHO = [
  { key: 'me', title: 'Just me', hint: 'Everyday meals that fit my day' },
  { key: 'household', title: 'My household', hint: 'Family, partner or housemates' },
  { key: 'training', title: 'Training or performance', hint: 'Fuel around workouts and recovery' },
  { key: 'condition', title: 'A health condition', hint: "Follow a plan from your clinician" },
  { key: 'caring', title: 'Caring for someone', hint: 'A child, parent or person you support' },
] as const;
type Who = (typeof WHO)[number]['key'];

const DIETS: Diet[] = ['omnivore', 'pescatarian', 'vegetarian', 'vegan'];
const ALLERGENS: Allergen[] = ['nuts', 'peanuts', 'dairy', 'gluten', 'egg', 'soy', 'fish', 'shellfish', 'sesame'];
const GOALS: { key: Goal; label: string }[] = [
  { key: 'more-protein', label: 'More protein' },
  { key: 'hydration', label: 'Stay hydrated' },
  { key: 'less-waste', label: 'Less food waste' },
  { key: 'energy', label: 'Steady energy' },
];

const SAMPLE_PANTRY: [string, number, 'fridge' | 'cupboard' | 'counter'][] = [
  ['spinach', 1, 'fridge'],
  ['greek yogurt', 4, 'fridge'],
  ['eggs', 12, 'fridge'],
  ['cooked rice', 0.5, 'fridge'],
  ['red lentils', 180, 'cupboard'],
  ['basmati rice', 200, 'cupboard'],
  ['oats', 120, 'cupboard'],
  ['onion', 20, 'counter'],
  ['garlic', 30, 'counter'],
  ['tomatoes', 3, 'counter'],
  ['banana', 4, 'counter'],
];

function toggle<T>(list: T[], v: T): T[] {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
}

function MemberForm({ onAdd }: { onAdd: (m: Member) => void }) {
  const [name, setName] = useState('');
  const [diet, setDiet] = useState<Diet>('omnivore');
  const [allergens, setAllergens] = useState<Allergen[]>([]);
  const [mild, setMild] = useState(false);
  return (
    <Card>
      <Field label="Name" value={name} onChangeText={setName} placeholder="e.g. Sam" />
      <Section title="Diet">
        <Row wrap gap={8}>
          {DIETS.map((d) => (
            <Chip key={d} label={capitalise(d)} selected={diet === d} onPress={() => setDiet(d)} />
          ))}
        </Row>
      </Section>
      <Section title="Allergies">
        <Row wrap gap={8}>
          {ALLERGENS.map((a) => (
            <Chip key={a} label={capitalise(a)} selected={allergens.includes(a)} onPress={() => setAllergens(toggle(allergens, a))} />
          ))}
        </Row>
      </Section>
      <Toggle label="Prefers mild food" value={mild} onChange={setMild} />
      <Btn
        label="Add to household"
        kind="outline"
        disabled={!name.trim()}
        onPress={() => {
          onAdd(makeMember({ id: `m_${Date.now().toString(36)}`, name: name.trim(), diet, allergens, mild }));
          setName('');
          setAllergens([]);
          setMild(false);
        }}
      />
    </Card>
  );
}

export default function Onboarding() {
  const { submitMany, now, kernel, version } = useKernel();
  const [joining, setJoining] = useState(false);
  // A synced profile from another device finishes onboarding.
  useEffect(() => {
    if (kernel.state.profile) router.replace('/');
  }, [kernel, version]);
  const { c } = useTheme();
  const [step, setStep] = useState(0);
  const [who, setWho] = useState<Who[]>(['me']);
  const [name, setName] = useState('');
  const [diet, setDiet] = useState<Diet>('omnivore');
  const [allergens, setAllergens] = useState<Allergen[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [weight, setWeight] = useState('');
  const [medication, setMedication] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [sample, setSample] = useState(true);

  const needsHousehold = who.includes('household') || who.includes('caring');
  const steps = needsHousehold ? 4 : 3;
  const last = step === steps - 1;

  const finish = () => {
    const self = makeMember({
      id: 'me',
      name: name.trim() || 'You',
      diet,
      allergens,
      goals: who.includes('training') ? [...new Set<Goal>([...goals, 'performance'])] : goals,
      weightKg: Number(weight) > 0 ? Number(weight) : undefined,
    });
    const profile = makeProfile({
      selfId: 'me',
      members: [self, ...members.map((m) => (who.includes('caring') ? { ...m, managedBy: 'me' } : m))],
      routine: { ...DEFAULT_ROUTINE, medication: medication.trim() ? [{ name: medication.trim(), slot: 'breakfast' }] : [] },
      tzOffsetMin: localOffset(),
    });
    const events: EventInput[] = [{ type: 'profile.set', profile }];
    if (sample) {
      for (const [item, days, location] of SAMPLE_PANTRY) {
        events.push({
          type: 'pantry.added',
          item: { id: `p_${item.replace(/\s/g, '-')}`, name: item, qty: 1, unit: 'pc', location, addedAt: now, expiresAt: now + (days ?? shelfLifeDays(item)) * 86_400_000 },
        });
      }
    }
    submitMany(events);
    router.replace('/');
  };

  const stepKey = step === 0 ? 'who' : step === 1 ? 'you' : needsHousehold && step === 2 ? 'household' : 'ready';

  return (
    <Screen
      maxWidth={560}
      footer={
        <View style={{ gap: 10 }}>
          <Row>
            {step > 0 ? <Btn label="Back" kind="outline" onPress={() => setStep(step - 1)} style={{ flex: 1 }} /> : null}
            <Btn label={last ? 'Start EatOS' : 'Continue'} kind="ink" onPress={() => (last ? finish() : setStep(step + 1))} style={{ flex: 2 }} disabled={step === 0 && who.length === 0} />
          </Row>
          <Txt v="small" style={{ textAlign: 'center' }}>
            Your data stays on this device unless you choose to sync.
          </Txt>
        </View>
      }
    >
      <View style={{ gap: 10 }}>
        <Txt v="mono">{`SETUP · STEP ${step + 1} OF ${steps}`}</Txt>
        <Row gap={6}>
          {Array.from({ length: steps }, (_, i) => (
            <View key={i} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i <= step ? c.text : c.borderStrong }} />
          ))}
        </Row>
      </View>

      {stepKey === 'who' && (
        <>
          <Txt v="h1">Who is EatOS feeding?</Txt>
          <Txt v="body" color="muted">Pick everything that applies. You can change it any time.</Txt>
          <Btn small kind="ghost" label={joining ? 'Set up this device instead' : 'Already use EatOS on another device? Connect'} onPress={() => setJoining(!joining)} />
          {joining ? <SyncSettings joining /> : null}
          <View style={{ gap: 10 }}>
            {WHO.map((w) => (
              <Card key={w.key} tone={who.includes(w.key) ? 'accent' : 'default'} padding={4}>
                <Check label={w.title} detail={w.hint} checked={who.includes(w.key)} onChange={() => setWho(toggle(who, w.key))} />
              </Card>
            ))}
          </View>
        </>
      )}

      {stepKey === 'you' && (
        <>
          <Txt v="h1">About you</Txt>
          <Field label="Your name" value={name} onChangeText={setName} placeholder="What should EatOS call you?" />
          <Section title="Diet">
            <Row wrap gap={8}>
              {DIETS.map((d) => (
                <Chip key={d} label={capitalise(d)} selected={diet === d} onPress={() => setDiet(d)} />
              ))}
            </Row>
          </Section>
          <Section title="Allergies (always enforced)">
            <Row wrap gap={8}>
              {ALLERGENS.map((a) => (
                <Chip key={a} label={capitalise(a)} selected={allergens.includes(a)} onPress={() => setAllergens(toggle(allergens, a))} />
              ))}
            </Row>
          </Section>
          <Section title="Goals">
            <Row wrap gap={8}>
              {GOALS.map((g) => (
                <Chip key={g.key} label={g.label} selected={goals.includes(g.key)} onPress={() => setGoals(toggle(goals, g.key))} />
              ))}
            </Row>
          </Section>
          <Field label="Weight in kg (optional, for protein and water targets)" value={weight} onChangeText={setWeight} keyboardType="numeric" placeholder="e.g. 70" />
        </>
      )}

      {stepKey === 'household' && (
        <>
          <Txt v="h1">Your household</Txt>
          <Txt v="body" color="muted">Add the people you cook for. Their allergies and diets are respected in every suggestion.</Txt>
          {members.map((m) => (
            <Card key={m.id}>
              <Txt v="h3">{m.name}</Txt>
              <Txt v="small">{[capitalise(m.diet), ...m.allergens.map((a) => `no ${a}`), m.mild ? 'mild' : ''].filter(Boolean).join(' · ')}</Txt>
            </Card>
          ))}
          <MemberForm onAdd={(m) => setMembers([...members, m])} />
        </>
      )}

      {stepKey === 'ready' && (
        <>
          <Txt v="h1">Ready to start</Txt>
          <Card>
            <Txt v="h3">Your day</Txt>
            <Txt v="body" color="muted">Breakfast 8:00 · Lunch 13:00 · Snack 17:00 · Dinner 18:30. EatOS moves meals when your day changes.</Txt>
          </Card>
          <Field label="Medication taken with breakfast (optional)" value={medication} onChangeText={setMedication} placeholder="e.g. Vitamin D" />
          {who.includes('condition') ? (
            <Card tone="ok">
              <Txt v="h3" color="okText">Safety floor is on</Txt>
              <Txt v="small" color="okText">EatOS gives general suggestions only. Follow your clinician's plan for a medical diet.</Txt>
            </Card>
          ) : null}
          <Card padding={4}>
            <View style={{ paddingHorizontal: 12 }}>
              <Toggle label="Start with a sample pantry" hint="Adds a few common items so suggestions make sense straight away" value={sample} onChange={setSample} />
            </View>
          </Card>
        </>
      )}
    </Screen>
  );
}
