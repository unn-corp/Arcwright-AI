# browser-use — quick rules (~300 tokens)

**What:** Agentic browser automation. Give a natural-language *goal*; an LLM agent
self-navigates (perceive → decide → act loop, no selectors). The agentic
counterpart to `playwright-cli` (deterministic, scripted).

**Pick the right tool:**
- Known steps / regression suite → **`playwright-cli`** (cheap, deterministic).
- Goal known but steps unknown, or unknown/changing UI → **`browser-use`**.
- Discovery phase → use `browser-use` to find the path, then **encode the
  confirmed steps as `playwright-cli` / `.spec.ts`** for the durable test.

**Token cost:** Agentic mode runs its own LLM loop and re-feeds page state each
step — much pricier than `playwright-cli`. Don't use it for known flows.

**Use it for:** exploratory testing, bug-repro discovery, documenting unknown
UIs (feed `final_result()` to tech-writer), scaffolding first tests.

**Install:** `uv add "browser-use[core]"` (or pip); Python ≥3.11; needs
`ANTHROPIC_API_KEY`. Run headless by default.

**Model:** sonnet-first — `ChatAnthropic(model='claude-sonnet-4-6')`. Ask before
opus.

**Scope:** always set `allowed_domains` so the agent can't wander off-app.

**Completion:** `history.final_result()` → return via Agent tool return value.
No legacy signals (see `claude-subagent-protocol` §11).

Full procedure: `.agents/skills/browser-use/SKILL.md`.
