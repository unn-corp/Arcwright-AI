---
description: Run TypeScript type-check inside the project's Docker container.
---

# /docker-check — Docker TypeScript Type-Check

Run `tsc --noEmit` inside the project's running Docker dev container to catch TypeScript errors before committing.

## Instructions

1. Load `.agents/skills/docker-type-check/SKILL.md` for the full protocol (pre-commit hook setup, container detection, and type-check invocation).
2. Determine the running dev container:
   - Check `docker ps` for a running container matching common dev container names (e.g., `dev`, `app`, `frontend`, `web`).
   - If multiple match, ask the user which container to use.
   - If none are running, tell the user: "No running dev container found. Start your Docker dev container and try again."
3. Run the type-check inside the container:
   ```bash
   docker exec <container-name> sh -c "cd /app && npx tsc --noEmit 2>&1"
   ```
   Adjust the working directory (`/app`) based on the project's Dockerfile or `docker-compose.yml` if determinable.
4. Parse the output:
   - If zero errors: report "Type-check passed — no TypeScript errors."
   - If errors found: group by file, report each error with file path, line, and message. Count total errors.
5. Do not auto-fix TypeScript errors — report only. Use `/arcwright-track-nano` or `/dry` to address findings.

## Arguments

`$ARGUMENTS` — optional container name override. If empty, auto-detects from `docker ps`.
