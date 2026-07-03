---
name: strands-model-providers
description: >
  Configuring which model backend a Strands agent uses: Amazon Bedrock (the AWS
  default, via BedrockModel), plus OpenAI, Anthropic direct, Gemini, Ollama, and
  custom provider integrations.
  USE FOR: wiring a model into an Agent, choosing a Bedrock model ID and region,
  applying a Bedrock guardrail to an agent, or swapping between providers.
  DO NOT USE FOR: the agent loop and tools themselves (see strands-agent-fundamentals),
  or deploying the agent once it's built (see strands-bedrock-agentcore-deploy,
  strands-aws-deployment-targets).
---

# Strands Model Providers

An `Agent` needs a model backend to reason with. Strands ships a `BedrockModel` provider as the AWS-native default, plus providers for the major hosted and local model backends. Distilled from https://strandsagents.com/docs/user-guide/concepts/model-providers/.

## When to Use This Skill

- Wiring a specific model into a new `Agent`
- Configuring Bedrock region, model ID, or a guardrail
- Understanding the Bedrock cross-region / region-lock caveat
- Swapping an agent from one model provider to another
- Choosing a provider for local development without cloud credentials

## Amazon Bedrock: the AWS Default

`BedrockModel` is the provider Strands (and AgentCore, see `strands-bedrock-agentcore-deploy`) is built around. It defaults to the `AWS_REGION` environment variable, or `us-west-2` if unset.

```python
from strands import Agent
from strands.models import BedrockModel

model = BedrockModel(
    model_id="us.anthropic.claude-sonnet-4-6-20260101-v1:0",
    region_name="us-west-2",
)

agent = Agent(model=model)
```

Key config:

- **`model_id`** - the Bedrock model ID, including cross-region inference profile prefixes (`us.`, `global.`) where applicable
- **`region_name`** - defaults from `AWS_REGION`, then `us-west-2`
- **`guardrail_id`** / **`guardrail_version`** / **`guardrail_trace`** - attach an Amazon Bedrock Guardrail to filter agent input/output
- **`boto_client_config`** - pass a custom `botocore.config.Config`; the SDK merges its own `user_agent_extra` in if you don't override it

```python
model = BedrockModel(
    model_id="us.anthropic.claude-haiku-4-5-20251001-v1:0",
    guardrail_id="<your-guardrail-id>",
    guardrail_version="1",
    guardrail_trace="enabled",
)
```

> **Region-lock caveat:** a given `model_id` (especially cross-region inference profile IDs prefixed `us.`/`eu.`/`apac.`) is only invocable from Bedrock in specific regions. If an agent works in one AWS account/region and fails with an access or not-found error in another, check that the model ID's inference profile is actually available in `region_name` before assuming it's an IAM problem.

## Other Providers

Strands' provider interface is uniform, only the constructor differs:

| Provider | Import | Notes |
|---|---|---|
| OpenAI | `strands.models.openai.OpenAIModel` | Needs `OPENAI_API_KEY` or an explicit key |
| Anthropic (direct) | `strands.models.anthropic.AnthropicModel` | Calls the Anthropic API directly, not via Bedrock |
| Gemini | `strands.models.gemini.GeminiModel` | Google's Gemini API |
| Ollama | `strands.models.ollama.OllamaModel` | Local models, no cloud credentials needed, good for offline dev |
| Custom | Implement the `Model` interface | For a provider Strands doesn't ship, or an internal gateway |

```python
from strands.models.ollama import OllamaModel

model = OllamaModel(model_id="llama3.1", host="http://localhost:11434")
agent = Agent(model=model)
```

> ✅ **DO** use Ollama (or another local provider) for fast iteration on tool/prompt logic before switching to Bedrock for the deployed agent.
> ❌ **DON'T** hardcode a provider deep inside agent construction code, pass the `model` instance in so swapping providers doesn't require touching agent logic.

## Picking a Provider

- **Deploying to AWS** (AgentCore, Lambda, Fargate, etc.): use `BedrockModel`, it is what the rest of the AWS-native toolchain assumes.
- **Already standardized on a non-AWS model API**: use the matching direct provider (OpenAI, Anthropic, Gemini) rather than routing through Bedrock unnecessarily.
- **Local development / CI without cloud credentials**: Ollama.
- **An internal or unsupported backend**: implement the `Model` interface once, reuse it across agents.

## Validation Checklist

- [ ] `model_id` and `region_name` are confirmed compatible (inference profile actually available in that region)
- [ ] A Bedrock guardrail is attached if the agent handles untrusted input or generates user-facing output
- [ ] The model instance is constructed outside agent logic and passed in, not hardcoded
- [ ] Local/offline development uses a non-Bedrock provider (e.g. Ollama) so it doesn't require cloud credentials
