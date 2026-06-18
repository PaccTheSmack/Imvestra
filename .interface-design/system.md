# Imvestra — Interface Design System

## Intent

**Who:** German private real estate investor, 30–55. Has 1–10 properties. Checks the app between client calls, at a desk, in the morning with coffee. Not a developer — but financially literate and detail-oriented.

**Task:** Know where the money is going. Catch problems before they become expensive. Make a confident decision on the next deal.

**Feel:** Cold and precise like a trading terminal. Not warm. Not "friendly SaaS". The product earns trust through density and accuracy, not illustration and gradients.

---

## Domain

**Concepts from the product's world:** Cashflow, LTV, Zinsbindung, Anlage V, Nettomietrendite, Abschreibung, Eigenkapital, NOI, Restschuld, Tilgung, Verhandlungsspielraum, Exposé, Maklerprovision, Grunderwerbsteuer.

**Color world — what would you see in this domain's physical space?** Dark trading screens. Black leather portfolio folders. White paper with black numbers. Green ink for positive cashflows. Red for alerts. The occasional amber warning light. Muted steel-blue of a bank's meeting room.

**Signature element:** Every financial number renders in JetBrains Mono with `tabular-nums` — not because it's trendy but because misaligned decimal columns cost deals. The monospace number is the product's visual fingerprint.

**Defaults rejected:**
- Generic sidebar with colorful icons → minimal sidebar, icons secondary to labels, active state = accent border only
- Hero metric card with gradient glow → flat surface, number dominates, no decoration
- Feature tiles with identical height/icon/text → bento grid, varied sizes, content-driven structure

---

## Depth Strategy

**Borders-only.** No decorative drop shadows. Elevation = slightly lighter background, never a shadow. This feels technical, dense, precise — matching the domain.

Exception: floating overlays (modals, command palette) use deep shadows (`0 32px 80px rgba(0,0,0,0.9)`) to separate from content.

---

## Token System

```
Background:     #080808  — near-black, the trading terminal
Surface:        #141414  — cards, panels
Surface Hover:  #1A1A1A  — hover state, subtle lift
Surface Active: #1F1F1F  — selected/active background
Border:         rgba(255,255,255,0.07)   — standard separation, invisible until needed
Border Strong:  rgba(255,255,255,0.12)   — emphasis
Border Accent:  rgba(0,224,215,0.25)     — focus / active
Accent:         #00E0D7  — UI elements, positive values, active nav, CTAs
Warning:        #FFB800  — never used for positives
Danger:         #FF4444  — never used for positives
Positive:       #22C55E  — cashflow positive, gains
Text:           #FFFFFF
Text Muted:     #777777
Text Subtle:    #666666
```

**Rule:** `#00E0D7` only on: UI chrome (active nav, borders, buttons, badges) and genuinely positive financial values. Never on neutral/mixed data.

---

## Typography

**Sans:** Plus Jakarta Sans — semi-geometric, professional, slightly warmer than Inter. Used for all UI text, labels, headings.

**Mono:** JetBrains Mono — all financial numbers via global `.tabular-nums` class. `font-feature-settings: "tnum" 1, "zero" 1`. Never touch individual components — the CSS class handles it globally.

**Scale:**
- Hero metric: 52px, `tracking-[-0.04em]`, `font-semibold`
- Section heading: 28px, `tracking-[-0.03em]`, `font-semibold`
- Card heading: 13px, `font-semibold`, `tracking-[-0.01em]`
- Label: 11px, `font-semibold`, `uppercase`, `tracking-[0.08em]`
- Body: 14px, `leading-relaxed`
- Caption: 12px, `text-muted`

---

## Spacing Base Unit: 4px

Scale: 4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64

Component padding: `px-5 py-4` (20/16) for cards, `px-6 py-7` for hero sections.

---

## Border Radius Scale

- Input, badge, small pill: `rounded-[6px]`
- Button: `rounded-[8px]` (md), `rounded-[10px]` (lg)
- Card, panel: `rounded-[14px]` to `rounded-[16px]`
- Modal, large sheet: `rounded-[20px]`
- Full pill: tags, status chips

---

## Navigation

Sidebar same background (`#0C0C0C`, 1px border right) as main canvas. Active state: accent color text + `rgba(0,224,215,0.06)` background + `rgba(0,224,215,0.12)` border. No colorful icons. Collapsed state preserves icon-only navigation.

---

## Component Patterns

### KPI / Metric Display
```
Label: 11px uppercase tracking-[0.08em] text-subtle
Value: tabular-nums, size depends on prominence
Delta: TrendUp/TrendDown icon + signed value, colored green/red
```

### Card
```
bg: tokens.color.surface
border: 1px solid tokens.color.border
radius: 14-16px
padding: px-5 py-5 or px-6 py-6
hover: whileHover y:-3, borderColor: tokens.color.borderAccent, boxShadow: tokens.shadow.accent
```

### Empty State
Ghost preview pattern: real content at blur(1.5px) opacity 0.3, pointer-events-none. Floating icon (animated y:[0,-8,0]). One CTA.

### Status Badges
- Positive cashflow: `bg: positiveBg, text: positive, border: rgba(34,197,94,0.2)`
- Alert/warning: `bg: warningBg, text: warning`
- Error: `bg: dangerBg, text: danger`
- Neutral: `bg: surfaceHover, text: textSubtle`

---

## Animation

**Motion library:** `motion/react` — import from `"motion/react"` only. Never `framer-motion`.

**Entrance:** `FadeIn` component, `useInView`, `once: true`. Stagger: 0.06s between siblings.

**Hover on cards:** `whileHover={{ y: -3 }}` + accent border + glow shadow. Spring: `stiffness:300, damping:25`.

**Button tap:** `whileTap={{ scale: 0.97 }}`. No hover scale — primary gets `y:-1` only.

**Number animation:** `CountUp` via `useMotionValue + animate`, duration 1.4–1.6s, ease `[0.16, 1, 0.3, 1]`.

**Progress/LTV bars:** `initial={{ width: 0 }}`, mount-triggered, duration 1.0s.

**Always:** `useReducedMotion()` respected. No animation if `prefersReduced`.

---

## Toast

Sonner (`sonner` package). `toast()` imported from `lib/toast.ts` (re-exports sonner). `<Toaster />` mounted in `app/layout.tsx`. Theme dark, richColors.

---

## Icons

`@phosphor-icons/react` exclusively. Never `lucide-react`. One family, consistent `size={16}` default for UI icons, `size={18}` for card icons, `size={13}` for inline/label icons.
