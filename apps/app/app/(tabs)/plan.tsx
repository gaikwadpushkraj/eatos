import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { DAY } from '@eatos/core';
import { useKernel } from '../../src/kernel';
import { useTheme, fonts } from '../../src/theme';
import { Btn, Card, Chip, Row, Screen, Txt, useWide } from '../../src/ui';
import { SLOT_LABEL } from '../../src/format';

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Plan() {
  const { kernel, now, version } = useKernel();
  const { c } = useTheme();
  const wide = useWide();
  const { plan } = useMemo(() => kernel.week(now), [kernel, now, version]);
  const [day, setDay] = useState(0);
  const off = kernel.state.profile?.tzOffsetMin ?? 0;
  const days = Array.from({ length: 7 }, (_, i) => plan.start + i * DAY);
  const dateOf = (t: number) => new Date(t + off * 60_000);
  const meals = plan.meals.filter((m) => m.day === days[day]);
  const batches = plan.meals.filter((m) => m.batch);

  return (
    <Screen maxWidth={wide ? 1100 : 720}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Txt v="h1">This week</Txt>
        <Btn small kind="outline" label="Grocery list" onPress={() => router.push('/grocery')} />
      </Row>

      <View style={{ flexDirection: 'row', gap: 6 }}>
        {days.map((d, i) => {
          const sel = i === day;
          return (
            <Pressable
              key={d}
              accessibilityRole="button"
              accessibilityState={{ selected: sel }}
              accessibilityLabel={`${DOW[dateOf(d).getUTCDay()]} ${dateOf(d).getUTCDate()}`}
              onPress={() => setDay(i)}
              style={{ flex: 1, minHeight: 60, borderRadius: 14, borderWidth: 1, borderColor: sel ? c.text : c.border, backgroundColor: sel ? c.text : c.surface, alignItems: 'center', justifyContent: 'center' }}
            >
              <Txt v="small" style={{ color: sel ? c.bg : c.muted, fontSize: 11 }}>{DOW[dateOf(d).getUTCDay()]}</Txt>
              <Txt v="h3" style={{ color: sel ? c.bg : c.text, fontFamily: fonts.semibold }}>{String(dateOf(d).getUTCDate())}</Txt>
            </Pressable>
          );
        })}
      </View>

      <View style={{ flexDirection: wide ? 'row' : 'column', gap: 16, alignItems: 'flex-start' }}>
        <View style={{ flex: wide ? 2 : undefined, width: wide ? undefined : '100%', gap: 8 }}>
          {meals.map((m) => (
            <Pressable key={`${m.day}-${m.slot}`} accessibilityRole="button" onPress={() => router.push(`/cook/${m.food.id}`)}>
              <Card padding={14}>
                <Row>
                  <Txt v="small" style={{ width: 72 }}>{SLOT_LABEL[m.slot]}</Txt>
                  <Txt v="bodyStrong" style={{ flex: 1 }}>{m.food.name}</Txt>
                  {m.batch ? <Chip label="Batch" tone="accent" /> : <Txt v="small">{m.food.prepMin ? `${m.food.prepMin} min` : "No prep"}</Txt>}
                </Row>
                {m.alsoFor?.map((a) => (
                  <Txt key={a.name} v="small">{`${a.name} has: ${a.food.name}`}</Txt>
                ))}
              </Card>
            </Pressable>
          ))}
        </View>
        <View style={{ flex: wide ? 1 : undefined, width: wide ? undefined : '100%', gap: 12 }}>
          {batches.length ? (
            <Card tone="accent">
              <Txt v="h3">Cook once, eat twice</Txt>
              {batches.slice(0, 3).map((b) => (
                <Txt key={`${b.day}`} v="small">{`${b.food.name}: dinner on ${DOW[dateOf(b.day - DAY).getUTCDay()]} comes back as lunch on ${DOW[dateOf(b.day).getUTCDay()]}.`}</Txt>
              ))}
            </Card>
          ) : null}
          <Card tone="ink">
            <Txt v="mono" color="inkMuted">THIS WEEK</Txt>
            <Txt v="h3" color="inkText">{`${plan.meals.length} meals planned, ${batches.length} cooked in batches`}</Txt>
            <Txt v="small" color="inkMuted">Every dish respects everyone's allergies and diet.</Txt>
          </Card>
          <Btn label="Build grocery list for the week" kind="ink" onPress={() => router.push('/grocery')} />
        </View>
      </View>
    </Screen>
  );
}
