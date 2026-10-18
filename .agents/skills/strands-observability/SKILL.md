---
name: strands-observability
description: "Instrument or diagnose Strands agents using traces, metrics, logs, and measured tool/model behavior."
---

# Observability for Strands Agents

Strands emits telemetry via the OpenTelemetry (OTel) standard, so it plugs into any OTel-compatible backend, AWS X-Ray, Amazon CloudWatch, Jaeger, or others. Distilled from https://strandsagents.com/docs/user-guide/observability-evaluation/observability/ and https://strandsagents.com/docs/user-guide/observability-evaluation/traces/, supplemented with general OpenTelemetry-for-agents practice where the official docs stay high-level.

## When to Use This Skill

- Wiring OTel export from a Strands agent to CloudWatch (or another backend)
- Propagating trace context when an agent calls out to other services
- Diagnosing where latency or cost is going in a multi-tool, multi-call agent run
- Deciding what to instrument as a span versus a log line

## What Strands Emits

The SDK instruments the full request journey through the agent loop: LLM/model calls, retriever calls, tool invocations, and the event-loop cycles that connect them, all under the OpenTelemetry standard. Because it's standard OTel, you point it at a collector or backend the same way you would any other OTel-instrumented service, no Strands-specific telemetry format to learn.

The SDK also automatically tracks key run-level metrics: token usage, tool usage counts, and per-cycle performance, without you adding manual instrumentation for the basics.

## Trace Context Propagation

When an agent invocation is itself part of a larger distributed trace (e.g. called from an API Gateway request, or calling out to another instrumented service), propagate context via standard headers:

- **`traceparent`** - the W3C Trace Context header, use this by default for anything OTel-native.
- **`X-Amzn-Trace-Id`** - AWS X-Ray's native header, needed when the trace needs to correlate with X-Ray-instrumented AWS services in the same call chain.
- **`baggage`** - carries arbitrary key/value context alongside the trace (e.g. a tenant ID) across service boundaries.

Attach these on inbound requests to the agent's entrypoint and forward them on any outbound call the agent makes, so the trace stays continuous end to end rather than fragmenting into disconnected spans per service.

> ✅ **DO** propagate `traceparent` (and `X-Amzn-Trace-Id` if X-Ray is anywhere in the chain) across every hop the agent makes, including tool calls that hit your own services.
> ❌ **DON'T** let the agent's internal spans exist in isolation from the rest of your system's tracing, an agent that "just works" but isn't part of the same trace as the request that triggered it is much harder to debug in production.

## CloudWatch

Multiple paths exist to get Strands' OTel output into CloudWatch: an OTel collector configured to export to CloudWatch, or (if deployed to AgentCore) the AgentCore-managed observability integration, which wires traces/metrics/logs to CloudWatch with less manual collector setup. If you're already on AgentCore, prefer its managed path over standing up your own collector unless you have a reason to route telemetry elsewhere too.

## What to Span, General OTel-for-Agents Practice

The official docs describe what Strands emits automatically but stay light on prescriptive guidance for *your own* additional instrumentation. Applying general OTel-for-agents practice on top:

- **One span per tool call.** Name it after the tool, attach arguments (redact anything sensitive) and the result status as attributes. This is what lets you see, per run, which tool ate the latency.
- **One span per model call**, nested under the agent-loop span it belongs to. Attach model ID, token counts, and latency as attributes, this is where cost and latency usually concentrate.
- **Record invocation budget and outcome.** Capture configured `Limits`, actual usage, and whether a cap was exceeded at a turn boundary; distinguish `limit_turns`, token-limit stop reasons, cancellation, and normal completion. These budgets are per invocation, so aggregate usage explicitly for a job spanning retries.
- **Log the stop reason** (see `strands-agent-fundamentals`) on the top-level span for the invocation. A run that hit a token-budget or guardrail stop looks identical to a normal completion unless the stop reason is recorded somewhere queryable.
- **Attach the AgentCore session ID** (if deployed there) as a span attribute, it's the natural correlation key across the microVM-isolated invocations of the same agent.
- **Prefer hooks over ad-hoc instrumentation calls** scattered through tool code (see `strands-agent-fundamentals`), a before/after-tool-execution hook is a single seam to emit spans consistently instead of remembering to do it in every tool.

> ✅ **DO** treat "span per tool call, span per model call, log the stop reason" as the minimum bar even where the official docs don't spell it out explicitly.
> ❌ **DON'T** rely solely on the SDK's automatic instrumentation for anything you'll need to explain to a stakeholder later (why did this run cost 10x normal, why did it stop early), add the attributes that answer those questions up front.

## Validation Checklist

- [ ] OTel export is wired to a real backend (CloudWatch, X-Ray, or another OTel-compatible target), not left as a local-only default
- [ ] `traceparent` (and `X-Amzn-Trace-Id` where X-Ray is in the chain) is propagated on inbound and outbound calls
- [ ] Every tool call and model call produces its own span, nested under the invocation's top-level span
- [ ] The stop reason for each invocation is recorded as a queryable attribute, not just visible in raw logs
- [ ] Token usage and per-tool latency are visible per run, not just aggregated across all runs
