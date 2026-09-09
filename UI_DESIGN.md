# AeroLogistics Operational Console — UI Design Specification

**Product:** Aviation Log Entry, AWB Tagging & Multi-Tenant Cargo Tracking
**Version:** v1.0.0 · console redesign (`feat/console-redesign`, merged to `main`)
**Stack:** React 19 · TypeScript · Vite 6 · Tailwind CSS v4 (`@theme`) · Supabase · Dexie (offline IndexedDB) · Material Symbols Outlined (self-hosted) · qrcode.react · vite-plugin-pwa

> Supersedes the pre-redesign spec. Changes: Material‑3 derived **dual-theme** token
> system, **Material Symbols** icons replacing lucide-react, and a **floating
> sidebar shell** (persistent left rail + sticky glass header + per-view telemetry
> strip) replacing the top tab-pill navigation.

---

## 1. Design Language

An **operations console / instrument panel** aesthetic for airport cargo desks.
Floating rounded panels on a low-elevation ground, a fixed left rail that reads as
a device bezel, monospace for every piece of operational data, and a single gold
accent used only for primary actions, the active nav item, and key figures.

- **Dark-first**, but every role is fully specified for **light** too. Dark is
  "obsidian console"; light is a warm-paper neutral ramp.
- **Token-only color.** No hard-coded hex in components — every surface, text,
  border and status color is a CSS custom property that flips per theme.
- **Elevation goes *up* from the ground.** The page is the darkest/most-recessed
  surface; panels sit one step above; nested sub-cards sit one step below their
  panel. Nesting is capped at two levels.
- **Glow in dark, shadow in light.** `shadow-glow*` utilities resolve to a real
  amber bloom in dark and to a plain drop shadow in light; the ambient orb
  (`.panel-orb`) is invisible in light.
- **Dense but legible.** `text-xs`/`text-sm` body, compact padding, and a strict
  5-step icon scale. Long Nigerian entity names / addresses were the sizing
  constraint — sidebar is 16rem (collapsible), panel padding is 16px.

---

## 2. Theme & Design Tokens  (`src/index.css`)

### 2.1 Mechanism
- Class-based dark mode on `<html>`: `.dark` / `.light`. Tailwind v4
  `@custom-variant dark (&:where(.dark, .dark *))`.
- Boot script in `index.html` reads `localStorage['aerolog-theme']` (default
  `dark`) before first paint — no flash.
- `useTheme()` toggles + persists, animating the swap with the **View Transitions
  API** where supported (respects `prefers-reduced-motion`).
- All role names are registered as Tailwind utilities in the `@theme` block and
  backed by custom properties redefined in the two palette blocks
  (`:root, :root.light` and `:root.dark`).

### 2.2 Surface / elevation ramp (Material-3 roles)

| Role | Utility | Light | Dark |
|---|---|---|---|
| Page ground | `bg-surface-container-lowest` | `#f5f2e9` | `#0c0e14` |
| Panel | `bg-surface-container-low` | `#fdfbf4` | `#191b22` |
| Nested / inset | `bg-surface-container` | `#f1ede1` | `#1e1f26` |
| Raised chip | `bg-surface-container-high` | `#ebe7da` | `#282a30` |
| Highest | `bg-surface-container-highest` | `#e5e1d3` | `#33343b` |
| Flat surface | `bg-surface` | `#fdfbf4` | `#111319` |
| Bright | `bg-surface-bright` | `#fdfbf4` | `#373940` |
| Inverse | `bg-inverse-surface` / `text-inverse-on-surface` | `#31302b` / `#f4f0e8` | `#e2e2eb` / `#2e3037` |

**Legacy aliases** (kept, re-pointed at the ramp so pre-redesign screens adopt
the new look with no edits): `canvas`, `surface-sunken`, `surface-1/2/3`,
`surface-hover`, `surface-card`, `surface-card-glass`.

### 2.3 Text roles

| Utility | Light | Dark |
|---|---|---|
| `text-on-surface` / `text-foreground` | `#1c1b16` | `#e2e2eb` / `#e6e4ec` |
| `text-on-surface-variant` / `text-text-secondary` | `#4b4639` / `#3a362c` | `#d3c5ac` / `#cabfa8` |
| `text-muted` | `#5f5949` | `#a29a86` |
| `text-light-muted` | `#7d7767` | `#bcb39d` |
| `text-text-disabled` | `#9c9584` | `#6f6a5c` |

### 2.4 Brand & action

| Utility | Light | Dark | Notes |
|---|---|---|---|
| `bg-primary-container` / `text-on-primary-container` | `#f59e0b` / `#3d2b00` | `#fbbf24` / `#543f00` | **brand constant** — bold amber CTA in both themes |
| `text-primary` | `#7a5900` | `#ffe1a7` | amber-as-text |
| `text-accent-amber` / `bg-accent-amber` | `#f59e0b` | `#fbbf24` | legacy alias, still the accent everywhere |
| `accent-amber-hover` | `#d97706` | `#f59e0b` | |
| `secondary` / `secondary-container` / `on-secondary-container` | `#2f5fb0` / `#dbe6ff` / `#12326b` | `#adc6ff` / `#0566d9` / `#e6ecff` | |
| `tertiary` / `tertiary-container` / `on-tertiary-container` | `#1f7a3d` / `#b8f0c6` / `#0b4d22` | `#78ff96` / `#4ce378` / `#00391a` | |
| `accent-cobalt` | `#2f5fb0` | `#adc6ff` | |

