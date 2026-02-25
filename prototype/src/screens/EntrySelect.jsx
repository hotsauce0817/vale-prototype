import { useState } from "react";
import { T } from "../tokens.js";
import { FadeIn, Badge } from "../components/shared.jsx";

export default function EntrySelect({ onRinka, onOpen }) {
  const [hov, setHov] = useState(null);
  const [showOpen, setShowOpen] = useState(false);

  return <div style={{ minHeight: "100vh", background: T.bg, padding: "40px 20px" }}>
    <div style={{ maxWidth: "600px", margin: "0 auto" }}>
      <FadeIn delay={100}>
        <Badge>VALE</Badge>
        <h1 style={{ fontFamily: T.serif, fontSize: "36px", fontWeight: 300, color: T.text, margin: "16px 0 8px", letterSpacing: "-0.5px" }}>The AI Family Office</h1>
        <p style={{ fontFamily: T.sans, fontSize: "14px", color: T.textMid, lineHeight: 1.6, margin: "0 0 40px" }}>See how Vale surfaces what you're missing — and what it costs you not to know.</p>
      </FadeIn>

      {/* Rinka demo path */}
      <FadeIn delay={200}>
        <div onClick={onRinka} onMouseEnter={() => setHov("rinka")} onMouseLeave={() => setHov(null)}
          style={{ display: "flex", alignItems: "center", gap: "20px", padding: "20px", borderRadius: "14px", cursor: "pointer", marginBottom: "10px", background: hov === "rinka" ? T.surfaceHover : T.surface, border: `1px solid ${hov === "rinka" ? "rgba(200,164,86,0.2)" : T.border}`, transition: "all 0.2s" }}>
          <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: T.goldFaint, border: "1px solid rgba(200,164,86,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: T.sans, fontSize: "14px", fontWeight: 600, color: T.gold, flexShrink: 0 }}>R</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: T.sans, fontSize: "15px", fontWeight: 500, color: T.text, marginBottom: "4px" }}>See how Vale works</div>
            <div style={{ fontFamily: T.sans, fontSize: "12px", color: T.textDim, lineHeight: 1.5 }}>Walk through a real scenario — a tech employee navigating an acquisition payout</div>
          </div>
          <span style={{ color: T.goldDim, fontSize: "16px" }}>→</span>
        </div>
      </FadeIn>

      {/* Try it yourself path */}
      <FadeIn delay={280}>
        <div onClick={() => setShowOpen(!showOpen)} onMouseEnter={() => setHov("open")} onMouseLeave={() => setHov(null)}
          style={{ display: "flex", alignItems: "center", gap: "20px", padding: "20px", borderRadius: "14px", cursor: "pointer", marginBottom: showOpen ? "2px" : "10px", background: hov === "open" ? T.surfaceHover : T.surface, border: `1px solid ${hov === "open" ? "rgba(200,164,86,0.2)" : T.border}`, transition: "all 0.2s" }}>
          <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "rgba(129,178,154,0.08)", border: "1px solid rgba(129,178,154,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: T.sans, fontSize: "18px", flexShrink: 0 }}>✦</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: T.sans, fontSize: "15px", fontWeight: 500, color: T.text, marginBottom: "4px" }}>Try it yourself</div>
            <div style={{ fontFamily: T.sans, fontSize: "12px", color: T.textDim, lineHeight: 1.5 }}>Run your own diagnostic — tell Vale what's going on and see what it finds</div>
          </div>
          <span style={{ color: T.goldDim, fontSize: "16px", transform: showOpen ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}>→</span>
        </div>
      </FadeIn>

      {/* Sub-options for "Try it yourself" */}
      {showOpen && <FadeIn delay={0} y={8}>
        <div style={{ padding: "8px 0 0 64px", display: "flex", flexDirection: "column", gap: "6px" }}>
          {[
            { key: "equity", label: "Equity event", desc: "Stock options, RSUs, acquisition, IPO" },
            { key: "home", label: "Home purchase", desc: "Buying your first or next home" },
            { key: "generic", label: "Something else", desc: "General financial diagnostic" },
          ].map(opt => (
            <div key={opt.key} onClick={() => onOpen(opt.key)}
              onMouseEnter={() => setHov(opt.key)} onMouseLeave={() => setHov(null)}
              style={{ padding: "12px 16px", borderRadius: "10px", cursor: "pointer", background: hov === opt.key ? T.surfaceHover : "transparent", border: `1px solid ${hov === opt.key ? T.border : "transparent"}`, transition: "all 0.15s" }}>
              <div style={{ fontFamily: T.sans, fontSize: "13px", fontWeight: 500, color: T.text }}>{opt.label}</div>
              <div style={{ fontFamily: T.sans, fontSize: "11px", color: T.textDim, marginTop: "2px" }}>{opt.desc}</div>
            </div>
          ))}
        </div>
      </FadeIn>}
    </div>
  </div>;
}
