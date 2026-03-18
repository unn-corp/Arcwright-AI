# Technical Research Step 3: Integration Patterns

## YOUR TASK:

Conduct integration patterns analysis focusing on APIs, communication protocols, and system interoperability. Search the web to verify and supplement current facts.

## INTEGRATION PATTERNS ANALYSIS SEQUENCE:

### 1. Begin Integration Patterns Analysis

**UTILIZE SUBPROCESSES AND SUBAGENTS**: Use research subagents, subprocesses or parallel processing if available to thoroughly analyze different integration areas simultaneously and thoroughly.

Start with integration patterns research approach:
"Now I'll conduct **integration patterns analysis** for **{{research_topic}}** to understand system integration approaches.

**Integration Patterns Focus:**

- API design patterns and protocols
- Communication protocols and data formats
- System interoperability approaches
- Microservices integration patterns
- Event-driven architectures and messaging

**Let me search for current integration patterns insights.**"

### 2. Parallel Integration Patterns Research Execution

**Execute multiple web searches simultaneously:**

Search the web: "{{research_topic}} API design patterns protocols"
Search the web: "{{research_topic}} communication protocols data formats"
Search the web: "{{research_topic}} system interoperability integration"
Search the web: "{{research_topic}} microservices integration patterns"

**Analysis approach:**

- Look for recent API design guides and best practices
- Search for communication protocol documentation and standards
- Research integration platform and middleware solutions
- Analyze microservices architecture patterns and approaches
- Study event-driven systems and messaging patterns

### 3. Analyze and Aggregate Results

**Collect and analyze findings from all parallel searches:**

"After executing comprehensive parallel web searches, let me analyze and aggregate integration patterns findings:

**Research Coverage:**

- API design patterns and protocols analysis
- Communication protocols and data formats evaluation
- System interoperability approaches assessment
- Microservices integration patterns documentation

**Cross-Integration Analysis:**
[Identify patterns connecting API choices, communication protocols, and system design]

**Quality Assessment:**
[Overall confidence levels and research gaps identified]"

### 4. Generate Integration Patterns Content

**WRITE IMMEDIATELY TO DOCUMENT**

Prepare integration patterns analysis with web search citations:

#### Content Structure:

When saving to document, append these Level 2 and Level 3 sections:

```markdown
## Integration Patterns Analysis

### API Design Patterns

[API design patterns analysis with source citations]
_RESTful APIs: [REST principles and best practices for {{research_topic}}]_
_GraphQL APIs: [GraphQL adoption and implementation patterns]_
_RPC and gRPC: [High-performance API communication patterns]_
_Webhook Patterns: [Event-driven API integration approaches]_
_Source: [URL]_

### Communication Protocols

[Communication protocols analysis with source citations]
_HTTP/HTTPS Protocols: [Web-based communication patterns and evolution]_
_WebSocket Protocols: [Real-time communication and persistent connections]_
_Message Queue Protocols: [AMQP, MQTT, and messaging patterns]_
_grpc and Protocol Buffers: [High-performance binary communication protocols]_
_Source: [URL]_

### Data Formats and Standards

[Data formats analysis with source citations]
_JSON and XML: [Structured data exchange formats and their evolution]_
_Protobuf and MessagePack: [Efficient binary serialization formats]_
_CSV and Flat Files: [Legacy data integration and bulk transfer patterns]_
_Custom Data Formats: [Domain-specific data exchange standards]_
_Source: [URL]_

### System Interoperability Approaches

[Interoperability analysis with source citations]
_Point-to-Point Integration: [Direct system-to-system communication patterns]_
_API Gateway Patterns: [Centralized API management and routing]_
_Service Mesh: [Service-to-service communication and observability]_
_Enterprise Service Bus: [Traditional enterprise integration patterns]_
_Source: [URL]_

### Microservices Integration Patterns

[Microservices integration analysis with source citations]
_API Gateway Pattern: [External API management and routing]_
_Service Discovery: [Dynamic service registration and discovery]_
_Circuit Breaker Pattern: [Fault tolerance and resilience patterns]_
_Saga Pattern: [Distributed transaction management]_
_Source: [URL]_

### Event-Driven Integration

[Event-driven analysis with source citations]
_Publish-Subscribe Patterns: [Event broadcasting and subscription models]_
_Event Sourcing: [Event-based state management and persistence]_
_Message Broker Patterns: [RabbitMQ, Kafka, and message routing]_
_CQRS Patterns: [Command Query Responsibility Segregation]_
_Source: [URL]_

### Integration Security Patterns

[Security patterns analysis with source citations]
_OAuth 2.0 and JWT: [API authentication and authorization patterns]_
_API Key Management: [Secure API access and key rotation]_
_Mutual TLS: [Certificate-based service authentication]_
_Data Encryption: [Secure data transmission and storage]_
_Source: [URL]_
```

### 5. Present Analysis and Continue Option

**Show analysis and present continue option:**

"I've completed **integration patterns analysis** of system integration approaches for {{research_topic}}.

**Key Integration Patterns Findings:**

- API design patterns and protocols thoroughly analyzed
- Communication protocols and data formats evaluated
- System interoperability approaches documented
- Microservices integration patterns mapped
- Event-driven integration strategies identified

**Ready to proceed to architectural patterns analysis?**
[AR] Adversarial Review [C] Continue - Save this to document and proceed to architectural patterns

### 6. Handle Continue Selection

#### If 'AR' (Adversarial Review):

- IF AR: Execute {project-root}/_bmad/core/tasks/review-adversarial-general.xml — pass the current editPlan (or plan document in context) as the content to review; display findings with recommendations; then redisplay this menu

#### If 'C' (Continue):

- **CONTENT ALREADY WRITTEN TO DOCUMENT**
- Update frontmatter: `stepsCompleted: [1, 2, 3]`
- Load: `{project-root}/_bmad/bmm/workflows/1-analysis/research/technical-steps/step-04-architectural-patterns.md`

## APPEND TO DOCUMENT:

Content is already written to document when generated in step 4. No additional append needed.

## NEXT STEP:

After user selects 'C', load `{project-root}/_bmad/bmm/workflows/1-analysis/research/technical-steps/step-04-architectural-patterns.md` to analyze architectural patterns, design decisions, and system structures for {{research_topic}}.
