# Arcwright source and submodules

The skill library is ordinary Arcwright source in `.agents/skills/`. Clone and build it without initializing application repositories:

```sh
git clone https://github.com/unn-corp/Arcwright-AI.git
cd Arcwright-AI
node build/build.js
```

Only these separate applications remain registered as submodules:

| Path | Purpose |
| --- | --- |
| `t3code/` | Arcwright Code application fork |
| `ungate/` | Standalone Cursor extension |
| `hermes-agent/` | Hermes agent fork |

Initialize only the application you intend to work on, for example `git submodule update --init t3code`. These applications are not dependencies of skill packaging. Follow each application's instructions for its own build and release work. Arcwright Code delivery follows [the workspace rules](../AGENTS.md) and [its release procedure](../t3code/docs/operations/fork-releases.md).

## Locally maintained skills

Herdr, Collie, and `vendor/mattpocock-skills` are no longer registered submodules. The local [Herdr skill](../.agents/skills/herdr/SKILL.md), [Collie setup guide](herdr-collie-tailscale-pwa.md), and [Arcwright engineering/productivity pack](matt-pocock-skills.md) remain available. The latter contains our versions of 27 skills plus its router, scripts, templates, references, and licenses. Stable invocation names and optional installation choices are preserved.

Older workspaces may retain ignored checkouts at these retired paths for local recovery. They are not package inputs, skill-source audit inputs, or downloads in new clones. Preserve any needed Git history before removing a local checkout. Keep independent application development in separate repositories; review upstream skill improvements before applying them to the canonical local source.
