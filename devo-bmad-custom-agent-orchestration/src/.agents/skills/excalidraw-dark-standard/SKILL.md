---
name: excalidraw-dark-standard
description: Squid-Master dark mode Excalidraw design standard — colors, shapes, typography, spacing, and naming convention for all system diagrams
version: 1.0.0
author: bmad
tags: [diagrams, excalidraw, design-system, dark-mode, visualization]
---

# Excalidraw Dark Mode Design Standard

## Overview

All Squid-Master Excalidraw diagrams follow this standard. Load this skill before creating or editing any `.excalidraw` file. It defines the full visual language: canvas setup, semantic colors, shape vocabulary, typography, spacing, and file naming.

Use the `excalidraw-diagram-generator` skill alongside this one — it provides the JSON generation engine. This skill provides the Squid-Master color and structure rules that override its defaults.

---

## Canvas Setup

Every diagram MUST start with a massive background rectangle as the **first element** in the `elements` array:

```json
{
  "type": "rectangle",
  "x": -5000,
  "y": -5000,
  "width": 10000,
  "height": 10000,
  "backgroundColor": "#1e1e2e",
  "strokeColor": "#1e1e2e",
  "fillStyle": "solid",
  "strokeWidth": 1,
  "roughness": 0,
  "opacity": 100
}
```

Excalidraw `appState`:
```json
{
  "theme": "dark",
  "viewBackgroundColor": "#1e1e2e",
  "gridSize": null,
  "exportWithDarkMode": true
}
```

---

## Color Palette

### Background Colors

| Token | Hex | Use |
|---|---|---|
| `canvas-bg` | `#1e1e2e` | Canvas background fill rect + appState |
| `deep-bg` | `#0f0f1a` | Section separators, nested container interiors |
| `subtle-border` | `#2a2a3e` | Card outlines, frame borders, dividers |

### Element Fill Colors (semantic)

| Token | Hex | Use |
|---|---|---|
| `fill-agent` | `#1e3a5f` | Agent nodes — primary actors in a workflow |
| `fill-skill` | `#1a4d2e` | Skill nodes — tools loaded by agents |
| `fill-orchestrator` | `#2d1b69` | Orchestrator / gate / coordinator nodes |
| `fill-error` | `#4a2020` | Halt, error, escalation states |
| `fill-loop` | `#3d2a00` | Loop counters, retry logic, autonomous pass steps |
| `fill-user` | `#1a3040` | User approval gates, human-in-the-loop steps |
| `fill-annotation` | `#252525` | Notes, metadata, file path labels |
| `fill-track` | transparent | Track / group container — use stroke only |

### Stroke / Accent Colors

| Token | Hex | Use |
|---|---|---|
| `stroke-agent` | `#4a9eed` | Agent borders, primary data-flow arrows |
| `stroke-skill` | `#22c55e` | Skill borders, pass badges |
| `stroke-orchestrator` | `#a78bfa` | Gate borders, concurrent group frames |
| `stroke-error` | `#f87171` | Halt borders, error states |
| `stroke-loop` | `#fbbf24` | Loop borders, retry/warning states |
| `stroke-user` | `#38bdf8` | User action borders |
| `stroke-track` | `#7dd3fc` | Track/section frame borders (dashed) |
| `text-primary` | `#e5e5e5` | All node labels |
| `text-muted` | `#888888` | Annotations, metadata, sublabels |

---

## Shape Vocabulary

### Rectangle — Agent
```
fill: #1e3a5f  ·  stroke: #4a9eed  ·  strokeWidth: 2  ·  borderRadius: 6
size: 180×60px (standard)  ·  240×60px (wide, for orchestrators)
```
Use for: every named agent (`architect-agent`, `security-agent`, `dev-agent`, etc.)

### Rectangle — Skill
```
fill: #1a4d2e  ·  stroke: #22c55e  ·  strokeWidth: 2  ·  borderRadius: 6
size: 180×50px
```
Use for: skills loaded by an agent (`clean-code-standards`, `security-review`, `ui-ux-pro-custom`)

### Rectangle — Orchestrator / Gate
```
fill: #2d1b69  ·  stroke: #a78bfa  ·  strokeWidth: 2  ·  borderRadius: 6
size: 240×60px
```
Use for: `review-orchestrator`, gate labels, coordination hubs

### Rectangle — Halt / Error
```
fill: #4a2020  ·  stroke: #f87171  ·  strokeWidth: 2  ·  borderRadius: 6
```
Use for: `🛑 HALT`, escalation exits, max-loop failure states

### Rectangle — Loop / Step
```
fill: #3d2a00  ·  stroke: #fbbf24  ·  strokeWidth: 2  ·  borderRadius: 6
```
Use for: loop pass counters (`Pass N of max`), retry steps, autonomous repeat nodes

### Ellipse — User Action
```
fill: #1a3040  ·  stroke: #38bdf8  ·  strokeWidth: 2
size: 160×60px
```
Use for: `👤 USER APPROVAL`, human confirmation gates

### Diamond — Decision
```
fill: #2d1b69  ·  stroke: #a78bfa  ·  strokeWidth: 2
size: 120×80px
```
Use for: `passed / needs_fixes`, `loop count?`, `halt or continue?`, branch points

