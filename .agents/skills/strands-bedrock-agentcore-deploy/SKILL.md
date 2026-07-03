---
name: strands-bedrock-agentcore-deploy
description: >
  Deploying a Strands agent to Amazon Bedrock AgentCore, the flagship AWS agent
  runtime: wrapping the agent with BedrockAgentCoreApp, the agentcore CLI
  (configure/deploy/invoke/status/destroy), arm64 container requirements, streaming,
  and identity/memory integration.
  USE FOR: exposing a Strands agent as an AgentCore-compatible HTTP service, deploying
  it with the agentcore CLI, diagnosing an arm64/x86_64 build failure, adding
  streaming, or wiring AgentCore Identity or AgentCore Memory.
  DO NOT USE FOR: choosing AgentCore over Lambda/Fargate/EKS/etc. in the first place
  (see strands-aws-deployment-targets), or the agent's own logic (see
  strands-agent-fundamentals).
---

# Deploying a Strands Agent to Bedrock AgentCore

Amazon Bedrock AgentCore is AWS's purpose-built, serverless runtime for production agents, and it is the primary AWS deployment path for Strands. Distilled from https://strandsagents.com/docs/user-guide/deploy/deploy_to_bedrock_agentcore/ and https://aws.github.io/bedrock-agentcore-starter-toolkit/.

## When to Use This Skill

- Wrapping an existing `Agent` so it can be deployed to AgentCore
- Running `agentcore configure` / `deploy` / `invoke` for the first time
- A container build failing because it was built for the wrong architecture
- Adding streaming responses to a deployed agent
- Integrating AgentCore Identity (Cognito/Entra/Okta/OAuth) or AgentCore Memory

## Wrapping the Agent: BedrockAgentCoreApp

`BedrockAgentCoreApp` auto-exposes the two endpoints AgentCore Runtime expects on port 8080: `POST /invocations` and `GET /ping`. Your job is just to define the entrypoint.

```python
from bedrock_agentcore.runtime import BedrockAgentCoreApp
from strands import Agent

app = BedrockAgentCoreApp()
agent = Agent()

@app.entrypoint
def invoke(payload):
    user_message = payload.get("prompt", "Hello")
    result = agent(user_message)
    return {"result": result.message}

if __name__ == "__main__":
    app.run()
```

`bedrock_agentcore` is the companion runtime package (`pip install bedrock-agentcore`), separate from the Strands SDK itself.

### Streaming

Make the entrypoint an `async def` and `yield` events as the agent produces them, `stream_async()` on the underlying agent gives you the event stream to forward:

```python
@app.entrypoint
async def invoke(payload):
    user_message = payload.get("prompt", "Hello")
    async for event in agent.stream_async(user_message):
        yield event
```

> ✅ **DO** use the async/`yield` entrypoint for anything interactive or latency-sensitive, AgentCore streams the response back as it's produced.
> ❌ **DON'T** buffer the whole response server-side and return it in one shot if the client is waiting on a chat-style UI, that reintroduces the latency streaming exists to remove.

## The `agentcore` CLI

Install via `pip install bedrock-agentcore-starter-toolkit`. Core workflow:

```bash
# 1. Configure: point the CLI at your entrypoint file
agentcore configure -e agent.py
agentcore configure -e agent.py -r us-east-1          # pin a region
agentcore configure -e agent.py --execution-role arn:aws:iam::111122223333:role/MyRole

# 2. Deploy
agentcore deploy                # default: builds via AWS CodeBuild, no local Docker needed
agentcore deploy --local        # build AND run locally, requires Docker/Finch/Podman
agentcore deploy --local-build  # build locally, deploy the image to the cloud

# 3. Invoke
agentcore invoke '{"prompt": "tell me a joke"}'

# 4. Manage
agentcore status                # deployment state, memory config, endpoint details
agentcore destroy                # tear down agent resources, ECR images, IAM roles
```

The default `agentcore deploy` (no flag) is the path with the least local setup: it builds the arm64 image in AWS CodeBuild, so you don't need Docker installed at all. Reach for `--local` only when you need to run and debug the container on your own machine before shipping it.

## Hard Constraints

- **Architecture: linux/arm64 only.** AgentCore Runtime requires ARM64 (AWS Graviton) containers. An x86_64 image built and pushed locally will not deploy, if you're building locally rather than via CodeBuild, target arm64 explicitly: `docker buildx build --platform linux/arm64`.
- **Container tooling is only needed for `--local`/`--local-build`.** The default `agentcore deploy` needs no Docker/Finch/Podman on your machine, it delegates the build to CodeBuild.
- **Images live in Amazon ECR.** The CLI handles authentication and pushes for you in the default flow, manual builds need `aws ecr get-login-password | docker login` first.
- **Port 8080, two fixed endpoints.** `POST /invocations` and `GET /ping`, both provided automatically by `BedrockAgentCoreApp`, don't redefine them yourself.

> ❌ **DON'T** assume a container that builds fine on your (likely x86_64) laptop will deploy as-is, verify the image is arm64 before troubleshooting anything else about a failed deploy.

## Isolation: Per-Session microVMs

AgentCore Runtime isolates each session in its own microVM, so concurrent invocations of the same agent don't share memory or state unless you explicitly wire in a shared store (AgentCore Memory, a database, etc.). Design the entrypoint to be stateless across invocations and pull any needed session state from outside the process.

## Identity: AgentCore Identity

AgentCore Identity integrates with external identity providers (Amazon Cognito, Microsoft Entra ID, Okta, or generic OAuth 2.0) to authenticate both inbound calls to the agent and outbound calls the agent makes to other services, without the agent handling raw credentials itself. Configure it via the CLI's Identity commands (`setup-cognito`, `create-credential-provider`, `create-workload-identity`) rather than embedding secrets in the agent's code or environment.

## Memory: AgentCore Memory

For agents that need to remember across sessions (not just within one conversation's sliding window, see `strands-agent-fundamentals`), AgentCore Memory provisions managed short-term and long-term memory resources via the CLI's Memory commands (`create`, `get`, `list`, `delete`, `status`). This is the natural pairing when you're already deploying to AgentCore and need durable memory without standing up your own database.

## Validation Checklist

- [ ] The entrypoint uses `@app.entrypoint` from `BedrockAgentCoreApp`, not a hand-rolled HTTP server
- [ ] Streaming responses use an `async def` entrypoint with `yield`, not a buffered return
- [ ] Any locally built image targets `linux/arm64` explicitly, or the default CodeBuild-backed `agentcore deploy` is used instead
- [ ] The entrypoint is stateless across invocations (per-session microVM isolation assumed)
- [ ] Cross-service auth goes through AgentCore Identity, not embedded credentials
- [ ] Durable memory needs use AgentCore Memory rather than being bolted onto the conversation window
