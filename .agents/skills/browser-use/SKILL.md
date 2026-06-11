---
name: browser-use
description: Agentic browser exploration — give a natural-language goal and an LLM-driven agent self-navigates the page (no selectors). Use for exploratory testing, documenting unknown UIs, and scaffolding Playwright tests. Pairs with playwright-cli (deterministic) as the agentic counterpart.
allowed-tools: Bash(browser-use:*) Bash(uv:*) Bash(uvx:*) Bash(pip:*) Bash(python:*) Bash(python3:*)
---

# Agentic Browser Automation with browser-use

Source: https://github.com/browser-use/browser-use

`browser-use` drives a real browser with an **LLM agent loop**: you give it a
natural-language *goal*, and it perceives the page (accessibility tree +
screenshot), decides the next action, and repeats until done — **no selectors,
no scripted steps**. This is the complement to the `playwright-cli` skill, not a
replacement.

## When to use which

| You know the exact steps (login → click #submit → assert) | Use **`playwright-cli`** — deterministic, cheap, reproducible |
| You know the *goal* but not the steps, or the UI is unknown/changing | Use **`browser-use`** — agentic, self-navigating |
| Building a regression suite to run repeatedly | **`playwright-cli`** / `npx playwright test` |
| Exploring a feature, documenting a flow, or scaffolding a first test | **`browser-use`** |

> **Token cost warning.** Agentic mode runs its *own* LLM loop and re-feeds page
> state every step. It is markedly more expensive than `playwright-cli`. Reach
> for it only when scripted control would mean many turns of selector
> trial-and-error. Default to `playwright-cli` for known flows; use this skill
> for the discovery phase, then **hand the discovered steps to `playwright-cli`
> or a `.spec.ts`** for the durable, cheap, repeatable version.

## Install (prerequisite)

```bash
uv add "browser-use[core]"        # or: pip install "browser-use[core]"
```

Requires Python ≥ 3.11 and an LLM key in the environment:

```bash
export ANTHROPIC_API_KEY=...      # sonnet-first; see Model policy below
```

## Mode 1 — Agentic exploration (the differentiator)

Write a tiny one-shot script and run it. Keep `headless=True` for CI/automation;
use `headless=False` only when the user wants to watch.

```python
# explore.py
from browser_use.beta import Agent, BrowserProfile, ChatAnthropic
import asyncio

async def main():
    agent = Agent(
        task="Open the app, log in with the dev account, navigate to Settings, "
             "and report every distinct UI state you pass through.",
        llm=ChatAnthropic(model='claude-sonnet-4-6'),   # sonnet-first
        browser_profile=BrowserProfile(
            headless=True,
            allowed_domains=["*.localhost", "127.0.0.1"],  # scope the agent
        ),
    )
    history = await agent.run()
    print(history.final_result())     # <- structured task output

asyncio.run(main())
```

```bash
python explore.py
```

`history.final_result()` is the completion signal — capture it and return it (or
write it to the agent's output path). Always set `allowed_domains` so the agent
cannot wander off the target app.

## Mode 2 — Deterministic CLI (mirrors playwright-cli)

For known steps, browser-use also exposes a stateful CLI. Prefer `playwright-cli`
if it's installed; this is the fallback when only browser-use is available.

```bash
browser-use open https://example.com
browser-use state              # snapshot current page (like playwright-cli snapshot)
browser-use click 5
browser-use type "Hello"
browser-use screenshot page.png
browser-use close
```

## Recommended workflows

**Exploratory testing / bug repro discovery** — give the agent the goal, let it
find the path, return the state log + final result. Then encode the confirmed
path as a `playwright-cli` sequence or `.spec.ts` for the durable test.

**Documenting an unknown UI** — task the agent to walk a flow and describe each
screen; feed `final_result()` to the tech-writer agent as raw material for docs.

**Scaffolding tests** — task: "Perform <flow> and list each action you took with
the element you targeted." Convert the returned action list into a Playwright
spec. The agent does the selector discovery; the durable test stays deterministic.

## Model policy (sonnet-first)

Default `llm=ChatAnthropic(model='claude-sonnet-4-6')` — the browser-use docs
confirm Sonnet handles browser tasks well, and it is the Arcwright default. Only
escalate to `claude-opus-4-8` for genuinely hard multi-step reasoning, and ask
the user before doing so (per `claude-subagent-protocol`).

## Completion signal (in-process)

When run by a sub-agent, `history.final_result()` (or the CLI's final state) is
the result you return via the **Agent tool return value** — no `AGENT_SIGNAL`,
no pane writes, no legacy signals. See `claude-subagent-protocol` §11.

## Kiro note

Under Kiro CLI, run the same commands via `execute_bash`. The Python-script
pattern and the `browser-use` CLI are identical; only the tool name differs.