### 2.5 Status system (7 tones: `success · error · warning · info · amber · purple · neutral`)

Solid color + a **tint set** (`-bg`, `-border`, `-fg`). Light = dense pastel bg +
dark text; dark = ~12–13% translucent bg + luminous text. Sample:

| | Light `bg / border / fg` | Dark `bg / border / fg` |
|---|---|---|
| success | `#dcf5e3 / #a6e0b8 / #17632f` | `rgba(76,227,120,.12) / .30 / #6bffa0` |
| error | `#f9dedc / #f2b8b5 / #a01b14` | `rgba(255,84,73,.13) / .32 / #ffb4ab` |
| warning | `#fdecd8 / #f5c98f / #92450a` | `rgba(249,115,22,.13) / .30 / #fdba74` |
| info | `#dee8ff / #b6ccff / #234f95` | `rgba(173,198,255,.12) / .30 / #c4d5ff` |
| amber | `#fdf0d0 / #f3d492 / #7a5900` | `rgba(251,191,36,.12) / .32 / #fbbf24` |
| purple | `#ece4fb / #cdb8f0 / #5a30ad` | `rgba(196,167,255,.13) / .30 / #d6c2ff` |
| neutral | `#eee9dd / #cfc6b3 / #56503f` | `rgba(211,197,172,.10) / .22 / #a8a08c` |

### 2.6 Borders & scrims

| Utility | Light | Dark |
|---|---|---|
| `border-border` | `rgba(28,27,22,.14)` | `rgba(211,197,172,.14)` |
| `border-border-subtle` | `rgba(28,27,22,.07)` | `rgba(211,197,172,.07)` |
| `border-border-strong` | `rgba(28,27,22,.26)` | `rgba(211,197,172,.28)` |
| `border-outline` | `#7d7767` | `#9c8f79` |
| `border-outline-variant` | `#cec6b3` | `#4f4633` |
| `outline-focus-ring` | `#2f5fb0` | `#adc6ff` |
| `bg-overlay` | `rgba(28,27,22,.45)` | `rgba(0,0,0,.70)` |

### 2.7 Elevation — shadows & glow

| Utility / var | Light | Dark |
|---|---|---|
| `shadow-panel` | `0 2px 10px -2px rgba(0,0,0,.08), 0 1px 3px …` | `0 12px 32px -8px rgba(0,0,0,.7)` |
| `shadow-glow` | *= plain shadow (no bloom)* | `0 0 16px -2px rgba(251,191,36,.35)` |
| `shadow-glow-strong` | `0 4px 18px -4px rgba(245,158,11,.28)` | `0 0 24px -4px rgba(251,191,36,.45)` |
| `--shadow-card` / `--shadow-elevated` / `--shadow-modal` | subtler | deeper |
| `--panel-glow-orb` (`.panel-orb::before`) | `transparent` | `rgba(251,191,36,.06)` |
| `--grain-opacity` | `0.015` | `0.04` |

`.panel-orb` = `position:relative; overflow:hidden` + a blurred 12rem amber orb
pinned top-right (`::before`). `.shadow-panel` / `.shadow-glow` / `.shadow-glow-strong`
are plain utility classes defined alongside.

### 2.8 Typography

- **Sans / display:** `Inter` (300–800) → UI + headlines.
- **Mono:** `JetBrains Mono` (400–800) → AWB numbers, weights, currency, PINs,
  dates, codes, KPI figures, station codes.
- **Icons:** `Material Symbols Outlined` — **self-hosted** via the
  `material-symbols` npm package (`@import "material-symbols/outlined.css"` in
  `index.css`; the woff2 is bundled + content-hashed by Vite and precached by the
  service worker, so icons render offline). Variable font: `FILL / wght / GRAD /
  opsz` axes.

Console type scale (`@theme` `--text-*` with line-height / weight / tracking):

| Utility | size / line-height / weight |
|---|---|
| `text-headline-xl` | 40 / 48 / 700 |
| `text-headline-lg` | 28 / 36 / 600 |
| `text-headline-md` | 20 / 28 / 600 |
| `text-body-lg` | 16 / 24 / 400 |
| `text-body-md` | 14 / 20 / 400 |
| `text-body-sm` | 12 / 16 / 400 |
| `text-label-caps` | 11 / 14 / 600 · `letter-spacing .08em` |
| `text-mono-data-xl` | 24 / 32 / 600 |
| `text-mono-data-md` | 14 / 20 / 500 |
| `text-mono-data-sm` | 12 / 16 / 500 |

Font-family utilities: `font-display`, `font-headline-lg`, `font-mono-data`,
`font-mono-data-xl/md/sm`, `font-label-caps` (all JetBrains Mono for the mono/caps
set). `font-label-caps text-label-caps` is the standard eyebrow / section-label
treatment; `font-mono-data-* text-mono-data-*` is standard for numeric data.

### 2.9 Radius
`--radius-xs 4 · sm 8 · md 12 · lg 16 · xl 20 · 2xl 24 · full 9999` (px). Panels &
cards `rounded-xl`, shell rails/header `rounded-xl`, modals `rounded-2xl`,
inputs/buttons `rounded-md`, chips/badges `rounded-sm|md`, icon tiles `rounded-lg|xl|2xl`.

