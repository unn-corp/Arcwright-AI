---
name: ux-audit
description: UI/UX audit skill — design token compliance, accessibility, component reuse, layout patterns, interaction quality, and conversion/local-business landing-page review
version: 1.0.0
author: arcwright
tags: [ux, ui, accessibility, design-tokens, shadcn, review, audit]
---

# UX Audit Skill

## Overview

Load this skill when performing a UX/UI review on your project frontend code. It defines the full audit methodology, checklist, finding format, and verdict rules for the `ux-designer-agent` running the UV (UI Review) lens.

Use alongside `excalidraw-dark-standard` when the audit target includes new UI components that need diagramming.

---

## Audit Scope

Target files: `.tsx`, `.jsx`, `.css` in `frontend/` (skip `dist/`, `.next/`, generated files).

Auto-pass for pure backend changes (no `.tsx`/`.jsx`/`.css` in the diff).

---

## Audit Checklist — 8 Categories

### CAT-1: Design Token Compliance
- All colors use design tokens (`background`, `foreground`, `primary`, `secondary`, `muted`, `accent`, `border`, `muted-foreground`) — no hardcoded hex/RGB/Tailwind color classes
- Background variants: `bg-muted/50`, `bg-primary/10` — never `bg-orange-50` or similar
- Border: `border-muted`, `border-border` — never `border-orange-200`
- Icon colors: `text-muted-foreground`, `text-primary` — never `text-gray-400`

### CAT-2: Component Reuse (ShadCN + project component catalog)
- Check `frontend/components/ui/` for any reimplemented component
- Spinners, badges, data tables, buttons, dialogs — must import from `@/components/ui/*`
- New reusable components must be added to `docs/frontend/styling-standards.md`
- Page layout must use `PageHeader` / `PageBody` / `PageHeaderTab` from `frontend/components/layout/`

### CAT-3: Dialog Pattern (WCAG 2.1)
All dialogs must use the flex-column pattern:
```tsx
<DialogContent className="max-w-2xl max-h-[70vh] overflow-hidden flex flex-col gap-0 p-0">
  <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4">...</DialogHeader>
  <div className="flex-1 overflow-y-auto px-6 py-4">...</div>
  <DialogFooter className="flex-shrink-0 px-6 py-4">...</DialogFooter>
</DialogContent>
```
Flag: missing `overflow-hidden`, missing `flex-shrink-0` on header/footer, missing `flex-1 overflow-y-auto` on body.

### CAT-4: Accessibility
- Interactive elements have `aria-label` or visible label text
- `<img>` and `<Image>` have descriptive `alt` attributes (not empty unless decorative)
- Tab order is logical — no `tabIndex` hacks
- Focus states visible on interactive elements
- Color contrast: text on background meets WCAG AA (4.5:1 normal, 3:1 large)
- Loading states communicated to screen readers (`aria-busy`, `aria-live`)
- Touch targets are minimum **44×44 px** for all interactive / tappable elements (WCAG 2.5.5)
- Tap-to-call links use `tel:` href and are keyboard-reachable (not JS-only)

### CAT-5: Interaction & Feedback Quality
- All async actions show loading state (spinner, disabled button, skeleton)
- Error states displayed with actionable messages (not raw API errors)
- Empty states have meaningful copy and a CTA where appropriate
- Destructive actions require confirmation (delete dialogs, irreversible operations)
- Forms validate on submit and show inline field-level errors

