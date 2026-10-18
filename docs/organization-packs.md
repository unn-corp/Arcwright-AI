# Organization skill packs

Public Arcwright contains reusable skills and installer infrastructure. Unnamed
Development's MCP/PM and UFL procedures, references, hooks, specialist, and native
adapters belong in `unn-corp/unnamed-dev-skills`, a separate private repository.
It is pinned here as the optional `vendor/unnamed-dev-skills` Git submodule.

## Access and checkout

The pack is for organization admins only. Keep it private with no team or outside
collaborator grants; the organization currently gives members no default repository
access. Organization owners retain administrative access under
[GitHub repository roles](https://docs.github.com/en/organizations/managing-user-access-to-your-organizations-repositories/managing-repository-roles/repository-roles-for-an-organization).
Changing the intended audience requires a separate explicit request.

A normal checkout, build, test, or install does not initialize this submodule and
needs no organization credentials. An authorized admin can explicitly initialize it:

```sh
git submodule update --init -- vendor/unnamed-dev-skills
```

Use the pinned commit for repeatable installations. Updating the submodule pin is
source maintenance; using an already pinned pack to update a device needs no
repository commit. Recursive initialization of every submodule may require access
to private repositories; public CI must not require it.

## Install and update

Build the public core, then invoke the private pack's installer with an explicit
target. It preserves installed skill names and native host integration:

```sh
node build/build.js
node vendor/unnamed-dev-skills/install.cjs --core . --global --tools codex --yes
```

For a project install, use `--directory /absolute/project/path` instead of
`--global`. Do not target this source workshop. Use the private command for
subsequent core/pack updates on that target. Public-only updates refuse an enabled
private integration rather than silently dropping it. Access to the repo and pack
installation do not configure MCP credentials or authorize tracker/business writes.

The private installer stages core plus organization payload in private temporary
storage, merges discovery metadata, and calls the shared installer's trusted-source
factory. It does not alter the public package, copy private procedures into this
repository, or publish a private bundle. Preserve configuration and custom overlays.
Follow [fleet standards](fleet-management.md) for pinned releases and local receipts.

## CI and public release

Public CI tests organization adapter boundaries with synthetic fixtures. The
private repo retains the actual hook contract tests; validate its composed install
before moving the parent pin. Private CI that checks out another private repository
needs an explicitly scoped credential; the default workflow token is scoped to its
own repository. See [actions/checkout](https://github.com/actions/checkout#checkout-multiple-repos-private).

Public GitHub CI uses repository-local security checks and isolated organization self-hosted runners.
It requires neither the private organization baseline nor private submodule access.

Moving current files is insufficient to remove historical copies from Git.
The public migration preserves the original repository privately and rewrites the
published Git history, including private content embedded in shared files.
See [repository history](repository-history.md) before using an older clone.
Do not force-push rewritten history or change visibility as part of an ordinary
update; these operations require explicit task authorization.