### 2.10 Iconography — `<Icon>` + 5-step size scale

`src/components/ui/Icon.tsx` wraps the variable font:

```tsx
<Icon name="flight_takeoff" size={20} fill weight={400} grade={0} className="text-accent-amber" />
```

Renders `<span class="material-symbols-outlined" data-fill …>` with `fontSize`,
`width`, `height` = `size` and per-instance `font-variation-settings` (incl.
`opsz` clamped to 20–48). `aria-hidden` unless `title` is passed (then
`role="img"` + `aria-label`).

`ICON` scale (`src/lib/ui.ts`) — unchanged, still governs `size`:

| key | px | usage |
|---|---|---|
| `xs` | 12 | badges, inline metadata, chips |
| `sm` | 14 | secondary actions, table rows, input affixes |
| `md` | 16 | standard buttons, card headers, tabs |
| `lg` | 20 | section headers, primary actions, nav |
| `xl` | 24 | hero headers, modal icons, empty states |

**Glyph choices** are domain-specific and nav icons are kept disjoint from
in-screen section icons (fixes the earlier wayfinding collision). Notable picks:
`radar` (tracking), `barcode_scanner` (ramp scan), `scale` / `monitor_weight`
(weight), `account_balance` (B2B ledger), `sell` (rate cards),
`workspace_premium` (tiers), `rocket_launch` (onboarding), `point_of_sale`
(desk terminal), `gpp_maybe` (weight discrepancy), `receipt_long` (billing),
`gavel`-family for enforced rules. Active nav items render **filled** (`FILL 1`);
everything else outlined.

### 2.11 Motion
- `tw-animate-css` + `motion` package.
- Buttons `active:scale-[0.98]` + `transition-all`.
- Modals `animate-in fade-in zoom-in-95` 200ms; Sheets `slide-in-from-{bottom,right}` 300ms.
- Status dots `animate-pulse`; spinner = `progress_activity` glyph + `animate-spin`;
  sync pill spins only while `pendingSyncCount > 0`.
- Sidebar width & drawer transform `transition-[width,transform] duration-200`;
  content padding `transition-[padding] duration-200`.
- Theme switch = View Transitions cross-fade.

### 2.12 Base styles
`box-sizing:border-box` everywhere. `html, body` full-bleed on
`--color-surface-container-lowest`, Inter, 14/20. `:focus-visible` → `2px solid
var(--color-focus-ring)` offset 2. Custom 6px scrollbars; `.scrollbar-none`
utility. Body selection `bg-amber-500/30`.

---

## 3. App Shell  (`src/components/shell/`, wired in `src/App.tsx`)

```
┌ Sidebar (fixed, floating) ┐   ┌───────── content wrapper: p-3, lg:pl-[rail+gap] ─────────┐
│ ┌───────────────────────┐ │   │ ConsoleHeader  (sticky top-3, glass)                     │
│ │ AL  AEROLOGISTICS     │ │   ├─────────────────────────────────────────────────────────┤
│ │     CARGO CONSOLE     │ │   │ <main> max-w-[1600px] mx-auto                            │
│ │ HUB // LOS   [LAGOS…] │ │   │   TelemetryStrip: breadcrumb · title · subtitle · queue │
│ ├───────────────────────┤ │   │   ┌─────────────────────────────────────────────────┐  │
│ │ RAMP OPERATIONS       │ │   │   │ ErrorBoundary → active view (1 of 9)             │  │
│ │  ▸ Desk Terminal      │ │   │   └─────────────────────────────────────────────────┘  │
│ │  ▸ Manifest           │ │   └─────────────────────────────────────────────────────────┘
│ │  ▸ Ramp Scan  …       │ │
│ │ COMMERCIAL            │ │
│ │ PLATFORM             │ │
│ ├───────────────────────┤ │
│ │ ‹ COLLAPSE            │ │
│ │ OPS SUITE      v1.0.0 │ │
│ └───────────────────────┘ │
└───────────────────────────┘
```

**Root** (`App.tsx`): `min-h-screen bg-surface-container-lowest text-on-surface
font-sans`. Renders `<Sidebar>`, then a padded flex-column wrapper holding
`<ConsoleHeader>` + `<main>`, then the demo `<Modal>` / `<Sheet>` portals.

### 3.1 Sidebar (`Sidebar.tsx`)
- `fixed z-50 top-3 bottom-3 left-3 rounded-xl bg-surface-container-low/95
  backdrop-blur-2xl shadow-panel flex flex-col p-3`.
- **Width:** `lg:w-64` expanded ↔ `lg:w-[4.75rem]` collapsed (icon-only rail).
  State `sidebarCollapsed` persisted in `localStorage['aerolog-sidebar-collapsed']`.
- **Below `lg`:** off-canvas — base `w-64`, `-translate-x-[110%]` unless
  `mobileOpen`; a `z-40 bg-overlay backdrop-blur-sm lg:hidden` scrim closes it.
- **Brand block:** `AL` emblem tile (`bg-primary-container`, `shadow-glow`) +
  `AEROLOGISTICS` / `CARGO CONSOLE` label-caps; `HUB // LOS` mono + `LAGOS TERMINAL`
  amber chip on a border-top row. Collapsed → emblem only.
