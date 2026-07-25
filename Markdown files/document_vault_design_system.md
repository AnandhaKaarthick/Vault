# Design System: Intelligent Catch-All Document Vault

## 1. Design thesis

The product's job is to take the anxiety out of "where did I put that document." The visual language should feel like a **well-run records office**, not a generic SaaS dashboard: calm, precise, slightly analog in its references (index cards, rubber stamps, ledger ink) but executed with modern digital polish. Every screen should reassure the user that their bill, ID, and medical record are being handled carefully — nothing playful or cluttered, nothing cold or clinical either.

**Signature element:** when a document finishes processing, its card doesn't just "update" — a category badge lands on the card like a **rubber stamp being pressed down** (a quick, weighted scale+settle animation, occasionally a hair off-axis, 1–2° rotation), while the auto-generated title types in underneath like a label being typed on a index card. This is the one moment of personality in the product; everything else stays quiet.

Avoid: warm cream-and-terracotta AI-default palette, near-black-with-neon-accent palette, and dense broadsheet newspaper layouts. None of those evoke "records office" — they evoke "generic AI app."

---

## 2. Color system

Base palette is cool and paper-like (not warm cream), with an ink-green primary and a brass/stamp-red pair for accents. Six named colors:

| Token | Hex | Role |
|---|---|---|
| `paper` | `#EDEFE9` | App background — cool sage-white, like archival paper, not cream |
| `ink` | `#1C2620` | Primary text, icons, dark surfaces — deep bottle-green-black |
| `ledger` | `#28493F` | Primary brand color — buttons, active states, links |
| `brass` | `#A9812E` | Secondary accent — starred items, highlights, hover states |
| `stamp` | `#B4402F` | Alert accent — expiring soon, due dates, destructive actions |
| `card` | `#FFFFFF` | Document card / surface background, elevated above `paper` |

