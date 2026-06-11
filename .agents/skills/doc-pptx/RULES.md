# doc-pptx — Quick Rules

> Load full `SKILL.md` when executing this skill as a formal procedure.

## Core Rules
- Import is `from pptx import Presentation` (package name is `python-pptx`, module name is `pptx`)
- Always check `shape.has_text_frame` before accessing `shape.text_frame` — not all shapes have text
- Check `shape.has_table` before accessing `shape.table`
- Use `prs.slide_layouts[0]` (Title Slide) and `[1]` (Title+Content) for standard slides; `[6]` for blank
- All dimensions use `Inches(n)` or `Pt(n)` from `pptx.util` — never raw pixel values
- Placeholders are indexed: `slide.shapes.title` = title placeholder; `slide.placeholders[1]` = body
- Never overwrite the source file — save to a new path

## Prerequisites
```bash
pip install python-pptx
```

## Red Flags (stop and apply skill)
- `KeyError` on `slide.placeholders[1]` — some layouts have different placeholder indices; inspect `slide.placeholders` first
- Slide layout index out of range — template-specific; print `len(prs.slide_layouts)` and inspect available layouts
- Images not embedding — path must be an absolute or correct relative path to an existing file on disk
