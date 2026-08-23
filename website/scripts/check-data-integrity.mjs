#!/usr/bin/env node
/**
 * Verify that website/src/data/ still describes things that actually exist.
 *
 * CLAUDE.md requires the agent roster, team catalog and skill list to be kept
 * in sync with the repo by hand, which means they drift. They had: six skill
 * slugs pointing at directories that no longer existed (dead links on the
 * public site), and two agents missing from the roster entirely.
 *
 * NOT wired into `npm run build` on purpose. The Dockerfile builds with
 * website/ as its context, so ../.agents/skills is absent there and a hard
 * check would break Dokploy deploys. It runs in CI, where the whole repo is
 * checked out, and no-ops anywhere the parent repo is not visible.
 *
 *   npm run check:data
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const websiteRoot = path.resolve(here, '..');
const repoRoot = path.resolve(websiteRoot, '..');
const skillsRoot = path.join(repoRoot, '.agents', 'skills');

if (!fs.existsSync(skillsRoot)) {
  console.log('· parent repo not present (Docker build context) — skipping data integrity check');
  process.exit(0);
}

const read = (p) => fs.readFileSync(path.join(websiteRoot, 'src', p), 'utf8');
const matchAll = (src, re) => [...src.matchAll(re)].map((m) => m[1]);
const skillExists = (slug) => fs.existsSync(path.join(skillsRoot, slug, 'SKILL.md'));

const errors = [];

// 1. Every skills.ts slug must resolve to a real skill directory.
const skillsSrc = read('data/skills.ts');
for (const slug of matchAll(skillsSrc, /slug: '([^']+)'/g)) {
  if (!skillExists(slug)) {
    errors.push(`skills.ts: slug '${slug}' has no .agents/skills/${slug}/SKILL.md`);
  }
}

// 2. Every teams.ts code must resolve to a team-<code> skill.
const teamsSrc = read('data/teams.ts');
for (const code of matchAll(teamsSrc, /code: '([^']+)'/g)) {
  if (!skillExists(`team-${code}`)) {
    errors.push(`teams.ts: code '${code}' has no .agents/skills/team-${code}/SKILL.md`);
  }
}

// 3. Every agents.ts icon must be registered in AgentsGrid's ICON_MAP —
//    an unmapped name silently renders a generic Bot instead of failing.
const agentsSrc = read('data/agents.ts');
const gridSrc = read('components/AgentsGrid.tsx');
const iconMap = gridSrc.split('ICON_MAP')[1] ?? '';
for (const icon of matchAll(agentsSrc, /icon: '([^']+)'/g)) {
  if (!new RegExp(`\\b${icon}\\b`).test(iconMap)) {
    errors.push(`agents.ts: icon '${icon}' is not in AgentsGrid ICON_MAP (would fall back to Bot)`);
  }
}

// 4. Every skill named on an agent card must resolve to an installed skill.
//    Without this, a stale primarySkills slug becomes public misinformation.
for (const [, agent, skills] of agentsSrc.matchAll(
  /name: '([^']+)',[\s\S]*?primarySkills: \[([\s\S]*?)\]/g,
)) {
  for (const slug of matchAll(skills, /'([^']+)'/g)) {
    if (!skillExists(slug)) {
      errors.push(`agents.ts: ${agent} references missing primary skill '${slug}'`);
    }
  }
}

if (errors.length) {
  console.error('\n✗ website data integrity check failed:\n');
  for (const e of errors) console.error(`   ${e}`);
  console.error('');
  process.exit(1);
}

const counts = {
  skills: matchAll(skillsSrc, /slug: '([^']+)'/g).length,
  teams: matchAll(teamsSrc, /code: '([^']+)'/g).length,
  agents: matchAll(agentsSrc, /icon: '([^']+)'/g).length,
};
console.log(
  `✓ website data integrity: ${counts.skills} skills, ${counts.teams} teams, ${counts.agents} agents all resolve`
);
