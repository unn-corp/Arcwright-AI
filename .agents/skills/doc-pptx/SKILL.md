---
name: "doc-pptx"
description: "Use when reading or creating PowerPoint presentations (.pptx) — via python-pptx. Extract text from slides, add slides, set text/images/shapes, apply layouts."
allowed-tools: Bash, Read, Write
---

# doc-pptx Skill

Read and create `.pptx` PowerPoint files using `python-pptx`. No Microsoft Office required.

---

## Prerequisites

```bash
# Check
python3 -c "import pptx" 2>/dev/null && echo "ok"

# Install
pip install python-pptx
```

**Graceful degradation:** If missing → `pip install python-pptx`. If Python missing → report "Python 3 required".

---

## Read Presentation

```python
from pptx import Presentation

prs = Presentation("file.pptx")

# Iterate slides and extract text
for i, slide in enumerate(prs.slides):
    print(f"--- Slide {i+1} ---")
    for shape in slide.shapes:
        if shape.has_text_frame:
            for para in shape.text_frame.paragraphs:
                print(para.text)
```

### Extract all text (flat)

```python
def extract_text(path):
    prs = Presentation(path)
    lines = []
    for slide in prs.slides:
        for shape in slide.shapes:
            if shape.has_text_frame:
                lines.extend(p.text for p in shape.text_frame.paragraphs)
    return "\n".join(lines)
```

### Read tables in slides

```python
for slide in prs.slides:
    for shape in slide.shapes:
        if shape.has_table:
            table = shape.table
            for row in table.rows:
                cells = [cell.text for cell in row.cells]
                print(cells)
```

### Slide metadata

```python
print(f"Slides: {len(prs.slides)}")
print(f"Slide width: {prs.slide_width.inches:.1f}\"")
print(f"Slide height: {prs.slide_height.inches:.1f}\"")
```

---

## Create Presentation

```python
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor

prs = Presentation()

# Title slide (layout 0 = title slide)
slide_layout = prs.slide_layouts[0]
slide = prs.slides.add_slide(slide_layout)
title = slide.shapes.title
subtitle = slide.placeholders[1]
title.text = "My Presentation"
subtitle.text = "Subtitle text"

prs.save("output.pptx")
```

---

## Add Content Slide

```python
# Layout 1 = title + content
slide_layout = prs.slide_layouts[1]
slide = prs.slides.add_slide(slide_layout)
slide.shapes.title.text = "Key Points"

# Content placeholder
body = slide.placeholders[1]
tf = body.text_frame
tf.text = "First bullet"
p = tf.add_paragraph()
p.text = "Second bullet"
p.level = 1   # indent level
```

---

## Add Text Box

```python
from pptx.util import Inches, Pt

slide = prs.slides.add_slide(prs.slide_layouts[6])  # blank layout

txBox = slide.shapes.add_textbox(Inches(1), Inches(1), Inches(4), Inches(2))
tf = txBox.text_frame
tf.word_wrap = True

p = tf.paragraphs[0]
run = p.add_run()
run.text = "Custom text"
run.font.size = Pt(18)
run.font.bold = True
run.font.color.rgb = RGBColor(0x1F, 0x49, 0x7D)
```

---

## Add Image

```python
from pptx.util import Inches

slide = prs.slides.add_slide(prs.slide_layouts[6])
slide.shapes.add_picture("image.png", Inches(1), Inches(1), width=Inches(4))
```

---

## Add Shape

```python
from pptx.util import Inches, Pt
from pptx.enum.shapes import MSO_SHAPE_TYPE
from pptx.dml.color import RGBColor
from pptx.util import Emu

# Rectangle
shape = slide.shapes.add_shape(
    1,  # MSO_SHAPE_TYPE.RECTANGLE
    Inches(1), Inches(1), Inches(3), Inches(1.5)
)
shape.text = "Box label"
shape.fill.solid()
shape.fill.fore_color.rgb = RGBColor(0x4F, 0x81, 0xBD)
```

---

## Add Table

```python
from pptx.util import Inches

rows, cols = 3, 3
table = slide.shapes.add_table(rows, cols, Inches(1), Inches(2), Inches(8), Inches(3)).table

# Set column widths
table.columns[0].width = Inches(3)

# Fill cells
table.cell(0, 0).text = "Header 1"
table.cell(0, 1).text = "Header 2"

for r in range(1, rows):
    for c in range(cols):
        table.cell(r, c).text = f"R{r}C{c}"
```

---

## Slide Layouts Reference

| Index | Layout |
|-------|--------|
| 0 | Title Slide |
| 1 | Title and Content |
| 2 | Title and Two Content |
| 5 | Title Only |
| 6 | Blank |

> Layout indices vary by template. Inspect `prs.slide_layouts` for your specific file.

---

## Common Patterns

| Task | Method |
|------|--------|
| Open file | `Presentation("file.pptx")` |
| Add slide | `prs.slides.add_slide(layout)` |
| Set title | `slide.shapes.title.text = "..."` |
| Add text box | `slide.shapes.add_textbox(x, y, w, h)` |
| Add image | `slide.shapes.add_picture("img.png", x, y)` |
| Add table | `slide.shapes.add_table(rows, cols, x, y, w, h)` |
| Save | `prs.save("out.pptx")` |
| Units | `Inches(n)` or `Pt(n)` from `pptx.util` |
