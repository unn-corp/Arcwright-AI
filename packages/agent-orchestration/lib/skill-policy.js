'use strict';

// Small shared instruction block for project/global hosts and Kiro steering.
// Detailed test design stays in the model-selectable test-quality skill.
const SKILL_POLICY = [
  '',
  'Shared project instructions belong in `AGENTS.md`. Keep required host instruction files as thin imports instead of duplicating rules; preserve host precedence and user-owned material.',
  '',
  '## Skill selection and test effort',
  '',
  'Select the relevant installed skill automatically; read its entrypoint once per task and only the references needed now. Prefer the active project\'s same-named skill; global copies are fallback. Use catalogs and the `arcwright` router without preloading collections. Look up routine facts directly; delegate substantial independent work only when authorized. For writing or reviewing tests, load `test-quality`, then runner guidance as needed. Selection preserves user authorization and host rules.',
  '',
  'Use `subagent-protocol` as the shared delegation lifecycle; team presets, review loops, and implementation workflows add their own stages. Give delegated tasks relevant installed skill paths and a finder, using the `arcwright` capability brief when useful. Suggestions are nonexclusive; read a selected SKILL.md directly if no Skill tool exists. Reuse unchanged briefs.',
  '',
  'Reuse the nearest suitable test and fixtures. Add the smallest tests that detect a plausible defect in changed public behavior; use independent expected values. Skip tests for cosmetic or documentation-only edits unless a concrete risk warrants one. Avoid implementation-mirroring assertions, redundant cases, unnecessary mocks, new harnesses, and arbitrary coverage quotas. Run focused tests first, then required checks; broaden or repeat only for changed code, failures, unresolved risk, or repository requirements. Keep output concise and state unrun checks. Do not start extra agents merely to write routine tests.',
  '',
].join('\n');

module.exports = { SKILL_POLICY };
