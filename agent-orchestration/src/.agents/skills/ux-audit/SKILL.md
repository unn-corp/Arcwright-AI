---
name: ux-audit
description: Squidhub UI/UX audit skill — design token compliance, accessibility, component reuse, layout patterns, and interaction quality review
version: 1.0.0
author: bmad
tags: [ux, ui, accessibility, design-tokens, shadcn, review, audit]
---

# UX Audit Skill

## Overview

Load this skill when performing a UX/UI review on Squidhub frontend code. It defines the full audit methodology, checklist, finding format, and verdict rules for the `ux-designer-agent` running the UV (UI Review) lens.

Use alongside `excalidraw-dark-standard` when the audit target includes new UI components that need diagramming.

---

## Audit Scope

Target files: `.tsx`, `.jsx`, `.css` in `frontend/` (skip `dist/`, `.next/`, generated files).

Auto-pass for pure backend changes (no `.tsx`/`.jsx`/`.css` in the diff).

---

## Audit Checklist — 7 Categories

### CAT-1: Design Token Compliance
- All colors use design tokens (`background`, `foreground`, `primary`, `secondary`, `muted`, `accent`, `border`, `muted-foreground`) — no hardcoded hex/RGB/Tailwind color classes
- Background variants: `bg-muted/50`, `bg-primary/10` — never `bg-orange-50` or similar
- Border: `border-muted`, `border-border` — never `border-orange-200`
- Icon colors: `text-muted-foreground`, `text-primary` — never `text-gray-400`

### CAT-2: Component Reuse (ShadCN + Squidhub catalog)
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

### CAT-7: Typography & Visual Hierarchy
- Heading levels are semantic and sequential (h1 → h2 → h3)
- No font-size hardcoding outside of design system classes
- Visual hierarchy is clear: primary action stands out, secondary is muted
- Consistent spacing — uses Tailwind spacing scale, not arbitrary `px-7` or `mt-9`

---

## Severity Guide

| Severity | Condition |
|---|---|
| 🔴 Critical | WCAG 2.1 AA violation; hardcoded color that breaks theming; dialog without flex-column pattern (scroll breaks); blocking interaction bug |
| 🟡 Major | Missing loading/error state; reimplemented component; missing aria-label on important interactive element; layout broken at one breakpoint |
| 🟢 Minor | Naming inconsistency; minor spacing irregularity; non-blocking visual improvement |

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
_bmad-output/features/{feature-slug}/planning/uv-review-findings-{artifact_id}.md
```

Return verdict:
```yaml
uv_review_verdict:
  target: {path or feature name}
  actionable_count: {N}
  critical: {count of 🔴}
  major: {count of 🟡}
  minor: {count of 🟢}
  findings_path: _bmad-output/features/{feature-slug}/planning/uv-review-findings-{artifact_id}.md
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

_v1.0 — 2026-03-14_
