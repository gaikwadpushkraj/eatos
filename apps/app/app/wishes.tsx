import { useState } from 'react';
import { TextInput, View } from 'react-native';
import { router } from 'expo-router';
import type { WishAnswer } from '@eatos/core';
import { useKernel } from '../src/kernel';
import { fonts, useTheme } from '../src/theme';
import { Btn, Card, Chip, Row, Screen, Section, Txt, TopBar } from '../src/ui';

const BLOCKER_LABEL: Record<string, string> = {
  health: 'Health',
  religion: 'Your rules',
  allergy: 'Allergy',
  equipment: 'Kitchen',
  household: 'Household',
  availability: 'Ingredients',
  time: 'Time',
  other: 'Other',
};

/** Something you wish you could eat but can't: why, and the kindest alternatives. */
export default function Wishes() {
  const { kernel, now, submit } = useKernel();
  const { c } = useTheme();
  const [text, setText] = useState('');
  const [focused, setFocused] = useState(false);
  const [answer, setAnswer] = useState<WishAnswer>();
  const [saved, setSaved] = useState(false);

  const find = () => {
    if (!text.trim()) return;
    setAnswer(kernel.wish(text.trim(), now));
    setSaved(false);
  };
  const save = () => {
    if (!answer) return;
    submit({ type: 'wish.logged', wish: answer.wish, blocker: answer.blockers[0]?.kind, foodId: answer.food?.id });
    setSaved(true);
  };
  const wishes = [...kernel.state.wishes].reverse().slice(0, 8);

  return (
    <Screen header={<TopBar title="Wish list" subtitle="What you wish you could eat" />}>
      <Card padding={14} style={{ gap: 12 }}>
        <Txt v="h3">I wish I could eat…</Txt>
        <TextInput
          accessibilityLabel="What do you wish you could eat?"
          value={text}
          onChangeText={setText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onSubmitEditing={find}
          returnKeyType="search"
          placeholder="chicken biryani, pav bhaji, gulab jamun…"
          placeholderTextColor={c.muted}
          style={{ minHeight: 56, borderRadius: 16, borderWidth: 2, borderColor: focused ? c.accent : c.borderStrong, backgroundColor: c.bg, paddingHorizontal: 14, fontFamily: fonts.regular, fontSize: 17, color: c.text, outlineWidth: 0, boxShadow: focused ? `0 0 0 3px ${c.accentSoft}` : undefined }}
        />
        <Btn label="Find alternatives" icon="sparkle" onPress={find} disabled={!text.trim()} />
      </Card>

      {answer ? (
        <View style={{ gap: 12 }} accessibilityLiveRegion="polite">
          <Card tone={answer.blockers.length || answer.unknown ? 'soft' : 'ok'} style={{ gap: 8 }}>
            <Txt v="h3" color={answer.blockers.length || answer.unknown ? 'text' : 'okText'}>{answer.food ? answer.food.name : capitalise(answer.wish)}</Txt>
            {answer.blockers.length ? (
              answer.blockers.map((b) => (
                <Txt key={b.detail} v="small">{`${BLOCKER_LABEL[b.kind] ?? 'Other'}: ${b.detail}`}</Txt>
              ))
            ) : (
              answer.unknown ? null : <Txt v="small" color="okText">Nothing is in the way.</Txt>
            )}
            {answer.later ? <Txt v="small" color={answer.blockers.length || answer.unknown ? 'text' : 'okText'}>{answer.later}</Txt> : null}
          </Card>

          {answer.ladder.map((rung) => (
            <Card key={rung.kind} style={{ gap: 8 }}>
              <Txt v="h3">{rung.title}</Txt>
              <Txt v="small">{rung.why}</Txt>
              <Row wrap gap={8}>
                {rung.foods.map((f) => (
                  <Chip key={f.id} label={f.name} onPress={() => router.push(`/cook/${f.id}`)} />
                ))}
              </Row>
            </Card>
          ))}

          {answer.tips.length ? (
            <Card style={{ gap: 6 }}>
              <Txt v="h3">Small things that help</Txt>
              {answer.tips.map((t) => (
                <Txt key={t.text} v="small">{`${t.text} (${t.evidence === 'trial' ? 'small studies' : t.evidence === 'guideline' ? 'guideline' : 'tradition'})`}</Txt>
              ))}
            </Card>
          ) : null}

          {!answer.ladder.length && answer.blockers.length && !answer.unknown ? <Txt v="small">EatOS found nothing safe to offer for this one. That is the rule doing its job, not a gap in you.</Txt> : null}
          <Btn kind="outline" label={saved ? 'Saved to your wish list' : 'Save to my wish list'} disabled={saved} onPress={save} />
        </View>
      ) : null}

      {wishes.length ? (
        <Section title="Your wishes">
          <Row wrap gap={8}>
            {wishes.map((w) => (
              <Chip
                key={w.id}
                label={w.wish}
                onPress={() => {
                  setText(w.wish);
                  setAnswer(kernel.wish(w.wish, now));
                  setSaved(true);
                }}
              />
            ))}
          </Row>
        </Section>
      ) : null}
    </Screen>
  );
}

function capitalise(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
