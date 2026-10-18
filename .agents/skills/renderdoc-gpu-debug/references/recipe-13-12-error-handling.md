## 12. Error Handling

### rdc not found
```bash
pip install rdc-cli
```

### rdc doctor fails
Check `RENDERDOC_PYTHON_PATH` points to directory containing `renderdoc.pyd` and `renderdoc.dll`.

### Capture fails with "no swapchain"
The app may not present frames in the expected way. Try:
```bash
rdc capture --trigger -- /path/to/app   # Inject-only mode
# Then manually trigger: rdc capture-trigger
```

### Daemon not responding
```bash
rdc status          # Check if daemon is alive
rdc close           # Force close
rdc open capture.rdc  # Re-open
```

### GPU feature not supported
Some features (GPU counters, pixel history) depend on the GPU and driver. Check:
```bash
rdc gpus --json     # GPU capabilities
rdc counters --list # Available counters (empty if not supported)
```
