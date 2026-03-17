# Technical Research Step 2: Technology Stack Analysis

## YOUR TASK:

Conduct technology stack analysis focusing on languages, frameworks, tools, and platforms. Search the web to verify and supplement current facts.

## TECHNOLOGY STACK ANALYSIS SEQUENCE:

### 1. Begin Technology Stack Analysis

**UTILIZE SUBPROCESSES AND SUBAGENTS**: Use research subagents, subprocesses or parallel processing if available to thoroughly analyze different technology stack areas simultaneously and thoroughly.

Start with technology stack research approach:
"Now I'll conduct **technology stack analysis** for **{{research_topic}}** to understand the technology landscape.

**Technology Stack Focus:**

- Programming languages and their evolution
- Development frameworks and libraries
- Database and storage technologies
- Development tools and platforms
- Cloud infrastructure and deployment platforms

**Let me search for current technology stack insights.**"

### 2. Parallel Technology Stack Research Execution

**Execute multiple web searches simultaneously:**

Search the web: "{{research_topic}} programming languages frameworks"
Search the web: "{{research_topic}} development tools platforms"
Search the web: "{{research_topic}} database storage technologies"
Search the web: "{{research_topic}} cloud infrastructure platforms"

**Analysis approach:**

- Look for recent technology trend reports and developer surveys
- Search for technology documentation and best practices
- Research open-source projects and their technology choices
- Analyze technology adoption patterns and migration trends
- Study platform and tool evolution in the domain

### 3. Analyze and Aggregate Results

**Collect and analyze findings from all parallel searches:**

"After executing comprehensive parallel web searches, let me analyze and aggregate technology stack findings:

**Research Coverage:**

- Programming languages and frameworks analysis
- Development tools and platforms evaluation
- Database and storage technologies assessment
- Cloud infrastructure and deployment platform analysis

**Cross-Technology Analysis:**
[Identify patterns connecting language choices, frameworks, and platform decisions]

**Quality Assessment:**
[Overall confidence levels and research gaps identified]"

### 4. Generate Technology Stack Content

**WRITE IMMEDIATELY TO DOCUMENT**

Prepare technology stack analysis with web search citations:

#### Content Structure:

When saving to document, append these Level 2 and Level 3 sections:

```markdown
## Technology Stack Analysis

### Programming Languages

[Programming languages analysis with source citations]
_Popular Languages: [Most widely used languages for {{research_topic}}]_
_Emerging Languages: [Growing languages gaining adoption]_
_Language Evolution: [How language preferences are changing]_
_Performance Characteristics: [Language performance and suitability]_
_Source: [URL]_

### Development Frameworks and Libraries

[Frameworks analysis with source citations]
_Major Frameworks: [Dominant frameworks and their use cases]_
_Micro-frameworks: [Lightweight options and specialized libraries]_
_Evolution Trends: [How frameworks are evolving and changing]_
_Ecosystem Maturity: [Library availability and community support]_
_Source: [URL]_

### Database and Storage Technologies

[Database analysis with source citations]
_Relational Databases: [Traditional SQL databases and their evolution]_
_NoSQL Databases: [Document, key-value, graph, and other NoSQL options]_
_In-Memory Databases: [Redis, Memcached, and performance-focused solutions]_
_Data Warehousing: [Analytics and big data storage solutions]_
_Source: [URL]_

### Development Tools and Platforms

[Tools and platforms analysis with source citations]
_IDE and Editors: [Development environments and their evolution]_
_Version Control: [Git and related development tools]_
_Build Systems: [Compilation, packaging, and automation tools]_
_Testing Frameworks: [Unit testing, integration testing, and QA tools]_
_Source: [URL]_

### Cloud Infrastructure and Deployment

[Cloud platforms analysis with source citations]
_Major Cloud Providers: [AWS, Azure, GCP and their services]_
_Container Technologies: [Docker, Kubernetes, and orchestration]_
_Serverless Platforms: [FaaS and event-driven computing]_
_CDN and Edge Computing: [Content delivery and distributed computing]_
_Source: [URL]_

### Technology Adoption Trends

[Adoption trends analysis with source citations]
_Migration Patterns: [How technology choices are evolving]_
_Emerging Technologies: [New technologies gaining traction]_
_Legacy Technology: [Older technologies being phased out]_
_Community Trends: [Developer preferences and open-source adoption]_
_Source: [URL]_
```

### 5. Present Analysis and Continue Option

**Show analysis and present continue option:**

"I've completed **technology stack analysis** of the technology landscape for {{research_topic}}.

**Key Technology Stack Findings:**

- Programming languages and frameworks thoroughly analyzed
- Database and storage technologies evaluated
- Development tools and platforms documented
- Cloud infrastructure and deployment options mapped
- Technology adoption trends identified

**Ready to proceed to integration patterns analysis?**
[AR] Adversarial Review [C] Continue - Save this to document and proceed to integration patterns

### 6. Handle Continue Selection

#### If 'AR' (Adversarial Review):

- IF AR: Execute {project-root}/_bmad/core/tasks/review-adversarial-general.xml — pass the current editPlan (or plan document in context) as the content to review; display findings with recommendations; then redisplay this menu

#### If 'C' (Continue):

- **CONTENT ALREADY WRITTEN TO DOCUMENT**
- Update frontmatter: `stepsCompleted: [1, 2]`
- Load: `{project-root}/_bmad/bmm/workflows/1-analysis/research/technical-steps/step-03-integration-patterns.md`

## APPEND TO DOCUMENT:

Content is already written to document when generated in step 4. No additional append needed.

## NEXT STEP:

After user selects 'C', load `{project-root}/_bmad/bmm/workflows/1-analysis/research/technical-steps/step-03-integration-patterns.md` to analyze APIs, communication protocols, and system interoperability for {{research_topic}}.
