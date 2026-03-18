# Step 2: Project Context Analysis

**Goal:** Analyze loaded project documents to understand architectural scope, requirements, and constraints before decision making.

**Rules:** Read this entire file before acting. Pure analysis phase — no technology decisions yet. Present [A]/[P]/[C] menu after generating content. Save only when user selects C.

- AUTONOMY OVERRIDE: If you have enough context to answer any discovery questions yourself, DO NOT ask the user. Make expert assumptions, generate the content, display it, and immediately proceed to {nextStepFile} without halting.
---

## CONTEXT ANALYSIS SEQUENCE

### 1. Review Project Requirements

**From PRD:** Extract and analyze FRs, identify NFRs (performance, security, compliance), note technical constraints, count and categorize requirements for scale assessment.

**From Epics/Stories (if available):** Map epic structure to architectural components, extract acceptance criteria for technical implications, identify cross-cutting concerns, estimate complexity.

**From UX Design (if available):** Extract architectural implications — component complexity, animation/real-time needs, platform-specific requirements, accessibility standards (WCAG level), responsive design breakpoints, offline capability, performance expectations.

### 2. Project Scale Assessment

Calculate complexity indicators: real-time features, multi-tenancy, regulatory compliance, integration complexity, user interaction complexity, data complexity and volume.

### 3. Reflect Understanding

Present analysis to user for validation:

"I'm reviewing {project_name}.

{if epics loaded} I see {epic_count} epics with {story_count} total stories. {/if}
{if no epics} I found {fr_count} functional requirements in {fr_category_list}. {/if}
{if UX loaded} I also found your UX specification. {/if}

**Key architectural aspects:**
- [Core functionality from FRs]
- [Critical NFRs that will shape architecture]
- [UX complexity and technical requirements if applicable]
- [Unique technical challenges or constraints]
- [Regulatory/compliance requirements]

**Scale indicators:**
- Project complexity: [low/medium/high/enterprise]
- Primary technical domain: [web/mobile/api/backend/full-stack]
- Cross-cutting concerns: [list major ones]

Does this match your understanding?"

### 4. Generate Project Context Content

Prepare content to append to the document:

```markdown
## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
{{analysis of FRs and architectural implications}}

**Non-Functional Requirements:**
{{NFRs that will drive architectural decisions}}

**Scale & Complexity:**
- Primary domain: {{technical_domain}}
- Complexity level: {{complexity_level}}
- Estimated architectural components: {{component_count}}

### Technical Constraints & Dependencies

{{known_constraints_dependencies}}

### Cross-Cutting Concerns Identified

{{concerns affecting multiple components}}
```

### 5. Present Content and Menu

Show the generated content and display:

"I've drafted the Project Context Analysis based on your requirements.

**Here's what I'll add to the document:**
[Show complete markdown content]

**What would you like to do?**
[A] Advanced Elicitation [P] Party Mode [AR] Adversarial Review [PL] Party Mode Loop [AL] Adversarial Review Loop [C] Continue — Save and begin architectural decisions"

**Menu handling:**
- **A:** Read fully and follow: `{project-root}/_bmad/core/workflows/advanced-elicitation/workflow.xml`. Ask "Accept enhancements? (y/n)". If yes: update content. Return to this menu.
- **P:** Read fully and follow: `{project-root}/_bmad/core/workflows/party-mode/workflow.md`. Ask "Accept changes? (y/n)". If yes: update content. Return to this menu.
- **AR:** Execute `{project-root}/_bmad/core/tasks/review-adversarial-general.xml` — display findings, then redisplay menu.
- **C:** Append content to `{planning_artifacts}/architecture.md`, update frontmatter `stepsCompleted: [1, 2]`, then load `{project-root}/_bmad/bmm/workflows/3-solutioning/create-architecture/steps/step-03-starter.md`.
- **Any other input:** Respond, then redisplay menu.

DO NOT halt after generating the content. Automatically append the content and proceed to {nextStepFile} unless the user explicitly interrupts.

---

## SUCCESS METRICS

- All input documents thoroughly analyzed for architectural implications
- Project scope and complexity assessed and validated by user
- Technical constraints and dependencies identified
- Cross-cutting concerns mapped
- Content properly appended and frontmatter updated when C selected
