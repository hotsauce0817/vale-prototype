import { useState, useEffect } from "react";
import { T, FONT_URL } from "./tokens.js";
import { PROFILES } from "./data/profiles.js";
import EntrySelect from "./screens/EntrySelect.jsx";
import ProfileSelect from "./screens/ProfileSelect.jsx";
import DiagnosticIntake from "./screens/DiagnosticIntake.jsx";
import IntakeRecap from "./screens/IntakeRecap.jsx";
import LiveIntake from "./screens/LiveIntake.jsx";
import EquityAudit from "./screens/EquityAudit.jsx";
import EquityAnalysis from "./screens/EquityAnalysis.jsx";

const params = new URLSearchParams(window.location.search);
const isDev = params.has("dev");
const isRinkaDemo = params.get("demo") === "rinka";
const isTestAnalysis = params.get("test") === "analysis";

export default function App() {
  // If ?demo=rinka, skip entry and go straight to intake
  // If ?test=analysis, skip everything and show analysis with mock data
  const [phase, setPhase] = useState(isTestAnalysis ? "analysis" : isRinkaDemo ? "intake" : "select");
  const [profileKey, setProfileKey] = useState(null);
  // "rinka" | "open" | "hardcoded" — determines which flow we're in
  const [flowMode, setFlowMode] = useState(
    isRinkaDemo ? "rinka" : isDev ? "hardcoded" : null
  );
  // AI-generated diagnosis (populated by LiveIntake when ready)
  const [diagnosis, setDiagnosis] = useState(null);
  // Stored intake context for the audit
  const [intakeMessages, setIntakeMessages] = useState(null);
  const [intakeState, setIntakeState] = useState(null);
  // Session ID — connects intake logs to audit logs
  const [sessionId, setSessionId] = useState(null);
  // Audit result (populated by EquityAudit when ready — Phase 2)
  const [auditResult, setAuditResult] = useState(() => {
    if (!isTestAnalysis) return null;
    // Mock data for visual testing (?test=analysis)
    return {
      headline: "You're likely facing ~$47,000 in AMT exposure that nobody has flagged — and your exercise window closes in 47 days.",
      narrative: "Your 42,000 shares across ISOs and NSOs create a more complex tax picture than a single withholding rate can handle. The ISOs you exercised last year at $10.95 with a current FMV around the acquisition price generated a significant AMT preference item — the spread between your strike price and the fair market value at exercise.\n\nBased on your California residency and single filing status, your estimated AMT exposure is approximately $47,000. This is separate from regular income tax, and it's not something standard withholding covers. ChatGPT's estimate of ~$40,000 in total tax liability appears to have missed the AMT component entirely — your actual combined liability is closer to $52,000.\n\nThe acquisition payout will trigger supplemental wage withholding at 22% federal, but your effective rate is likely closer to 35-37% when you combine federal, California state tax, and the AMT hit. That means the withholding will be short by a meaningful amount — but there's also a scenario where some positions are over-withheld by $3,000-$5,000 depending on how payroll processes the different grant types.\n\nThe good news: with 47 days until close, there's still time to coordinate. A proper exercise-and-hold strategy for the remaining unexercised ISOs, combined with estimated tax payments and a backdoor Roth IRA setup, could save you $12,000-$15,000 in the first year alone.",
      scenario: {
        uncoordinated: "Standard withholding covers ~60% of actual liability. AMT bill arrives as a surprise at tax time. No tax-advantaged accounts set up. Estimated underpayment penalty on top of the shortfall.",
        coordinated: "AMT mapped and planned for before close. Withholding adjusted or estimated payments set up. Backdoor Roth established before income spike. Exercise timing optimized across tax years where possible.",
        estimated_annual_impact: "$12,000 – $15,000",
      },
      actions: [
        {
          title: "Map your full AMT exposure before the acquisition closes",
          urgency: "now",
          detail: "Get your grant agreements and calculate the exact AMT preference item for each ISO lot. This determines whether you owe $40K or $55K.",
          who: "vale",
        },
        {
          title: "Set up estimated tax payments for Q1",
          urgency: "now",
          detail: "To avoid underpayment penalties, file estimated payments covering the gap between withholding and actual liability.",
          who: "vale",
        },
        {
          title: "Open a backdoor Roth IRA before the income spike",
          urgency: "soon",
          detail: "Your income after the acquisition will likely exceed Roth contribution limits. A backdoor conversion now preserves this tax-advantaged option.",
          who: "vale",
        },
      ],
      secondary_findings: [
        "No estate plan or beneficiary designations on any accounts — relevant given the size of this payout",
        "No disability or umbrella insurance — single income, no safety net beyond employer coverage",
        "401(k) contributions not maximized — leaving employer match and tax deduction on the table",
      ],
      data_quality: "medium",
    };
  });

  useEffect(() => {
    const link = document.createElement("link"); link.rel = "stylesheet"; link.href = FONT_URL; document.head.appendChild(link);
    document.body.style.margin = "0"; document.body.style.background = T.bg;
  }, []);

  const data = profileKey ? PROFILES[profileKey] : null;
  const go = (p) => () => { setPhase(p); window.scrollTo(0, 0); };

  // Dev mode: hardcoded profile select
  const handleProfileSelect = (k) => { setProfileKey(k); setFlowMode("hardcoded"); setPhase("intake"); window.scrollTo(0, 0); };

  // Default entry: "Try it yourself" → generic intake
  const handleStart = () => { setFlowMode("open"); setPhase("intake"); window.scrollTo(0, 0); };

  // Back to entry — reset everything
  const handleBackToSelect = () => {
    setPhase("select");
    setFlowMode(isDev ? "hardcoded" : null);
    setProfileKey(null);
    setDiagnosis(null);
    setIntakeMessages(null);
    setIntakeState(null);
    setSessionId(null);
    setAuditResult(null);
    window.scrollTo(0, 0);
  };

  // Handle recap → audit navigation (only if equity)
  const handleRecapContinue = () => {
    const involvesEquity = diagnosis?.primary_finding?.involves_equity;
    if (involvesEquity) {
      setPhase("audit");
      window.scrollTo(0, 0);
    }
    // If not equity, the recap shows "coming soon" — no navigation
  };

  /* ── SELECT phase ── */
  if (phase === "select") {
    if (isDev) return <ProfileSelect onSelect={handleProfileSelect} />;
    return <EntrySelect onStart={handleStart} />;
  }

  /* ── INTAKE phase ── */
  if (phase === "intake") {
    if (flowMode === "hardcoded") {
      return <DiagnosticIntake data={data} onComplete={go("recap")} onBack={handleBackToSelect} />;
    }
    const handleDiagnosisComplete = ({ diagnosis: diag, messages: msgs, state: finalState, sessionId: sid }) => {
      console.log("[Vale] handleDiagnosisComplete called, diagnosis:", diag);
      if (!diag) {
        console.warn("[Vale] diagnosis was null/undefined — staying on intake");
        return;
      }
      setDiagnosis(diag);
      setIntakeMessages(msgs);
      setIntakeState(finalState);
      setSessionId(sid);
      setPhase("recap");
      window.scrollTo(0, 0);
    };
    return <LiveIntake mode={flowMode === "rinka" ? "rinka" : "open"} entryContext="generic" onComplete={handleDiagnosisComplete} onBack={handleBackToSelect} />;
  }

  /* ── RECAP phase ── */
  if (phase === "recap") {
    if (flowMode === "hardcoded") {
      return <IntakeRecap data={data} onContinue={null} onBack={go("intake")} />;
    }
    return <IntakeRecap diagnosis={diagnosis} onContinue={handleRecapContinue} onBack={go("intake")} />;
  }

  /* ── AUDIT phase ── */
  if (phase === "audit") {
    const handleAuditComplete = ({ auditResult: result, sessionId: sid }) => {
      setAuditResult(result);
      if (sid) setSessionId(sid);
      setPhase("analysis");
      window.scrollTo(0, 0);
    };
    return <EquityAudit
      mode={flowMode === "rinka" ? "rinka" : "open"}
      diagnosis={diagnosis}
      intakeMessages={intakeMessages}
      intakeState={intakeState}
      sessionId={sessionId}
      onComplete={handleAuditComplete}
      onBack={go("recap")}
    />;
  }

  /* ── ANALYSIS phase ── */
  if (phase === "analysis") {
    return <EquityAnalysis
      auditResult={auditResult}
      diagnosis={diagnosis}
      sessionId={sessionId}
      onBack={go("audit")}
    />;
  }

  return null;
}
