import type { FastingKind } from '@eatos/core';
import { FASTING } from '@eatos/core';
import { useKernel } from './kernel';
import { Card, Chip, Row, Txt } from './ui';

const KINDS: FastingKind[] = ['navratri', 'ekadashi', 'shravan', 'ramzan'];

/** One tap to say you are fasting today; suggestions follow the fast, or say why EatOS will not plan one. */
export function FastingCard() {
  const { kernel, now, submit } = useKernel();
  const active = kernel.state.fasting;
  const off = kernel.state.profile?.tzOffsetMin ?? 0;
  const day = (t: number) => Math.floor((t + off * 60_000) / 86_400_000);
  const today = active && day(active.since) === day(now) ? active.kind : undefined;
  const notes = today ? kernel.notes({}, now) : [];
  return (
    <Card padding={14} style={{ gap: 10 }}>
      <Txt v="label">Fasting today?</Txt>
      <Row wrap gap={8}>
        {KINDS.map((k) => (
          <Chip key={k} label={FASTING[k].label} selected={today === k} onPress={() => submit({ type: 'fasting.set', kind: today === k ? undefined : k })} />
        ))}
      </Row>
      {today && !notes.length ? <Txt v="small">{`Suggestions follow your ${FASTING[today].label.toLowerCase()} today. It lapses at midnight.`}</Txt> : null}
      {notes.map((n) => (
        <Txt key={n} v="small" color="warnText">{n}</Txt>
      ))}
    </Card>
  );
}
