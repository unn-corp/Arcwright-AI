# Market Research Step 1: Market Research Initialization

## YOUR TASK:

Initialize market research by confirming understanding of {{research_topic}} and establishing clear research scope.

## CONTEXT:

- Research type = "market", topic = "{{research_topic}}", goals = "{{research_goals}}"
- No web research in this step — scope clarification only

## MARKET RESEARCH INITIALIZATION:

### 1. Confirm Research Understanding

**INITIALIZE - DO NOT RESEARCH YET**

Start with research confirmation:
"I understand you want to conduct **market research** for **{{research_topic}}** with these goals: {{research_goals}}

**My Understanding of Your Research Needs:**

- **Research Topic**: {{research_topic}}
- **Research Goals**: {{research_goals}}
- **Research Type**: Market Research
- **Approach**: Comprehensive market analysis with source verification

**Market Research Areas We'll Cover:**

- Market size, growth dynamics, and trends
- Customer insights and behavior analysis
- Competitive landscape and positioning
- Strategic recommendations and implementation guidance

**Market research scope confirmed. Proceeding automatically.**

### 2. Document Initial Scope

**WRITE IMMEDIATELY TO DOCUMENT**

Write initial research scope to document:

```markdown
# Market Research: {{research_topic}}

## Research Initialization

### Research Understanding Confirmed

**Topic**: {{research_topic}}
**Goals**: {{research_goals}}
**Research Type**: Market Research
**Date**: {{date}}

### Research Scope

**Market Analysis Focus Areas:**

- Market size, growth projections, and dynamics
- Customer segments, behavior patterns, and insights
- Competitive landscape and positioning analysis
- Strategic recommendations and implementation guidance

**Research Methodology:**

- Current web data with source verification
- Multiple independent sources for critical claims
- Confidence level assessment for uncertain data
- Comprehensive coverage with no critical gaps

### Next Steps

**Research Workflow:**

1. ✅ Initialization and scope setting (current step)
2. Customer Insights and Behavior Analysis
3. Competitive Landscape Analysis
4. Strategic Synthesis and Recommendations

**Research Status**: Scope confirmed, ready to proceed with detailed market analysis
```

### 4. Auto-Proceed

Display scope summary to user, then immediately:

- Update frontmatter: `stepsCompleted: [1]`
- Load: `{project-root}/_bmad/bmm/workflows/1-analysis/research/market-steps/step-02-customer-behavior.md`

## NEXT STEP:

Immediately after displaying scope confirmation and writing to the output file, load `{project-root}/_bmad/bmm/workflows/1-analysis/research/market-steps/step-02-customer-behavior.md` to begin detailed market research with customer insights analysis.
