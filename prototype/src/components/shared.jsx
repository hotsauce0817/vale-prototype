import { useState, useEffect } from "react";
import { T } from "../tokens.js";

/* ══════════════════ SHARED COMPONENTS ══════════════════ */
export const fmt = (n) => "$" + (n || 0).toLocaleString();
export const fmtSigned = (n) => (n >= 0 ? "+" : "") + "$" + Math.abs(n).toLocaleString();

export function FadeIn({ children, delay = 0, y = 16, style = {} }) {
  const [v, setV] = useState(false);
  useEffect(() => { const t = setTimeout(() => setV(true), delay); return () => clearTimeout(t); }, [delay]);
  return <div style={{ opacity: v ? 1 : 0, transform: v ? "translateY(0)" : `translateY(${y}px)`, transition: "all 0.55s cubic-bezier(0.23,1,0.32,1)", ...style }}>{children}</div>;
}

export function Badge({ children, color = T.gold }) {
  return <span style={{ fontFamily: T.sans, fontSize: "9px", fontWeight: 600, letterSpacing: "2px", color, textTransform: "uppercase" }}>{children}</span>;
}

export function Pill({ children, active, onClick }) {
  return <button onClick={onClick} style={{ fontFamily: T.sans, fontSize: "12px", fontWeight: active ? 600 : 400, letterSpacing: "0.5px", color: active ? T.bg : T.textMid, background: active ? T.gold : T.surface, border: `1px solid ${active ? T.gold : T.border}`, borderRadius: "20px", padding: "8px 18px", cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap" }}>{children}</button>;
}

export function Btn({ children, primary, onClick, full, small }) {
  return <button onClick={onClick} style={{ fontFamily: T.sans, fontSize: small ? "12px" : "13px", fontWeight: 600, letterSpacing: "0.3px", color: primary ? T.bg : T.text, background: primary ? `linear-gradient(135deg, ${T.gold}, ${T.goldLight})` : "transparent", border: primary ? "none" : `1px solid ${T.border}`, borderRadius: "10px", padding: small ? "8px 16px" : "12px 24px", cursor: "pointer", width: full ? "100%" : "auto", transition: "all 0.2s" }}>{children}</button>;
}

export function Card({ children, style = {} }) {
  return <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: "14px", padding: "24px", ...style }}>{children}</div>;
}

export function TopBar({ left, right, onBack }) {
  return <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 24px", borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      {onBack && <button onClick={onBack} style={{ background: "none", border: "none", color: T.textMid, cursor: "pointer", fontFamily: T.sans, fontSize: "13px" }}>← Back</button>}
      <Badge>{left || "VALE"}</Badge>
    </div>
    {right && <span style={{ fontFamily: T.sans, fontSize: "11px", color: T.textFaint }}>{right}</span>}
  </div>;
}

export function ValeAvatar({ size = 20 }) {
  return <div style={{ width: size, height: size, borderRadius: "50%", background: T.goldFaint, border: `1px solid rgba(200,164,86,0.2)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><span style={{ fontFamily: T.sans, fontSize: size * 0.4, fontWeight: 700, color: T.gold }}>V</span></div>;
}
