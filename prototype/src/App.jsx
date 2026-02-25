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

  // Back to entry
  const handleBackToSelect = () => { setPhase("select"); setFlowMode(isDev ? "hardcoded" : null); setProfileKey(null); setDiagnosis(null); setEntryContext(null); window.scrollTo(0, 0); };

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
    const handleDiagnosisComplete = (diag) => {
      console.log("[Vale] handleDiagnosisComplete called, diagnosis:", diag);
      if (!diag) {
        console.warn("[Vale] diagnosis was null/undefined — staying on intake");
        return;
      }
      setDiagnosis(diag);
      setPhase("recap");
      window.scrollTo(0, 0);
    };
    return <LiveIntake mode={flowMode === "rinka" ? "rinka" : "open"} entryContext={entryContext || "generic"} onComplete={handleDiagnosisComplete} onBack={handleBackToSelect} />;
  }

  /* ── RECAP phase ── */
  if (phase === "recap") {
    if (flowMode === "hardcoded") {
      return <IntakeRecap data={data} onContinue={go("modes")} onBack={go("intake")} />;
    }
    // AI path: recap shows diagnosis, "Continue" goes back to start
    return <IntakeRecap diagnosis={diagnosis} onContinue={handleBackToSelect} onBack={go("intake")} />;
  }

  /* ── MODES phase (hardcoded profiles only) ── */
  if (phase === "modes") {
    return <ModeExplorer data={data} onNext={go("return")} onBack={go("recap")} />;
  }

  /* ── RETURN phase (hardcoded profiles only) ── */
  if (phase === "return") return <ReturnExperience data={data} onBack={go("modes")} onHuman={go("human")} />;

  /* ── HUMAN phase (hardcoded profiles only) ── */
  if (phase === "human") return <HumanHandoff data={data} onBack={go("return")} />;

  return null;
}
