# AeroLogistics SaaS Suite — UI Design Specification

**Product:** Aviation Log Entry, AWB Tagging & Multi-Tenant Cargo Tracking
**Version:** v1.0.0 (Architecture Phase)
**Stack:** React 19 · TypeScript · Vite 6 · Tailwind CSS v4 (`@theme` tokens) · Supabase · Dexie (offline IndexedDB) · lucide-react icons · qrcode.react · PWA

---

## 1. Design Language

A **dark-first, luxury operations console** aesthetic for airport cargo desks. The mood is "obsidian deep" in dark mode and "crisp slate/white" in light mode. Amber is the single brand accent (aviation runway / caution lighting), applied sparingly to primary actions, active nav, and key figures. Everything else is neutral slate with a 7-tone semantic status system.

Principles:
- **Token-only color.** No hard-coded hexes in components — every surface, text and status color is a CSS custom property that flips between light/dark.
- **Dense but legible.** Compact paddings, `text-xs`/`text-sm` body copy, monospace for all numeric/identifier data (AWB numbers, weights, currency, PINs).
- **WCAG AA contrast** guaranteed in both themes for every status tint.
- **Operations-grade feedback.** Inline scan feedback banners, live utilization bars, optimistic offline writes with sync badges.

---

## 2. Theme & Design Tokens

### 2.1 Theme mechanism
- Class-based dark mode on `<html>`: `.dark` / `.light`.
- Boot script in `index.html` reads `localStorage['aerolog-theme']` (default `dark`) before paint to prevent flash.
- `useTheme()` hook toggles and persists; uses the **View Transitions API** for an animated cross-fade when supported (respects `prefers-reduced-motion`).

### 2.2 Color palette

| Role | Token | Light | Dark |
|---|---|---|---|
| App canvas | `--color-canvas` | `#f8fafc` | `#0b0f17` |
| Sunken surface | `--color-surface-sunken` | `#f1f5f9` | `#070a10` |
| Surface 1 / card | `--color-surface-1` / `--color-surface-card` | `#ffffff` | `#111827` |
| Surface 2 | `--color-surface-2` | `#f8fafc` | `#162032` |
| Surface 3 | `--color-surface-3` | `#e2e8f0` | `#1f2d47` |
| Surface hover | `--color-surface-hover` | `#f1f5f9` | `#1c283f` |
| Card glass | `--color-surface-card-glass` | `rgba(255,255,255,0.92)` | `rgba(17,24,39,0.85)` |
| Foreground | `--color-foreground` | `#0f172a` | `#f8fafc` |
| Text secondary | `--color-text-secondary` | `#334155` | `#cbd5e1` |
| Muted | `--color-muted` | `#5b6675` | `#8b97a8` |
| Disabled text | `--color-text-disabled` | `#94a3b8` | `#526075` |

**Brand & action**

| Role | Token | Light | Dark |
|---|---|---|---|
| Accent amber | `--color-accent-amber` | `#f59e0b` | `#fbbf24` |
| Accent amber hover | `--color-accent-amber-hover` | `#d97706` | `#f59e0b` |
| Text on amber | `--color-on-accent` | `#111827` | `#111827` |
| Accent cobalt | `--color-accent-cobalt` | `#2563eb` | `#3b82f6` |

**Status colors** (`success` / `warning` / `error` / `info` / `purple`)

| Tone | Light solid | Dark solid |
|---|---|---|
| success | `#16a34a` | `#22c55e` |
| warning | `#ea580c` | `#f97316` |
| error | `#dc2626` | `#ef4444` |
| info | `#2563eb` | `#3b82f6` |
| purple | `#7c3aed` | `#a855f7` |

Each status also has a **tint set** — `-bg`, `-border`, `-fg` — plus `amber` and `neutral` sets. Light mode uses a dense pastel background with dark text; dark mode uses a ~12% translucent background with a luminous text color. Example (`success`): light `#dcfce7 / #86efac / #15803d`, dark `rgba(34,197,94,.12) / rgba(34,197,94,.28) / #4ade80`.

