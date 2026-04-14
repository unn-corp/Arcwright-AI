# Skills Index

_Last updated: 2026-04-03_

Total skills: 54 (52 in `.agents/skills/` + 2 in `_arcwright/_memory/skills/`)

---

## Auto-Load Skills

Skills that load automatically based on environment or context.

### tmux-protocol
- **Location:** `.agents/skills/tmux-protocol/`
- **Trigger:** Auto-load when `$TMUX` is set, before any multi-pane work
- **Slash command:** `/tmux-protocol`
- **Used by:** squid-master, all 17 team-* skills, all 7 track-* skills
- **Description:** Full tmux orchestration protocol — spawn sequence, message delivery verification, sleep timings, AGENT_SIGNAL format, master polling, backup signal system, pane close protocol, and follow-up task routing with active teams.

### systematic-debugging
- **Location:** `.agents/skills/systematic-debugging/`
- **Trigger:** Auto-load when encountering any bug, test failure, or unexpected behavior, before proposing fixes
- **Slash command:** no
- **Used by:** squid-master (debugging context)
- **Description:** Structured root-cause debugging methodology that prevents random fixes and patch-masking; produces a hypothesis → reproduce → isolate → fix cycle.

### writing-skills _(agents-skills copy)_
- **Location:** `.agents/skills/writing-skills/`
- **Trigger:** Mandatory pre-output for any planning, spec, or document artifact — every agent must invoke before generating output
- **Slash command:** `/writing-skills`
- **Used by:** squid-master (all planning contexts)
- **Description:** TDD-style process documentation methodology for creating, editing, and verifying skills — write test cases, watch baseline fail, write skill, verify compliance, refactor.

---

## Team Skills

Persistent multi-pane agent teams spawned by squid-master. All team skills auto-load `tmux-protocol` when `$TMUX` is set. Spawned via `[ST-{code}]` commands or `/spawn-team-{name}` slash commands.

### team-arch-dev
- **Location:** `.agents/skills/team-arch-dev/`
- **Trigger:** Via squid-master `[ST-AD]` or `/spawn-team-arch-dev`
- **Slash command:** `/spawn-team-arch-dev`
- **Used by:** squid-master
- **Description:** The Foundry — Architect designs the technical approach, Dev implements, Architect spot-checks completed work. Best for complex features where the right design must precede implementation.

### team-audit
- **Location:** `.agents/skills/team-audit/`
- **Trigger:** Via squid-master `[ST-AU]` or `/spawn-team-audit`
- **Slash command:** `/spawn-team-audit`
- **Used by:** squid-master
- **Description:** The Crucible — Architect, UX Designer, and Security reviewer run concurrently; Dev fixes findings; Security has final sign-off. Most comprehensive audit team.

### team-blueprint
- **Location:** `.agents/skills/team-blueprint/`
- **Trigger:** Via squid-master `[ST-BP]` or `/spawn-team-blueprint`
- **Slash command:** `/spawn-team-blueprint`
- **Used by:** squid-master
- **Description:** The War Room — PM, Analyst, and Architect run strategic planning (PRD, research, architecture) before any build begins.

### team-dev-qa
- **Location:** `.agents/skills/team-dev-qa/`
- **Trigger:** Via squid-master `[ST-DQ]` or `/spawn-team-dev-qa`
- **Slash command:** `/spawn-team-dev-qa`
- **Used by:** squid-master
- **Description:** Dev + QA iterative loop — Dev implements, QA validates with playwright-cli, failures loop back to Dev until passing.

### team-docs
- **Location:** `.agents/skills/team-docs/`
- **Trigger:** Via squid-master `[ST-DO]` or `/spawn-team-docs`
- **Slash command:** `/spawn-team-docs`
- **Used by:** squid-master
- **Description:** The Library — Tech Writer drafts documentation, Architect reviews for technical accuracy and API correctness, lightweight iterative loop.

