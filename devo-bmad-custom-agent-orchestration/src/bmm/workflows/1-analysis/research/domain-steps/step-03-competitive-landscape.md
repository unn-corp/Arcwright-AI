# Domain Research Step 3: Competitive Landscape

## YOUR TASK:

Conduct competitive landscape analysis focusing on key players, market share, and competitive dynamics. Search the web to verify and supplement current facts.

## COMPETITIVE LANDSCAPE ANALYSIS SEQUENCE:

### 1. Begin Competitive Landscape Analysis

**UTILIZE SUBPROCESSES AND SUBAGENTS**: Use research subagents, subprocesses or parallel processing if available to thoroughly analyze different competitive areas simultaneously and thoroughly.

Start with competitive research approach:
"Now I'll conduct **competitive landscape analysis** for **{{research_topic}}** to understand the competitive ecosystem.

**Competitive Landscape Focus:**

- Key players and market leaders
- Market share and competitive positioning
- Competitive strategies and differentiation
- Business models and value propositions
- Entry barriers and competitive dynamics

**Let me search for current competitive insights.**"

### 2. Parallel Competitive Research Execution

**Execute multiple web searches simultaneously:**

Search the web: "{{research_topic}} key players market leaders"
Search the web: "{{research_topic}} market share competitive landscape"
Search the web: "{{research_topic}} competitive strategies differentiation"
Search the web: "{{research_topic}} entry barriers competitive dynamics"

**Analysis approach:**

- Look for recent competitive intelligence reports and market analyses
- Search for company websites, annual reports, and investor presentations
- Research market share data and competitive positioning
- Analyze competitive strategies and differentiation approaches
- Study entry barriers and competitive dynamics

### 3. Analyze and Aggregate Results

**Collect and analyze findings from all parallel searches:**

"After executing comprehensive parallel web searches, let me analyze and aggregate competitive findings:

**Research Coverage:**

- Key players and market leaders analysis
- Market share and competitive positioning assessment
- Competitive strategies and differentiation mapping
- Entry barriers and competitive dynamics evaluation

**Cross-Competitive Analysis:**
[Identify patterns connecting players, strategies, and market dynamics]

**Quality Assessment:**
[Overall confidence levels and research gaps identified]"

### 4. Generate Competitive Landscape Content

**WRITE IMMEDIATELY TO DOCUMENT**

Prepare competitive landscape analysis with web search citations:

#### Content Structure:

When saving to document, append these Level 2 and Level 3 sections:

```markdown
## Competitive Landscape

### Key Players and Market Leaders

[Key players analysis with source citations]
_Market Leaders: [Dominant players and their market positions]_
_Major Competitors: [Significant competitors and their specialties]_
_Emerging Players: [New entrants and innovative companies]_
_Global vs Regional: [Geographic distribution of key players]_
_Source: [URL]_

### Market Share and Competitive Positioning

[Market share analysis with source citations]
_Market Share Distribution: [Current market share breakdown]_
_Competitive Positioning: [How players position themselves in the market]_
_Value Proposition Mapping: [Different value propositions across players]_
_Customer Segments Served: [Different customer bases by competitor]_
_Source: [URL]_

### Competitive Strategies and Differentiation

[Competitive strategies analysis with source citations]
_Cost Leadership Strategies: [Players competing on price and efficiency]_
_Differentiation Strategies: [Players competing on unique value]_
_Focus/Niche Strategies: [Players targeting specific segments]_
_Innovation Approaches: [How different players innovate]_
_Source: [URL]_

### Business Models and Value Propositions

[Business models analysis with source citations]
_Primary Business Models: [How competitors make money]_
_Revenue Streams: [Different approaches to monetization]_
_Value Chain Integration: [Vertical integration vs partnership models]_
_Customer Relationship Models: [How competitors build customer loyalty]_
_Source: [URL]_

### Competitive Dynamics and Entry Barriers

[Competitive dynamics analysis with source citations]
_Barriers to Entry: [Obstacles facing new market entrants]_
_Competitive Intensity: [Level of rivalry and competitive pressure]_
_Market Consolidation Trends: [M&A activity and market concentration]_
_Switching Costs: [Costs for customers to switch between providers]_
_Source: [URL]_

### Ecosystem and Partnership Analysis

[Ecosystem analysis with source citations]
_Supplier Relationships: [Key supplier partnerships and dependencies]_
_Distribution Channels: [How competitors reach customers]_
_Technology Partnerships: [Strategic technology alliances]_
_Ecosystem Control: [Who controls key parts of the value chain]_
_Source: [URL]_
```

### 5. Present Analysis and Continue Option

**Show analysis and present continue option:**

"I've completed **competitive landscape analysis** for {{research_topic}}.

**Key Competitive Findings:**

- Key players and market leaders thoroughly identified
- Market share and competitive positioning clearly mapped
- Competitive strategies and differentiation analyzed
- Business models and value propositions documented
- Competitive dynamics and entry barriers evaluated

**Ready to proceed to regulatory focus analysis?**
[AR] Adversarial Review [C] Continue - Save this to document and proceed to regulatory focus

### 6. Handle Continue Selection

#### If 'AR' (Adversarial Review):

- IF AR: Execute {project-root}/_bmad/core/tasks/review-adversarial-general.xml — pass the current editPlan (or plan document in context) as the content to review; display findings with recommendations; then redisplay this menu

#### If 'C' (Continue):

- **CONTENT ALREADY WRITTEN TO DOCUMENT**
- Update frontmatter: `stepsCompleted: [1, 2, 3]`
- Load: `{project-root}/_bmad/bmm/workflows/1-analysis/research/domain-steps/step-04-regulatory-focus.md`

## APPEND TO DOCUMENT:

Content is already written to document when generated in step 4. No additional append needed.

## NEXT STEP:

After user selects 'C', load `{project-root}/_bmad/bmm/workflows/1-analysis/research/domain-steps/step-04-regulatory-focus.md` to analyze regulatory requirements, compliance frameworks, and legal considerations for {{research_topic}}.
