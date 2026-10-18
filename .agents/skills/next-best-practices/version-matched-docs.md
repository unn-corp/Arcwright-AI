# Match the installed Next.js version

Resolve the application's installed `next` package and caching mode before selecting APIs. In a monorepo, resolve from the application directory.

| Installed Next.js | Reference source |
|---|---|
| 16.3+ | `node_modules/next/dist/docs/`; the framework can maintain its own marked block in project agent instructions |
| 16.2 | The same bundled docs; automatic instruction generation is not available |
| 16.1 or earlier | Matching official versioned documentation, or an existing `.next-docs/` snapshot |

These skill references are a topic index and examples. Installed docs and types govern version-sensitive details. Updating guidance does not commission a framework upgrade, run a codemod, enable feedback, or replace project instructions. Preserve other agent-rule blocks.

Check `cacheComponents` first. Its directives and invalidation contracts are not interchangeable with route-segment `dynamic`/`revalidate` options. In older applications use their matching fetch and route-cache docs.

Vercel retired `next-best-practices` in favor of bundled docs. Workflow skills now live in `vercel/next.js`; add tooling only when it serves the requested work.

Sources: [Next.js version support](https://nextjs.org/docs/app/guides/ai-agents#version-support), [upstream migration](https://github.com/vercel-labs/next-skills/blob/c522619e45aa3492fd2bfc916b308b275eff7798/README.md).
