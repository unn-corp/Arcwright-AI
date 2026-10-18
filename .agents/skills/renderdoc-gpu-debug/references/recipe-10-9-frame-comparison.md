## 9. Frame Comparison

Compare two captures:

```bash
# Quick summary of differences
rdc diff capture_a.rdc capture_b.rdc --shortstat

# Detailed comparisons
rdc diff capture_a.rdc capture_b.rdc --draws --json       # Draw call differences
rdc diff capture_a.rdc capture_b.rdc --resources --json   # Resource differences
rdc diff capture_a.rdc capture_b.rdc --passes --json      # Pass structure differences
rdc diff capture_a.rdc capture_b.rdc --framebuffer --json  # Final framebuffer diff

# Visual diff
rdc diff capture_a.rdc capture_b.rdc --framebuffer --diff-output D:/renderdoc/captures/analysis/diff.png
```
