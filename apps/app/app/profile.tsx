import { useState } from 'react';
import { Platform, Share, View } from 'react-native';
import { router } from 'expo-router';
import type { Goal, Profile } from '@eatos/core';
import { useKernel } from '../src/kernel';
import { useTheme } from '../src/theme';
import type { ThemePref } from '../src/theme';
import { Avatar, Btn, Card, Chip, Row, Screen, Section, Toggle, Txt, TopBar } from '../src/ui';
import { SyncSettings } from '../src/SyncSettings';

const GOALS: { key: Goal; label: string }[] = [
  { key: 'more-protein', label: 'More protein' },
  { key: 'hydration', label: 'Stay hydrated' },
  { key: 'less-waste', label: 'Less food waste' },
  { key: 'energy', label: 'Steady energy' },
  { key: 'performance', label: 'Performance' },
];

export default function ProfileScreen() {
  const { kernel, submit, reset } = useKernel();
  const { pref, setPref } = useTheme();
  const [confirm, setConfirm] = useState(false);
  const profile = kernel.state.profile;
  const me = kernel.me();
  if (!profile || !me) return null;
  const safe = kernel.state.safeModeSince !== undefined;

  const update = (p: Partial<Profile>) => submit({ type: 'profile.set', profile: { ...profile, ...p } });
  const toggleGoal = (g: Goal) => {
    const goals = me.goals.includes(g) ? me.goals.filter((x) => x !== g) : [...me.goals, g];
    update({ members: profile.members.map((m) => (m.id === me.id ? { ...m, goals } : m)) });
  };

  const exportData = () => {
    const json = JSON.stringify(kernel.events, null, 2);
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
      a.download = 'eatos-events.json';
      a.click();
      return;
    }
    Share.share({ message: json }).catch(() => {});
  };

  return (
    <Screen header={<TopBar title="Profile and settings" />}>
      <Row>
        <Avatar name={me.name} />
        <View>
          <Txt v="h2">{me.name}</Txt>
          <Txt v="small">{profile.members.length > 1 ? `Household of ${profile.members.length}` : 'Just you'}</Txt>
        </View>
      </Row>

      <Section title="Goals">
        <Row wrap gap={8}>
          {GOALS.map((g) => (
            <Chip key={g.key} label={g.label} selected={me.goals.includes(g.key)} onPress={() => toggleGoal(g.key)} />
          ))}
        </Row>
      </Section>

      <Card padding={4} style={{ paddingHorizontal: 16 }}>
        <Toggle label="I'm unwell" hint="Safe mode: gentle food, fluids first, goals paused" value={safe} onChange={(v) => submit({ type: v ? 'illness.started' : 'illness.ended' })} />
        <Toggle label="Hide numbers" hint="Show progress without grams or litres" value={!!profile.hideNumbers} onChange={(v) => update({ hideNumbers: v })} />
      </Card>

      <Section title="Appearance">
        <Row gap={8}>
          {(['light', 'dark', 'system'] as ThemePref[]).map((p) => (
            <Chip key={p} label={p === 'system' ? 'System' : p === 'light' ? 'Light' : 'Dark'} selected={pref === p} onPress={() => setPref(p)} />
          ))}
        </Row>
      </Section>

      <Card tone="ok">
        <Txt v="h3" color="okText">Safety floor is on</Txt>
        <Txt v="small" color="okText">{`EatOS never plans below ${profile.floorKcal} kcal a day and never suggests skipping meals. For a medical diet, follow your clinician's plan.`}</Txt>
      </Card>

      <Card>
        <Txt v="h3">Connect your world</Txt>
        <Txt v="small">Calendar, health data, grocery receipts and delivery menus.</Txt>
        <Btn kind="outline" label="Open integrations" onPress={() => router.push('/integrations')} />
      </Card>

      <SyncSettings />

      <Section title="Your data">
        <Txt v="small">{`${kernel.events.length} events stored on this device.`}</Txt>
        <Row wrap>
          <Btn kind="outline" label="Export my data" onPress={exportData} />
          {confirm ? (
            <Btn
              kind="primary"
              label="Yes, delete everything"
              onPress={async () => {
                await reset();
                router.replace('/onboarding');
              }}
            />
          ) : (
            <Btn kind="ghost" label="Delete all data" onPress={() => setConfirm(true)} />
          )}
        </Row>
      </Section>
    </Screen>
  );
}
