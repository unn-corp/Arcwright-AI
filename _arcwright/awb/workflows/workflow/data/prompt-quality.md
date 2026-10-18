# Outcome-driven workflow quality

Use this while authoring, editing, or reviewing a workflow. Keep the existing Arcwright persona, file layout, authorization, and host tools.

Define the **outcome**, its **consumer**, and the **bar** the consumer needs without the author or conversation present. Retain non-obvious domain knowledge, operational invariants, wiring, and user policy. Explain why a surprising constraint matters so it survives a new case.

- State goals where several valid methods exist. Exact order is justified when an operation depends on earlier results or a wrong move has a concrete cost.
- Use existing user answers and artifacts. Do not ask a scripted question again after its answer is known. Continue within existing authorization rather than inserting a confirmation ritual.
- Judge each instruction by the decision or observed mistake it changes. Shorten repetition before deleting a useful constraint. Do not delete human rules because the model claims it can infer them.
- Keep shared purpose and essential routing in the entry/step. Move substantial branch-only material to one directly linked reference, with an observable loading trigger. Do not split a few lines merely to meet an arbitrary token target or hide required policy behind a vague trigger.

## Size and token advice

[workflow-limits.json](workflow-limits.json) is the only authoritative numeric source for step line limits and advisory token thresholds. All serial/parallel validators use it. A step above `stepLines.maximum` fails; one at/above `recommendedBelow` but at/below maximum warns. Reference/template files are not step files and are assessed for relevance and retrieval separately.

Run the read-only checker when Node is available:

```text
node {project-root}/_arcwright/awb/workflows/workflow/scripts/check-step-size.mjs {target-workflow-path}
```

It checks Markdown in all `steps*` modes, or one explicitly supplied step. Exit 0 means no size failures (warnings may remain), 1 means a size failure, and 2 means incomplete scope. An empty file's size result does not validate its content. Without Node, count the same files and apply the JSON thresholds; report unreadable/unchecked files rather than claiming pass.

Token counts are advisory: prefer a tokenizer matching the actual host/model when available, and label its method. The checker reports only a rough characters/4 estimate, especially unreliable for non-Latin text. Missing model-specific counts do not block authoring, and a token estimate alone never fails a workflow. Consider the whole loaded context, including parent instructions, rather than copying one model's tokenizer budget to every provider.

## Check behavior, not just shape

Use `agent-evaluation` for realistic quality, baseline, variant, and trigger cases. Match the target model, input, fixtures, permissions, and available tools when comparing variants. Keep baseline success as a positive control; a model already handling a case is not evidence of an earlier failure.

Compare an edited prompt against its previous version or a short outcome/consumer variant on the same rubric. Preserve real advantages and remove unsupported ceremony only when the evidence supports it. Record unavailable evaluation as unmeasured, not passed. Scoped checks may use available native tools or paper cases; label paper reasoning separately from independent live execution. No new approval, model switch, external service, or runner installation is implied.

Adapted from BMad Builder [quality canon](https://github.com/bmad-code-org/bmad-builder/blob/4a1422274a2acb0fb0ec0511753da6263948f072/skills/bmad-workflow-builder/references/prompt-quality-canon.md) and [evaluation modes](https://github.com/bmad-code-org/bmad-builder/blob/4a1422274a2acb0fb0ec0511753da6263948f072/skills/bmad-eval-runner/references/eval-format.md), commit `4a1422274a2acb0fb0ec0511753da6263948f072` (MIT; [license](../UPSTREAM-LICENSE)). Token advice is adapted; Arcwright retains its step-line contract and existing runtime.
