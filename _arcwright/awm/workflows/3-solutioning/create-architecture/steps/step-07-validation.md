# Step 7: Architecture Validation & Completion

**Goal:** Validate the complete architecture for coherence, completeness, and readiness to guide AI agents through consistent implementation.

**Rules:** Read this entire file before acting. Run comprehensive validation — do not skip checks. Present [A]/[P]/[C] menu after generating validation results. Save only when user selects C.

- AUTONOMY OVERRIDE: If you have enough context to answer any discovery questions yourself, DO NOT ask the user. Make expert assumptions, generate the content, display it, and immediately proceed to {nextStepFile} without halting.
---

## VALIDATION SEQUENCE

### 1. Coherence Validation

**Decision compatibility:** Do all technology choices work together without conflicts? Are versions compatible? Do patterns align with technology choices? Any contradictory decisions?

**Pattern consistency:** Do implementation patterns support architectural decisions? Are naming conventions consistent across all areas? Do structure patterns align with tech stack? Are communication patterns coherent?

**Structure alignment:** Does the project structure support all architectural decisions? Are boundaries properly defined? Does the structure enable the chosen patterns? Are integration points properly structured?

### 2. Requirements Coverage Validation

**From Epics (if available):** Does every epic have architectural support? Are all user stories implementable with these decisions? Are cross-epic dependencies handled? Any gaps in epic coverage?

**From FRs (if no epics):** Does every functional requirement have architectural support? Are all FR categories covered? Are cross-cutting FRs properly addressed?

**Non-functional requirements:** Performance, security, scalability, and compliance requirements all addressed architecturally?

### 3. Implementation Readiness Validation

**Decision completeness:** All critical decisions documented with versions? Implementation patterns comprehensive? Consistency rules clear and enforceable? Examples provided for major patterns?

**Structure completeness:** Project structure complete and specific? All files and directories defined? Integration points clearly specified? Component boundaries well-defined?

**Pattern completeness:** All potential conflict points addressed? Naming conventions comprehensive? Communication and process patterns fully specified?

### 4. Gap Analysis

**Critical gaps** (block implementation): Missing decisions, incomplete patterns, missing structural elements, undefined integration points.

**Important gaps** (improve quality): Areas needing more specification, patterns that could be more comprehensive.

**Nice-to-have gaps**: Additional patterns, supplementary documentation, tooling recommendations.

### 5. Address Validation Issues

For any issues found, facilitate resolution:

**Critical:** "I found issues that need addressing before implementation: {description}. These could cause implementation problems. How would you like to resolve this?"

**Important:** "A few areas could be improved: {description}. These aren't blocking, but addressing them would make implementation smoother. Should we work on these?"

**Minor:** "Minor suggestions: {description}. Optional refinements — would you like to address any?"

### 6. Generate Validation Content

```markdown
## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:** {{assessment}}
**Pattern Consistency:** {{verification}}
**Structure Alignment:** {{confirmation}}

### Requirements Coverage Validation ✅

**Epic/Feature Coverage:** {{verification}}
**Functional Requirements Coverage:** {{confirmation}}
**Non-Functional Requirements Coverage:** {{verification}}

### Implementation Readiness Validation ✅

**Decision Completeness:** {{assessment}}
**Structure Completeness:** {{evaluation}}
**Pattern Completeness:** {{verification}}

### Gap Analysis Results

{{gap_analysis_findings_with_priority_levels}}

### Validation Issues Addressed

{{issues_found_and_resolutions}}

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped

**✅ Architectural Decisions**
- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Integration patterns defined
- [x] Performance considerations addressed

**✅ Implementation Patterns**
- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Communication patterns specified
- [x] Process patterns documented

**✅ Project Structure**
- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION
**Confidence Level:** {{high/medium/low}}

**Key Strengths:** {{list}}
**Areas for Future Enhancement:** {{areas}}

### Implementation Handoff

**AI Agent Guidelines:**
- Follow all architectural decisions exactly as documented
- Use implementation patterns consistently across all components
- Respect project structure and boundaries
- Refer to this document for all architectural questions

**First Implementation Priority:** {{starter_template_command_or_first_step}}
```

### 7. Present Content and Menu

"I've completed a comprehensive validation of your architecture.

**Validation Summary:**
- ✅ Coherence: All decisions work together
- ✅ Coverage: All requirements are supported
- ✅ Readiness: AI agents can implement consistently

**Here's what I'll add to complete the architecture document:**
[Show complete markdown content]

**What would you like to do?**
[A] Advanced Elicitation [P] Party Mode [AR] Adversarial Review [PL] Party Mode Loop [AL] Adversarial Review Loop [C] Continue — Complete the architecture"

**Menu handling:**
- **A:** Read fully and follow: `{project-root}/_arcwright/core/workflows/advanced-elicitation/workflow.xml`. Ask "Accept improvements? (y/n)". If yes: update content. Return to this menu.
- **P:** Read fully and follow: `{project-root}/_arcwright/core/workflows/party-mode/workflow.md`. Ask "Accept changes? (y/n)". If yes: update content. Return to this menu.
- **AR:** Execute `{project-root}/_arcwright/core/tasks/review-adversarial-general.xml` — display findings, then redisplay menu.
- **C:** Append content to `{planning_artifacts}/architecture.md`, update frontmatter `stepsCompleted: [1, 2, 3, 4, 5, 6, 7]`, then load `{project-root}/_arcwright/awm/workflows/3-solutioning/create-architecture/steps/step-08-complete.md`.
- **Any other input:** Respond, then redisplay menu.

DO NOT halt after generating the content. Automatically append the content and proceed to {nextStepFile} unless the user explicitly interrupts.

---

## SUCCESS METRICS

- All architectural decisions validated for coherence
- Complete requirements coverage verified
- Implementation readiness confirmed
- All gaps identified and addressed
- Comprehensive validation checklist completed
- Content properly appended and frontmatter updated when C selected
