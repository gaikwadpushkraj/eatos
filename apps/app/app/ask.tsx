import { useEffect, useMemo, useState } from 'react';
import { TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { chooseForMe, matchesWord, parseAskWithLlm, RESTRICTIVE, RESTRICTIVE_NOTE } from '@eatos/core';
import type { AskOutcome } from '@eatos/core';
import type { MealSlot } from '@eatos/core';
import { useKernel } from '../src/kernel';
import { useTheme, fonts } from '../src/theme';
import { Btn, Card, Chip, IconBtn, Row, Screen, Txt, TopBar } from '../src/ui';
import { loadLlmConfig, makeCompleter } from '../src/llm';

const PROMPTS = ['Something warm, 15 minutes', 'A light snack', 'High protein dinner', 'Comfort food for everyone', 'Gentle, I feel unwell', 'Surprise me', 'Same as yesterday'];

export default function Ask() {
  const { kernel, now, submit, version } = useKernel();
  const { c } = useTheme();
  const params = useLocalSearchParams<{ q?: string; slot?: string }>();
  const [text, setText] = useState(params.q ?? '');
  const [asked, setAsked] = useState(params.q ?? '');
  const [why, setWhy] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const slot = (params.slot || undefined) as MealSlot | undefined;

  // Parse the request: with the optional model when the person turned it on, else on-device rules.
  const [parsed, setParsed] = useState<AskOutcome | null>(null);
  const [thinking, setThinking] = useState(false);
  useEffect(() => {
    let cancelled = false;
    setThinking(true);
    loadLlmConfig()
      .then((cfg) => parseAskWithLlm(asked, makeCompleter(cfg), { selfId: kernel.state.profile?.selfId }))
      .then((p) => {
        if (!cancelled) setParsed(p);
      })
      .finally(() => !cancelled && setThinking(false));
    return () => {
      cancelled = true;
    };
  }, [asked, kernel]);

  const result = useMemo(() => {
    const base = parsed ?? { query: {}, understood: [], source: 'rules' as const };
    const withSlot = !asked && slot ? { ...base, query: { ...base.query, slot }, understood: [`For ${slot}`, ...base.understood] } : base;
    return { ...kernel.answer(withSlot, now), source: withSlot.source, fallbackReason: (withSlot as AskOutcome).fallbackReason };
  }, [kernel, parsed, asked, now, slot, version]);

  const unknownWords = (result.query.include ?? []).filter((w) => !kernel.catalog.some((f) => matchesWord(f, w)));
  const notes = [
    ...(RESTRICTIVE.test(asked) ? [RESTRICTIVE_NOTE] : []),
    ...kernel.notes(result.query, now),
    ...(unknownWords.length ? [`EatOS does not have “${unknownWords.join('”, “')}” yet, so these are the closest picks for you instead.`] : []),
  ];

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
          {PROMPTS.filter((p) => !(kernel.me()?.conditions?.includes('kidney') && /protein/i.test(p))).map((p) => (
            <Chip key={p} label={p} onPress={() => send(p)} />
          ))}
        </Row>
      )}

      {thinking ? <Txt v="small">Thinking…</Txt> : asked && result.source === 'llm' ? <Txt v="small">Read with Claude</Txt> : null}
      {!thinking && asked && result.fallbackReason ? <Txt v="small">{`Read on this device (${result.fallbackReason})`}</Txt> : null}
      <Txt v="body">
        {result.results.length ? `${result.results.length} ${result.results.length === 1 ? 'option fits' : 'options that fit'} right now.` : 'Nothing fits those limits. Try a longer time or fewer exclusions.'}
      </Txt>

      {notes.map((n) => (
        <Card key={n} tone="soft" padding={12}>
          <Txt v="small">{n}</Txt>
        </Card>
      ))}

      {result.results.map((r, i) => (
        <Card key={r.food.id} tone={picked === r.food.id || (!picked && i === 0) ? 'accent' : 'default'}>
          <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Txt v="h3" style={{ flex: 1 }}>{r.food.name}</Txt>
            {i === 0 && !picked ? <Chip label="Best fit" tone="accent" /> : null}
            {picked === r.food.id ? <Chip label="Chosen for you" tone="accent" /> : null}
          </Row>
          <Row wrap gap={6}>
            <Chip label={`${r.food.prepMin} min`} />
            {kernel.me()?.conditions?.includes('kidney') ? null : <Chip label={`${r.food.nutrients.proteinG} g protein`} />}
            {r.food.tags.slice(0, 2).map((t) => (
              <Chip key={t} label={t} />
            ))}
          </Row>
          <Txt v="small">{r.reasons.join('. ')}</Txt>
          {r.missing.length ? <Txt v="small">{`Missing: ${r.missing.join(', ')}`}</Txt> : null}
          <Row wrap gap={8}>
            <Btn small label={r.food.tags.includes('no-cook') ? 'Show me how' : 'Cook this'} onPress={() => router.push(`/cook/${r.food.id}`)} />
            <Btn small kind="outline" label="Love it" onPress={() => submit({ type: 'feedback', foodId: r.food.id, verdict: 'liked' })} />
            <Btn small kind="ghost" label="Not for me" onPress={() => submit({ type: 'feedback', foodId: r.food.id, verdict: 'never' })} />
          </Row>
        </Card>
      ))}

      {result.results.length ? (
        <Row>
          <Btn label="Choose for me" kind="lime" style={{ flex: 1 }} onPress={() => setPicked(chooseForMe(kernel.recommend({ ...result.query, k: 10 }, now))?.food.id ?? null)} />
          <Btn label={why ? 'Hide reasons' : 'Why these?'} kind="outline" style={{ flex: 1 }} onPress={() => setWhy(!why)} />
        </Row>
      ) : null}

      {why ? (
        <Card tone="soft">
          <Txt v="h3">What EatOS used</Txt>
          {[result.source === 'llm' ? 'Read with Claude (you turned this on in Profile)' : 'Read on this device, nothing sent anywhere', ...(result.fallbackReason ? [`Claude was not used: ${result.fallbackReason}`] : []), ...result.understood, result.query.need ? `Biggest need right now: ${result.query.need}` : 'No nutrient gap right now', 'Allergies and diets of everyone eating are always respected', 'Foods you marked "not for me" are left out'].map((l) => (
            <Txt key={l} v="small">{`• ${l}`}</Txt>
          ))}
        </Card>
      ) : null}
    </Screen>
  );
}
