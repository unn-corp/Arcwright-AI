# Professional Diagram Patterns

## Flowchart Color Coding
- Start/End: `#b2f2bb` (green) — ellipse
- Process/Action: `#a5d8ff` (blue) — rect with roundness
- Decision/Gate: `#ffec99` (yellow) — diamond
- Error/Critical: `#ffc9c9` (red) — diamond
- Review/PMR: `#d0bfff` (purple) — diamond
- QA/Teal: `#99e9f2` (teal) — rect
- Parallel: `#ffd8a8` (orange) — rect (wide)

## Swimlane Pattern
Use large rects with `backgroundColor: "transparent"` and `strokeStyle: "dashed"` for lanes.
Add lane headers at top. Horizontal arrows cross lane boundaries.

## Sequence Diagram Components
1. Actors: rounded rect, colored backgrounds
2. Lifelines: vertical dashed lines (`strokeStyle: "dashed"`, `strokeWidth: 1`)
3. Sync messages: solid arrows
4. Return messages: dashed arrows, `strokeColor: "#868e96"`
5. Spacing: 200px between participants, 50-80px between messages

## Architecture Layers (top to bottom)
- Presentation: `#a5d8ff`
- Business: `#b2f2bb`
- Data: `#d0bfff`

## Mind Map Sizing
| Level | Font | Shape | Stroke |
|-------|------|-------|--------|
| Center | 28-36 | 180x100 | 4 |
| Level 1 | 20-24 | 140x70 | 2 |
| Level 2 | 16-18 | 100x50 | 2 |

## Arrow Conventions
| Style | Meaning |
|-------|---------|
| Solid + arrow | Primary flow |
| Dashed + arrow | Response / async / optional path |
| Thick solid | Critical path |
| Color coded | Green=pass, Red=fail, Blue=normal |

## Loop-back Arrows (L-shaped)
Start from element left edge, go left (-50px), go up to target y, go right to target left edge.
```json
"x": shape_left_x, "y": shape_center_y,
"points": [[0,0], [-50,0], [-50, -(delta_y)], [0, -(delta_y)]]
```

## Roughness Guide
- `0` — clean, formal, technical
- `1` — artist (default, professional)
- `2` — sketchy, brainstorm feel
