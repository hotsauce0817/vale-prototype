import { useState, useEffect, useRef, useCallback } from "react";
import { T } from "../tokens.js";
import { FadeIn, Badge, Btn, TopBar, ValeAvatar } from "../components/shared.jsx";

export default function DiagnosticIntake({ data, onComplete, onBack }) {
  const [step, setStep] = useState(0);
  const [messages, setMessages] = useState([]);
  const [showChoices, setShowChoices] = useState(false);
  const [observations, setObservations] = useState([]);
  const bottomRef = useRef(null);
  const timerRef = useRef(null);
  const intake = data.intake;

  const scrollDown = () => setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);

  const advance = useCallback(() => {
    if (step >= intake.length) return;
    const msg = intake[step];
    if (msg.from === "ai") {
      setMessages(prev => [...prev, { from: "ai", text: msg.text }]);
      setStep(s => s + 1);
      scrollDown();
    } else if (msg.from === "observation") {
      setObservations(prev => [...prev, msg.text]);
      setMessages(prev => [...prev, { from: "observation", text: msg.text }]);
      setStep(s => s + 1);
      scrollDown();
    } else if (msg.from === "user") {
      setShowChoices(true);
      scrollDown();
    }
  }, [step, intake]);

  useEffect(() => {
    if (step >= intake.length) {
      timerRef.current = setTimeout(() => setMessages(prev => [...prev, { from: "done" }]), 800);
      return () => clearTimeout(timerRef.current);
    }
    const msg = intake[step];
    if (msg.from === "user") {
      setShowChoices(true);
      scrollDown();
    } else {
      const delay = msg.from === "observation" ? 1200 : 800;
      timerRef.current = setTimeout(advance, delay);
      return () => clearTimeout(timerRef.current);
    }
  }, [step, advance, intake]);

  const advanceNow = useCallback(() => {
    if (showChoices) return;
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    if (step >= intake.length) {
      setMessages(prev => prev.some(m => m.from === "done") ? prev : [...prev, { from: "done" }]);
    } else {
      advance();
    }
  }, [showChoices, step, intake.length, advance]);

  const handleChoice = (choiceIdx) => {
    const msg = intake[step];
    setMessages(prev => [...prev, { from: "user", text: msg.choices[msg.pick !== undefined ? msg.pick : choiceIdx] }]);
    setShowChoices(false);
    setStep(s => s + 1);
    scrollDown();
  };

  return <div style={{ minHeight: "100vh", background: T.bg, display: "flex", flexDirection: "column" }}>
    <TopBar left="VALE" right="Intake" onBack={onBack} />
    <div onClick={advanceNow} style={{ flex: 1, overflowY: "auto", padding: "24px 20px 260px", cursor: showChoices ? "default" : "pointer" }}>
      <div style={{ maxWidth: "560px", margin: "0 auto" }}>
        <FadeIn delay={0}><p style={{ fontFamily: T.serif, fontSize: "22px", fontWeight: 300, color: T.text, margin: "0 0 24px" }}>Let's understand your situation, {data.name}.</p></FadeIn>
        {messages.map((msg, i) => {
          if (msg.from === "done") return <FadeIn key={i} delay={0}>
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <p style={{ fontFamily: T.serif, fontSize: "17px", fontStyle: "italic", color: T.text, margin: "0 0 8px" }}>I've heard enough to show you something.</p>
              {observations.length > 0 && <p style={{ fontFamily: T.sans, fontSize: "13px", color: T.goldDim, margin: "0 0 20px" }}>{observations.length} observations from this conversation</p>}
              <Btn primary onClick={(e) => { e.stopPropagation(); onComplete(); }}>See what we found →</Btn>
            </div>
          </FadeIn>;
          if (msg.from === "ai") return <FadeIn key={i} delay={0}>
            <div style={{ display: "flex", gap: "10px", marginBottom: "16px", alignItems: "flex-start" }}>
              <ValeAvatar size={24} />
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: "0 14px 14px 14px", padding: "14px 18px", maxWidth: "85%" }}>
                <p style={{ fontFamily: T.sans, fontSize: "14px", color: T.text, lineHeight: 1.65, margin: 0 }}>{msg.text}</p>
              </div>
            </div>
          </FadeIn>;
          if (msg.from === "observation") return <FadeIn key={i} delay={0}>
            <div style={{ display: "flex", gap: "10px", marginBottom: "16px", marginLeft: "34px" }}>
              <div style={{ background: "rgba(200,164,86,0.06)", border: `1px solid rgba(200,164,86,0.15)`, borderRadius: "12px", padding: "14px 18px", maxWidth: "85%", position: "relative" }}>
                <Badge color={T.gold}>OBSERVATION</Badge>
                <p style={{ fontFamily: T.sans, fontSize: "13px", color: T.goldLight, lineHeight: 1.65, margin: "8px 0 0" }}>{msg.text}</p>
              </div>
            </div>
          </FadeIn>;
          if (msg.from === "user") return <FadeIn key={i} delay={0}>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
              <div style={{ background: "rgba(200,164,86,0.12)", border: `1px solid rgba(200,164,86,0.2)`, borderRadius: "14px 0 14px 14px", padding: "12px 18px", maxWidth: "75%" }}>
                <p style={{ fontFamily: T.sans, fontSize: "14px", color: T.text, lineHeight: 1.5, margin: 0 }}>{msg.text}</p>
              </div>
            </div>
          </FadeIn>;
          return null;
        })}
        <div ref={bottomRef} />
      </div>
    </div>
    {showChoices && step < intake.length && intake[step].from === "user" && (
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: `linear-gradient(transparent, ${T.bg} 20%)`, padding: "40px 20px 24px" }}>
        <div style={{ maxWidth: "560px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "8px" }}>
          {intake[step].choices.map((c, ci) => (
            <button key={ci} onClick={() => handleChoice(ci)} style={{
              background: ci === intake[step].pick ? "rgba(200,164,86,0.08)" : T.surface,
              border: `1px solid ${ci === intake[step].pick ? "rgba(200,164,86,0.2)" : T.border}`,
              borderRadius: "12px", padding: "14px 18px", cursor: "pointer", textAlign: "left", transition: "all 0.15s",
              fontFamily: T.sans, fontSize: "13.5px", color: T.text, lineHeight: 1.5
            }}>{c}</button>
          ))}
        </div>
      </div>
    )}
  </div>;
}
