import { useState } from "react";
import { T } from "../tokens.js";
import { FadeIn, Badge, Pill, Btn, TopBar, ValeAvatar } from "../components/shared.jsx";

export default function ModeExplorer({ data, onNext, onBack }) {
  const [mode, setMode] = useState(data.primaryMode);
  const [exp, setExp] = useState(null);
  const modeData = data.modes[mode];
  const ml = { "financial-picture": "Financial Picture", "decision-map": "Decision Map", "what-if": "What If" };
  return <div style={{ minHeight: "100vh", background: T.bg }}>
    <TopBar left="VALE" right={`${data.name}'s focus areas`} onBack={onBack} />
    <div style={{ maxWidth: "640px", margin: "0 auto", padding: "24px 20px 140px" }}>
      <div style={{ display: "flex", gap: "8px", marginBottom: "28px", flexWrap: "wrap" }}>
        {Object.keys(ml).map(m => <Pill key={m} active={mode === m} onClick={() => { setMode(m); setExp(null); }}>{ml[m]}{m === data.primaryMode ? " ★" : ""}</Pill>)}
      </div>
      <FadeIn key={mode} delay={0}>
        <h2 style={{ fontFamily: T.serif, fontSize: "28px", fontWeight: 300, color: T.text, margin: "0 0 8px" }}>{modeData.title}</h2>
        <p style={{ fontFamily: T.sans, fontSize: "14px", color: T.textMid, lineHeight: 1.6, margin: "0 0 28px" }}>{modeData.subtitle}</p>
      </FadeIn>
      {mode === "financial-picture" && modeData.items.map((item, i) => {
        const open = exp === `fp-${i}`, uc = item.urgency === "high" ? T.red : T.gold;
        return <FadeIn key={`fp-${i}`} delay={i * 50}><div onClick={() => setExp(open ? null : `fp-${i}`)} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: "14px", padding: "22px", marginBottom: "10px", cursor: "pointer", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, width: "3px", height: "100%", background: `linear-gradient(180deg, ${uc}, transparent)`, opacity: 0.7 }} />
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}><span style={{ fontFamily: T.serif, fontSize: "16px", color: uc }}>{item.icon}</span><Badge color={T.goldDim}>{item.cat}</Badge></div>
          <h3 style={{ fontFamily: T.serif, fontSize: "17px", fontWeight: 400, color: T.text, margin: "0 0 8px", lineHeight: 1.4 }}>{item.title}</h3>
          <p style={{ fontFamily: T.sans, fontSize: "13px", color: T.textMid, lineHeight: 1.65, margin: 0 }}>{item.body}</p>
          <div style={{ maxHeight: open ? "80px" : 0, opacity: open ? 1 : 0, overflow: "hidden", transition: "all 0.4s" }}>
            <div style={{ paddingTop: "16px", borderTop: `1px solid ${T.border}`, marginTop: "16px", display: "flex", alignItems: "center", gap: "16px" }}>
              <span style={{ fontFamily: T.sans, fontSize: "12px", color: T.gold }}>→ {item.action}</span>
              <Btn small>Ask the AI</Btn>
            </div>
          </div>
        </div></FadeIn>;
      })}
      {mode === "decision-map" && modeData.items.map((item, i) => {
        const open = exp === `dm-${i}`, sc = item.status === "now" ? T.gold : item.status === "next" ? T.textMid : T.textDim;
        return <FadeIn key={`dm-${i}`} delay={i * 50}><div onClick={() => setExp(open ? null : `dm-${i}`)} style={{ display: "flex", gap: "18px", marginBottom: "10px", cursor: "pointer" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, width: "32px" }}>
            <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: item.status === "now" ? T.goldFaint : T.surface, border: `2px solid ${sc}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: T.sans, fontSize: "11px", fontWeight: 700, color: sc }}>{item.step}</div>
            {i < modeData.items.length - 1 && <div style={{ width: "2px", flex: 1, background: T.border, marginTop: "4px" }} />}
          </div>
          <div style={{ flex: 1, background: T.surface, border: `1px solid ${T.border}`, borderRadius: "14px", padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}><h3 style={{ fontFamily: T.sans, fontSize: "14px", fontWeight: 500, color: T.text, margin: 0 }}>{item.title}</h3><Badge color={sc}>{item.status.toUpperCase()}</Badge></div>
            <p style={{ fontFamily: T.sans, fontSize: "13px", color: T.textMid, lineHeight: 1.65, margin: 0 }}>{item.body}</p>
            <div style={{ maxHeight: open ? "60px" : 0, opacity: open ? 1 : 0, overflow: "hidden", transition: "all 0.4s" }}>
              <div style={{ paddingTop: "14px", display: "flex", alignItems: "center", gap: "16px" }}>
                <span style={{ fontFamily: T.sans, fontSize: "12px", color: item.status === "now" ? T.gold : T.textDim }}>
                  {item.status === "now" ? "→ Ready to execute" : "→ Coming up"}
                </span>
                <Btn small>Ask the AI</Btn>
              </div>
            </div>
          </div>
        </div></FadeIn>;
      })}
      {mode === "what-if" && modeData.scenarios.map((s, i) => {
        const open = exp === `wi-${i}`;
        return <FadeIn key={`wi-${i}`} delay={i * 50}><div onClick={() => setExp(open ? null : `wi-${i}`)} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: "14px", marginBottom: "10px", overflow: "hidden", cursor: "pointer" }}>
          <div style={{ padding: "20px 22px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontFamily: T.serif, fontSize: "16px", fontWeight: 400, fontStyle: "italic", color: T.text, margin: 0, lineHeight: 1.4, flex: 1, paddingRight: "12px" }}>"{s.q}"</h3>
            <span style={{ color: T.textDim, fontSize: "14px", transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.3s" }}>▾</span>
          </div>
          <div style={{ maxHeight: open ? "400px" : 0, opacity: open ? 1 : 0, overflow: "hidden", transition: "all 0.5s" }}>
            <div style={{ padding: "0 22px 20px", borderTop: `1px solid ${T.border}` }}>
              <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}><ValeAvatar /><p style={{ fontFamily: T.sans, fontSize: "13px", color: T.textMid, lineHeight: 1.7, margin: 0 }}>{s.a}</p></div>
              <div style={{ marginTop: "14px", paddingLeft: "30px" }}>
                <span style={{ fontFamily: T.sans, fontSize: "12px", color: T.gold }}>→ Dig deeper</span>
              </div>
            </div>
          </div>
        </div></FadeIn>;
      })}
      <FadeIn delay={300}><div style={{ marginTop: "32px", textAlign: "center" }}>
        <p style={{ fontFamily: T.sans, fontSize: "12px", color: T.textDim, marginBottom: "12px" }}>See what {data.name} would see on Day 2 →</p>
        <Btn primary onClick={onNext}>View return experience</Btn>
      </div></FadeIn>
    </div>
    {/* Floating AI */}
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100, padding: "12px 20px 20px", background: `linear-gradient(transparent, ${T.bg} 30%)`, pointerEvents: "none" }}>
      <div style={{ maxWidth: "640px", margin: "0 auto", pointerEvents: "auto" }}>
        <div style={{ background: "rgba(14,19,40,0.95)", backdropFilter: "blur(12px)", border: "1px solid rgba(200,164,86,0.15)", borderRadius: "14px", padding: "12px 16px", display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", boxShadow: "0 -4px 24px rgba(0,0,0,0.4)" }}>
          <ValeAvatar size={24} /><span style={{ fontFamily: T.sans, fontSize: "13px", color: T.textDim, flex: 1 }}>Ask me anything about your finances...</span><span style={{ fontFamily: T.sans, fontSize: "11px", color: T.goldDim }}>→</span>
        </div>
      </div>
    </div>
  </div>;
}
