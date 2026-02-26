import { useState, useEffect } from "react";
import { T, FONT_URL } from "./tokens.js";
import { PROFILES } from "./data/profiles.js";
import EntrySelect from "./screens/EntrySelect.jsx";
import ProfileSelect from "./screens/ProfileSelect.jsx";
import DiagnosticIntake from "./screens/DiagnosticIntake.jsx";
import IntakeRecap from "./screens/IntakeRecap.jsx";
import ModeExplorer from "./screens/ModeExplorer.jsx";
import ReturnExperience from "./screens/ReturnExperience.jsx";
import HumanHandoff from "./screens/HumanHandoff.jsx";
import LiveIntake from "./screens/LiveIntake.jsx";

const isDev = new URLSearchParams(window.location.search).has("dev");

export default function App() {
  const [phase, setPhase] = useState("select");
  const [profileKey, setProfileKey] = useState(null);
  // "rinka" | "open" | "hardcoded" — determines which flow we're in
  const [flowMode, setFlowMode] = useState(isDev ? "hardcoded" : null);
  // For open mode: which life event sub-option was chosen
  const [entryContext, setEntryContext] = useState(null);
  // AI-generated diagnosis (populated by LiveIntake when ready)
  const [diagnosis, setDiagnosis] = useState(null);
  // Stored intake context for post-diagnosis retry
  const [intakeMessages, setIntakeMessages] = useState(null);
  const [intakeState, setIntakeState] = useState(null);
  // Post-diagnosis structured data for ModeExplorer + HumanHandoff
  const [postDiagnosisData, setPostDiagnosisData] = useState(null);
  const [postDiagnosisLoading, setPostDiagnosisLoading] = useState(false);
  const [postDiagnosisError, setPostDiagnosisError] = useState(false);

  useEffect(() => {
    const link = document.createElement("link"); link.rel = "stylesheet"; link.href = FONT_URL; document.head.appendChild(link);
    document.body.style.margin = "0"; document.body.style.background = T.bg;
  }, []);

  const data = profileKey ? PROFILES[profileKey] : null;
  const go = (p) => () => { setPhase(p); window.scrollTo(0, 0); };

  // Dev mode: hardcoded profile select
  const handleProfileSelect = (k) => { setProfileKey(k); setFlowMode("hardcoded"); setPhase("intake"); window.scrollTo(0, 0); };

  // Rinka demo path
  const handleRinka = () => { setFlowMode("rinka"); setPhase("intake"); window.scrollTo(0, 0); };

  // Open diagnostic path
  const handleOpen = (eventType) => { setFlowMode("open"); setEntryContext(eventType); setPhase("intake"); window.scrollTo(0, 0); };

  // Fire post-diagnosis API in background
  const firePostDiagnosis = (diag, msgs, finalState) => {
    setPostDiagnosisLoading(true);
    setPostDiagnosisError(false);

    fetch("/api/post-diagnosis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: msgs,
        diagnosis: diag,
        state: finalState,
        mode: flowMode === "rinka" ? "rinka" : (entryContext || "generic"),
      }),
    })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        console.log("[Vale] post-diagnosis data received:", data);
        setPostDiagnosisData(data);
        setPostDiagnosisLoading(false);
      })
      .catch((err) => {
        console.error("[Vale] post-diagnosis failed:", err);
        setPostDiagnosisLoading(false);
        setPostDiagnosisError(true);
      });
  };

  // Back to entry
  const handleBackToSelect = () => {
    setPhase("select");
    setFlowMode(isDev ? "hardcoded" : null);
    setProfileKey(null);
    setDiagnosis(null);
    setIntakeMessages(null);
    setIntakeState(null);
    setPostDiagnosisData(null);
    setPostDiagnosisLoading(false);
    setPostDiagnosisError(false);
    setEntryContext(null);
    window.scrollTo(0, 0);
  };

  /* ── SELECT phase ── */
  if (phase === "select") {
    if (isDev) return <ProfileSelect onSelect={handleProfileSelect} />;
    return <EntrySelect onRinka={handleRinka} onOpen={handleOpen} />;
  }

  /* ── INTAKE phase ── */
  if (phase === "intake") {
    if (flowMode === "hardcoded") {
      return <DiagnosticIntake data={data} onComplete={go("recap")} onBack={handleBackToSelect} />;
    }
    const handleDiagnosisComplete = ({ diagnosis: diag, messages: msgs, state: finalState }) => {
      console.log("[Vale] handleDiagnosisComplete called, diagnosis:", diag);
      if (!diag) {
        console.warn("[Vale] diagnosis was null/undefined — staying on intake");
        return;
      }
      setDiagnosis(diag);
      setIntakeMessages(msgs);
      setIntakeState(finalState);
      setPhase("recap");
      window.scrollTo(0, 0);

      // Fire post-diagnosis in background
      firePostDiagnosis(diag, msgs, finalState);
    };
    return <LiveIntake mode={flowMode === "rinka" ? "rinka" : "open"} entryContext={entryContext || "generic"} onComplete={handleDiagnosisComplete} onBack={handleBackToSelect} />;
  }

  /* ── RECAP phase ── */
  if (phase === "recap") {
    if (flowMode === "hardcoded") {
      return <IntakeRecap data={data} onContinue={go("modes")} onBack={go("intake")} />;
    }
    // AI path: recap shows diagnosis, "Continue" goes forward to modes
    return <IntakeRecap diagnosis={diagnosis} onContinue={go("modes")} onBack={go("intake")} />;
  }

  /* ── MODES phase ── */
  if (phase === "modes") {
    if (flowMode === "hardcoded") {
      return <ModeExplorer data={data} onNext={go("return")} onBack={go("recap")} />;
    }
    return <ModeExplorer
      postDiagnosisData={postDiagnosisData}
      loading={postDiagnosisLoading}
      error={postDiagnosisError}
      onRetry={() => firePostDiagnosis(diagnosis, intakeMessages, intakeState)}
      diagnosis={diagnosis}
      onNext={go("human")}
      onBack={go("recap")}
    />;
  }

  /* ── RETURN phase (hardcoded profiles only) ── */
  if (phase === "return") return <ReturnExperience data={data} onBack={go("modes")} onHuman={go("human")} />;

  /* ── HUMAN phase ── */
  if (phase === "human") {
    if (flowMode === "hardcoded") {
      return <HumanHandoff data={data} onBack={go("return")} />;
    }
    return <HumanHandoff
      postDiagnosisData={postDiagnosisData}
      diagnosis={diagnosis}
      onBack={go("modes")}
    />;
  }

  return null;
}