- **Nav:** grouped (`RAMP OPERATIONS` / `COMMERCIAL` / `PLATFORM`, group labels
  hidden when collapsed). Item = 20px `<Icon>` + `text-body-md` label. Active =
  `bg-primary-container text-on-primary-container font-bold shadow-glow` + filled
  icon; inactive = `text-on-surface-variant hover:bg-surface-container-high`.
  `aria-current="page"` on the active item; `title` tooltip when collapsed.
- **Footer (pinned):** `‹ COLLAPSE` toggle (desktop only) + `OPS SUITE / v1.0.0`
  card.

### 3.2 ConsoleHeader (`ConsoleHeader.tsx`)
- `sticky top-3 z-30 h-14 rounded-xl bg-surface-container-low/85 backdrop-blur-2xl
  shadow-panel px-3 sm:px-4 flex items-center justify-between`.
- **Left:** mobile hamburger (`menu`, `lg:hidden`) + `AEROLOGISTICS OPERATIONAL
  CONSOLE` (`font-mono-data-md`, shortens to `AEROLOGISTICS` under `sm`).
- **Right:** circular theme toggle (`light_mode`/`dark_mode`); `ONLINE`/`OFFLINE`
  pill (green dot + glow / amber) and `n Queued` pill (`sync` glyph, spins when
  `n > 0`) — both from `useOnlineStatus()`, hidden under `sm`; operator avatar
  chip (`OA` on `bg-primary-container`) + `SUP // LOS` under `md`.

### 3.3 TelemetryStrip (`TelemetryStrip.tsx`)
- `flex md:flex-row flex-col justify-between gap-4`.
- **Left:** breadcrumb chip (`bg-accent-amber/10 text-accent-amber` label-caps),
  `h1` `font-display text-headline-lg`, subtitle `font-label-caps text-label-caps
  text-accent-amber`.
- **Right:** `bg-surface-container-low shadow-panel` card — pulsing green dot +
  `SERIAL QUEUE` mono value + divider + `RAMP STATUS` (`GREEN LIGHT`).
- Copy is per-view, from `VIEW_META` (see §4).

### 3.4 Content offset math
Wrapper: `p-3` + `lg:pl-[calc(4.75rem+1.5rem)]` (collapsed) / `lg:pl-[calc(16rem+1.5rem)]`
(expanded). Sidebar right edge = `0.75rem + width`; the extra `0.75rem` in the
calc is the gutter between rail and content. `<main>` caps at `max-w-[1600px]
mx-auto`, `flex flex-col gap-6`.

---

## 4. Navigation model  (`src/components/shell/nav.ts`)

`ViewId` = `terminal | manifest | scanner | tracking | audit | corporate | admin
| tiers | onboarding`.

| id | label | icon | group |
|---|---|---|---|
| terminal | Desk Terminal | `point_of_sale` | operations |
| manifest | Manifest | `assignment` | operations |
| scanner | Ramp Scan | `barcode_scanner` | operations |
| tracking | Cargo Tracking | `radar` | operations |
| audit | Weight Audit | `scale` | operations |
| corporate | B2B Ledger | `account_balance` | commercial |
| admin | Rate Cards | `sell` | commercial |
| tiers | SaaS Tiers | `workspace_premium` | platform |
| onboarding | Onboarding | `rocket_launch` | platform |

