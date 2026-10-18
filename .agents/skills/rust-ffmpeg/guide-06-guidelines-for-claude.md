<!-- Conditional reference. The current SKILL.md and host policy take precedence. Paths are relative to this skill folder. -->

## Implementation workflow

When this skill activates, follow this workflow:

**For implementation tasks:**
1. **Identify task** — Determine: video/audio/streaming/inspection? Simple or complex?
2. **Select library** — Apply Layer 3 decision logic. State which library and why in one sentence
3. **Load references** — Follow Layer 2 scenario detection to load the right reference files
4. **Generate code** — Production-ready: proper error handling, `Result<>` return types, no `unwrap()` in library code
5. **Explain briefly** — One-line summary of approach before the code block. No lengthy tutorials
6. **Suggest next steps** — If applicable: performance optimization, hardware acceleration, or testing

**For evaluation/migration/selection tasks:**
1. **Load selection guide** — Load `library_selection.md` and relevant scenario references
2. **Assess requirements** — Identify constraints: async needs, frame-level access, install limitations, existing code patterns
3. **Compare options** — Apply Layer 3 decision logic against the specific use case
4. **Give verdict** — Clear feasibility conclusion with rationale. If migration is possible, show key API differences. If not, explain why and recommend the alternative

**Rules**:
- Follow Layer 3 decision logic to select the library
- Always add `Cargo.toml` dependencies when introducing a new library
- Use async when the user's context is async (tokio/actix/axum)
- If the user's need is ambiguous between libraries, ask — don't guess
- For complex pipelines, break into steps with comments, not monolithic blocks
