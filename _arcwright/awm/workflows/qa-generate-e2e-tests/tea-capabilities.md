# Test Architect capabilities in Arcwright

Use this reference when the request calls for risk-based planning, coverage gates, NFR assessment, test-quality review, or agent-behavior evaluation. Ordinary QA generation keeps its existing framework and workflow.

## Choose the requested outcome

| Capability | Arcwright adaptation | Deliverable |
| --- | --- | --- |
| Test Design | Read requirements and architecture; score stated risks by numeric probability × impact, explain business consequence and recovery, map each risk to a test level and P0–P3 priority | Risk register and coverage plan with source references |
| Automate: red | Write acceptance tests for a requested missing behavior; run them and distinguish the intended assertion failure from setup/runner failure | Executed red evidence, followed by the authorized dev loop |
| Automate: expand | Cover implemented behavior using the current test stack; execute the generated tests; fix test defects and report product defects | Test changes and native execution evidence |
| Test Review | Apply `pr-review-panel`'s R4 evidence method to actual consumers, assertions, execution selection, fixtures, and failure handling | Findings with evidence and disposition; no coverage-percentage-only verdict |
| Trace | Map each requirement/CAP to its existing tests and observed execution evidence; show gaps and explicit accepted risks separately | Traceability matrix and a justified release recommendation |
| NFR | Compare declared performance, reliability, security, or operability requirements with measured implementation evidence | Requirement-by-requirement pass/fail/unmeasured report |
| Framework / CI | Use the installed CI/framework skills and repository conventions within the user's authorized scope | Runnable scoped commands, integration/config changes, and observed results |
| Evaluate | Use `agent-evaluation` and its baseline/variant/quality/trigger cases | Behavioral evidence and an explicit scored rubric |
| Teach Me Testing | Work from the learner's goal and current test stack; use small exercises with a stated rubric and observed answers | Learner feedback and an optional session summary |

Select only needed capabilities. Work may be performed here or through available native Arcwright Code / T3 Code tools, subject to host policy and capacity. Do not invent tool names, force model changes, or start a second tracker. Persist ongoing state only where project instructions designate it; test evidence may live in the existing implementation/test artifact folder.

## Evidence that supports a gate

- Read requirements and real tests before claiming coverage. Link to the assertion and the consumer it protects, not only a filename.
- Record the native test command, selection/config, executed test identities or summary, outcome, and any setup errors. Stale output, a generated file, or an agent's success statement alone does not prove this run executed the requested scope.
- For red mode, confirm that the intended assertion failed for the missing behavior. Import errors, service failures, and an empty selected suite are execution blockers, not successful red evidence.
- A changed configuration, omitted project, skipped test, mock-bypassed integration, or unexplained flaky result limits the verdict. Do not call a gate passed while required evidence is missing.
- Keep test review read-only unless changes are authorized. In generation, repair test setup/assertions as authorized; do not silently change product behavior or requirements to make the suite green.
- A source-backed waiver is distinct from proof. Report unmeasured NFRs and accepted coverage risks explicitly. These capabilities provide a recommendation; they do not authorize a release or deployment.

## Upstream compatibility

This is a content adapter for [TEA v3.1.0](https://github.com/bmad-code-org/bmad-method-test-architecture-enterprise/tree/1975c97eded60e562d0f63447707ec14a10688ed), not an installed TEA runtime. Its [README](https://github.com/bmad-code-org/bmad-method-test-architecture-enterprise/blob/1975c97eded60e562d0f63447707ec14a10688ed/README.md) publishes eight direct `bmad-tea-*` workflow skills, combines CI with Framework and red acceptance work with Automate, and requires the new `bmad` / `bmod-core-tools` setup plus `uv` and `_bmad/config.toml`.

BMAD v6.12.4 instead [pins the TEA module](https://github.com/bmad-code-org/BMAD-METHOD/blob/bab9082c3e884e0d72c759bcd1a6d90bcc01be84/bmad-modules.yaml#L65-L75) to **v1.27.2**, commit `d99ad29c62697c152e3393351406686d5bcd323c`. Neither upstream installer is Arcwright's installer. Do not copy the latest module over `_arcwright`, rename its new commands to pretend it is installed, add TOML/bootloaders, or overwrite personas/configuration. An explicit request for the real upstream runtime requires a separately scoped integration; continue ordinary authorized testing through this adapter.

Adapted from TEA commit `1975c97eded60e562d0f63447707ec14a10688ed` and BMAD commit `bab9082c3e884e0d72c759bcd1a6d90bcc01be84`, under their MIT [licenses](UPSTREAM-LICENSE). Arcwright supplies native tool discovery and its existing authorization, artifact, and tracker policies.
