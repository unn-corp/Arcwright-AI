---
name: strands-agent-fundamentals
description: "Build Strands SDK agents and tools, structured output, hooks, agent-loop behavior, and conversation management. Provider configuration, multi-agent coordination, and deployment have separate skills."
---

# Strands Agents SDK: Fundamentals

Strands Agents is AWS's open source, model-driven SDK for building AI agents in Python and TypeScript. Distilled from https://strandsagents.com/docs and https://github.com/strands-agents/harness-sdk (Apache-2.0).

Python API examples below are checked against published `python/v1.61.1` (`5cb880559e5ed88bd55de2779e72d060020f756b`); inspect the installed package before using them on older versions. A newer repository `main` is not a released API guarantee.

## SDK or ready-made harness

Use `from strands import Agent` when the application owns the model, tools, permissions, session policy, and control flow. `strands-harness` is a separate, opinionated package: `from strands_harness import create_harness` produces an SDK `Agent` with configured defaults for tools, sessions, context, skills, and other facilities. Inspect and constrain those defaults before using it in an application; do not switch an existing SDK application to the harness merely to follow a new quickstart. Keep the project's installed package and API versions distinct.

## When to Use This Skill

- Writing your first Strands agent (model + system prompt + tools)
- Deciding whether the model or your code should own control flow
- Defining tools the agent can call
- Getting typed, schema-validated output back from the agent
- Hooking into the agent's lifecycle (before/after a model call or tool execution)
- Keeping a long-running conversation's context bounded

## The Model-Driven Agent Model

Strands' core idea: give a model a system prompt and a set of tools, and let the **model** decide what to do next, rather than hand-coding the control flow yourself.

```python
from strands import Agent
from strands_tools import calculator

agent = Agent(
    system_prompt="You are a helpful assistant.",
    tools=[calculator],
)

result = agent("What is 12 * 7, then add 100?")
```

## The Agent Loop

Every call into an agent runs the same loop until a **stop reason** is hit:

1. **Reason** - the model reads the conversation + system prompt and decides what to do
2. **Tool select** - if it wants a tool, it emits a tool-use request with arguments
3. **Execute** - the SDK runs the tool and appends the result to the conversation
4. **Re-reason** - the model sees the tool result and decides whether to call another tool, ask a follow-up, or finish

Stop reasons that end the loop:

| Stop reason | Meaning |
|---|---|
| `end_turn` | The model produced a final answer, no more tool calls |
| `tool_use` | The model is still mid-loop, requesting another tool (internal to the loop, not a terminal state for the caller) |
| `limit_turns` | Invocation loop-turn cap reached |
| `limit_output_tokens` / `limit_total_tokens` | Invocation token-spend cap reached, checked between turns |
| `cancelled` | Invocation cancelled at a supported checkpoint |
| `max_tokens` | The provider ended one response at its model output-token bound; distinct from an invocation budget |
| Guardrail | A configured guardrail (e.g. a Bedrock guardrail) interrupted the response |

## Invocation limits and cancellation

Provider `max_tokens` limits a model response. `Limits` constrains the whole invocation, independently on each call:

```python
from strands import Agent
from strands.types.agent import Limits

agent = Agent()  # supply the application's configured model and tools
result = agent(
    "Inspect the supplied build log and explain the failure.",
    limits=Limits(turns=8, output_tokens=4000, total_tokens=24000),
)
if result.stop_reason in {"limit_turns", "limit_output_tokens", "limit_total_tokens", "cancelled"}:
    print(f"Incomplete run: {result.stop_reason}")
else:
    print(result)
```

Caps must be positive integers; omit a dimension for no cap. Token budgets are soft: a model response may overshoot, and already-requested tools finish before the next boundary check. Limits do not roll back tool effects, guarantee a hard currency ceiling, or establish that the user's task completed. Preserve partial output and the stop reason so a caller can decide whether to resume.

In this release `agent.cancel()` requests cancellation at the next supported checkpoint. A caller can instead pass a `threading.Event` as `cancel_signal` to the invocation; the SDK does not clear the caller's event. Neither mechanism forcibly interrupts arbitrary blocking tools. Do not use newer `cancel(after_current_tools=...)` forms without confirming support in the installed release. Keep one invocation per agent unless its explicit concurrency contract permits otherwise.

