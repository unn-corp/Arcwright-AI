# Domain Research Step 5: Technical Trends

## YOUR TASK:

Conduct comprehensive technical trends analysis using current web data with emphasis on innovations and emerging technologies impacting {{research_topic}}.

## TECHNICAL TRENDS SEQUENCE:

### 1. Begin Technical Trends Analysis

Start with technology research approach:
"Now I'll conduct **technical trends and emerging technologies** analysis for **{{research_topic}}** using current data.

**Technical Trends Focus:**

- Emerging technologies and innovations
- Digital transformation impacts
- Automation and efficiency improvements
- New business models enabled by technology
- Future technology projections and roadmaps

**Let me search for current technology developments.**"

### 2. Web Search for Emerging Technologies

Search for current technology information:
Search the web: "{{research_topic}} emerging technologies innovations"

**Technology focus:**

- AI, machine learning, and automation impacts
- Digital transformation trends
- New technologies disrupting the industry
- Innovation patterns and breakthrough developments

### 3. Web Search for Digital Transformation

Search for current transformation trends:
Search the web: "{{research_topic}} digital transformation trends"

**Transformation focus:**

- Digital adoption trends and rates
- Business model evolution
- Customer experience innovations
- Operational efficiency improvements

### 4. Web Search for Future Outlook

Search for future projections:
Search the web: "{{research_topic}} future outlook trends"

**Future focus:**

- Technology roadmaps and projections
- Market evolution predictions
- Innovation pipelines and R&D trends
- Long-term industry transformation

### 5. Generate Technical Trends Content

**WRITE IMMEDIATELY TO DOCUMENT**

Prepare technical analysis with source citations:

#### Content Structure:

When saving to document, append these Level 2 and Level 3 sections:

```markdown
## Technical Trends and Innovation

### Emerging Technologies

[Emerging technologies analysis with source citations]
_Source: [URL]_

### Digital Transformation

[Digital transformation analysis with source citations]
_Source: [URL]_

### Innovation Patterns

[Innovation patterns analysis with source citations]
_Source: [URL]_

### Future Outlook

[Future outlook and projections with source citations]
_Source: [URL]_

### Implementation Opportunities

[Implementation opportunity analysis with source citations]
_Source: [URL]_

### Challenges and Risks

[Challenges and risks assessment with source citations]
_Source: [URL]_

## Recommendations

### Technology Adoption Strategy

[Technology adoption recommendations]

### Innovation Roadmap

[Innovation roadmap suggestions]

### Risk Mitigation

[Risk mitigation strategies]
```

### 6. Present Analysis and Complete Option

Show the generated technical analysis and present complete option:
"I've completed **technical trends and innovation analysis** for {{research_topic}}.

**Technical Highlights:**

- Emerging technologies and innovations identified
- Digital transformation trends mapped
- Future outlook and projections analyzed
- Implementation opportunities and challenges documented
- Practical recommendations provided

**Ready to proceed to research synthesis and recommendations?**
[AR] Adversarial Review [C] Continue - Save this to document and proceed to synthesis

### 7. Handle Continue Selection

#### If 'AR' (Adversarial Review):

- IF AR: Execute {project-root}/_arcwright/core/tasks/review-adversarial-general.xml — pass the current editPlan (or plan document in context) as the content to review; display findings with recommendations; then redisplay this menu

#### If 'C' (Continue):

- **CONTENT ALREADY WRITTEN TO DOCUMENT**
- Update frontmatter: `stepsCompleted: [1, 2, 3, 4, 5]`
- Load: `{project-root}/_arcwright/awm/workflows/1-analysis/research/domain-steps/step-06-research-synthesis.md`

## APPEND TO DOCUMENT:

Content is already written to document when generated in step 5. No additional append needed.

## NEXT STEP:

After user selects 'C', load `{project-root}/_arcwright/awm/workflows/1-analysis/research/domain-steps/step-06-research-synthesis.md` to produce the comprehensive research document.
