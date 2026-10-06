import type { FastingKind } from '@eatos/core';
import { FASTING, fastingGate, festivalsOn } from '@eatos/core';
import { useKernel } from './kernel';
import { Btn, Card, Chip, Row, Txt } from './ui';

const KINDS: FastingKind[] = ['navratri', 'ekadashi', 'shravan', 'ramzan'];

/** One tap to say you are fasting today; suggestions follow the fast, or say why EatOS will not plan one. */
export function FastingCard() {
  const { kernel, now, submit } = useKernel();
  const active = kernel.state.fasting;
  const off = kernel.state.profile?.tzOffsetMin ?? 0;
  const day = (t: number) => Math.floor((t + off * 60_000) / 86_400_000);
  const today = active && day(active.since) === day(now) ? active.kind : undefined;
  const notes = today ? kernel.notes({}, now) : [];
  const festivals = festivalsOn(now, off).slice(0, 2);
  const gated = today ? fastingGate(kernel.state.profile?.members ?? []) : undefined;
  return (
    <Card padding={14} style={{ gap: 10 }}>
      {festivals.map((f) => (
        <Card key={f.id} tone="soft" padding={12} style={{ gap: 6 }}>
          <Txt v="bodyStrong">{`Today: ${f.name.split(' (')[0]}`}</Txt>
          {f.eaten ? <Txt v="small">{`Often eaten: ${f.eaten.split(';')[0]}`}</Txt> : null}
          {f.fasting && f.fasting !== 'custom' && today !== f.fasting && !gated ? (
            <Btn small kind="outline" label={`Plan my food for ${FASTING[f.fasting].label.toLowerCase()}`} onPress={() => submit({ type: 'fasting.set', kind: f.fasting! })} />
          ) : null}
          <Txt v="small">Customs differ by family and region. Dates can be a day off.</Txt>
        </Card>
      ))}
      <Txt v="label">Fasting today?</Txt>
      <Row wrap gap={8}>
        {KINDS.map((k) => (
          <Chip key={k} label={FASTING[k].label} selected={today === k} onPress={() => submit({ type: 'fasting.set', kind: today === k ? undefined : k })} />
        ))}
      </Row>
      {today && !gated ? <Txt v="small">{`Suggestions follow your ${FASTING[today].label.toLowerCase()} today. It lapses at midnight.`}</Txt> : null}
      {notes.map((n) => (
        <Txt key={n} v="small" color="warnText">{n}</Txt>
      ))}
    </Card>
  );
}