`GROUP_LABELS`: `RAMP OPERATIONS` / `COMMERCIAL` / `PLATFORM`.
`VIEW_META[id]` supplies `{ title, subtitle, breadcrumb }` for the TelemetryStrip
(e.g. terminal → "Air Cargo Intake Desk" / "AIR WAYBILL CREATION · VOLUMETRIC
AUDIT & INSTANT MANIFESTING" / "TERMINAL MMA2 CARGO BAY A · INTAKE DESK #04").

---

## 5. Core Component Library  (`src/components/ui`)

### 5.1 Icon — see §2.10.

### 5.2 Button
- **Variants:** `primary` (`bg-primary-container text-on-primary-container
  hover:brightness-110 shadow-glow-strong`), `secondary` (`bg-surface-container-high`
  + border), `destructive` (error tint → solid on hover), `ghost` (transparent,
  muted→on-surface), `subtle` (`bg-surface-container` + subtle border).
- **Sizes:** `sm` h-32 / `md` h-40 / `lg` h-48 (px); radius, gap, icon size scale.
- `iconLeft` / `iconRight` are **Material Symbol name strings**. `loading` swaps in
  the spinner + optional `loadingLabel`. `active:scale-[0.98]`; disabled/loading →
  `opacity-50`, no pointer events; `focus-visible` ring.

### 5.3 Badge
- **Tones:** the 7 status tones (`bg-*-bg border-*-border text-*-fg`).
- **Sizes:** `sm` (`text-[11px]`, rounded-sm) / `md` (`text-xs`, rounded-md).
- Optional pulsing `dot` (tone-colored) + leading `icon` (glyph name string).

### 5.4 Card
- `rounded-xl border transition-all flex flex-col overflow-hidden`.
- **Surface:** default `bg-surface-container-low shadow-panel`; `nested` →
  `bg-surface-container-lowest`, no shadow (this is the "one step down, cap
  nesting at two levels" rule); `glass` → `bg-surface-card-glass backdrop-blur-md`.
- **`accent`** → `border-accent-amber/30 ring-1 ring-accent-amber/10 panel-orb`
  (amber spotlight + ambient orb, dark only).
- `hoverable` → `hover:border-border-strong hover:shadow-glow cursor-pointer`.
- Optional `header` (`px-4 py-3.5`, `border-b border-border-subtle`,
  `bg-surface-container/40`) and `footer` (`px-4 py-3`, `border-t`,
  `bg-surface-container-lowest`). `padding`: `none | sm 14 | md 16 | lg 20`.

### 5.5 TextField / Select
- Label row (`text-xs font-semibold text-text-secondary tracking-wide` +
  right-aligned `hint`), control, error.
- Control: `h-11 px-3.5 rounded-md bg-surface-container-lowest border`; focus →
  `border-accent-amber` + `ring-2 ring-accent-amber/20`; error → `border-error` +
  `ring-error/30`; disabled → `bg-surface-container`.
- TextField `iconLeft`/`iconRight` = glyph name strings (14px, muted, absolute,
  padding shifts `pl-9`/`pr-9`); `mono` toggle for numeric/identifier fields.
- Select renders a native `<select>` `appearance-none` with a custom
  `expand_more` affix; takes `options[]` or `children`.
- Errors: `role="alert"`, tint pill with leading `•`, wired via `aria-invalid` /
  `aria-describedby` (`useId`).

### 5.6 Modal / Sheet (portals)
- Backdrop `bg-overlay backdrop-blur-sm`; body-scroll lock; Esc + backdrop close
  (Modal configurable).
- **Modal:** centered `bg-surface-card rounded-2xl border-border-strong
  shadow-modal`, `max-h-[90vh]`, `fade-in zoom-in-95 200ms`; sizes `sm max-w-sm ·
  md max-w-lg · lg max-w-2xl · xl max-w-4xl · full 95vw×90vh`; header
  (`text-base font-bold` title + `text-xs` desc + `close` button), scroll body
  `p-6`, footer `border-t bg-surface-sunken` right-aligned.
- **Sheet:** `bottom` (`max-h-[85vh] rounded-t-2xl`) or `right` (`max-w-md h-full
  rounded-l-2xl`); `slide-in` 300ms; same header/body/footer.

### 5.7 Spinner
`progress_activity` glyph + `animate-spin`; `tone`: `amber | muted | white |
cobalt`; `size` = icon-scale key or px.

### 5.8 PageHeader — *legacy*, retained & migrated to `<Icon>` (`icon` prop is now
a glyph name) but no longer used by the shell; kept for any standalone/embedded
header need.

---

## 6. Recurring UI Patterns

- **KPI card row:** `grid sm:grid-cols-3 gap-4`; label (`text-xs font-semibold
  text-muted`) + tone icon top-right, `text-2xl font-black font-mono` figure,
  `text-[11px]` caption. Alert KPIs swap border/figure to `error` / `accent-amber`.
- **Data tables:** inside a `Card`; `w-full text-xs`; header row `border-b
  border-border text-muted font-semibold`; body `divide-y divide-border-subtle`,
  `hover:bg-surface-hover`; numeric columns right-aligned + `font-mono`; inactive
  rows `opacity-50`; status column = `<Badge>`; trailing `sm` action buttons;
  `overflow-x-auto` wrapper.
- **Empty states:** centered `py-8–20`, rounded `surface-container` icon tile,
  bold `text-on-surface` line + muted helper + optional CTA.
- **Inline feedback banner:** `p-3 rounded-xl border` in a status tint with a
  16px `check_circle` / `warning` glyph; auto-dismiss 2–3s.
- **Utilization bar:** `bg-surface-container-lowest h-1.5–3 rounded-full
  overflow-hidden`; fill `success` < ~65–85%, `accent-amber` mid, `error` ≥
  90–100% / overload.
- **Route indicator:** `ORIGIN → DEST` in `font-mono font-black` with an amber
  arrow or a rotated `flight` glyph between two `flex-1` divider lines.
- **Segmented toggle:** `bg-surface-2 p-1 rounded-lg border`; active segment
  `bg-surface-1 text-foreground shadow-sm` (amber for payment mode).
- **Offline / sync affordance:** header `ONLINE`/`n Queued` pills;
  `Wifi`/`wifi_off` badge in the intake station bar; `PENDING-…` AWBs carry a
  `warning` "Syncing" badge; optimistic Dexie writes via `queueSyncItem`.
- **Amber icon tile:** `w-10 h-10 rounded-xl bg-accent-amber/15 border
  border-accent-amber/30 text-accent-amber`.
- **Eyebrow label:** `font-label-caps text-label-caps tracking-widest` in
  `text-accent-amber` or `text-text-disabled`.

---

## 7. Screen-by-Screen

All 9 views keep their pre-redesign structure and props; they inherit the new
palette (via aliases), the new icon family, and the shell chrome. Highlights:

### 7.1 Desk Terminal — `IntakeTerminal`
Station control bar (amber `flight_takeoff` tile, tenant + `HUB: LOS` mono chip,
`Wifi`/`wifi_off` badge) → `lg:grid-cols-12` split: **left col-7** three numbered
section cards — *Flight Routing & Cargo Category* (`flight_takeoff`), *Shipper &
Consignee Manifest Details* (`contacts`, `person`/`call` field icons), *Cargo
Metrics, Volumetric Dimensions & Valuation* (`scale`, `tag`, `inventory_2`,
`shield`) with the `(L×W×H)/6000` inset box; **right col-5** sticky
**`PricingSection`** (`receipt_long` header, weight-comparison chips, itemized
lines, `Total Billable` `text-2xl font-black font-mono`, 3-up payment segmented
buttons, `lg` full-width **Verify & Issue Waybill** with `print`) + **`RecentAWBsSidebar`**
(`schedule` header + `refresh`; divided rows: AWB / "Syncing" badge, amount,
consignee, `origin →(arrow_forward) dest · kg`, PIN, ghost "Receipt" with `print`).
Post-issue → success banner + **`ReceiptMockup`**. Modals: `ConfirmIssueModal`
(`flight_takeoff` route banner, `person`/`scale` summary blocks, amber payable
block, `warning` receipt notice), archive receipt modal.

### 7.2 ReceiptMockup
Fixed **white thermal-paper** card (`bg-white text-neutral-900 font-mono
text-[12px]`, dashed dividers, `print:` overrides for 80 mm) — deliberately
**not** themed (physical output). Blocks: tenant + IATA no. → AWB (amber "PENDING
CLOUD SYNC" if unsynced) + timestamp → O/D/Flight/Type grid → shipper & consignee
→ cargo specs (**chargeable** bold) → financials (**TOTAL CHARGES**, red
**BALANCE DUE**) → Pickup PIN chip + 64px `QRCodeSVG` → footer + "⚡ POWERED BY
AEROLOGISTICS SAAS" (hidden when white-label). Actions (`print:hidden`): **Print
Receipt (80mm)** (`print`), **Copy AWB** (`content_copy`↔`check`), ghost **Done**.

### 7.3 Flight Manifest Builder — `FlightManifestBuilder`
Header + **All Manifests (n)** (`list_alt`) + **New Manifest** (`add`). Active
manifest → `lg:grid-cols-12`: **left col-8** flight-header card (amber ring,
`flight_takeoff` tile, `ORIGIN → DEST` mono-black, status badge — `STATUS_CFG`
maps open→success/`inventory_2`, locked→amber/`lock`, airborne→info/`flight_takeoff`,
landed→purple/`flight_land`, closed→neutral/`check_circle`), payload-utilization
bar (green/amber/red), "OVERLOADED ⚠️"; *Add Cargo AWB* card (`barcode_scanner`,
scanner-toggle pill, `check_circle`/`warning` scan banner); cargo table with
`tfoot` TOTALS + **Print Manifest** (`print`). **right col-4** *Manifest
Operations* state machine (**Lock** `lock` → **Dispatch Flight →** `flight_takeoff`
→ **Confirm Landing** `flight_land`), *Load Summary* (`scale`), *Financial
Summary* (revenue / collected / outstanding). Empty state → **Create First
Manifest** (`add`). Modals: Create Manifest, Confirm Dispatch (3 KPI tiles,
`warning` overload strip, `check_circle` success), All Manifests list
(`chevron_right`).

### 7.4 Ramp Barcode Scanner — `RampScanner`
Header (`barcode_scanner`) + "Scanner Active/Off" badge. `lg:grid-cols-12`:
**left col-5** scanner-toggle card (20×20 icon well — `barcode_scanner` pulsing /
`qr_code_2`; **Start/Stop Scanning**, `videocam_off` stop; keyboard-wedge buffer,
80 ms inter-key timeout + Enter commit), *Manual AWB Lookup* (`search` + **Find**),
`check_circle`/`warning` scan banner, `check_circle` commit-result banner, amber
**Commit n Status Update(s)** (`send`) + ghost **Clear All**. **right col-7**
*Scanned Batch (n)* (`list_alt`) — rows with status-colored `8×8` tile
(`check_circle`/`warning`/`package_2`), AWB, current→target status badges,
consignee·pcs·kg, hover ✕; *Status Flow Guide* (`bolt`) badge chain. Commit modal:
3-up summary + transition list + offline-sync note.

### 7.5 Cargo Tracking — `PublicTrackingPage`
`max-w-4xl`. Hero: amber `flight_takeoff` pill, `text-2xl/3xl font-black` title.
Search card: mono `TextField` (`search`) + **Track Waybill** (`search`, loading
"Locating…") + sample-AWB pills. Error strip + ghost **Dismiss**. Result: *Flight
Route & Summary* card (amber ring; AWB `text-xl font-black font-mono`, status
badge; 3-col hub band — `ORIGIN` `text-2xl font-black font-mono`, center `FLIGHT
xxx` pill + rotated `flight` glyph between divider lines, `DESTINATION`; 4-up spec
tiles incl. `verified_user` "Screened OK"); *Chain-of-Custody Timeline*
(`schedule`) — vertical `before:` rail, 6 string-named nodes (`package_2` →
`verified_user` → `flight_takeoff` → `arrow_forward` → `location_on` →
`check_circle`), current = amber + `ring-4`, done = success, "Active Step" badge;
*WhatsApp support* banner (`chat`, green `wa.me` deep-link pill + `open_in_new`).
Footer "⚡ Powered by AeroLogistics Cloud Suite" unless white-label.

### 7.6 Ramp Weight Audit — `WeightAudit`
Header (`monitor_weight`) + `amber` "ICAO Annex 18 & NCAA Safety Compliant" badge.
KPI row: Recovered Revenue (`paid`, success), Pending Discrepancies (`report`,
error border), Leakage Rate (`scale`). *Live Re-Weigh Inspector* card (amber
ring): 4-up — Scanned AWB (`search`, mono), Counter Intake, Ramp Scale (hint `+n
kg`), **Log Ramp Audit** (`scale`); > 0.5 kg → error strip (`gpp_maybe`) + "ACTION
REQUIRED". Audit-log table (variance red/green, status badges); flagged rows →
destructive **Issue Debit**. Supplementary-debit modal: sunken AWB/discrepancy
block + amber fee block; ghost **Ignore Variance** / primary **Authorize Debit
(₦…)** (`paid`).

### 7.7 B2B Corporate Ledger — `CorporateLedger`
Header (`account_balance`) + **New Corporate Account** (`add`). KPI row: Active
Accounts (`apartment`), Approved Credit (`paid`, success), Outstanding Receivables
(`trending_up`, amber border). Accounts table — entity (+`mail`), contact
(+`call`), credit limit, debt, utilization mini-bar (green/amber/red), terms
badge, status badge (active/credit_hold/suspended), secondary **Statement**
(`description`). New-account modal (company, liaison/phone, billing email,
credit ceiling / Net-terms select; **Create Account** `add`). Statement modal —
sunken header (account · outstanding `text-xl font-black font-mono` · terms
badge), "Recent Waybill Debits" bordered list; **Print / Export PDF Statement**
(`print`).

### 7.8 Rate Card Manager — `RateCardManager`
Header (`trending_up`) + collapsible **Add Rate Card / Cancel** (`add` /
`expand_less`). Add form (amber ring, `payments` eyebrow): 3-up wildcard-capable
selects → 4-up mono number fields → 3-up (label + effective dates) → surcharge %
+ **Save Rate Card**. Cards table — `Route (ANY → ANY mono) / Type / Label / Rate
per Kg / Min Charge / Surcharge (+n% amber or —) / Valid From / Status badge /
Active toggle` (`toggle_on` filled amber / `toggle_off`); inactive rows dimmed;
footer hint (`south`) "Most-specific route wins…".

### 7.9 SaaS Subscription Tiers — inline in `App.tsx`
`auto_awesome` heading + RLS/trial subtitle; Monthly/Annual segmented toggle. 3
plan cards (`md:grid-cols-3`): **Starter** (`apartment`, neutral "Single Station"
badge, `check_circle` feature list, secondary **Start 14-Day Trial**); **Growth —
Most Popular** (`<Card accent>` amber orb, `flight` header, amber dot badge,
primary **Subscribe to Growth**); **Enterprise** (`verified_user` cobalt, info
badge, subtle **Contact Sales**). Prices `text-2xl font-black font-mono`.
Primitive showcase: status-tint card (all badge tones), button-system card (5
variants × 3 sizes + loading + disabled), form-controls card + **Open Mobile
Sheet** (`qr_code_2`). Demo `<Modal>` "Quick Intake & AWB Generation" (footer
`package_2`); demo bottom `<Sheet>` "Mobile Ramp Scanner & Cargo Validation".

### 7.10 Onboarding Wizard — `OnboardingWizard`
`max-w-3xl` card. 4-step progress rail (connecting track + `bg-primary-container`
fill; nodes `w-10 h-10 rounded-full`, active/done = `bg-primary-container
text-on-primary-container` with **filled** icon, `check_circle` when done; labels
`Company · Hub · Rates · Team`; step icons `apartment` / `location_on` /
`payments` / `group`). Step 1 Company (2-col fields); Step 2 First Airport Hub
(station-type select + IATA / prefix / city / state); Step 3 Default Route Rates
(per-route cards with `flight_takeoff`, Rate/Kg + Min Charge; ghost **Use
defaults**); Step 4 Invite First Team Member (email + role select; ghost **I'm
solo — skip**). Footer: secondary **Back** (`arrow_back`, disabled on step 1) /
primary **Next →** (`arrow_forward`) or **Complete Setup** (`check_circle`). App
wraps it in an amber info strip.

---

## 8. Accessibility & States

- Every control `label`-associated (`useId`); `aria-invalid` + `aria-describedby`
  on error; errors `role="alert"`.
- Modals / Sheets `role="dialog"` + `aria-modal`, Esc close, body-scroll lock,
  `aria-label` on close buttons.
- `<Icon>` is `aria-hidden` unless given `title` (→ `role="img"` + label).
- Global `:focus-visible` ring with 2px offset; disabled = `opacity-50 +
  cursor-not-allowed + pointer-events-none`.
- Loading = spinner + descriptive `loadingLabel` ("Authorizing Waybill…",
  "Dispatching…", "Committing…").
- Active nav item carries `aria-current="page"`.
- `ErrorBoundary` wraps all routed views ("Terminal Subsystem Interrupted"
  fallback with Reload / Try Again / Clear Cache).
- Color is never the only signal — status = tint + dot + text label; variance /
  overload also carry a glyph and words.
- Sidebar collapse, theme choice, and (elsewhere) unsent drafts persist in
  `localStorage`; all reads/writes are try/caught.

---

## 9. Data Formatting Conventions

- **Currency:** `formatCurrency()` → `₦` + `en-NG` grouping, 2 decimals (USD
  variant available); always `font-mono`, totals `font-black`.
- **Identifiers:** AWB `LOS-2026-000492`, manifest numbers, PINs, phones —
  `font-mono`, usually `font-bold`, `tracking-wide`.
- **Weights:** `n kg` mono; chargeable weight highlighted amber.
- **Routes:** `ORIGIN → DEST` (or `➔`) mono.
- **Airport hubs:** 12 Nigerian IATA stations in `src/lib/ui.ts`
  (`LOS, ABV, PHC, KAN, ENU, BNI, OWR, ASB, ILR, CBQ, QUO, YOL`), surfaced as
  `CODE — City (Airport name)` in selects.
- **Eyebrows / labels:** upper-case, `font-label-caps text-label-caps
  tracking-widest`.

---

## 10. Fonts, Assets & Offline

- **Inter** + **JetBrains Mono** — Google Fonts `<link>` in `index.html`
  (unchanged).
- **Material Symbols Outlined** — self-hosted via the `material-symbols` package;
  `@import "material-symbols/outlined.css"` in `src/index.css` bundles the
  `@font-face` + woff2 (Vite content-hashes it). No `fonts.googleapis.com`
  runtime dependency for icons.
- **PWA precache** (`vite-plugin-pwa` / Workbox): `globPatterns` includes
  `woff2`; `maximumFileSizeToCacheInBytes` raised to 5 MB so the ~3.9 MB icon
  font is precached — icons render with no network. Precache = 9 entries / ~4.6 MiB.
- Trade-off noted: the full outlined set is ~3.9 MB one-time. A build-time
  subsetter keyed to the ~70 glyph names in use would cut this to tens of KB if
  bundle size becomes a concern.

---

## 11. Plain language & progressive disclosure

Added in `feat/ui-simplification` to make the primary flows readable by
non-experts while keeping power-user detail one tap away.

### Wording rule — "plain label first"
Every user-facing label leads with everyday words; the air-cargo / SaaS term
follows in parentheses (or a muted span) only where trained staff expect it, and
a `?` (`<InfoHint>`) carries a one-sentence explanation for the genuinely
technical ideas. `src/lib/glossary.ts` (`GLOSSARY`, `plainLabel`, `termLabel`,
`definitionOf`) is the single source of truth for both the relabelling and the
hint text. Examples in use: Sender / Recipient (not shipper / consignee),
Tracking number (not AWB), Billed weight (not chargeable weight), Security
screening (not AVSEC), Flights & loading (not Manifest Builder), Weight check
(not "Revenue Recovery Engine"). The printed `ReceiptMockup` keeps the formal
courier terms because it is a physical document.

### `<Disclosure>` (`src/components/ui/Disclosure.tsx`)
Labelled expand/collapse region for "advanced / optional" detail. Props: `label`,
`hint` (muted, right-aligned — e.g. "optional"), `icon`, `defaultOpen`,
`persistKey` (remembers open/closed in `localStorage` as
`aerolog-disclosure-<key>`, try/caught). Header is a real `<button
aria-expanded aria-controls>` with a rotating `chevron_right`; the body is
toggled with the `hidden` attribute so form fields stay in the DOM and still
submit while collapsed.

Where it's used: intake "Add size & value" (dimensions + item value),
"See price breakdown" (fee line-items), "Full details" in the confirm modal;
manifest right-column "Money"; weight-audit "More stats".

### `<InfoHint>` (`src/components/ui/InfoHint.tsx`)
Small `info` glyph button. One plain sentence on hover / focus / tap; closes on
Esc / outside-click / blur. Panel is `createPortal`-ed to `<body>` and
positioned from `getBoundingClientRect`, so it is never clipped by a card's
`overflow-hidden`. Takes `term` (looks up `GLOSSARY`) or explicit `text`;
`aria-describedby` links the trigger to the panel while open. `TextField` /
`Select` `label` props are `React.ReactNode`, so an `InfoHint` can sit inline in
a field label.

### Density reductions
- **Desk Terminal**: always-visible intake fields cut from ~14 to ~8; price
  leads with a single **Total to pay**.
- **Flights & loading**: 4-metric utilisation row → one line; right-column
  money panel collapsed by default.
- **Weight check**: 3 KPI cards → 2 + a "More stats" disclosure; audit-log
  table 8 → 5 columns with a per-row expander.
- **Business accounts**: table 8 → 5 columns + per-row expander.
- **Pricing**: table 9 → 6 columns + per-row expander.
- **Track a shipment**: 4 spec tiles → 2 + a one-line note; timeline step
  labels shortened (Received / Security checked / Added to a flight / In the
  air / Arrived / Collected).
- **Plans & billing**: the developer component gallery moved out of the user
  view to `src/components/dev/StyleGuide.tsx`, mounted only under
  `import.meta.env.DEV` or `?dev=1`.
- **Shell**: `TelemetryStrip` reduced to title + one plain sentence (the
  decorative serial-queue / ramp-status card removed); sidebar groups renamed
  Daily work / Billing / Setup; the header sync pill hides when nothing is
  queued.

### Bug fixed along the way
`FlightManifestBuilder` and `RampScanner` contained literal `\u2192` / `\u00b7`
/ `\u2715` sequences in JSX **text** (valid only inside string literals), so
users saw `\u2192` instead of `→`. Replaced with the real characters.
