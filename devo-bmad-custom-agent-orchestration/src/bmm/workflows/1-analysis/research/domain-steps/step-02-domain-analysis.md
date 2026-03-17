# Domain Research Step 2: Industry Analysis

## YOUR TASK:

Conduct industry analysis focusing on market size, growth, and industry dynamics. Search the web to verify and supplement current facts.

## INDUSTRY ANALYSIS SEQUENCE:

### 1. Begin Industry Analysis

**UTILIZE SUBPROCESSES AND SUBAGENTS**: Use research subagents, subprocesses or parallel processing if available to thoroughly analyze different industry areas simultaneously and thoroughly.

Start with industry research approach:
"Now I'll conduct **industry analysis** for **{{research_topic}}** to understand market dynamics.

**Industry Analysis Focus:**

- Market size and valuation metrics
- Growth rates and market dynamics
- Market segmentation and structure
- Industry trends and evolution patterns
- Economic impact and value creation

**Let me search for current industry insights.**"

### 2. Parallel Industry Research Execution

**Execute multiple web searches simultaneously:**

Search the web: "{{research_topic}} market size value"
Search the web: "{{research_topic}} market growth rate dynamics"
Search the web: "{{research_topic}} market segmentation structure"
Search the web: "{{research_topic}} industry trends evolution"

**Analysis approach:**

- Look for recent market research reports and industry analyses
- Search for authoritative sources (market research firms, industry associations)
- Identify market size, growth rates, and segmentation data
- Research industry trends and evolution patterns
- Analyze economic impact and value creation metrics

### 3. Analyze and Aggregate Results

**Collect and analyze findings from all parallel searches:**

"After executing comprehensive parallel web searches, let me analyze and aggregate industry findings:

**Research Coverage:**

- Market size and valuation analysis
- Growth rates and market dynamics
- Market segmentation and structure
- Industry trends and evolution patterns

**Cross-Industry Analysis:**
[Identify patterns connecting market dynamics, segmentation, and trends]

**Quality Assessment:**
[Overall confidence levels and research gaps identified]"

### 4. Generate Industry Analysis Content

**WRITE IMMEDIATELY TO DOCUMENT**

Prepare industry analysis with web search citations:

#### Content Structure:

When saving to document, append these Level 2 and Level 3 sections:

```markdown
## Industry Analysis

### Market Size and Valuation

[Market size analysis with source citations]
_Total Market Size: [Current market valuation]_
_Growth Rate: [CAGR and market growth projections]_
_Market Segments: [Size and value of key market segments]_
_Economic Impact: [Economic contribution and value creation]_
_Source: [URL]_

### Market Dynamics and Growth

[Market dynamics analysis with source citations]
_Growth Drivers: [Key factors driving market growth]_
_Growth Barriers: [Factors limiting market expansion]_
_Cyclical Patterns: [Industry seasonality and cycles]_
_Market Maturity: [Life cycle stage and development phase]_
_Source: [URL]_

### Market Structure and Segmentation

[Market structure analysis with source citations]
_Primary Segments: [Key market segments and their characteristics]_
_Sub-segment Analysis: [Detailed breakdown of market sub-segments]_
_Geographic Distribution: [Regional market variations and concentrations]_
_Vertical Integration: [Supply chain and value chain structure]_
_Source: [URL]_

### Industry Trends and Evolution

[Industry trends analysis with source citations]
_Emerging Trends: [Current industry developments and transformations]_
_Historical Evolution: [Industry development over recent years]_
_Technology Integration: [How technology is changing the industry]_
_Future Outlook: [Projected industry developments and changes]_
_Source: [URL]_

### Competitive Dynamics

[Competitive dynamics analysis with source citations]
_Market Concentration: [Level of market consolidation and competition]_
_Competitive Intensity: [Degree of competition and rivalry]_
_Barriers to Entry: [Obstacles for new market entrants]_
_Innovation Pressure: [Rate of innovation and change]_
_Source: [URL]_
```

### 5. Present Analysis and Continue Option

**Show analysis and present continue option:**

"I've completed **industry analysis** for {{research_topic}}.

**Key Industry Findings:**

- Market size and valuation thoroughly analyzed
- Growth dynamics and market structure documented
- Industry trends and evolution patterns identified
- Competitive dynamics clearly mapped
- Multiple sources verified for critical insights

**Ready to proceed to competitive landscape analysis?**
[AR] Adversarial Review [C] Continue - Save this to document and proceed to competitive landscape

### 6. Handle Continue Selection

#### If 'AR' (Adversarial Review):

- IF AR: Execute {project-root}/_bmad/core/tasks/review-adversarial-general.xml — pass the current editPlan (or plan document in context) as the content to review; display findings with recommendations; then redisplay this menu

#### If 'C' (Continue):

- **CONTENT ALREADY WRITTEN TO DOCUMENT**
- Update frontmatter: `stepsCompleted: [1, 2]`
- Load: `{project-root}/_bmad/bmm/workflows/1-analysis/research/domain-steps/step-03-competitive-landscape.md`

## APPEND TO DOCUMENT:

Content is already written to document when generated in step 4. No additional append needed.

## NEXT STEP:

After user selects 'C', load `{project-root}/_bmad/bmm/workflows/1-analysis/research/domain-steps/step-03-competitive-landscape.md` to analyze competitive landscape, key players, and ecosystem analysis for {{research_topic}}.
