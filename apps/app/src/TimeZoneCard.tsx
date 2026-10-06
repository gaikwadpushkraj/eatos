import { useKernel } from './kernel';
import { localOffset } from './format';
import { Btn, Card, Txt } from './ui';

const label = (m: number) => `UTC${m >= 0 ? '+' : '-'}${Math.floor(Math.abs(m) / 60)}${Math.abs(m) % 60 ? `:${String(Math.abs(m) % 60).padStart(2, '0')}` : ''}`;

/** Travelling: when the phone's time zone no longer matches the plan, offer to move meals and water with it. */
export function TimeZoneCard() {
  const { kernel, submit } = useKernel();
  const profile = kernel.state.profile;
  const here = localOffset();
  if (!profile || profile.tzOffsetMin === here) return null;
  return (
    <Card tone="soft" padding={14} style={{ gap: 8 }}>
      <Txt v="h3">New time zone?</Txt>
      <Txt v="small">{`Your phone is on ${label(here)}, but your plan is on ${label(profile.tzOffsetMin)}. Move your meals and water to local time?`}</Txt>
      <Btn small label="Use local time" onPress={() => submit({ type: 'profile.set', profile: { ...profile, tzOffsetMin: here } })} />
    </Card>
  );
}
