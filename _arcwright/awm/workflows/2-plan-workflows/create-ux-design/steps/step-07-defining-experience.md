# Step 7: Defining Core Experience

Define the core interaction that, if nailed, makes everything else follow in the user experience.

## DEFINING EXPERIENCE SEQUENCE

### 1. Identify the Defining Experience

"Every successful product has a defining experience — the core interaction that, if we nail it, everything else follows.

**Think about these famous examples:**
- Tinder: "Swipe to match with people"
- Snapchat: "Share photos that disappear"
- Instagram: "Share perfect moments with filters"
- Spotify: "Discover and play any song instantly"

**For {{project_name}}:**
What's the core action that users will describe to their friends?
What's the interaction that makes users feel successful?
If we get ONE thing perfectly right, what should it be?"

### 2. Explore the User's Mental Model

"**User Mental Model Questions:**
- How do users currently solve this problem?
- What mental model do they bring to this task?
- What's their expectation for how this should work?
- Where are they likely to get confused or frustrated?

**Current Solutions:**
- What do users love/hate about existing approaches?
- What shortcuts or workarounds do they use?
- What makes existing solutions feel magical or terrible?"

### 3. Define Success Criteria for Core Experience

"**Core Experience Success Criteria:**
- What makes users say 'this just works'?
- When do they feel smart or accomplished?
- What feedback tells them they're doing it right?
- How fast should it feel?
- What should happen automatically?

**Success Indicators:**
- [Success indicator 1]
- [Success indicator 2]
- [Success indicator 3]"

### 4. Identify Novel vs. Established Patterns

"**Pattern Analysis:**
Looking at your core experience, does this:
- Use established UX patterns that users already understand?
- Require novel interaction design that needs user education?
- Combine familiar patterns in innovative ways?

**If Novel:**
- What makes this different from existing approaches?
- How will we teach users this new pattern?
- What familiar metaphors can we use?

**If Established:**
- Which proven patterns should we adopt?
- How can we innovate within familiar patterns?
- What's our unique twist on established interactions?"

### 5. Define Experience Mechanics

"**Core Experience Mechanics:**
Let's design the step-by-step flow for [defining experience]:

**1. Initiation:**
- How does the user start this action?
- What triggers or invites them to begin?

**2. Interaction:**
- What does the user actually do?
- What controls or inputs do they use?
- How does the system respond?

**3. Feedback:**
- What tells users they're succeeding?
- How do they know when it's working?
- What happens if they make a mistake?

**4. Completion:**
- How do users know they're done?
- What's the successful outcome?
- What's next?"

### 6. Generate Defining Experience Content

When saving to document, append these sections:

```markdown
## 2. Core User Experience

### 2.1 Defining Experience

[Defining experience description based on conversation]

### 2.2 User Mental Model

[User mental model analysis based on conversation]

### 2.3 Success Criteria

[Success criteria for core experience based on conversation]

### 2.4 Novel UX Patterns

[Novel UX patterns analysis based on conversation]

### 2.5 Experience Mechanics

[Detailed mechanics for core experience based on conversation]
```

### 7. Present Content and Menu

"I've defined the core experience for {{project_name}} — the interaction that will make users love this product.

**Here's what I'll add to the document:**

[Show the complete markdown content from step 6]

**What would you like to do?**
[A] Advanced Elicitation - Let's refine the core experience definition
[P] Party Mode - Bring different perspectives on the defining interaction
[AR] Adversarial Review [C] Continue - Save this to the document and move to visual foundation"

### 8. Handle Menu Selection

**If A:** Read fully and follow `{project-root}/_arcwright/core/workflows/advanced-elicitation/workflow.xml` with the current content. Ask user to accept/reject improvements, then return to menu.

**If P:** Read fully and follow `{project-root}/_arcwright/core/workflows/party-mode/workflow.md` with the current content. Ask user to accept/reject changes, then return to menu.

**If AR:** Execute `{project-root}/_arcwright/core/tasks/review-adversarial-general.xml` — display findings with recommendations; then redisplay this menu.

**If C:**
- Append the final content to `{planning_artifacts}/ux-design-specification.md`
- Update frontmatter: append step to end of stepsCompleted array
- Load `{project-root}/_arcwright/awm/workflows/2-plan-workflows/create-ux-design/steps/step-08-visual-foundation.md`
