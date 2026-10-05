import { useState } from 'react';
import { View } from 'react-native';
import { DAY, deliveryOptions, newCalendarEvents, orderEvents, parseAppleHealth, parseHealthCsv, parseIcs, parseMenu, receiptEvents } from '@eatos/core';
import type { EatEvent, MenuItem } from '@eatos/core';
import { useKernel } from '../src/kernel';
import { pickTextFile } from '../src/pick';
import { Btn, Card, Chip, Field, Row, Screen, Section, Txt, TopBar } from '../src/ui';
import { capitalise, timeLabel } from '../src/format';

type Note = { tone: 'ok' | 'warn'; text: string } | null;

function Result({ note }: { note: Note }) {
  if (!note) return null;
  return (
    <Card tone={note.tone}>
      <Txt v="small" color={note.tone === 'ok' ? 'okText' : 'warnText'}>{note.text}</Txt>
    </Card>
  );
}

/** Adds events the kernel does not have yet; returns how many were new. */
function useImport() {
  const { kernel, submitMany } = useKernel();
  return (events: EatEvent[]) => {
    const fresh = newCalendarEvents(kernel.events.map((e) => e.id), events);
    submitMany(fresh as never);
    return fresh.length;
  };
}

function CalendarCard() {
  const { kernel, now } = useKernel();
  const add = useImport();
  const [text, setText] = useState('');
  const [titles, setTitles] = useState(false);
  const [note, setNote] = useState<Note>(null);

  const run = (source: string) => {
    const off = kernel.state.profile?.tzOffsetMin ?? 0;
    const events = parseIcs(source, { from: now - DAY, to: now + 14 * DAY, titles }, off);
    if (!events.length) return setNote({ tone: 'warn', text: 'No timed meetings found in the next two weeks.' });
    const n = add(events);
    setNote({ tone: 'ok', text: n ? `Added ${n} busy time${n === 1 ? '' : 's'} from your calendar. Meals now move around them.` : 'Already up to date. Nothing new to add.' });
  };

  return (
    <Card>
      <Txt v="h3">Calendar</Txt>
      <Txt v="small">Import an .ics file from any calendar app. EatOS reads only when you are busy, not what the meeting is about.</Txt>
      <Row wrap>
        <Btn small label="Choose .ics file" onPress={async () => {
          const f = await pickTextFile().catch(() => undefined);
          if (f) run(f.text);
        }} />
        <Chip label={titles ? 'Keeping titles' : 'Titles hidden'} selected={titles} onPress={() => setTitles(!titles)} />
      </Row>
      <Field label="Or paste calendar text" value={text} onChangeText={setText} multiline numberOfLines={3} placeholder="BEGIN:VCALENDAR…" />
      <Btn small kind="outline" label="Import pasted calendar" disabled={!text.trim()} onPress={() => run(text)} />
      <Result note={note} />
    </Card>
  );
}

function HealthCard() {
  const add = useImport();
  const [text, setText] = useState('');
  const [note, setNote] = useState<Note>(null);

  const run = (source: string) => {
    const events = /<HealthData|<Record\b|<Workout\b/.test(source) ? parseAppleHealth(source) : parseHealthCsv(source);
    if (!events.length) return setNote({ tone: 'warn', text: 'No workouts, sleep or water found in that data.' });
    const n = add(events);
    const kinds = (t: string) => events.filter((e) => e.type === t).length;
    setNote({ tone: 'ok', text: n ? `Added ${n} new records (${kinds('workout.completed')} workouts, ${kinds('sleep.logged')} nights of sleep, ${kinds('water.logged')} water logs).` : 'Already up to date. Nothing new to add.' });
  };

  return (
    <Card>
      <Txt v="h3">Health data and wearables</Txt>
      <Txt v="small">Import Apple Health's export.xml, or a CSV with the columns type, start, end, value (type is workout, sleep or water).</Txt>
      <Btn small label="Choose health file" onPress={async () => {
        const f = await pickTextFile().catch(() => undefined);
        if (f) run(f.text);
      }} />
      <Field label="Or paste CSV" value={text} onChangeText={setText} multiline numberOfLines={3} placeholder="type,start,end,value" />
      <Btn small kind="outline" label="Import pasted data" disabled={!text.trim()} onPress={() => run(text)} />
      <Result note={note} />
    </Card>
  );
}

