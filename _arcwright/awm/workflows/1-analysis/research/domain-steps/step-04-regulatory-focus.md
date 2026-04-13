# Domain Research Step 4: Regulatory Focus

## YOUR TASK:

Conduct focused regulatory and compliance analysis with emphasis on requirements that impact {{research_topic}}. Search the web to verify and supplement current facts.

## REGULATORY FOCUS SEQUENCE:

### 1. Begin Regulatory Analysis

Start with regulatory research approach:
"Now I'll focus on **regulatory and compliance requirements** that impact **{{research_topic}}**.

**Regulatory Focus Areas:**

- Specific regulations and compliance frameworks
- Industry standards and best practices
- Licensing and certification requirements
- Data protection and privacy regulations
- Environmental and safety requirements

**Let me search for current regulatory requirements.**"

### 2. Web Search for Specific Regulations

Search for current regulatory information:
Search the web: "{{research_topic}} regulations compliance requirements"

**Regulatory focus:**

- Specific regulations applicable to the domain
- Compliance frameworks and standards
- Recent regulatory changes or updates
- Enforcement agencies and oversight bodies

### 3. Web Search for Industry Standards

Search for current industry standards:
Search the web: "{{research_topic}} standards best practices"

**Standards focus:**

- Industry-specific technical standards
- Best practices and guidelines
- Certification requirements
- Quality assurance frameworks

### 4. Web Search for Data Privacy Requirements

Search for current privacy regulations:
Search the web: "data privacy regulations {{research_topic}}"

**Privacy focus:**

- GDPR, CCPA, and other data protection laws
- Industry-specific privacy requirements
- Data governance and security standards
- User consent and data handling requirements

### 5. Generate Regulatory Analysis Content

Prepare regulatory content with source citations:

#### Content Structure:

When saving to document, append these Level 2 and Level 3 sections:

```markdown
## Regulatory Requirements

### Applicable Regulations

[Specific regulations analysis with source citations]
_Source: [URL]_

### Industry Standards and Best Practices

[Industry standards analysis with source citations]
_Source: [URL]_

### Compliance Frameworks

[Compliance frameworks analysis with source citations]
_Source: [URL]_

### Data Protection and Privacy

[Privacy requirements analysis with source citations]
_Source: [URL]_

### Licensing and Certification

[Licensing requirements analysis with source citations]
_Source: [URL]_

### Implementation Considerations

[Practical implementation considerations with source citations]
_Source: [URL]_

### Risk Assessment

[Regulatory and compliance risk assessment]
```

### 6. Present Analysis and Continue Option

Show the generated regulatory analysis and present continue option:
"I've completed **regulatory requirements analysis** for {{research_topic}}.

**Key Regulatory Findings:**

- Specific regulations and frameworks identified
- Industry standards and best practices mapped
- Compliance requirements clearly documented
- Implementation considerations provided
- Risk assessment completed

**Ready to proceed to technical trends?**
[AR] Adversarial Review [C] Continue - Save this to the document and move to technical trends

### 7. Handle Continue Selection

#### If 'AR' (Adversarial Review):

- IF AR: Execute {project-root}/_arcwright/core/tasks/review-adversarial-general.xml — pass the current editPlan (or plan document in context) as the content to review; display findings with recommendations; then redisplay this menu

#### If 'C' (Continue):

- **CONTENT ALREADY WRITTEN TO DOCUMENT**
- Update frontmatter: `stepsCompleted: [1, 2, 3, 4]`
- Load: `{project-root}/_arcwright/awm/workflows/1-analysis/research/domain-steps/step-05-technical-trends.md`

## APPEND TO DOCUMENT:

Content is already written to document when generated in step 5. No additional append needed.

## NEXT STEP:

After user selects 'C' and content is saved to document, load `{project-root}/_arcwright/awm/workflows/1-analysis/research/domain-steps/step-05-technical-trends.md` to analyze technical trends and innovations in the domain.
