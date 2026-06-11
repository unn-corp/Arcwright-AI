# doc-docx — Quick Rules

> Load full `SKILL.md` when executing this skill as a formal procedure.

## Core Rules
- Import is `from docx import Document` (package name is `python-docx`, module name is `docx`)
- Always open with `Document("path.docx")` — not a context manager (python-docx handles file close internally)
- Never overwrite the source file — save to a new path or a clearly named output file
- Use `para.runs` for fine-grained text editing; `para.text = "..."` replaces the whole paragraph but loses run formatting
- When reading, iterate `doc.paragraphs` for body text and `doc.tables` for tabular data separately
- Images require an existing file on disk — cannot embed raw bytes directly via the basic API
- Table cells can contain paragraphs — use `cell.paragraphs[0].text` not just `cell.text` for precise access

## Prerequisites
```bash
pip install python-docx
```

## Red Flags (stop and apply skill)
- `ModuleNotFoundError: No module named 'docx'` — package is `python-docx`, not `docx`
- Setting `para.text` erases bold/italic runs — use `run.text` replacement instead
- Merged table cells produce duplicate text when iterating `row.cells` — deduplicate by cell ID
