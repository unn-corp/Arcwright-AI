# Step 5: Implementation Patterns & Consistency Rules

**Goal:** Define implementation patterns and consistency rules that ensure multiple AI agents write compatible, consistent code that works together seamlessly.

**Rules:** Read this entire file before acting. Focus on consistency, not implementation details. Emphasize what agents could decide differently if not specified. Present [A]/[P]/[C] menu after generating content. Save only when user selects C.

- AUTONOMY OVERRIDE: If you have enough context to answer any discovery questions yourself, DO NOT ask the user. Make expert assumptions, generate the content, display it, and immediately proceed to {nextStepFile} without halting.
---

## PATTERNS DEFINITION SEQUENCE

### 1. Identify Potential Conflict Points

Based on the chosen technology stack, identify where AI agents could make different choices:

**Naming conflicts:** Database table/column naming, API endpoint naming, file/directory naming, component/function/variable naming, route parameter formats.

**Structural conflicts:** Test locations, component organization, utilities/helpers location, configuration file organization, static assets.

**Format conflicts:** API response wrapper formats, error response structures, date/time formats, JSON field naming, API status code usage.

**Communication conflicts:** Event naming conventions, event payload structures, state update patterns, action naming, logging formats.

**Process conflicts:** Loading state handling, error recovery, retry implementation, authentication flow, validation timing.

### 2. Facilitate Pattern Decisions

For each conflict category, present the issue and options collaboratively:

"Given we're using {tech_stack}, different AI agents might handle {conflict_area} differently. For example: one might name tables 'users', another 'Users' — causing conflicts.

Common approaches for {pattern_category}:
1. {option_1} — {pros_and_cons}
2. {option_2} — {pros_and_cons}

Which approach makes the most sense?"

### 3. Pattern Categories to Define

**Naming Patterns:**
- Database: table naming (users/Users/user), columns (user_id/userId), foreign keys, indexes
- API: endpoint naming (/users vs /user), route parameters (:id vs {id}), query params, headers
- Code: component naming (UserCard vs user-card), files, functions, variables

**Structure Patterns:**
- Test locations (`__tests__/` or co-located `*.test.ts`)
- Component organization (by feature vs by type)
- Shared utilities location
- Services/repositories organization
- Config files, static assets, documentation, environment files

**Format Patterns:**
- API response wrapper (`{data, error}` or direct response)
- Error format (`{message, code}` or `{error: {type, detail}}`)
- Date format in JSON (ISO strings or timestamps)
- JSON field naming (snake_case or camelCase)
- Null handling, array vs object for single items

**Communication Patterns:**
- Event naming (`user.created` or `UserCreated`)
- Event payload structure, versioning, async handling
- State updates (immutable vs mutation), action naming, selectors

**Process Patterns:**
- Global error handling approach, error boundaries
- User-facing error message format vs logging
- Loading state naming, global vs local, UI patterns

### 4. Generate Patterns Content

```markdown
## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:**
{{number}} areas where AI agents could make different choices

### Naming Patterns

**Database Naming Conventions:**
{{database_naming_rules_with_examples}}

**API Naming Conventions:**
{{api_naming_rules_with_examples}}

**Code Naming Conventions:**
{{code_naming_rules_with_examples}}

### Structure Patterns

**Project Organization:**
{{project_structure_rules_with_examples}}

**File Structure Patterns:**
{{file_organization_rules_with_examples}}

### Format Patterns

**API Response Formats:**
{{api_response_structure_rules}}

**Data Exchange Formats:**
{{data_format_rules_with_examples}}

### Communication Patterns

**Event System Patterns:**
{{event_naming_and_structure_rules}}

**State Management Patterns:**
{{state_update_and_organization_rules}}

### Process Patterns

**Error Handling Patterns:**
{{consistent_error_handling_approaches}}

**Loading State Patterns:**
{{loading_state_management_rules}}

### Enforcement Guidelines

**All AI Agents MUST:**
- {{mandatory_pattern_1}}
- {{mandatory_pattern_2}}
- {{mandatory_pattern_3}}

### Pattern Examples

**Good Examples:**
{{concrete_examples_of_correct_usage}}

**Anti-Patterns:**
{{examples_of_what_to_avoid}}
```

### 5. Present Content and Menu

"I've documented implementation patterns that will prevent conflicts between AI agents.

**Here's what I'll add to the document:**
[Show complete markdown content]

**What would you like to do?**
[A] Advanced Elicitation [P] Party Mode [AR] Adversarial Review [PL] Party Mode Loop [AL] Adversarial Review Loop [C] Continue — Save and move to project structure"

**Menu handling:**
- **A:** Read fully and follow: `{project-root}/_arcwright/core/workflows/advanced-elicitation/workflow.xml`. Ask "Accept refinements? (y/n)". If yes: update content. Return to this menu.
- **P:** Read fully and follow: `{project-root}/_arcwright/core/workflows/party-mode/workflow.md`. Ask "Accept changes? (y/n)". If yes: update content. Return to this menu.
- **AR:** Execute `{project-root}/_arcwright/core/tasks/review-adversarial-general.xml` — display findings, then redisplay menu.
- **C:** Append content to `{planning_artifacts}/architecture.md`, update frontmatter `stepsCompleted: [1, 2, 3, 4, 5]`, then load `{project-root}/_arcwright/awm/workflows/3-solutioning/create-architecture/steps/step-06-structure.md`.
- **Any other input:** Respond, then redisplay menu.

DO NOT halt after generating the content. Automatically append the content and proceed to {nextStepFile} unless the user explicitly interrupts.

---

## SUCCESS METRICS

- All potential AI agent conflict points identified and addressed
- Comprehensive patterns defined for naming, structure, format, and communication
- Concrete examples provided for each pattern
- Enforcement guidelines clearly documented
- User collaborated on pattern decisions
- Content properly appended and frontmatter updated when C selected
