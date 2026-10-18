## 7. Pixel Debugging

### Pixel history

Find all draws that wrote to a pixel:

```bash
rdc pixel X Y --json                 # Full pixel history at current event
rdc pixel X Y EID --json             # Pixel history up to EID
```

### Pick pixel color

Read the current color at a pixel:

```bash
rdc pick-pixel X Y --json            # Color at (X,Y) from current render target
rdc pick-pixel X Y EID --json        # Color at specific event
```

### Debug pixel shader

Step through shader execution for a specific pixel:

```bash
rdc debug pixel EID X Y --json           # Shader inputs/outputs summary
rdc debug pixel EID X Y --trace          # Full execution trace (every line)
rdc debug pixel EID X Y --dump-at 42     # Variable snapshot at line 42
```

### Debug vertex shader

```bash
rdc debug vertex EID VTXID --json        # Vertex shader debug for vertex ID
rdc debug vertex EID VTXID --trace       # Full trace
```

### Debug compute shader

```bash
rdc debug thread EID GX GY GZ TX TY TZ --json   # Compute thread debug
```