### team-full-dev
- **Location:** `.agents/skills/team-full-dev/`
- **Trigger:** Via squid-master `[ST-FD]` or `/spawn-team-full-dev`
- **Slash command:** `/spawn-team-full-dev`
- **Used by:** squid-master
- **Description:** The Engine Room — Dev implements, QA validates, Architect available on-demand for inline consultation on complex decisions. For medium-to-large feature work.

### team-hotfix
- **Location:** `.agents/skills/team-hotfix/`
- **Trigger:** Via squid-master `[ST-HF]` or `/spawn-team-hotfix`
- **Slash command:** `/spawn-team-hotfix`
- **Used by:** squid-master
- **Description:** Rapid Response — emergency production fix with strict guardrails (max 4 files, isolated subsystem), Security reviews the fix before prepare-to-merge.

### team-research
- **Location:** `.agents/skills/team-research/`
- **Trigger:** Via squid-master `[ST-RE]` or `/spawn-team-research`
- **Slash command:** `/spawn-team-research`
- **Used by:** squid-master
- **Description:** Recon Pod — Analyst researches domain/market/technical topics, PM synthesizes into strategic briefs, Tech Writer documents outputs.

### team-review
- **Location:** `.agents/skills/team-review/`
- **Trigger:** Via squid-master `[ST-RV]` or `/spawn-team-review`
- **Slash command:** `/spawn-team-review`
- **Used by:** squid-master
- **Description:** Review + Fix Loop — Architect and UX Designer review concurrently, batch findings to Dev, loop until all findings resolved.

### team-sec-qa
- **Location:** `.agents/skills/team-sec-qa/`
- **Trigger:** Via squid-master `[ST-SQ]` or `/spawn-team-sec-qa`
- **Slash command:** `/spawn-team-sec-qa`
- **Used by:** squid-master
- **Description:** The Vault — Security finds vulnerabilities, Dev remediates, QA closes the exploit path by verifying the fix, Security signs off.

### team-solo-arch
- **Location:** `.agents/skills/team-solo-arch/`
- **Trigger:** Via squid-master `[ST-SA]` or `/spawn-team-solo-arch`
- **Slash command:** `/spawn-team-solo-arch`
- **Used by:** squid-master
- **Description:** The Oracle — single Architect pane with full dev skill access for architecture analysis, design proposals, and prototype code.

### team-solo-dev
- **Location:** `.agents/skills/team-solo-dev/`
- **Trigger:** Via squid-master `[ST-SD]` or `/spawn-team-solo-dev`
- **Slash command:** `/spawn-team-solo-dev`
- **Used by:** squid-master
- **Description:** Ghost — single quick-flow-solo-dev agent; master queues tasks sequentially, agent signals completion between each task.

### team-solo-qa
- **Location:** `.agents/skills/team-solo-qa/`
- **Trigger:** Via squid-master `[ST-SQ2]` or `/spawn-team-solo-qa`
- **Slash command:** `/spawn-team-solo-qa`
- **Used by:** squid-master
- **Description:** The Inquisitor — single QA agent for regression runs, playwright-cli sessions, and pass/fail reporting.

### team-sprint
- **Location:** `.agents/skills/team-sprint/`
- **Trigger:** Via squid-master `[ST-SP]` or `/spawn-team-sprint`
- **Slash command:** `/spawn-team-sprint`
- **Used by:** squid-master
- **Description:** The Strike Team — SM manages sprint queue, Dev implements stories in sequence, QA validates each story before SM marks done and moves to next.

### team-tdd
- **Location:** `.agents/skills/team-tdd/`
- **Trigger:** Via squid-master `[ST-TD]` or `/spawn-team-tdd`
- **Slash command:** `/spawn-team-tdd`
- **Used by:** squid-master
- **Description:** The Forge — TDD pod where QA writes failing tests first, Dev implements to green, QA verifies all pass.

