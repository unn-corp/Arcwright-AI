# WebSocket Engineer — Quick Rules

> Load full `SKILL.md` when executing this skill as a formal procedure.

## Core Rules
- Authenticate at the middleware layer before the connection is established — never accept unauthenticated sockets into event handlers
- Implement heartbeat/ping-pong; do not rely on TCP keepalive alone to detect dead connections
- Use rooms and namespaces for message scoping — never broadcast to all and filter in application logic
- Use sticky sessions for load balancing — WebSocket connections are stateful and must route to the same server instance
- Verify Redis pub/sub round-trip before enabling the Redis adapter for horizontal scaling
- Track presence in Redis (not in-process memory) so all instances share the same state
- Clean up presence records, room membership, and in-flight timers on `disconnect`
- Queue messages on the client during disconnection windows to prevent silent data loss
- Use exponential backoff with jitter (`randomizationFactor`) for client reconnection — never retry at a fixed interval
- Do not store large state in-process without a clustering strategy
- Load-test connection-count spikes before production — they behave differently from HTTP traffic spikes
- Plan per-instance connection limits before scaling horizontally

## Red Flags (stop and apply skill)
- No authentication middleware before socket connection is accepted
- Presence or room state stored in-process memory on a multi-instance deployment
- No heartbeat/ping-pong configured
- Load balancer without sticky sessions in front of a WebSocket server
- Client reconnecting at a fixed interval without backoff
- Disconnect handler missing cleanup for presence or timers
