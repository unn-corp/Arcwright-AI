# conversion-landing-local-business

**description:** Conversion-optimized landing page patterns for local service businesses (plumbers, HVAC, electricians, contractors, home services). Use when building marketing sites, service pages, city pages, or any lead-gen landing page for a service-area business.

---

## 1. When to Use This Pack

Load this pack when the project is any of:

- A local service business marketing site (plumbing, HVAC, electrical, roofing, landscaping, pest control, etc.)
- A city / service-area landing page targeting geo-specific search traffic
- A lead-gen or home-services page where the primary KPI is phone calls or form submissions
- A contractor or tradesperson site where trust signals and urgency drive conversions

---

## 2. Page Types & Templates

### Homepage

- **H1 formula:** `[Primary Service] in [City] | [Brand Differentiator]`
  - Example: `Cincinnati's Trusted Plumbing & Drain Cleaning Company`
  - Include city name in H1 — it is a local ranking signal
- **Above-fold mobile essentials** (see Section 3 for full checklist)
- **Structure order:** Hero (H1 + subhead + CTA pair) → Trust bar (badges + rating) → Services grid → Social proof (reviews) → About/Why Us → Service area map → Final CTA + phone

### City Pages

One page per city or suburb served. Never share body content across city pages.

| Element | Requirement |
|---|---|
| Title tag | `[Service] in [City, State] \| [Brand]` — e.g. `AC Repair in Mason, Ohio \| CoolBreeze HVAC` |
| H1 | Match the dominant search query, include city |
| Body content | UNIQUE per city — mention neighborhoods, landmarks, housing stock (older homes, slab foundations, etc.) |
| Photos | Real job photos from that city, not stock |
| CTA | Click-to-call + contact form above the fold |
| Reviews | Embed 2-3 reviews from customers in that city |

**Anti-pattern:** Never "duplicate and swap city name." Google detects thin city pages and devalues the entire domain.

### Service Pages

One page per distinct service. Cover all five content blocks:

1. **What it is** — plain-English explanation (no jargon)
2. **Signs you need it** — symptom list the homeowner Googled
3. **Our process** — numbered steps, demystifies the service call
4. **Time + cost** — realistic ranges build trust; vague answers lose leads
5. **Social proof** — 2-3 reviews specific to THIS service, not generic praise
6. **CTA** — "Schedule [Service Name]" button + phone number

---

## 3. Above-the-Fold Mobile Checklist (3-Second Decision)

A visitor decides in 3 seconds whether to call or bounce. Every item below must be visible without scrolling on a 375px screen:

- [ ] Business name (legible, not overshadowed by hero image)
- [ ] What you do + where (one sentence: "Emergency plumbing repair serving greater Columbus, OH")
- [ ] **Tap-to-call button** — `<a href="tel:+15551234567">` styled as a primary CTA, minimum 48px height
- [ ] **Book online button** — secondary CTA alongside the phone button
- [ ] Star rating + review count (e.g. "★ 4.9 · 312 Google reviews")
- [ ] Trust badges (licensed & insured, BBB accredited, Google Guaranteed, years in business)

---

## 4. Conversion Components

### Sticky Tap-to-Call

Phone must be reachable without scrolling — always:

```html
<!-- Sticky mobile call bar — fixed to bottom on mobile, hidden on desktop -->
<div class="fixed bottom-0 inset-x-0 z-50 md:hidden bg-brand-600 text-white">
  <a
    href="tel:+15551234567"
    class="flex items-center justify-center gap-2 py-4 text-lg font-semibold min-h-[56px]"
    aria-label="Call us now: (555) 123-4567"
  >
    <!-- Phone icon (SVG) -->
    <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
      <path stroke-linecap="round" stroke-linejoin="round"
        d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 6.75z"/>
    </svg>
    Call Now — (555) 123-4567
  </a>
</div>
<!-- Add pb-16 md:pb-0 to page body to prevent content hiding behind bar -->
```

Rules:
- Phone number must be **visually larger than the logo** on mobile
- Use brand color (high contrast) — not a muted secondary color
- Keyboard-accessible: `<a href="tel:...">` is natively focusable; no extra `tabindex` needed

### Online Booking

- Present on every page, not gated behind "contact us"
- Options in order of preference: embedded scheduling widget (Housecall Pro, ServiceTitan, Calendly) → contact form with date/time field → clear phone CTA
- Never call-only — customers booking outside business hours will bounce without a form

### Social Proof Placement

