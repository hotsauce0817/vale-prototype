import { useState, useEffect } from "react";
import { T } from "../tokens.js";

/* ══════════════════ SHARED COMPONENTS ══════════════════
 *
 * Reusable UI primitives for Vale's design system.
 * All use inline styles referencing T.* tokens (see tokens.js).
 *
 * FadeIn            — Entrance animation (fade + slide up). Wraps any content.
 * Badge             — Uppercase label for section headers (e.g., "FINDINGS", "VALE").
 * Pill              — Toggle button with active/inactive states.
 * Btn               — Standard button. primary=filled gold, default=ghost outline.
 * Card              — White surface card with border and subtle shadow.
 * TopBar            — Top navigation bar with "Vale" branding and optional back button.
 * ObservationMarker — Gold ✦ circle icon. Marks AI observations in the chat.
 * ════════════════════════════════════════════════════════ */

/**
 * Entrance animation: fade in + slide up from `y` pixels below.
 * Used on nearly every visible element — landing page, chat messages, map items, report cards.
 * Stagger children by passing increasing `delay` values.
 */
export function FadeIn({ children, delay = 0, y = 16, style = {} }) {
  const [v, setV] = useState(false);
  useEffect(() => { const t = setTimeout(() => setV(true), delay); return () => clearTimeout(t); }, [delay]);
  return <div style={{ opacity: v ? 1 : 0, transform: v ? "translateY(0)" : `translateY(${y}px)`, transition: "all 0.55s cubic-bezier(0.23,1,0.32,1)", ...style }}>{children}</div>;
}

/** Uppercase label — used for section headers ("FINDINGS", "YOUR DIAGNOSIS", domain names). */
export function Badge({ children, color = T.accent }) {
  return <span style={{ fontFamily: T.sans, fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.08em", color, textTransform: "uppercase" }}>{children}</span>;
}

/** Toggle pill button — gold fill when active, ghost when inactive. */
export function Pill({ children, active, onClick }) {
  return <button onClick={onClick} style={{
    fontFamily: T.sans, fontSize: "12px", fontWeight: active ? 600 : 400,
    letterSpacing: "0.5px", color: active ? "#FFFFFF" : T.textMid,
    background: active ? T.accent : T.surface,
    border: `1px solid ${active ? T.accent : T.border}`,
    borderRadius: "20px", padding: "8px 18px", cursor: "pointer",
    transition: "all 0.2s", whiteSpace: "nowrap",
  }}>{children}</button>;
}

/** Standard button. primary=true → filled gold background. Default → ghost with border. */
export function Btn({ children, primary, onClick, full, small, color }) {
  const bg = primary ? (color || T.accent) : "transparent";
  return <button onClick={onClick} style={{
    fontFamily: T.sans, fontSize: small ? "12px" : "12px", fontWeight: 600,
    color: primary ? "#FFFFFF" : T.text,
    background: bg,
    border: primary ? "none" : `1px solid ${T.border}`,
    borderRadius: "8px",
    padding: small ? "7px 14px" : "10px 20px",
    cursor: "pointer", width: full ? "100%" : "auto",
    transition: "all 0.2s",
  }}>{children}</button>;
}

/** White surface card with subtle border and shadow. The base container for findings, insights, map items. */
export function Card({ children, style = {} }) {
  return <div style={{
    background: T.surface, border: `1px solid ${T.border}`, borderRadius: "14px",
    padding: "18px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
    transition: "box-shadow 0.2s",
    ...style,
  }}>{children}</div>;
}

/** Top navigation bar. Shows "Vale" (serif, gold) on the left, optional context text on right, optional back button. */
export function TopBar({ left, right, onBack }) {
  return <div style={{
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "14px 28px", borderBottom: `1px solid ${T.border}`,
    background: T.surface, flexShrink: 0,
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      {onBack && <button onClick={onBack} style={{ background: "none", border: "none", color: T.textMid, cursor: "pointer", fontFamily: T.sans, fontSize: "13px", padding: 0 }}>← Back</button>}
      <span style={{ fontFamily: T.serif, fontSize: "18px", fontWeight: 400, color: T.accent }}>{left || "Vale"}</span>
    </div>
    {right && <span style={{ fontFamily: T.sans, fontSize: "11px", color: T.textDim }}>{right}</span>}
  </div>;
}

/** Gold circle with ✦ sparkle icon. Appears next to AI observation cards in the chat to visually distinguish insights from regular messages. */
export function ObservationMarker({ size = 26 }) {
  return <div style={{
    width: size, height: size, borderRadius: "50%",
    background: T.accentFaint, border: `1px solid ${T.accentBorder}`,
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  }}><span style={{ fontFamily: T.sans, fontSize: size * 0.5, color: T.accent }}>✦</span></div>;
}
