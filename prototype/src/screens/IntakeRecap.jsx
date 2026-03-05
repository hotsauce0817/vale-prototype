import { useState } from "react";
import { T } from "../tokens.js";
import { FadeIn, Badge, Btn, Card, TopBar } from "../components/shared.jsx";

const DOMAIN_MAP = {
  tax: { label: "Tax", color: T.gold },
  equity: { label: "Equity", color: T.goldLight },
  estate: { label: "Estate", color: T.green },
  insurance: { label: "Insurance", color: T.textMid },
  investing: { label: "Investing", color: T.blue },
  retirement: { label: "Retirement", color: T.blue },
};

const ALL_DOMAINS = ["tax", "equity", "estate", "insurance", "investing"];

const URGENCY_ORDER = { critical: 0, high: 1, moderate: 2 };

function urgencyLabel(u) {
  if (u === "critical") return "Critical";
  if (u === "high") return "High Priority";
  return "Moderate";
}

function urgencyColor(u) {
  if (u === "critical") return T.gold;
  if (u === "high") return T.goldDim;
  return T.textDim;
}

export default function IntakeRecap({ data, diagnosis, onContinue, onBack }) {
  const [showExpressed, setShowExpressed] = useState(false);

  // Support both hardcoded profile data and AI-generated diagnosis
  const name = data?.name || (typeof diagnosis?.name === "string" ? diagnosis.name : null) || "there";
  const partnerName = data?.partnerName || (typeof diagnosis?.partnerName === "string" ? diagnosis.partnerName : null);
  const context = data?.context || (typeof diagnosis?.context === "string" ? diagnosis.context : null) || "";
  const expressed = Array.isArray(diagnosis?.expressed_needs) ? diagnosis.expressed_needs : (Array.isArray(data?.expressed) ? data.expressed : []);
  const diagnosed = Array.isArray(diagnosis?.diagnosed_gaps) ? diagnosis.diagnosed_gaps : (Array.isArray(data?.diagnosed) ? data.diagnosed : []);
  const crossDomainInsights = Array.isArray(diagnosis?.cross_domain_insights) ? diagnosis.cross_domain_insights : [];
  const scoreContext = typeof diagnosis?.score_context === "string" ? diagnosis.score_context : null;
  const primaryFinding = diagnosis?.primary_finding || null;
  const involvesEquity = primaryFinding?.involves_equity === true;

  // New schema fields with fallbacks
  const headline = diagnosis?.headline || scoreContext;
  const totalOpt = diagnosis?.total_optimization || null;
  const impactedDomains = diagnosis?.domains_impacted || [];

  // Derive impacted domains from gaps if domains_impacted not provided
  const derivedDomains = new Set(impactedDomains);
  if (derivedDomains.size === 0) {
    diagnosed.forEach(d => {
      if (typeof d === "object" && Array.isArray(d.domains)) {
        d.domains.forEach(dom => derivedDomains.add(dom));
      }
    });
  }

  // Count unique domains for fallback hero
  const domainCount = derivedDomains.size || 0;
  const gapCount = diagnosed.length;

  // Sort gaps by urgency if available
  const sortedGaps = [...diagnosed].sort((a, b) => {
    const ua = typeof a === "object" ? URGENCY_ORDER[a.urgency] : 2;
    const ub = typeof b === "object" ? URGENCY_ORDER[b.urgency] : 2;
    return (ua ?? 2) - (ub ?? 2);
  });

  return <div style={{ minHeight: "100vh", background: T.bg }}>
    <TopBar left="VALE" right="Intake Complete" onBack={onBack} />
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "32px 20px 80px" }}>

      {/* ── HERO SECTION ── */}
      <FadeIn delay={100}>
        {headline && (
          <p style={{ fontFamily: T.serif, fontSize: "22px", fontWeight: 300, fontStyle: "italic", color: T.text, lineHeight: 1.4, margin: "0 0 16px" }}>
            {headline}
          </p>
        )}

        {totalOpt ? (
          <div style={{ margin: "0 0 4px" }}>
            <span style={{ fontFamily: T.serif, fontSize: "40px", fontWeight: 300, color: T.gold, letterSpacing: "-1px" }}>{totalOpt}</span>
            <p style={{ fontFamily: T.sans, fontSize: "10px", fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase", color: T.goldDim, margin: "4px 0 0" }}>estimated optimization</p>
          </div>
        ) : gapCount > 0 ? (
          <div style={{ margin: "0 0 4px" }}>
            <span style={{ fontFamily: T.serif, fontSize: "40px", fontWeight: 300, color: T.text, letterSpacing: "-1px" }}>{gapCount} finding{gapCount !== 1 ? "s" : ""}</span>
            <p style={{ fontFamily: T.sans, fontSize: "10px", fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase", color: T.textDim, margin: "4px 0 0" }}>
              across {domainCount || gapCount} financial domain{(domainCount || gapCount) !== 1 ? "s" : ""}
            </p>
          </div>
        ) : null}

        {/* Domain badges */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", margin: "16px 0 0" }}>
          {ALL_DOMAINS.map(key => {
            const active = derivedDomains.has(key);
            const info = DOMAIN_MAP[key];
            return <span key={key} style={{
              fontFamily: T.sans, fontSize: "10px", fontWeight: 500, letterSpacing: "0.5px",
              padding: "4px 10px", borderRadius: "12px",
              border: `1px solid ${active ? "rgba(200,164,86,0.3)" : "rgba(255,255,255,0.06)"}`,
              color: active ? info.color : T.textFaint,
              background: active ? "rgba(200,164,86,0.06)" : "transparent",
              transition: "all 0.3s",
            }}>{info.label}</span>;
          })}
        </div>

        {/* Name line — de-emphasized below hero */}
        <p style={{ fontFamily: T.sans, fontSize: "12px", color: T.textDim, margin: "20px 0 0" }}>
          Intake complete for <span style={{ color: T.textMid }}>{name}{partnerName && partnerName !== "Wife" ? ` & ${partnerName}` : ""}</span>
          {context ? ` · ${context}` : ""}
        </p>
      </FadeIn>

      {/* ── WHAT WE FOUND ── */}
      <FadeIn delay={300}><Card style={{ marginTop: "24px", borderColor: "rgba(200,164,86,0.15)" }}>
        <Badge color={T.gold}>WHAT WE FOUND</Badge>
        <div style={{ marginTop: "14px", display: "flex", flexDirection: "column", gap: "18px" }}>
          {sortedGaps.map((d, i) => {
            const isObject = typeof d === "object" && d !== null;
            const title = isObject ? d.title : null;
            const body = isObject ? (d.explanation || d.body) : d;
            const urgency = isObject ? d.urgency : null;
            const dollarEst = isObject ? d.dollar_estimate : null;
            const domains = isObject && Array.isArray(d.domains) ? d.domains : [];

            return <div key={i} style={{ display: "flex", gap: "10px" }}>
              <span style={{ color: urgency === "critical" ? T.gold : urgency === "high" ? T.red : T.gold, fontSize: "8px", lineHeight: "22px", flexShrink: 0, marginTop: "2px" }}>&#9670;</span>
              <div style={{ flex: 1 }}>
                {title && (
                  <div style={{ display: "flex", alignItems: "baseline", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
                    <span style={{ fontFamily: T.sans, fontSize: "13.5px", fontWeight: 500, color: T.text, lineHeight: 1.6 }}>{title}</span>
                    {/* Dollar badge or urgency badge */}
                    {dollarEst ? (
                      <span style={{ fontFamily: T.sans, fontSize: "10px", color: T.gold, background: "rgba(200,164,86,0.1)", borderRadius: "8px", padding: "2px 8px", whiteSpace: "nowrap" }}>{dollarEst}</span>
                    ) : urgency ? (
                      <span style={{ fontFamily: T.sans, fontSize: "10px", color: urgencyColor(urgency), whiteSpace: "nowrap" }}>{urgencyLabel(urgency)}</span>
                    ) : null}
                  </div>
                )}
                {body && <span style={{ fontFamily: T.sans, fontSize: "13.5px", color: title ? T.textMid : T.text, lineHeight: 1.6 }}>{body}</span>}
                {/* Domain dots */}
                {domains.length > 0 && (
                  <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                    {domains.map(dom => {
                      const info = DOMAIN_MAP[dom] || { label: dom, color: T.textDim };
                      return <div key={dom} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: info.color, display: "inline-block", flexShrink: 0 }} />
                        <span style={{ fontFamily: T.sans, fontSize: "10px", color: T.textDim }}>{info.label}</span>
                      </div>;
                    })}
                  </div>
                )}
              </div>
            </div>;
          })}
        </div>
      </Card></FadeIn>

      {/* ── HOW THESE CONNECT ── */}
      {crossDomainInsights.length > 0 && <FadeIn delay={500}><Card style={{ marginTop: "12px", borderColor: "rgba(200,164,86,0.15)" }}>
        <Badge color={T.gold}>HOW THESE CONNECT</Badge>
        <div style={{ marginTop: "14px", display: "flex", flexDirection: "column", gap: "12px" }}>
          {crossDomainInsights.map((insight, i) => (
            <div key={i} style={{ display: "flex", gap: "10px" }}>
              <span style={{ color: T.gold, fontSize: "13px", flexShrink: 0, lineHeight: 1.6 }}>&rarr;</span>
              <p style={{ fontFamily: T.sans, fontSize: "13.5px", color: T.textMid, lineHeight: 1.6, margin: 0 }}>{typeof insight === "string" ? insight : JSON.stringify(insight)}</p>
            </div>
          ))}
        </div>
      </Card></FadeIn>}

      {/* ── THE NEXT STEP ── */}
      {primaryFinding && <FadeIn delay={700}>
        <div style={{ marginTop: "24px", padding: "24px", background: "rgba(200,164,86,0.04)", borderRadius: "14px", border: "1px solid rgba(200,164,86,0.2)" }}>
          <Badge color={T.gold}>THE NEXT STEP</Badge>
          <h2 style={{ fontFamily: T.serif, fontSize: "20px", fontWeight: 400, color: T.text, margin: "12px 0 8px", lineHeight: 1.4 }}>{primaryFinding.title}</h2>
          {/* Dollar estimate if available */}
          {primaryFinding.dollar_estimate && (
            <p style={{ fontFamily: T.sans, fontSize: "13px", color: T.gold, margin: "0 0 8px" }}>{primaryFinding.dollar_estimate}</p>
          )}
          <p style={{ fontFamily: T.sans, fontSize: "13.5px", color: T.textMid, lineHeight: 1.65, margin: "0 0 16px" }}>
            {primaryFinding.explanation || primaryFinding.why_it_matters}
          </p>
          {primaryFinding && involvesEquity ? (
            <div>
              <Btn primary onClick={onContinue}>{primaryFinding.cta_text || "Start equity audit"} &rarr;</Btn>
              {primaryFinding.time_estimate && (
                <p style={{ fontFamily: T.sans, fontSize: "11px", color: T.textDim, margin: "10px 0 0" }}>{primaryFinding.time_estimate}</p>
              )}
            </div>
          ) : (
            <p style={{ fontFamily: T.sans, fontSize: "12px", color: T.textDim, margin: 0 }}>Domain-specific audits are coming soon. For now, your diagnosis highlights the key areas to focus on.</p>
          )}
        </div>
      </FadeIn>}

      {/* Fallback CTA when no primary finding */}
      {!primaryFinding && <FadeIn delay={700}><div style={{ marginTop: "24px", padding: "24px", background: T.goldFaint, borderRadius: "14px", border: "1px solid rgba(200,164,86,0.15)" }}>
        <p style={{ fontFamily: T.serif, fontSize: "17px", fontWeight: 400, fontStyle: "italic", color: T.text, lineHeight: 1.5, margin: 0 }}>
          Your diagnostic is complete.
        </p>
        <p style={{ fontFamily: T.sans, fontSize: "12px", color: T.textDim, margin: "8px 0 0" }}>We've identified the key areas of your financial picture above. Deeper audits coming soon.</p>
      </div></FadeIn>}

      {/* ── WHAT YOU TOLD US (collapsed, bottom) ── */}
      {expressed.length > 0 && <FadeIn delay={900}>
        <div style={{ marginTop: "24px" }}>
          <div
            onClick={() => setShowExpressed(!showExpressed)}
            style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", padding: "12px 0" }}
          >
            <Badge color={T.textDim}>WHAT YOU TOLD US</Badge>
            <span style={{ fontFamily: T.sans, fontSize: "10px", color: T.textDim, transition: "transform 0.2s", transform: showExpressed ? "rotate(90deg)" : "none" }}>&#9654;</span>
          </div>
          {showExpressed && (
            <Card>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {expressed.map((e, i) => {
                  const text = typeof e === "string" ? e : e.text || e.title || "";
                  return <div key={i} style={{ display: "flex", gap: "10px" }}>
                    <span style={{ color: T.textDim, fontSize: "12px", lineHeight: "22px", flexShrink: 0 }}>—</span>
                    <span style={{ fontFamily: T.sans, fontSize: "13.5px", color: T.textMid, lineHeight: 1.6 }}>{text}</span>
                  </div>;
                })}
              </div>
            </Card>
          )}
        </div>
      </FadeIn>}

    </div>
  </div>;
}