**Borders & scrims**

| Token | Light | Dark |
|---|---|---|
| `--color-border` | `rgba(15,23,42,.12)` | `rgba(255,255,255,.08)` |
| `--color-border-subtle` | `rgba(15,23,42,.06)` | `rgba(255,255,255,.04)` |
| `--color-border-strong` | `rgba(15,23,42,.20)` | `rgba(255,255,255,.15)` |
| `--color-focus-ring` | `#2563eb` | `#3b82f6` |
| `--color-overlay` | `rgba(15,23,42,.50)` | `rgba(0,0,0,.82)` |

### 2.3 Typography
- **Sans:** `Inter` (weights 300–800) → UI text.
- **Mono:** `JetBrains Mono` (400–800) → AWB numbers, weights, currency, PINs, dates, codes, KPI figures.
- Scale in use: `text-[9px]`–`text-[11px]` micro-labels, `text-xs` body, `text-sm` labels/headers, `text-lg` page title, `text-xl`–`text-3xl` section/hero, `text-2xl font-black` for money/KPIs.
- Weight ramp: `font-semibold` labels, `font-bold` headers, `font-black` financial totals.
- Headings use `tracking-tight`; badges/labels use `tracking-wide`.

### 2.4 Radius scale
`--radius-xs 4px` · `sm 8px` · `md 12px` · `lg 16px` · `xl 20px` · `2xl 24px` · `full 9999px`.
Cards `rounded-xl`, modals `rounded-2xl`, inputs/buttons `rounded-md`, chips/badges `rounded-sm|md`, icon tiles `rounded-xl|2xl`.

### 2.5 Elevation / shadow
- `--shadow-card` — resting cards.
- `--shadow-elevated` — hover / popovers.
- `--shadow-modal` — dialogs & sheets.
Dark mode shadows are deeper (up to `0 25px 50px -12px rgba(0,0,0,.7)`). A `--grain-opacity` token (0.015 light / 0.04 dark) is reserved for a film-grain texture.

### 2.6 Iconography
`lucide-react`, locked to a **5-step size scale** (`src/lib/ui.ts`):

| Key | px | Usage |
|---|---|---|
| `xs` | 12 | badges, inline metadata, chips |
| `sm` | 14 | secondary actions, table rows, input affixes |
| `md` | 16 | standard buttons, card headers, tabs |
| `lg` | 20 | section headers, primary actions, nav |
| `xl` | 24 | hero headers, modal icons, empty states |

### 2.7 Motion
- `tw-animate-css` + `motion` package.
- Buttons: `active:scale-[0.98]`, `transition-all`.
- Modals: `fade-in zoom-in-95` 200ms. Sheets: `slide-in-from-bottom/right` 300ms.
- Badge status dot: `animate-pulse`. Spinner: `animate-spin` (`Loader2`).
- Theme switch: View Transitions cross-fade.

### 2.8 Global base styles
- `box-sizing: border-box` everywhere; `html, body` full-bleed, canvas background, Inter.
- Focus: `:focus-visible` → `2px solid var(--color-focus-ring)`, `outline-offset: 2px`.
- Custom scrollbars: 6px, `--color-border-strong` thumb → `--color-muted` on hover, transparent track.
- Body selection: `selection:bg-amber-500/30`.

---

## 3. App Shell / Layout

```
┌────────────────────────────────────────────────────────────────┐
│ PageHeader (sticky, glass blur, border-b)                       │
│  [amber icon tile] AeroLogistics SaaS Suite   ·  v1.0.0 badge   │
│  subtitle                          [ tab pill bar ] [Dark/Light] │
├────────────────────────────────────────────────────────────────┤
│ <main>  max-w-7xl · mx-auto · p-4/6/8 · flex-col gap-8          │
│   └─ ErrorBoundary                                              │
│        └─ active view (9 views)                                 │
└────────────────────────────────────────────────────────────────┘
```

