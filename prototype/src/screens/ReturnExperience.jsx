import { useState } from "react";
import { T } from "../tokens.js";
import { FadeIn, Badge, Btn, Card, TopBar, ValeAvatar, fmt, fmtSigned } from "../components/shared.jsx";

export default function ReturnExperience({ data, onBack, onHuman }) {
  const hb = data.heartbeat;
  const otc = hb.onTrack ? T.green : T.yellow;
  const [expB, setExpB] = useState(null);
  return <div style={{ minHeight: "100vh", background: T.bg }}>
    <TopBar left="VALE" right="Day 2+ Experience" onBack={onBack} />
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "24px 20px 80px" }}>
      <FadeIn delay={100}><p style={{ fontFamily: T.serif, fontSize: "22px", fontWeight: 300, color: T.text, margin: "0 0 24px" }}>Good morning, {data.name}.</p></FadeIn>
      {/* HEARTBEAT */}
      <FadeIn delay={200}><div style={{ background: "linear-gradient(135deg, rgba(200,164,86,0.06), rgba(200,164,86,0.02))", border: "1px solid rgba(200,164,86,0.12)", borderRadius: "16px", padding: "24px", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "18px" }}><div style={{ width: "8px", height: "8px", borderRadius: "50%", background: otc }} /><span style={{ fontFamily: T.sans, fontSize: "12px", fontWeight: 500, color: otc }}>{hb.onTrack ? "On track this month" : "Behind target this month"}</span></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
          {[["Portfolio", hb.portfolio, hb.portfolioChange, "today"], ["Net Worth", hb.netWorth, hb.netWorthChange, "this mo"], ["Saved", hb.savedMonth, null, `of ${fmt(hb.saveTarget)}`]].map(([label, val, chg, sub], i) => <div key={i}>
            <div style={{ fontFamily: T.sans, fontSize: "10px", fontWeight: 500, letterSpacing: "1.5px", color: T.textDim, textTransform: "uppercase", marginBottom: "6px" }}>{label}</div>
            <div style={{ fontFamily: T.serif, fontSize: "22px", fontWeight: 400, color: T.text, lineHeight: 1 }}>{fmt(val)}</div>
            <div style={{ fontFamily: T.sans, fontSize: "12px", color: chg != null ? (chg >= 0 ? T.green : T.red) : T.textDim, marginTop: "4px" }}>{chg != null ? `${fmtSigned(chg)} ${sub}` : sub}</div>
          </div>)}
        </div>
        <div style={{ marginTop: "16px", height: "4px", background: "rgba(255,255,255,0.06)", borderRadius: "2px", overflow: "hidden" }}><div style={{ height: "100%", width: `${Math.min((hb.savedMonth / hb.saveTarget) * 100, 100)}%`, background: otc, borderRadius: "2px", transition: "width 1s" }} /></div>
      </div></FadeIn>
      {/* AI CONVERSATION */}
      <FadeIn delay={280}><div style={{ marginBottom: "16px" }}>
        <div style={{ background: T.surface, border: "1px solid rgba(200,164,86,0.15)", borderRadius: "14px", padding: "14px 18px", display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }}>
          <ValeAvatar size={28} /><span style={{ fontFamily: T.sans, fontSize: "14px", color: T.textDim, flex: 1 }}>What's on your mind?</span><span style={{ fontFamily: T.sans, fontSize: "12px", color: T.goldDim }}>→</span>
        </div>
        <div style={{ display: "flex", gap: "6px", marginTop: "8px", overflowX: "auto", paddingBottom: "4px" }}>
          {data.aiPrompts.map((p, i) => <div key={i} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: "20px", padding: "8px 14px", cursor: "pointer", flexShrink: 0, maxWidth: "240px" }}>
            <span style={{ fontFamily: T.sans, fontSize: "12px", color: T.textMid, lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{p}</span>
          </div>)}
        </div>
      </div></FadeIn>
      {/* WIP */}
      <FadeIn delay={350}><Card style={{ marginBottom: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "14px" }}><Badge color={T.textMid}>YOUR FOCUS</Badge><span style={{ fontFamily: T.sans, fontSize: "11px", color: T.goldDim }}>{data.wip.progress}% started</span></div>
        <h3 style={{ fontFamily: T.serif, fontSize: "17px", fontWeight: 400, color: T.text, margin: "0 0 14px" }}>{data.wip.label}</h3>
        <div style={{ height: "3px", background: T.surface, borderRadius: "2px", marginBottom: "16px" }}><div style={{ height: "100%", width: `${data.wip.progress}%`, background: T.gold, borderRadius: "2px" }} /></div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {data.wip.items.map((item, i) => <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "16px", height: "16px", borderRadius: "4px", border: `1.5px solid ${i === 0 ? T.gold : T.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i === 0 && <div style={{ width: "6px", height: "6px", borderRadius: "2px", background: T.gold }} />}</div>
            <span style={{ fontFamily: T.sans, fontSize: "13px", color: i === 0 ? T.text : T.textDim }}>{item}</span>
            {i === 0 && <Badge color={T.gold}>IN PROGRESS</Badge>}
          </div>)}
        </div>
      </Card></FadeIn>
      {/* BRIEFING */}
      <FadeIn delay={500}><div style={{ marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px", padding: "0 4px" }}><Badge color={T.gold}>TODAY'S BRIEFING</Badge><div style={{ flex: 1, height: "1px", background: T.border }} /></div>
        {data.briefing.map((b, i) => { const open = expB === i; return <div key={i} onClick={() => setExpB(open ? null : i)} style={{ background: b.urgent ? "rgba(224,122,95,0.06)" : T.surface, border: `1px solid ${b.urgent ? "rgba(224,122,95,0.15)" : T.border}`, borderRadius: "12px", padding: "18px", marginBottom: "8px", cursor: "pointer" }}>
          <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
            <ValeAvatar />
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: T.sans, fontSize: "13.5px", color: T.text, lineHeight: 1.65, margin: 0 }}>{b.text}</p>
              <div style={{ maxHeight: open ? "60px" : 0, opacity: open ? 1 : 0, overflow: "hidden", transition: "all 0.3s" }}>
                <div style={{ paddingTop: "12px", display: "flex", gap: "8px" }}>
                  {b.type === "nudge" ? <Btn primary small>Yes, show me</Btn> : <Btn primary small>Tell me more</Btn>}
                  <Btn small>Not now</Btn>
                </div>
              </div>
            </div>
            {b.urgent && <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: T.red, flexShrink: 0, marginTop: "8px" }} />}
          </div>
        </div>; })}
      </div></FadeIn>
      {/* HORIZON */}
      <FadeIn delay={650}><Card>
        <Badge color={T.textMid}>ON THE HORIZON</Badge>
        <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
          {data.horizon.map((h, i) => <div key={i} style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <span style={{ fontFamily: T.sans, fontSize: "11px", fontWeight: 500, color: h.urgent ? T.red : T.textDim, width: "56px", flexShrink: 0 }}>{h.date}</span>
            <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: h.urgent ? T.red : T.border, flexShrink: 0 }} />
            <span style={{ fontFamily: T.sans, fontSize: "13px", color: h.urgent ? T.text : T.textMid, lineHeight: 1.4 }}>{h.label}</span>
          </div>)}
        </div>
      </Card></FadeIn>
      {/* TALK TO HUMAN */}
      <FadeIn delay={800}><div style={{ marginTop: "24px" }}>
        <div onClick={onHuman} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: "14px", padding: "20px", cursor: "pointer", display: "flex", alignItems: "center", gap: "16px", transition: "all 0.2s" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "rgba(129,178,154,0.1)", border: "1px solid rgba(129,178,154,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ fontSize: "18px" }}>👤</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: T.sans, fontSize: "14px", fontWeight: 500, color: T.text, marginBottom: "4px" }}>Talk to a human advisor</div>
            <div style={{ fontFamily: T.sans, fontSize: "12px", color: T.textDim }}>They'll have full context from your intake and activity</div>
          </div>
          <span style={{ color: T.goldDim }}>→</span>
        </div>
      </div></FadeIn>
    </div>
  </div>;
}