### team-ux-arch
- **Location:** `.agents/skills/team-ux-arch/`
- **Trigger:** Via squid-master `[ST-UA]` or `/spawn-team-ux-arch`
- **Slash command:** `/spawn-team-ux-arch`
- **Used by:** squid-master
- **Description:** The Blueprint Room — UX Designer and Architect collaborate to produce design artifacts (wireframes, API contracts, component specs); no implementation, no iterative loop.

### team-ux-qa
- **Location:** `.agents/skills/team-ux-qa/`
- **Trigger:** Via squid-master `[ST-UQ]` or `/spawn-team-ux-qa`
- **Slash command:** `/spawn-team-ux-qa`
- **Used by:** squid-master
- **Description:** The Atelier — UX Designer implements (can write code), QA validates live UI with playwright-cli, loop until clean.

---

## Track Skills

Workflow track definitions that define the pipeline of agents, gates, and steps for a given task size. Squid-master routes to a track automatically based on complexity scoring.

### track-nano
- **Location:** `.agents/skills/track-nano/`
- **Trigger:** Via squid-master track routing (1-2 files, <=20 lines changed) or `/arcwright-track-nano`
- **Slash command:** `/arcwright-track-nano`
- **Used by:** squid-master
- **Description:** Nano track — 1-2 files, <=20 lines, no new imports, one-commit revert complexity. Straight to Dev with no spec overhead.

### track-small
- **Location:** `.agents/skills/track-small/`
- **Trigger:** Via squid-master track routing (2-4 files) or `/arcwright-track-small`
- **Slash command:** `/arcwright-track-small`
- **Used by:** squid-master
- **Description:** Small track — 2-4 files, single concern with clear acceptance criteria. Pipeline: spec + dev + review + QA.

### track-compact
- **Location:** `.agents/skills/track-compact/`
- **Trigger:** Via squid-master track routing (4-8 files) or `/arcwright-track-compact`
- **Slash command:** `/arcwright-track-compact`
- **Used by:** squid-master
- **Description:** Compact track — 4-8 files, may touch unfamiliar areas or external APIs. Includes optional research phase and one review cycle.

### track-medium
- **Location:** `.agents/skills/track-medium/`
- **Trigger:** Via squid-master track routing (6-12 files) or `/arcwright-track-medium`
- **Slash command:** `/arcwright-track-medium`
- **Used by:** squid-master
- **Description:** Medium track — 6-12 files, new UI flow or notable backend change. Full spec, UX design, 2 review gates, QA.

### track-extended
- **Location:** `.agents/skills/track-extended/`
- **Trigger:** Via squid-master track routing (10-16 files) or `/arcwright-track-extended`
- **Slash command:** `/arcwright-track-extended`
- **Used by:** squid-master
- **Description:** Extended track — 10-16 files, significant feature with cross-cutting concerns. PRD, arch notes, 2 review gates, no epic loop.

### track-large
- **Location:** `.agents/skills/track-large/`
- **Trigger:** Via squid-master track routing (12+ files) or `/arcwright-track-large`
- **Slash command:** `/arcwright-track-large`
- **Used by:** squid-master
- **Description:** Large track — 12+ files, multi-epic feature or new subsystem. Full planning pipeline with epic loop, parallel research, and final gates.

### track-rv
- **Location:** `.agents/skills/track-rv/`
- **Trigger:** Via squid-master track routing or `/arcwright-track-rv`
- **Slash command:** `/arcwright-track-rv`
- **Used by:** squid-master
- **Description:** Review track — audit an existing codebase area first, synthesize findings, then route to SMALL or LARGE fix path based on finding volume.

---

## Domain Skills

Language and framework expertise skills. Load when working in the relevant technology context.

### python-fundamentals
- **Location:** `.agents/skills/python-fundamentals/`
- **Trigger:** When writing or teaching Python fundamentals (bonded to 01-python-fundamentals agent)
- **Slash command:** no
- **Used by:** none (bonded agent skill)
- **Description:** Master Python syntax, data types, control flow, functions, OOP, and standard library.