- **Root:** `min-h-screen bg-canvas text-foreground flex flex-col font-sans`.
- **PageHeader** (`components/ui/PageHeader.tsx`): optional back button, amber `10×10 rounded-xl` icon tile (`bg-accent-amber/15` + border), title + inline badge, subtitle, right-aligned actions slot, `sticky top-0 z-30`, `bg-surface-card-glass backdrop-blur-md`.
- **View switcher:** horizontal scrollable pill bar inside `bg-surface-2` rounded container; active pill = `bg-accent-amber text-on-accent shadow-sm`, inactive = `text-muted hover:text-foreground`. Each pill has a 13px icon + bold `text-xs` label.
- **Nine views:** `Desk Terminal` (Terminal), `Manifest` (FileText), `Ramp Scan` (QrCode), `Cargo Tracking` (Search), `Weight Audit` (Scale), `B2B Ledger` (Building2), `Rate Cards` (Settings), `SaaS Tiers` (Sparkles), `Onboarding` (BookOpen).
- **Content width:** `max-w-7xl`; individual screens further constrain (tracking `max-w-4xl`, onboarding `max-w-3xl`, receipt `max-w-md`).
- **Responsive:** header collapses to column below `sm`; screen bodies use `lg:grid-cols-12` split layouts that stack to single column under `lg`.

---

## 4. Core Component Library (`src/components/ui`)

### 4.1 Button
- **Variants:** `primary` (amber fill, dark ink, bold, shadow), `secondary` (surface-1 + border, hover surface-2), `destructive` (error tint → solid error on hover), `ghost` (transparent, muted → foreground), `subtle` (surface-2 + subtle border).
- **Sizes:** `sm` h-32px / `md` h-40px / `lg` h-48px; radius and gap scale with size; icon size maps to `xs/sm/md`.
- **States:** `loading` swaps in `<Spinner>` + optional `loadingLabel`; `disabled`/loading → `opacity-50`, no pointer events; `active:scale-[0.98]`; `focus-visible` outline.
- Props: `iconLeft`, `iconRight` (LucideIcon), `fullWidth`.

### 4.2 Badge
- **Tones:** `success · error · warning · info · amber · purple · neutral` — each `bg-*-bg border-*-border text-*-fg`.
- **Sizes:** `sm` (`text-[11px]`, rounded-sm) / `md` (`text-xs`, rounded-md).
- Optional pulsing status `dot` (1.5px, tone-colored) and leading `icon`.
- Used for shipment status, plan tags, sync state, compliance notes.

### 4.3 Card
- `rounded-xl border border-border bg-surface-card shadow-card`, `flex-col overflow-hidden`.
- Optional **header** (`px-5 py-4`, `border-b border-border-subtle`, `bg-surface-2/40`, space-between) and **footer** (`px-5 py-3.5`, `border-t`, `bg-surface-sunken`).
- `padding`: `none | sm(14) | md(20) | lg(28)`; `glass` (glass bg + `backdrop-blur-md`); `hoverable` (border-strong + shadow-md + pointer).
- Accent variant pattern used across app: `border-accent-amber/30 ring-1 ring-accent-amber/10` to spotlight the primary card on a screen.

### 4.4 TextField
- Column: label row (`text-xs font-semibold text-text-secondary tracking-wide`, with right-aligned `hint`), input, error.
- Input: `h-11 px-3.5 rounded-md bg-surface-sunken border`; focus → `border-accent-amber` + `ring-2 ring-accent-amber/20`; error → `border-error` + `ring-error/30`.
- Optional `iconLeft`/`iconRight` (14px, muted, absolutely positioned, padding shifts to `pl-9`/`pr-9`), `mono` toggle for numeric/identifier fields.
- Error message: `role="alert"`, error tint pill with a leading `•`, wired via `aria-describedby` / `aria-invalid`.

