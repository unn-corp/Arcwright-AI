# Domain Research Step 1: Domain Research Scope Confirmation

## YOUR TASK:

Confirm domain research scope and approach for **{{research_topic}}** with the user's goals in mind.

## CONTEXT:

- Research type = "domain", topic = "{{research_topic}}", goals = "{{research_goals}}"
- This is SCOPE CONFIRMATION ONLY — no web research yet

## DOMAIN SCOPE CONFIRMATION:

### 1. Begin Scope Confirmation

Start with domain scope understanding:
"I understand you want to conduct **domain research** for **{{research_topic}}** with these goals: {{research_goals}}

**Domain Research Scope:**

- **Industry Analysis**: Industry structure, market dynamics, and competitive landscape
- **Regulatory Environment**: Compliance requirements, regulations, and standards
- **Technology Patterns**: Innovation trends, technology adoption, and digital transformation
- **Economic Factors**: Market size, growth trends, and economic impact
- **Supply Chain**: Value chain analysis and ecosystem relationships

**Research Approach:**

- All claims verified against current public sources
- Multi-source validation for critical domain claims
- Confidence levels for uncertain domain information
- Comprehensive domain coverage with industry-specific insights

### 2. Scope Confirmation

Present clear scope confirmation:
"**Domain Research Scope Confirmation:**

For **{{research_topic}}**, I will research:

✅ **Industry Analysis** - market structure, key players, competitive dynamics
✅ **Regulatory Requirements** - compliance standards, legal frameworks
✅ **Technology Trends** - innovation patterns, digital transformation
✅ **Economic Factors** - market size, growth projections, economic impact
✅ **Supply Chain Analysis** - value chain, ecosystem, partnerships

**All claims verified against current public sources.**

**Domain research scope confirmed. Proceeding automatically.**

### 3. Auto-Proceed

- Document scope confirmation in research file
- Update frontmatter: `stepsCompleted: [1]`
- Load: `{project-root}/_bmad/bmm/workflows/1-analysis/research/domain-steps/step-02-domain-analysis.md`

## APPEND TO DOCUMENT:

Append scope confirmation to the output file:

```markdown
## Domain Research Scope Confirmation

**Research Topic:** {{research_topic}}
**Research Goals:** {{research_goals}}

**Domain Research Scope:**

- Industry Analysis - market structure, competitive landscape
- Regulatory Environment - compliance requirements, legal frameworks
- Technology Trends - innovation patterns, digital transformation
- Economic Factors - market size, growth projections
- Supply Chain Analysis - value chain, ecosystem relationships

**Research Methodology:**

- All claims verified against current public sources
- Multi-source validation for critical domain claims
- Confidence level framework for uncertain information
- Comprehensive domain coverage with industry-specific insights

**Scope Confirmed:** {{date}}
```

## NEXT STEP:

Immediately after displaying scope confirmation and writing to the output file, load `{project-root}/_bmad/bmm/workflows/1-analysis/research/domain-steps/step-02-domain-analysis.md` to begin industry analysis.
