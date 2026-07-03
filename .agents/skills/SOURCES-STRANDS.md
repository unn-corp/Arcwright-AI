# Strands Agents skills (strands-*)

The `strands-*` skill directories in this folder are **original Arcwright works**,
authored from scratch and distilled from AWS's official **Strands Agents SDK**
documentation and source:

- Primary source: https://strandsagents.com/docs
- Repositories: https://github.com/strands-agents/harness-sdk,
  https://github.com/strands-agents/tools, https://github.com/strands-agents/samples
- Bedrock AgentCore deployment path: https://aws.github.io/bedrock-agentcore-starter-toolkit/,
  https://docs.aws.amazon.com/bedrock-agentcore/
- Strands Agents SDK is licensed under Apache-2.0; the documentation and source are the
  canonical reference for the APIs, CLI commands, and behaviors described here.

These skills are **NOT vendored** from any third-party skill repository. APIs, CLI
commands, config keys, and behaviors are facts drawn from the official docs and source;
all prose, examples, do/don't framing, and checklists are original to Arcwright.

The shared `strands-` directory prefix (and matching `name:` field) groups these
skills so the Arcwright installer can include/exclude them as one unit via a
`--strands` opt-in flag.

## The skills

| Skill dir | Topic | Primary source |
|---|---|---|
| `strands-agent-fundamentals` | The model-driven agent loop, stop reasons, tool definitions (Python type hints / TypeScript Zod), structured output, hooks, `SlidingWindowConversationManager`, `use_aws`/Knowledge Base/AgentCore Memory as memory options | strandsagents.com/docs (user guide: agents, tools, hooks, conversation management) |
| `strands-multi-agent-patterns` | Agents-as-tools, Graph (deterministic DAG/cyclic), Swarm (autonomous handoff), Workflow orchestration, nesting patterns | strandsagents.com/docs/user-guide/concepts/multi-agent/ (`agents-as-tools/`, `graph/`, `swarm/`, `multi-agent-patterns/`) |
| `strands-model-providers` | `BedrockModel` config (region, model ID, guardrails, region-lock caveat), OpenAI/Anthropic-direct/Gemini/Ollama/custom providers | strandsagents.com/docs/user-guide/concepts/model-providers/ (`amazon-bedrock/` and sibling provider pages) |
| `strands-bedrock-agentcore-deploy` | `BedrockAgentCoreApp` + `@app.entrypoint`, streaming via async/`yield`, the `agentcore` CLI (`configure`/`deploy`/`invoke`/`status`/`destroy`), arm64 constraint, ECR, per-session microVM isolation, AgentCore Identity, AgentCore Memory | strandsagents.com/docs/user-guide/deploy/deploy_to_bedrock_agentcore/, aws.github.io/bedrock-agentcore-starter-toolkit/ |
| `strands-aws-deployment-targets` | Decision guide across Bedrock AgentCore, Lambda, Fargate, App Runner, EKS, EC2 | strandsagents.com/docs (deploy section) + docs.aws.amazon.com/bedrock-agentcore/ |
| `strands-observability` | OTel instrumentation, CloudWatch export, `traceparent`/`X-Amzn-Trace-Id`/`baggage` propagation, span-per-tool-call/model-call practice | strandsagents.com/docs/user-guide/observability-evaluation/observability/, /traces/ (supplemented with general OTel-for-agents practice where the official docs stay high-level, called out explicitly in the skill) |

`use_aws`, Bedrock Knowledge Base, and AgentCore Memory are referenced inside
`strands-agent-fundamentals` and `strands-bedrock-agentcore-deploy` as agent-memory
options rather than broken out into their own skills.

## Maintenance

Strands Agents and Bedrock AgentCore are both under active development; verify CLI
command names, config keys, and package names against the current docs at
https://strandsagents.com/docs and https://aws.github.io/bedrock-agentcore-starter-toolkit/
when refreshing. The `agentcore` CLI in particular has moved fast: confirm the current
subcommand set (`configure`/`deploy`/`invoke`/`status`/`destroy` at time of writing)
before trusting an example verbatim.
