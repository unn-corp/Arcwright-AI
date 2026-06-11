# doc-xlsx — Quick Rules

> Load full `SKILL.md` when executing this skill as a formal procedure.

## Core Rules
- `openpyxl` supports `.xlsx`/`.xlsm` only — for `.xls` (Excel 97-2003) use `xlrd` to read
- Use `load_workbook("file.xlsx")` to open existing files; `Workbook()` to create new
- Use `values_only=True` in `iter_rows()` for fast data reads — returns plain Python values, not Cell objects
- Formulas are written as strings (`ws["A1"] = "=SUM(B1:B10)"`) — values compute in Excel on open
- Never overwrite the source file — save to a new output path
- `ws.active` returns the first sheet; use `wb["SheetName"]` for named sheets
- Column letters: use `get_column_letter(n)` from `openpyxl.utils` rather than hardcoding

## Prerequisites
```bash
pip install openpyxl
```

## Red Flags (stop and apply skill)
- Reading `.xls` files — openpyxl will raise `InvalidFileException`; switch to `xlrd`
- `ws.cell(row, col)` uses 1-based indexing, not 0-based — off-by-one is a common bug
- Reading a formula cell with `values_only=True` returns the formula string, not the computed value — use `data_only=True` in `load_workbook` to get cached values
