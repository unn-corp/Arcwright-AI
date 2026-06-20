# 22. AI/LLM & WebSocket Security
**Maps to:** `references/modern-threats.md`, `references/api-security.md`, `references/authorization.md`

Two modern real-time/AI surfaces the classic OWASP lists under-cover. Run the half that applies
(LLM integration and/or WebSocket); mark the other **N/A**.

## A. AI / LLM Integration (OWASP LLM Top 10)
**Detect:** calls to LLM SDKs/APIs, prompt construction, RAG retrieval, tool/function calling,
agent loops.

**Run:**
```bash
grep -rniE "anthropic|openai|@ai-sdk|langchain|llama|mistral|cohere|ollama|completions|messages\.create|chat\.completions|invoke_model|bedrock|minimax" --include=*.{js,ts,py,go} . | head -40
grep -rniE "system_?prompt|prompt\s*=|f\"\"\".*\{|\.format\(|template.*\{user|tool_?call|function_?call" --include=*.{js,ts,py} . | head -30
```

**What good looks like:**
- **Prompt-injection aware:** untrusted content (user input, **retrieved RAG documents**, web
  pages, tool outputs) is treated as data, not instructions — kept in clearly delimited user
  turns, never concatenated into the system prompt. The model's output is **not trusted** for
  authorization or as code.
- **Tool/function calls are authorized and bounded:** the model can only invoke a fixed allowlist
  of tools; each tool re-checks permissions server-side (the LLM is an untrusted caller — topics
  1/14); destructive tools require confirmation. No `eval`/shell/SQL built from raw model output.
- **Output handling:** model output rendered as text is escaped (XSS — topic 17); never executed,
  never used to build queries/commands without validation.
- **Resource & abuse controls:** token/request rate limits per user (topic 6), max output size,
  prompt/response logged **without** secrets/PII (topic 12), spend caps.
- **Sensitive data:** secrets/PII not placed in prompts or sent to third-party model APIs beyond
  what's needed; self-hosted/region constraints honored where required.

**Red flags:**
| Pattern | Severity |
|---------|----------|
| Retrieved/user content concatenated into the **system prompt** (prompt injection) | **High** |
| Model output used to build SQL/shell/`eval`, or trusted for an authz decision | **High/Critical** |
| Tool-calling with no server-side permission re-check or no tool allowlist | **High** |
| No per-user rate/token limit on the LLM endpoint (cost & abuse DoS) | **Medium** |
| Secrets/PII sent into prompts or logged in full | **Medium/High** |

## B. WebSocket Security
**Detect:** `ws`, `socket.io`, `websockets`, `gorilla/websocket`, `WebSocketHandler`,
`@WebSocketGateway`, SSE handlers.

**Run:**
```bash
grep -rniE "socket\.io|new WebSocket|ws\.|websockets|gorilla/websocket|WebSocketHandler|WebSocketGateway|upgrade.*websocket|EventSource" --include=*.{js,ts,py,go,java} . | head -30
grep -rniE "origin|checkOrigin|verifyClient|handleConnection|authenticate|cors" --include=*.{js,ts,py,go} . | grep -iE "socket|ws|connect" | head
```

**What good looks like:**
- **Origin is validated** on the handshake (`checkOrigin`/`verifyClient`/allowlist) — WS is *not*
  covered by the same-origin policy or CORS, so a missing origin check enables **Cross-Site
  WebSocket Hijacking**.
- **Authenticated at connect** — token/session verified during the upgrade (and re-checked, since
  cookies ride along automatically → CSWSH); per-message authorization for sensitive actions, not
  "authed once, trust forever."
- **Every inbound message is validated** (schema/type) like any other untrusted input (topics 3/4);
  no trusting client-sent room/user/tenant ids (topic 19).
- **Resource controls:** message size limits, per-connection rate limiting, connection caps,
  heartbeat/timeout to reap dead sockets; `wss://` (TLS) in prod (topic 9).

**Red flags:**
| Pattern | Severity |
|---------|----------|
| No origin check on the WS handshake → Cross-Site WebSocket Hijacking | **High** |
| No auth on connect / auth only at connect with no per-message authz | **High** |
| Inbound messages used unvalidated (room/tenant/id trusted from client) | **High** |
| No message size / rate / connection limits (DoS) | **Medium** |
| Plain `ws://` carrying auth in prod | **High** |

**Verdict guidance:**
- ✅ **Pass** — untrusted content kept out of system prompts and tool calls re-authorized; WS
  validates origin + auth + every message.
- ⚠️ **Weak** — mostly sound but missing rate limits, or WS authed at connect only.
- ❌ **Fail** — prompt injection into system prompt / model output driving privileged actions, or
  WS with no origin check and no per-message authz.

Report findings as `SCAN-NN` with `file:line`.