### 4.5 Select
- Same label/hint/error shell as TextField.
- Native `<select>` styled `appearance-none`, `h-11 pl-3.5 pr-10`, custom `ChevronDown` (14px) affix.
- Accepts `options: {value,label,disabled}[]` or raw `children`.

### 4.6 Modal (portal)
- Centered dialog; fixed backdrop `bg-overlay backdrop-blur-sm`.
- Panel: `bg-surface-card rounded-2xl border border-border-strong shadow-modal`, `max-h-[90vh]`, `animate-in fade-in zoom-in-95 duration-200`.
- **Sizes:** `sm max-w-sm` · `md max-w-lg` · `lg max-w-2xl` · `xl max-w-4xl` · `full 95vw×90vh`.
- Header (title `text-base font-bold` + description `text-xs text-muted`, `X` close button), scrollable body `p-6`, footer `border-t bg-surface-sunken` right-aligned actions.
- Closes on Esc / backdrop (configurable); locks body scroll while open.

### 4.7 Sheet (portal, mobile-first drawer)
- **Sides:** `bottom` (`inset-x-0 bottom-0 max-h-[85vh] rounded-t-2xl`) or `right` (`max-w-md h-full rounded-l-2xl`).
- Same scrim, header, scroll body, optional footer as Modal; `slide-in` animation; Esc + scrim close; body-scroll lock.

### 4.8 Spinner
- `Loader2` + `animate-spin`; `tone`: `amber | muted | white | cobalt`; size accepts icon-scale key or px.

### 4.9 PageHeader — see §3.

---

## 5. Recurring UI Patterns

- **KPI card row:** `grid sm:grid-cols-3 gap-4`; each card = label (`text-xs font-semibold text-muted`) + tone icon top-right, `text-2xl font-black font-mono` figure, `text-[11px] text-muted` caption. Alert KPIs swap border/figure color to `error` or `accent-amber`.
- **Data tables:** inside a `Card`; `w-full text-xs`; header row `border-b border-border text-muted font-semibold`, `py-3 px-4` cells; body `divide-y divide-border-subtle`, `hover:bg-surface-hover`; numeric columns right-aligned & `font-mono`; inactive rows `opacity-50`; status column renders a `<Badge>`; trailing action column with `sm` buttons. Wrapped in `overflow-x-auto`.
- **Empty states:** centered `py-8–20`, rounded `surface-2` icon tile (`Package`/`Scan`/`Plane`/`Clock`), bold foreground line + muted helper line, optional primary CTA.
- **Inline feedback banner:** `p-3 rounded-xl border` in `success`/`error` tint with `CheckCircle2` / `AlertTriangle` 16px icon; auto-dismisses after 2–3s.
- **Utilization / progress bar:** `w-full bg-surface-sunken h-1.5–3 rounded-full overflow-hidden`; fill color thresholds — `success` < 65–85%, `accent-amber` mid, `error` ≥ 90–100% / overload.
- **Route indicator:** `ORIGIN → DEST` in `font-mono font-black`, amber arrow or a rotated `Plane` icon between two `flex-1` divider lines.
- **Segmented toggles:** `bg-surface-2 p-1 rounded-lg border`; active segment `bg-surface-1 text-foreground shadow-sm` (or amber for payment mode).
- **Offline / sync affordance:** `Wifi`/`WifiOff` badge (`success` vs `warning` with queue count); `PENDING-…` AWBs show a `warning` "Syncing" badge; optimistic writes via Dexie + `queueSyncItem`.
- **Amber icon tile:** `w-10 h-10 rounded-xl bg-accent-amber/15 border border-accent-amber/30 text-accent-amber` — used in headers and station bars.

---

## 6. Screen-by-Screen Layout

