/**
 * App.jsx — Root component and phase router.
 *
 * Vale's experience is a 3-act flow:
 *   1. select     → Landing page (EntrySelect). User clicks "Start your diagnostic."
 *   2. intake     → Full-screen conversation (LiveIntake). AI builds the picture.
 *   3. transition → "Building your picture..." (DiagnosisTransition). Calls home screen API.
 *   4. home       → Home screen (ValeHome). Score, briefing, work items.
 *
 * Data flows forward:
 *   intake produces intakeData (rawHistory, observations, closing)
 *     → transition receives intakeData, calls API, produces homeData
 *       → home receives homeData and renders the home screen
 */
import { useState, useEffect } from "react";
import { T, FONT_URL } from "./tokens.js";
import EntrySelect from "./screens/EntrySelect.jsx";
import LiveIntake from "./screens/LiveIntake.jsx";
import DiagnosisTransition from "./screens/DiagnosisTransition.jsx";
import ValeHome from "./screens/ValeHome.jsx";

export default function App() {
  // Phase controls which screen renders
  const [phase, setPhase] = useState("select");
  // Data from the intake conversation (passed to transition)
  const [intakeData, setIntakeData] = useState(null);
  // Home screen data (populated by transition when API returns)
  const [homeData, setHomeData] = useState(null);

  // Load fonts and set background
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = FONT_URL;
    document.head.appendChild(link);
    document.body.style.margin = "0";
    document.body.style.background = T.bg;
  }, []);

  // Entry → Intake
  const handleStart = () => {
    setPhase("intake");
    window.scrollTo(0, 0);
  };

  // Intake → Transition (with data for home screen generation)
  const handleIntakeComplete = (data) => {
    setIntakeData(data);
    setPhase("transition");
    window.scrollTo(0, 0);
  };

  // Transition → Home (with generated home screen data)
  const handleTransitionComplete = (data) => {
    setHomeData(data);
    setPhase("home");
    window.scrollTo(0, 0);
  };

  // Reset everything
  const handleReset = () => {
    setPhase("select");
    setIntakeData(null);
    setHomeData(null);
    window.scrollTo(0, 0);
  };

  /* ── SELECT phase ── */
  if (phase === "select") {
    return <EntrySelect onStart={handleStart} />;
  }

  /* ── INTAKE phase ── */
  if (phase === "intake") {
    return (
      <LiveIntake onComplete={handleIntakeComplete} onBack={handleReset} />
    );
  }

  /* ── TRANSITION phase ── */
  if (phase === "transition") {
    return (
      <DiagnosisTransition
        intakeData={intakeData}
        onComplete={handleTransitionComplete}
      />
    );
  }

  /* ── HOME phase ── */
  if (phase === "home") {
    return <ValeHome homeData={homeData} onReset={handleReset} />;
  }

  return null;
}
