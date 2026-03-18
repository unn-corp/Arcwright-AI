# Step 13: Responsive Design & Accessibility

Define responsive design strategy and accessibility requirements for the product.

## RESPONSIVE & ACCESSIBILITY SEQUENCE

### 1. Define Responsive Strategy

"Let's define how {{project_name}} adapts across different screen sizes and devices.

**Desktop Strategy:**

- How should we use extra screen real estate?
- Multi-column layouts, side navigation, or content density?
- What desktop-specific features can we include?

**Tablet Strategy:**

- Should we use simplified layouts or touch-optimized interfaces?
- How do gestures and touch interactions work on tablets?
- What's the optimal information density for tablet screens?

**Mobile Strategy:**

- Bottom navigation or hamburger menu?
- How do layouts collapse on small screens?
- What's the most critical information to show mobile-first?"

### 2. Establish Breakpoint Strategy

"**Breakpoint Strategy:**
We need to define screen size breakpoints where layouts adapt.

**Common Breakpoints:**

- Mobile: 320px - 767px
- Tablet: 768px - 1023px
- Desktop: 1024px+

**For {{project_name}}, should we:**

- Use standard breakpoints or custom ones?
- Focus on mobile-first or desktop-first design?
- Have specific breakpoints for your key use cases?"

### 3. Design Accessibility Strategy

"**Accessibility Strategy:**
What level of WCAG compliance does {{project_name}} need?

**WCAG Levels:**

- **Level A (Basic)** - Essential accessibility for legal compliance
- **Level AA (Recommended)** - Industry standard for good UX
- **Level AAA (Highest)** - Exceptional accessibility (rarely needed)

**Based on your product:** [Recommendation based on user base, legal requirements, etc.]

**Key Accessibility Considerations:**

- Color contrast ratios (4.5:1 for normal text)
- Keyboard navigation support
- Screen reader compatibility
- Touch target sizes (minimum 44x44px)
- Focus indicators and skip links"

### 4. Define Testing Strategy

"**Testing Strategy:**

**Responsive Testing:**

- Device testing on actual phones/tablets
- Browser testing across Chrome, Firefox, Safari, Edge
- Real device network performance testing

**Accessibility Testing:**

- Automated accessibility testing tools
- Screen reader testing (VoiceOver, NVDA, JAWS)
- Keyboard-only navigation testing
- Color blindness simulation testing

**User Testing:**

- Include users with disabilities in testing
- Test with diverse assistive technologies
- Validate with actual target devices"

### 5. Document Implementation Guidelines

"**Implementation Guidelines:**

**Responsive Development:**

- Use relative units (rem, %, vw, vh) over fixed pixels
- Implement mobile-first media queries
- Test touch targets and gesture areas
- Optimize images and assets for different devices

**Accessibility Development:**

- Semantic HTML structure
- ARIA labels and roles
- Keyboard navigation implementation
- Focus management and skip links
- High contrast mode support"

### 6. Generate Responsive & Accessibility Content

When saving to document, append these sections:

```markdown
## Responsive Design & Accessibility

### Responsive Strategy

**Mobile-First Mandate:** All components and layouts MUST be implemented mobile-first. Write base CSS/Tailwind classes for mobile, then use `md:` and `lg:` prefixes (or media query equivalents) to scale up. Desktop-first overrides are FORBIDDEN unless explicit technical constraints require them.

[Responsive strategy detail based on conversation]

### Breakpoint Strategy

| Breakpoint | Range          | Tailwind Prefix   | Focus                                          |
| ---------- | -------------- | ----------------- | ---------------------------------------------- |
| Mobile     | 320px – 767px  | (base, no prefix) | Single column, bottom nav, large touch targets |
| Tablet     | 768px – 1023px | `md:`             | Multi-column optional, touch/mouse hybrid      |
| Desktop    | 1024px+        | `lg:`             | Full layout, hover states, side navigation     |

[Custom breakpoints or deviations based on conversation]

### Accessibility Strategy

**WCAG Target Level:** [Level A / AA / AAA based on conversation]

**Mandatory Requirements (non-negotiable for every component):**

- Every interactive element MUST include `aria-label`, `aria-expanded`, `role`, or relevant ARIA attribute. The execution agent MUST reject component generation if ARIA attributes are missing.
- All interactive elements MUST be keyboard navigable. Use `tabIndex={0}` for custom interactive elements and respond to `Enter` and `Space` key presses where semantically appropriate.
- Color contrast ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text and UI components.
- Skip links MUST be provided for pages with long content.
- Decorative images/elements MUST have `aria-hidden="true"`.
- Focus indicators MUST be visible and high-contrast — never use `outline: none` without a replacement focus style.

**Overflow Visibility Rule:**
Hover states, tooltips, and dropdown menus MUST NOT be clipped by `overflow-hidden` on parent containers (e.g., inside cards, modals, sticky headers). During implementation, audit all parent containers that use `overflow-hidden` and switch to `overflow-visible` or use portals for floating elements.

### Testing Strategy

[Testing strategy based on conversation]

### Implementation Guidelines

**Responsive Development:**

- ALWAYS use relative units (`rem`, `%`, `vw`, `vh`) over fixed `px` values for layout dimensions
- Write mobile-first Tailwind/CSS — base styles target mobile, then use responsive prefixes (`md:`, `lg:`) to progressively enhance
- Touch targets MUST be minimum `44×44px` — enforce this for all interactive elements on mobile
- Use `next/image` (or framework equivalent) with explicit `width` and `height` for all images to prevent layout shift (CLS)
- Test on throttled network (Slow 3G) to validate skeleton loading states

**Accessibility Development:**

- Use semantic HTML elements (`<button>`, `<nav>`, `<main>`, `<article>`) rather than `<div>` for all structural and interactive elements
- ARIA labels MUST be meaningful (e.g., `aria-label="Close dialog"`, not `aria-label="button"`)
- Focus management: When opening a modal/sheet, focus MUST jump to the first focusable element inside it
- When modal closes, focus MUST return to the triggering element
- All form fields MUST have associated `<label>` tags or `aria-labelledby`
```

### 7. Auto-Save and Advance

Without presenting a menu or waiting for user input:

- Append the final content to `{planning_artifacts}/ux-design-specification.md`
- Update frontmatter: append step to end of stepsCompleted array
- Announce: `"✅ Responsive Design & Accessibility Strategy saved. Advancing to completion..."`
- Immediately load and execute: `{project-root}/_bmad/bmm/workflows/2-plan-workflows/create-ux-design/steps/step-14-complete.md`

> **HALT ONLY IF:** The user has not confirmed a WCAG target level and the product type implies legal accessibility requirements (e.g., government, healthcare, finance). In that case, ask once: "This product type typically requires WCAG AA compliance — shall I set that as the target?" Then continue without further gates.

**If A:** Read fully and follow `{project-root}/_bmad/core/workflows/advanced-elicitation/workflow.xml` with the current content. Ask user to accept/reject improvements, then return to menu.

**If P:** Read fully and follow `{project-root}/_bmad/core/workflows/party-mode/workflow.md` with the current content. Ask user to accept/reject changes, then return to menu.

**If AR:** Execute `{project-root}/_bmad/core/tasks/review-adversarial-general.xml` — display findings with recommendations; then redisplay this menu.

**If C:**

- Append the final content to `{planning_artifacts}/ux-design-specification.md`
- Update frontmatter: append step to end of stepsCompleted array
- Load `{project-root}/_bmad/bmm/workflows/2-plan-workflows/create-ux-design/steps/step-14-complete.md`
