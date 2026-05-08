# AegisFlow AI Design System

AI-powered flood monitoring & disaster response platform for Southeast Asian cities.
Modern SaaS aesthetic — trust-focused, data-rich, real-time.

---

## Colors

### Brand Palette (Purple)
- **Brand 50** (#f4f3ff): Lightest tint, subtle backgrounds
- **Brand 100** (#ebe9fe): Hover states, light fills
- **Brand 200** (#d9d6fe): Borders on active elements
- **Brand 300** (#bdb4fe): Tags, soft badges
- **Brand 400** (#9b8afb): Secondary accents
- **Brand 500** (#7a5af8): Primary brand — buttons, links, active states
- **Brand 600** (#6938ef): Hover on primary buttons
- **Brand 700** (#5925dc): Pressed/active state
- **Brand 800** (#4a1fb8): Dark accents
- **Brand 900** (#3e1a9b): Darkest brand tone

### Semantic Colors
- **Success** (#17b26a): Positive states, system online, safe zones
- **Warning** (#f79009): Caution alerts, moderate risk
- **Danger** (#f04438): Critical alerts, high flood risk, errors

### Light Theme
- **Background** (#fafafa): Near-white page background
- **Foreground** (#1a1625): Near-black text with purple tint
- **Card** (#ffffff): Pure white cards and surfaces
- **Primary** (#7a5af8): Vibrant purple — main interactive color
- **Primary Foreground** (#fafafa): White text on primary fills
- **Secondary** (#f5f3ff): Very light purple-gray — secondary surfaces
- **Muted Foreground** (#6b6183): Medium gray — captions, placeholders
- **Border** (#e8e5f0): Subtle purple-tinted border

### Dark Theme
- **Background** (#0f0d18): Very dark blue-purple
- **Foreground** (#eae8f0): Off-white text
- **Card** (#1a1728): Slightly lighter than background
- **Primary** (#9b8afb): Brighter purple for dark surfaces
- **Border** (#2d2a3d): Subtle dark border
- **Muted** (#231f35): Dark muted surface

---

## Typography

### Font Families
- **Body**: Inter (Latin + Vietnamese) — clean, neutral, excellent readability
- **Headings**: Plus Jakarta Sans (Latin + Vietnamese) — geometric, modern, tight tracking
- **Code**: Geist Mono — developer-facing content only

### Styles
- **Display**: Plus Jakarta Sans, 48–64px, Bold, tracking -0.02em
- **H1**: Plus Jakarta Sans, 36–48px, Bold, tracking -0.02em
- **H2**: Plus Jakarta Sans, 28–36px, Bold, tracking -0.02em
- **H3**: Plus Jakarta Sans, 20–24px, Bold, tracking -0.01em
- **Body**: Inter, 14–16px, Regular, line-height 1.6
- **Body Small**: Inter, 13px, Regular
- **Caption**: Inter, 12px, Medium, muted foreground
- **Label**: Inter, 11px, Semibold, uppercase tracking 0.05em

---

## Spacing

### Base Unit: 4px
- **xs**: 4px — tight inline gaps
- **sm**: 8px — icon-to-text, compact padding
- **md**: 16px — default padding, card body
- **lg**: 24px — section inner padding
- **xl**: 32px — between content groups
- **2xl**: 48px — major section breaks
- **3xl**: 64px — hero/section vertical spacing

### Container
- Max width: container (1280px)
- Horizontal padding: 16px mobile, 24px desktop

---

## Border Radius

- **Base**: 10px (0.625rem)
- **sm**: 6px — small tags, badges
- **md**: 8px — inputs, small buttons
- **lg**: 10px — cards, dialogs
- **xl**: 14px — large cards, panels
- **2xl**: 18px — hero elements
- **full**: 9999px — pills, avatar, CTA buttons

---

## Shadows

- **sm**: 0 1px 2px rgba(0,0,0,.05) — subtle lift
- **md**: 0 4px 12px rgba(0,0,0,.08) — cards, dropdowns
- **lg**: 0 12px 32px -4px rgba(0,0,0,.15) — modals, popups
- **primary-glow**: 0 4px 14px rgba(122,90,248,.25) — CTA buttons

---

## Animations

- **fade-in-up**: translateY(12px→0) + opacity 0→1, 0.5s ease-out — scroll reveal
- **float**: translateY(0→-8px→0), 3s infinite — decorative elements
- **pulse-dot**: scale(1→1.4→1) + opacity, 1.8s infinite — status indicators
- **glow-pulse-red**: box-shadow pulsing red, 2s infinite — critical alerts
- **Stagger delays**: 0.1s increments (delay-1 through delay-5)

---

## Components

### Buttons
- **Primary CTA**: bg brand-500, white text, rounded-full, px-24px py-10px, font-semibold, shadow primary-glow. Hover: brand-600.
- **Secondary**: bg transparent, border border-border, rounded-xl, font-semibold. Hover: bg secondary.
- **Ghost**: no border, no bg. Hover: bg muted.
- **Destructive**: bg danger, white text, rounded-xl.

### Cards
- White bg (card color), 1px border-border, rounded-xl (14px), 16–24px padding.
- Hover: translateY(-2px), shadow-md.
- Dark mode: card bg #1a1728, border #2d2a3d.

### Badges / Tags
- Rounded-full pill shape, text-xs font-medium, px-12px py-4px.
- Variants: outline (border + text color), filled (bg + white text).
- Role badge: brand-100 bg, brand-600 text.

### Inputs
- Height 40px, border border-border, rounded-md (8px), px-12px.
- Focus: ring-2 ring-primary/50, border-primary.

### Status Indicator
- Dot: 6px circle, bg-success, animate-pulse.
- Pill: rounded-full, bg-success/10, border-success/20, text-success, text-xs.

### Avatar
- Circle, sizes: 28px (inline), 40px (default), 64px (profile).
- Fallback: bg-primary/10, text-primary, font-bold initial.

### Navigation Header
- Fixed top, z-50, full-width.
- Default: bg-transparent, py-20px, border-transparent.
- Scrolled: bg-background/80, backdrop-blur-md, py-12px, border-border, shadow-sm.
- Logo: 40×40 image + "AegisFlow AI" (AI word in primary color).
- Nav links: text-sm font-medium muted-foreground, hover: text-primary.

### Footer
- bg-muted/30, pt-64px pb-32px, border-t.
- 5-column grid: 2-col brand + 3 link columns.
- Section headers: uppercase, tracking-wider, font-bold, text-sm.
- Links: text-sm muted-foreground, hover: text-primary + translateX(4px).
- Social icons: 36px circle, border, hover: border-primary + text-primary.
- System status pill: emerald dot + "Optimal" text in bottom-right.

---

## Visual Effects

- **Glassmorphism**: bg-background/80 + backdrop-blur-md — header, overlays
- **Gradient text**: bg-clip-text text-transparent bg-gradient-to-r — hero headings
- **Hover lift**: translateY(-2px) + shadow increase — interactive cards
- **Link hover**: translateX(4px) — footer/nav links

---

## Layout Patterns

- **Fixed header** with scroll-aware transparency
- **Main content**: flex-1, pt-80px (offset for fixed header)
- **Footer**: full-width, muted background, multi-column grid
- **Container**: centered, max-width 1280px, px-16/24
- **Section spacing**: py-64–96px between major sections
- **Grid**: 1 col mobile → 2 col tablet → 3–4 col desktop, gap-20–48px

---

## Dark Mode

- Enabled via `class` strategy (next-themes), default: light, system-aware
- All semantic colors have dark variants (see Colors section)
- Cards/surfaces slightly lighter than background for depth
- Primary purple brightens in dark mode for contrast
- Borders and muted tones shift to darker values

---

## Icons

- **Library**: Lucide React
- **Default size**: 16–20px
- **Stroke**: 2px (default)
- **Color**: currentColor (inherits text color)

---

## Charts & Data Visualization

- **Library**: Recharts
- **Chart palette**: brand-500, success, warning, chart-2 through chart-5
- **Style**: rounded bar corners, smooth line curves, subtle grid lines

---

## Maps

- **Libraries**: Leaflet + MapLibre GL
- **Popups**: rounded-xl (12px), shadow-lg, custom close button
- **Controls**: rounded-xl, shadow-md, 36px touch targets
- **Dark mode**: dark tile layer + dark popup styling

---

## Design Principles

1. **Trust first** — shield icons, verified badges, status indicators build confidence
2. **Data density** — show numbers, charts, real-time indicators; users need information
3. **Mobile-first** — responsive from 320px up; bottom sheets for mobile interactions
4. **Accessibility** — OKLCH colors for perceptual uniformity; sufficient contrast ratios
5. **Bilingual** — Vietnamese primary, English secondary; UI must work in both
6. **Real-time feel** — pulse animations, live dots, WebSocket-driven updates
