# correct-course — Quick Rules

Structured mid-task course-correction when reality diverges from the plan (new constraint, changed requirement, blocker, verification FAIL, new info). Not for new tasks — that's `triage`.

**Procedure:**
1. **Clarify trigger** — what happened, why it breaks the plan, cite evidence (`path:line`/error/spec quote). Ask one question if ambiguous.
2. **Impact analysis** — check each layer: spec, plan/tasks, architecture, implemented code, tests/verification. Mark affected + note.
3. **Before/after proposals** — per affected artifact: `BEFORE → AFTER (why)`. Concrete, not vague.
4. **Classify scope:**
   - **Minor** — one artifact, no interface/goal change → stay with dev.
   - **Moderate** — multi-artifact or plan change, goal stands → route to pm/architect, then dev.
   - **Major** — goal/acceptance or arch boundary changes, big rework → re-spec via analyst/pm; re-run `/triage`.
5. **Route** — name the receiving agent + exact proposals it acts on.

**Rules:** Never relax the goal to fit the plan — if the goal must change, that's Major and goes back to spec. Every proposal needs a before/after or it isn't actionable.

**Output:** terse CORRECTION report — trigger + evidence, impact line, proposals, scope, route. If writing to a file, invoke `caveman` first.

Full procedure + report format: `SKILL.md`.
