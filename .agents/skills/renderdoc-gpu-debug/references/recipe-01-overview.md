## Overview

This skill enables GPU frame capture, inspection, and debugging using `rdc-cli`, a 66-command CLI wrapping RenderDoc's Python API. It works with Vulkan, D3D11, D3D12, and OpenGL applications.

### Prerequisites

Before any GPU debugging, verify the environment:

```bash
rdc doctor
```

All checks should pass. If `rdc doctor` fails, check:
- `RENDERDOC_PYTHON_PATH` is set to the directory containing `renderdoc.pyd`
- `renderdoc.dll` is in the same directory as `renderdoc.pyd`
- `renderdoccmd.exe` is on PATH or in the module directory