### CAT-6: Layout & Responsiveness
- Pages work at `sm` (640px), `md` (768px), `lg` (1024px), `xl` (1280px)
- No content overflow without scroll handling
- Tables on small screens: horizontal scroll or card layout
- Grids use responsive Tailwind breakpoints (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`)
- Modals do not overflow viewport on mobile

### CAT-8: Conversion & Local-Business Landing Pages

> **Auto-skip** — N/A for internal app UI and dashboards. Apply only when the audit target is a marketing, service, city, or lead-gen landing page.

The conversion decision happens in ~3 seconds on a 6-inch screen. 70%+ of local-services searches are on mobile; design mobile-first.

- **Above the fold on mobile (no scroll):** must show — business name, service + city ("AC Repair in Austin"), a tap-to-call button, a primary CTA (book online / get quote), star rating or review count, and trust badges (licensed/insured, BBB, Google Guaranteed). Flag any of these missing.
- **Sticky tap-to-call:** a click-to-call/tap-to-call button that stays fixed in the mobile viewport while scrolling. Phone number must be visually larger/more prominent than the logo.
- **Call within ~2 seconds:** a user must be able to initiate a call or reach the booking form without scrolling. Flag if this path requires more than one tap or any scroll.
- **Online booking on every page:** a booking/quote-request entry point must be reachable from every service or city page — not call-only.
- **Per-page social proof:** relevant reviews or testimonials must be embedded on the specific page (AC-repair page shows AC-repair reviews). Do not accept a single shared testimonials page as sufficient. Trust badges and aggregate rating must appear above the fold.
- **Page-level SEO structure:** single semantic `<h1>` matching search intent (service + city); descriptive `<title>` tag; content must be unique per city/service page — flag near-duplicate city pages.
- **Structured data (JSON-LD):** `LocalBusiness`, `Service`, and/or `AggregateRating` schema present. Flag pages with no structured data.
- **Performance budget:** target < 3 s load on mobile. Note oversized images, render-blocking scripts, or heavy bundles as contributing factors. Page speed is a confirmed ranking and conversion factor.

### CAT-7: Typography & Visual Hierarchy
- Heading levels are semantic and sequential (h1 → h2 → h3)
- No font-size hardcoding outside of design system classes
- Visual hierarchy is clear: primary action stands out, secondary is muted
- Consistent spacing — uses Tailwind spacing scale, not arbitrary `px-7` or `mt-9`

---

## Severity Guide

| Severity | Condition |
|---|---|
| 🔴 Critical | WCAG 2.1 AA violation; hardcoded color that breaks theming; dialog without flex-column pattern (scroll breaks); blocking interaction bug; missing above-fold click-to-call on a landing page; no primary CTA visible without scroll on mobile |
| 🟡 Major | Missing loading/error state; reimplemented component; missing aria-label on important interactive element; layout broken at one breakpoint; missing structured data on a service/city page; online booking not reachable from a landing page; touch target < 44×44 px |
| 🟢 Minor | Naming inconsistency; minor spacing irregularity; non-blocking visual improvement; performance budget exceeded by < 1 s; missing trust badge that would aid conversion |

---

## Finding Format

```
### [UV-001] {title}
File: {path}:{line}
Category: CAT-{N} — {category name}
Severity: 🔴 Critical | 🟡 Major | 🟢 Minor
Issue: {description — what is wrong and why it matters}
Fix: {specific fix with code snippet if helpful}
```

---

## Output Format

Write findings to:
```
_arcwright-output/features/{feature-slug}/planning/uv-review-findings-{artifact_id}.md
```

Return verdict:
```yaml
uv_review_verdict:
  target: {path or feature name}
  actionable_count: {N}
  critical: {count of 🔴}
  major: {count of 🟡}
  minor: {count of 🟢}
  findings_path: _arcwright-output/features/{feature-slug}/planning/uv-review-findings-{artifact_id}.md
  status: passed | needs_fixes
```

**Status rules:**
- `passed` — zero critical and ≤3 major findings
- `needs_fixes` — any critical OR 4+ major findings

---

## Auto-Pass Conditions

```yaml
uv_review_verdict:
  status: passed
  note: "Pure backend change — no frontend files in diff."
```

Trigger when: diff contains zero `.tsx`, `.jsx`, `.css` files.

---

## Reference Documents

Always read before auditing:
- `docs/frontend/styling-standards.md` — design tokens, component catalog, dialog patterns
- `docs/frontend/form-patterns.md` — React Hook Form, validation patterns
- `docs/frontend/page-layout-patterns.md` — PageHeader/PageBody, tabbed routing

---

_v1.1 — 2026-06-11 — added CAT-8 conversion/local-business rules; sharpened CAT-4 with touch-target and tel: link checks; updated severity guide_
