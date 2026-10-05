import { View } from 'react-native';
import { router } from 'expo-router';
import type { Goal, Profile } from '@eatos/core';
import { useKernel } from '../src/kernel';
import { useTheme } from '../src/theme';
import type { ThemePref } from '../src/theme';
import { Avatar, Btn, Card, Chip, Row, Screen, Section, Toggle, Txt, TopBar } from '../src/ui';
import { SyncSettings } from '../src/SyncSettings';
import { LlmSettings } from '../src/LlmSettings';
import { FoodProfile } from '../src/FoodProfile';
import { BackupAndDelete, DeviceProtection } from '../src/ProtectionSettings';

const GOALS: { key: Goal; label: string }[] = [
  { key: 'more-protein', label: 'More protein' },
  { key: 'hydration', label: 'Stay hydrated' },
  { key: 'less-waste', label: 'Less food waste' },
  { key: 'energy', label: 'Steady energy' },
  { key: 'performance', label: 'Performance' },
];

export default function ProfileScreen() {
  const { kernel, submit } = useKernel();
  const { pref, setPref } = useTheme();
  const profile = kernel.state.profile;
  const me = kernel.me();
  if (!profile || !me) return null;
  const safe = kernel.state.safeModeSince !== undefined;

  const update = (p: Partial<Profile>) => submit({ type: 'profile.set', profile: { ...profile, ...p } });
  const toggleGoal = (g: Goal) => {
    const goals = me.goals.includes(g) ? me.goals.filter((x) => x !== g) : [...me.goals, g];
    update({ members: profile.members.map((m) => (m.id === me.id ? { ...m, goals } : m)) });
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

      <FoodProfile />

      <Card>
        <Txt v="h3">Teach EatOS your taste</Txt>
        <Txt v="small">Eight quick taps on dishes that fit your rules.</Txt>
        <Btn kind="outline" label="Start the taste cards" onPress={() => router.push('/taste')} />
      </Card>

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

      <LlmSettings />

      <DeviceProtection />

      <BackupAndDelete />
    </Screen>
  );
}
