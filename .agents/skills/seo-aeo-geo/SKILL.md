---
name: seo-aeo-geo
description: Use when evaluating AI-search visibility, crawler policies, observed citations, or llms.txt for a documentation consumer.
license: MIT
metadata:
  category: seo-foundation
  catalog_summary: AI search eligibility, evidence and documentation discovery
  display_order: 7
---

# AEO and GEO

Use this guide for AI-search visibility and documentation discovery. For technical/on-page SEO,
keywords, content gaps or authority work, use the relevant workflow in [seo](../seo/SKILL.md).
For Next.js metadata and crawler implementation, use [nextjs-seo](../nextjs-seo/SKILL.md).

## Establish eligibility and evidence

Check the actual page, audience, target queries and intended search product. Google AI Overviews
and AI Mode use normal Search eligibility: the page must be indexed and eligible for a snippet.
They do not require special schema, AI text files, a FAQ, or content chunking. Also check Search
Console's effective **Search generative AI** include/exclude/inherit setting. Preserve the
owner's existing crawler and publication policy.

Separate observed citations, referral clicks, ordinary Web traffic and generative-AI impressions.
Search Console's dedicated report covers AI Overviews/AI Mode impressions; missing data is not a
pass or proof of absence. Record query, product, date, locale, source and measurement window.
Use Unknown for missing evidence. Diagnose crawl/index/canonical state separately from traffic.

Sources: [Google AI features](https://developers.google.com/search/docs/appearance/ai-features),
[inclusion control](https://support.google.com/webmasters/answer/16908024),
[generative-AI report](https://support.google.com/webmasters/answer/16984139).

## Improve useful content

- Answer the reader's question directly, with qualifications where the evidence needs them.
- Use descriptive headings, semantic HTML, lists for steps and tables for actual comparisons.
- Prefer original data, sources, real authorship and meaningful update dates. Do not invent
  credentials, statistics, citations, or a publication refresh.
- Add definitions, summaries or Q&A only when useful; avoid repeating a hero in multiple sections.
- Keep important content accessible in served HTML where practical. Check rendered content and
  resource access rather than assuming a framework directive determines crawlability.

The [content-pattern examples](references/extraction-friendly-patterns.md) are writing techniques,
not demonstrated ranking factors. Test proposed citation improvements against observed evidence.

## Markup and access

Use structured data that describes real visible content and serves a documented consumer.
Schema.org vocabulary support does not imply Google rich-result eligibility. FAQPage and HowTo
have no current Google rich-result benefit; a claimed AI citation benefit is unconfirmed.
Use QAPage only for genuine user-submitted Q&A. See [schema eligibility](../seo/SKILL.md#structured-data).

Treat [llms.txt](references/llms-txt-guide.md) as an optional documentation-discovery convention
for tools that consume it. It is not a Google SEO requirement, an access-control file or a proven
citation boost. Publish only material the owner intends to make public. Distinguish training,
search and user-triggered fetchers using the [crawler reference](../nextjs-seo/references/ai-search.md).

## Deliver and verify

Report the baseline evidence, the highest-value content/access issues, changes within the requested
scope, and the measurements needed to verify them. Use a local report when the task warrants an
artifact; retain the project's output convention. Re-test representative queries and page behavior
under comparable conditions. Label heuristic scores and hypotheses clearly.

This guide is adapted from the MIT-licensed `seo-aeo-geo` skill in
[rampstackco/claude-skills](https://github.com/rampstackco/claude-skills/tree/482c9bf74697fc1e311bd4dca5ce301f046c4b76/skills/seo-aeo-geo),
with Arcwright routing and current first-party eligibility/measurement corrections.
