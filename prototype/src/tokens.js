/* ══════════════════ DESIGN TOKENS ══════════════════ */
/*
 * Vale's visual language: "a sheltered valley" — warm, safe, trustworthy.
 * Not a terminal. Not a dashboard. A place you'd bring your financial life.
 *
 * Color philosophy:
 * - Warm cream backgrounds (not stark white, not dark)
 * - Status colors code diagnostic state, NOT domain
 * - Gold accent for brand, observations, and active elements
 * - Semantic colors for findings: red (act now), orange (plan ahead), blue (investigate)
 */

export const T = {
  // ── Backgrounds ──
  bg: "#FAF8F5",                          // warm cream — primary background
  bgSub: "#F5F2ED",                       // slightly warmer — secondary surfaces
  surface: "#FFFFFF",                     // card backgrounds

  // ── Text hierarchy ──
  text: "#1C1917",                        // primary text
  textMid: "#8C8578",                     // secondary text (summaries, descriptions)
  textDim: "#B5AFA6",                     // tertiary text (labels, captions)

  // ── Borders ──
  border: "rgba(0,0,0,0.07)",            // standard border
  borderHover: "rgba(0,0,0,0.12)",       // hover state border

  // ── Brand accent ──
  accent: "#8B7D3C",                     // warm gold — primary brand color
  accentFaint: "rgba(139,125,60,0.06)",  // gold tint for backgrounds
  accentBorder: "rgba(139,125,60,0.15)", // gold border for observations
  accentMid: "rgba(139,125,60,0.5)",     // gold at 50% opacity

  // ── Semantic colors (status-based, NOT domain-based) ──
  green: "#3D7A52",                      // confirmed good, resolved, positive
  greenFaint: "rgba(61,122,82,0.07)",

  red: "#B84233",                        // needs immediate attention, costs, risks
  redFaint: "rgba(184,66,51,0.07)",

  blue: "#4A7B9B",                       // informational, in-progress, investigate
  blueFaint: "rgba(74,123,155,0.07)",

  purple: "#7B619B",                     // advisor tier
  purpleFaint: "rgba(123,97,155,0.07)",

  orange: "#9B7B2F",                     // amber — caution, plan ahead, warning
  orangeFaint: "rgba(155,123,47,0.07)",

  // ── Typography ──
  serif: "'Source Serif 4', Georgia, serif",
  sans: "'DM Sans', system-ui, -apple-system, sans-serif",
};

export const FONT_URL = "https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,300;0,8..60,400;0,8..60,500;0,8..60,600;1,8..60,400&family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap";
