import { Redirect, Tabs } from 'expo-router';
import { useKernel } from '../../src/kernel';
import { useTheme, fonts } from '../../src/theme';
import { useWide } from '../../src/ui';
import { Icon } from '../../src/icons';
import type { IconName } from '../../src/icons';

const TABS: { name: string; title: string; icon: IconName }[] = [
  { name: 'index', title: 'Now', icon: 'clock' },
  { name: 'plan', title: 'Plan', icon: 'calendar' },
  { name: 'pantry', title: 'Pantry', icon: 'pantry' },
  { name: 'household', title: 'Household', icon: 'home' },
];

export default function TabsLayout() {
  const { kernel } = useKernel();
  const { c } = useTheme();
  const wide = useWide();
  if (!kernel.state.profile) return <Redirect href="/onboarding" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarPosition: wide ? 'left' : 'bottom',
        tabBarVariant: wide ? 'material' : 'uikit',
        tabBarActiveTintColor: c.text,
        tabBarInactiveTintColor: c.muted,
        tabBarStyle: { backgroundColor: c.tabBar, borderColor: c.border, ...(wide ? { width: 200, paddingTop: 24 } : { height: 72, paddingTop: 6 }) },
        tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: wide ? 14 : 12 },
        tabBarLabelPosition: wide ? 'beside-icon' : 'below-icon',
        sceneStyle: { backgroundColor: c.bg },
      }}
    >
      {TABS.map((t) => (
        <Tabs.Screen
          key={t.name}
          name={t.name}
          options={{ title: t.title, tabBarIcon: ({ color }) => <Icon name={t.icon} color={String(color)} /> }}
        />
      ))}
    </Tabs>
  );
}
