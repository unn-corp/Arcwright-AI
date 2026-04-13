---
name: excalidraw
description: Use when creating hand-drawn style diagrams, workflow maps, architecture diagrams, flowcharts, mind maps, or any visual diagram output in Excalidraw JSON format (.excalidraw files)
---

# Excalidraw Diagram Creation Skill

## Core Structure

Excalidraw files are JSON with `"type": "excalidraw"`, `"version": 2`, plus `elements`, `appState`, and `files` arrays.

## Primary Element Types

`rectangle`, `ellipse`, `diamond`, `text`, `arrow`, `line`, `freedraw`, `image`, `frame`

Every element requires: `type`, `id`, `x`, `y`, `width`, `height`, `angle`, `strokeColor`, `backgroundColor`, `fillStyle`, `strokeWidth`, `strokeStyle`, `roughness`, `opacity`, `seed`, `version`, `versionNonce`, `isDeleted`, `groupIds`, `boundElements`, `link`, `locked`

## Key Styling

- `fillStyle`: `"solid"`, `"hachure"`, `"cross-hatch"`
- `strokeWidth`: `1` (thin), `2` (medium), `4` (bold)
- `strokeStyle`: `"solid"`, `"dashed"`, `"dotted"`
- `roughness`: `0` (clean), `1` (artist), `2` (sketchy)
- `roundness`: `{ "type": 3 }` for rounded corners, `null` for sharp

## Arrows & Bindings

```json
{
  "type": "arrow",
  "points": [[0, 0], [200, 0]],
  "startArrowhead": null,
  "endArrowhead": "arrow",
  "startBinding": { "elementId": "rect-1", "focus": 0, "gap": 5 },
  "endBinding": { "elementId": "rect-2", "focus": 0, "gap": 5 }
}
```

Bound shapes need `"boundElements": [{ "id": "arrow-id", "type": "arrow" }]`

## Text Inside Shapes

```json
// Shape:
{ "id": "box1", "boundElements": [{ "id": "lbl1", "type": "text" }] }
// Text:
{ "id": "lbl1", "type": "text", "containerId": "box1", "verticalAlign": "middle", "textAlign": "center" }
```

## Color Palette (Professional)

| Purpose | Color |
|---------|-------|
| Start/End | `#b2f2bb` |
| Process/Action | `#a5d8ff` |
| Decision | `#ffec99` |
| Error/Critical | `#ffc9c9` |
| Review/Gate | `#d0bfff` |
| Neutral/Background | `#e9ecef` |

## Diagram Type Quick Reference

| Type | Shapes | Direction |
|------|--------|-----------|
| Flowchart | rect + diamond | Top→Bottom |
| Architecture | rect layers | Top→Bottom |
| Mind Map | ellipse + lines | Center→Out |
| Sequence | rect + lifelines | Left→Right |

## Full Reference Files

- `diagram-patterns.md` — swimlanes, sequence, architecture patterns
- `examples.md` — working JSON templates
- `element-reference.md` — complete property specifications

## Output

Always write the final diagram to a `.excalidraw` file. User can open it directly at excalidraw.com or in the desktop app.
