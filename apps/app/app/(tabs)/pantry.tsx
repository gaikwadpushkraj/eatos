import { useMemo, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import type { PantryLocation } from '@eatos/core';
import { useKernel } from '../../src/kernel';
import { useTheme, fonts } from '../../src/theme';
import { Btn, Card, Chip, Field, Row, Screen, Section, Txt, useWide } from '../../src/ui';
import { Icon } from '../../src/icons';
import { capitalise, daysLabel, LOCATION_LABEL } from '../../src/format';

type Filter = 'all' | 'soon' | PantryLocation;
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'soon', label: 'Use soon' },
  { key: 'fridge', label: 'Fridge' },
  { key: 'freezer', label: 'Freezer' },
  { key: 'cupboard', label: 'Cupboard' },
  { key: 'counter', label: 'Counter' },
];

export default function Pantry() {
  const { kernel, now, submit, version } = useKernel();
  const { c } = useTheme();
  const wide = useWide();
  const items = useMemo(() => kernel.pantry(now), [kernel, now, version]);
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [location, setLocation] = useState<PantryLocation>('fridge');
  const [days, setDays] = useState('5');

  const soon = items.filter((i) => i.status === 'use-soon');
  const shown = items.filter(
    (i) => (filter === 'all' || (filter === 'soon' ? i.status === 'use-soon' : i.location === filter)) && i.name.toLowerCase().includes(search.toLowerCase()),
  );

  const add = () => {
    const n = name.trim().toLowerCase();
    if (!n) return;
    submit({ type: 'pantry.added', item: { id: `p_${n.replace(/\s/g, '-')}_${now}`, name: n, qty: 1, unit: 'pc', location, addedAt: now, expiresAt: Number(days) > 0 ? now + Number(days) * 86_400_000 : undefined } });
    setName('');
    setAdding(false);
  };

  return (
    <Screen maxWidth={wide ? 1000 : 720}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Txt v="h1">Pantry</Txt>
        <Txt v="mono">{`${items.length} items`}</Txt>
      </Row>

      <View style={{ minHeight: 48, borderRadius: 14, backgroundColor: c.surface, borderWidth: 1, borderColor: c.borderStrong, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14 }}>
        <Icon name="search" size={18} color={c.muted} />
        <TextInput accessibilityLabel="Search pantry" value={search} onChangeText={setSearch} placeholder="Search what you have" placeholderTextColor={c.muted} style={{ flex: 1, minHeight: 44, fontFamily: fonts.regular, fontSize: 15, color: c.text }} />
      </View>

      <Row wrap gap={8}>
        {FILTERS.map((f) => (
          <Chip key={f.key} label={f.label} selected={filter === f.key} onPress={() => setFilter(f.key)} />
        ))}
      </Row>

      {soon.length ? (
        <Pressable accessibilityRole="button" onPress={() => router.push('/ask')}>
          <Card tone="ink">
            <Txt v="h3" color="inkText">Cook with what's expiring</Txt>
            <Txt v="small" color="inkMuted">{`${soon.map((s) => s.name).join(', ')} should be used soon. Suggestions already put them first.`}</Txt>
          </Card>
        </Pressable>
      ) : null}

      <Section title={filter === 'soon' ? 'Use in the next 2 days' : 'Items'}>
        {shown.map((i) => (
          <Card key={i.id} padding={12}>
            <Row>
              <View style={{ flex: 1 }}>
                <Txt v="bodyStrong">{capitalise(i.name)}</Txt>
                <Txt v="small">{`${LOCATION_LABEL[i.location]} · ${i.qty} ${i.unit}`}</Txt>
              </View>
              <Chip label={daysLabel(i.daysLeft)} tone={i.status === 'use-soon' ? 'warn' : undefined} />
              <Btn small kind="ghost" label="Used" accessibilityLabel={`Mark ${i.name} as used`} onPress={() => submit({ type: 'pantry.used', itemId: i.id })} />
            </Row>
          </Card>
        ))}
        {!shown.length ? <Txt v="small">Nothing here.</Txt> : null}
      </Section>

      {adding ? (
        <Card>
          <Field label="Item" value={name} onChangeText={setName} placeholder="e.g. spinach" autoFocus />
          <Row wrap gap={8}>
            {(Object.keys(LOCATION_LABEL) as PantryLocation[]).map((l) => (
              <Chip key={l} label={LOCATION_LABEL[l]} selected={location === l} onPress={() => setLocation(l)} />
            ))}
          </Row>
          <Field label="Days until it expires" value={days} onChangeText={setDays} keyboardType="numeric" />
          <Row>
            <Btn label="Cancel" kind="outline" onPress={() => setAdding(false)} style={{ flex: 1 }} />
            <Btn label="Add" onPress={add} disabled={!name.trim()} style={{ flex: 1 }} />
          </Row>
        </Card>
      ) : (
        <Row>
          <Btn label="Grocery list" kind="outline" onPress={() => router.push('/grocery')} style={{ flex: 1 }} />
          <Btn label="Add item" icon="plus" onPress={() => setAdding(true)} style={{ flex: 1 }} />
        </Row>
      )}
    </Screen>
  );
}
