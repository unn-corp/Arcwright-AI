## 4. Pipeline State Inspection

Get full pipeline state at any draw call:

```bash
rdc pipeline EID --json              # Full pipeline state
rdc pipeline EID vs --json           # Vertex shader section only
rdc pipeline EID ps --json           # Pixel/fragment shader section only
rdc pipeline EID om --json           # Output merger (blend, depth, stencil)
rdc pipeline EID rs --json           # Rasterizer state (culling, viewport)
rdc pipeline EID ia --json           # Input assembler (vertex buffers, topology)
rdc pipeline EID ds --json           # Depth-stencil state
```

### Bound resources

```bash
rdc bindings EID --json              # All bindings for all stages
rdc bindings EID --set 0 --json      # Descriptor set 0 only
```
