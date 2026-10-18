---
name: browser-use
description: Agentic browser exploration — give a natural-language goal and an LLM-driven agent self-navigates the page (no selectors). Use for exploratory testing, documenting unknown UIs, and scaffolding Playwright tests. Pairs with playwright-cli (deterministic) as the agentic counterpart.
allowed-tools: Bash(browser-use:*) Bash(uv:*) Bash(uvx:*) Bash(pip:*) Bash(python:*) Bash(python3:*)
---

# Goal-driven browser exploration

Use this library when a browser goal is known but the interaction path needs
discovery. Prefer the active host's collaborative browser tools according to host
policy. A closed native preview alone is not a reason to launch another browser.
Use standalone browser-use when the user/repository explicitly chooses it or the
host's documented fallback conditions are met.

## Scope and prerequisites

Reuse the project's installed version and package manager. Installation or a paid
model/browser service needs the current task's authorization. Inspect the installed
API or current official guidance for changed calls. Configure the selected model
provider privately; Anthropic credentials are not a universal prerequisite.
Inherit an existing provider/model choice when supported, or surface a material
unsupported choice. Do not silently select a new provider, model, or account.

Keep exploration scripts and outputs in an owned
`_arcwright/_memory/skill-runs/browser-use-<run>/` under the active project; host
capture/evidence storage takes precedence. Never use the installed bundle as a
working directory. Use task-scoped domains and credentials, bounded steps/time,
and the project's actual visibility preference. Do not collect unrelated data.

## Explore and verify

1. Define the requested observable outcome and domain/action limits. Reuse existing
   sessions or profiles only through the supported host/library interface.
2. For a standalone library run, select the configured provider's supported wrapper
   and actual model ID. Load [provider examples](references/provider-selection.md)
   only if needed. Keep keys out of scripts, command output, logs, and chat.
3. Run a small exploration of the unknown path. Capture actionable state and the
   actual outcome; `history.final_result()` is a library result, not proof that all
   acceptance criteria passed. Inspect the final state and relevant evidence.
4. For known deterministic steps, prefer the existing test runner/CLI instead of
   another model loop. If a durable regression is justified, use `test-quality`,
   reuse fixtures, and encode the discovered public behavior with focused checks.
5. Return the outcome, evidence paths, source/environment limits, and any unfinished
   actions through the current host's completion channel. Follow `subagent-protocol`
   only if this run is already an authorized delegated task.

A library may expose a deterministic CLI or an optional beta backend. Check the
installed version's interface and prerequisites rather than assuming either is
required. Do not start a service, install an optional backend, or spend on a live
model call merely to refresh this skill's source.