### python-backend
- **Location:** `.agents/skills/python-backend/`
- **Trigger:** When building or reviewing Python backend services
- **Slash command:** no
- **Used by:** squid-master (backend context)
- **Description:** Production-ready Python backend patterns for FastAPI, SQLAlchemy, and Upstash.

### python-performance
- **Location:** `.agents/skills/python-performance/`
- **Trigger:** When optimizing Python application performance (bonded to 07-best-practices agent)
- **Slash command:** no
- **Used by:** none (bonded agent skill)
- **Description:** Master Python optimization techniques, profiling, memory management, and high-performance computing.

### typescript-best-practices
- **Location:** `.agents/skills/typescript-best-practices/`
- **Trigger:** When writing or reviewing TypeScript code
- **Slash command:** no
- **Used by:** squid-master (frontend context)
- **Description:** Modern TypeScript 5.x patterns — strict mode, discriminated unions, satisfies operator, const assertions, and type-safe patterns.

### next-best-practices
- **Location:** `.agents/skills/next-best-practices/`
- **Trigger:** When writing or reviewing Next.js code (not user-invocable — agent-only)
- **Slash command:** no
- **Used by:** squid-master (frontend context)
- **Description:** Next.js best practices — file conventions, RSC boundaries, data patterns, async APIs, metadata, error handling, route handlers, image/font optimization, bundling.

### nextjs-app-router-patterns
- **Location:** `.agents/skills/nextjs-app-router-patterns/`
- **Trigger:** When building Next.js applications, implementing SSR/SSG, or optimizing React Server Components
- **Slash command:** no
- **Used by:** squid-master (frontend context)
- **Description:** Comprehensive Next.js 14+ App Router patterns — Server Components, streaming, parallel routes, advanced data fetching.

### react-expert
- **Location:** `.agents/skills/react-expert/`
- **Trigger:** When researching React APIs or concepts for authoritative documentation and usage examples
- **Slash command:** no
- **Used by:** squid-master (frontend context)
- **Description:** Authoritative React API research — searches source code, tests, PRs, and issues rather than relying on training knowledge.

### java-fundamentals
- **Location:** `.agents/skills/java-fundamentals/`
- **Trigger:** When writing or reviewing Java code (bonded to 01-java-fundamentals agent)
- **Slash command:** no
- **Used by:** none (bonded agent skill)
- **Description:** Master core Java programming — syntax, OOP, collections, streams, and exception handling.

### java-performance
- **Location:** `.agents/skills/java-performance/`
- **Trigger:** When optimizing Java application performance (bonded to 02-java-advanced agent)
- **Slash command:** no
- **Used by:** none (bonded agent skill)
- **Description:** JVM performance tuning — GC optimization, profiling, memory analysis, benchmarking.

### postgresql-optimization
- **Location:** `.agents/skills/postgresql-optimization/`
- **Trigger:** When working with PostgreSQL-specific features or advanced query optimization
- **Slash command:** no
- **Used by:** squid-master (backend/DB context)
- **Description:** PostgreSQL-specific development — JSONB operations, array types, custom types, full-text search, window functions, extensions ecosystem.

### redis-best-practices
- **Location:** `.agents/skills/redis-best-practices/`
- **Trigger:** When implementing Redis caching, session storage, real-time analytics, or message queuing
- **Slash command:** no
- **Used by:** squid-master (backend context)
- **Description:** Redis development best practices — caching, data structures, high-performance key-value operations.

### websocket-engineer
- **Location:** `.agents/skills/websocket-engineer/`
- **Trigger:** When building real-time WebSocket/Socket.IO communication, pub/sub, or live-update features
- **Slash command:** no
- **Used by:** squid-master (backend context)
- **Description:** Build real-time WebSocket/Socket.IO systems — bidirectional messaging, horizontal scaling with Redis, presence tracking, room management.

