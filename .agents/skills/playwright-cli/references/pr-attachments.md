# Pull request evidence

Attach a screenshot or short recording when it helps a reviewer verify changed UI. Use the conversation evidence directory for temporary captures and preserve the actual source revision and verification in the PR description.

In Arcwright Code/T3, use the advertised evidence/attachment and source-host tools when available, and register every PR worked on with `link_pull_request`. Inspect capabilities rather than invent an upload tool name. Native preview captures already use conversation storage. A PR request authorizes the relevant PR description; a local browser task alone does not authorize publishing files or posting comments.

For a CLI workflow, check `gh pr comment --help` or `gh pr create --help` for `--attach` support before using it (upstream documents GitHub CLI 2.99+). Use a body file for multiline text and separate arguments for paths, including paths with spaces:

```bash
gh pr comment 123 --body-file review.md --attach '/absolute/evidence/settings-after.png'
```

If attachments are unsupported, retain the local artifact and use an available authorized upload mechanism, or report the local evidence path. Do not fabricate a hosted URL or start a browser upload session merely to bypass missing CLI support.

Avoid screenshots of credentials or private account details. Keep recordings focused on the changed flow, with explanatory alt text for images. Check the host's current upload limits and repository access. For capture mechanics, read [video-recording.md](video-recording.md); use existing Playwright Test artifacts when they already demonstrate the issue.
