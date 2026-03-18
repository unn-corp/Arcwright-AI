# Technical Research Step 1: Technical Research Scope Confirmation

## YOUR TASK:

Confirm technical research scope and approach for **{{research_topic}}** with the user's goals in mind.

## CONTEXT:

- Research type = "technical", topic = "{{research_topic}}", goals = "{{research_goals}}"
- This is SCOPE CONFIRMATION ONLY — no web research yet

## TECHNICAL SCOPE CONFIRMATION:

### 1. Begin Scope Confirmation

Start with technical scope understanding:
"I understand you want to conduct **technical research** for **{{research_topic}}** with these goals: {{research_goals}}

**Technical Research Scope:**

- **Architecture Analysis**: System design patterns, frameworks, and architectural decisions
- **Implementation Approaches**: Development methodologies, coding patterns, and best practices
- **Technology Stack**: Languages, frameworks, tools, and platforms relevant to {{research_topic}}
- **Integration Patterns**: APIs, communication protocols, and system interoperability
- **Performance Considerations**: Scalability, optimization, and performance patterns

**Research Approach:**

- Current web data with rigorous source verification
- Multi-source validation for critical technical claims
- Confidence levels for uncertain technical information
- Comprehensive technical coverage with architecture-specific insights

### 2. Scope Confirmation

Present clear scope confirmation:
"**Technical Research Scope Confirmation:**

For **{{research_topic}}**, I will research:

✅ **Architecture Analysis** - design patterns, frameworks, system architecture
✅ **Implementation Approaches** - development methodologies, coding patterns
✅ **Technology Stack** - languages, frameworks, tools, platforms
✅ **Integration Patterns** - APIs, protocols, interoperability
✅ **Performance Considerations** - scalability, optimization, patterns

**All claims verified against current public sources.**

**Technical research scope confirmed. Proceeding automatically.**

### 3. Auto-Proceed

- Document scope confirmation in research file
- Update frontmatter: `stepsCompleted: [1]`
- Load: `{project-root}/_bmad/bmm/workflows/1-analysis/research/technical-steps/step-02-technical-overview.md`

## APPEND TO DOCUMENT:

Append scope confirmation to the output file:

```markdown
## Technical Research Scope Confirmation

**Research Topic:** {{research_topic}}
**Research Goals:** {{research_goals}}

**Technical Research Scope:**

- Architecture Analysis - design patterns, frameworks, system architecture
- Implementation Approaches - development methodologies, coding patterns
- Technology Stack - languages, frameworks, tools, platforms
- Integration Patterns - APIs, protocols, interoperability
- Performance Considerations - scalability, optimization, patterns

**Research Methodology:**

- Current web data with rigorous source verification
- Multi-source validation for critical technical claims
- Confidence level framework for uncertain information
- Comprehensive technical coverage with architecture-specific insights

**Scope Confirmed:** {{date}}
```

## NEXT STEP:

Immediately after displaying scope confirmation and writing to the output file, load `{project-root}/_bmad/bmm/workflows/1-analysis/research/technical-steps/step-02-technical-overview.md` to begin technology stack analysis.
