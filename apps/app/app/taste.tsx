import { useMemo, useState } from 'react';
import { router } from 'expo-router';
import { useKernel } from '../src/kernel';
import { Btn, Card, Row, Screen, Txt, TopBar } from '../src/ui';
import { capitalise } from '../src/format';

const SPICE = ['No spice', 'Mild', 'Medium', 'Hot'];

/** "Would you eat this?" taps that teach EatOS your taste. Eight dishes, all skippable. */
export default function Taste() {
  const { kernel, now, submit } = useKernel();
  const cards = useMemo(() => kernel.tasteCards(now, 8), []);
  const [i, setI] = useState(0);
  const [seen, setSeen] = useState(0);
  const food = cards[i];

  const answer = (verdict?: 'liked' | 'skip' | 'never') => {
    if (food && verdict) {
      submit({ type: 'feedback', foodId: food.id, verdict });
      setSeen(seen + 1);
    }
    setI(i + 1);
  };

  return (
    <Screen header={<TopBar title="Your taste" subtitle={food ? `${Math.min(i + 1, cards.length)} of ${cards.length}` : undefined} />}>
      {food ? (
        <Card padding={20} style={{ gap: 14 }}>
          <Txt v="label">Would you eat this?</Txt>
          <Txt v="h1">{food.name}</Txt>
          <Txt v="small">{[food.cuisine ? capitalise(food.cuisine.replace('-', ' ')) : '', food.spice !== undefined ? SPICE[food.spice] : '', `${food.prepMin} min`].filter(Boolean).join(' · ')}</Txt>
          <Row wrap>
            <Btn label="Yes, love it" kind="primary" onPress={() => answer('liked')} style={{ flexGrow: 1 }} />
            <Btn label="Not today" kind="outline" onPress={() => answer('skip')} style={{ flexGrow: 1 }} />
          </Row>
          <Row wrap>
            <Btn label="Never for me" kind="outline" onPress={() => answer('never')} style={{ flexGrow: 1 }} />
            <Btn label="Skip" kind="ghost" onPress={() => answer()} style={{ flexGrow: 1 }} />
          </Row>
          <Txt v="small">Only dishes that fit your rules and allergies are shown. "Never" removes a dish from your suggestions for a year.</Txt>
        </Card>
      ) : (
        <Card tone="ok" style={{ gap: 10 }}>
          <Txt v="h2" color="okText">{seen ? 'Thanks, EatOS knows you better' : 'All done'}</Txt>
          <Txt v="small" color="okText">{seen ? `You answered ${seen}. Suggestions already lean toward what you enjoy, and it keeps learning as you eat.` : 'You can come back any time from Profile.'}</Txt>
          <Btn label="Back to Today" onPress={() => router.replace('/')} />
        </Card>
      )}
    </Screen>
  );
}