### 6.1 Desk Terminal — `IntakeTerminal`
- **Station control bar:** rounded-2xl card — amber plane tile, tenant name + `HUB: LOS` mono chip, subtitle; right side online/offline badge.
- **Split grid** `lg:grid-cols-12`:
  - **Left (col-span-7):** three numbered section cards —
    1. *Flight Routing & Cargo Category* — Destination airport `Select`, Shipment category `Select`, Flight number `TextField` (mono).
    2. *Shipper & Consignee Manifest Details* — 2×2 `TextField` grid with `User`/`Phone` icons, SMS hints, inline validation on blur.
    3. *Cargo Metrics, Volumetric Dimensions & Valuation* — 4-up metrics (weight, pieces, commodity, declared value) + sunken "Volumetric Dimensions (L×W×H)/6000" box with 3 cm inputs.
  - **Right (col-span-5):**
    - **`PricingSection`** — sticky (`top-20`) amber-accent card: `stationCode → destinationCode` badge, weight comparison chips (Gross / Volumetric / Chargeable, chargeable in amber), itemized lines (Air Freight, Handling & Tagging, AVSEC, optional Insurance), `Total Billable` in `text-2xl font-black font-mono`, applied-tariff caption, 3-up payment-mode segmented buttons (Cash/POS/Transfer), amount-tendered field; footer `lg` full-width **Verify & Issue Waybill** button.
    - **`RecentAWBsSidebar`** — card with `Clock` header + refresh spinner; divided list rows: AWB (mono bold) or "Syncing" badge, amount, consignee, `origin → dest · kg`, `PIN`, ghost "Receipt" button. Empty state when none.
- **Post-issue state:** replaces grid with a `success` banner ("Consignment Successfully Committed") + **`ReceiptMockup`**.
- **Modals:** `ConfirmIssueModal` (route banner, 2-col shipper/weight summary, amber payable block with balance-due warning, thermal-receipt notice); archive `Modal` re-showing a past `ReceiptMockup`.

### 6.2 ReceiptMockup (thermal receipt)
- Fixed **white paper** card (`max-width 380px`, `bg-white text-neutral-900 font-mono text-[12px]`), dashed neutral dividers, `print:` overrides for 80 mm output.
- Blocks: tenant header + IATA agent no. → AWB number block (amber "PENDING CLOUD SYNC" if unsynced) + timestamp → Origin/Destination/Flight/Type grid → Shipper & Consignee → cargo specs (pieces, actual, volumetric, **chargeable** bold) → financial breakdown (freight, handling, AVSEC, insurance, **TOTAL CHARGES**, amount paid, red **BALANCE DUE**) → Pickup PIN (`text-2xl font-black tracking-widest` on a chip) beside a 64px `QRCodeSVG` of the tracking URL → footer + "⚡ POWERED BY AEROLOGISTICS SAAS" (hidden when white-label).
- Actions row (`print:hidden`): primary **Print Receipt (80mm)**, secondary **Copy AWB** (toggles to "Copied!"), ghost **Done**.

### 6.3 Flight Manifest Builder — `FlightManifestBuilder`
- Header: title + subtitle; **All Manifests (n)** secondary + **New Manifest** primary.
- **When a manifest is active** — `lg:grid-cols-12`:
  - **Left (col-span-8):**
    - *Flight header card* (amber accent): 12×12 plane tile, `ORIGIN → DEST` mono-black, flight no./date/time/aircraft, `manifest_number`, status badge (open=success, locked=amber, airborne=info, landed=purple, closed=neutral). Below: **Aircraft Payload Utilization** bar (green/amber/red by %), stat row (AWBs / Pieces / Gross kg / remaining), "OVERLOADED ⚠️" in error when exceeded.
    - *Add Cargo AWB card* (open only): AWB `TextField` (mono, scan/search icon) + **Add AWB**; toggle **Enable Barcode Scanner** pill (amber when active) with keyboard-wedge capture; success/error scan banner.
    - *Cargo Manifest table*: `# / Air Waybill / Consignee (+phone) / Contents / Pcs / Weight / Status / (remove)`; `tfoot` TOTALS row on `bg-surface-sunken`; **Print Manifest** button; empty state otherwise.
  - **Right (col-span-4):**
    - *Manifest Operations* card — state machine: open → **Lock Manifest (n AWBs)** + **Dispatch Flight →**; locked → sealed note + Dispatch; airborne → info note + **Confirm Landing**; landed/closed → success note.
    - *Load Summary* card — Aircraft / Max Payload / Total AWBs / Pieces / Gross / Remaining rows; overload error strip.
    - *Financial Summary* card — Total Revenue / Collected (green) / Outstanding Debt (red).
