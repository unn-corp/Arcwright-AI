# Market Research Step 5: Competitive Analysis

## YOUR TASK:

Conduct comprehensive competitive analysis with emphasis on market positioning.

## COMPETITIVE ANALYSIS SEQUENCE:

### 1. Begin Competitive Analysis

Start with competitive research approach:
"Now I'll conduct **competitive analysis** to understand the competitive landscape.

**Competitive Analysis Focus:**

- Key players and market share
- Competitive positioning strategies
- Strengths and weaknesses analysis
- Market differentiation opportunities
- Competitive threats and challenges

**Let me search for current competitive information.**"

### 2. Generate Competitive Analysis Content

Prepare competitive analysis with web search citations:

#### Content Structure:

When saving to document, append these Level 2 and Level 3 sections:

```markdown
## Competitive Landscape

### Key Market Players

[Key players analysis with market share data]
_Source: [URL]_

### Market Share Analysis

[Market share analysis with source citations]
_Source: [URL]_

### Competitive Positioning

[Positioning analysis with source citations]
_Source: [URL]_

### Strengths and Weaknesses

[SWOT analysis with source citations]
_Source: [URL]_

### Market Differentiation

[Differentiation analysis with source citations]
_Source: [URL]_

### Competitive Threats

[Threats analysis with source citations]
_Source: [URL]_

### Opportunities

[Competitive opportunities analysis with source citations]
_Source: [URL]_
```

### 3. Present Analysis and Complete Option

Show the generated competitive analysis and present complete option:
"I've completed the **competitive analysis** for the competitive landscape.

**Key Competitive Findings:**

- Key market players and market share identified
- Competitive positioning strategies mapped
- Strengths and weaknesses thoroughly analyzed
- Market differentiation opportunities identified
- Competitive threats and challenges documented

**Ready to complete the market research?**
[AR] Adversarial Review [C] Continue - Save final document and proceed to synthesis

### 4. Handle Complete Selection

#### If 'AR' (Adversarial Review):

- IF AR: Execute {project-root}/_arcwright/core/tasks/review-adversarial-general.xml — pass the current editPlan (or plan document in context) as the content to review; display findings with recommendations; then redisplay this menu

#### If 'C' (Complete Research):

- Append the final content to the research document
- Update frontmatter: `stepsCompleted: [1, 2, 3, 4, 5]`
- Load: `{project-root}/_arcwright/awm/workflows/1-analysis/research/market-steps/step-06-research-completion.md`

## APPEND TO DOCUMENT:

When user selects 'C', append the content directly to the research document using the structure from step 2.

## NEXT STEP:

After user selects 'C', load `{project-root}/_arcwright/awm/workflows/1-analysis/research/market-steps/step-06-research-completion.md` to produce the comprehensive market research document.
