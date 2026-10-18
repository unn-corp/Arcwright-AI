# Compatibility and recovery when contracts change

Apply this assessment only when the change affects public APIs, schemas, persisted configuration, stored data, or serialization formats. Use the repository's supported versions and compatibility policy; do not invent a requirement to support every historical client. An explicitly requested breaking change remains permitted within its authorized scope.

## Assess and demonstrate

- Identify affected readers, writers, clients, existing installations, and persisted values. Check consumers and migration paths in the repository rather than relying only on tests of fresh installations.
- Assess supported old/new combinations and upgrade ordering. Where relevant, check renamed or missing keys, response fields and types, defaults, partially migrated state, and whether old and new versions must coexist during an upgrade.
- Demonstrate the applicable acceptance criteria with representative fixtures or an isolated development/test environment. Add meaningful regression coverage for demonstrated gaps; avoid unrelated changes made solely to satisfy speculative compatibility concerns.
- For an intentional break, make the changed contract, required consumer/configuration updates, and deployment ordering clear in the appropriate project documentation or PR. A proposed break outside the requested scope needs a material user decision.

## Establish a realistic recovery path

Record what can be reversed, what requires restoration or a forward repair, and any prerequisites. A code revert does not necessarily restore altered or deleted data. If no safe rollback exists, state that limitation and the supported recovery approach rather than promising reversibility.

Assess recovery with fixtures or isolated test data where practical. Do not run production migrations, restore real backups, delete user data, deploy, or revert production to prove the plan without existing authorization, because assessment does not grant authority to execute those actions. Read-only assessment and ordinary scoped fixes do not require another approval.

Map required compatibility evidence to the outcome ledger. An unassessed applicable contract remains pending proof; an evidenced regression remains a substantive finding. Report material compatibility or recovery limitations without adding boilerplate to unrelated changes.
