# Conditional React research lenses

The entrypoint and host policy govern scope, source identity, ownership, and delegation. Replace <react-source> and <run-dir> with the actual owned paths. Six examples do not require six agents.

### Step 3: Agent Prompts

Use a relevant scoped lens only when research delegation is authorized; these are adaptable examples, not mandatory agents:

#### test-explorer
```
You are researching React's <TOPIC>.

CRITICAL: Do NOT rely on your prior knowledge about this API. Your training may contain outdated or incorrect patterns. Only report what you find in the source files.

Your task: Find test files in <react-source> that demonstrate <TOPIC> usage.

1. Search for test files: Glob for `**/__tests__/**/*<topic>*` and `**/__tests__/**/*.js` then grep for <topic>
2. For each relevant test file, extract:
   - The test description (describe/it blocks)
   - The actual usage code
   - Any assertions about behavior
   - Edge cases being tested
3. Report findings with exact file paths and line numbers

Format your output as:
## Test File: <path>
### Test: "<test description>"
```javascript
<exact code from test>
```
**Behavior:** <what the test asserts>
```

#### source-explorer
```
You are researching React's <TOPIC>.

CRITICAL: Do NOT rely on your prior knowledge about this API. Only report what you find in the source files.

Your task: Find warnings, errors, and implementation details for <TOPIC>.

1. Search <react-source>/packages/*/src/ for:
   - console.error mentions of <topic>
   - console.warn mentions of <topic>
   - Error messages mentioning <topic>
   - The main implementation file
2. For each warning/error, document:
   - The exact message text
   - The condition that triggers it
   - The source file and line number

Format your output as:
## Warnings & Errors
| Message | Trigger Condition | Source |
|---------|------------------|--------|
| "<exact message>" | <condition> | <file:line> |

## Implementation Notes
<key details from source code>
```

#### git-historian
```
You are researching React's <TOPIC>.

CRITICAL: Do NOT rely on your prior knowledge. Only report what you find in git history.

Your task: Find commit messages that explain <TOPIC> design decisions.

1. Run: cd <react-source> && git log --all --grep="<topic>" --oneline -50
2. For significant commits, read full message: git show <hash> --stat
3. Look for:
   - Initial introduction of the API
   - Bug fixes (reveal edge cases)
   - Behavior changes
   - Deprecation notices

Format your output as:
## Key Commits
### <short hash> - <subject>
**Date:** <date>
**Context:** <why this change was made>
**Impact:** <what behavior changed>
```

#### pr-researcher
```
You are researching React's <TOPIC>.

CRITICAL: Do NOT rely on your prior knowledge. Only report what you find in PRs.

Your task: Find PRs that introduced or modified <TOPIC>.

1. Run: gh pr list -R react/react --search "<topic>" --state all --limit 20 --json number,title,url
2. For promising PRs, read details: gh pr view <number> -R react/react
3. Look for:
   - The original RFC/motivation
   - Design discussions in comments
   - Alternative approaches considered
   - Breaking changes

Format your output as:
## Key PRs
### PR #<number>: <title>
**URL:** <url>
**Summary:** <what it introduced/changed>
**Design Rationale:** <why this approach>
**Discussion Highlights:** <key points from comments>
```

#### issue-hunter
```
You are researching React's <TOPIC>.

CRITICAL: Do NOT rely on your prior knowledge. Only report what you find in issues.

Your task: Find issues that reveal common confusion about <TOPIC>.

1. Search react/react: gh issue list -R react/react --search "<topic>" --state all --limit 20 --json number,title,url
2. Search reactjs/react.dev: gh issue list -R reactjs/react.dev --search "<topic>" --state all --limit 20 --json number,title,url
3. For each issue, identify:
   - What the user was confused about
   - What the resolution was
   - Any gotchas revealed

Format your output as:
## Common Confusion
### Issue #<number>: <title>
**Repo:** <react/react or reactjs/react.dev>
**Confusion:** <what they misunderstood>
**Resolution:** <correct understanding>
**Gotcha:** <if applicable>
```

#### types-inspector
```
You are researching React's <TOPIC>.

CRITICAL: Do NOT rely on your prior knowledge. Only report what you find in type definitions.

Your task: Find and compare Flow and TypeScript type signatures for <TOPIC>.

1. Flow types (source of truth): Search <react-source>/packages/*/src/*.js for @flow annotations related to <topic>
2. TypeScript types: Search <react-source>/packages/*/index.d.ts and @types/react
3. Compare and note any discrepancies

Format your output as:
## Flow Types (Source of Truth)
**File:** <path>
```flow
<exact type definition>
```

## TypeScript Types
**File:** <path>
```typescript
<exact type definition>
```

## Discrepancies
<any differences between Flow and TS definitions>
```

### Step 4: Synthesize Results

Combine the relevant completed research lenses into the requested result; record unavailable evidence without requiring extra agents.

**DO NOT add information from your own knowledge.** Only include what agents found in sources.

### Step 5: Save Output

Write the final document to `<run-dir>/<topic>.md`

Replace spaces in topic with hyphens (e.g., "suspense boundaries" → "suspense-boundaries.md")

## Output Document Template

```markdown
# React Research: <topic>

> Research date: YYYY-MM-DD
> Sources: React repo (commit <hash>), N PRs, M issues

## Summary

[Brief summary based SOLELY on source findings, not prior knowledge]

## API Signature

### Flow Types (Source of Truth)

[From types-inspector agent]

### TypeScript Types

[From types-inspector agent]

### Discrepancies

[Any differences between Flow and TS]

## Usage Examples

### From Tests

[From test-explorer agent - with file:line references]

### From PRs/Issues

[Real-world patterns from discussions]

## Caveats & Gotchas

[Each with source link]

- **<gotcha>** - Source: <link>

## Warnings & Errors

| Message | Trigger Condition | Source File |
|---------|------------------|-------------|
[From source-explorer agent]

## Common Confusion

[From issue-hunter agent]

## Design Decisions

[From git-historian and pr-researcher agents]

## Source Links

### Commits
- <hash>: <description>

### Pull Requests
- PR #<number>: <title> - <url>

### Issues
- Issue #<number>: <title> - <url>
```

## Common Mistakes to Avoid

1. **Trusting prior knowledge** - If you "know" something about the API, find the source evidence anyway
2. **Generating example code** - Every code example must come from an actual source file
3. **Missing evidence** - Select the lenses needed for the question; do not imply an unchecked perspective was verified
4. **Summarizing without sources** - Every claim needs a file:line or PR/issue reference
5. **Using web search** - No Stack Overflow, no blog posts, no social media

## Verification Checklist

Before finalizing the research document:

- [ ] React repo is at `<react-source>` with known commit hash
- [ ] Relevant selected lenses are complete or their limits are stated; any delegation was authorized and host-compatible
- [ ] Every code example has a source file reference
- [ ] Warnings/errors table has source locations
- [ ] No claims made without source evidence
- [ ] Discrepancies between Flow/TS types documented
- [ ] Source links section is complete

Adapted from [React's research skill](https://github.com/reactjs/react.dev/blob/046f17d04295ba047bb5739026b4ac3110f17028/.claude/skills/react-expert/SKILL.md), with Arcwright invocation and output conventions. See [upstream documentation license](../LICENSE-DOCS.md).