- **No manifest:** centered empty state + **Create First Manifest**.
- **Modals:** Create Manifest (origin/dest selects, airline/flight, date/time, aircraft type with capacity presets, payload kg); Confirm Dispatch (overload warning, 3 KPI tiles, irreversible note, success result state); All Manifests list (rows → select).

### 6.4 Ramp Barcode Scanner — `RampScanner`
- Header + "Scanner Active/Off" badge.
- `lg:grid-cols-12`:
  - **Left (col-span-5):**
    - *Scanner toggle card* — big `20×20 rounded-2xl` icon well (`Scan` pulsing/`QrCode`), Start/Stop Scanning button; card gains `border-success/40 ring` when active. Keyboard-wedge buffer with 80 ms inter-key timeout + Enter commit.
    - *Manual AWB Lookup card* — mono `TextField` + **Find**.
    - Scan feedback banner; commit-result banner.
    - *Commit card* (amber accent, when items pending) — count sentence, **Commit n Status Update(s)**, ghost **Clear All**.
  - **Right (col-span-7):**
    - *Scanned Batch (n) card* — rows: status-colored `8×8` icon tile (committed=success/error=error/pending=amber), AWB mono, current status badge → target status badge, consignee · pcs · kg; hover ✕ remove; committed rows `opacity-60`. Empty state.
    - *Status Flow Guide card* — `received → security_cleared → manifested → departed → arrived → delivered` badge chain + explainer.
- Auto-derives next status from `ALLOWED_TRANSITIONS`; **Commit** modal shows 3-up (Shipments / Station / Time) summary, scrollable transition list, offline-sync note.

### 6.5 Public Cargo Tracking — `PublicTrackingPage`
- `max-w-4xl` centered, `py-4`.
- **Hero:** amber pill "Live Aviation Cargo Tracking Portal", `text-2xl/3xl font-black` "Track Your Consignment", muted subtitle.
- **Search card:** mono `TextField` (Search icon) + primary **Track Waybill** (loading "Locating…"); sample-AWB quick pills below a subtle divider.
- **Error notice:** error-tint strip + ghost **Dismiss**.
- **Result (when found):**
  - *Flight Route & Summary card* (amber ring): AWB block (`text-xl font-black font-mono`), carrier + service, status badge (delivered=success / departed=info / else amber); 3-col hub-to-hub band (`ORIGIN` code `text-2xl font-black font-mono`, center `FLIGHT xxx` pill + rotated plane between divider lines, `DESTINATION`); 4-up spec tiles (Total Pieces / Gross Weight / Security Status "Screened OK" / Delivery Protocol "4-Digit PIN").
  - *Chain-of-Custody Timeline card* — vertical rail (`before:` pseudo line); 6 nodes (`received → security_cleared → manifested → departed → arrived → delivered`), each circle: current=amber + `ring-4`, done=success, upcoming=surface-2; label color-coded; "Active Step" badge on current; muted description.
  - *WhatsApp support banner* — `MessageSquare` heading, green pill link "Chat on WhatsApp" (`wa.me` deep link with AWB).
- Footer "⚡ Powered by AeroLogistics Cloud Suite" unless white-label.

