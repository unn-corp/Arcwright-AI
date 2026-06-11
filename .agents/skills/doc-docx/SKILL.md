---
name: "doc-docx"
description: "Use when reading, creating, or editing Word documents (.docx) — via python-docx. Extract text/tables, insert paragraphs, apply styles, add images."
allowed-tools: Bash, Read, Write
---

# doc-docx Skill

Read, create, and edit `.docx` Word files using `python-docx`. No Microsoft Office required.

---

## Prerequisites

```bash
# Check
python3 -c "import docx" 2>/dev/null && echo "ok"

# Install
pip install python-docx
```

**Graceful degradation:** If missing → `pip install python-docx`. If Python missing → report "Python 3 required".

---

## Read Document

```python
from docx import Document

doc = Document("file.docx")

# All paragraphs
for para in doc.paragraphs:
    print(para.text)

# Paragraphs by style
for para in doc.paragraphs:
    if para.style.name == "Heading 1":
        print(para.text)
```

### Read Tables

```python
for table in doc.tables:
    for row in table.rows:
        cells = [cell.text for cell in row.cells]
        print(cells)
```

### Read all text (including tables)

```python
def get_all_text(doc):
    text = []
    for para in doc.paragraphs:
        text.append(para.text)
    for table in doc.tables:
        for row in table.rows:
            for cell in row.cells:
                text.append(cell.text)
    return "\n".join(text)

doc = Document("file.docx")
print(get_all_text(doc))
```

---

## Create Document

```python
from docx import Document
from docx.shared import Pt, RGBColor

doc = Document()

# Heading
doc.add_heading("My Report", level=1)

# Paragraph
doc.add_paragraph("First paragraph text.")

# Bold/italic run
para = doc.add_paragraph()
run = para.add_run("Bold text")
run.bold = True
run2 = para.add_run(" and normal text.")

# Font size and color
run.font.size = Pt(14)
run.font.color.rgb = RGBColor(0x1F, 0x49, 0x7D)

doc.save("output.docx")
```

---

## Edit Existing Document

```python
from docx import Document

doc = Document("file.docx")

# Edit first paragraph
doc.paragraphs[0].text = "Updated text"

# Find and replace text across all paragraphs
for para in doc.paragraphs:
    if "old phrase" in para.text:
        for run in para.runs:
            run.text = run.text.replace("old phrase", "new phrase")

doc.save("file_edited.docx")
```

---

## Add Table

```python
from docx import Document

doc = Document()

table = doc.add_table(rows=3, cols=3)
table.style = "Table Grid"

# Set header row
header = table.rows[0].cells
header[0].text = "Name"
header[1].text = "Score"
header[2].text = "Grade"

# Data rows
data = [("Alice", "95", "A"), ("Bob", "82", "B")]
for i, (name, score, grade) in enumerate(data, start=1):
    row = table.rows[i].cells
    row[0].text = name
    row[1].text = score
    row[2].text = grade

doc.save("table.docx")
```

---

## Add Image

```python
from docx import Document
from docx.shared import Inches

doc = Document()
doc.add_picture("photo.png", width=Inches(4))
doc.save("with_image.docx")
```

---

## Page Breaks and Sections

```python
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

# Add page break
doc.add_page_break()

# Add section break (next page)
para = doc.add_paragraph()
run = para.add_run()
br = OxmlElement("w:br")
br.set(qn("w:type"), "page")
run._r.append(br)
```

---

## Document Properties / Metadata

```python
from docx import Document

doc = Document("file.docx")
core = doc.core_properties
print(core.title, core.author, core.created)

# Set
core.title = "New Title"
core.author = "Agent"
doc.save("file.docx")
```

---

## Common Patterns

| Task | Method |
|------|--------|
| Read text | `para.text` for each in `doc.paragraphs` |
| Read tables | `table.rows[i].cells[j].text` |
| Add heading | `doc.add_heading("...", level=1)` |
| Add paragraph | `doc.add_paragraph("...")` |
| Bold/italic | `run.bold = True` / `run.italic = True` |
| Font size | `run.font.size = Pt(12)` |
| Add table | `doc.add_table(rows=N, cols=M)` |
| Add image | `doc.add_picture("path", width=Inches(N))` |
| Save | `doc.save("out.docx")` |
