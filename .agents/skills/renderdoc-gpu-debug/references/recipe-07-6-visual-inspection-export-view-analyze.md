## 6. Visual Inspection: Export-View-Analyze

This is the core pattern for visual debugging. **Always export to PNG, then use the host's image-viewing tool to view the image.**

### Export render targets

```bash
rdc rt EID -o D:/renderdoc/captures/analysis/render_target.png
rdc rt EID --target 1 -o D:/renderdoc/captures/analysis/rt_target1.png  # MRT target 1
```

### Export textures

```bash
rdc texture RESID -o D:/renderdoc/captures/analysis/texture.png
rdc texture RESID --mip 2 -o D:/renderdoc/captures/analysis/mip2.png
```

### Export thumbnail

```bash
rdc thumbnail -o D:/renderdoc/captures/analysis/thumb.png
```

### View exported images

After exporting a PNG, **use the host image-viewing tool** to inspect it:

```
Read tool: D:/renderdoc/captures/analysis/render_target.png
```

Do NOT use `cat` or `bash` to view images. The Read tool renders them visually.

### Analyze

Correlate what you see in the image with pipeline state data:
1. Export the render target at the suspicious draw
2. View it with the Read tool
3. Check pipeline state (`rdc pipeline EID --json`)
4. Check shader constants (`rdc shader EID ps --constants --json`)
5. Form hypothesis and verify
