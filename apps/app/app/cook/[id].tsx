import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { fitFor, foodById, scaleSteps, stepsFor } from '@eatos/core';
import { useKernel } from '../../src/kernel';
import { useTheme } from '../../src/theme';
import { Btn, Card, Chip, Row, Screen, Section, Txt, TopBar } from '../../src/ui';
import { capitalise, daysLabel } from '../../src/format';
import { eatFood, slotForNow } from '../../src/actions';

export default function Cook() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { kernel, now, submitMany } = useKernel();
  const { c } = useTheme();
  const food = foodById(kernel.catalog, String(id));
  const [step, setStep] = useState(0);
  const [timer, setTimer] = useState<number | null>(null);
  const [servings, setServings] = useState(Math.max(2, kernel.state.profile?.members.length ?? 2));

  useEffect(() => {
    if (timer === null || timer <= 0) return;
    const t = setTimeout(() => setTimer(timer - 1), 1000);
    return () => clearTimeout(t);
  }, [timer]);

  if (!food) {
    return (
      <Screen header={<TopBar title="Cooking" />}>
        <Txt v="h2">That recipe was not found.</Txt>
      </Screen>
    );
  }

  const steps = scaleSteps(stepsFor(food), servings);
  const current = steps[step] ?? '';
  const minutes = Number(current.match(/(\d+)\s*minutes?/)?.[1] ?? 0);
  const pantry = kernel.pantry(now);
  const members = kernel.state.profile?.members ?? [];
  const lastStep = step === steps.length - 1;
  const mm = timer !== null ? `${Math.floor(timer / 60)}:${String(timer % 60).padStart(2, '0')}` : '';

  return (
    <Screen
      header={<TopBar title="Cooking" subtitle={`${food.prepMin} min · serves ${Math.max(1, members.length)}`} />}
      footer={
        <Row>
          <Btn label="Previous" kind="outline" disabled={step === 0} onPress={() => setStep(step - 1)} style={{ flex: 1 }} />
          {lastStep ? (
            <Btn
              label="Done, I ate this"
              style={{ flex: 2 }}
              onPress={() => {
                eatFood(kernel, submitMany, food, slotForNow(kernel, now));
                router.replace('/');
              }}
            />
          ) : (
            <Btn label="Next step" style={{ flex: 2 }} onPress={() => setStep(step + 1)} />
          )}
        </Row>
      }
    >
      <View style={{ height: 140, borderRadius: 20, backgroundColor: c.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
        <Txt v="h2" color="muted">{food.name.split(' ')[0]}</Txt>
      </View>
      <Txt v="h1">{food.name}</Txt>
      <Row gap={8}>
        <Txt v="small">{`Amounts for ${servings} ${servings === 1 ? 'person' : 'people'}`}</Txt>
        <Btn small kind="outline" label="Fewer" accessibilityLabel="Cook for fewer people" disabled={servings <= 1} onPress={() => setServings(servings - 1)} />
        <Btn small kind="outline" label="More" accessibilityLabel="Cook for more people" disabled={servings >= 12} onPress={() => setServings(servings + 1)} />
      </Row>
      <Row wrap gap={6}>
        <Chip label={`${food.prepMin} min`} />
        <Chip label={capitalise(food.diet)} />
        <Chip label={`${food.nutrients.proteinG} g protein`} />
        {food.allergens.length ? <Chip label={`Contains ${food.allergens.join(', ')}`} tone="warn" /> : <Chip label="No common allergens" tone="ok" />}
      </Row>

      {members.length > 1 ? (
        <Card tone="soft">
          {members.map((m) => {
            const f = fitFor(food, m);
            return (
              <Row key={m.id} style={{ justifyContent: 'space-between' }}>
                <Txt v="body">{m.name}</Txt>
                <Txt v="small" color={f.ok ? 'okText' : f.hard ? 'danger' : 'warnText'}>{f.reason}</Txt>
              </Row>
            );
          })}
        </Card>
      ) : null}

      <Section title="Ingredients">
        <Card>
          {food.ingredients.map((ing) => {
            const item = pantry.find((p) => p.name.toLowerCase() === ing);
            const label = !item ? 'Missing' : item.status === 'use-soon' ? `Use ${daysLabel(item.daysLeft).toLowerCase()}` : 'In pantry';
            return (
              <Row key={ing} style={{ justifyContent: 'space-between' }}>
                <Txt v="body">{capitalise(ing)}</Txt>
                <Txt v="small" color={!item ? 'muted' : item.status === 'use-soon' ? 'warnText' : 'okText'}>{label}</Txt>
              </Row>
            );
          })}
        </Card>
      </Section>

      <Card tone="ink" padding={20}>
        <Txt v="mono" color="inkMuted">{`STEP ${step + 1} OF ${steps.length}`}</Txt>
        <Txt v="h2" color="inkText">{current}</Txt>
        <Row gap={6}>
          {steps.map((_, i) => (
            <View key={i} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i <= step ? c.lime : c.inkBorder }} />
          ))}
        </Row>
        {minutes > 0 ? (
          <Btn kind="lime" icon="timer" label={timer !== null && timer > 0 ? `Timer ${mm}` : timer === 0 ? 'Time is up' : `Start ${minutes} min timer`} onPress={() => setTimer(minutes * 60)} />
        ) : null}
      </Card>
    </Screen>
  );
}
