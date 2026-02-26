import { useState } from "react";
import { T } from "../tokens.js";
import { FadeIn, Badge } from "../components/shared.jsx";

export default function EntrySelect({ onStart }) {
  const [hov, setHov] = useState(false);

  return <div style={{ minHeight: "100vh", background: T.bg, padding: "40px 20px" }}>
    <div style={{ maxWidth: "600px", margin: "0 auto" }}>
      <FadeIn delay={100}>
        <Badge>VALE</Badge>
        <h1 style={{ fontFamily: T.serif, fontSize: "36px", fontWeight: 300, color: T.text, margin: "16px 0 8px", letterSpacing: "-0.5px" }}>The AI Family Office</h1>
        <p style={{ fontFamily: T.sans, fontSize: "14px", color: T.textMid, lineHeight: 1.6, margin: "0 0 40px" }}>See how Vale surfaces what you're missing — and what it costs you not to know.</p>
      </FadeIn>

      <FadeIn delay={200}>
        <div onClick={onStart} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
          style={{ display: "flex", alignItems: "center", gap: "20px", padding: "20px", borderRadius: "14px", cursor: "pointer", background: hov ? T.surfaceHover : T.surface, border: `1px solid ${hov ? "rgba(200,164,86,0.2)" : T.border}`, transition: "all 0.2s" }}>
          <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "rgba(129,178,154,0.08)", border: "1px solid rgba(129,178,154,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: T.sans, fontSize: "18px", flexShrink: 0 }}>&#10022;</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: T.sans, fontSize: "15px", fontWeight: 500, color: T.text, marginBottom: "4px" }}>Try it yourself</div>
            <div style={{ fontFamily: T.sans, fontSize: "12px", color: T.textDim, lineHeight: 1.5 }}>Run your own diagnostic — tell Vale what's going on and see what it finds</div>
          </div>
          <span style={{ color: T.goldDim, fontSize: "16px" }}>&rarr;</span>
        </div>
      </FadeIn>
    </div>
  </div>;
}
