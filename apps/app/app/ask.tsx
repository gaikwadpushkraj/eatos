import { useMemo, useState } from 'react';
import { TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { chooseForMe } from '@eatos/core';
import type { MealSlot } from '@eatos/core';
import { useKernel } from '../src/kernel';
import { useTheme, fonts } from '../src/theme';
import { Btn, Card, Chip, IconBtn, Row, Screen, Txt, TopBar } from '../src/ui';

const PROMPTS = ['Something warm, 15 minutes', 'A light snack', 'High protein dinner', 'Comfort food for everyone', 'Gentle, I feel unwell'];

export default function Ask() {
  const { kernel, now, submit, version } = useKernel();
  const { c } = useTheme();
  const params = useLocalSearchParams<{ q?: string; slot?: string }>();
  const [text, setText] = useState(params.q ?? '');
  const [asked, setAsked] = useState(params.q ?? '');
  const [why, setWhy] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const slot = (params.slot || undefined) as MealSlot | undefined;

  const result = useMemo(() => {
    const r = kernel.ask(asked, now);
    if (!asked && slot) {
      return { ...r, query: { ...r.query, slot }, results: kernel.recommend({ ...r.query, slot, k: 3 }, now), understood: [`For ${slot}`, ...r.understood] };
    }
    return r;
  }, [kernel, asked, now, slot, version]);

  const send = (q: string) => {
    setText(q);
    setAsked(q);
    setPicked(null);
  };

  return (
    <Screen
      header={<TopBar title="Ask EatOS" subtitle="Using pantry · calendar · today's intake" />}
      footer={
        <View style={{ minHeight: 52, borderRadius: 26, backgroundColor: c.surface, borderWidth: 1, borderColor: c.borderStrong, flexDirection: 'row', alignItems: 'center', paddingLeft: 18, paddingRight: 6, gap: 8 }}>
          <TextInput
            accessibilityLabel="Message EatOS"
            value={text}
            onChangeText={setText}
            onSubmitEditing={() => send(text)}
            placeholder="Refine, like 'no rice' or '10 minutes'"
            placeholderTextColor={c.muted}
            returnKeyType="send"
            style={{ flex: 1, minHeight: 44, fontFamily: fonts.regular, fontSize: 15, color: c.text }}
          />
          <IconBtn icon="send" label="Send" filled onPress={() => send(text)} />
        </View>
      }
    >
      {asked ? (
        <View style={{ alignSelf: 'flex-end', maxWidth: '80%', backgroundColor: c.text, borderRadius: 20, borderBottomRightRadius: 6, paddingHorizontal: 16, paddingVertical: 12 }}>
          <Txt v="body" style={{ color: c.bg }}>{asked}</Txt>
        </View>
      ) : (
        <Row wrap gap={8}>
          {PROMPTS.map((p) => (
            <Chip key={p} label={p} onPress={() => send(p)} />
          ))}
        </Row>
      )}

      <Txt v="body">
        {result.results.length ? `${result.results.length} options that fit right now.` : 'Nothing fits those limits. Try a longer time or fewer exclusions.'}
      </Txt>

      {result.results.map((r, i) => (
        <Card key={r.food.id} tone={picked === r.food.id || (!picked && i === 0) ? 'accent' : 'default'}>
          <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Txt v="h3" style={{ flex: 1 }}>{r.food.name}</Txt>
            {i === 0 && !picked ? <Chip label="Best fit" tone="accent" /> : null}
            {picked === r.food.id ? <Chip label="Chosen for you" tone="accent" /> : null}
          </Row>
          <Row wrap gap={6}>
            <Chip label={`${r.food.prepMin} min`} />
            <Chip label={`${r.food.nutrients.proteinG} g protein`} />
            {r.food.tags.slice(0, 2).map((t) => (
              <Chip key={t} label={t} />
            ))}
          </Row>
          <Txt v="small">{r.reasons.join('. ')}</Txt>
          {r.missing.length ? <Txt v="small">{`Missing: ${r.missing.join(', ')}`}</Txt> : null}
          <Row wrap gap={8}>
            <Btn small label="Cook this" onPress={() => router.push(`/cook/${r.food.id}`)} />
            <Btn small kind="outline" label="Love it" onPress={() => submit({ type: 'feedback', foodId: r.food.id, verdict: 'liked' })} />
            <Btn small kind="ghost" label="Not for me" onPress={() => submit({ type: 'feedback', foodId: r.food.id, verdict: 'never' })} />
          </Row>
        </Card>
      ))}

      {result.results.length ? (
        <Row>
          <Btn label="Choose for me" kind="lime" style={{ flex: 1 }} onPress={() => setPicked(chooseForMe(result.results)?.food.id ?? null)} />
          <Btn label={why ? 'Hide reasons' : 'Why these?'} kind="outline" style={{ flex: 1 }} onPress={() => setWhy(!why)} />
        </Row>
      ) : null}

      {why ? (
        <Card tone="soft">
          <Txt v="h3">What EatOS used</Txt>
          {[...result.understood, result.query.need ? `Biggest need right now: ${result.query.need}` : 'No nutrient gap right now', 'Allergies and diets of everyone eating are always respected', 'Foods you marked "not for me" are left out'].map((l) => (
            <Txt key={l} v="small">{`• ${l}`}</Txt>
          ))}
        </Card>
      ) : null}
    </Screen>
  );
}
