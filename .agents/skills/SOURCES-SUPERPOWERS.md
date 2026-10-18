# Superpowers source and runtime storage

Arcwright adapts `systematic-debugging`, `writing-skills`, and `subagent-driven-development` from [obra/superpowers](https://github.com/obra/superpowers/tree/bb92a77741419a4ab5f06e711a283343f1ada0c3/skills), MIT. Each bundle carries its upstream license. Local changes and source hashes are recorded in the workshop source registry.

## Runtime output contract

Resolve the **active application project** from the user's workspace or an explicit project path. Reading a skill or invoking its script does not make that skill directory the project root. This applies equally to global skills, project skills, cached/plugin/vendor copies, and the shared installed libraries for every host.

Create a distinct run at:

```text
<project-root>/_arcwright/_memory/skill-runs/<skill>-<run-id>/
```

Place all skill-owned runtime artifacts there: plans, notes, task briefs, ledgers, reports, review packages, source snapshots, logs, diagrams and DOT source, repro scripts, isolated fixtures, and evaluation outputs. Pass absolute run/report paths to delegated tasks and helper tools. Keep requested application source changes in their authorized application paths; those are task deliverables, not workflow scratch files.

When authoring a new skill, put its draft and supporting source under `<project-root>/_arcwright/_memory/skills/<name>/`. Evaluate it with fixtures and outputs in the separate run directory. Installing or maintaining a skill bundle is a distinct, explicitly requested action; ordinary execution must not create or modify files beside its installed `SKILL.md`, scripts, references, or assets.

- Create missing Arcwright run directories as needed. Reuse an existing run only after matching its task/owner; do not overwrite another run's output.
- Do not fall back to the skill directory, the shell's incidental working directory, or an arbitrary temporary directory. If the project is genuinely unknown, resolve it from workspace context or obtain that missing path before creating output.
- Reject a project path inside the input skill/installed skill tree and output paths that escape the Arcwright run area, including symlink redirects. Helpers must treat installed skill inputs as read-only.
- Run reproductions/tests from the application or the run's isolated fixture, never from an installed skill directory. Configure their generated reports and temporary files into the run where the tool supports it; application/framework-owned build caches follow the project's configured build system.
- Keep recovery evidence until its owner requests cleanup. Local runs are not package source and must not be bundled or published with Arcwright.
- A host may mandate its own storage for app-managed captures or tool results. Keep those host-managed artifacts in that required storage and record their paths/IDs in the Arcwright run ledger. Do not redirect a host-owned service into the skill bundle.

The diagram renderer accepts `--project-root` and an optional `--output-dir` restricted to `_arcwright/_memory/skill-runs/`. When omitted, the project defaults only to the current directory with an existing Arcwright/Git marker; it never searches parent folders. Supply `--project-root` for a new project or another working directory. By default it creates a unique `writing-skills-*` run and a `diagrams/` subdirectory. It creates artifact files exclusively; existing files are not overwritten. The polluter helper refuses a working directory inside known installed skill trees.
