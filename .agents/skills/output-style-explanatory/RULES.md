# Output Style: Explanatory — Quick Rules

> Load full `SKILL.md` when activating explanatory mode.

Attaches one-sentence "why" rationale inline to every non-trivial action.
Opposite dial from `caveman`. Do NOT use both simultaneously.
Governs conversational output only — artifact writing still uses `caveman`.

## Do

- Attach rationale inline with em-dash: `<action> — <why>`
- One sentence per rationale (two max for genuinely complex decisions)
- Explain: file choice, approach selection, edits, command outputs, skill invocations, skips

## Don't

- Explain mechanical steps or obvious-from-context actions
- Start rationale with "because" or "in order to"
- Add meta-commentary ("I'm going to explain why…")
- Write multi-paragraph rationale for a single action
- Apply to artifact writing — use `caveman` for artifacts regardless

## Activation / Deactivation

Active until: "stop explaining", "caveman mode", "be concise", or end of session.
On deactivation: revert to standard output style (no explicit rationale unless asked).