### frontend-responsive-design-standards
- **Location:** `.agents/skills/frontend-responsive-design-standards/`
- **Trigger:** When creating or modifying UI layouts that need to work across multiple screen sizes
- **Slash command:** no
- **Used by:** squid-master (frontend context)
- **Description:** Mobile-first responsive layout standards — fluid containers, flexible units, media queries, breakpoints, touch-friendly targets (44x44px minimum).

---

## Tool Skills

Skills for specific external tools and integrations.

### playwright-cli
- **Location:** `.agents/skills/playwright-cli/`
- **Trigger:** MANDATORY for all QA/Testing tasks — always loaded for qa-agent
- **Slash command:** `/playwright-cli`
- **Used by:** squid-master, team-dev-qa, team-sprint, team-full-dev, team-tdd, team-ux-qa, team-sec-qa, team-solo-qa
- **Description:** Automate browser interactions, test web pages, and work with Playwright tests via the playwright-cli tool.

### gsudo
- **Location:** `.agents/skills/gsudo/`
- **Trigger:** When running on Windows host (`$OS == Windows_NT`) for admin operations, git, or playwright that require elevation
- **Slash command:** `/gsudo`
- **Used by:** squid-master (Windows host context)
- **Description:** Windows privilege escalation — run git, PowerShell, and playwright-cli commands elevated without opening a full Administrator terminal.

### docker-type-check
- **Location:** `.agents/skills/docker-type-check/`
- **Trigger:** When setting up TypeScript type-checking gates for a Docker-based project; via `/setup-docker-type-check`
- **Slash command:** `/setup-docker-type-check`
- **Used by:** squid-master (setup context)
- **Description:** Sets up pre-commit hook (runs `tsc --noEmit` inside running dev container) and optional Dockerfile build gate to catch TypeScript errors before CI/CD.

### excalidraw-diagram-generator
- **Location:** `.agents/skills/excalidraw-diagram-generator/`
- **Trigger:** When asked to create a diagram, flowchart, mind map, architecture visualization, or .excalidraw file
- **Slash command:** no
- **Used by:** squid-master (diagramming context)
- **Description:** Generate Excalidraw diagrams from natural language — flowcharts, relationship diagrams, mind maps, architecture diagrams, DFDs, swimlanes, class diagrams. Outputs .excalidraw JSON.

### excalidraw-dark-standard
- **Location:** `.agents/skills/excalidraw-dark-standard/`
- **Trigger:** When creating or editing any .excalidraw file in the Squidhub project (use alongside excalidraw-diagram-generator)
- **Slash command:** no
- **Used by:** squid-master (diagramming context)
- **Description:** Squid-Master dark mode Excalidraw design standard — defines canvas setup, semantic color palette, shape vocabulary, typography, spacing, and file naming conventions.

### excalidraw _(memory-skills copy)_
- **Location:** `_arcwright/_memory/skills/excalidraw/`
- **Trigger:** When creating any visual diagram output as .excalidraw files
- **Slash command:** no
- **Used by:** squid-master (diagramming context)
- **Description:** Core Excalidraw JSON structure reference — element types, appState, binding, grouping, and file format details for generating valid .excalidraw files.

### audit-website
- **Location:** `.agents/skills/audit-website/`
- **Trigger:** When auditing a website or webapp for SEO, performance, security, technical, or content health
- **Slash command:** `/audit-website`
- **Used by:** squid-master (QA/Testing context)
- **Description:** Website audit using squirrelscan CLI — 230+ rules across SEO, performance, security, technical, content, and 15 other categories; returns LLM-optimized reports with health scores.

---

## Process Skills

Process, methodology, and review skills that enforce standards or guide workflows.

### clean-code-standards
- **Location:** `.agents/skills/clean-code-standards/`
- **Trigger:** When performing a DRY/SOLID review gate (Gate Sub-1), or architect-agent runs combined AR+PMR+DRY review
- **Slash command:** no
- **Used by:** squid-master, team-audit, team-review, team-arch-dev, team-solo-arch
- **Description:** DRY/SOLID code quality — 23 rules across 7 categories (SOLID principles, Core principles, naming, functions, error handling, testing, comments). Produces findings with DRY-NNN IDs.