## Tool Failures Are Results, Not Exceptions

When a tool raises or returns an error, the SDK does not crash the agent, it feeds the failure back into the conversation as a **tool result** the model can read and react to. This is what lets an agent self-correct (retry with different arguments, pick a different tool, or explain the failure to the user) instead of the whole run aborting on the first bad call.

> ✅ **DO** let tool errors surface as structured results and trust the model to react.
> ❌ **DON'T** wrap every tool call in your own try/except that silently drops the error before the model sees it, that removes the model's ability to self-correct.

## Writing Tools

**Python** - a plain function with type hints and a docstring is enough; the SDK derives the tool's schema from the signature and docstring:

```python
def get_weather(city: str) -> str:
    """Get the current weather for a city.

    Args:
        city: The city name to look up.
    """
    ...
```

**TypeScript** - tools are defined with a Zod schema via the `tool()` helper, so the input shape is validated before your handler runs:

```typescript
import { tool } from "@strands-agents/harness-sdk";
import { z } from "zod";

const getWeather = tool({
  name: "get_weather",
  description: "Get the current weather for a city.",
  inputSchema: z.object({ city: z.string() }),
  handler: async ({ city }) => { /* ... */ },
});
```

In both languages, the description and parameter docs are what the model actually reads to decide when and how to call the tool, treat them as prompt content, not internal comments.

## Structured Output

Instead of parsing free text, give the agent a schema and get a validated object back: Pydantic models in Python, Zod schemas in TypeScript. If the model's first response doesn't validate, the SDK automatically retries with the validation error fed back to the model.

```python
from pydantic import BaseModel

class WeatherReport(BaseModel):
    city: str
    temperature_f: int
    conditions: str

result = agent.structured_output(WeatherReport, "What's the weather in Seattle?")
```

> ✅ **DO** reach for structured output whenever a downstream system consumes the agent's answer programmatically.
> ❌ **DON'T** hand-parse the agent's free-text response with regex, the auto-retry-on-validation-failure behavior is the whole point.

## Hooks: Lifecycle Interception

Hooks let you observe or intervene at specific points in the agent loop: before/after the whole invocation, before/after each model call, before/after each tool execution. Use them for logging, metrics, redacting sensitive data before it reaches the model, or short-circuiting a tool call under a policy check. This is also the seam to emit your own OpenTelemetry spans (see `strands-observability`).

## Bounding Context: SlidingWindowConversationManager

Long conversations grow the context sent to the model on every turn. `SlidingWindowConversationManager` keeps only the most recent N messages (configurable), trimming older turns so token usage and latency stay bounded on long-running agents.

```python
from strands import Agent
from strands.agent.conversation_manager import SlidingWindowConversationManager

agent = Agent(
    conversation_manager=SlidingWindowConversationManager(window_size=20),
)
```

## Agent Memory, Beyond the Conversation Window

The sliding window bounds the current conversation, it is not durable memory. For memory that outlives a single session:

- **`use_aws` tool** - lets the agent call arbitrary AWS services directly via boto3 (e.g. read/write to DynamoDB, S3) without you writing a bespoke tool for each service.
- **Bedrock Knowledge Base** - retrieval-augmented lookups over your own documents, wired in as a tool or retriever.
- **AgentCore Memory** - a managed short-term/long-term memory resource for agents deployed to Bedrock AgentCore (see `strands-bedrock-agentcore-deploy`), provisioned and queried via the `agentcore` CLI's memory commands.

Pick based on scope: `use_aws` for one-off service calls, Knowledge Base for document retrieval, AgentCore Memory when the agent itself needs to remember across sessions and you're already deploying to AgentCore.

## Validation Checklist

- [ ] The agent's system prompt and tool descriptions are written for the model to read, not just for humans
- [ ] Tool errors are allowed to surface as results (not swallowed before the model sees them)
- [ ] Structured output is used wherever another system consumes the agent's answer
- [ ] Long-running agents bound context growth and per-invocation work separately; limit/cancellation results are handled as incomplete work
- [ ] Durable memory needs are matched to the right mechanism (`use_aws`, Knowledge Base, or AgentCore Memory), not bolted onto the conversation window
