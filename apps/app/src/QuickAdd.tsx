import { useEffect, useMemo, useState } from 'react';
import { Platform, TextInput, View } from 'react-native';
import { Link } from 'expo-router';
import { DAY, dayStart, parseQuickAdd, quickAddEvents, readPhotoItems, restockSuggestions, shelfLifeDays } from '@eatos/core';
import type { PhotoImage } from '@eatos/core';
import type { PantryLocation, QuickItem } from '@eatos/core';
import { useKernel } from './kernel';
import { fonts, useTheme } from './theme';
import { Btn, Card, Chip, IconBtn, Row, Txt } from './ui';
import { Icon } from './icons';
import { loadLlmConfig, makePhotoCompleter } from './llm';
import { choosePhoto, photoFromFile, takePhoto } from './photo';
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
  const [photoItems, setPhotoItems] = useState<QuickItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [photoMsg, setPhotoMsg] = useState('');
  const [needsClaude, setNeedsClaude] = useState(false);
  const [dragging, setDragging] = useState(false);

  const parsed = useMemo(() => parseQuickAdd(text, now, tz), [text, now, tz]);
  const items: QuickItem[] = [...parsed, ...photoItems]
    .filter((i) => !edits[i.key]?.removed)
    .map((i) => {
      const location = edits[i.key]?.location ?? i.location;
      // A typical shelf life follows the place: the freezer keeps things for months.
      const expiresAt = i.guessed && edits[i.key]?.location ? dayStart(now, tz) + shelfLifeDays(i.name, location === 'freezer') * DAY : i.expiresAt;
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
    setPhotoItems([]);
    setPhotoMsg('');
  };

  const readPhoto = async (get: () => Promise<PhotoImage | undefined>) => {
    setPhotoMsg('');
    setNeedsClaude(false);
    setBusy(true);
    try {
      const config = await loadLlmConfig();
      const completer = makePhotoCompleter(config);
      if (!completer) {
        setNeedsClaude(true);
        return;
      }
      const image = await get();
      if (!image) return;
      const out = await readPhotoItems(completer, image, Date.now(), tz);
      if (!out.ok) setPhotoMsg(out.reason);
      else if (!out.items.length) setPhotoMsg(out.notes ?? 'No food found in that photo. Try a closer, brighter one.');
      else {
        setPhotoItems((prev) => [...prev, ...out.items.map((it) => ({ ...it, key: `${it.key}:${Date.now()}` }))]);
        setPhotoMsg(`Found ${out.items.length === 1 ? '1 item' : `${out.items.length} items`}. Check them, then add.${out.notes ? ` ${out.notes}` : ''}`);
      }
    } catch (e) {
      setPhotoMsg(e instanceof Error ? e.message : 'The photo could not be read.');
    } finally {
      setBusy(false);
    }
  };

  // On the web a photo can also be dropped anywhere on the page or pasted.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const hasImage = (dt: DataTransfer | null) => !!dt && Array.from(dt.items ?? []).some((i) => i.kind === 'file' && i.type.startsWith('image/'));
    const over = (e: DragEvent) => {
      if (hasImage(e.dataTransfer)) {
        e.preventDefault();
        setDragging(true);
      }
    };
    const leave = (e: DragEvent) => {
      if (!e.relatedTarget) setDragging(false);
    };
    const drop = (e: DragEvent) => {
      setDragging(false);
      const f = Array.from(e.dataTransfer?.files ?? []).find((x) => x.type.startsWith('image/'));
      if (!f) return;
      e.preventDefault();
      readPhoto(() => photoFromFile(f));
    };
    const paste = (e: ClipboardEvent) => {
      const f = Array.from(e.clipboardData?.files ?? []).find((x) => x.type.startsWith('image/'));
      if (!f) return;
      e.preventDefault();
      readPhoto(() => photoFromFile(f));
    };
    document.addEventListener('dragover', over);
    document.addEventListener('dragleave', leave);
    document.addEventListener('drop', drop);
    document.addEventListener('paste', paste);
    return () => {
      document.removeEventListener('dragover', over);
      document.removeEventListener('dragleave', leave);
      document.removeEventListener('drop', drop);
      document.removeEventListener('paste', paste);
    };
  });

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
    <Card padding={14} style={[{ gap: 12 }, dragging ? { borderColor: c.accent, borderWidth: 2, borderStyle: 'dashed' } : null]} tone={dragging ? 'accent' : 'default'}>
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

      <Row wrap gap={8}>
        <Btn label="Take a photo" icon="camera" kind="outline" small disabled={busy} onPress={() => readPhoto(takePhoto)} />
        <Btn label="Choose a photo" icon="image" kind="outline" small disabled={busy} onPress={() => readPhoto(choosePhoto)} />
      </Row>
      <Txt v="small">{dragging ? 'Drop the photo to read it.' : Platform.OS === 'web' ? 'Or drop or paste a photo of your shopping, a shelf or a receipt.' : 'Snap your shopping, a shelf or a receipt and EatOS fills in the details.'}</Txt>
      <View accessibilityLiveRegion="polite">
        {busy ? <Txt v="small">Reading your photo…</Txt> : photoMsg ? <Txt v="small">{photoMsg}</Txt> : null}
        {needsClaude ? (
          <Txt v="small">
            Photo add uses Claude with your own key, and only the photo is sent. <Link href="/profile" style={{ color: c.accentText, textDecorationLine: 'underline' }}>Turn it on in Profile</Link>
          </Txt>
        ) : null}
      </View>

      {items.length ? (
        <View style={{ gap: 8 }} accessibilityLiveRegion="polite">
          {items.map((i) => (
            <View key={i.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: c.surfaceAlt, borderRadius: 14, paddingLeft: 12 }}>
              <View style={{ flex: 1, paddingVertical: 8 }}>
                <Txt v="bodyStrong">{`${capitalise(i.name)}${i.qty !== 1 || i.unit !== 'pc' ? ` · ${i.qty}${i.unit === 'pc' ? '' : ` ${i.unit}`}` : ''}`}</Txt>
                <Txt v="small">{i.uncertain ? 'Not sure about this one. ' : ''}{i.guessed ? `Use by about ${when(i.expiresAt)}` : `Use by ${when(i.expiresAt)}`}</Txt>
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
