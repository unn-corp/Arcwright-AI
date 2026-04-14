# Frontend Responsive Design Standards — Quick Rules

> Load full `SKILL.md` when executing this skill as a formal procedure.

## Core Rules
- Always start with the mobile layout and enhance upward using `min-width` media queries — never write desktop-first with `max-width` overrides
- Use only the project's established breakpoints (check existing code first); never introduce arbitrary values like `850px`
- Containers must be fluid: `width: 100%` with `max-width` — never fixed pixel widths for layout containers
- Use `rem` for font sizes and spacing, `%` or `fr` for widths, `px` only for borders and very small values
- All touch targets must be at least 44x44px — use padding on icon buttons to expand the hit area without changing visual size
- Body text minimum 16px (1rem); small text minimum 14px (0.875rem); never below 14px
- Body line height 1.5; readable line length 45–75 chars (`max-width: 65ch`)
- Use `clamp()` for fluid typography that scales between breakpoints without media queries
- Hide or collapse non-essential content on mobile — prioritize the main content first in DOM order
- Use `order` property to reorder elements visually without changing DOM order for accessibility
- Use `srcset` + `sizes` for images; prefer `<picture>` with modern formats (avif, webp, jpg fallback)
- Use SCAN instead of KEYS in Redis (separate domain but applies to any pattern-matching in production)
- Verify layouts at 375px, 768px, 1024px, and 1440px before marking work complete

## Red Flags (stop and apply skill)
- Layout starts with a fixed pixel width container
- Media queries use `max-width` instead of `min-width`
- Icon button smaller than 44x44px with no padding
- Font size below 14px anywhere in the UI
- Arbitrary breakpoint not matching the project's breakpoint scale
