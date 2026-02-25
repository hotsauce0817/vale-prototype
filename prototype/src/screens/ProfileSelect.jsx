import { useState } from "react";
import { T } from "../tokens.js";
import { PROFILES, PROFILE_ORDER } from "../data/profiles.js";
import { FadeIn, Badge } from "../components/shared.jsx";

export default function ProfileSelect({ onSelect }) {
  const [hov, setHov] = useState(null);
  return <div style={{ minHeight: "100vh", background: T.bg, padding: "40px 20px" }}>
    <div style={{ maxWidth: "600px", margin: "0 auto" }}>
      <FadeIn delay={100}><Badge>VALE</Badge>
        <h1 style={{ fontFamily: T.serif, fontSize: "36px", fontWeight: 300, color: T.text, margin: "16px 0 8px", letterSpacing: "-0.5px" }}>Choose a customer profile</h1>
        <p style={{ fontFamily: T.sans, fontSize: "14px", color: T.textMid, lineHeight: 1.6, margin: "0 0 40px" }}>Each profile is built from real customer discovery interviews. Full flow: diagnostic intake → mode exploration → return experience → human handoff.</p>
      </FadeIn>
      {PROFILE_ORDER.map((k, i) => { const p = PROFILES[k]; return <FadeIn key={k} delay={200 + i * 80}>
        <div onClick={() => onSelect(k)} onMouseEnter={() => setHov(k)} onMouseLeave={() => setHov(null)}
          style={{ display: "flex", alignItems: "center", gap: "20px", padding: "20px", borderRadius: "14px", cursor: "pointer", marginBottom: "10px", background: hov === k ? T.surfaceHover : T.surface, border: `1px solid ${hov === k ? "rgba(200,164,86,0.2)" : T.border}`, transition: "all 0.2s" }}>
          <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: T.goldFaint, border: "1px solid rgba(200,164,86,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: T.sans, fontSize: "14px", fontWeight: 600, color: T.gold, flexShrink: 0 }}>{p.avatar}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: T.sans, fontSize: "15px", fontWeight: 500, color: T.text, marginBottom: "4px" }}>{p.name}{p.partnerName ? ` & ${p.partnerName}` : ""}</div>
            <div style={{ fontFamily: T.sans, fontSize: "12px", color: T.textDim, lineHeight: 1.5 }}>{p.tagline}</div>
          </div>
          <span style={{ color: T.goldDim, fontSize: "16px" }}>→</span>
        </div></FadeIn>; })}
    </div>
  </div>;
}
