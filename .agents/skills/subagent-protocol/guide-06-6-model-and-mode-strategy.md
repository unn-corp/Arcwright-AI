# Model and permission selection

Inherit the user's selected provider, model, reasoning effort, and permissions
unless the task explicitly chooses an override or a supported workflow needs one.
A role title does not imply a particular provider or model. Do not ask again for
an already authorized choice or upgrade models as routine activation ceremony.

When an override is needed in Arcwright Code/T3 Code, discover available targets
with `orchestrator_capabilities`; use its current provider instance and model IDs,
including configured custom models. Native delegation is suitable only when it
supports that chosen model. Otherwise use `delegate_task`, even for the same
provider. Never treat a native tool's short model list as the full live catalog.

Host-specific permission fields are conditional. For example, a Claude host may
support `permissionMode`, while another host has no such parameter. Use the actual
schema and existing authorization; omit optional permission overrides when no
change is required. Tool allowlists and profiles cannot grant more access than
host policy. A denied action requires a permitted alternative or a consequential
user decision, not an automatic permission bypass.

Record model or usage only when exposed by the host. Do not invent an effective
model, reasoning level, token total, or cost saving from a profile name.
