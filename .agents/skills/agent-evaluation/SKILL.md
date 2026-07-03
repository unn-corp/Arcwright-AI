---
name: agent-evaluation
description: Evaluate an AI agent's behavior (output quality, tool-call trajectory, multi-turn interaction), not just its code. Use when building an eval suite for an agent, measuring agent quality/regressions, judging whether an agent's answers and tool use are correct, or when someone asks "how do I test my agent" or "is my agent good enough to ship". Distinct from QA/verifier (which check code correctness and integration wiring) and from unit tests (which check functions).
allowed-tools: Read, Grep, Glob, Bash, Write, Edit
version: 1.0.0
author: arcwright
tags: [agents, evaluation, llm-as-judge, testing, quality]
---

# Agent Evaluation

Testing an agent is not testing code. A function has a right answer; an agent has a distribution of acceptable behaviors, tool calls that may arrive in different orders, and multi-turn conversations that can go right or wrong at any step. This skill is a methodology for evaluating agent **behavior**. It complements, and does not replace, the QA and verifier disciplines (which prove code exists, is wired in, and is correct). Distilled from AWS Strands Agents' evals framework and eval SOP (Apache-2.0, see `SOURCES-STRANDS.md`), adapted to Arcwright.

## What to measure (four lenses)

1. **Output quality** - is the final answer correct, complete, and appropriately formatted? Judged against a rubric, not exact string match.
2. **Trajectory** - did the agent take a reasonable path? Which tools it called, with what arguments, in what order.
3. **Multi-turn interaction** - across a conversation, does it stay on task, recover from bad tool results, and not lose earlier context?
4. **Safety and cost** - did it avoid unnecessary tool calls (agency creep), stay within token/latency budget, and refuse out-of-scope or unsafe requests? (For adversarial robustness specifically, use `agent-red-teaming`.)

## Scoring methods

**LLM-as-judge (for open-ended output).** Give a judge model the input, the agent's output, and an explicit rubric; have it score each rubric dimension and return a structured verdict with a short justification. Rules that make this reliable:
- The rubric MUST be explicit and dimension-by-dimension (correctness, completeness, format, tone), not "rate 1 to 10 overall".
- The judge MUST cite the specific evidence for each score, so a human can audit it.
- Use a different or stronger model as judge where possible, and spot-check judge verdicts against human judgment on a sample before trusting the suite.

**Trajectory matching (for tool use).** Compare the actual tool-call sequence against an expected one at the strictness the task demands:
- **exact** - same tools, same order, same arguments (for deterministic pipelines).
- **in-order** - expected tools appear in order, extra calls allowed between (for flexible flows).
- **any-order** - expected tools all appear, order irrelevant (for independent lookups).
Pick the loosest match that still catches real regressions; exact matching on a genuinely flexible agent produces false failures.

**Trace-based evaluation (for production).** Instrument the agent with OpenTelemetry (span per model call and per tool call, record stop reasons) and evaluate against real traces: tool-error rate, retry loops, token consumption, latency per step. This catches behavior a fixed test set misses. See `strands-observability` (in the `--strands` module) for the tracing side.

## Workflow: plan, generate, run, analyze

1. **Plan** - define the four-lens criteria for THIS agent and the strictness of trajectory matching. Write down what "good" means before you look at outputs.
2. **Generate test data** - a set of representative inputs plus edge cases (empty input, ambiguous request, a tool that fails, a request that should be refused). Cover the trajectories you care about, not just the happy path.
3. **Run** - execute the agent over the set, capturing final output AND the tool-call trajectory AND traces.
4. **Analyze** - score with the methods above; for each failure do a root-cause pass (bad tool result the model trusted? missing tool? prompt gap? judge false-negative?). Fix the highest-frequency root cause first, then re-run.

Convention: keep the eval suite in an `eval/` directory as a sibling of the agent it tests, so the tests version alongside the agent.

## Failure detection and root cause

When a run regresses, classify each failure before fixing:
- **Output failure** - wrong/incomplete answer despite a reasonable path (usually a prompt or knowledge gap).
- **Trajectory failure** - wrong tools or order (usually a tool description, tool availability, or routing issue).
- **Interaction failure** - lost context, ignored a bad tool result, looped (usually a conversation-management or hooks issue).
- **Judge failure** - the eval is wrong, not the agent (fix the rubric, do not "fix" the agent to satisfy a bad judge).

## Self-check

Before trusting an agent eval suite:
- Every scored dimension has an explicit rubric criterion, not a vibe.
- Trajectory strictness matches how deterministic the agent actually is.
- The set includes failure/refusal/edge cases, not only happy paths.
- Judge verdicts were spot-checked against human judgment on a sample.

## See also

- `agent-red-teaming` - adversarial safety testing (is the agent robust to hostile input), a different question than "is it good".
- `strands-observability` - OTel tracing that feeds trace-based evaluation.
- QA / verifier agents - code correctness and goal-backward integration checks, orthogonal to agent-behavior eval.
