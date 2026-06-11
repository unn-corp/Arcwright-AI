# goal-backward-verify — Quick Rules

Goal-backward integration check. Start from stated goals, walk forward through 4 evidence levels. NOT functional QA — proves wiring + data path are real.

**Iron Law:** A capability isn't delivered until real data flows through wired, substantive code.

**The 4 levels (per goal, stop at first FAIL):**
- **L1 Exists** — artifact/file/symbol is present. Cite `path`.
- **L2 Substantive** — real code, not stub/TODO/empty/`NotImplemented`/placeholder return. Cite `path:line`.
- **L3 Wired** — imported / registered / routed / called by the system. Orphans FAIL. Cite import site.
- **L4 Real data** — genuine runtime data flows through; not hardcoded literals, mocks, or fixtures in the prod path. Trace the source.

**Evidence discipline:** every PASS/FAIL cites proof (`path:line`, command output, import site). "Looks done" is never evidence.

**Verdict:** goal PASSes only if every required level passes; overall PASS only if every goal passes.

**Output:** terse VERIFICATION report — overall verdict + per-goal `✓/✗/—` per level, one evidence line each. If writing to a file, invoke `caveman` first.

**Use as:** post-implementation gate (after dev, before review sign-off). FAIL routes back to dev, or to `correct-course` if the goal itself shifted.

Full procedure + report format: `SKILL.md`.
