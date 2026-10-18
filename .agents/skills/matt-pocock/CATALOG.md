# Arcwright engineering and productivity pack

Source: https://github.com/mattpocock/skills/tree/49dd158d1076134a641b33efb035946536778336 (1.3.1). Arcwright maintains these 27 stable skill derivatives locally. Experimental and miscellaneous upstream skills are excluded. The source revision records origin only.

| Skill | Purpose |
| --- | --- |
| [matt-pocock-ask-matt](../matt-pocock-ask-matt/SKILL.md) | Ask which skill or flow fits your situation. A router over the skills in this repo. |
| [matt-pocock-diagnosing-bugs](../matt-pocock-diagnosing-bugs/SKILL.md) | Diagnosis loop for hard bugs and performance regressions. Use when the user says "diagnose"/"debug this", or reports something broken/throwing/failing/slow. |
| [matt-pocock-grill-with-docs](../matt-pocock-grill-with-docs/SKILL.md) | A relentless interview to sharpen a plan or design, which also creates docs (ADR's and glossary) as we go. |
| [matt-pocock-triage](../matt-pocock-triage/SKILL.md) | Move issues and external PRs through a state machine of triage roles, categorise, verify, grill if needed, and write agent-ready briefs. |
| [matt-pocock-improve-codebase-architecture](../matt-pocock-improve-codebase-architecture/SKILL.md) | Scan a codebase for deepening opportunities, present them as a visual HTML report, then grill through whichever one you pick. |
| [matt-pocock-setup-matt-pocock-skills](../matt-pocock-setup-matt-pocock-skills/SKILL.md) | Configure this repo for the engineering skills: set up its issue tracker, triage label vocabulary, and domain doc layout. Run once before first use of the other engineering skills. |
| [matt-pocock-tdd](../matt-pocock-tdd/SKILL.md) | Test-driven development. Use when the user wants to build features or fix bugs test-first, mentions "red-green-refactor", or wants integration tests. |
| [matt-pocock-to-spec](../matt-pocock-to-spec/SKILL.md) | Turn the current conversation into a spec and publish it to the project issue tracker: no interview, just synthesis of what you've already discussed. |
| [matt-pocock-to-tickets](../matt-pocock-to-tickets/SKILL.md) | Break a plan, spec, or the current conversation into a set of tracer-bullet tickets, each declaring its blocking edges, published to the configured tracker (edges as text in one file per ticket locally, or native blocking links on a real tracker). |
| [matt-pocock-wayfinder](../matt-pocock-wayfinder/SKILL.md) | Plan a huge chunk of work (more than one agent session can hold) as a shared map of decision tickets on your issue tracker, and resolve them one at a time until the way to the destination is clear. |
| [matt-pocock-implement](../matt-pocock-implement/SKILL.md) | Implement a piece of work based on a spec or set of tickets. |
| [matt-pocock-implement-spec](../matt-pocock-implement-spec/SKILL.md) | Implement the result of /to-spec and /to-tickets in code. |
| [matt-pocock-prototype](../matt-pocock-prototype/SKILL.md) | Build a throwaway prototype to answer a design question. Use when the user wants to sanity-check whether a state model or logic feels right, or explore what a UI should look like. |
| [matt-pocock-research](../matt-pocock-research/SKILL.md) | Investigate a question against high-trust primary sources and capture the findings as a Markdown file in the repo. Use when the user wants a topic researched, docs or API facts gathered, or reading legwork delegated to a background agent. |
| [matt-pocock-domain-modeling](../matt-pocock-domain-modeling/SKILL.md) | Build and sharpen a project's domain model. Use when discussing codebase terminology, writing or editing a GLOSSARY.md, or recording or editing an ADR. |
| [matt-pocock-codebase-design](../matt-pocock-codebase-design/SKILL.md) | Shared vocabulary for designing deep modules. Use when the user wants to design or improve a module's interface, find deepening opportunities, decide where a seam goes, make code more testable or AI-navigable, or when another skill needs the deep-module vocabulary. |
| [matt-pocock-code-review](../matt-pocock-code-review/SKILL.md) | Review the changes since a fixed point (commit, branch, tag, or merge-base) along two axes: Standards (does the code follow this repo's documented coding standards?) and Spec (does the code match what the originating issue/spec asked for?). Runs both reviews in parallel sub-agents and reports them side by side. Use when the user wants to review a branch, a PR, work-in-progress changes, or asks to \"review since X\". |
| [matt-pocock-pr](../matt-pocock-pr/SKILL.md) | Use when writing a PR body. |
| [matt-pocock-retro](../matt-pocock-retro/SKILL.md) | Conduct a retrospective on a coding session. |
| [matt-pocock-wizard](../matt-pocock-wizard/SKILL.md) | Generate an interactive bash wizard that walks a human through steps only they can perform. Use when provisioning infrastructure, setting up credentials or CI secrets, walking an unfamiliar third-party dashboard, or running a one-off migration or cutover. Don't invoke this for steps the agent can perform itself. |
| [matt-pocock-grill-me](../matt-pocock-grill-me/SKILL.md) | A relentless interview to sharpen a plan or design. |
| [matt-pocock-grilling](../matt-pocock-grilling/SKILL.md) | Grill the user relentlessly about a plan, decision, or idea. Use when the user wants to stress-test their thinking, or uses any 'grill' trigger phrases. |
| [matt-pocock-handoff](../matt-pocock-handoff/SKILL.md) | Compact the current conversation into a handoff document for another agent to pick up. |
| [matt-pocock-teach](../matt-pocock-teach/SKILL.md) | Teach the user a new skill or concept, within this workspace. |
| [matt-pocock-to-questionnaire](../matt-pocock-to-questionnaire/SKILL.md) | Turn a decision you can't fully answer into a questionnaire for someone else to fill in. |
| [matt-pocock-wait-what](../matt-pocock-wait-what/SKILL.md) | Stop. That last message did not land: re-pitch it. |
| [matt-pocock-writing-for-agents](../matt-pocock-writing-for-agents/SKILL.md) | Writing documents for agents. Use when creating or editing skills, or modifying AGENTS.md or CLAUDE.md. |
