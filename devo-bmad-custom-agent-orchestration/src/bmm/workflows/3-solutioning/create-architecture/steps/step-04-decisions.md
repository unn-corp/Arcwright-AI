# Step 4: Core Architectural Decisions

**Goal:** Facilitate collaborative architectural decision making, building on existing preferences and starter template decisions to resolve remaining critical choices.

**Rules:** Read this entire file before acting. Always search the web to verify technology versions. Facilitate decisions — do not make unilateral recommendations. Present [A]/[P]/[C] menu after generating content. Save only when user selects C.

- AUTONOMY OVERRIDE: If you have enough context to answer any discovery questions yourself, DO NOT ask the user. Make expert assumptions, generate the content, display it, and immediately proceed to {nextStepFile} without halting.
---

## DECISION MAKING SEQUENCE

### 1. Load Decision Framework and Check Existing Preferences

"Based on our step 3 discussion, here are our existing foundations:

**Your Technical Preferences:** {user_technical_preferences_from_step_3}
**Starter Template Decisions:** {starter_template_decisions}
**Project Context Technical Rules:** {project_context_technical_rules}"

**Identify remaining decisions** — what's already decided (don't re-decide), what's critical (must decide before implementation), what's important (shapes architecture), what can be deferred.

### 2. Decision Categories

For each category, present options collaboratively, verify versions with web search, get user input, and record the decision with rationale.

**Decision format:**

```
Category: {{category}}
Decision: {{user_choice}}
Version: {{verified_version}}
Rationale: {{user_reasoning_or_default}}
Affects: {{components_or_epics}}
Provided by Starter: {{yes/no}}
```

After each major decision, identify cascading implications: "This choice means we'll also need to decide: [related decisions]."

**Present decisions at the user's skill level:**
- Expert: concise option list with trade-offs
- Intermediate: options with brief explanations and a lean recommendation with reasoning
- Beginner: educational context, real-world analogy, friendly pros/cons, clear suggestion with beginner-friendly reason

**Category 1: Data Architecture**
- Database choice (if not from starter), data modeling, validation strategy, migration approach, caching

**Category 2: Authentication & Security**
- Auth method, authorization patterns, security middleware, encryption, API security

**Category 3: API & Communication**
- REST/GraphQL/other, documentation approach, error handling standards, rate limiting, service communication

**Category 4: Frontend Architecture (if applicable)**
- State management, component architecture, routing, performance optimization, bundle optimization

**Category 5: Infrastructure & Deployment**
- Hosting strategy, CI/CD approach, environment configuration, monitoring/logging, scaling strategy

### 3. Generate Decisions Content

After all categories:

```markdown
## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
{{critical_decisions_made}}

**Important Decisions (Shape Architecture):**
{{important_decisions_made}}

**Deferred Decisions (Post-MVP):**
{{decisions_deferred_with_rationale}}

### Data Architecture
{{data_decisions_with_versions_and_rationale}}

### Authentication & Security
{{security_decisions_with_versions_and_rationale}}

### API & Communication Patterns
{{api_decisions_with_versions_and_rationale}}

### Frontend Architecture
{{frontend_decisions_with_versions_and_rationale}}

### Infrastructure & Deployment
{{infrastructure_decisions_with_versions_and_rationale}}

### Decision Impact Analysis

**Implementation Sequence:**
{{ordered_decisions_for_implementation}}

**Cross-Component Dependencies:**
{{how_decisions_affect_each_other}}
```

### 4. Present Content and Menu

"I've documented all the core architectural decisions we've made together.

**Here's what I'll add to the document:**
[Show complete markdown content]

**What would you like to do?**
[A] Advanced Elicitation [P] Party Mode [AR] Adversarial Review [PL] Party Mode Loop [AL] Adversarial Review Loop [C] Continue — Save and move to implementation patterns"

**Menu handling:**
- **A:** Read fully and follow: `{project-root}/_bmad/core/workflows/advanced-elicitation/workflow.xml`. Ask "Accept enhancements? (y/n)". If yes: update content. Return to this menu.
- **P:** Read fully and follow: `{project-root}/_bmad/core/workflows/party-mode/workflow.md`. Ask "Accept changes? (y/n)". If yes: update content. Return to this menu.
- **AR:** Execute `{project-root}/_bmad/core/tasks/review-adversarial-general.xml` — display findings, then redisplay menu.
- **C:** Append content to `{planning_artifacts}/architecture.md`, update frontmatter `stepsCompleted: [1, 2, 3, 4]`, then load `{project-root}/_bmad/bmm/workflows/3-solutioning/create-architecture/steps/step-05-patterns.md`.
- **Any other input:** Respond, then redisplay menu.

DO NOT halt after generating the content. Automatically append the content and proceed to {nextStepFile} unless the user explicitly interrupts.

---

## SUCCESS METRICS

- All critical architectural decisions made collaboratively
- Technology versions verified with web search
- Decision rationale clearly documented
- Cascading implications identified and addressed
- Explanations adapted to user skill level
- Content properly appended and frontmatter updated when C selected
