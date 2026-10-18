# Behavioral comparisons for skills and workflows

Use this when deciding whether a skill or prompt edit earns its complexity. It extends the existing evaluation method; it does not install BMad's eval runner.

## Select the question

| Mode | Compare | What it can establish |
| --- | --- | --- |
| Baseline | Skill-guided vs the same model without that skill | Incremental value over ordinary capability |
| Variant | Edited skill vs previous version or a short outcome/consumer version | What changed, including regressions and unnecessary ceremony |
| Quality | One configuration vs a declared rubric | Whether the requested outcome met the bar |
| Trigger | Should-load and should-not-load requests sharing terms | Discovery boundaries and name collisions |

Keep input, fixture bytes, model/provider/version, host instructions, tools, permissions, and inference settings equivalent between arms. Record unavoidable differences and narrow the claim. A bare-model arm still obeys system/user policy; omit only the skill being tested. Use callable native Arcwright Code / T3 Code or host tools and actual model IDs. Do not bypass authorization or limits for an experiment. When delegation is prohibited, perform bounded paper cases and mark them as such rather than claiming independent live results.

## Cases and evidence

A reusable case contains an ID, realistic user input, independently chosen rubric, fixture files, and optional prior-turn state. For example:

```json
{
  "id": "resume-with-changed-evidence",
  "input": "Review the updated diff using the prior review record.",
  "state_prefix": "The earlier finding was rejected before its caller changed.",
  "files": ["fixtures/before.diff", "fixtures/after.diff", "fixtures/review.md"],
  "rubric": [
    "Rechecks the changed caller rather than carrying the old refutation",
    "Cites the new evidence in the disposition",
    "Does not modify source files during read-only review"
  ]
}
```

An optional state prefix is a declared synthetic mid-workflow starting point, not proof that a model navigated a real conversation. Use multi-turn runs when recovery, accumulated context, or the conversation arc itself is under test.

Rubrics distinguish plausible wrong behavior from good behavior. Pair file existence with substantive content. Prefer actual source fidelity, observed side effects, meaningful assertions, and permission compliance over matching headings or canned wording. Give a blinded evaluator the request and raw evidence, not the desired diagnosis. Every score is pass/fail/unknown with evidence; unsupported or unreadable output stays unknown. Diagnose judge errors separately from agent errors.

Retain each arm's input/fixture identity, tool scope, transcript/artifacts, rubric results, failures, and reported token/latency/cost. Unknown usage is unknown, not zero. Isolate generated work from the live project. A failed invocation is not an empty successful answer, and retries must retain the failed attempt rather than replace the evidence.

## Decisions and iteration

- Preserve a baseline that already succeeds as a positive control. Explicit contract gaps may justify clarification, but do not describe them as observed model failures.
- For behavior-changing guidance, run the existing version before editing where possible; retest the same case after the smallest correction. Repeat only for a new failure, edit, or unresolved concern.
- Read differing outcomes against the rubric, not the prompt's length. A short version tying a long one is a candidate for simplification; it is not permission to delete user policy or required wiring. An underpowered or confounded comparison cannot establish equivalence.
- Include near-miss trigger requests and cases with unavailable tools, missing evidence, and existing authorization. Keep tuning inputs separate from held-out checks so description changes do not merely memorize examples.
- Report paper reasoning, deterministic script checks, independent live execution, and unavailable cases separately. No passing score is implied by a plan to evaluate later.

Adapted from BMad Builder [eval-format.md](https://github.com/bmad-code-org/bmad-builder/blob/4a1422274a2acb0fb0ec0511753da6263948f072/skills/bmad-eval-runner/references/eval-format.md) and [platform-adapter.md](https://github.com/bmad-code-org/bmad-builder/blob/4a1422274a2acb0fb0ec0511753da6263948f072/skills/bmad-eval-runner/references/platform-adapter.md), commit `4a1422274a2acb0fb0ec0511753da6263948f072` (MIT; [license](../UPSTREAM-LICENSE)). Arcwright retains its own host, model selection, storage, authorization, and existing agent-evaluation method.
