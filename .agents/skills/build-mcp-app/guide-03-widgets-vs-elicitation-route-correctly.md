<!-- Conditional reference. The current SKILL.md and host policy take precedence. Paths are relative to this skill folder. -->

## Widgets vs Elicitation — route correctly

Before building a widget, check if **elicitation** covers it. Elicitation is spec-native, zero UI code, works in any compliant host.

| Need | Elicitation | Widget |
|---|---|---|
| Confirm yes/no | ✅ | overkill |
| Pick from short enum | ✅ | overkill |
| Fill a flat form (name, email, date) | ✅ | overkill |
| Pick from a large/searchable list | ❌ (no scroll/search) | ✅ |
| Visual preview before choosing | ❌ | ✅ |
| Chart / map / diff view | ❌ | ✅ |
| Live-updating progress | ❌ | ✅ |

If elicitation covers it, use it. See `../build-mcp-server/references/elicitation.md`.

---
