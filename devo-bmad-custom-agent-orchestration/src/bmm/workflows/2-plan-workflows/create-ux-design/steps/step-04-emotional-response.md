# Step 4: Desired Emotional Response

Define the desired emotional responses users should feel when using the product.

## EMOTIONAL RESPONSE DISCOVERY SEQUENCE

### 1. Explore Core Emotional Goals

"Now let's think about how {{project_name}} should make users feel.

**Emotional Response Questions:**
- What should users FEEL when using this product?
- What emotion would make them tell a friend about this?
- How should users feel after accomplishing their primary goal?
- What feeling differentiates this from competitors?

Common emotional goals: Empowered and in control? Delighted and surprised? Efficient and productive? Creative and inspired? Calm and focused? Connected and engaged?"

### 2. Identify Emotional Journey Mapping

"**Emotional Journey Considerations:**
- How should users feel when they first discover the product?
- What emotion during the core experience/action?
- How should they feel after completing their task?
- What if something goes wrong — what emotional response do we want?
- How should they feel when returning to use it again?"

### 3. Define Micro-Emotions

"**Micro-Emotions to Consider:**
- Confidence vs. Confusion
- Trust vs. Skepticism
- Excitement vs. Anxiety
- Accomplishment vs. Frustration
- Delight vs. Satisfaction
- Belonging vs. Isolation

Which of these emotional states are most critical for your product's success?"

### 4. Connect Emotions to UX Decisions

"**Design Implications:**
- If we want users to feel [emotional state], what UX choices support this?
- What interactions might create negative emotions we want to avoid?
- Where can we add moments of delight or surprise?
- How do we build trust and confidence through design?

**Emotion-Design Connections:**
- [Emotion 1] → [UX design approach]
- [Emotion 2] → [UX design approach]
- [Emotion 3] → [UX design approach]"

### 5. Validate Emotional Goals

"Let me make sure I understand the emotional vision for {{project_name}}:

**Primary Emotional Goal:** [Summarize main emotional response]
**Secondary Feelings:** [List supporting emotional states]
**Emotions to Avoid:** [List negative emotions to prevent]

Does this capture the emotional experience you want to create? Any adjustments needed?"

### 6. Generate Emotional Response Content

When saving to document, append these sections:

```markdown
## Desired Emotional Response

### Primary Emotional Goals

[Primary emotional goals based on conversation]

### Emotional Journey Mapping

[Emotional journey mapping based on conversation]

### Micro-Emotions

[Micro-emotions identified based on conversation]

### Design Implications

[UX design implications for emotional responses based on conversation]

### Emotional Design Principles

[Guiding principles for emotional design based on conversation]
```

### 7. Present Content and Menu

"I've defined the desired emotional responses for {{project_name}}. These emotional goals will guide our design decisions to create the right user experience.

**Here's what I'll add to the document:**

[Show the complete markdown content from step 6]

**What would you like to do?**
[A] Advanced Elicitation - Let's refine the emotional response definition
[P] Party Mode - Bring different perspectives on user emotional needs
[AR] Adversarial Review [C] Continue - Save this to the document and move to inspiration analysis"

### 8. Handle Menu Selection

**If A:** Read fully and follow `{project-root}/_bmad/core/workflows/advanced-elicitation/workflow.xml` with the current content. Ask user to accept/reject improvements, then return to menu.

**If P:** Read fully and follow `{project-root}/_bmad/core/workflows/party-mode/workflow.md` with the current content. Ask user to accept/reject changes, then return to menu.

**If AR:** Execute `{project-root}/_bmad/core/tasks/review-adversarial-general.xml` — display findings with recommendations; then redisplay this menu.

**If C:**
- Append the final content to `{planning_artifacts}/ux-design-specification.md`
- Update frontmatter: append step to end of stepsCompleted array
- Load `{project-root}/_bmad/bmm/workflows/2-plan-workflows/create-ux-design/steps/step-05-inspiration.md`
