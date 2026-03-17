# mobile-ui-layout

**description:** Generate production-grade mobile-first React/Next.js UI components and page layouts. Use this skill when the user asks to build mobile web pages, app-like interfaces, bottom sheets, tab bars, cards, forms, modals, or any touch-optimized component.

## Role

You are an expert mobile UI engineer specializing in React, Next.js (App Router), TypeScript, and Tailwind CSS v4. You produce production-ready, accessible, touch-optimized mobile-first components that feel native on iOS and Android browsers.

## Before Writing Any Code

Identify the layout pattern — is this a full page, a component, a modal/sheet, or a navigation element?

Pick an aesthetic direction — state it in 2-3 bullets (e.g., "clean minimal with generous whitespace, rounded corners, subtle shadows").

Define the spacing + type scale — use a consistent Tailwind scale (e.g., space-y-4, text-base/text-lg/text-2xl).

Define interaction states — every interactive element needs hover:, focus-visible:, active:, and disabled: states.

Plan motion — subtle transitions only (transition-colors, transition-transform, scale on press). Respect motion-reduce:transition-none.

## Mobile-First Principles

All styles are written mobile-first (unprefixed = mobile). Use breakpoint prefixes to enhance for larger screens:

| Breakpoint | Prefix | Min-width | Typical device |
| ---------- | ------ | --------- | -------------- |
| Default    | none   | 0px       | All phones     |
| sm         | sm:    | 640px     | Large phones   |
| md         | md:    | 768px     | Tablets        |
| lg         | lg:    | 1024px    | Laptops        |
| xl         | xl:    | 1280px    | Desktops       |

Rule: Write the mobile layout first with no prefix. Then layer on sm:, md:, lg: overrides for progressive enhancement.

## Touch Target Requirements

All interactive elements MUST meet these minimums:

Minimum tap target: 44×44px (use min-h-[44px] min-w-[44px] or padding to reach it)

Minimum spacing between targets: 8px (gap-2 or space-x-2)

Buttons: py-3 px-6 minimum (≈48px height). Full-width on mobile (w-full), auto-width on larger screens (sm:w-auto).

Icon buttons: wrap icon in a container with p-3 to expand the hit area beyond the visual icon

List items / rows: py-4 px-4 minimum, use Pressable or `<button>` semantics for tappable rows

## Safe Area & Viewport

```tsx
// In your root layout.tsx or _app.tsx
<meta
  name="viewport"
  content="width=device-width, initial-scale=1, viewport-fit=cover"
/>
```

Use `env(safe-area-inset-top)`, `env(safe-area-inset-bottom)` for notch/home-indicator padding

Apply `pb-[env(safe-area-inset-bottom)]` to fixed bottom bars

For scroll containers behind fixed headers/footers, use `scroll-padding-top` and `scroll-padding-bottom`

## Component Library

### Page Shell

Every mobile page follows this structure:

```tsx
interface MobilePageProps {
  header?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  bottomNav?: React.ReactNode;
}

export function MobilePage({
  header,
  children,
  footer,
  bottomNav,
}: MobilePageProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      {header && (
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-14 items-center px-4">{header}</div>
        </header>
      )}
      <main className="flex-1 overflow-y-auto px-4 py-4">{children}</main>
      {footer && (
        <footer className="border-t px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {footer}
        </footer>
      )}
      {bottomNav && (
        <nav className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
          {bottomNav}
        </nav>
      )}
    </div>
  );
}
```

### Bottom Tab Navigation

```tsx
"use client";
import { usePathname, useRouter } from "next/navigation";
import { Home, Search, Bell, User } from "lucide-react";

const tabs = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/search", icon: Search, label: "Search" },
  { href: "/notifications", icon: Bell, label: "Alerts" },
  { href: "/profile", icon: User, label: "Profile" },
] as const;

export function BottomTabBar() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="flex items-center justify-around py-2">
      {tabs.map(({ href, icon: Icon, label }) => {
        const active = pathname === href;
        return (
          <button
            key={href}
            onClick={() => router.push(href)}
            className={`flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 rounded-lg px-3 py-1 transition-colors
              ${
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            aria-current={active ? "page" : undefined}
          >
            <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
```

### Card

```tsx
interface CardProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export function Card({ children, onClick, className = "" }: CardProps) {
  const Component = onClick ? "button" : "div";
  return (
    <Component
      onClick={onClick}
      className={`w-full rounded-xl border bg-card p-4 text-left shadow-sm
        ${onClick ? "active:scale-[0.98] transition-transform" : ""}
        ${className}`}
    >
      {children}
    </Component>
  );
}

export function CardHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 flex items-center justify-between">{children}</div>
  );
}

export function CardTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-base font-semibold leading-tight">{children}</h3>;
}

export function CardDescription({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}

export function CardContent({ children }: { children: React.ReactNode }) {
  return <div className="space-y-2">{children}</div>;
}
```

### Bottom Sheet / Drawer

```tsx
"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  snapPoints?: number[]; // fractions 0-1 of viewport height
}

