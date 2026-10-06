import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { RULE_LABEL, fitFor, fitMatrix, makeMember } from '@eatos/core';
import type { Allergen, Condition, Diet, DietRule } from '@eatos/core';
import { useKernel } from '../../src/kernel';
import { Avatar, Btn, Card, Chip, Field, Row, Screen, Section, Toggle, Txt, useWide } from '../../src/ui';
import { capitalise } from '../../src/format';
import { AvoidList, CONDITIONS } from '../../src/FoodProfile';

const DIETS: Diet[] = ['omnivore', 'pescatarian', 'vegetarian', 'vegan'];
const ALLERGENS: Allergen[] = ['nuts', 'peanuts', 'dairy', 'gluten', 'egg', 'soy', 'fish', 'shellfish', 'sesame'];

export default function Household() {
  const { kernel, now, submit, version } = useKernel();
  const wide = useWide();
  const members = kernel.state.profile?.members ?? [];
  const selfId = kernel.state.profile?.selfId;
  const [request, setRequest] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [diet, setDiet] = useState<Diet>('omnivore');
  const [allergens, setAllergens] = useState<Allergen[]>([]);
  const [mild, setMild] = useState(false);
  const [rules, setRules] = useState<DietRule[]>([]);
  const [conds, setConds] = useState<Condition[]>([]);
  const [editing, setEditing] = useState<string | null>(null);

  const tonight = useMemo(() => kernel.recommend({ slot: 'dinner', k: 3 }, now), [kernel, now, version]);
  const dinners = kernel.catalog.filter((f) => f.slots.includes('dinner') && !f.variantOf);
  // Show the best options plus a few dishes that do not suit everyone, so conflicts are visible.
  // Show the dishes that clash hardest first: a broken rule matters more than a dislike.
  const clash = (f: (typeof dinners)[number]) => members.reduce((n, m) => n + (fitFor(f, m).hard ? 2 : fitFor(f, m).ok ? 0 : 1), 0);
  const conflicts = dinners
    .filter((f) => !tonight.some((r) => r.food.id === f.id) && clash(f) > 0)
    // Dishes that have a safe variant come first, so the swap can be shown.
    .sort((a, b) => clash(b) - clash(a) || Number(kernel.catalog.some((v) => v.variantOf === b.id)) - Number(kernel.catalog.some((v) => v.variantOf === a.id)))
    .slice(0, 3);
  const matrixFoods = [...tonight.map((r) => r.food), ...conflicts];
  const matrix = fitMatrix(matrixFoods, members);
  const resolution = request ? kernel.resolve(request) : undefined;

  return (
    <Screen maxWidth={wide ? 1100 : 720}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Txt v="h1">Household</Txt>
        <Btn small kind="outline" label={adding ? 'Close' : 'Add someone'} onPress={() => setAdding(!adding)} />
      </Row>

      {adding ? (
        <Card>
          <Field label="Name" value={name} onChangeText={setName} placeholder="e.g. Sam" />
          <Row wrap gap={8}>
            {DIETS.map((d) => (
              <Chip key={d} label={capitalise(d)} selected={diet === d} onPress={() => setDiet(d)} />
            ))}
          </Row>
          <Row wrap gap={8}>
            {ALLERGENS.map((a) => (
              <Chip key={a} label={`No ${a}`} selected={allergens.includes(a)} onPress={() => setAllergens(allergens.includes(a) ? allergens.filter((x) => x !== a) : [...allergens, a])} />
            ))}
          </Row>
          <Txt v="label">Rules at home</Txt>
          <Row wrap gap={8}>
            {(Object.keys(RULE_LABEL) as DietRule[]).map((r) => (
              <Chip key={r} label={RULE_LABEL[r]} selected={rules.includes(r)} onPress={() => setRules(rules.includes(r) ? rules.filter((x) => x !== r) : [...rules, r])} />
            ))}
          </Row>
          <Txt v="label">Health needs (optional)</Txt>
          <Row wrap gap={8}>
            {CONDITIONS.map((c) => (
              <Chip key={c.key} label={c.key === 'minor' ? 'Under 18' : c.label} selected={conds.includes(c.key)} onPress={() => setConds(conds.includes(c.key) ? conds.filter((x) => x !== c.key) : [...conds, c.key])} />
            ))}
          </Row>
          <Toggle label="Prefers mild food" value={mild} onChange={setMild} />
          <Btn
            label="Add to household"
            disabled={!name.trim()}
            onPress={() => {
              submit({ type: 'member.added', member: makeMember({ id: `m_${now.toString(36)}`, name: name.trim(), diet, allergens, mild, ...(rules.length ? { rules } : {}), ...(conds.length ? { conditions: conds } : {}) }) });
              setName('');
              setAllergens([]);
              setRules([]);
              setConds([]);
              setAdding(false);
            }}
          />
        </Card>
      ) : null}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {members.map((m, i) => (
          <Card key={m.id} style={{ flexGrow: 1, flexBasis: 150 }}>
            <Row>
              <Avatar name={m.name} tone={i === 0 ? 'accent' : m.allergens.length ? 'warn' : 'ok'} />
              <View style={{ flex: 1 }}>
                <Txt v="h3">{m.name}</Txt>
                <Txt v="small">{m.id === selfId ? 'You' : m.managedBy ? 'Managed by you' : 'Member'}</Txt>
              </View>
            </Row>
            <Row wrap gap={6}>
              <Chip label={capitalise(m.diet)} />
              {m.allergens.map((a) => (
                <Chip key={a} label={`No ${a} · always`} tone="warn" />
              ))}
              {m.mild ? <Chip label="Mild" /> : null}
              {(m.rules ?? []).map((r) => (
                <Chip key={r} label={RULE_LABEL[r]} tone="warn" />
              ))}
              {m.conditions?.includes('minor') ? <Chip label="Under 18" /> : null}
              {m.dislikes.map((d) => (
                <Chip key={d} label={`Dislikes ${d}`} />
              ))}
            </Row>
            <Btn small kind="outline" label={editing === m.id ? 'Done' : 'Edit rules'} accessibilityLabel={`${editing === m.id ? 'Done editing' : 'Edit rules for'} ${m.name}`} onPress={() => setEditing(editing === m.id ? null : m.id)} />
            {editing === m.id ? (
              <View style={{ gap: 8 }}>
                <Row wrap gap={6}>
                  {(Object.keys(RULE_LABEL) as DietRule[]).map((r) => (
                    <Chip key={r} label={RULE_LABEL[r]} selected={!!m.rules?.includes(r)} onPress={() => submit({ type: 'member.added', member: { ...m, rules: m.rules?.includes(r) ? m.rules.filter((x) => x !== r) : [...(m.rules ?? []), r] } })} />
                  ))}
                </Row>
                <Row wrap gap={6}>
                  {CONDITIONS.map((c) => (
                    <Chip key={c.key} label={c.key === 'minor' ? 'Under 18' : c.label} selected={!!m.conditions?.includes(c.key)} onPress={() => submit({ type: 'member.added', member: { ...m, conditions: m.conditions?.includes(c.key) ? m.conditions.filter((x) => x !== c.key) : [...(m.conditions ?? []), c.key] } })} />
                  ))}
                </Row>
                <AvoidList member={m} onChange={(avoid) => submit({ type: 'member.added', member: { ...m, avoid } })} />
              </View>
            ) : null}
            {m.id !== selfId ? <Btn small kind="ghost" label="Remove" accessibilityLabel={`Remove ${m.name}`} onPress={() => submit({ type: 'member.removed', memberId: m.id })} /> : null}
          </Card>
        ))}
      </View>

      {tonight[0] ? (
        <Card tone="ink" padding={20}>
          <Txt v="mono" color="inkMuted">TONIGHT · SHARED DINNER</Txt>
          <Txt v="h2" color="inkText">{tonight[0].food.name}</Txt>
          {members.map((m) => (
            <Row key={m.id} style={{ justifyContent: 'space-between' }}>
              <Txt v="body" color="inkText">{m.name}</Txt>
              <Txt v="small" style={{ color: '#D9F26B' }}>{fitFor(tonight[0]!.food, m).reason}</Txt>
            </Row>
          ))}
        </Card>
      ) : null}

      {members.length > 1 ? (
        <Section title="Who each dinner works for">
          <Card>
            {matrix.map((row) => (
              <View key={row.food.id} style={{ gap: 4, paddingVertical: 6 }}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <Txt v="bodyStrong" style={{ flex: 1 }}>{row.food.name}</Txt>
                  {row.everyone ? <Chip label="Everyone" tone="ok" /> : null}
                </Row>
                <Row wrap gap={6}>
                  {row.fits.map((f) => {
                    const m = members.find((x) => x.id === f.memberId)!;
                    return <Chip key={f.memberId} label={`${m.name}: ${f.ok ? 'yes' : f.reason.toLowerCase()}`} tone={f.ok ? 'ok' : 'warn'} />;
                  })}
                </Row>
              </View>
            ))}
          </Card>
        </Section>
      ) : null}

      <Section title="Two wishes, one meal">
        <Txt v="small">Someone asked for a dish? Pick it and EatOS finds a version everyone can eat.</Txt>
        <Row wrap gap={8}>
          {[...conflicts, ...dinners.filter((f) => !conflicts.includes(f))].slice(0, 8).map((f) => (
            <Chip key={f.id} label={f.name} selected={request === f.id} onPress={() => setRequest(f.id)} />
          ))}
        </Row>
        {resolution ? (
          <Card tone={resolution.substituted ? 'warn' : resolution.chosen === resolution.requested && resolution.reason === 'Works for everyone' ? 'ok' : 'warn'}>
            <Txt v="h3" color={resolution.reason === 'Works for everyone' ? 'okText' : 'warnText'}>{resolution.chosen.name}</Txt>
            <Txt v="small" color={resolution.reason === 'Works for everyone' ? 'okText' : 'warnText'}>{resolution.reason}</Txt>
          </Card>
        ) : null}
      </Section>
    </Screen>
  );
}