### 6.6 Ramp Weight Audit — `WeightAudit`
- Header + `amber` "ICAO Annex 18 & NCAA Safety Compliant" badge.
- **KPI row (3):** Recovered Revenue (success figure), Pending Undeclared Discrepancies (error border + figure), Tarmac Weight Leakage Rate ("6.8% Variance").
- **Live Re-Weigh Inspector card** (amber ring): 4-up `items-end` grid — Scanned AWB (Search icon, mono), Counter Intake Weight, Ramp Scale Reading (hint shows `+n kg discrepancy`), **Log Ramp Audit** button. If discrepancy > 0.5 kg → error strip with `ShieldAlert`, shortfall amount, "ACTION REQUIRED" badge.
- **Audit Log table** — `Waybill / Routing / Desk Weight / Ramp Scale / Variance (kg) / Freight Shortfall / Status / Action`; variance red when > 0.5, else green "OK"; status badge (supplementary_debited=success dot, discrepancy_flagged=error dot, verified_ok=neutral); flagged rows show destructive **Issue Debit**.
- **Supplementary Debit modal** — sunken AWB / discrepancy block, amber fee block with `text-lg font-black font-mono` amount + consequence note; footer ghost **Ignore Variance** / primary **Authorize Debit (₦…)**.

### 6.7 B2B Corporate Ledger — `CorporateLedger`
- Header + primary **New Corporate Account**.
- **KPI row (3):** Active Institutional Accounts, Total Approved Credit Facility (success), Current Outstanding Receivables (amber border + amber figure).
- **Registered Corporate Accounts table** — `Corporate Entity (+email) / Primary Contact (+phone, mono) / Credit Limit / Current Debt / Credit Utilization / Terms / Account Status / Statements`. Utilization = mini progress bar (green/amber/red by %) + `%` caption. Status badges: active (success dot) / credit_hold (warning dot) / suspended (error dot). Row action: secondary **Statement**.
- **New Corporate Account modal** — company name, 2-col liaison/phone, billing email (hint), 2-col credit ceiling / payment-terms `Select` (Net 15/30/45/60); footer ghost Cancel / primary **Create Account**.
- **Statement modal** — sunken header block (client account + email | TOTAL OUTSTANDING `text-xl font-black font-mono` + terms badge); "Recent Waybill Debits" list (AWB mono, route · weight | amount · date) in a bordered divided list; footer **Print / Export PDF Statement**.

### 6.8 Rate Card Manager — `RateCardManager`
- Header + primary toggle **Add Rate Card / Cancel** (`Plus`/`ChevronUp`).
- **Add form** (collapsible, amber-ring card): 3-up selects (Origin Hub / Destination Hub / Cargo Type, all with "Wildcard" option) → 4-up mono number fields (Rate/Kg, Minimum Charge, Handling Fee/Piece, Security Fee Flat) → 3-up (Card Label, Effective From date, Effective Until date) → Peak Surcharge % + right-aligned **Save Rate Card**.
- **Cards table** — `Route (ANY → ANY mono) / Type / Label / Rate per Kg / Min Charge / Surcharge (+n% amber or —) / Valid From / Status badge / Active toggle` (`ToggleRight` amber / `ToggleLeft`). Inactive rows dimmed. Footer hint: "Most-specific route wins. Wildcard cards are the global fallback."

### 6.9 SaaS Subscription Tiers — (inline in `App.tsx`)
- Section heading with `Sparkles`, subtitle referencing RLS + 14-day trial / 72-hr grace.
- **Monthly / Annual** segmented toggle (annual shows "(2 Mo Free)" in amber).
- **3 plan cards** (`md:grid-cols-3`):
  - **Starter** — `Building2`, "Single Station" neutral badge, `formatCurrency` price + `/month|/year`, feature list with `CheckCircle` (success, one amber for watermark caveat), secondary **Start 14-Day Trial**.
  - **Growth (Most Popular)** — `border-accent-amber/50 ring-1`, amber `Plane`, "Most Popular" amber dot badge, primary **Subscribe to Growth**, white-label / SMS sender features emphasized.
  - **Enterprise** — cobalt `ShieldCheck`, "Airlines & Multi-Hub" info badge, subtle **Contact Sales / Invoicing**.