### Frame / Group (dashed container)
```
fill: transparent  ·  stroke: #a78bfa  ·  strokeStyle: dashed  ·  strokeWidth: 1
```
Use for: concurrent sub-agent groups, track boundaries, review gate containers. Label in top-left corner at `text-muted`.

### Note / Annotation
```
fill: #252525  ·  stroke: #555555  ·  strokeStyle: dashed  ·  strokeWidth: 1  ·  borderRadius: 4
```
Use for: file path labels (`dry-review-findings-{artifact_id}.md`), session state fields, context metadata

### Arrow — Data / Control Flow
```
stroke: #4a9eed  ·  strokeWidth: 2  ·  endArrowhead: arrow
```
- **Solid** — primary control or data flow
- **Dashed** (`strokeStyle: dashed`) — optional, conditional, or fallback paths
- Label arrows with `text-muted` (12px) when the relationship needs clarification

---

## Typography

**Rule:** All text uses `fontFamily: 5` (Nunito). No exceptions.

| Role | Size | Weight | Color |
|---|---|---|---|
| Diagram title | 24px | 700 | `#a78bfa` |
| Section / track label | 18px | 600 | `#7dd3fc` |
| Node label (primary) | 14px | 600 | `#e5e5e5` |
| Node sublabel | 12px | 400 | `#aaaaaa` |
| Annotation / metadata | 11px | 400 | `#666666` |
| Arrow label | 12px | 400 | `#888888` |

In Excalidraw JSON:
```json
{
  "type": "text",
  "text": "architect-agent",
  "fontSize": 14,
  "fontFamily": 5,
  "textAlign": "center",
  "verticalAlign": "middle",
  "strokeColor": "#e5e5e5"
}
```

---

## Spacing Rules

| Property | Value | Notes |
|---|---|---|
| Horizontal gap between siblings | 200–300px | Node edge to node edge |
| Vertical gap between rows | 100–150px | Node edge to node edge |
| Standard node size | 180×60px | Agents, skills, steps |
| Wide node size | 240×60px | Orchestrators, gates |
| Frame padding | 40px | Inset from outermost child node |
| Group label offset | 8px from top-left corner | Inside frame, above first child |
| Stroke width (nodes) | 2px | 1px for annotations |
| Border radius | 6px | All rectangles |
| Arrow strokeWidth | 2px | |

---

## Status Badge Labels (inline in diagram)

Add small rounded-rectangle badges next to verdict outputs:

| Badge | Fill | Stroke | Text |
|---|---|---|---|
| `✅ passed` | `#1a4d2e` | `#22c55e` | `#22c55e` |
| `❌ needs_fixes` | `#4a2020` | `#f87171` | `#f87171` |
| `🔁 LOOP` | `#3d2a00` | `#fbbf24` | `#fbbf24` |
| `🛑 HALT` | `#4a2020` | `#f87171` | `#f87171` |
| `🟣 CONCURRENT` | `#2d1b69` | `#a78bfa` | `#a78bfa` |
| `👤 USER APPROVAL` | `#1a3040` | `#38bdf8` | `#38bdf8` |

Badge size: auto-width × 24px, font 11px, border-radius 12px.

---

## File Naming Convention

```
{scope}-{subject}[-{variant}].excalidraw
```

### Scopes

| Prefix | Use |
|---|---|
| `sm-` | Squid-Master system diagrams |
| `sq-` | Squidhub platform diagrams |
| `bd-` | BMAD agent framework diagrams |
| `feat-` | Feature-specific diagrams |

### Standard Diagram Names

| Diagram | Filename |
|---|---|
| All tracks overview | `sm-tracks-overview.excalidraw` |
| Agent + skills flow | `sm-agents-skills.excalidraw` |
| All workflows overview | `sm-workflows-overview.excalidraw` |
| instructions.md visual map | `sm-instructions-map.excalidraw` |
| Review track detail | `sm-review-track.excalidraw` |

### Storage

- **New diagrams:** `_bmad-output/diagrams/`
- **Legacy / archived:** `_bmad-output/diagrams/artifacts/`

---

## Diagram Structure Checklist

Before writing any `.excalidraw` file:

1. [ ] Background rect is first element — `#1e1e2e`, 10000×10000, x/y −5000
2. [ ] `appState.theme = "dark"`, `viewBackgroundColor = "#1e1e2e"`
3. [ ] All text uses `fontFamily: 5`
4. [ ] Every node fill and stroke matches semantic color table
5. [ ] Spacing: 200–300px horizontal, 100–150px vertical
6. [ ] Concurrent groups wrapped in dashed `#a78bfa` frame
7. [ ] Diagram title present (24px, `#a78bfa`, top-left)
8. [ ] Section labels present for multi-section diagrams
9. [ ] Filename follows `{scope}-{subject}.excalidraw` convention
10. [ ] Saved to `_bmad-output/diagrams/` (not `artifacts/`)

---

## How to Use This Skill with excalidraw-diagram-generator

1. Load this skill (`excalidraw-dark-standard`) — establishes color/shape rules
2. Load `excalidraw-diagram-generator` — provides JSON structure and generation patterns
3. Describe the diagram content in terms of the shape vocabulary above
4. Generate elements array using generator's patterns, applying THIS skill's colors
5. Always prepend the background rect before all other elements
6. Write output to `_bmad-output/diagrams/{filename}.excalidraw`

---

_v1.0 — 2026-03-14_