function ReceiptCard() {
  const { now } = useKernel();
  const add = useImport();
  const [text, setText] = useState('');
  const [note, setNote] = useState<Note>(null);

  const run = (source: string) => {
    const { events, unknown } = receiptEvents(source, now);
    if (!events.length) return setNote({ tone: 'warn', text: 'No groceries found in that receipt.' });
    const n = add(events);
    setNote({ tone: 'ok', text: `${n ? `Added ${n} items to your pantry.` : 'Already in your pantry.'}${unknown.length ? ` Skipped ${unknown.length} line${unknown.length === 1 ? '' : 's'} it did not recognise.` : ''}` });
  };

  return (
    <Card>
      <Txt v="h3">Grocery receipts</Txt>
      <Txt v="small">Paste an online order or receipt. Items go into your pantry with sensible places and use-by dates.</Txt>
      <Field label="Receipt text" value={text} onChangeText={setText} multiline numberOfLines={4} placeholder={'2 x Bananas 1.20\nGreek Yogurt 500g 3.50'} />
      <Row wrap>
        <Btn small label="Add to pantry" disabled={!text.trim()} onPress={() => run(text)} />
        <Btn small kind="outline" label="Choose file" onPress={async () => {
          const f = await pickTextFile().catch(() => undefined);
          if (f) run(f.text);
        }} />
      </Row>
      <Result note={note} />
    </Card>
  );
}

const SAMPLE_MENU = JSON.stringify(
  [
    { id: 'm1', restaurant: 'Spice Co', name: 'Paneer tikka bowl', allergens: ['dairy'], diet: 'vegetarian', tags: ['warm', 'high-protein'], proteinG: 32, etaMin: 25, priceCents: 1200 },
    { id: 'm2', restaurant: 'Corner Cafe', name: 'Daily special', tags: ['warm'], etaMin: 10, priceCents: 800 },
  ],
  null,
  1,
);

function DeliveryCard() {
  const { kernel, now, submitMany } = useKernel();
  const [text, setText] = useState('');
  const [menu, setMenu] = useState<MenuItem[] | null>(null);
  const [error, setError] = useState('');

  const load = (source: string) => {
    const { items, problems } = parseMenu(source);
    if (!items.length) {
      setMenu(null);
      setError(problems[0] ?? 'No dishes found.');
      return;
    }
    setMenu(items);
    setError(problems.length ? `${problems.length} dish${problems.length === 1 ? '' : 'es'} skipped: ${problems[0]}` : '');
  };

  const shown = menu ? deliveryOptions(kernel.state, menu, { k: 5 }, now) : [];
  const hidden = menu ? menu.length - deliveryOptions(kernel.state, menu, { k: 1000 }, now).length : 0;

  return (
    <Card>
      <Txt v="h3">Food delivery</Txt>
      <Txt v="small">Paste a menu as JSON. Dishes with no allergen information are hidden if anyone eating has an allergy, because unknown is not the same as safe.</Txt>
      <Field label="Menu JSON" value={text} onChangeText={setText} multiline numberOfLines={4} placeholder={SAMPLE_MENU} autoCapitalize="none" autoCorrect={false} />
      <Row wrap>
        <Btn small label="Check menu" disabled={!text.trim()} onPress={() => load(text)} />
        <Btn small kind="outline" label="Try a sample" onPress={() => { setText(SAMPLE_MENU); load(SAMPLE_MENU); }} />
      </Row>
      {error ? <Txt v="small" color="danger">{error}</Txt> : null}
      {menu ? (
        <View style={{ gap: 8 }}>
          {shown.map((o) => (
            <Card key={o.item.id} tone="soft" padding={12}>
              <Txt v="bodyStrong">{`${o.item.name} · ${o.item.restaurant}`}</Txt>
              <Txt v="small">{[o.item.priceCents ? `£${(o.item.priceCents / 100).toFixed(2)}` : '', ...o.reasons].filter(Boolean).join(' · ')}</Txt>
              <Btn small kind="outline" label="I ordered this" onPress={() => submitMany(orderEvents(kernel.state, o.item, kernel.now(now).nextMeal?.slot ?? 'dinner', now) as never)} />
            </Card>
          ))}
          {!shown.length ? <Txt v="small">Nothing on this menu is safe for everyone eating.</Txt> : null}
          {hidden > 0 ? <Txt v="small" color="warnText">{`${hidden} dish${hidden === 1 ? '' : 'es'} hidden for safety.`}</Txt> : null}
        </View>
      ) : null}
    </Card>
  );
}

export default function Integrations() {
  const { kernel, now } = useKernel();
  const synced = kernel.events.filter((e) => e.id?.startsWith('cal:') || e.id?.startsWith('health:') || e.id?.startsWith('pantry.receipt:')).length;
  return (
    <Screen header={<TopBar title="Connect your world" subtitle={`${synced} records imported · ${capitalise(timeLabel(kernel, now))}`} />}>
      <Txt v="body" color="muted">The more EatOS knows about your day, the less you have to log. You choose every connection. Files you import are read on this device, and stay here unless you turn on sync.</Txt>
      <Section title="Day">
        <CalendarCard />
        <HealthCard />
      </Section>
      <Section title="Food">
        <ReceiptCard />
        <DeliveryCard />
      </Section>
    </Screen>
  );
}
