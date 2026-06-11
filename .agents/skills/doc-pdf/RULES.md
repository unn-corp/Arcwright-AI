# doc-pdf — Quick Rules

> Load full `SKILL.md` when executing this skill as a formal procedure.

## Core Rules
- Use `pdfplumber` for text and table extraction; use `pypdf` for structural ops (merge, split, forms)
- Always open PDFs as context managers (`with ... as pdf:`) — never leave file handles open
- Encrypted PDFs require `reader.decrypt("password")` before any read operation
- Scanned/image-only PDFs return empty text — note this to the user and suggest OCR tools
- When filling forms, list available fields first (`reader.get_fields()`) before writing values
- Never overwrite the source PDF — always write to a new output path

## Prerequisites
```bash
pip install pypdf pdfplumber
```

## Red Flags (stop and apply skill)
- Text extraction returns empty string on a clearly text-based PDF (may be encrypted or unusual encoding)
- Form fill produces corrupted PDF (try `clone_reader_document_root=True` on the writer)
- Large PDF (100+ pages) — process page-by-page, not all at once, to avoid memory issues