Supporting neutrals (derive, don't invent new hues):
- `ink/60` (`#1C2620` at 60% opacity) — secondary text
- `ink/12` — hairline borders/dividers
- `ledger/10` — subtle selected/active row background

### Category badge colors
Each category gets a muted, desaturated tone from a shared family so the grid never looks like a rainbow — these read as **ink stamp colors**, not flat UI chips:

| Category | Hex | Notes |
|---|---|---|
| Tax | `#5B4636` | sepia brown, like an old ledger stamp |
| Medical | `#3E5C76` | muted slate blue |
| Utility | `#4B6C50` | muted olive-green |
| Travel | `#8A6A3D` | ochre/brass-adjacent |
| Receipts | `#6B5B73` | muted plum-grey |
| Identity | `#7A3B36` | deep clay-red, signals "sensitive" |

Identity and Financial-adjacent categories (Identity, Tax) can additionally carry a small lock glyph in the badge, reinforcing the step-up auth gate visually before the user even clicks in.

---

## 3. Typography

Three roles, deliberately not the "safe serif + Inter" default pairing:

| Role | Typeface | Usage |
|---|---|---|
| Display | **Fraunces** (serif, use weight 500–600, optical size "soft") | Page titles, empty states, the vault name, modals |
| Body / UI | **IBM Plex Sans** | Buttons, nav, body copy, filter chips, form labels |
| Utility / Data | **IBM Plex Mono** | Extracted metadata (amounts, dates, account numbers, PNRs), timestamps, job status, file hashes |

Rationale: Fraunces gives the display type a bit of ceremony (this is *your* records, treat it with some weight) without going full editorial-serif-cliché. Plex Sans is quiet and legible at small UI sizes. Plex Mono is used specifically for **extracted structured fields** — this does double duty as a design decision *and* a trust signal: mono formatting visually says "this value was read off the document precisely," distinguishing machine-extracted data from AI-written prose (the summary, which stays in Plex Sans, italic).

### Type scale

| Token | Size / Line-height | Weight | Face |
|---|---|---|---|
| `display-lg` | 40px / 44px | 600 | Fraunces |
| `display-sm` | 26px / 32px | 500 | Fraunces |
| `body-lg` | 16px / 24px | 400 | Plex Sans |
| `body-sm` | 13px / 18px | 400 | Plex Sans |
| `label` | 12px / 16px, uppercase, +0.04em tracking | 500 | Plex Sans |
| `mono-data` | 13px / 18px | 500 | Plex Mono |
| `mono-caption` | 11px / 14px | 400 | Plex Mono |

---

## 4. Layout

Single-column-of-cards dashboard, not a sidebar-heavy admin panel — this is a personal inbox, not an enterprise tool.

```
┌──────────────────────────────────────────────┐
│  Vault            [search: plain-english...]  │  <- sticky top bar
│  My Documents                    [+ Upload]   │
├──────────────────────────────────────────────┤
│ [All] [PDFs] [Images] [Expiring Soon]         │  <- filter chips, horiz scroll on mobile
│ [Added This Week] [Starred]                   │
├──────────────────────────────────────────────┤
│ ┌────────────┐ ┌────────────┐ ┌────────────┐ │
│ │ card        │ │ card        │ │ card        │ │  <- responsive grid,
│ │             │ │             │ │             │ │     1 col mobile / 2 tablet / 3+ desktop
│ └────────────┘ └────────────┘ └────────────┘ │
└──────────────────────────────────────────────┘
```

- Max content width ~1180px, generous gutters (24px mobile, 32px+ desktop) — nothing feels cramped; this is where people keep sensitive paperwork, density should feel unhurried.
- Upload zone is not a separate page: dragging anywhere over the dashboard surfaces a full-viewport dashed-border overlay in `ledger/10` with a Fraunces "Drop to file it away" prompt.
- 8px base spacing unit; corner radius 10px on cards (soft, not sharp broadsheet corners; not pill-shaped either — a filed document, not a bubbly app icon).

---

## 5. Core components

### Document card — three states
1. **Uploading:** thin `brass` progress bar along the card's top edge, filename shown as-is (`IMG_0098.pdf`) in `mono-caption`, grey placeholder blocks where title/summary will go.
2. **Processing:** placeholder blocks pulse gently (opacity 0.4↔0.7, 1.6s ease, respects `prefers-reduced-motion` by holding static at 0.55 instead of pulsing). Status label: "Reading your document…" in `body-sm`, `ink/60`.
3. **Done:** the signature stamp animation plays once (category badge scales in from 1.15→1.0 with a 120ms overshoot, settles at a −1.5° to 1.5° random rotation), generated title fades/types in below, 2-sentence summary in italic Plex Sans, key extracted fields listed in `mono-data` (e.g. `Due · 14 Aug 2026` / `Total · ₹2,340.00`).

### Search bar
Full-width, `card` background, placeholder text is a real example query in `body-sm` italic — e.g. *"how much was my electricity bill last month"* — rotating through 3–4 examples so the plain-English capability is self-evident, never a generic "Search…" placeholder.

### Filter chips
Pill-shaped, `ink/12` border, `ledger/10` fill when active, `label` type. "Expiring Soon" chip carries a small `stamp`-colored dot when count > 0.

### Expiry alert
Not a modal — a slim banner row pinned above the grid, `stamp` colored left border (4px), `ink` text: "Your ICICI Bank Statement's linked utility bill is due in 3 days." Dismissible per-item, never blocking.

### Step-up re-authentication
For Identity/Financial categories: a centered modal, `card` surface, Fraunces headline "Confirm it's you," Plex Sans body explaining why (name the reason, don't just gate silently), password field or WebAuthn prompt. No Face ID/fingerprint iconography on web — use a key/shield glyph, not a biometric one, since there's no such sensor to reference honestly.

### Empty states
Written in the interface's voice, direction-first: "Nothing filed yet. Drop a document anywhere on this page to get started." Never "No documents found 😢."

---

## 6. Motion

- **Stamp-in** (described above) is the one orchestrated, memorable moment — used once per document, on completion only.
- All other motion is restrained: 120–160ms ease-out for hover/press states, no bouncing, no parallax.
- Respect `prefers-reduced-motion`: disable the stamp rotation/overshoot (fade + settle flat instead) and the placeholder pulse (hold at fixed opacity).
- Focus states: visible 2px `ledger` outline with 2px offset on every interactive element — this is a security-sensitive product, keyboard users handling ID documents need clear focus at all times.

---

## 7. Iconography

Simple, single-weight line icons (1.5px stroke), no filled/duotone icons — keep the "stamped ink" feeling consistent rather than mixing icon styles. Category icons should be literal and recognizable at 16px: a receipt for Receipts, a plane for Travel, a pill/cross for Medical, a plug for Utility, a document-with-seal for Identity, a percent/coin for Tax.

---

## 8. Voice & microcopy

- Active voice, plain verbs: "File it away," "Confirm it's you," "Due in 3 days" — not "Submission successful" or "Authentication required."
- The system never apologizes or hedges in errors: "Couldn't read this file — try a clearer scan or a different format," not "Oops, something went wrong!"
- Button labels match the toast/result that follows: "Upload" → card shows "Uploaded," never a mismatched "Success!"
- AI-written content (titles, summaries) stays in body italic to visually mark it as generated; extracted structured fields stay in mono to mark them as read directly off the document. This distinction is both a design and a trust decision — the user should always be able to tell what the AI wrote versus what it found.

---

## 9. Accessibility & responsiveness

- Color contrast: `ink` on `paper` and `card` exceeds WCAG AA at all body sizes; category badge colors are paired with an icon + text label, never color alone, since several users may be color-vision-deficient and these badges carry meaningful (sometimes financial/medical) distinctions.
- Grid collapses to a single column under 640px; filter chips become a horizontally scrollable row with a fade-edge hint rather than wrapping.
- All modals (step-up auth especially) trap focus and are dismissible via Escape, with the trigger element receiving focus back on close.
