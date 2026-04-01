# Vale Design Tokens

One-paragraph summary: Vale's visual language is built around the metaphor of a sheltered valley — warm, safe, trustworthy. The design system uses warm cream backgrounds (not stark white), a deep gold accent, and semantic status colors. This document defines every token, explains the brand rationale, and provides usage guidance for designers and engineers joining the team.

**Last updated:** 2026-03-10
**Source file:** `prototype/src/tokens.js`

---

## Brand Rationale

**Vale = a sheltered valley.** The name evokes protection, calm, and natural beauty. The visual language follows: warm earth tones, not corporate blue. Cream backgrounds, not white. Gold accents, not neon. The experience should feel like a place you'd bring your financial life — trusted, substantial, unhurried.

**What Vale is NOT:**
- Not a terminal or dashboard (no dark mode, no monospace, no data-dense grids)
- Not a fintech app (no gradients, no gamification, no progress rings)
- Not a bank (no navy blue, no corporate sterility)

**The feel:** A private office with warm light. Your advisor has a cup of coffee, not a Bloomberg terminal.

---

## Color System

### Backgrounds

| Token | Value | Usage |
|---|---|---|
| `bg` | `#FDFAF5` | Warm cream. Primary page background. |
| `bgSub` | `#F7F3EC` | Slightly warmer. Map panel, secondary surfaces, sidebar. |
| `surface` | `#FFFFFF` | Pure white. Card backgrounds, input fields. Creates subtle elevation. |

**Design note:** The warm cream (`bg`) is the signature. It immediately distinguishes Vale from every white-background fintech app. The subtle difference between `bg` and `bgSub` creates depth without borders.

### Text Hierarchy

| Token | Value | Usage |
|---|---|---|
| `text` | `#1a1a1a` | Primary text. Near-black, not pure black (softer on cream). |
| `textMid` | `#6b6358` | Secondary text. Summaries, descriptions, supporting copy. |
| `textDim` | `#a09888` | Tertiary text. Labels, captions, timestamps, placeholders. |

**Design note:** Three levels is sufficient. Avoid creating additional text colors — use font weight or size for further differentiation.

### Borders

| Token | Value | Usage |
|---|---|---|
| `border` | `rgba(0,0,0,0.06)` | Standard border. Subtle, almost invisible on cream. |
| `borderHover` | `rgba(0,0,0,0.10)` | Hover state. Slightly more visible for interactive elements. |

**Design note:** Borders use low-opacity black rather than named colors. This ensures they work on both `bg` and `surface` backgrounds without looking different.

### Brand Accent (Gold)

| Token | Value | Usage |
|---|---|---|
| `accent` | `#8B6D2E` | Deep warm gold. Primary brand color. Buttons, links, observation markers. |
| `accentFaint` | `rgba(139,109,46,0.06)` | Gold tint for backgrounds. Observation card fill, hover states. |
| `accentBorder` | `rgba(139,109,46,0.15)` | Gold border for observations and active elements. |
| `accentMid` | `rgba(139,109,46,0.5)` | Gold at 50% opacity. Secondary emphasis. |

**Design note:** Gold is used sparingly — only for brand moments (observations, CTAs, active states). Overusing it dilutes its impact.

### Semantic Colors (Status-Based)

**Critical rule: Colors code STATUS, not DOMAIN.** This was a dogfooding lesson — domain-based colors broke on cross-domain findings. Domain tags (CASH FLOW, EQUITY, etc.) were removed from the map UI entirely in the March 2026 map redesign — they leaked internal AI categories into the user-facing map where they made no sense (see `lessons.md`).

**Map status colors (4 levels):**
- **Gray** (`textDim` / `#a09888`) — `neutral`: just learned, no diagnostic assessment yet
- **Green** (`green` / `#4A8B6A`) — `good`: confirmed solid, no issue
- **Gold** (`accent` / `#8B6D2E`) — `warning`: worth investigating further
- **Red** (`red` / `#C05A42`) — `alert`: needs immediate attention (dot pulses)

| Token | Value | Usage |
|---|---|---|
| `green` | `#4A8B6A` | Confirmed good, resolved, positive status. |
| `greenFaint` | `rgba(74,139,106,0.07)` | Green tint for backgrounds. |
| `red` | `#C05A42` | Needs immediate attention. Costs, risks, `act_now` urgency. |
| `redFaint` | `rgba(192,90,66,0.07)` | Red tint for backgrounds. |
| `blue` | `#4A7B9B` | Informational, in-progress, `investigate` urgency. |
| `blueFaint` | `rgba(74,123,155,0.07)` | Blue tint for backgrounds. |
| `purple` | `#7B619B` | Advisor tier indicator. **Report cards ONLY — never on the map.** |
| `purpleFaint` | `rgba(123,97,155,0.07)` | Purple tint for backgrounds. |
| `orange` | `#B8863B` | Caution, `plan_ahead` urgency. |
| `orangeFaint` | `rgba(184,134,59,0.07)` | Orange tint for backgrounds. |

### Color Mapping to Product Concepts

| Concept | Color | Token |
|---|---|---|
| Map item: good | Green | `green` |
| Map item: warning/investigate | Gold | `accent` |
| Map item: alert/needs attention | Red | `red` |
| Observation card | Gold border + faint fill | `accentBorder` + `accentFaint` |
| Report: act_now urgency | Red | `red` |
| Report: plan_ahead urgency | Orange | `orange` |
| Report: investigate urgency | Blue | `blue` |
| Report: advisor tier badge | Purple | `purple` |

---

## Typography

| Token | Value | Usage |
|---|---|---|
| `serif` | `'Spectral', Georgia, serif` | Headlines, hero text, the Vale wordmark. Warm, literary, trustworthy. |
| `sans` | `'Inter', system-ui, -apple-system, sans-serif` | Body text, UI elements, buttons, labels. Clean, modern, readable. |

**Font loading:** Both fonts loaded via Google Fonts in `tokens.js`:
```
https://fonts.googleapis.com/css2?family=Spectral:ital,wght@0,300;0,400;1,300;1,400&family=Inter:wght@400;500;600;700&display=swap
```

**Spectral usage:**
- Landing page headline
- Observation card text (for emphasis)
- Report headline
- Any text that should feel "editorial" or "considered"

**Inter usage:**
- Everything else: chat messages, map labels, buttons, form inputs, status badges

**Design note:** The serif/sans pairing creates a "premium editorial" feel. Spectral signals trust and permanence. Inter signals clarity and modernity. Don't mix them within a sentence — use one or the other per text block.

---

## Implementation Notes

### How Tokens Are Used

All styles in the codebase reference `T.` (the exported tokens object). Example:

```jsx
<div style={{ background: T.bg, color: T.text, fontFamily: T.sans }}>
  <h1 style={{ fontFamily: T.serif, color: T.accent }}>Vale</h1>
</div>
```

### No CSS Framework

Vale uses inline styles with tokens. No Tailwind, no styled-components, no CSS modules. This is intentional at prototype stage — it keeps the design system explicit and makes token usage visible in code.

### Faint Variants

Every semantic color has a `Faint` variant at ~7% opacity. These are used for card backgrounds and subtle fills. The pattern is consistent: solid color for text/borders, faint for backgrounds.

---

## Spacing & Radius

Not yet tokenized — currently using inline pixel values. Should be extracted to tokens when the component library grows. Current patterns:

- Card padding: `24px`
- Card border radius: `16px`
- Badge border radius: `999px` (pill shape)
- Section spacing: `32px`
- Compact spacing: `12px`
