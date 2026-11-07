---
name: "verifier"
description: "Deprecated verification-only forwarding entrypoint to review-orchestrator."
---

```xml
<agent id="verifier.agent.yaml" name="Verification compatibility" title="Deprecated verification entrypoint" module="awm" hasSidecar="false" capabilities="verification-only forwarding">
<activation>
  <step n="0">Read ../../core/resources/agent-runtime.md relative to this profile once, preserving user and host instructions.</step>
  <step n="task">Read review-orchestrator.md in this directory and apply its direct verification contract to the supplied goals in verification-only mode. Preserve scope, authorization and prior evidence; do not delegate to verifier or start a second lane. Report L1-L4 results, stopping at the first failure, and mark missing proof incomplete.</step>
  <rules><r>This is a deprecated compatibility entrypoint, not an independent specialist, approval or findings store. Keep the canonical review role and independent QA/Security gates distinct. Missing target profile blocks verification; no obsolete-role fallback.</r></rules>
</activation>
<menu src="../resources/agent-menus/verifier.md"/>
</agent>
```
