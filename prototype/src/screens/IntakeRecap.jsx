import { T } from "../tokens.js";
import { FadeIn, Badge, Btn, Card, TopBar } from "../components/shared.jsx";

export default function IntakeRecap({ data, diagnosis, onContinue, onBack }) {
  // Support both hardcoded profile data and AI-generated diagnosis
  const name = data?.name || (typeof diagnosis?.name === "string" ? diagnosis.name : null) || "there";
  const partnerName = data?.partnerName || (typeof diagnosis?.partnerName === "string" ? diagnosis.partnerName : null);
  const context = data?.context || (typeof diagnosis?.context === "string" ? diagnosis.context : null) || "";
  const expressed = Array.isArray(diagnosis?.expressed_needs) ? diagnosis.expressed_needs : (Array.isArray(data?.expressed) ? data.expressed : []);
  const diagnosed = Array.isArray(diagnosis?.diagnosed_gaps) ? diagnosis.diagnosed_gaps : (Array.isArray(data?.diagnosed) ? data.diagnosed : []);
  const crossDomainInsights = Array.isArray(diagnosis?.cross_domain_insights) ? diagnosis.cross_domain_insights : [];
  const scoreContext = typeof diagnosis?.score_context === "string" ? diagnosis.score_context : null;
  const primaryMode = data?.primaryMode || diagnosis?.primaryMode || "financial-picture";

  return <div style={{ minHeight: "100vh", background: T.bg }}>
    <TopBar left="VALE" right="Intake Complete" onBack={onBack} />
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "32px 20px 80px" }}>
      <FadeIn delay={100}><p style={{ fontFamily: T.sans, fontSize: "12px", color: T.textDim, margin: "0 0 8px" }}>Intake complete for</p>
        <h1 style={{ fontFamily: T.serif, fontSize: "36px", fontWeight: 300, color: T.text, margin: "0 0 6px", letterSpacing: "-0.5px" }}>{name}{partnerName && partnerName !== "Wife" ? ` & ${partnerName}` : ""}</h1>
        <p style={{ fontFamily: T.sans, fontSize: "13px", color: T.textDim, margin: "0 0 32px" }}>{context}</p>
      </FadeIn>

      {/* Score context — only shown for AI path */}
      {scoreContext && <FadeIn delay={200}>
        <div style={{ marginBottom: "16px", padding: "16px 20px", background: T.goldFaint, borderRadius: "12px", border: "1px solid rgba(200,164,86,0.12)" }}>
          <p style={{ fontFamily: T.serif, fontSize: "14px", fontStyle: "italic", color: T.text, lineHeight: 1.6, margin: 0 }}>{scoreContext}</p>
        </div>
      </FadeIn>}

      {/* What you told us */}
      <FadeIn delay={300}><Card>
        <Badge color={T.textMid}>WHAT YOU TOLD US</Badge>
        <div style={{ marginTop: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
          {expressed.map((e, i) => {
            const text = typeof e === "string" ? e : e.text || e.title || "";
            return <div key={i} style={{ display: "flex", gap: "10px" }}><span style={{ color: T.textDim, fontSize: "12px", lineHeight: "22px", flexShrink: 0 }}>—</span><span style={{ fontFamily: T.sans, fontSize: "13.5px", color: T.textMid, lineHeight: 1.6 }}>{text}</span></div>;
          })}
        </div>
      </Card></FadeIn>

      {/* What we noticed */}
      <FadeIn delay={500}><Card style={{ marginTop: "12px", borderColor: "rgba(200,164,86,0.15)" }}>
        <Badge color={T.gold}>WHAT WE NOTICED</Badge>
        <div style={{ marginTop: "14px", display: "flex", flexDirection: "column", gap: "14px" }}>
          {diagnosed.map((d, i) => {
            // Handle both string format (hardcoded) and object format (AI-generated)
            const isObject = typeof d === "object" && d !== null;
            const title = isObject ? d.title : null;
            const body = isObject ? d.body : d;
            const urgency = isObject ? d.urgency : null;
            return <div key={i} style={{ display: "flex", gap: "10px" }}>
              <span style={{ color: urgency === "high" ? T.red : T.gold, fontSize: "8px", lineHeight: "22px", flexShrink: 0, marginTop: "2px" }}>◆</span>
              <div>
                {title && <span style={{ fontFamily: T.sans, fontSize: "13.5px", fontWeight: 500, color: T.text, lineHeight: 1.6, display: "block", marginBottom: "4px" }}>{title}</span>}
                <span style={{ fontFamily: T.sans, fontSize: "13.5px", color: title ? T.textMid : T.text, lineHeight: 1.6 }}>{body}</span>
              </div>
            </div>;
          })}
        </div>
      </Card></FadeIn>

      {/* Cross-domain insights — only shown for AI path */}
      {crossDomainInsights.length > 0 && <FadeIn delay={600}><Card style={{ marginTop: "12px", borderColor: "rgba(200,164,86,0.15)" }}>
        <Badge color={T.gold}>CROSS-DOMAIN INSIGHTS</Badge>
        <div style={{ marginTop: "14px", display: "flex", flexDirection: "column", gap: "12px" }}>
          {crossDomainInsights.map((insight, i) => (
            <p key={i} style={{ fontFamily: T.sans, fontSize: "13.5px", color: T.text, lineHeight: 1.6, margin: 0 }}>{typeof insight === "string" ? insight : JSON.stringify(insight)}</p>
          ))}
        </div>
      </Card></FadeIn>}

      {/* Bottom CTA — unified forward navigation for both paths */}
      <FadeIn delay={700}><div style={{ marginTop: "32px", padding: "24px", background: T.goldFaint, borderRadius: "14px", border: "1px solid rgba(200,164,86,0.15)" }}>
        <p style={{ fontFamily: T.serif, fontSize: "17px", fontWeight: 400, fontStyle: "italic", color: T.text, lineHeight: 1.5, margin: "0 0 8px" }}>
          {primaryMode === "financial-picture" && "Based on your situation, we'd start by building your complete financial picture."}
          {primaryMode === "decision-map" && "Based on your situation, there's a decision ahead that needs a coordinated plan."}
          {primaryMode === "what-if" && "Based on your situation, let's start with the questions on your mind."}
        </p>
        <p style={{ fontFamily: T.sans, fontSize: "12px", color: T.textDim, margin: "0 0 20px" }}>You can explore all areas — this is where we'd recommend starting.</p>
        <Btn primary onClick={onContinue}>Explore your focus areas →</Btn>
      </div></FadeIn>
    </div>
  </div>;
}
