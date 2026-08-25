# Arcwright website

The public [arcwright.space](https://arcwright.space) site is a Vite, React, and TypeScript single-page application. It documents the Arcwright agent ecosystem, supported coding environments, workflow runtimes, teams, and a curated skill catalog.

## Local development

Use Node.js 20 or newer.

```bash
cd website
npm ci
npm run dev
```

Vite prints the local development URL. Build the production bundle with:

```bash
npm run build
```

## Validation

Run these checks before deploying:

```bash
npm run check:data
npm run check:copy
npm run lint
npm run build
```

`check:data` runs from a full repository checkout. It verifies that the skills, team codes, agent icons, and agent primary-skill references shown by the site exist in `.agents/skills/`. It intentionally skips when the parent repository is unavailable, which keeps the standalone Docker build portable.
`check:copy` verifies that page headers lead with their main heading instead of rendering a pre-heading eyebrow row.

## Content maintenance

The files in `src/data/` are the curated public catalog. Keep them aligned with the root `README.md`, especially for supported environments, workflow behavior, team composition, and public counts. The Skills page intentionally shows highlights rather than every installed skill.

## Deployment

The `Dockerfile` creates a static production bundle and serves it with nginx. Its SPA fallback supports direct navigation to client-side routes, while `/health` is available for container health checks.

```bash
docker build -t arcwright-website .
docker run --rm -p 8080:80 arcwright-website
```

`docker-compose.yml` is set up for the external `dokploy-network` used by the hosted deployment.
