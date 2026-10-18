## 11. Output Size Management

GPU captures can produce enormous output. Follow these rules:

1. **Always use `--limit` for exploration**: `rdc draws --limit 20`, `rdc events --limit 50`
2. **Filter by pass**: `rdc draws --pass "Shadow Pass"` instead of all draws
3. **Use `-q` for ID lists**: `rdc draws -q` returns only EIDs, not full details
4. **Use `--json` selectively**: JSON is verbose; use TSV default for scanning
5. **Pipeline sections**: `rdc pipeline EID vs` instead of full `rdc pipeline EID`
6. **Limit search results**: `rdc search "pattern" --limit 10`

### Size estimates
- `rdc info`: ~20 lines
- `rdc draws --limit 20`: ~25 lines
- `rdc pipeline EID --json`: ~200-500 lines (full), ~50 lines (per section)
- `rdc shader EID ps --source`: ~50-500 lines depending on shader
- `rdc debug pixel EID X Y --trace`: ~100-1000 lines depending on shader complexity
