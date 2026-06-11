---
name: "doc-pdf"
description: "Use when reading text/tables from PDFs, filling PDF forms, or merging/splitting PDF files — via pypdf and pdfplumber."
allowed-tools: Bash, Read, Write
---

# doc-pdf Skill

Read, fill, merge, and split PDF files using `pypdf` and `pdfplumber`. CLI-driven via Python scripts.

---

## Prerequisites

```bash
# Check
python3 -c "import pypdf, pdfplumber" 2>/dev/null && echo "ok"

# Install
pip install pypdf pdfplumber
```

**Graceful degradation:** If Python is missing → report "Python 3 required". If libs are missing → run the install command above before proceeding.

---

## Read Text

```python
import pdfplumber

with pdfplumber.open("file.pdf") as pdf:
    for page in pdf.pages:
        print(page.extract_text())
```

### Extract tables

```python
with pdfplumber.open("file.pdf") as pdf:
    for page in pdf.pages:
        tables = page.extract_tables()
        for table in tables:
            for row in table:
                print(row)
```

### Read specific pages

```python
with pdfplumber.open("file.pdf") as pdf:
    text = pdf.pages[0].extract_text()   # page 1
    text2 = pdf.pages[-1].extract_text() # last page
```

---

## Merge PDFs

```python
from pypdf import PdfWriter

writer = PdfWriter()
for path in ["a.pdf", "b.pdf", "c.pdf"]:
    writer.append(path)

with open("merged.pdf", "wb") as f:
    writer.write(f)
```

---

## Split PDF

```python
from pypdf import PdfReader, PdfWriter

reader = PdfReader("file.pdf")

for i, page in enumerate(reader.pages):
    writer = PdfWriter()
    writer.add_page(page)
    with open(f"page_{i+1}.pdf", "wb") as f:
        writer.write(f)
```

### Extract page range

```python
from pypdf import PdfReader, PdfWriter

reader = PdfReader("file.pdf")
writer = PdfWriter()

for page in reader.pages[2:5]:   # pages 3–5 (0-indexed)
    writer.add_page(page)

with open("extract.pdf", "wb") as f:
    writer.write(f)
```

---

## Fill PDF Forms (AcroForms)

```python
from pypdf import PdfReader, PdfWriter

reader = PdfReader("form.pdf")
writer = PdfWriter()
writer.append(reader)

# List available fields
fields = reader.get_fields()
print(list(fields.keys()))

# Fill fields
writer.update_page_form_field_values(
    writer.pages[0],
    {"FieldName": "Value", "OtherField": "Other"}
)

with open("filled.pdf", "wb") as f:
    writer.write(f)
```

---

## PDF Metadata

```python
from pypdf import PdfReader

reader = PdfReader("file.pdf")
meta = reader.metadata
print(meta.title, meta.author, meta.subject)
print(f"Pages: {len(reader.pages)}")
```

---

## Common Patterns

| Task | Tool | Method |
|------|------|--------|
| Extract text | `pdfplumber` | `page.extract_text()` |
| Extract tables | `pdfplumber` | `page.extract_tables()` |
| Merge | `pypdf.PdfWriter` | `.append()` |
| Split | `pypdf.PdfReader` + `PdfWriter` | iterate `reader.pages` |
| Fill form | `pypdf.PdfWriter` | `.update_page_form_field_values()` |
| Read metadata | `pypdf.PdfReader` | `.metadata` |

---

## Notes

- `pdfplumber` is better for text/table extraction (uses `pdfminer` under the hood).
- `pypdf` is better for structural operations: merge, split, rotate, encrypt, form-fill.
- Encrypted PDFs: `reader.decrypt("password")` before reading.
- Scanned PDFs (image-only): text extraction returns empty — OCR (e.g., `pytesseract`) is required.
