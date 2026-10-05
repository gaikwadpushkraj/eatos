import { useMemo, useState } from 'react';
import { Share } from 'react-native';
import { router } from 'expo-router';
import { useKernel } from '../src/kernel';
import type { EventInput } from '../src/kernel';
import { Btn, Card, Check, IconBtn, Screen, Section, Txt, TopBar } from '../src/ui';
import { aisle, capitalise, shelfLifeDays } from '../src/format';

export default function Grocery() {
  const { kernel, now, submitMany, version } = useKernel();
  const { grocery } = useMemo(() => kernel.week(now), [kernel, now, version]);
  const [checked, setChecked] = useState<string[]>([]);
  const groups = useMemo(() => {
    const map = new Map<string, typeof grocery>();
    for (const g of grocery) map.set(aisle(g.name), [...(map.get(aisle(g.name)) ?? []), g]);
    return [...map.entries()];
  }, [grocery]);
  const allergies = [...new Set((kernel.state.profile?.members ?? []).flatMap((m) => m.allergens))];

  const addToPantry = () => {
    const events: EventInput[] = checked.map((name) => ({
      type: 'pantry.added',
      item: { id: `p_${name.replace(/\s/g, '-')}_${now}`, name, qty: 1, unit: 'pc', location: aisle(name) === 'Produce' ? 'counter' : aisle(name) === 'Dairy and protein' ? 'fridge' : 'cupboard', addedAt: now, expiresAt: now + shelfLifeDays(name) * 86_400_000 },
    }));
    submitMany(events);
    setChecked([]);
    router.back();
  };

  const share = () => {
    const text = groups.map(([g, lines]) => `${g}\n${lines.map((l) => `- ${l.name}`).join('\n')}`).join('\n\n');
    Share.share({ message: `EatOS grocery list\n\n${text}` }).catch(() => {});
  };

  return (
    <Screen
      header={<TopBar title="Grocery list" subtitle={`${grocery.length} items for this week's plan`} right={<IconBtn icon="share" label="Share list" onPress={share} />} />}
      footer={<Btn label={checked.length ? `Add ${checked.length} to pantry` : 'Check items as you shop'} disabled={!checked.length} onPress={addToPantry} />}
    >
      {groups.map(([group, lines]) => (
        <Section key={group} title={group}>
          <Card padding={6} style={{ paddingHorizontal: 14 }}>
            {lines.map((l) => (
              <Check
                key={l.name}
                label={capitalise(l.name)}
                detail={l.meals > 1 ? `${l.meals} meals` : l.slots.join(', ')}
                checked={checked.includes(l.name)}
                onChange={(v) => setChecked(v ? [...checked, l.name] : checked.filter((x) => x !== l.name))}
              />
            ))}
          </Card>
        </Section>
      ))}
      {!grocery.length ? <Txt v="body">Your pantry already covers the week.</Txt> : null}
      {allergies.length ? (
        <Card tone="ok">
          <Txt v="small" color="okText">{`Every meal behind this list is free of ${allergies.join(', ')}.`}</Txt>
        </Card>
      ) : null}
    </Screen>
  );
}
