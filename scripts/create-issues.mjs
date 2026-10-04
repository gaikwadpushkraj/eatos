#!/usr/bin/env node
// Creates the EatOS plan as GitHub issues: one epic per phase and one
// issue per task, labelled by phase, sprint, area and status. Done tasks
// are created closed so the board reflects progress.
//
//   gh auth login
//   node scripts/create-issues.mjs            # create
//   node scripts/create-issues.mjs --dry-run  # print only
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const dry = process.argv.includes('--dry-run');
const { repo, epics } = JSON.parse(readFileSync(new URL('../docs/tickets/tickets.json', import.meta.url), 'utf8'));

function gh(args) {
  if (dry) {
    console.log('gh', args.map((a) => (a.includes(' ') ? JSON.stringify(a) : a)).join(' '));
    return 'https://github.com/dry/run/issues/0';
  }
  return execFileSync('gh', args, { encoding: 'utf8' }).trim();
}

function ensureLabel(name, color) {
  if (dry) return;
  try {
    execFileSync('gh', ['label', 'create', name, '--repo', repo, '--color', color, '--force'], { stdio: 'ignore' });
  } catch {
    // already exists or no permission; issue creation will report it
  }
}

const labels = new Set();
for (const e of epics) {
  labels.add(`phase-${e.key.slice(1)}`);
  for (const t of e.tasks) {
    labels.add(`sprint-${t.sprint}`);
    labels.add(`area:${t.area}`);
  }
}
for (const l of ['epic', 'task', ...labels]) ensureLabel(l, l === 'epic' ? '5319e7' : l.startsWith('sprint') ? '0e8a16' : 'c5def5');

for (const e of epics) {
  const phase = `phase-${e.key.slice(1)}`;
  const taskUrls = [];
  for (const t of e.tasks) {
    const body = [`Part of **${e.title}**, sprint ${t.sprint}.`, '', '### Acceptance criteria', ...t.acceptance.map((a) => `- [${t.status === 'done' ? 'x' : ' '}] ${a}`), '', 'Plan: `docs/PLAN.md`'].join('\n');
    const url = gh(['issue', 'create', '--repo', repo, '--title', `[${t.key}] ${t.title}`, '--body', body, '--label', ['task', phase, `sprint-${t.sprint}`, `area:${t.area}`].join(',')]);
    if (t.status === 'done') gh(['issue', 'close', url, '--repo', repo, '--reason', 'completed']);
    taskUrls.push({ t, url });
  }
  const sprints = [...new Set(e.tasks.map((t) => t.sprint))];
  const body = [
    e.summary,
    '',
    ...sprints.flatMap((s) => [`### Sprint ${s}`, ...taskUrls.filter((x) => x.t.sprint === s).map((x) => `- [${x.t.status === 'done' ? 'x' : ' '}] ${x.t.key} ${x.t.title} ${x.url}`), '']),
    'Plan: `docs/PLAN.md`',
  ].join('\n');
  const epicUrl = gh(['issue', 'create', '--repo', repo, '--title', `[Epic] ${e.title}`, '--body', body, '--label', ['epic', phase].join(',')]);
  if (e.tasks.every((t) => t.status === 'done')) gh(['issue', 'close', epicUrl, '--repo', repo, '--reason', 'completed']);
  console.log(`${e.title}: ${epicUrl}`);
}
