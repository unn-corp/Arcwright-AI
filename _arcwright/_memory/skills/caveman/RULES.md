# Caveman — Quick Rules

> Load full `SKILL.md` when writing a substantial artifact. This sidecar is the fast ref.

Concise-output discipline for any written artifact. Cuts ~65% of tokens, keeps all
technical substance. REQUIRED PRE-OUTPUT before writing specs/PRDs/briefs/reports/plans/
decision-logs/LEARNINGS.

## Do
- Drop articles, filler, pleasantries, hedging.
- Fragments OK. Short synonyms. `[thing] [action] [reason].`
- Default level **full** for internal artifacts; **lite** for user-facing docs.

## Never compress
- Code/inline-code, paths, commands, URLs, env vars
- API/function names, error strings (quote exact), IDs (FR-001, D-01)
- Dates, versions, numbers
- Markdown headings/list nesting/table structure/frontmatter

## Drop caveman → write normal
- Security warnings, destructive-action confirmations
- Ordered multi-step sequences where terseness risks misread
- Any spot where compression creates ambiguity
- User asks to clarify / repeats a question
Resume caveman after the critical part.

## Red flags (you drifted)
- Sentence opens with "Sure" / "I'd be happy to" / "Basically"
- Restating context already in the parent doc
- Multiple examples showing the same pattern
- A fact got dropped to save tokens — concise ≠ incomplete
