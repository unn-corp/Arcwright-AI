## 5. Shader Inspection

### View shader metadata and source

```bash
rdc shader EID vs --json             # Vertex shader metadata
rdc shader EID ps --json             # Fragment/pixel shader metadata
rdc shader EID ps --source           # Debug source code (if available)
rdc shader EID ps --reflect --json   # Reflection: inputs, outputs, cbuffers
rdc shader EID ps --constants --json # Constant buffer values at this draw
```

### Disassembly targets

```bash
rdc shader EID ps --targets          # List available disassembly formats
rdc shader EID ps --target spirv     # SPIR-V disassembly
rdc shader EID ps --target glsl      # GLSL (cross-compiled, if available)
```

### Search shaders

```bash
rdc search "shadow" --json           # Search all shader disassembly for "shadow"
rdc search "main" --stage ps         # Search only pixel shaders
rdc shaders --stage ps --json        # List all unique pixel shaders
rdc shader-map --json                # EID-to-shader mapping
```
