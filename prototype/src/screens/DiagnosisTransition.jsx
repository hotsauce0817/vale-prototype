import { useState, useEffect } from "react";
import { T } from "../tokens.js";
import { FadeIn, Badge } from "../components/shared.jsx";

const DOMAIN_CHECKS = [
  "Tax implications assessed",
  "Investment alignment reviewed",
  "Estate and protection gaps evaluated",
  "Cash flow and timing modeled",
  "Cross-domain connections mapped",
];

export default function DiagnosisTransition({ diagnosis, onComplete }) {
  const [phase, setPhase] = useState(1);
  const [barStarted, setBarStarted] = useState(false);
  const [heroVisible, setHeroVisible] = useState(false);
  const [heroExiting, setHeroExiting] = useState(false);

  // Phase 1: progress bar starts immediately after mount
  useEffect(() => {
    requestAnimationFrame(() => setBarStarted(true));
  }, []);

  // Phase transitions
  useEffect(() => {
    // Phase 1 → Phase 2 at 4.5s
    const t1 = setTimeout(() => setPhase(2), 4500);
    // Hero appears at 5.0s (0.5s pause after phase 1 fades)
    const t2 = setTimeout(() => setHeroVisible(true), 5000);
    // Hero starts exiting at 6.5s
    const t3 = setTimeout(() => setHeroExiting(true), 6500);
    // Complete at 7.0s
    const t4 = setTimeout(() => onComplete(), 7000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [onComplete]);

  // Build hero content
  const totalOpt = diagnosis?.total_optimization || null;
  const gapCount = diagnosis?.diagnosed_gaps?.length || 0;
  const allDomains = (diagnosis?.diagnosed_gaps || []).reduce((acc, g) => {
    if (Array.isArray(g?.domains)) g.domains.forEach(d => acc.add(d));
    return acc;
  }, new Set());
  const domainCount = diagnosis?.domains_impacted?.length || allDomains.size || 0;
  const heroNumber = totalOpt || (gapCount > 0 ? `${gapCount} critical finding${gapCount !== 1 ? "s" : ""}` : "Analysis complete");
  const heroSub = totalOpt ? "in potential optimization identified" : (domainCount > 0 ? `across ${domainCount} financial domain${domainCount !== 1 ? "s" : ""}` : "");

  return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", position: "relative", overflow: "hidden" }}>
      <style>{`
        @keyframes heroScaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>

      {/* Phase 1: Analysis in progress */}
      <div style={{
        opacity: phase === 1 ? 1 : 0,
        transition: "opacity 0.4s ease",
        position: "absolute",
        display: "flex", flexDirection: "column", alignItems: "center",
        maxWidth: "400px", width: "100%", padding: "0 20px",
      }}>
        <p style={{
          fontFamily: T.serif, fontSize: "20px", fontWeight: 300, fontStyle: "italic",
          color: T.text, margin: "0 0 32px", textAlign: "center",
        }}>
          Analyzing your financial picture...
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
          {DOMAIN_CHECKS.map((label, i) => (
            <FadeIn key={i} delay={i * 800} y={8}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "6px 0" }}>
                <span style={{ color: T.gold, fontSize: "14px", flexShrink: 0 }}>✓</span>
                <span style={{ fontFamily: T.sans, fontSize: "13px", color: T.textMid }}>{label}</span>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>

      {/* Phase 2: Hero number reveal */}
      {phase >= 2 && (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          textAlign: "center", padding: "0 20px",
          ...(heroVisible ? {
            animation: "heroScaleIn 0.4s cubic-bezier(0.23,1,0.32,1) forwards",
          } : {
            opacity: 0,
          }),
          ...(heroExiting ? {
            opacity: 0,
            transform: "translateY(-40px)",
            transition: "all 0.5s ease",
          } : {}),
        }}>
          <p style={{
            fontFamily: T.serif, fontSize: "48px", fontWeight: 300,
            color: totalOpt ? T.gold : T.text,
            margin: "0 0 8px", letterSpacing: "-1px",
          }}>
            {heroNumber}
          </p>
          {heroSub && (
            <p style={{ fontFamily: T.sans, fontSize: "14px", color: T.textMid, margin: "0 0 8px" }}>
              {heroSub}
            </p>
          )}
          <p style={{ fontFamily: T.sans, fontSize: "12px", color: T.textDim, margin: 0 }}>
            from a 5-minute conversation
          </p>
        </div>
      )}

      {/* Progress bar at bottom */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, height: "2px",
        background: T.gold,
        width: barStarted ? "100%" : "0%",
        transition: "width 4s linear",
      }} />
    </div>
  );
}
