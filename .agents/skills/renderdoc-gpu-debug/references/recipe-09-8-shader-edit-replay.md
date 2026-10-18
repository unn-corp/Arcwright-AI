## 8. Shader Edit-Replay

Modify shaders without recompiling the application:

```bash
# 1. Check available encodings
rdc shader-encodings --json

# 2. Extract shader source
rdc shader EID ps --source -o D:/renderdoc/captures/analysis/shader.frag

# 3. Edit the shader (use Edit tool)

# 4. Build the modified shader
rdc shader-build D:/renderdoc/captures/analysis/shader.frag --encoding GLSL --stage ps --json

# 5. Replace (use the shader_id from build output)
rdc shader-replace EID ps --with SHADER_ID --json

# 6. Export to verify the change
rdc rt EID -o D:/renderdoc/captures/analysis/after_edit.png

# 7. Restore when done
rdc shader-restore EID ps
# or: rdc shader-restore-all
```