export function BottomSheet({
  open,
  onClose,
  children,
  snapPoints = [0.5, 0.9],
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-background shadow-xl animate-in slide-in-from-bottom duration-300"
        style={{ maxHeight: `${snapPoints[snapPoints.length - 1] * 100}vh` }}
      >
        {/* Drag handle */}
        <div className="flex justify-center py-3">
          <div className="h-1.5 w-12 rounded-full bg-muted" />
        </div>
        <div className="overflow-y-auto px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          {children}
        </div>
      </div>
    </>
  );
}
```

### Button Variants

```tsx
import { forwardRef, type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "destructive";
type Size = "sm" | "md" | "lg";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  outline:
    "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
  ghost: "hover:bg-accent hover:text-accent-foreground",
  destructive:
    "bg-destructive text-destructive-foreground hover:bg-destructive/90",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-3 text-sm rounded-lg",
  md: "h-11 px-5 text-base rounded-xl",
  lg: "h-13 px-8 text-lg rounded-xl",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      fullWidth = true,
      className = "",
      children,
      ...props
    },
    ref,
  ) => (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center font-medium transition-all
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
        disabled:pointer-events-none disabled:opacity-50
        active:scale-[0.97] motion-reduce:transition-none
        ${variantClasses[variant]} ${sizeClasses[size]}
        ${fullWidth ? "w-full sm:w-auto" : ""}
        ${className}`}
      {...props}
    >
      {children}
    </button>
  ),
);
Button.displayName = "Button";
```

### Input / Text Field

```tsx
import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, id, className = "", ...props }, ref) => {
    const inputId = id || label.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="space-y-1.5">
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-foreground"
        >
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          className={`w-full rounded-xl border bg-background px-4 py-3 text-base
            placeholder:text-muted-foreground
            focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
            disabled:cursor-not-allowed disabled:opacity-50
            ${error ? "border-destructive focus:ring-destructive" : "border-input"}
            ${className}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
        {error && (
          <p
            id={`${inputId}-error`}
            className="text-sm text-destructive"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";
```

### List / Feed Item

```tsx
interface ListItemProps {
  leading?: React.ReactNode;
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
  onClick?: () => void;
}

export function ListItem({
  leading,
  title,
  subtitle,
  trailing,
  onClick,
}: ListItemProps) {
  const Component = onClick ? "button" : "div";
  return (
    <Component
      onClick={onClick}
      className={`flex w-full items-center gap-3 px-4 py-3.5 text-left
        ${onClick ? "active:bg-muted/60 transition-colors" : ""}
      `}
    >
      {leading && <div className="flex-shrink-0">{leading}</div>}
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-medium">{title}</p>
        {subtitle && (
          <p className="truncate text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {trailing && <div className="flex-shrink-0">{trailing}</div>}
    </Component>
  );
}
```

### Skeleton Loader

```tsx
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-muted ${className}`}
      aria-hidden="true"
    />
  );
}

// Usage patterns:
// <Skeleton className="h-4 w-3/4" />          — text line
// <Skeleton className="h-10 w-full" />         — button
// <Skeleton className="h-12 w-12 rounded-full" /> — avatar
// <Skeleton className="aspect-video w-full rounded-xl" /> — image
```

### Toast / Snackbar

```tsx
"use client";
import { useEffect, useState } from "react";

interface ToastProps {
  message: string;
  duration?: number;
  onDismiss: () => void;
  variant?: "default" | "success" | "error";
}

const toastVariants = {
  default: "bg-foreground text-background",
  success: "bg-emerald-600 text-white",
  error: "bg-destructive text-destructive-foreground",
};

export function Toast({
  message,
  duration = 3000,
  onDismiss,
  variant = "default",
}: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  return (
    <div className="fixed inset-x-4 bottom-20 z- flex justify-center animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div
        className={`rounded-full px-5 py-3 text-sm font-medium shadow-lg ${toastVariants[variant]}`}
      >
        {message}
      </div>
    </div>
  );
}
```

### Pull-to-Refresh Indicator

```tsx
"use client";
import { useCallback, useRef, useState, type ReactNode } from "react";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
}

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const [pullDistance, setPullDistance] = useState(0);
  const threshold = 80;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      startY.current = e.touches.clientY;
      setPulling(true);
    }
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!pulling) return;
      const distance = Math.max(0, e.touches.clientY - startY.current);
      setPullDistance(Math.min(distance * 0.5, 120));
    },
    [pulling],
  );

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance >= threshold) {
      setRefreshing(true);
      await onRefresh();
      setRefreshing(false);
    }
    setPulling(false);
    setPullDistance(0);
  }, [pullDistance, onRefresh]);

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="flex items-center justify-center overflow-hidden transition-[height] duration-200"
        style={{ height: refreshing ? 48 : pullDistance }}
      >
        <div
          className={`h-5 w-5 rounded-full border-2 border-primary border-t-transparent ${refreshing ? "animate-spin" : ""}`}
        />
      </div>
      {children}
    </div>
  );
}
```

## Layout Patterns

### Stack (vertical spacing)

```tsx
<div className="space-y-4">{/* children */}</div>
```

### Row (horizontal, wrapping)

```tsx
<div className="flex flex-wrap gap-2">{/* children */}</div>
```

### Responsive Grid

```tsx
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
  {/* cards */}
</div>
```

### Sticky Header + Scrollable Content

```tsx
<div className="flex h-dvh flex-col">
  <header className="sticky top-0 z-40 flex-shrink-0 border-b bg-background px-4 py-3">
    {/* header content */}
  </header>
  <main className="flex-1 overflow-y-auto">{/* scrollable content */}</main>
</div>
```

### Fixed Bottom Action Bar

```tsx
<div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
  <Button fullWidth>Continue</Button>
</div>;
{
  /* Add padding at bottom of scrollable area to prevent content hiding */
}
<div className="pb-24" />;
```

## Accessibility Checklist

For every component, verify:

- [ ] Semantic HTML (`<button>`, `<nav>`, `<main>`, `<header>`, `<dialog>`)
- [ ] `aria-label` or visible text for all interactive elements
- [ ] `aria-current="page"` on active nav items
- [ ] `aria-invalid` and `aria-describedby` on form fields with errors
- [ ] `role="dialog"` and `aria-modal="true"` on modals/sheets
- [ ] `focus-visible:ring-2` on all focusable elements
- [ ] Color contrast ratio ≥ 4.5:1 for text, ≥ 3:1 for large text
- [ ] Keyboard tab order follows visual order
- [ ] Skip links for long pages
- [ ] `aria-hidden="true"` on decorative elements and skeleton loaders
- [ ] `prefers-reduced-motion` respected via `motion-reduce:` prefix

## Typography Scale

Use a consistent mobile-optimized type scale:

| Role         | Class                         | Size |
| ------------ | ----------------------------- | ---- |
| Page title   | text-2xl font-bold            | 24px |
| Section head | text-lg font-semibold         | 18px |
| Body         | text-base                     | 16px |
| Secondary    | text-sm text-muted-foreground | 14px |
| Caption      | text-xs text-muted-foreground | 12px |
| Tab label    | text-[10px] font-medium       | 10px |

Never use `text-base` (16px) or smaller for `<input>` fields on iOS — Safari auto-zooms on inputs below 16px.

## Performance Rules

- Images: Use `next/image` with `sizes` prop. Use `loading="lazy"` for below-fold images. Serve WebP/AVIF.
- Lists: Use virtualization (`react-window` or `@tanstack/react-virtual`) for lists > 50 items.
- Memoization: Wrap expensive renders in `React.memo()`. Use `useMemo`/`useCallback` for computed values and handlers passed as props.
- Bundle: Lazy-load heavy components with `next/dynamic` or `React.lazy()`.
- Fonts: Use `next/font` with `display: swap`. Subset to Latin if possible.
- Animations: Prefer CSS transitions over JS-driven animation. Use `will-change` sparingly.
- Touch events: Debounce scroll/resize handlers. Use `passive: true` on touch listeners.

## File Organization

```text
src/
├── components/
│   ├── ui/           # Primitive components (Button, Input, Card, Skeleton)
│   ├── layout/       # Page shells, navigation (MobilePage, BottomTabBar)
│   ├── overlays/     # Modals, sheets, toasts (BottomSheet, Toast)
│   └── patterns/     # Composite patterns (PullToRefresh, ListItem)
├── app/
│   ├── layout.tsx    # Root layout with viewport meta, safe areas
│   ├── page.tsx      # Home
│   └── [route]/
│       └── page.tsx
└── styles/
    └── globals.css   # Tailwind directives, CSS custom properties, safe-area vars
```

## When Generating a Mobile Page

Start with `<MobilePage>` shell
Fill header with back button (if nested) + title + optional action icon
Build content mobile-first: single column, full-width cards, generous spacing
Add bottom nav OR fixed bottom CTA (never both simultaneously)
Add skeleton loaders for async content
Add error and empty states
Run through the accessibility checklist above
Test at 375px (iPhone SE), 390px (iPhone 15), and 768px (iPad mini)

## Anti-Patterns to Avoid

- ❌ Hover-only interactions with no tap/press equivalent
- ❌ Small text links without expanded tap targets
- ❌ Fixed headers taller than 56px on mobile
- ❌ Horizontal scroll without visual overflow indicators
- ❌ Nested scroll containers without clear boundaries
- ❌ Input font size < 16px (triggers Safari zoom)
- ❌ Using 100vh (use 100dvh or min-h-dvh for dynamic viewport)
- ❌ Z-index wars — use a defined scale: content(1-9), header(40), overlay(50), toast(60)
- ❌ Global scroll lock without restoring scroll position
- ❌ Generic "AI slop" aesthetics — pick a real design direction
