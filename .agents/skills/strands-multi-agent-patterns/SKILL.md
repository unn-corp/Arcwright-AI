---
name: strands-multi-agent-patterns
description: >
  Coordinating multiple Strands agents: agents-as-tools, Graph (deterministic DAG or
  cyclic orchestration), Swarm (autonomous, model-driven handoff), and Workflow, plus
  when to pick each and how they nest.
  USE FOR: deciding between a deterministic pipeline and open-ended agent collaboration,
  building a directed graph of agent nodes, letting agents hand off work to each other
  dynamically, or combining these patterns.
  DO NOT USE FOR: single-agent tool/hook/structured-output design (see
  strands-agent-fundamentals), or where to run the resulting system (see
  strands-aws-deployment-targets).
---

# Strands Multi-Agent Patterns

Strands scales from a single agent up to coordinated systems through a small set of composable orchestration patterns, chosen deliberately as complexity grows rather than imposed by default. Distilled from https://strandsagents.com/docs/user-guide/concepts/multi-agent/.

## When to Use This Skill

- A single agent's task naturally splits into specialist sub-tasks
- Deciding whether a task needs a fixed pipeline or open-ended agent collaboration
- Building a directed graph of agent/tool nodes with explicit dependencies
- Letting agents hand control off to each other without a hardcoded routing table
- Nesting one pattern inside another (a graph node that is itself a swarm, and so on)

## The Adoption Path

Strands' own guidance is to adopt these gradually: start with a single agent, add specialist agents as callable tools, evolve to a swarm once coordination gets dynamic, and orchestrate with a graph once you need deterministic structure across multiple agents or swarms. Reach for the next pattern only when the current one runs out of headroom.

## Agents as Tools

The simplest multi-agent pattern: wrap a specialist agent as a tool that a coordinator agent can call, the same as any other tool. The coordinator's model decides when to invoke the specialist, based on the tool's description.

```python
from strands import Agent, tool

@tool
def research_agent(query: str) -> str:
    """Delegate a research question to a specialist research agent."""
    specialist = Agent(system_prompt="You are a research specialist.")
    return specialist(query).message

coordinator = Agent(tools=[research_agent])
```

Use this when you have one or two specialists and the routing logic ("should I delegate this?") is simple enough for the coordinator model to decide on its own.

## Graph: Deterministic Orchestration

A **Graph** is a directed graph where nodes are agents, custom functions, or nested multi-agent systems (a Swarm or another Graph), and edges define execution dependencies. Output from one node is passed as input to the nodes it connects to. Graphs support both acyclic (DAG, single pass) and cyclic topologies (feedback loops, iterative refinement).

Pick Graph when:

- The pipeline shape is known ahead of time (step A always feeds step B)
- You need parallel branches that fan back in
- You want a reproducible, auditable execution order
- You're building an iterative refine loop (a cycle back to an earlier node)

## Swarm: Autonomous Handoff

A **Swarm** is a team of agents with shared context and working memory that coordinate autonomously, deciding among themselves which agent should act next, rather than following a graph you defined in advance. Handoff is model-driven: an agent in the swarm can pass the task to a teammate when it judges that teammate is better suited.

Pick Swarm when:

- The right sequence of specialists can't be known in advance
- Agents need to collaborate on an open-ended problem (research, exploration, debate)
- You want the system itself to route work, not a hardcoded graph

## Workflow

Workflow orchestration is the general term for sequencing agent (and non-agent) steps toward an outcome, the specific mechanism can be a Graph, a Swarm, agents-as-tools, or plain code calling agents in sequence. When people say "workflow" without specifying, check whether they mean a deterministic pipeline (reach for Graph) or a looser multi-step process (a Graph is usually still the right building block, with Swarm reserved for genuinely open-ended sub-problems).

## Choosing: Graph vs. Swarm

| Signal | Choose |
|---|---|
| You can draw the pipeline as a flowchart today | Graph |
| Steps must run in parallel and fan back in | Graph |
| You need a feedback/refinement loop | Graph (cyclic) |
| The right next agent depends on what was just discovered | Swarm |
| Agents need to negotiate or hand off dynamically | Swarm |
| You're not sure yet | Start with agents-as-tools, promote later |

> ✅ **DO** default to a Graph for anything you can specify in advance, it is easier to reason about, test, and audit than a Swarm.
> ❌ **DON'T** reach for Swarm just because a task has multiple steps, most multi-step tasks are actually deterministic pipelines and belong in a Graph.

## Nesting Patterns

These patterns compose: a Graph node can be a Swarm, a Swarm member can be an agent equipped with other agents as tools, and a Graph can contain another Graph as a node. Build the smallest pattern that solves the immediate problem, then nest a bigger pattern around it only when a new requirement demands it, don't pre-build a Graph-of-Swarms for a two-step pipeline.

## Validation Checklist

- [ ] The simplest pattern that solves the problem was tried first (agents-as-tools before Graph, Graph before Swarm)
- [ ] Deterministic, known-shape pipelines use Graph, not Swarm
- [ ] Swarm is reserved for genuinely open-ended coordination, not used as a shortcut around designing a Graph
- [ ] Any cyclic (feedback-loop) requirement is expressed as a cyclic Graph, not hand-rolled retry logic
- [ ] Nested patterns are justified by an actual requirement, not added preemptively
