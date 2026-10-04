import { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { intakeToday, PRIORITY_LABEL } from '@eatos/core';
import type { HealthCheck, Task } from '@eatos/core';
import { useKernel } from '../../src/kernel';
import { useTheme } from '../../src/theme';
import { Avatar, Btn, Card, Chip, Dot, Meter, Row, Screen, Section, Txt, useWide } from '../../src/ui';
import { Icon } from '../../src/icons';
import { greeting, timeLabel } from '../../src/format';
import { eatFood } from '../../src/actions';

function statusTone(task: Task): { label: string; tone?: 'ok' | 'warn' | 'accent' } {
  if (task.state === 'done') return { label: 'Done', tone: 'ok' };
  if (task.state === 'active') return { label: 'Now', tone: 'accent' };
  if (task.state === 'deferred') return { label: 'Folded in' };
  if (task.state === 'skipped') return { label: task.overdue ? 'Missed' : 'Skipped' };
  if (task.movedFrom) return { label: 'Moved', tone: 'warn' };
  return { label: task.overdue ? 'Missed' : 'Queued' };
}

function HealthTile({ check, hide }: { check: HealthCheck; hide?: boolean }) {
  const { c } = useTheme();
  const ratio = check.target ? check.actual / check.target : 0;
  const color = check.status === 'critical' ? c.warnFill : c.accent;
  const unit = check.unit === 'ml' ? 'L' : check.unit;
  const fmt = (n: number) => (check.unit === 'ml' ? (n / 1000).toFixed(1) : String(Math.round(n)));
  const word = { ok: 'On track', behind: 'A bit behind', critical: 'Behind', paused: 'Paused' }[check.status];
  return (
    <Card padding={12} style={{ flex: 1, minWidth: 100, gap: 8 }}>
      <Txt v="small">{check.label}</Txt>
      {hide ? (
        <Txt v="h3">{word}</Txt>
      ) : (
        <Txt v="h3">
          {fmt(check.actual)}
          <Txt v="small">{` / ${fmt(check.target)} ${unit}`}</Txt>
        </Txt>
      )}
      <Meter value={ratio} color={color} />
    </Card>
  );
}

function NextUp() {
  const { kernel, now, submitMany } = useKernel();
  const { c } = useTheme();
  const view = kernel.now(now);
  const meal = view.nextMeal;
  const rec = view.suggestion;
  if (!meal || !rec) {
    return (
      <Card tone="ink">
        <Txt v="mono" color="inkMuted">ALL DONE FOR TODAY</Txt>
        <Txt v="h2" color="inkText">Nothing else is planned. Rest well.</Txt>
      </Card>
    );
  }
  const reasons = [...meal.reasons, ...rec.reasons].slice(0, 3);
  return (
    <Card tone="ink" padding={20} style={{ gap: 14 }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Txt v="mono" color="inkMuted">{`NEXT UP · ${meal.title.toUpperCase()} · ${timeLabel(kernel, meal.at)}`}</Txt>
        <View style={{ backgroundColor: c.lime, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
          <Txt v="mono" style={{ color: c.onLime }}>{`P${meal.priority} · ${PRIORITY_LABEL[meal.priority]}`}</Txt>
        </View>
      </Row>
      <Txt v="h1" color="inkText">{rec.food.name}</Txt>
      <Txt v="body" color="inkMuted">{reasons.join('. ')}.</Txt>
      <Row wrap>
        <Btn label="Start cooking" kind="lime" onPress={() => router.push(`/cook/${rec.food.id}`)} style={{ flexGrow: 1 }} />
        <Btn label="Other options" kind="onInk" onPress={() => router.push(`/ask?slot=${meal.slot ?? ''}`)} style={{ flexGrow: 1 }} />
      </Row>
      <Pressable accessibilityRole="button" onPress={() => eatFood(kernel, submitMany, rec.food, meal.slot ?? 'snack')}>
        <Txt v="small" color="inkMuted" style={{ textDecorationLine: 'underline' }}>I already ate this</Txt>
      </Pressable>
    </Card>
  );
}

function ActiveTask() {
  const { kernel, now, submit } = useKernel();
  const task = kernel.now(now).next;
  if (!task || task.kind === 'meal' || task.state !== 'active') return null;
  const water = intakeToday(kernel.state, kernel.catalog, now).waterMl;
  const ml = task.waterMl ? Math.max(250, Math.round((task.waterMl - water) / 50) * 50) : 250;
  return (
    <Card tone="accent">
      <Row style={{ justifyContent: 'space-between' }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Txt v="mono" color="accentText">{`NOW · P${task.priority} ${PRIORITY_LABEL[task.priority].toUpperCase()}`}</Txt>
          <Txt v="h3">{task.title}</Txt>
          {task.reasons[0] ? <Txt v="small">{task.reasons[0]}</Txt> : null}
        </View>
        <Btn
          small
          label={task.kind === 'hydration' ? 'Done' : task.kind === 'medication' ? 'Taken' : 'Done'}
          onPress={() => {
            if (task.kind === 'hydration') submit({ type: 'water.logged', ml });
            else if (task.kind === 'medication') submit({ type: 'medication.taken', name: task.id.slice(4) });
            else submit({ type: 'task.done', taskId: task.id });
          }}
        />
      </Row>
    </Card>
  );
}

function Adjusted() {
  const { kernel, now } = useKernel();
  const upcoming = kernel.schedule(now).filter((t) => (t.state === 'queued' || t.state === 'active') && t.deadline >= now);
  const lines = upcoming.flatMap((t) => {
    if (t.movedFrom) return [`${t.title} moved to ${timeLabel(kernel, t.at)}. ${t.reasons[0] ?? ''}.`];
    if (t.light) return [`${t.title} at ${timeLabel(kernel, t.at)}: ${(t.reasons[0] ?? 'kept light').toLowerCase()}.`];
    return [];
  });
  const safe = kernel.state.safeModeSince !== undefined;
  if (!lines.length && !safe) return null;
  return (
    <Card tone="warn">
      <Row style={{ alignItems: 'flex-start' }}>
        <WarnIcon />
        <View style={{ flex: 1, gap: 4 }}>
          <Txt v="h3" color="warnText">{safe ? 'Safe mode is on' : 'Plan adjusted'}</Txt>
          {safe ? <Txt v="small" color="warnText">Gentle food, fluids first, goals paused. Turn it off in Profile when you feel better.</Txt> : null}
          {lines.map((l) => (
            <Txt key={l} v="small" color="warnText">{l}</Txt>
          ))}
        </View>
      </Row>
    </Card>
  );
}

function WarnIcon() {
  const { c } = useTheme();
  return <Icon name="pulse" size={20} color={c.warnText} />;
}

function Schedule({ compact }: { compact?: boolean }) {
  const { kernel, now } = useKernel();
  const tasks = kernel.schedule(now).filter((t) => (compact ? t.state === 'queued' && t.at > now : t.state !== 'deferred'));
  const list = compact ? tasks.slice(0, 3) : tasks;
  return (
    <Section title={compact ? 'Coming up' : "Today's schedule"}>
      {list.map((t) => {
        const s = statusTone(t);
        return (
          <Card key={t.id} padding={12} tone={t.state === 'active' ? 'accent' : 'default'}>
            <Row>
              <Txt v="mono" style={{ width: 48 }}>{timeLabel(kernel, t.at)}</Txt>
              <View style={{ flex: 1 }}>
                <Txt v="bodyStrong">{t.title}</Txt>
                {!compact && t.reasons[0] ? <Txt v="small">{t.reasons[0]}</Txt> : null}
              </View>
              <Chip label={compact ? `P${t.priority}` : s.label} tone={compact ? undefined : s.tone} />
            </Row>
          </Card>
        );
      })}
      {!list.length ? <Txt v="small">Nothing else today.</Txt> : null}
    </Section>
  );
}

function WhyChanged() {
  const { kernel, now } = useKernel();
  const lines = kernel.log(now);
  if (!lines.length) return null;
  return (
    <Section title="Why the plan changed">
      {lines.map((l) => (
        <Card key={`${l.at}-${l.source}`} tone="soft" padding={14}>
          <Txt v="mono">{`${timeLabel(kernel, l.at)} · ${l.source.toUpperCase()}`}</Txt>
          <Txt v="small" color="text">{l.text}</Txt>
        </Card>
      ))}
    </Section>
  );
}

function HouseholdMini() {
  const { kernel } = useKernel();
  const members = kernel.state.profile?.members ?? [];
  if (members.length < 2) return null;
  return (
    <Card>
      <Txt v="h3">Household</Txt>
      {members.map((m, i) => (
        <Row key={m.id}>
          <Avatar name={m.name} tone={i === 0 ? 'accent' : m.allergens.length ? 'warn' : 'ok'} />
          <Txt v="body" style={{ flex: 1 }}>{m.id === kernel.state.profile?.selfId ? `${m.name} · you` : m.name}</Txt>
          <Txt v="small">{m.allergens.length ? `No ${m.allergens.join(', ')}` : m.diet}</Txt>
        </Row>
      ))}
    </Card>
  );
}

function AskBar() {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="search"
      accessibilityLabel="Ask EatOS what to eat"
      onPress={() => router.push('/ask')}
      style={{ minHeight: 52, borderRadius: 26, backgroundColor: c.surface, borderWidth: 1, borderColor: c.borderStrong, flexDirection: 'row', alignItems: 'center', paddingLeft: 18, paddingRight: 6, gap: 8 }}
    >
      <Txt v="body" color="muted" style={{ flex: 1 }}>What sounds good right now?</Txt>
      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="chat" size={18} color={c.onAccent} />
      </View>
    </Pressable>
  );
}

export default function Now() {
  const { kernel, now, submit, version } = useKernel();
  const { c } = useTheme();
  const wide = useWide();
  const view = useMemo(() => kernel.now(now), [kernel, now, version]);
  const me = kernel.me();
  const hide = kernel.state.profile?.hideNumbers;
  const checks = view.checks.filter((ch) => ch.key !== 'energy-floor');
  const floor = view.checks.find((ch) => ch.key === 'energy-floor');
  const dotColor = view.status === 'System steady' ? c.okDot : c.warnFill;

  const header = (
    <Row style={{ justifyContent: 'space-between' }}>
      <View style={{ gap: 4, flex: 1 }}>
        <Row gap={8}>
          <Dot color={dotColor} />
          <Txt v="mono">{view.status}</Txt>
        </Row>
        <Txt v={wide ? 'display' : 'h1'}>{`${greeting(kernel, now)}, ${me?.name ?? 'there'}`}</Txt>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Profile and settings" onPress={() => router.push('/profile')}>
        <Avatar name={me?.name ?? 'You'} />
      </Pressable>
    </Row>
  );

  const tiles = (
    <Row gap={10} wrap>
      {checks.map((ch) => (
        <HealthTile key={ch.key} check={ch} hide={hide} />
      ))}
    </Row>
  );

  const quick = (
    <Row wrap gap={8}>
      <Chip label="+ 250 ml water" onPress={() => submit({ type: 'water.logged', ml: 250 })} />
      <Chip label="I worked out" onPress={() => submit({ type: 'workout.completed', minutes: 45, intensity: 'moderate' })} />
      <Chip label="Ask EatOS" onPress={() => router.push('/ask')} />
    </Row>
  );

  const floorAlert =
    floor?.status === 'critical' ? (
      <Card tone="warn">
        <Txt v="h3" color="warnText">A proper meal comes first</Txt>
        <Txt v="small" color="warnText">{floor.note}</Txt>
      </Card>
    ) : null;

  if (wide) {
    return (
      <Screen maxWidth={1240}>
        {header}
        <AskBar />
        <View style={{ flexDirection: 'row', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <View style={{ flexGrow: 999, flexBasis: 520, minWidth: 0, gap: 16 }}>
            <ActiveTask />
            <Adjusted />
            <Schedule />
            <WhyChanged />
          </View>
          <View style={{ flexGrow: 1, flexBasis: 340, minWidth: 0, gap: 16 }}>
            {floorAlert}
            <NextUp />
            <Card>
              <Txt v="h3">Health checks</Txt>
              {tiles}
            </Card>
            {quick}
            <HouseholdMini />
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      {header}
      {floorAlert}
      <NextUp />
      <ActiveTask />
      {tiles}
      <Adjusted />
      {quick}
      <Schedule compact />
      <AskBar />
    </Screen>
  );
}
