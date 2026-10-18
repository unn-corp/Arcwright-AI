# Recommended Frontend MCPs

Optional MCP servers that raise the quality ceiling for frontend work. None are bundled by Arcwright — install them yourself if you want them.

---

## shadcn MCP

Pre-built, functional, accessible UI components — buttons, menus, pricing sections, data tables, and more. Reach for this when you need standard UI primitives and don't want to hand-roll them from scratch. Saves time and produces accessible markup by default.

**When to use:** Any project that needs a standard component library fast and isn't already on a component framework.

---

## Magic MCP (21st.dev)

Natural-language → custom section code. Describe a bespoke section ("hero with animated gradient and trust badges") and it generates the implementation. Best for one-off custom layouts where shadcn doesn't have a ready primitive.

**When to use:** Bespoke marketing sections, landing pages, or custom UI patterns that fall outside standard component libraries.

---

## Chrome DevTools MCP

Browser-based visual testing and debugging. Connects to a running Chrome instance for live DOM inspection, style overrides, and screenshot capture — useful for visual self-correction loops directly in the browser.

**When to use:** If you prefer browser-native DevTools inspection over CLI-based screenshot diffing.

**Note:** The `visual-feedback-loop` skill (`.agents/skills/visual-feedback-loop/SKILL.md`) already provides a render-and-self-correct capability using `playwright-cli`. Chrome DevTools MCP is an alternative for users who prefer the browser-side workflow — pick one, not both.

---

## Installation

Each MCP is user-installed. Follow the provider's setup docs and register the server through the selected host's documented MCP configuration. Preserve existing settings and verify the actual registration schema.
