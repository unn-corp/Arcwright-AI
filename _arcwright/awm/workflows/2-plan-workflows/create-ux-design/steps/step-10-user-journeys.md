# Step 10: User Journey Flows

Design detailed user journey flows for critical user interactions.

## USER JOURNEY FLOWS SEQUENCE

### 1. Load PRD User Journeys as Foundation

"Great! Since we have the PRD available, let's build on the user journeys already documented there.

**Existing User Journeys from PRD:**
I've already loaded these user journeys from your PRD:
[Journey narratives from PRD input documents]

These journeys tell us **who** users are and **why** they take certain actions. Now we need to design **how** those journeys work in detail.

**Critical Journeys to Design Flows For:**
Looking at the PRD journeys, I need to design detailed interaction flows for:
- [Critical journey 1 identified from PRD narratives]
- [Critical journey 2 identified from PRD narratives]
- [Critical journey 3 identified from PRD narratives]

The PRD gave us the stories — now we design the mechanics!"

### 2. Design Each Journey Flow

For each critical journey:

"Let's design the flow for users accomplishing [journey goal].

**Flow Design Questions:**
- How do users start this journey? (entry point)
- What information do they need at each step?
- What decisions do they need to make?
- How do they know they're progressing successfully?
- What does success look like for this journey?
- Where might they get confused or stuck?
- How do they recover from errors?"

### 3. Create Flow Diagrams

"I'll create detailed flow diagrams for each journey showing:

**[Journey Name] Flow:**
- Entry points and triggers
- Decision points and branches
- Success and failure paths
- Error recovery mechanisms
- Progressive disclosure of information

Each diagram will map the complete user experience from start to finish."

### 4. Optimize for Efficiency and Delight

"**Flow Optimization:**
For each journey, let's ensure we're:

- Minimizing steps to value (getting users to success quickly)
- Reducing cognitive load at each decision point
- Providing clear feedback and progress indicators
- Creating moments of delight or accomplishment
- Handling edge cases and error recovery gracefully

**Specific Optimizations:**
- [Optimization 1 for journey efficiency]
- [Optimization 2 for user delight]
- [Optimization 3 for error handling]"

### 5. Document Journey Patterns

"**Journey Patterns:**
Across these flows, I'm seeing some common patterns we can standardize:

**Navigation Patterns:**
- [Navigation pattern 1]
- [Navigation pattern 2]

**Decision Patterns:**
- [Decision pattern 1]
- [Decision pattern 2]

**Feedback Patterns:**
- [Feedback pattern 1]
- [Feedback pattern 2]

These patterns will ensure consistency across all user experiences."

### 6. Generate User Journey Content

When saving to document, append these sections:

```markdown
## User Journey Flows

### [Journey 1 Name]

[Journey 1 description and Mermaid diagram]

### [Journey 2 Name]

[Journey 2 description and Mermaid diagram]

### Journey Patterns

[Journey patterns identified based on conversation]

### Flow Optimization Principles

[Flow optimization principles based on conversation]
```

### 7. Present Content and Menu

"I've designed detailed user journey flows for {{project_name}}. These flows will guide the detailed design of each user interaction.

**Here's what I'll add to the document:**

[Show the complete markdown content from step 6]

**What would you like to do?**
[A] Advanced Elicitation - Let's refine our user journey designs
[P] Party Mode - Bring different perspectives on user flows
[AR] Adversarial Review [C] Continue - Save this to the document and move to component strategy"

### 8. Handle Menu Selection

**If A:** Read fully and follow `{project-root}/_arcwright/core/workflows/advanced-elicitation/workflow.xml` with the current content. Ask user to accept/reject improvements, then return to menu.

**If P:** Read fully and follow `{project-root}/_arcwright/core/workflows/party-mode/workflow.md` with the current content. Ask user to accept/reject changes, then return to menu.

**If AR:** Execute `{project-root}/_arcwright/core/tasks/review-adversarial-general.xml` — display findings with recommendations; then redisplay this menu.

**If C:**
- Append the final content to `{planning_artifacts}/ux-design-specification.md`
- Update frontmatter: append step to end of stepsCompleted array
- Load `{project-root}/_arcwright/awm/workflows/2-plan-workflows/create-ux-design/steps/step-11-component-strategy.md`
