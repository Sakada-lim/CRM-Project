# Bold Vision CRM — Style Guide

> Single source of truth for the design system used across the app.
> Read this **before** building any new view or component.
>
> All tokens are defined in [`src/styles/tokens.css`](../Bold_Vision_CRM/src/styles/tokens.css).
> All typography is in [`src/styles/typography.css`](../Bold_Vision_CRM/src/styles/typography.css).
> Shared component CSS lives under [`src/styles/components/`](../Bold_Vision_CRM/src/styles/components/).

---

## Table of contents

1. [Tokens](#tokens) — colors, surfaces, text, status, shadows, radii
2. [Typography](#typography) — font families, scale, eyebrow labels
3. [Form primitives](#form-primitives) — `.field`, `.input`, `.select`, `.textarea`, `.input-affix`
4. [Sections with chips](#sections-with-chips) — `.pd-section` + `.pd-section-row` + `.pd-section-chip`
5. [Panels (cards)](#panels-cards) — `.panel` + slots
6. [Modals](#modals) — `.modal-card` + head/body/foot
7. [Badges & pills](#badges--pills) — `.status-badge`, `.pill`, `.info-type-badge`
8. [Buttons](#buttons) — `.btn` variants
9. [Tabs](#tabs) — `.pd-tabs` segmented control
10. [Layouts](#layouts) — detail page, list page, dialog
11. [Conventions](#conventions) — when to use which pattern

---

## Tokens

All colors use OKLCH. Both `[data-theme="light"]` and `[data-theme="dark"]` define the full set — never hardcode hex values.

### Surfaces (background hierarchy)

| Token | Use for |
|---|---|
| `--bg` | App background (behind everything) |
| `--bg-grid` | Striped placeholders / empty-state patterns |
| `--surface` | Cards, panels, modal cards (the "raised" layer) |
| `--surface-2` | Inputs, secondary surfaces (recessed but readable) |
| `--surface-sunk` | Disabled states, deepest recess (chip backgrounds, photo placeholder) |

### Borders

| Token | Use for |
|---|---|
| `--border` | Standard 1px divider between elements |
| `--border-strong` | Hover state, emphasized divider |

### Text

| Token | Use for |
|---|---|
| `--text` | Primary content (body, headings, input text) |
| `--text-muted` | Secondary labels, helper text |
| `--text-faint` | Eyebrow labels, captions, disabled text |
| `--text-on-accent` | Text on top of `--accent` background |

### Accent (terracotta clay)

| Token | Use for |
|---|---|
| `--accent` | Primary CTA background, active borders, link color |
| `--accent-hover` | Hover state on accent buttons |
| `--accent-soft` | Selected backgrounds (`aria-pressed`), focus rings, accent-tinted chips |
| `--accent-ink` | Text color when accent is the background |

### Status (semantic)

Four families: **hot**, **warm**, **cold**, **success**. Each has 3 shades:

| Token suffix | Meaning |
|---|---|
| `--{status}` | Dot/strong indicator (e.g. status dot, drag-target outline) |
| `--{status}-soft` | Background tint for pills/badges |
| `--{status}-ink` | Foreground text color for that status |

```
Hot     → red-orange (urgent leads, withdrawn status)
Warm    → amber       (engaged leads, coming soon)
Cold    → blue        (long-term leads, sold)
Success → green       (positive states, on-market, sent)
```

### Radii

`--r-xs` 4px, `--r-sm` 6px, `--r-md` 10px, `--r-lg` 14px, `--r-xl` 20px, `--r-pill` 999px.

Use `--r-md` for inputs/buttons, `--r-lg` for panels/cards/modals, `--r-pill` for badges and chips.

### Shadows

`--shadow-xs` (subtle 1px), `--shadow-sm` (1–2px raise), `--shadow-md` (general elevation), `--shadow-lg` (modals, dialogs, prominent cards).

---

## Typography

Family: **Geist** (sans), with feature settings `'ss01', 'cv11'` and `letter-spacing: -0.005em` for a tight, modern feel.

| Use | Size | Weight | Notes |
|---|---|---|---|
| Page H1 | 22–28px | 600–700 | Hero address, view titles. `line-height: 1.2`, `letter-spacing: -0.02em` |
| Panel title (h2) | 15–16px | 600 | Modal head, panel headers. `letter-spacing: -0.01em` |
| Body | 13.5–14px | 400–500 | Default form/text |
| Small / meta | 12–12.5px | 500 | Subtitles, secondary info |
| Eyebrow label | 11px | 600 | `letter-spacing: 0.08em`, `text-transform: uppercase`, `color: var(--text-faint)`. All form field labels and section heads use this style. |
| Caption | 11–11.5px | 500 | Hints, counts |

Mono font: `font-family: var(--font-mono)` via `.font-mono` class (Geist Mono).
Serif (italic, for stat numbers): `.font-serif` (Instrument Serif).

---

## Form primitives

Defined in `tokens.css`. Available globally — use in any view without scoped overrides.

### `.field`

Vertical wrapper for `[label, control]`. Use for every form field.

```html
<div class="field">
  <label for="address">Street address</label>
  <input id="address" class="input" type="text" />
</div>
```

- 6px gap between label and control
- `min-width: 0` so it can shrink inside grids
- The `<label>` automatically gets the eyebrow style (uppercase, 11px, faint)

### `.input`, `.textarea`, `.select`

All three share the same chrome:
- `--surface-2` background
- 1px `--border` outline, `--r-md` radius, 14px text
- Hover bumps to `--border-strong`
- Focus pulls in `--accent` border + 3px `--accent-soft` ring + lighter surface

`.textarea` adds `min-height: 90px; resize: vertical`.
`.select` strips the native arrow and draws its own chevron via CSS gradients.

### `.input-affix`

Wrap an `.input` with a leading or trailing icon/text overlay:

```html
<div class="input-affix">
  <span class="prefix">$</span>
  <input class="input has-prefix" type="text" />
</div>

<div class="input-affix">
  <input class="input has-suffix" type="text" inputmode="numeric" />
  <span class="suffix">m²</span>
</div>
```

The `.has-prefix` / `.has-suffix` modifier pads the input so text doesn't overlap the overlay.

---

## Sections with chips

For multi-section forms (PropertyForm style). Each section gets a divider + uppercase head + optional inline chip.

### `.pd-section` + `.pd-section-head` (simple)

```html
<section class="pd-section">
  <h4 class="pd-section-head">Basic details</h4>
  <!-- fields -->
</section>
```

Sections stack vertically. A `border-top` divides each from the previous (the first one has no top divider).

### `.pd-section-row` + `.pd-section-chip` (with computed value chip)

When the section has a derived value worth surfacing (price range, size summary), use a row wrapper:

```html
<section class="pd-section">
  <div class="pd-section-row">
    <h4 class="pd-section-head">Status &amp; pricing</h4>
    <span v-if="priceDisplay" class="pd-section-chip">
      <span class="dot" />{{ priceDisplay }}
    </span>
  </div>
  <!-- fields -->
</section>
```

The chip is an accent-filled pill (`background: var(--accent)`, `color: var(--text-on-accent)`) with a small dot. It floats inline with the head row, never overlapping the divider.

---

## Panels (cards)

Generic content card used outside modals.

```html
<div class="panel">
  <div class="panel__header">
    <h2 class="panel__title">Recent activity</h2>
    <button class="btn btn-ghost sm">Edit</button>
  </div>
  <div class="panel__body">…</div>
  <div class="panel__footer">…</div>
</div>
```

Variants on `panel__body`:
- `.panel__body--tight` (12px padding instead of 18px)
- `.panel__body--flush` (0 padding — for nesting other layouts)

---

## Modals

**All dialog content uses `.modal-card`.** Drop it inside a `v-dialog` (Vuetify provides the scrim, focus trap, escape-to-close). Chrome lives in [`src/styles/components/modals.css`](../Bold_Vision_CRM/src/styles/components/modals.css).

### Anatomy

```html
<v-dialog v-model="open" max-width="640">
  <div class="modal-card">
    <header class="modal-head">
      <span class="ico"><AppIcon name="chat" :size="18" /></span>
      <div class="modal-head__text">
        <h2>Broadcast via Telegram</h2>
        <div class="sub">Optional subtitle</div>
      </div>
      <button class="close" aria-label="Close" @click="open = false">
        <AppIcon name="x" :size="16" />
      </button>
    </header>

    <div class="modal-body">
      <!-- content (typically .field stacks) -->
    </div>

    <div class="modal-foot">
      <button class="btn btn-ghost" @click="open = false">Cancel</button>
      <button class="btn btn-primary">Confirm</button>
    </div>
  </div>
</v-dialog>
```

### Variants

- **`.modal-foot`** (default) — buttons right-aligned
- **`.modal-foot.modal-foot--split`** — `.hint` on the left, `.actions` (button group) on the right. On phones this stacks the actions full-width.

```html
<div class="modal-foot modal-foot--split">
  <span class="hint"><AppIcon name="chat" :size="12" /> Delivered via Bold Vision bot</span>
  <div class="actions">
    <button class="btn btn-ghost">Cancel</button>
    <button class="btn-send">Send</button>
  </div>
</div>
```

### Rules

- The component owns its **body layout** (form, two-column grid, etc.) — don't try to make the body generic
- On phones (≤720px) the modal-card auto-expands to fullscreen and removes border-radius
- Disabled buttons inside `.modal-foot` automatically get 0.45 opacity + `not-allowed` cursor

---

## Badges & pills

Two pill systems exist — use the right one:

### `.status-badge` (24px, with chrome)

For property / object status. Always has a colored dot. Color comes from the status class.

```html
<span class="status-badge on-market"><span class="dot" /> On Market</span>
<span class="status-badge withdrawn"><span class="dot" /> Withdrawn</span>
```

Available status classes: `.on-market`, `.coming-soon`, `.under-contract`, `.sold`, `.off-market`, `.withdrawn`.

**Neutral variant** (`.info-type-badge`) — same chrome, no dot, muted text. Used for property type (House / Townhouse / etc.) alongside the status badge.

```html
<span class="status-badge info-type-badge">House</span>
```

### `.pill` (22px, soft background)

For interest level / lead category. Soft background tint per tone.

```html
<span class="pill hot"><span class="dot" /> Hot</span>
<span class="pill warm"><span class="dot" /> Warm</span>
```

Tones: `.hot`, `.warm`, `.cold`, `.success`, `.muted`.

### `.pd-section-chip` (accent fill)

For computed/derived values shown inline with a section head. Always accent-colored.

```html
<span class="pd-section-chip"><span class="dot" />$1M – $1.2M</span>
```

---

## Buttons

| Class | When |
|---|---|
| `.btn .btn-primary` | Primary action — accent background. One per context. |
| `.btn .btn-ghost` | Secondary action — bordered, no fill |
| `.btn .btn-quiet` | Tertiary — transparent, only text/icon visible. Hover reveals subtle bg. |
| `.btn.sm` | Smaller variant (30px height, 12.5px text) |
| `.btn.icon` | Square 36×36, no text (just an icon) |

Combine: `.btn.btn-ghost.sm` for a small ghost button.

Buttons live globally — use them anywhere, including outside `.modal-foot`.

---

## Tabs (segmented control)

The full-width tab strip used at the top of `.pd-card` in [`PropertyDetailsView`](../Bold_Vision_CRM/src/views/PropertyDetailsView.vue). Lives in that file's scoped styles for now — if reused for Customers/etc, promote to `src/styles/components/tabs.css`.

```html
<div class="pd-tabs" role="tablist">
  <button role="tab" :aria-pressed="tab === 'details'" @click="tab = 'details'">
    Details
  </button>
  <button role="tab" :aria-pressed="tab === 'customers'" @click="tab = 'customers'">
    Customers
    <span v-if="count > 0" class="pd-tab-ct">{{ count }}</span>
  </button>
</div>
```

- The grid `grid-template-columns: repeat(N, 1fr)` makes each tab equal-width
- Active tab gets an `::after` accent underline (3px) and `aria-pressed="true"` styling
- `.pd-tab-ct` is a small count badge; turns accent-filled on the active tab

---

## Layouts

### Detail page (PropertyDetailsView)

```
┌─────────────────────────────────────────────────┐
│ Breadcrumb                                      │
├─────────────────────────────────────────────────┤
│ Hero card                                       │
│ ┌──────────────┬──────────────────────────────┐ │
│ │              │  status + type pills          │ │
│ │  Photo       │  H1 address                   │ │
│ │  (clickable) │  📍 location                  │ │
│ │              │  Price / Price guide          │ │
│ │              │  ─────────────────────        │ │
│ │              │  Leads / DoM / Photos         │ │
│ │              │  ─────────────────────        │ │
│ │              │  [Broadcast] (primary action) │ │
│ └──────────────┴──────────────────────────────┘ │
├─────────────────────────────────────────────────┤
│ Spec bar — 5 cells: bed / bath / car / land / house │
├─────────────────────────────────────────────────┤
│ Main card                                       │
│ ┌─────────────────────────────────────────────┐ │
│ │ [Details] [Customers]      (pd-tabs)        │ │
│ ├─────────────────────────────────────────────┤ │
│ │ Tab title          subtitle (right-aligned) │ │
│ │                                              │ │
│ │ Tab content (form / kanban / etc.)          │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

Shell: `.prop-detail` with `padding: 24px 28px 40px` (desktop) → `14px 12px 24px` (≤720px).

Hero: `.prop-detail__top` grid `1.4fr 1fr`. Stacks to single column ≤1100px.

Spec bar: `.prop-detail__specs-bar` grid `repeat(5, 1fr)` → `repeat(3, 1fr)` ≤880px → `repeat(2, 1fr)` ≤720px.

### List page (PropertiesView)

```
┌─────────────────────────────────────────────────┐
│ Toolbar — search + filter + Add                 │
├─────────────────────────────────────────────────┤
│ Card grid (3 cols → 2 → 1)                      │
│ ┌──────┐ ┌──────┐ ┌──────┐                      │
│ │ Card │ │ Card │ │ Card │                      │
│ └──────┘ └──────┘ └──────┘                      │
└─────────────────────────────────────────────────┘
```

Grid: `.prop-grid` with `grid-template-columns: repeat(3, 1fr); gap: 18px`.

### Dialog

Wrap content in `.modal-card`, drop into `v-dialog`. See [Modals](#modals).

---

## Conventions

### Which badge / pill for what

| Thing | Use |
|---|---|
| Property status (On Market, Sold, …) | `.status-badge.{status-class}` with dot |
| Property type (House, Townhouse, …) | `.status-badge.info-type-badge` (no dot, muted) |
| Lead category in customer cards | `.pill.{hot|warm|cold}` with dot |
| Computed form values ($1M–$1.2M, sizes) | `.pd-section-chip` (accent fill) |
| Tab count badges | `.pd-tab-ct` (inside the tab button) |

### Where styles should live

| Pattern type | Where |
|---|---|
| One-off (only used in this component) | Component's `<style scoped>` |
| Used in 2+ components | Promote to `src/styles/components/{topic}.css` and import in `main.js` |
| Tokens, atoms, primitives (`.input`, `.panel`, etc.) | `src/styles/tokens.css` |

**Rule of thumb:** if you find yourself copying CSS from one component to another, stop. Promote it.

### Form section structure

Always use this pattern, even for a one-section form:

1. Wrap in `<section class="pd-section">`
2. Header is either `<h4 class="pd-section-head">` (alone) or `.pd-section-row` (with chip)
3. Fields use `.field` + `.input`/`.select`/`.textarea`
4. For computed-value chips, use `.pd-section-row` to put the chip inline with the head

### Color usage hierarchy

- **Status colors** (hot/warm/cold/success) — reserved for status indicators and category pills. Don't use them for general accents.
- **Accent** — primary CTAs, active states, focus rings, selected items, computed-value chips.
- **Surface tones** for hierarchy: `--bg` > `--surface` > `--surface-2` > `--surface-sunk`. Anything raised goes on `--surface`; recessed/input fields use `--surface-2`; deepest recess uses `--surface-sunk`.

### Spacing scale (used informally)

- 4, 6, 8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 40px
- Inside cards/panels: 14–18px padding
- Inside modals: 16–18px padding on head/body/foot
- Grid gaps: 12px (tight) / 16–20px (default) / 24–28px (loose)
- Hero shell padding: `24px 28px 40px` (desktop) responsive down to `14px 12px 24px` (phone)

### Responsive breakpoints

The detail page uses **1100px / 880px / 720px**. The dialog uses **720px** for the phone-fullscreen flip. Stick to these where possible.

### Icons

All icons come from `<AppIcon name="..." :size="N" />` ([`src/components/base/AppIcon.vue`](../Bold_Vision_CRM/src/components/base/AppIcon.vue)). The icon set is curated — if you need one that's missing, add it to the `ICONS` map (path data from a 24×24 viewBox).

Common sizes: 12–14 in pills/buttons, 16–18 in modal heads/tabs, 20–40 in hero/empty states.

---

## When in doubt

1. Search `src/styles/tokens.css` and `src/styles/components/*` for an existing class
2. Read [`PropertyDetailsView.vue`](../Bold_Vision_CRM/src/views/PropertyDetailsView.vue), [`BroadcastPanel.vue`](../Bold_Vision_CRM/src/components/properties/BroadcastPanel.vue), or [`PropertiesForm.vue`](../Bold_Vision_CRM/src/components/properties/PropertiesForm.vue) — they're the canonical reference implementations
3. If you're building something new that doesn't fit, **don't invent** in scoped CSS first — discuss the pattern and decide whether it belongs in tokens, in shared components CSS, or as a one-off

The goal is that every page in the app feels like it was designed by the same person on the same day.