| Where | What |
|---|---|
| Above the fold | Star rating badge + total review count |
| Service pages | 2-3 reviews mentioning that specific service |
| City pages | 2-3 reviews from customers in that city/suburb |
| Homepage | Full review carousel below the hero |
| Footer | G2/BBB/Google Guaranteed badge row |

Embed reviews as real HTML content (not iframes where possible) so the text is crawlable by search engines.

---

## 5. Technical & SEO Requirements

### JSON-LD Schema

Include on every page. Minimum: `LocalBusiness` + `AggregateRating`. Add `Service` on service pages.

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "LocalBusiness",
      "@id": "https://example.com/#business",
      "name": "Reliable Plumbing Co.",
      "description": "Licensed plumbers serving Cincinnati and surrounding areas since 2008.",
      "url": "https://example.com",
      "telephone": "+15551234567",
      "email": "info@example.com",
      "logo": "https://example.com/images/logo.png",
      "image": "https://example.com/images/team.jpg",
      "priceRange": "$$",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "123 Main St",
        "addressLocality": "Cincinnati",
        "addressRegion": "OH",
        "postalCode": "45202",
        "addressCountry": "US"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": 39.1031,
        "longitude": -84.5120
      },
      "areaServed": [
        { "@type": "City", "name": "Cincinnati" },
        { "@type": "City", "name": "Mason" },
        { "@type": "City", "name": "Blue Ash" }
      ],
      "openingHoursSpecification": [
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday"],
          "opens": "07:00",
          "closes": "19:00"
        },
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": ["Saturday"],
          "opens": "08:00",
          "closes": "16:00"
        }
      ],
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "reviewCount": "312",
        "bestRating": "5",
        "worstRating": "1"
      }
    },
    {
      "@type": "Service",
      "@id": "https://example.com/services/drain-cleaning/#service",
      "name": "Drain Cleaning",
      "provider": { "@id": "https://example.com/#business" },
      "areaServed": { "@type": "City", "name": "Cincinnati" },
      "description": "Professional hydro-jetting and drain snaking for clogged sinks, toilets, and main lines.",
      "offers": {
        "@type": "Offer",
        "priceSpecification": {
          "@type": "PriceSpecification",
          "priceCurrency": "USD",
          "minPrice": "129",
          "maxPrice": "450"
        }
      }
    }
  ]
}
```

Place the `<script type="application/ld+json">` tag in the `<head>`. On Next.js use a `<Script>` component with `strategy="beforeInteractive"` or inline in the page's `<head>` via metadata.

### Performance

| Requirement | Target | Why it matters |
|---|---|---|
| Mobile traffic share | 70%+ of visitors | Design and test mobile-first |
| Mobile LCP | < 3s | Direct Google ranking factor for local pack |
| Hero image | WebP/AVIF, `width`+`height` set, `fetchpriority="high"` | Prevents layout shift + LCP penalty |
| Total page weight | < 500KB initial | Slow loads = bounced phone calls |
| No render-blocking scripts | Defer/async all non-critical JS | Booking widgets are often the culprit |

### Touch & Accessibility

- Minimum touch target: **44×44px** (phone number links, form buttons, nav items)
- `<a href="tel:...">` must be keyboard-focusable and have a visible focus ring
- All form fields need `<label>` elements — screen readers and autofill both rely on them
- Contrast ratio ≥ 4.5:1 for body text; ≥ 3:1 for large headings

---

## 6. Anti-Patterns

| Anti-pattern | Impact | Fix |
|---|---|---|
| Generic "Welcome to [Company Name]" H1 hero | Zero SEO value, zero specificity | H1 = service + city, always |
| Testimonials buried in navigation or footer only | Visitors make trust decisions above the fold | Star rating + count visible on first screen |
| One "Services" page listing 15 bullets | Can't rank for individual service terms | Dedicated page per service |
| Duplicate city pages (swap city name only) | Google thin-content penalty, deindexing risk | Unique content per city — neighborhoods, photos, local context |
| Phone number smaller than or equal to logo size | Kills the primary conversion action on mobile | Phone CTA must be the most prominent element above the fold |
| Call-only with no online booking option | Loses leads contacting outside business hours | Always offer an async form or scheduling widget |
| Social proof visible only after scrolling | Trust signals arrive too late — visitor already bounced | Star rating + badge in the hero, above the fold |
| `100vh` hero on mobile | Content clipped by browser chrome | Use `100dvh` or `min-h-dvh` |
| Stock photos throughout | Generic, untrustworthy to local visitors | Real job photos; if unavailable, use team/truck photos |
| No `areaServed` in schema | Search engine can't confirm geo-relevance | Always list served cities in `LocalBusiness` schema |
