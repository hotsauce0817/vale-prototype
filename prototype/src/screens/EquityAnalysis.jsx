import { T } from "../tokens.js";
import { FadeIn, Badge, Btn, Card, TopBar } from "../components/shared.jsx";

/**
 * EquityAnalysis — renders the audit_result produced by the equity audit.
 *
 * Content hierarchy (PRD Section 7):
 * 1. Headline finding (large, authoritative)
 * 2. Narrative (the core — reads like a financial advisor letter)
 * 3. Scenario comparison (before/after with dollar impact)
 * 4. Actions (2-3 items, sequenced, with urgency)
 * 5. Secondary findings (lightweight)
 * 6. Data quality note if medium/low
 * 7. Conversion section with CTAs
 *
 * Visual direction: feels like a document, not a dashboard.
 * Clean, readable, authoritative. Narrative is the centerpiece.
 *
 * Props:
 *   auditResult: the structured audit output from the AI
 *   diagnosis: the intake diagnosis (for context)
 *   sessionId: session ID for log continuity
 *   onBack: () => void
 */
export default function EquityAnalysis({ auditResult, diagnosis, sessionId, onBack }) {
  // Guard: no result yet
  if (!auditResult) {
    return <div style={{ minHeight: "100vh", background: T.bg }}>
      <TopBar left="VALE" right="Analysis" onBack={onBack} />
      <div style={{ maxWidth: "640px", margin: "0 auto", padding: "48px 20px" }}>
        <p style={{ fontFamily: T.sans, fontSize: "14px", color: T.textMid }}>No analysis available yet. Complete the equity audit first.</p>
      </div>
    </div>;
  }

  const {
    headline,
    narrative,
    scenario,
    actions = [],
    secondary_findings = [],
    data_quality,
  } = auditResult;

  // Split narrative into paragraphs (AI may return double-newlines or single newlines)
  const narrativeParagraphs = narrative
    ? narrative.split(/\n\n+/).filter((p) => p.trim())
    : [];

  // Urgency styling
  const urgencyColor = (u) => u === "now" ? T.red : u === "soon" ? T.gold : T.textDim;
  const urgencyLabel = (u) => u === "now" ? "Act now" : u === "soon" ? "Soon" : "When ready";

  // Who label
  const whoLabel = (w) => w === "vale" ? "Vale handles this" : w === "professional" ? "Needs a professional" : "Your action";

  return (
    <div style={{ minHeight: "100vh", background: T.bg }}>
      <TopBar left="VALE" right="Your Analysis" onBack={onBack} />

      <div style={{ maxWidth: "640px", margin: "0 auto", padding: "32px 20px 100px" }}>

        {/* ── 1. HEADLINE ── */}
        <FadeIn delay={100}>
          <Badge color={T.gold}>YOUR EQUITY ANALYSIS</Badge>
          <h1 style={{
            fontFamily: T.serif, fontSize: "32px", fontWeight: 300, color: T.text,
            margin: "16px 0 32px", lineHeight: 1.3, letterSpacing: "-0.5px",
          }}>
            {headline}
          </h1>
        </FadeIn>

        {/* ── 2. NARRATIVE ── */}
        <FadeIn delay={300}>
          <div style={{ marginBottom: "40px" }}>
            {narrativeParagraphs.map((para, i) => (
              <p key={i} style={{
                fontFamily: T.serif, fontSize: "16px", fontWeight: 300, color: T.text,
                lineHeight: 1.75, margin: i === 0 ? "0 0 16px" : "16px 0",
                fontStyle: i === 0 ? "normal" : "normal",
              }}>
                {para}
              </p>
            ))}
          </div>
        </FadeIn>

        {/* ── 3. SCENARIO COMPARISON ── */}
        {scenario && (
          <FadeIn delay={500}>
            <div style={{ marginBottom: "40px" }}>
              <Badge color={T.textMid}>SCENARIO COMPARISON</Badge>

              <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
                {/* Without coordination */}
                <div style={{
                  flex: 1, padding: "20px", borderRadius: "14px",
                  background: "rgba(224,122,95,0.04)", border: "1px solid rgba(224,122,95,0.12)",
                }}>
                  <p style={{
                    fontFamily: T.sans, fontSize: "10px", fontWeight: 600, color: T.red,
                    letterSpacing: "1.5px", textTransform: "uppercase", margin: "0 0 10px",
                  }}>Without coordination</p>
                  <p style={{
                    fontFamily: T.sans, fontSize: "13.5px", color: T.textMid, lineHeight: 1.6, margin: 0,
                  }}>{scenario.uncoordinated}</p>
                </div>

                {/* With Vale */}
                <div style={{
                  flex: 1, padding: "20px", borderRadius: "14px",
                  background: "rgba(129,178,154,0.04)", border: "1px solid rgba(129,178,154,0.12)",
                }}>
                  <p style={{
                    fontFamily: T.sans, fontSize: "10px", fontWeight: 600, color: T.green,
                    letterSpacing: "1.5px", textTransform: "uppercase", margin: "0 0 10px",
                  }}>With Vale</p>
                  <p style={{
                    fontFamily: T.sans, fontSize: "13.5px", color: T.textMid, lineHeight: 1.6, margin: 0,
                  }}>{scenario.coordinated}</p>
                </div>
              </div>

              {/* Impact callout */}
              {scenario.estimated_annual_impact && (
                <div style={{
                  marginTop: "12px", padding: "16px 20px", borderRadius: "12px",
                  background: T.goldFaint, border: "1px solid rgba(200,164,86,0.12)",
                  textAlign: "center",
                }}>
                  <p style={{
                    fontFamily: T.sans, fontSize: "11px", fontWeight: 600, color: T.goldDim,
                    letterSpacing: "1px", textTransform: "uppercase", margin: "0 0 4px",
                  }}>Estimated annual impact</p>
                  <p style={{
                    fontFamily: T.serif, fontSize: "24px", fontWeight: 400, color: T.gold,
                    margin: 0, letterSpacing: "-0.3px",
                  }}>{scenario.estimated_annual_impact}</p>
                </div>
              )}
            </div>
          </FadeIn>
        )}

        {/* ── 4. ACTIONS ── */}
        {actions.length > 0 && (
          <FadeIn delay={700}>
            <div style={{ marginBottom: "40px" }}>
              <Badge color={T.textMid}>WHAT TO DO NEXT</Badge>
              <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                {actions.map((action, i) => (
                  <div key={i} style={{
                    padding: "20px", borderRadius: "14px",
                    background: T.surface, border: `1px solid ${T.border}`,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                      {/* Urgency dot */}
                      <span style={{
                        width: "8px", height: "8px", borderRadius: "50%",
                        background: urgencyColor(action.urgency), flexShrink: 0,
                      }} />
                      <span style={{
                        fontFamily: T.sans, fontSize: "14px", fontWeight: 500, color: T.text,
                      }}>{action.title}</span>
                      <span style={{
                        fontFamily: T.sans, fontSize: "10px", fontWeight: 600,
                        color: urgencyColor(action.urgency), letterSpacing: "1px", textTransform: "uppercase",
                        marginLeft: "auto", flexShrink: 0,
                      }}>{urgencyLabel(action.urgency)}</span>
                    </div>
                    <p style={{
                      fontFamily: T.sans, fontSize: "13px", color: T.textMid, lineHeight: 1.6,
                      margin: "0 0 6px", paddingLeft: "18px",
                    }}>{action.detail}</p>
                    <p style={{
                      fontFamily: T.sans, fontSize: "11px", color: T.textDim,
                      margin: 0, paddingLeft: "18px",
                    }}>{whoLabel(action.who)}</p>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        )}

        {/* ── 5. SECONDARY FINDINGS ── */}
        {secondary_findings.length > 0 && (
          <FadeIn delay={900}>
            <div style={{ marginBottom: "40px" }}>
              <Badge color={T.textMid}>ALSO NOTED</Badge>
              <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                {secondary_findings.map((finding, i) => (
                  <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                    <span style={{ color: T.textDim, fontSize: "8px", lineHeight: "22px", flexShrink: 0, marginTop: "2px" }}>&#9670;</span>
                    <p style={{
                      fontFamily: T.sans, fontSize: "13px", color: T.textMid, lineHeight: 1.6, margin: 0,
                    }}>{typeof finding === "string" ? finding : finding.text || JSON.stringify(finding)}</p>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        )}

        {/* ── 6. DATA QUALITY NOTE ── */}
        {data_quality && data_quality !== "high" && (
          <FadeIn delay={1000}>
            <div style={{
              marginBottom: "40px", padding: "14px 18px", borderRadius: "10px",
              background: "rgba(232,197,71,0.04)", border: "1px solid rgba(232,197,71,0.1)",
            }}>
              <p style={{ fontFamily: T.sans, fontSize: "12px", color: T.textDim, lineHeight: 1.6, margin: 0 }}>
                <span style={{ fontWeight: 600, color: T.yellow }}>Data quality: {data_quality}.</span>{" "}
                {data_quality === "medium"
                  ? "Some estimates are based on ranges you provided. With actual grant agreements and tax returns, we can narrow these numbers significantly."
                  : "Several key inputs were estimated. The direction of the findings is reliable, but dollar amounts could shift materially with actual documents."}
              </p>
            </div>
          </FadeIn>
        )}

        {/* ── 7. CONVERSION CTAs ── */}
        <FadeIn delay={1100}>
          <div style={{
            padding: "32px 28px", borderRadius: "16px",
            background: "linear-gradient(135deg, rgba(200,164,86,0.06), rgba(200,164,86,0.02))",
            border: "1px solid rgba(200,164,86,0.15)",
            textAlign: "center",
          }}>
            <p style={{
              fontFamily: T.serif, fontSize: "20px", fontWeight: 300, color: T.text,
              margin: "0 0 6px", lineHeight: 1.4,
            }}>
              Ready to act on this?
            </p>
            <p style={{
              fontFamily: T.sans, fontSize: "13px", color: T.textMid, lineHeight: 1.5,
              margin: "0 0 24px",
            }}>
              Vale executes the strategy — portfolio management, tax filing, equity event coordination.
            </p>

            {/* Primary CTA */}
            <div style={{ marginBottom: "16px" }}>
              <Btn primary>Start your Vale plan — $75/month →</Btn>
            </div>

            {/* Secondary CTA */}
            <button style={{
              background: "none", border: "none", cursor: "pointer",
              fontFamily: T.sans, fontSize: "13px", color: T.goldDim,
              textDecoration: "underline", textUnderlineOffset: "3px",
            }}>
              Want a CFP to review these findings? Explore Vale+ →
            </button>

            {/* Fine print */}
            <p style={{
              fontFamily: T.sans, fontSize: "10px", color: T.textFaint,
              margin: "20px 0 0", lineHeight: 1.5,
            }}>
              Vale is a registered investment advisor (SEC RIA). All recommendations are fiduciary.
            </p>
          </div>
        </FadeIn>

      </div>
    </div>
  );
}
