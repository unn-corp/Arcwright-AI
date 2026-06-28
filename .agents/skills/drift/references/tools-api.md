# VibeDrift tools reference

Detailed reference for driving VibeDrift's in-loop checks. Distilled from upstream
`README.md` and `docs/tools-api.md` (MIT, see `../SOURCES.md`).

## CLI command surface

```
vibedrift [path]            Scan a project (default command)
vibedrift watch [path]      Re-scan on file changes (Pro)
vibedrift mcp               Run the MCP server (NOT used by this skill)
vibedrift login / logout    Account auth (only needed for --deep)
vibedrift status            Account, plan, and token
vibedrift hook <action>     Install or remove a git pre-push drift gate
vibedrift init              Wizard: write .vibedriftignore + .vibedrift/config.json
vibedrift ignore <glob>     Append a glob to .vibedriftignore
vibedrift doctor            Diagnose install, auth, and API
vibedrift update            Update to the latest version
```

Run everything through `npx -y @vibedrift/cli ...` if not installed globally.

### Scan flags

| Flag | Effect |
|------|--------|
| `--format <html\|terminal\|json\|csv\|docx>` | Output format. `html` is default; use `json` for agent parsing. |
| `--fail-on-score <n>` | Exit 1 if the Vibe Drift Score is below `n` (CI gate). |
| `--diff [ref]` | Scan only files changed in git (vs HEAD, or vs a ref/branch). |
| `--deep` | Cloud AI pass: semantic dup detection, name-vs-behavior intent, coherence report. Requires `vibedrift login`. |
| `--include` / `--exclude <glob>` | Filter scanned files (repeatable). |
| `--write-context` | Write committable `.vibedrift/` context files. |
| `--inject-context` | Inject a context summary into CLAUDE.md (managed block; pairs with `--write-context`). |
| `--local-only` | Skip every network call (fully offline; also disables telemetry + update check). |

## The five in-loop tools

Same engine, also importable as a plain API. `dimension` is one of:
`error_handling`, `imports`, `exports`, `async`, `naming`, `data_access`,
`logging`, `auth`.

| Function | Args | Returns |
|----------|------|---------|
| `getIntentHints` | `{ rootDir }` | declared conventions from CLAUDE.md / AGENTS.md / .cursorrules |
| `getDominantPattern` | `{ rootDir, dimension }` | the repo's majority pattern for a dimension + example files |
| `checkFileDrift` | `{ rootDir, filePath }` | whether a file fits the repo's patterns, with deviations |
| `findSimilarFunction` | `{ rootDir, body, deep? }` | existing functions that already do the same thing |
| `validateChange` | `{ rootDir, targetPath, body, deep? }` | whether a proposed function would drift or duplicate |

Every result carries a `status`: `ok` / `partial` / `stale` / `no_baseline` /
`degraded`. Tools never throw to signal "no data". On a fresh repo they return
`no_baseline` with a message to run `vibedrift` once. `deep: true` checks are
metered and degrade to `degraded` when offline/signed out, they never error.

### Import form (when no `tools` subcommand exists)

```ts
import { findSimilarFunction, validateChange } from "@vibedrift/cli/tools";

const rootDir = process.cwd();

const similar = await findSimilarFunction({ rootDir, body: proposedBody });
if (similar.found) {
  // reuse/extend similar.matches[0] instead of writing a third copy
}

const verdict = await validateChange({ rootDir, targetPath: "src/handlers/order.ts", body: proposedBody });
if (!verdict.ok) {
  // verdict.conflicts[] = new drift; verdict.duplicateOf[] = near-clones
}
```

Type declarations are not yet published (the build emits JS only); treat the
args/returns above as the contract. This is the same API the MCP server and the
Agent Skill use, so build new channels on it rather than re-implementing analysis.

## Environment variables

| Variable | Purpose |
|----------|---------|
| `VIBEDRIFT_TOKEN` | Bearer token for CI / non-interactive use |
| `VIBEDRIFT_API_URL` | Override the API base URL |
| `VIBEDRIFT_TELEMETRY_DISABLED` | Set to `1` to turn off the beacon and update check |
