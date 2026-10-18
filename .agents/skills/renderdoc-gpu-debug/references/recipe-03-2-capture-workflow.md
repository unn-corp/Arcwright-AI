## 2. Capture Workflow

### Capture from an executable

```bash
rdc capture -o output.rdc -- /path/to/app [app-args...]
```

Key options:
- `-o, --output`: Output .rdc file path
- `--frame N`: Capture frame N (default: first presented frame)
- `--timeout S`: Capture timeout in seconds (default: 60)
- `--api-validation`: Enable API validation layer
- `--ref-all-resources`: Reference all resources (larger capture, more complete)
- `--wait-for-exit`: Wait for the app to exit after capture

### CWD matters

Many applications resolve assets relative to CWD. Always set CWD appropriately:

```bash
cd /path/to/app/root && rdc capture -o /output/path/capture.rdc -- ./app
```

For lux-playground specifically:
```bash
cd D:/shaderlang && python D:/renderdoc/capture_frame.py
```

### Vulkan layer requirement

For Vulkan apps, the RenderDoc Vulkan layer must be registered:
- Registry: `HKCU\SOFTWARE\Khronos\Vulkan\ImplicitLayers` must contain `D:\renderdoc\module\renderdoc.json` (DWORD 0)
- Environment: `ENABLE_VULKAN_RENDERDOC_CAPTURE=1` must be set

### If headless capture fails

Headless Vulkan apps (no swapchain / no `vkQueuePresentKHR`) cannot be captured by RenderDoc since frame boundaries are defined by present calls. Options:
1. Use `--interactive` mode if the app supports it (opens a window with a swapchain)
2. Use the Python API via `capture_frame.py` for reliable programmatic capture
3. Use `--trigger` mode (inject without auto-capture, then `rdc capture-trigger`)
4. Fall back to `renderdoccmd capture` directly
