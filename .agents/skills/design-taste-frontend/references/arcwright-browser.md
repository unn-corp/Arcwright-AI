# Arcwright browser and evidence procedure

Use native Arcwright Code/T3 Code tools when exposed. Tool identifiers may have a
harness prefix such as `mcp__t3_code__`; discover the callable names.

1. Call `preview_status`. If there is no automation-capable tab, call `preview_open`
   before concluding that preview is unavailable. For a new tab, retain `tabId` and
   use it on subsequent calls. Use the project's dev server URL with `preview_navigate`.
2. Inspect `preview_snapshot`. Read a human-owned tab with snapshots; open your own
   tab before resizing, evaluating, or interacting. Operate only on your own tab or
   an unclaimed user tab.
3. Use `preview_resize` with `mode:"freeform"`, widths 1440, 768, and 390, and heights
   900, 1024, and 844 respectively. Capture a snapshot and inspect the actual image
   at every width. Scroll through the whole page and exercise its real controls.
   Check keyboard focus, content visibility, overflow, reduced motion, and asset loading.
4. Use `preview_evaluate` on a tab you may control for DOM measurements. The exported
   `probe` and `frame` functions in `../scripts/lib/probe.mjs` are self-contained
   in-page functions. Read and serialize their function bodies if useful; run
   `judge` from `../scripts/lib/rules.mjs` on returned probe metrics in Node. Capture
   only needed metrics so tool payload limits do not truncate evidence. A native
   snapshot or one probe does not establish that the standalone inspector's motion
   sampling or all scrolling checks passed.
5. Native `preview_snapshot` with `save:true` writes screenshots to host evidence
   storage. Before saving other temporary evidence, call `t3_evidence_directory`
   when exposed and use its returned path. Keep report notes and links to that
   evidence under the project's Arcwright run; do not duplicate private captures
   into installed skills or package source. Host retention applies to these files.
6. Critique the screenshots using `critique.md`, fix the top three substantive
   issues, and repeat for at most three rounds. Record the viewports actually seen,
   checks performed, exceptions, and remaining issues.

Use the bundled standalone `inspect.mjs` only when native preview tools are absent,
`preview_open` explicitly reports unsupported/unavailable, or two corrected calls
fail at the same step. Report the raw error when switching. If the user explicitly
requests the standalone inspector, follow that request. Node 22+ and an installed
Chrome, Edge, or Chromium are prerequisites; `CHROME_PATH` can name the executable.
It never installs a browser or uses the user's live browser profile.

Standalone output defaults to the Arcwright run's `inspect/` directory. When the
host evidence allocator is available, pass its returned directory as
`--evidence-dir <directory>` for image captures; reports and browser profiles still
stay in the Arcwright run. Otherwise images also stay in that run. Missing browser
prerequisites do not justify claiming a visual check; run available source checks
and report the limitation.
