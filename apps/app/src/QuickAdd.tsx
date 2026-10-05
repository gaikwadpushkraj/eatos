import { useMemo, useState } from 'react';
import { TextInput, View } from 'react-native';
import { DAY, dayStart, parseQuickAdd, quickAddEvents, restockSuggestions, shelfLifeDays } from '@eatos/core';
import type { PantryLocation, QuickItem } from '@eatos/core';
import { useKernel } from './kernel';
import { fonts, useTheme } from './theme';
import { Btn, Card, Chip, IconBtn, Row, Txt } from './ui';
import { Icon } from './icons';
import { capitalise, LOCATION_LABEL, localOffset } from './format';

const PLACES: PantryLocation[] = ['fridge', 'freezer', 'cupboard', 'counter'];

type Edit = { location?: PantryLocation; removed?: boolean };

/**
 * One box for adding to the pantry: say it the way you would out loud
 * ("2 eggs, spinach till Friday, rice 1 kg"). EatOS shows what it understood,
 * you fix anything with a tap, and one button adds it all.
 */
export function QuickAdd() {
  const { kernel, now, submitMany, version } = useKernel();
  const { c } = useTheme();
  const tz = kernel.state.profile?.tzOffsetMin ?? localOffset();
  const [text, setText] = useState('');
  const [edits, setEdits] = useState<Record<string, Edit>>({});
  const [flash, setFlash] = useState('');
  const [focused, setFocused] = useState(false);

  const parsed = useMemo(() => parseQuickAdd(text, now, tz), [text, now, tz]);
  const items: QuickItem[] = parsed
    .filter((i) => !edits[i.key]?.removed)
    .map((i) => {
      const location = edits[i.key]?.location ?? i.location;
      // A typical shelf life follows the place: the freezer keeps things for months.
      const expiresAt = i.guessed ? dayStart(now, tz) + shelfLifeDays(i.name, location === 'freezer') * DAY : i.expiresAt;
      return { ...i, location, expiresAt };
    });
  const restock = useMemo(() => restockSuggestions(kernel.state, now), [kernel, now, version]);

  const when = (t: number) => new Date(t + tz * 60_000).toUTCString().slice(0, 11);

  const add = () => {
    if (!items.length) return;
    submitMany(quickAddEvents(items, now) as never);
    setFlash(`Added ${items.length === 1 ? capitalise(items[0]!.name) : `${items.length} items`} to your pantry.`);
    setText('');
    setEdits({});
  };

  const addAgain = (name: string) => {
    const [item] = parseQuickAdd(name, now, tz);
    if (!item) return;
    submitMany(quickAddEvents([item], now) as never);
    setFlash(`Added ${capitalise(item.name)} again.`);
  };

  const cycle = (i: QuickItem) => {
    const next = PLACES[(PLACES.indexOf(i.location) + 1) % PLACES.length]!;
    setEdits({ ...edits, [i.key]: { ...edits[i.key], location: next } });
  };

  return (
    <Card padding={14} style={{ gap: 12 }}>
      <Row gap={8}>
        <Icon name="sparkle" size={18} color={c.accent} />
        <Txt v="h3">Add to your pantry</Txt>
      </Row>
      <TextInput
        accessibilityLabel="Add items"
        accessibilityHint="Type or dictate what you bought, for example 2 eggs, spinach till Friday"
        value={text}
        onChangeText={(t) => {
          setText(t);
          setFlash('');
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onSubmitEditing={add}
        returnKeyType="done"
        placeholder="2 eggs, spinach till Friday, rice 1 kg…"
        placeholderTextColor={c.muted}
        autoCapitalize="none"
        // The input is the visible box: an accent border and a soft ring show keyboard focus on the element itself.
        style={{
          minHeight: 56,
          borderRadius: 16,
          borderWidth: 2,
          borderColor: focused ? c.accent : c.borderStrong,
          backgroundColor: c.bg,
          paddingHorizontal: 14,
          fontFamily: fonts.regular,
          fontSize: 17,
          color: c.text,
          outlineWidth: 0,
          boxShadow: focused ? `0 0 0 3px ${c.accentSoft}` : undefined,
        }}
      />

      {items.length ? (
        <View style={{ gap: 8 }} accessibilityLiveRegion="polite">
          {items.map((i) => (
            <View key={i.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: c.surfaceAlt, borderRadius: 14, paddingLeft: 12 }}>
              <View style={{ flex: 1, paddingVertical: 8 }}>
                <Txt v="bodyStrong">{`${capitalise(i.name)}${i.qty !== 1 || i.unit !== 'pc' ? ` · ${i.qty}${i.unit === 'pc' ? '' : ` ${i.unit}`}` : ''}`}</Txt>
                <Txt v="small">{i.guessed ? `Use by about ${when(i.expiresAt)}` : `Use by ${when(i.expiresAt)}`}</Txt>
              </View>
              <Chip label={LOCATION_LABEL[i.location]} tone="accent" onPress={() => cycle(i)} />
              <IconBtn icon="close" label={`Remove ${i.name}`} onPress={() => setEdits({ ...edits, [i.key]: { ...edits[i.key], removed: true } })} />
            </View>
          ))}
          <Txt v="small">Tap a place to change it. Dates marked "about" are typical shelf lives; say "till Friday" to set your own.</Txt>
          <Btn label={items.length === 1 ? 'Add 1 item' : `Add ${items.length} items`} icon="plus" onPress={add} />
        </View>
      ) : text.trim() ? (
        <Txt v="small">Nothing to add yet. Try a name, like "spinach" or "2 eggs".</Txt>
      ) : null}

      {flash ? (
        <View accessibilityLiveRegion="polite">
          <Txt v="small" color="okText">{flash}</Txt>
        </View>
      ) : null}

      {!text.trim() && restock.length ? (
        <View style={{ gap: 6 }}>
          <Txt v="label">Run out? Tap to add again</Txt>
          <Row wrap gap={8}>
            {restock.map((r) => (
              <Chip key={r.name} label={`+ ${capitalise(r.name)}`} onPress={() => addAgain(r.name)} />
            ))}
          </Row>
        </View>
      ) : null}
    </Card>
  );
}
