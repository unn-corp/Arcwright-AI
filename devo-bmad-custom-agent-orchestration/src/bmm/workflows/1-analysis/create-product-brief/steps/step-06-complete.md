---
name: 'step-06-complete'
description: 'Complete the product brief workflow, update status files, and suggest next steps for the project'

# File References
outputFile: '{planning_artifacts}/product-brief-{{project_name}}-{{date}}.md'
---

# Step 6: Product Brief Completion

## STEP GOAL:

Complete the product brief workflow, update status files, and provide guidance on logical next steps for continued product development.

## Step-Specific Rules:

- Focus only on completion, next steps, and project guidance
- FORBIDDEN to generate new content for the product brief
- FINALIZE document and update workflow status appropriately
- DO NOT load additional steps after this one (this is final)

## Sequence of Instructions (Do not deviate, skip, or optimize)

### 1. Announce Workflow Completion

**Completion Announcement:**
"**Product Brief Complete, {{user_name}}!**

I've successfully collaborated with you to create a comprehensive Product Brief for {{project_name}}.

**What we've accomplished:**

- Executive Summary with clear vision and problem statement
- Core Vision with solution definition and unique differentiators
- Target Users with rich personas and user journeys
- Success Metrics with measurable outcomes and business objectives
- MVP Scope with focused feature set and clear boundaries
- Future Vision that inspires while maintaining current focus

**The complete Product Brief is now available at:** `{outputFile}`

This brief serves as the foundation for all subsequent product development activities and strategic decisions."

### 2. Document Quality Check

**Completeness Validation:**
Perform final validation of the product brief:

- Does the executive summary clearly communicate the vision and problem?
- Are target users well-defined with compelling personas?
- Do success metrics connect user value to business objectives?
- Is MVP scope focused and realistic?
- Does the brief provide clear direction for next steps?

**Consistency Validation:**

- Do all sections align with the core problem statement?
- Is user value consistently emphasized throughout?
- Are success criteria traceable to user needs and business goals?
- Does MVP scope align with the problem and solution?

### 3. Suggest Next Steps

**Recommended Next Workflow:**
Provide guidance on logical next workflows:

1. `create-prd` - Create detailed Product Requirements Document
   - Brief provides foundation for detailed requirements
   - User personas inform journey mapping
   - Success metrics become specific acceptance criteria
   - MVP scope becomes detailed feature specifications

**Other Potential Next Steps:**

1. `create-ux-design` - UX research and design (can run parallel with PRD)
2. `domain-research` - Deep market or domain research (if needed)

**Strategic Considerations:**

- The PRD workflow builds directly on this brief for detailed planning
- Consider team capacity and immediate priorities
- Use brief to validate concept before committing to detailed work
- Brief can guide early technical feasibility discussions

### 4. Congrats to the user

"**Your Product Brief for {{project_name}} is now complete and ready for the next phase!**"

Recap that the brief captures everything needed to guide subsequent product development:

- Clear vision and problem definition
- Deep understanding of target users
- Measurable success criteria
- Focused MVP scope with realistic boundaries
- Inspiring long-term vision

### 5. Suggest next steps

Product Brief complete. Read fully and follow: `{project-root}/_bmad/core/tasks/help.md`
