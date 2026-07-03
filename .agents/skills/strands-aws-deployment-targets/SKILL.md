---
name: strands-aws-deployment-targets
description: >
  Decision guide for where to run a Strands agent on AWS: Bedrock AgentCore, Lambda,
  Fargate, App Runner, EKS, or EC2, with tradeoffs across cold-start, streaming
  support, concurrency, and operational burden.
  USE FOR: choosing a deployment target for a new Strands agent, or reconsidering the
  target when requirements (streaming, concurrency, ops budget) change.
  DO NOT USE FOR: the mechanics of the AgentCore path once chosen (see
  strands-bedrock-agentcore-deploy), or the agent's own logic (see
  strands-agent-fundamentals).
---

# Where to Deploy a Strands Agent on AWS

Strands agents are plain Python or TypeScript processes, they can run anywhere a container or a function can. This is a decision guide across the six targets that come up most often, not a mechanics guide, once you've picked a target read its dedicated deployment docs (`strands-bedrock-agentcore-deploy` for AgentCore).

## When to Use This Skill

- Starting a new Strands agent and deciding where it will run
- An agent has outgrown its current target (cold-start too slow, needs streaming, needs more concurrency)
- Comparing "AgentCore vs Lambda" or "Fargate vs App Runner vs EKS" for a specific workload
- Explaining to a stakeholder why a given target was chosen

## The Six Targets

| Target | Best for | Cold start | Streaming | Concurrency model | Ops burden |
|---|---|---|---|---|---|
| **Bedrock AgentCore** | Purpose-built agent runtime, the flagship path | Low, managed | Yes (async entrypoint) | Per-session microVM isolation, scales automatically | Lowest, AWS manages the runtime |
| **Lambda** | Short-lived, batch, event-triggered agent invocations | Can be significant on cold containers | Limited (response streaming exists but is constrained by Lambda's execution model) | One invocation per container instance, scales via concurrent executions | Low, fully managed compute |
| **Fargate** | Containerized, streaming, interactive agents that need to stay warm | Low once the service is running | Full support (long-lived process) | You define task count / auto-scaling | Moderate, you own the service definition and scaling policy |
| **App Runner** | Containerized agents wanting Fargate-like behavior with less config | Low | Full support | Built-in auto-scaling | Low, less to configure than raw Fargate |
| **EKS** | High-concurrency, multi-service agent systems already on Kubernetes | Low once pods are warm | Full support | Full Kubernetes control (HPA, custom scheduling) | Highest, you own the cluster |
| **EC2** | Maximum control, high sustained volume, specialized hardware/runtime needs | None (always-on) | Full support | Whatever you build | Highest, you own the instance lifecycle |

## Decision Guide

**Start with AgentCore unless you have a specific reason not to.** It is purpose-built for agent workloads: it handles the HTTP contract, session isolation, identity, and memory integration for you (see `strands-bedrock-agentcore-deploy`). Most new Strands agents on AWS should default here.

Reasons to look elsewhere:

- **Lambda** - the workload is a short batch job or event-triggered task (a scheduled report, a queue consumer) where you don't need a long-lived interactive session, and the constrained streaming model is acceptable.
- **Fargate / App Runner** - you need a long-lived, always-warm interactive service with full streaming, but want more control over the runtime than AgentCore's abstraction gives you (custom base image, non-standard ports, existing container tooling). App Runner if you want less to configure; Fargate if you need finer control over networking, task placement, or scaling policy.
- **EKS** - you're already running Kubernetes and the agent is one service among many that need to share cluster-level concerns (service mesh, shared ingress, existing HPA policies). Don't adopt EKS solely to host one agent.
- **EC2** - genuinely high, sustained, predictable volume where reserved/spot instance economics beat serverless pricing, or the agent needs hardware/runtime access (GPUs, custom kernels, licensing) that containerized/serverless targets don't give you.

> ✅ **DO** default to AgentCore and only move off it when a concrete constraint (batch-only workload, existing k8s footprint, specialized hardware) rules it out.
> ❌ **DON'T** reach for EKS or EC2 out of familiarity, the operational burden columns above are real and compound over the agent's lifetime.

## Re-evaluating an Existing Deployment

Signals it's time to reconsider the target:

- Cold-start latency on Lambda is now user-visible, and the workload has become interactive, move to Fargate/App Runner or AgentCore.
- An EKS-hosted agent is the only thing on the cluster, the k8s overhead may no longer be earning its keep, consider AgentCore or App Runner.
- An AgentCore agent needs a runtime capability AgentCore doesn't expose (a non-standard protocol, unusual hardware), that's a real reason to drop to Fargate or EC2, confirm it's a hard constraint first.

## Validation Checklist

- [ ] AgentCore was the starting assumption, with a concrete reason recorded if a different target was chosen
- [ ] The target supports the concurrency and streaming needs of the actual workload, not just today's prototype
- [ ] Ops burden was weighed against the team's actual capacity to run EKS/EC2 long-term
- [ ] The choice is revisited if cold-start, streaming, or concurrency requirements change materially
