---
name: callkit-voip
description: "Implement or debug CallKit and PushKit VoIP flows, including incoming/outgoing calls, call actions, audio sessions, and reporting deadlines. Ordinary remote alerts use push-notifications."
---

# CallKit + PushKit VoIP

Build VoIP calling features that integrate with the native iOS call UI using
CallKit and PushKit. Covers incoming/outgoing call flows, VoIP push
registration, audio session coordination, and call directory extensions.
Targets Swift 6.2 / iOS 26+.

## Essential constraints

- Report incoming VoIP pushes to CallKit promptly; keep refreshed push tokens synchronized with the authorized backend.
- Start audio after CallKit activates the session; fulfill or fail every action and clean up ended calls.
- Check capabilities, permissions, background modes, and real incoming/outgoing call behavior.

## Load only the needed topic

Read the relevant recipe below, plus its linked detail when needed. The original
examples and checks remain available without loading every API into the task.

| Topic | Reference |
| --- | --- |
| Setup | [recipe-01-setup.md](references/recipe-01-setup.md) |
| Provider Configuration | [recipe-02-provider-configuration.md](references/recipe-02-provider-configuration.md) |
| Incoming Call Flow | [recipe-03-incoming-call-flow.md](references/recipe-03-incoming-call-flow.md) |
| Outgoing Call Flow | [recipe-04-outgoing-call-flow.md](references/recipe-04-outgoing-call-flow.md) |
| PushKit VoIP Registration | [recipe-05-pushkit-voip-registration.md](references/recipe-05-pushkit-voip-registration.md) |
| Audio Session Coordination | [recipe-06-audio-session-coordination.md](references/recipe-06-audio-session-coordination.md) |
| Call Directory Extension | [recipe-07-call-directory-extension.md](references/recipe-07-call-directory-extension.md) |
| Common Mistakes | [recipe-08-common-mistakes.md](references/recipe-08-common-mistakes.md) |
| Review Checklist | [recipe-09-review-checklist.md](references/recipe-09-review-checklist.md) |
| References | [recipe-10-references.md](references/recipe-10-references.md) |
