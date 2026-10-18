## 1. Session Lifecycle

Every inspection session follows open-work-close:

```bash
rdc open path/to/capture.rdc   # Start daemon, load capture
# ... inspection commands ...
rdc close                       # Release resources, stop daemon
```

Check session state with `rdc status`. Only one capture can be open per session (use `--session name` for parallel sessions).

**IMPORTANT**: Always close sessions when done. Leaked daemon processes consume GPU memory.
