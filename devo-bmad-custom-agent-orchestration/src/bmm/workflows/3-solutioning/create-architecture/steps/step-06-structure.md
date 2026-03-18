# Step 6: Project Structure & Boundaries

**Goal:** Define the complete project structure and architectural boundaries based on all decisions made, creating a concrete implementation guide for AI agents.

**Rules:** Read this entire file before acting. Create a specific, complete project tree — not generic placeholders. Map requirements to specific files and directories. Present [A]/[P]/[C] menu after generating content. Save only when user selects C.

- AUTONOMY OVERRIDE: If you have enough context to answer any discovery questions yourself, DO NOT ask the user. Make expert assumptions, generate the content, display it, and immediately proceed to {nextStepFile} without halting.
---

## PROJECT STRUCTURE SEQUENCE

### 1. Analyze Requirements Mapping

**From Epics (if available):**
"Epic: {epic_name} → Lives in {module/directory/service}"
- User stories within the epic, cross-epic dependencies, shared components needed

**From FR Categories (if no epics):**
"FR Category: {fr_category_name} → Lives in {module/directory/service}"
- Related FRs, shared functionality, integration points

### 2. Define Project Directory Structure

**Root configuration files:** Package management, build/dev config, environment files, CI/CD, documentation.

**Source code organization:** Entry points, core structure, feature/module organization, shared utilities, configuration.

**Test organization:** Unit, integration, e2e test locations and structure; test utilities and fixtures.

**Build and distribution:** Output directories, distribution files, static assets, documentation build.

### 3. Define Integration Boundaries

**API boundaries:** External endpoints, internal service boundaries, auth/authorization boundaries, data access layer.

**Component boundaries:** Frontend communication patterns, state management boundaries, service communication, event-driven integration.

**Data boundaries:** Database schema boundaries, data access patterns, caching, external data integration.

### 4. Create Complete Project Tree

Generate a comprehensive, specific directory structure showing all files and directories (not generic placeholders — use actual names from the project):

Example reference structures:

**Next.js Full-Stack:**
```
project-name/
├── README.md
├── package.json
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── .env.local / .env.example / .gitignore
├── .github/workflows/ci.yml
├── src/
│   ├── app/ (globals.css, layout.tsx, page.tsx)
│   ├── components/ (ui/, forms/, features/)
│   ├── lib/ (db.ts, auth.ts, utils.ts)
│   ├── types/
│   └── middleware.ts
├── prisma/ (schema.prisma, migrations/)
├── tests/ (__mocks__/, components/, e2e/)
└── public/assets/
```

**API Backend (NestJS):**
```
project-name/
├── package.json / nest-cli.json / tsconfig.json
├── .env / .env.example / .gitignore / README.md
├── src/
│   ├── main.ts / app.module.ts
│   ├── config/
│   ├── modules/ (auth/, users/, common/)
│   ├── services/ / repositories/ / decorators/
│   ├── pipes/ / guards/ / interceptors/
├── test/ (unit/, integration/, e2e/)
├── prisma/ (schema.prisma, migrations/)
└── docker-compose.yml
```

### 5. Map Requirements to Structure

Create explicit mapping from project requirements to specific files/directories:

```
Epic: User Management
- Components: src/components/features/users/
- Services: src/services/users/
- API Routes: src/app/api/users/
- Database: prisma/migrations/*users*
- Tests: tests/features/users/

Authentication System (cross-cutting)
- Components: src/components/auth/
- Services: src/services/auth/
- Middleware: src/middleware/auth.ts
- Tests: tests/auth/
```

### 6. Generate Structure Content

```markdown
## Project Structure & Boundaries

### Complete Project Directory Structure

{{complete_project_tree_with_all_files_and_directories}}

### Architectural Boundaries

**API Boundaries:**
{{api_boundary_definitions}}

**Component Boundaries:**
{{component_communication_patterns}}

**Service Boundaries:**
{{service_integration_patterns}}

**Data Boundaries:**
{{data_access_patterns}}

### Requirements to Structure Mapping

**Feature/Epic Mapping:**
{{mapping_of_epics_to_directories}}

**Cross-Cutting Concerns:**
{{mapping_of_shared_functionality}}

### Integration Points

**Internal Communication:**
{{how_components_communicate}}

**External Integrations:**
{{third_party_integration_points}}

**Data Flow:**
{{how_data_flows_through_architecture}}

### File Organization Patterns

**Configuration Files:** {{location_and_naming}}
**Source Organization:** {{structure_and_organization}}
**Test Organization:** {{test_structure}}
**Asset Organization:** {{static_and_dynamic_assets}}

### Development Workflow Integration

**Development Server:** {{dev_structure}}
**Build Process:** {{build_structure}}
**Deployment:** {{deployment_structure}}
```

### 7. Present Content and Menu

"I've created a complete project structure based on all our architectural decisions.

**Here's what I'll add to the document:**
[Show complete markdown content]

**What would you like to do?**
[A] Advanced Elicitation [P] Party Mode [AR] Adversarial Review [PL] Party Mode Loop [AL] Adversarial Review Loop [C] Continue — Save and move to architecture validation"

**Menu handling:**
- **A:** Read fully and follow: `{project-root}/_bmad/core/workflows/advanced-elicitation/workflow.xml`. Ask "Accept changes? (y/n)". If yes: update content. Return to this menu.
- **P:** Read fully and follow: `{project-root}/_bmad/core/workflows/party-mode/workflow.md`. Ask "Accept changes? (y/n)". If yes: update content. Return to this menu.
- **AR:** Execute `{project-root}/_bmad/core/tasks/review-adversarial-general.xml` — display findings, then redisplay menu.
- **C:** Append content to `{planning_artifacts}/architecture.md`, update frontmatter `stepsCompleted: [1, 2, 3, 4, 5, 6]`, then load `{project-root}/_bmad/bmm/workflows/3-solutioning/create-architecture/steps/step-07-validation.md`.
- **Any other input:** Respond, then redisplay menu.

DO NOT halt after generating the content. Automatically append the content and proceed to {nextStepFile} unless the user explicitly interrupts.

---

## SUCCESS METRICS

- Complete project tree defined with all specific files and directories
- All architectural boundaries clearly documented
- Requirements/epics mapped to specific locations
- Integration points and communication patterns defined
- Project structure aligned with chosen technology stack
- Content properly appended and frontmatter updated when C selected
