---
name: 'step-10-nonfunctional'
description: 'Define quality attributes that matter for this specific product'

# File References
nextStepFile: '{project-root}/_arcwright/awm/workflows/2-plan-workflows/create-prd/steps-c/step-11-polish.md'
outputFile: '{planning_artifacts}/prd.md'

# Task References
advancedElicitationTask: '{project-root}/_arcwright/core/workflows/advanced-elicitation/workflow.xml'
partyModeWorkflow: '{project-root}/_arcwright/core/workflows/party-mode/workflow.md'
---

# Step 10: Non-Functional Requirements

**Progress: Step 10 of 12** - Next: Polish Document

## YOUR TASK

Define non-functional requirements that specify quality attributes for the product, focusing only on what matters for THIS specific product.

### Step-Specific Rules
- AUTONOMY OVERRIDE: If you have enough context to answer any discovery questions yourself, DO NOT ask the user. Make expert assumptions, generate the content, display it, and immediately proceed to {nextStepFile} without halting.

- SELECTIVE: Only document NFRs that actually apply to the product
- Focus on quality attributes that matter for THIS specific product

## NON-FUNCTIONAL REQUIREMENTS SEQUENCE:

### 1. Explain NFR Purpose and Scope

Start by clarifying what NFRs are and why we're selective:

**NFR Purpose:**
NFRs define HOW WELL the system must perform, not WHAT it must do. They specify quality attributes like performance, security, scalability, etc.

**Selective Approach:**
We only document NFRs that matter for THIS product. If a category doesn't apply, we skip it entirely. This prevents requirement bloat and focuses on what's actually important.

### 2. Assess Product Context for NFR Relevance

Evaluate which NFR categories matter based on product context:

**Quick Assessment Questions:**

- **Performance**: Is there user-facing impact of speed?
- **Security**: Are we handling sensitive data or payments?
- **Scalability**: Do we expect rapid user growth?
- **Accessibility**: Are we serving broad public audiences?
- **Integration**: Do we need to connect with other systems?
- **Reliability**: Would downtime cause significant problems?

### 3. Explore Relevant NFR Categories

For each relevant category, conduct targeted discovery:

#### Performance NFRs (If relevant):

Explore performance requirements:
- What parts of the system need to be fast for users to be successful?
- Are there specific response time expectations?
- What happens if performance is slower than expected?
- Are there concurrent user scenarios we need to support?

#### Security NFRs (If relevant):

Explore security requirements:
- What data needs to be protected?
- Who should have access to what?
- What are the security risks we need to mitigate?
- Are there compliance requirements (GDPR, HIPAA, PCI-DSS)?

#### Scalability NFRs (If relevant):

Explore scalability requirements:
- How many users do we expect initially? Long-term?
- Are there seasonal or event-based traffic spikes?
- What happens if we exceed our capacity?
- What growth scenarios should we plan for?

#### Accessibility NFRs (If relevant):

Explore accessibility requirements:
- Are we serving users with visual, hearing, or motor impairments?
- Are there legal accessibility requirements (WCAG, Section 508)?
- What accessibility features are most important for our users?

#### Integration NFRs (If relevant):

Explore integration requirements:
- What external systems do we need to connect with?
- Are there APIs or data formats we must support?
- How reliable do these integrations need to be?

### 4. Make NFRs Specific and Measurable

For each relevant NFR category, ensure criteria are testable:

**From Vague to Specific:**

- NOT: "The system should be fast" → "User actions complete within 2 seconds"
- NOT: "The system should be secure" → "All data is encrypted at rest and in transit"
- NOT: "The system should scale" → "System supports 10x user growth with <10% performance degradation"

### 5. Generate NFR Content (Only Relevant Categories)

Prepare the content to append to the document:

#### Content Structure (Dynamic based on relevance):

When saving to document, append these Level 2 and Level 3 sections (only include sections that are relevant):

```markdown
## Non-Functional Requirements

### Performance

[Performance requirements based on conversation - only include if relevant]

### Security

[Security requirements based on conversation - only include if relevant]

### Scalability

[Scalability requirements based on conversation - only include if relevant]

### Accessibility

[Accessibility requirements based on conversation - only include if relevant]

### Integration

[Integration requirements based on conversation - only include if relevant]
```

### 6. Present MENU OPTIONS

Present the non-functional requirements for review, then display menu:
- Show defined NFRs (using structure from step 5)
- Note that only relevant categories were included
- Emphasize NFRs specify how well the system needs to perform
- Ask if they'd like to refine further, get other perspectives, or proceed

Display: "**Select:** [A] Advanced Elicitation [P] Party Mode [AR] Adversarial Review [PL] Party Mode Loop [AL] Adversarial Review Loop [C] Continue to Polish Document (Step 11 of 12)"

#### Menu Handling Logic:
- IF A: Read fully and follow: {advancedElicitationTask} with the current NFR content, process the enhanced quality attribute insights that come back, ask user if they accept the improvements, if yes update content then redisplay menu, if no keep original content then redisplay menu
- IF P: Read fully and follow: {partyModeWorkflow} with the current NFR list, process the collaborative technical validation and additions, ask user if they accept the changes, if yes update content then redisplay menu, if no keep original content then redisplay menu
    - IF PL: Prompt user for loops N, then execute {project-root}/_arcwright/core/tasks/review-party-loop.xml with loops=N, then redisplay menu
    - IF AL: Prompt user for loops N, then execute {project-root}/_arcwright/core/tasks/review-adversarial-loop.xml with loops=N, then redisplay menu
- IF AR: Execute {project-root}/_arcwright/core/tasks/review-adversarial-general.xml — pass the current editPlan (or plan document in context) as the content to review; display findings with recommendations; then redisplay this menu
- IF C: Append the final content to {outputFile}, update frontmatter by adding this step name to the end of the stepsCompleted array, then read fully and follow: {nextStepFile}
- IF Any other: help user respond, then redisplay menu

DO NOT halt after presenting the menu if you have finished generating the content. You should automatically assume 'C' and proceed to {nextStepFile} unless the user explicitly interrupts. After other menu items execution, return to this menu.

## APPEND TO DOCUMENT:

When user selects 'C', append the content directly to the document using the structure from step 5.

## NFR CATEGORY GUIDANCE:

**Include Performance When:**

- User-facing response times impact success
- Real-time interactions are critical
- Performance is a competitive differentiator

**Include Security When:**

- Handling sensitive user data
- Processing payments or financial information
- Subject to compliance regulations
- Protecting intellectual property

**Include Scalability When:**

- Expecting rapid user growth
- Handling variable traffic patterns
- Supporting enterprise-scale usage
- Planning for market expansion

**Include Accessibility When:**

- Serving broad public audiences
- Subject to accessibility regulations
- Targeting users with disabilities
- B2B customers with accessibility requirements
