---
name: "doc-xlsx"
description: "Use when reading or writing Excel spreadsheets (.xlsx) — via openpyxl. Read cell values and tables, write data, apply formatting, create charts."
allowed-tools: Bash, Read, Write
---

# doc-xlsx Skill

Read and write `.xlsx` Excel files using `openpyxl`. No Microsoft Office required.

---

## Prerequisites

```bash
# Check
python3 -c "import openpyxl" 2>/dev/null && echo "ok"

# Install
pip install openpyxl
```

**Graceful degradation:** If missing → `pip install openpyxl`. For `.xls` (old Excel) files → use `xlrd` to read; openpyxl only supports `.xlsx`/`.xlsm`/`.xltx`.

---

## Read Spreadsheet

```python
from openpyxl import load_workbook

wb = load_workbook("file.xlsx")
ws = wb.active          # first sheet
# OR: ws = wb["Sheet1"]

# Iterate all rows
for row in ws.iter_rows(values_only=True):
    print(row)

# Specific range
for row in ws.iter_rows(min_row=2, max_row=10, min_col=1, max_col=4, values_only=True):
    print(row)
```

### Read a single cell

```python
value = ws["A1"].value
value = ws.cell(row=1, column=1).value
```

### List sheet names

```python
print(wb.sheetnames)   # ['Sheet1', 'Data', 'Summary']
```

---

## Write Spreadsheet

```python
from openpyxl import Workbook

wb = Workbook()
ws = wb.active
ws.title = "Report"

# Write header
ws.append(["Name", "Score", "Grade"])

# Write rows
data = [("Alice", 95, "A"), ("Bob", 82, "B"), ("Carol", 91, "A")]
for row in data:
    ws.append(row)

wb.save("report.xlsx")
```

### Write a single cell

```python
ws["A1"] = "Header"
ws.cell(row=2, column=3, value=42)
```

---

## Modify Existing File

```python
from openpyxl import load_workbook

wb = load_workbook("file.xlsx")
ws = wb.active

# Update a cell
ws["B2"] = "Updated"

# Add a new row at the end
ws.append(["New", "Row", "Data"])

wb.save("file_updated.xlsx")   # save to new path to avoid overwriting
```

---

## Formatting

```python
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

# Bold header
ws["A1"].font = Font(bold=True, size=12)

# Background color (hex)
ws["A1"].fill = PatternFill(fill_type="solid", fgColor="4F81BD")

# Alignment
ws["A1"].alignment = Alignment(horizontal="center", vertical="center")

# Column width
ws.column_dimensions["A"].width = 20

# Row height
ws.row_dimensions[1].height = 30

# Border
thin = Side(style="thin")
ws["A1"].border = Border(left=thin, right=thin, top=thin, bottom=thin)
```

---

## Number Formats

```python
ws["B2"].number_format = "#,##0.00"         # 1,234.56
ws["C2"].number_format = "0.00%"             # 42.00%
ws["D2"].number_format = "YYYY-MM-DD"        # date
ws["E2"].number_format = "$#,##0.00"         # currency
```

---

## Formulas

```python
ws["D2"] = "=SUM(B2:C2)"
ws["E2"] = "=AVERAGE(B2:B100)"
ws["F2"] = '=IF(D2>90,"A","B")'
```

Note: formulas are stored as strings — values are calculated by Excel/LibreOffice on open.

---

## Named Sheets and Multiple Sheets

```python
wb = Workbook()

# Create sheets
ws1 = wb.active
ws1.title = "Sales"

ws2 = wb.create_sheet("Expenses")
ws2["A1"] = "Category"

# Delete a sheet
del wb["OldSheet"]

# Reorder sheets
wb.move_sheet("Expenses", offset=-1)

wb.save("multi.xlsx")
```

---

## Read as Dictionary (header row → dict)

```python
from openpyxl import load_workbook

wb = load_workbook("file.xlsx")
ws = wb.active
rows = ws.iter_rows(values_only=True)
headers = next(rows)
records = [dict(zip(headers, row)) for row in rows]
# records = [{"Name": "Alice", "Score": 95}, ...]
```

---

## Common Patterns

| Task | Method |
|------|--------|
| Open file | `load_workbook("file.xlsx")` |
| Active sheet | `wb.active` |
| Named sheet | `wb["SheetName"]` |
| Read range | `ws.iter_rows(values_only=True)` |
| Read cell | `ws["A1"].value` |
| Write cell | `ws["A1"] = value` |
| Append row | `ws.append([...])` |
| Save | `wb.save("out.xlsx")` |
| Column letter | `get_column_letter(3)` → `"C"` |
