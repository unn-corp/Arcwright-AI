# /strands: Strands Agents SDK skill router

Curated Strands Agents skills authored by Arcwright from AWS's official
[Strands Agents SDK documentation](https://strandsagents.com/docs) (original works,
not vendored, see `.agents/skills/SOURCES-STRANDS.md`). Use this to load the right
skill for a Strands task.

## Instructions

1. Identify what the task touches, then load the matching `SKILL.md`:

   | Task | Skill |
   |------|-------|
   | Building an agent, the agent loop, tools (Python/TypeScript), structured output, hooks, conversation window | `.agents/skills/strands-agent-fundamentals/SKILL.md` |
   | Coordinating multiple agents: agents-as-tools, Graph, Swarm, Workflow | `.agents/skills/strands-multi-agent-patterns/SKILL.md` |
   | Choosing/configuring a model backend: Bedrock, OpenAI, Anthropic direct, Gemini, Ollama | `.agents/skills/strands-model-providers/SKILL.md` |
   | Deploying to Bedrock AgentCore: `BedrockAgentCoreApp`, the `agentcore` CLI, arm64, streaming, Identity, Memory | `.agents/skills/strands-bedrock-agentcore-deploy/SKILL.md` |
   | Choosing where to deploy on AWS: AgentCore vs Lambda vs Fargate vs App Runner vs EKS vs EC2 | `.agents/skills/strands-aws-deployment-targets/SKILL.md` |
   | Tracing, metrics, OpenTelemetry, CloudWatch, trace headers | `.agents/skills/strands-observability/SKILL.md` |

2. Follow the loaded skill's procedure. For a new agent, load in order:
   agent-fundamentals → model-providers → (multi-agent-patterns if the task needs more
   than one agent) → aws-deployment-targets → bedrock-agentcore-deploy → observability.

3. If the task is about AWS deployment in general but the target isn't decided yet,
   start with `strands-aws-deployment-targets` before jumping straight to the
   AgentCore-specific skill.

## Arguments

`the user's command input` (optional): the Strands task or skill area. If empty, ask what the task involves.
