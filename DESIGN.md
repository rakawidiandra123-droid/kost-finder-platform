# Design Brief

## Direction

KOSTKU — a calm, trustworthy catalog for finding and booking boarding-house rooms in Indonesia.

## Tone

Cool Serene refined editorial — airy, cool off-white surfaces with a deep ocean-teal anchor; confident and premium, never rustic real-estate.

## Differentiation

Deep ocean-teal primary paired with a warm amber accent reserved for price and availability, over generous whitespace and a monospace price rhythm — a property catalog that reads like a well-set magazine, not a listings dump.

## Color Palette

| Token      | OKLCH       | Role                                       |
| ---------- | ----------- | ------------------------------------------ |
| background | 0.98 0.006 220 | Cool off-white page canvas               |
| foreground | 0.19 0.02 225  | Primary text, headings                    |
| card       | 1.0 0.003 220  | Elevated room cards and surfaces          |
| primary    | 0.42 0.09 215  | Deep ocean teal — CTAs, nav, active states |
| accent     | 0.76 0.15 72   | Warm amber — price tags, availability     |
| muted      | 0.945 0.011 220 | Section alternation, occupied rooms      |
| success    | 0.58 0.14 158  | "Tersedia" availability badge             |
| destructive | 0.55 0.21 25  | Errors, destructive admin actions          |

## Typography

- Display: Space Grotesk — hero headline, section headings, room names
- Body: General Sans — paragraphs, UI labels, navigation, forms
- Mono: Geist Mono — prices (`Rp 1.500.000 / bulan`), room numbers, status codes
- Scale: hero `text-4xl md:text-6xl font-bold tracking-tight`, h2 `text-2xl md:text-4xl font-bold tracking-tight`, label `text-sm font-semibold tracking-widest uppercase`, body `text-base md:text-lg`

## Elevation & Depth

Flat cool canvas with layered white cards; depth via `shadow-subtle` at rest and `shadow-elevated` on hover, plus 1px `border-border` hairlines — no heavy drop shadows.

## Structural Zones

| Zone    | Background          | Border      | Notes                                            |
| ------- | ------------------- | ----------- | ------------------------------------------------ |
| Header  | `bg-card`           | `border-b`  | Sticky nav, teal "Masuk Admin" button            |
| Content | `bg-background`     | —           | Alternate `bg-muted/40` every other section      |
| Footer  | `bg-muted/40`       | `border-t`  | Contact + brand, muted-foreground text           |

## Spacing & Rhythm

Sections separated by `py-16 md:py-24`; content container max-w-7xl with `px-4 md:px-8`; card grids `gap-6`; micro-spacing in 4px increments with comfortable card padding `p-5`.

## Component Patterns

- Buttons: `rounded-lg`, primary teal fill with `hover:bg-primary/90`, secondary outline, `transition-smooth`, focus `ring-2 ring-ring`
- Cards: `rounded-xl bg-card border border-border shadow-subtle`, hover `shadow-elevated` + slight lift; occupied rooms desaturated with `bg-muted/50`
- Badges: pill `rounded-full px-3 py-1 text-xs font-semibold` — amber for price, success-green for "Tersedia", muted for "Terisi"

## Motion

- Entrance: `animate-fade-up` staggered across listing cards on load (0.5s cubic-bezier)
- Hover: cards lift with `shadow-elevated` and `-translate-y-1` over 0.3s; buttons darken fill
- Decorative: `animate-fade-in` for hero copy; no looping or bouncy motion

## Constraints

- All UI copy in Bahasa Indonesia
- No online payment, tenant contracts, reviews, chat, multi-location, availability calendar, or WhatsApp buttons
- No raw color literals or arbitrary color classes — semantic tokens only
- AA+ contrast in light and dark; body text ≥ 4.5:1

## Signature Detail

Monospace price typography (`Geist Mono`) set against the geometric display font — every price reads as a precise, scannable figure, giving the catalog a distinctive editorial-tech rhythm.
