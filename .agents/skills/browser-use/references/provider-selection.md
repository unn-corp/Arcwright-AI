# Standalone provider selection

Use only for an authorized standalone browser-use run. Verify the installed version
and [upstream provider guide](https://github.com/browser-use/browser-use/blob/main/skills/open-source/references/models.md).
Keep the current model choice. Wrapper availability and credentials differ by
provider; do not confuse the host session's authentication with library API access.

```python
import os
from browser_use import ChatOpenAI, ChatAnthropic

wrappers = {"openai": ChatOpenAI, "anthropic": ChatAnthropic}
provider = os.environ["BROWSER_USE_PROVIDER"]
model = os.environ["BROWSER_USE_MODEL"]
if provider not in wrappers:
    raise ValueError("Use the installed provider's supported wrapper explicitly")
llm = wrappers[provider](model=model)
```

This example covers two supported adapters, not an exhaustive provider allowlist.
OpenAI uses its configured `OPENAI_API_KEY`; Anthropic uses its configured
`ANTHROPIC_API_KEY`. Other supported providers use their own wrappers and auth.
Use an existing compatible local endpoint or browser-use provider only when chosen
and supported. Never echo keys or add a fallback that silently changes providers.
Pass the resulting `llm` to the installed version's `Agent` API with task-scoped
browser settings and allowed domains, then inspect the observed result.
