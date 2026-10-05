#!/usr/bin/env node
// Creates the EatOS plan as GitHub issues through the REST API: one issue
// per task and one epic per phase (tasks attached as sub-issues), labelled
// by phase, sprint, area and status. Done tasks are created closed.
//
//   gh auth login
//   node scripts/create-issues.mjs            # create
//   node scripts/create-issues.mjs --dry-run  # print only
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const dry = process.argv.includes('--dry-run');
const { repo, epics } = JSON.parse(readFileSync(new URL('../docs/tickets/tickets.json', import.meta.url), 'utf8'));

/** Calls the GitHub REST API with a JSON body via `gh api`. */
function api(method, path, body) {
  if (dry) {
    console.log(method, path, body ? JSON.stringify(body).slice(0, 120) : '');
    return { number: 0, id: 0, html_url: 'https://github.com/dry/run' };
  }
  const args = ['api', '--method', method, `repos/${repo}/${path}`, '--input', '-'];
  const out = execFileSync('gh', args, { input: JSON.stringify(body ?? {}), encoding: 'utf8' });
  return out ? JSON.parse(out) : {};
}

function ensureLabel(name, color) {
  try {
    api('POST', 'labels', { name, color });
  } catch {
    // already exists
  }
}

const labels = new Set(['epic', 'task']);
for (const e of epics) {
  labels.add(`phase-${e.key.slice(1)}`);
  for (const t of e.tasks) {
    labels.add(`sprint-${t.sprint}`);
    labels.add(`area:${t.area}`);
  }
}
for (const l of labels) ensureLabel(l, l === 'epic' ? '5319e7' : l.startsWith('sprint') ? '0e8a16' : l.startsWith('phase') ? 'fbca04' : 'c5def5');

for (const e of epics) {
  const phase = `phase-${e.key.slice(1)}`;
  const created = [];
  for (const t of e.tasks) {
    const body = [
      `Part of **${e.title}**, sprint ${t.sprint}.`,
      '',
      '### Acceptance criteria',
      ...t.acceptance.map((a) => `- [${t.status === 'done' ? 'x' : ' '}] ${a}`),
      '',
      'Plan: `docs/PLAN.md`',
    ].join('\n');
    const issue = api('POST', 'issues', { title: `[${t.key}] ${t.title}`, body, labels: ['task', phase, `sprint-${t.sprint}`, `area:${t.area}`] });
    if (t.status === 'done') api('PATCH', `issues/${issue.number}`, { state: 'closed', state_reason: 'completed' });
    created.push({ t, issue });
  }
  const sprints = [...new Set(e.tasks.map((t) => t.sprint))];
  const body = [
    e.summary,
    '',
    ...sprints.flatMap((s) => [`### Sprint ${s}`, ...created.filter((x) => x.t.sprint === s).map((x) => `- [${x.t.status === 'done' ? 'x' : ' '}] #${x.issue.number} ${x.t.key} ${x.t.title}`), '']),
    'Plan: `docs/PLAN.md`',
  ].join('\n');
  const epic = api('POST', 'issues', { title: `[Epic] ${e.title}`, body, labels: ['epic', phase] });
  for (const { issue } of created) {
    try {
      api('POST', `issues/${epic.number}/sub_issues`, { sub_issue_id: issue.id });
    } catch {
      // sub-issues not available; the checklist still links them
    }
  }
  if (e.tasks.every((t) => t.status === 'done')) api('PATCH', `issues/${epic.number}`, { state: 'closed', state_reason: 'completed' });
  console.log(`${e.title}: ${epic.html_url}`);
}