### security-best-practices
- **Location:** `.agents/skills/security-best-practices/`
- **Trigger:** When securing APIs, preventing common vulnerabilities, or implementing security policies
- **Slash command:** no
- **Used by:** squid-master (security context)
- **Description:** Web application security best practices — HTTPS, CORS, XSS, SQL injection, CSRF, rate limiting, and OWASP Top 10 implementation guidance.

### triage
- **Location:** `.agents/skills/triage/`
- **Trigger:** When user invokes `/triage` with a task description
- **Slash command:** `/triage`
- **Used by:** any agent, master orchestrator
- **Description:** Score a task description across 6 complexity dimensions and recommend the appropriate Arcwright track (nano/small/compact/medium/extended/large/rv) with a rationale and the exact slash command to run.

### security-review
- **Location:** `.agents/skills/security-review/`
- **Trigger:** When performing security review at Gate Sub-3 in review pipeline; when asked to find vulnerabilities or audit security
- **Slash command:** `/security-audit`
- **Used by:** squid-master, team-audit, team-sec-qa, team-hotfix
- **Description:** Security code review for vulnerabilities — OWASP-based systematic review covering injection, XSS, authentication, authorization, and cryptography with confidence-based reporting.

### ux-audit
- **Location:** `.agents/skills/ux-audit/`
- **Trigger:** When running Gate Sub-2 (UV review) or auditing Squidhub UI for design standard compliance
- **Slash command:** `/ui-audit`
- **Used by:** squid-master, team-audit, team-review (UV gate)
- **Description:** Squidhub UI/UX audit — design token compliance, accessibility (WCAG), component reuse, layout patterns, dialog flex-column, and interaction quality review.

### ui-ux-pro-custom
- **Location:** `.agents/skills/ui-ux-pro-custom/`
- **Trigger:** When designing UI or reviewing UX across web and mobile applications; loaded alongside ux-audit at UV gate
- **Slash command:** no
- **Used by:** squid-master, team-audit, team-review, team-ux-arch, team-ux-qa (UV gate)
- **Description:** Comprehensive UI/UX design intelligence — 67 styles, 96 color palettes, 57 font pairings, 99 UX guidelines, 25 chart types across 13 technology stacks.

### subagent-driven-development
- **Location:** `.agents/skills/subagent-driven-development/`
- **Trigger:** When executing implementation plans with parallel or independent tasks in the current session
- **Slash command:** no
- **Used by:** squid-master (parallel work context)
- **Description:** Execute plans via fresh subagent per independent task, with two-stage review after each (spec compliance review, then code quality review).

### writing-skills _(memory-skills copy)_
- **Location:** `_arcwright/_memory/skills/writing-skills/`
- **Trigger:** When creating new skills, editing existing skills, or verifying skills work before deployment
- **Slash command:** `/writing-skills`
- **Used by:** squid-master (skill authoring context)
- **Description:** TDD applied to process documentation — write test scenarios (pressure scenarios with subagents), baseline behavior, skill documentation, verify compliance, refactor to close loopholes.

---

## Notes

- **Duplicate skills:** `writing-skills` and `excalidraw` exist in both `.agents/skills/` and `_arcwright/_memory/skills/`. The memory-skills versions are the authoritative source for the Arcwright memory system; the agents-skills versions are the project-local copies.
- **Slash commands:** All team and track skills have corresponding `/spawn-team-*` and `/arcwright-track-*` slash commands in `.claude/commands/`. Domain and tool skills are loaded by agents programmatically; only a subset have user-facing slash commands.
- **tmux-protocol precedence:** All 17 team-* skills explicitly load tmux-protocol when `$TMUX` is set. This is also squid-master's global rule for all multi-pane work.
- **Skill injection:** squid-master scans `.agents/skills/` before routing to any sub-agent and injects applicable skill names into the context block. Sub-agents load the full SKILL.md at activation step 4.
