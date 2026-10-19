# Arcwright source and submodules

The skill library is ordinary Arcwright source in `.agents/skills/`. Clone and build it without initializing application repositories:

```sh
git clone https://github.com/unn-corp/Arcwright-AI.git
cd Arcwright-AI
node build/build.js
```

Only these repositories remain registered as submodules:

| Path | Purpose |
| --- | --- |
| `t3code/` | Arcwright Code application fork |
| `vendor/unnamed-dev-skills/` | Optional private [organization pack](organization-packs.md) |

Initialize only the repository you intend to work on, for example `git submodule update --init t3code`. Neither is a dependency of public skill packaging. Follow Arcwright Code's own instructions for build and release work, including [the workspace rules](../AGENTS.md) and [its release procedure](../t3code/docs/operations/fork-releases.md#default-agent-delivery). The private organization pack has its own authorized [setup procedure](organization-packs.md).

## Separate applications

[Ungate](https://github.com/unn-corp/ungate) and [Hermes](https://github.com/unn-corp/hermes-agent) are maintained in their own repositories. They are no longer submodules or downloads in new Arcwright workshop clones. Follow each application's own instructions for build and release work.

Existing workspaces may retain ignored `ungate/` and `hermes-agent/` checkouts. Detaching their parent registrations preserves their files, Git history, and linked worktrees. Their local Git metadata may still live under this workshop's `.git/modules/`; preserve that metadata while those checkouts or linked worktrees are in use.

## Locally maintained skills

Herdr, Collie, and `vendor/mattpocock-skills` are no longer registered submodules. The Herdr skill has been retired. The local [Collie setup guide](herdr-collie-tailscale-pwa.md) and [Arcwright engineering/productivity pack](matt-pocock-skills.md) remain available. The latter contains our versions of 27 skills plus its router, scripts, templates, references, and licenses. Stable invocation names and optional installation choices are preserved.

Older workspaces may retain ignored checkouts at these retired paths for local recovery. They are not package inputs, skill-source audit inputs, or downloads in new clones. Preserve any needed Git history before removing a local checkout. Keep independent application development in separate repositories; review upstream skill improvements before applying them to the canonical local source.
