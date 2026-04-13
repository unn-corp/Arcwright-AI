# Technical Research Step 4: Architectural Patterns

## YOUR TASK:

Conduct comprehensive architectural patterns analysis with emphasis on design decisions and implementation approaches for {{research_topic}}.

## ARCHITECTURAL PATTERNS SEQUENCE:

### 1. Begin Architectural Patterns Analysis

Start with architectural research approach:
"Now I'll focus on **architectural patterns and design decisions** for effective architecture approaches for {{research_topic}}.

**Architectural Patterns Focus:**

- System architecture patterns and their trade-offs
- Design principles and best practices
- Scalability and maintainability considerations
- Integration and communication patterns
- Security and performance architectural considerations

**Let me search for current architectural patterns and approaches.**"

### 2. Web Search for System Architecture Patterns

Search for current architecture patterns:
Search the web: "system architecture patterns best practices"

**Architecture focus:**

- Microservices, monolithic, and serverless patterns
- Event-driven and reactive architectures
- Domain-driven design patterns
- Cloud-native and edge architecture patterns

### 3. Web Search for Design Principles

Search for current design principles:
Search the web: "software design principles patterns"

**Design focus:**

- SOLID principles and their application
- Clean architecture and hexagonal architecture
- API design and GraphQL vs REST patterns
- Database design and data architecture patterns

### 4. Web Search for Scalability Patterns

Search for current scalability approaches:
Search the web: "scalability architecture patterns"

**Scalability focus:**

- Horizontal vs vertical scaling patterns
- Load balancing and caching strategies
- Distributed systems and consensus patterns
- Performance optimization techniques

### 5. Generate Architectural Patterns Content

Prepare architectural analysis with web search citations:

#### Content Structure:

When saving to document, append these Level 2 and Level 3 sections:

```markdown
## Architectural Patterns and Design

### System Architecture Patterns

[System architecture patterns analysis with source citations]
_Source: [URL]_

### Design Principles and Best Practices

[Design principles analysis with source citations]
_Source: [URL]_

### Scalability and Performance Patterns

[Scalability patterns analysis with source citations]
_Source: [URL]_

### Integration and Communication Patterns

[Integration patterns analysis with source citations]
_Source: [URL]_

### Security Architecture Patterns

[Security patterns analysis with source citations]
_Source: [URL]_

### Data Architecture Patterns

[Data architecture analysis with source citations]
_Source: [URL]_

### Deployment and Operations Architecture

[Deployment architecture analysis with source citations]
_Source: [URL]_
```

### 6. Present Analysis and Continue Option

Show the generated architectural patterns and present continue option:
"I've completed the **architectural patterns analysis** for effective architecture approaches.

**Key Architectural Findings:**

- System architecture patterns and trade-offs clearly mapped
- Design principles and best practices thoroughly documented
- Scalability and performance patterns identified
- Integration and communication patterns analyzed
- Security and data architecture considerations captured

**Ready to proceed to implementation research?**
[AR] Adversarial Review [C] Continue - Save this to the document and move to implementation research

### 7. Handle Continue Selection

#### If 'AR' (Adversarial Review):

- IF AR: Execute {project-root}/_arcwright/core/tasks/review-adversarial-general.xml — pass the current editPlan (or plan document in context) as the content to review; display findings with recommendations; then redisplay this menu

#### If 'C' (Continue):

- Append the final content to the research document
- Update frontmatter: `stepsCompleted: [1, 2, 3, 4]`
- Load: `{project-root}/_arcwright/awm/workflows/1-analysis/research/technical-steps/step-05-implementation-research.md`

## APPEND TO DOCUMENT:

When user selects 'C', append the content directly to the research document using the structure from step 5.

## NEXT STEP:

After user selects 'C' and content is saved to document, load `{project-root}/_arcwright/awm/workflows/1-analysis/research/technical-steps/step-05-implementation-research.md` to focus on implementation approaches and technology adoption.
