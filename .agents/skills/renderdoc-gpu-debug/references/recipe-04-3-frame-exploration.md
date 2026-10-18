## 3. Frame Exploration

After opening a capture, start with high-level overview:

```bash
rdc info --json          # API, GPU, driver, resolution, frame number
rdc stats --json         # Per-pass breakdown, top draws, largest resources
rdc passes               # List render passes (debug markers / implicit passes)
rdc draws --limit 20     # First 20 draw calls
rdc count draws          # Total draw call count
```

### Navigate by pass

```bash
rdc draws --pass "Shadow Pass" --json    # Draws in a specific pass
rdc draws --pass "GBuffer" --limit 10    # First 10 GBuffer draws
```

### Navigate by event

```bash
rdc events --limit 50                    # All API events (not just draws)
rdc events --type DrawIndexed --json     # Filter by event type
rdc event 42 --json                      # Detail for one event
```

### VFS browsing

The virtual filesystem provides a structured view of the capture:

```bash
rdc ls /                      # Root directories
rdc ls /textures -l           # List textures with metadata
rdc tree /pipelines --depth 2 # Pipeline tree
rdc cat /events/42            # Event detail
```
