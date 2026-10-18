<!-- Conditional reference. The current SKILL.md and host policy take precedence. Paths are relative to this skill folder. -->

## Design notes that save you a rewrite

**One widget per tool.** Resist the urge to build one mega-widget that does everything. One tool → one focused widget → one clear result shape. the model reasons about these far better.

**Tool description must mention the widget.** the model only sees the tool description when deciding what to call. "Opens an interactive picker" in the description is what makes the model reach for it instead of guessing an ID.

**Widgets are optional at runtime.** Hosts that don't support the apps surface simply ignore `_meta.ui` and render the tool's text content normally. Since your tool handler already returns meaningful text/JSON (the widget's data), degradation is automatic — the model sees the data directly instead of via the widget.

**Don't block on widget results for read-only tools.** A widget that just *displays* data (chart, preview) shouldn't require a user action to complete. Return the display widget *and* a text summary in the same result so the model can continue reasoning without waiting.

**Layout-fork by item count, not by tool count.** If one use case is "show one result in detail" and another is "show many results side-by-side", don't make two tools — make one tool that accepts `items[]`, and let the widget pick a layout: `items.length === 1` → detail view, `> 1` → carousel. Keeps the server schema simple and lets the model decide count naturally.

**Put the model's reasoning in the payload.** A short `note` field on each item (why the model picked it) rendered as a callout on the card gives users the reasoning inline with the choice. Mention this field in the tool description so the model populates it.

**Normalize image shapes server-side.** If your data source returns images with wildly varying aspect ratios, rewrite to a predictable variant (e.g. square-bounded) *before* fetching for the data-URL inline. Then give the widget's image container a fixed `aspect-ratio` + `object-fit: contain` so everything sits centered.

**Follow host theme.** `app.getHostContext()?.theme` (after `connect()`) plus `app.onhostcontextchanged` for live updates. Toggle a `.dark` class on `<html>`, keep colors in CSS custom props with a `:root.dark {}` override block, set `color-scheme`. Disable `mix-blend-mode: multiply` in dark — it makes images vanish.

---
