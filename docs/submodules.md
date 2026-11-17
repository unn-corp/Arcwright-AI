# Arcwright source and submodules

The skill library is ordinary Arcwright source in `.agents/skills/`. Clone and build it without initializing application repositories:

```sh
git clone https://github.com/unn-corp/Arcwright-AI.git
cd Arcwright-AI
node build/build.js
```

`vendor/unnamed-dev-skills/` is the only registered submodule. Follow the
[organization pack setup procedure](organization-packs.md) when you need it.
Public skill packaging does not require the private pack.

## Separate applications

The Arcwright Code fork has been retired from this workshop. Existing workspaces
may retain an ignored `t3code/` checkout with Git metadata in `.git/modules/t3code/`.
Preserve those files while any local branches or linked worktrees still need them.

[Ungate](https://github.com/unn-corp/ungate) and [Hermes](https://github.com/unn-corp/hermes-agent) are maintained in their own repositories. They are no longer submodules or downloads in new Arcwright workshop clones. Follow each application's own instructions for build and release work.

Existing workspaces may retain ignored `ungate/` and `hermes-agent/` checkouts. Detaching their parent registrations preserves their files, Git history, and linked worktrees. Their local Git metadata may still live under this workshop's `.git/modules/`; preserve that metadata while those checkouts or linked worktrees are in use.

## Locally maintained skills

Herdr, Collie, and `vendor/mattpocock-skills` are no longer registered submodules. The Herdr skill has been retired. The local [Collie setup guide](herdr-collie-tailscale-pwa.md) and [Arcwright engineering/productivity pack](matt-pocock-skills.md) remain available. The latter contains our versions of 27 skills plus its router, scripts, templates, references, and licenses. Stable invocation names and optional installation choices are preserved.

Older workspaces may retain ignored checkouts at these retired paths for local recovery. They are not package inputs, skill-source audit inputs, or downloads in new clones. Preserve any needed Git history before removing a local checkout. Keep independent application development in separate repositories; review upstream skill improvements before applying them to the canonical local source.
