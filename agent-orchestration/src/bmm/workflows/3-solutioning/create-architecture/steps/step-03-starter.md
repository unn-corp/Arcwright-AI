# Step 3: Starter Template Evaluation

**Goal:** Discover technical preferences and evaluate starter template options to establish solid architectural foundations.

**Rules:** Read this entire file before acting. Always search the web to verify current versions — never use hardcoded versions. Present [A]/[P]/[C] menu after generating content. Save only when user selects C.

- AUTONOMY OVERRIDE: If you have enough context to answer any discovery questions yourself, DO NOT ask the user. Make expert assumptions, generate the content, display it, and immediately proceed to {nextStepFile} without halting.
---

## STARTER EVALUATION SEQUENCE

### 0. Check Technical Preferences

**Check project context for existing technical preferences:**
"Before we dive into starter templates, let me check if you have documented technical preferences.

{if project context exists}
**Project Context Technical Rules Found:**
- Languages/Frameworks: {from context}
- Tools & Libraries: {from context}
- Development Patterns: {from context}
- Platform Preferences: {from context}
{else}
No existing technical preferences found. We'll establish them now.
{/if}"

**Discover user preferences — ask about:**
- Languages (TypeScript/JavaScript, Python, Go, Rust)
- Frameworks (React, Vue, Angular, Next.js)
- Databases (PostgreSQL, MongoDB, MySQL)
- Team experience level with different technologies
- Cloud/deployment preferences (AWS, Vercel, Railway; Docker vs Serverless)
- Existing integrations (payment, auth, analytics services)

### 1. Identify Primary Technology Domain

Based on project context and preferences:
- **Web app** → Next.js, Vite, Remix, SvelteKit
- **Mobile** → React Native, Expo, Flutter
- **API/Backend** → NestJS, Express, Fastify, Supabase
- **CLI** → oclif, commander
- **Full-stack** → T3, RedwoodJS, Blitz
- **Desktop** → Electron, Tauri

### 2. UX Requirements Consideration

If UX spec loaded, factor in: rich animations (Framer Motion), complex forms (React Hook Form), real-time features (Socket.io), design system (Storybook), offline/PWA (service workers).

### 3. Research Current Starter Options

Search the web:
- `"{primary_technology} starter template CLI create command latest"`
- `"{primary_technology} boilerplate generator latest options"`
- `"{primary_technology} production-ready starter best practices"`

For each promising starter:
- `"{starter_name} default setup technologies included latest"`
- `"{starter_name} project structure file organization"`
- `"{starter_name} recent updates maintenance status"`

### 4. Analyze Each Viable Starter

Document what each provides: language/TypeScript config, styling solution, testing framework, linting/formatting, build tooling, project structure, code organization patterns, routing, state management, environment config, development experience.

### 5. Present Options (adapted to user skill level)

**Expert:** Quick decision list of key decisions made. "Use it?"

**Intermediate:** Well-explained options with decision list and rationale.

**Beginner:** Real-world analogy, friendly explanation of decisions made, clear recommendation with reason.

If user shows interest, get exact current CLI commands:
- `"{starter_name} CLI command options flags latest"`

### 6. Generate Starter Template Content

```markdown
## Starter Template Evaluation

### Primary Technology Domain

{{identified_domain}} based on project requirements analysis

### Starter Options Considered

{{analysis_of_evaluated_starters}}

### Selected Starter: {{starter_name}}

**Rationale for Selection:**
{{why_this_starter_was_chosen}}

**Initialization Command:**
```bash
{{full_starter_command_with_options}}
```

**Architectural Decisions Provided by Starter:**

**Language & Runtime:** {{language_typescript_setup}}
**Styling Solution:** {{styling_solution_configuration}}
**Build Tooling:** {{build_tools_and_optimization}}
**Testing Framework:** {{testing_setup_and_configuration}}
**Code Organization:** {{project_structure_and_patterns}}
**Development Experience:** {{development_tools_and_workflow}}

**Note:** Project initialization using this command should be the first implementation story.
```

### 7. Present Content and Menu

"I've analyzed starter template options for {project_type} projects.

**Here's what I'll add to the document:**
[Show complete markdown content]

**What would you like to do?**
[A] Advanced Elicitation [P] Party Mode [AR] Adversarial Review [PL] Party Mode Loop [AL] Adversarial Review Loop [C] Continue — Save and move to architectural decisions"

**Menu handling:**
- **A:** Read fully and follow: `{project-root}/_bmad/core/workflows/advanced-elicitation/workflow.xml`. Ask "Accept changes? (y/n)". If yes: update content. Return to this menu.
- **P:** Read fully and follow: `{project-root}/_bmad/core/workflows/party-mode/workflow.md`. Ask "Accept changes? (y/n)". If yes: update content. Return to this menu.
- **AR:** Execute `{project-root}/_bmad/core/tasks/review-adversarial-general.xml` — display findings, then redisplay menu.
- **C:** Append content to `{planning_artifacts}/architecture.md`, update frontmatter `stepsCompleted: [1, 2, 3]`, then load `{project-root}/_bmad/bmm/workflows/3-solutioning/create-architecture/steps/step-04-decisions.md`.
- **Any other input:** Respond, then redisplay menu.

DO NOT halt after generating the content. Automatically append the content and proceed to {nextStepFile} unless the user explicitly interrupts.

---

## SUCCESS METRICS

- Primary technology domain correctly identified
- Current starter templates researched with web search (no hardcoded versions)
- Architectural implications of starter choice documented
- User provided clear rationale for starter selection
- Content properly appended and frontmatter updated when C selected
