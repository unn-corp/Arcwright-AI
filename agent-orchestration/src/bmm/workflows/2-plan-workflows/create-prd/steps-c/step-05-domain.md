---
name: 'step-05-domain'
description: 'Explore domain-specific requirements for complex domains (optional step)'

# File References
nextStepFile: '{project-root}/_bmad/bmm/workflows/2-plan-workflows/create-prd/steps-c/step-06-innovation.md'
outputFile: '{planning_artifacts}/prd.md'
domainComplexityCSV: '{project-root}/_bmad/bmm/workflows/2-plan-workflows/create-prd/data/domain-complexity.csv'

# Task References
advancedElicitationTask: '{project-root}/_bmad/core/workflows/advanced-elicitation/workflow.xml'
partyModeWorkflow: '{project-root}/_bmad/core/workflows/party-mode/workflow.md'
---

# Step 5: Domain-Specific Requirements (Optional)

**Progress: Step 5 of 13** - Next: Innovation Focus

## YOUR TASK

For complex domains only that have a mapping in {domainComplexityCSV}, explore domain-specific constraints, compliance requirements, and technical considerations that shape the product.

### Step-Specific Rules
- AUTONOMY OVERRIDE: If you have enough context to answer any discovery questions yourself, DO NOT ask the user. Make expert assumptions, generate the content, display it, and immediately proceed to {nextStepFile} without halting.

- This step is OPTIONAL — only needed for complex domains
- SKIP if domain complexity is "low" from step-02
- Focus on constraints, compliance, and domain patterns

## DOMAIN DISCOVERY SEQUENCE:

### 1. Check Domain Complexity

**Review classification from step-02:**

- What's the domain complexity level? (low/medium/high)
- What's the specific domain? (healthcare, fintech, education, etc.)

**If complexity is LOW:**

Offer to skip:
"The domain complexity from our discovery is low. We may not need deep domain-specific requirements. Would you like to:
- [C] Skip this step and move to Innovation
- [D] Do domain exploration anyway"

**If complexity is MEDIUM or HIGH:**

Proceed with domain exploration.

### 2. Load Domain Reference Data

**Attempt subprocess data lookup:**

"Your task: Lookup data in {domainComplexityCSV}

**Search criteria:**
- Find row where domain matches {{domainFromStep02}}

**Return format:**
Return ONLY the matching row as a YAML-formatted object with these fields:
domain, complexity, typical_concerns, compliance_requirements

**Do NOT return the entire CSV - only the matching row.**"

**Graceful degradation (if Task tool unavailable):**
- Load the CSV file directly
- Find the matching row manually
- Extract required fields
- Understand typical concerns and compliance requirements

### 3. Explore Domain-Specific Concerns

**Start with what you know:**

Acknowledge the domain and explore what makes it complex:
- What regulations apply? (HIPAA, PCI-DSS, GDPR, SOX, etc.)
- What standards matter? (ISO, NIST, domain-specific standards)
- What certifications are needed? (security, privacy, domain-specific)
- What integrations are required? (EMR systems, payment processors, etc.)

**Explore technical constraints:**
- Security requirements (encryption, audit logs, access control)
- Privacy requirements (data handling, consent, retention)
- Performance requirements (real-time, batch, latency)
- Availability requirements (uptime, disaster recovery)

### 4. Document Domain Requirements

**Structure the requirements around key concerns:**

```markdown
### Compliance & Regulatory
- [Specific requirements]

### Technical Constraints
- [Security, privacy, performance needs]

### Integration Requirements
- [Required systems and data flows]

### Risk Mitigations
- [Domain-specific risks and how to address them]
```

### 5. Validate Completeness

**Check with the user:**

"Are there other domain-specific concerns we should consider? For [this domain], what typically gets overlooked?"

### N. Present MENU OPTIONS

Display: "**Select:** [A] Advanced Elicitation [P] Party Mode [AR] Adversarial Review [PL] Party Mode Loop [AL] Adversarial Review Loop [C] Continue - Save and Proceed to Innovation (Step 6 of 13)"

#### Menu Handling Logic:
- IF A: Read fully and follow: {advancedElicitationTask}, and when finished redisplay the menu
- IF P: Read fully and follow: {partyModeWorkflow}, and when finished redisplay the menu
    - IF PL: Prompt user for loops N, then execute {project-root}/_bmad/core/tasks/review-party-loop.xml with loops=N, then redisplay menu
    - IF AL: Prompt user for loops N, then execute {project-root}/_bmad/core/tasks/review-adversarial-loop.xml with loops=N, then redisplay menu
- IF AR: Execute {project-root}/_bmad/core/tasks/review-adversarial-general.xml — pass the current editPlan (or plan document in context) as the content to review; display findings with recommendations; then redisplay this menu
- IF C: Save content to {outputFile}, update frontmatter, then read fully and follow: {nextStepFile}
- IF Any other comments or queries: help user respond then redisplay menu

DO NOT halt after presenting the menu if you have finished generating the content. You should automatically assume 'C' and proceed to {nextStepFile} unless the user explicitly interrupts. After other menu items execution, return to this menu.

## APPEND TO DOCUMENT

When user selects 'C', append to `{outputFile}`:

```markdown
## Domain-Specific Requirements

{{discovered domain requirements}}
```

If step was skipped, append nothing and proceed.
