import { useState, useEffect } from "react";
import { T } from "../tokens.js";
import { FadeIn, Badge, Btn, Card, TopBar, ValeAvatar } from "../components/shared.jsx";

export default function HumanHandoff({ data, postDiagnosisData, diagnosis, onBack }) {
  const [view, setView] = useState("user");
  const [step, setStep] = useState(0);

  // Resolve data source — hardcoded profile or AI-generated
  const d = data || postDiagnosisData;

  // Derive safe values with fallbacks
  const name = d?.name || diagnosis?.name || "there";
  const partnerName = d?.partnerName || null;
  const avatar = d?.avatar || name.charAt(0).toUpperCase();
  const context = d?.context || "";
  const primaryMode = d?.primaryMode || diagnosis?.primaryMode || "financial-picture";
  const ab = d?.advisorBrief || null;
  const diagnosed = d?.diagnosed
    || (diagnosis?.diagnosed_gaps || []).map(g => typeof g === "string" ? g : (g.title || g.body || JSON.stringify(g)));

  useEffect(() => {
    if (step === 0) { const t = setTimeout(() => setStep(1), 2000); return () => clearTimeout(t); }
  }, [step]);

  return <div style={{ minHeight: "100vh", background: T.bg }}>
    <TopBar left="VALE" right="Human Advisor" onBack={onBack} />
    {/* View toggle */}
    <div style={{ display: "flex", justifyContent: "center", padding: "16px 20px 0", gap: "4px" }}>
      {[["user", "Client view"], ["advisor", "Advisor view"]].map(([k, l]) => (
        <button key={k} onClick={() => setView(k)} style={{ fontFamily: T.sans, fontSize: "11px", fontWeight: view === k ? 600 : 400, letterSpacing: "1px", textTransform: "uppercase", color: view === k ? T.gold : T.textDim, background: view === k ? T.goldFaint : "transparent", border: `1px solid ${view === k ? "rgba(200,164,86,0.2)" : "transparent"}`, borderRadius: "8px", padding: "8px 16px", cursor: "pointer", transition: "all 0.2s" }}>{l}</button>
      ))}
    </div>
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "24px 20px 80px" }}>
      {view === "user" && <>
        {step === 0 && <FadeIn delay={0}><div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: T.goldFaint, border: "1px solid rgba(200,164,86,0.2)", margin: "0 auto 20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: "12px", height: "12px", borderRadius: "50%", border: `2px solid ${T.gold}`, borderTopColor: "transparent", animation: "spin 1s linear infinite" }} />
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <h2 style={{ fontFamily: T.serif, fontSize: "22px", fontWeight: 300, color: T.text, margin: "0 0 8px" }}>Preparing your advisor</h2>
          <p style={{ fontFamily: T.sans, fontSize: "14px", color: T.textMid, lineHeight: 1.6 }}>We're sharing your intake results, financial picture, and activity so they have full context. You won't need to repeat anything.</p>
        </div></FadeIn>}
        {step >= 1 && <>
          <FadeIn delay={0}><div style={{ textAlign: "center", marginBottom: "32px" }}>
            <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "rgba(129,178,154,0.1)", border: "1px solid rgba(129,178,154,0.2)", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: "24px" }}>👤</span>
            </div>
            <h2 style={{ fontFamily: T.serif, fontSize: "22px", fontWeight: 300, color: T.text, margin: "0 0 8px" }}>Your advisor is ready</h2>
            <p style={{ fontFamily: T.sans, fontSize: "14px", color: T.textMid, lineHeight: 1.6 }}>They have your full context. No repeating yourself.</p>
          </div></FadeIn>
          <FadeIn delay={200}><Card style={{ marginBottom: "12px" }}>
            <Badge color={T.green}>WHAT THEY KNOW</Badge>
            <div style={{ marginTop: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
              {["Your intake conversation and diagnosed needs", "Your financial picture, gaps, and active focus areas", "Your recent AI conversations and questions", "Recommended talking points specific to your situation"].map((t, i) => <div key={i} style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: "rgba(129,178,154,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><span style={{ color: T.green, fontSize: "10px" }}>✓</span></div>
                <span style={{ fontFamily: T.sans, fontSize: "13px", color: T.textMid }}>{t}</span>
              </div>)}
            </div>
          </Card></FadeIn>
          <FadeIn delay={400}><div style={{ display: "flex", gap: "10px" }}>
            <Btn primary full onClick={() => setStep(2)}>Start chat now</Btn>
            <Btn full>Schedule a call</Btn>
          </div></FadeIn>
          {step === 2 && <FadeIn delay={0}><div style={{ marginTop: "24px" }}>
            <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
              <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "rgba(129,178,154,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "2px" }}><span style={{ fontSize: "10px" }}>👤</span></div>
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: "0 14px 14px 14px", padding: "14px 18px", maxWidth: "85%" }}>
                <p style={{ fontFamily: T.sans, fontSize: "13px", color: T.textMid, margin: "0 0 4px" }}>Hi {name} — I've reviewed everything from your intake. {primaryMode === "decision-map" ? `I can see the decision map we're building and want to make sure we're prioritizing the right things.` : primaryMode === "what-if" ? `I noticed some of the questions you've been exploring and I think I can help you think through a few of them.` : `I see the gaps we've identified in your financial picture. Let me help you figure out where to start.`}</p>
                <p style={{ fontFamily: T.sans, fontSize: "13px", color: T.text, margin: 0 }}>What would be most helpful to talk through right now?</p>
              </div>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: "14px", padding: "14px 18px", display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontFamily: T.sans, fontSize: "14px", color: T.textDim, flex: 1 }}>Type a message...</span>
              <span style={{ fontFamily: T.sans, fontSize: "12px", color: T.goldDim }}>Send</span>
            </div>
          </div></FadeIn>}
        </>}
      </>}

      {view === "advisor" && <>
        <FadeIn delay={0}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: T.goldFaint, border: "1px solid rgba(200,164,86,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: T.sans, fontSize: "14px", fontWeight: 600, color: T.gold }}>{avatar}</div>
            <div>
              <div style={{ fontFamily: T.sans, fontSize: "16px", fontWeight: 500, color: T.text }}>{name}{partnerName && partnerName !== "Wife" ? ` & ${partnerName}` : ""}</div>
              <div style={{ fontFamily: T.sans, fontSize: "12px", color: T.textDim }}>{context}</div>
            </div>
          </div>
        </FadeIn>
        {ab ? (
          <>
            <FadeIn delay={100}><Card style={{ marginBottom: "12px" }}>
              <Badge>CLIENT SUMMARY</Badge>
              <p style={{ fontFamily: T.sans, fontSize: "13.5px", color: T.text, lineHeight: 1.7, marginTop: "12px" }}>{ab.summary}</p>
            </Card></FadeIn>
            <FadeIn delay={200}><Card style={{ marginBottom: "12px", borderColor: "rgba(224,122,95,0.15)" }}>
              <Badge color={T.red}>URGENT ITEMS</Badge>
              <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
                {ab.urgentItems.map((item, i) => <div key={i} style={{ display: "flex", gap: "10px" }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: T.red, flexShrink: 0, marginTop: "7px" }} />
                  <span style={{ fontFamily: T.sans, fontSize: "13px", color: T.text, lineHeight: 1.6 }}>{item}</span>
                </div>)}
              </div>
            </Card></FadeIn>
            <FadeIn delay={300}><Card style={{ marginBottom: "12px", borderColor: "rgba(200,164,86,0.15)" }}>
              <Badge color={T.gold}>RECOMMENDED TALKING POINTS</Badge>
              <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "12px" }}>
                {ab.talkingPoints.map((tp, i) => <div key={i} style={{ display: "flex", gap: "10px" }}>
                  <span style={{ fontFamily: T.sans, fontSize: "11px", fontWeight: 700, color: T.gold, flexShrink: 0, marginTop: "2px" }}>{i + 1}</span>
                  <span style={{ fontFamily: T.sans, fontSize: "13px", color: T.text, lineHeight: 1.6 }}>{tp}</span>
                </div>)}
              </div>
            </Card></FadeIn>
            <FadeIn delay={400}><Card style={{ marginBottom: "12px" }}>
              <Badge color={T.blue}>CLIENT PERSONALITY & APPROACH</Badge>
              <p style={{ fontFamily: T.sans, fontSize: "13px", color: T.textMid, lineHeight: 1.7, marginTop: "12px" }}>{ab.personality}</p>
            </Card></FadeIn>
          </>
        ) : (
          <FadeIn delay={100}><Card style={{ marginBottom: "12px" }}>
            <Badge>INTAKE SUMMARY</Badge>
            <p style={{ fontFamily: T.sans, fontSize: "13.5px", color: T.textMid, lineHeight: 1.7, marginTop: "12px" }}>
              Detailed advisor brief is still generating. Diagnosed needs from intake are available below.
            </p>
          </Card></FadeIn>
        )}
        <FadeIn delay={ab ? 500 : 200}><Card>
          <Badge color={T.textMid}>DIAGNOSED NEEDS FROM INTAKE</Badge>
          <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
            {diagnosed.map((item, i) => <div key={i} style={{ display: "flex", gap: "10px" }}>
              <span style={{ color: T.gold, fontSize: "8px", marginTop: "6px", flexShrink: 0 }}>◆</span>
              <span style={{ fontFamily: T.sans, fontSize: "13px", color: T.textMid, lineHeight: 1.6 }}>{item}</span>
            </div>)}
          </div>
        </Card></FadeIn>
      </>}
    </div>
  </div>;
}