- Price figures: `text-2xl font-black font-mono`, unit in muted sans.
- **UI primitives showcase** below: "7 Semantic Status Tint Sets" card (all badge tones with dots), "Button Primitive System" card (5 variants + 3 sizes + loading + disabled), "Form Controls & Station Selectors" card (TextField / Select / mono AWB field) with an **Open Mobile Sheet** trigger.
- **Demo Modal** — "Quick Intake & AWB Generation" (consignee phone, weight/pieces grid, destination select).
- **Demo Sheet** — bottom "Mobile Ramp Scanner & Cargo Validation" with a sunken AWB card + "Screened OK" badge + full-width **Confirm Manifest Load**.

### 6.10 Onboarding Wizard — `OnboardingWizard`
- `max-w-3xl` card. **4-step progress rail** with connecting track + amber fill by progress; each node `w-10 h-10 rounded-full` amber when active/complete (`CheckCircle` when done), label below (`Company · Hub · Rates · Team`).
- **Step 1 Company Profile** — 2-col grid: Company Name, CAC Number, Email, Phone, full-width Address.
- **Step 2 First Airport Hub** — Station Type select (Airport Cargo Desk / City Dropoff Hub / Ramp Transit Office), Hub Code (IATA), AWB Prefix, City, State.
- **Step 3 Default Route Rates** — per-route `Card` rows (`Plane` + route label, Rate Per Kg, Min Charge number fields); ghost **Use defaults**.
- **Step 4 Invite First Team Member** — Staff Email + Role select (Admin / Station Manager / Desk Officer / Ramp Agent); ghost **I'm solo — skip**.
- **Footer controls:** secondary **Back** (disabled on step 1); amber **Next →** / on last step amber **Complete Setup** with `CheckCircle`.
- App wraps this with an amber info strip explaining new tenants must finish all 4 steps to unlock the workspace.

---

## 7. Accessibility & States

- Every form control is `label`-associated (`useId`), `aria-invalid` + `aria-describedby` on error, errors `role="alert"`.
- Modals/Sheets: `role="dialog"`, `aria-modal`, Esc to close, body-scroll lock, explicit `aria-label` on close buttons.
- Icons are `aria-hidden`.
- Visible `:focus-visible` ring globally; buttons keep focus outline with offset.
- Disabled = `opacity-50` + `cursor-not-allowed` + `pointer-events-none`.
- Loading = spinner + descriptive `loadingLabel` (e.g. "Authorizing Waybill…", "Dispatching…", "Issuing & Syncing…").
- `ErrorBoundary` wraps all routed views.
- Color is never the only signal — status badges pair tint + dot + text label; variance/overload also carry icons and words.

---

## 8. Data Formatting Conventions

- **Currency:** `formatCurrency()` → `₦` + `en-NG` grouping, 2 decimals (USD variant available). Always `font-mono`; totals `font-black`.
- **Identifiers:** AWB `LOS-2026-000492`, manifest numbers, PINs, phone numbers — all `font-mono`, often `font-bold`, `tracking-wide`.
- **Weights:** `n kg` / `n Kg`, mono; chargeable weight highlighted amber.
- **Routes:** `ORIGIN → DEST` (or `➔`) mono.
- **Airport hubs:** 12 Nigerian IATA stations defined in `src/lib/ui.ts` (`LOS, ABV, PHC, KAN, ENU, BNI, OWR, ASB, ILR, CBQ, QUO, YOL`), surfaced as `CODE — City (Airport name)` in selects.
