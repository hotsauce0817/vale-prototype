import { useState, useEffect, useRef } from "react";
import { T } from "../tokens.js";
import { FadeIn, Badge, Btn, TopBar, ValeAvatar } from "../components/shared.jsx";
import useDiagnosticChat from "../hooks/useDiagnosticChat.js";
import { RINKA_RESPONSES } from "../data/rinka.js";

/**
 * LiveIntake — the live AI diagnostic conversation.
 *
 * Two modes:
 * - "rinka": Pre-selected response buttons (curated demo)
 * - "open": Free-text input (try it yourself)
 *
 * Props:
 *   mode: "rinka" | "open"
 *   entryContext: "equity" | "home" | "generic" (for open mode)
 *   onComplete: (diagnosis) => void
 *   onBack: () => void
 */
export default function LiveIntake({ mode, entryContext, onComplete, onBack }) {
  const { messages, isLoading, diagnosis, observationCount, startConversation, sendMessage } = useDiagnosticChat(mode, entryContext);
  const [inputText, setInputText] = useState("");
  const [responseIndex, setResponseIndex] = useState(0);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const started = useRef(false);

  // Start conversation on mount
  useEffect(() => {
    if (!started.current) {
      started.current = true;
      startConversation();
    }
  }, [startConversation]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }, [messages, isLoading]);

  // Handle diagnosis completion
  useEffect(() => {
    if (diagnosis) {
      // Small delay so the user sees the "done" message
    }
  }, [diagnosis]);

  // Handle sending a message (open mode)
  const handleSend = () => {
    const text = inputText.trim();
    if (!text || isLoading) return;
    setInputText("");
    sendMessage(text);
  };

  // Handle choice selection (rinka mode)
  const handleChoice = (choiceIdx) => {
    if (isLoading) return;
    const responseSet = RINKA_RESPONSES[responseIndex];
    if (!responseSet) return;
    const text = responseSet.choices[responseSet.pick !== undefined ? responseSet.pick : choiceIdx];
    setResponseIndex((i) => i + 1);
    sendMessage(text);
  };

  // Only show choice buttons after a successful AI response (not after error fallback)
  const hasValidAIResponse = messages.some((m) => m.type === "ai" && !m.content.startsWith("Something went wrong"));
  const showChoices = mode === "rinka" && !isLoading && responseIndex < RINKA_RESPONSES.length && !diagnosis && hasValidAIResponse;
  // Should we show text input? (open mode, not done)
  const showInput = mode === "open" && !diagnosis;

  return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", flexDirection: "column" }}>
      <TopBar left="VALE" right={mode === "rinka" ? "Demo: Rinka" : "Diagnostic Intake"} onBack={onBack} />

      {/* Message area */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 20px 260px" }}>
        <div style={{ maxWidth: "560px", margin: "0 auto" }}>
          {/* Opening line */}
          <FadeIn delay={0}>
            <p style={{ fontFamily: T.serif, fontSize: "22px", fontWeight: 300, color: T.text, margin: "0 0 24px" }}>
              {mode === "rinka" ? "Let's understand your situation, Rinka." : "Let's understand your situation."}
            </p>
          </FadeIn>

          {/* Messages */}
          {messages.map((msg, i) => {
            if (msg.type === "done") {
              return (
                <FadeIn key={i} delay={0}>
                  <div style={{ textAlign: "center", padding: "32px 0" }}>
                    <p style={{ fontFamily: T.serif, fontSize: "17px", fontStyle: "italic", color: T.text, margin: "0 0 8px" }}>
                      I've heard enough to show you something.
                    </p>
                    {observationCount > 0 && (
                      <p style={{ fontFamily: T.sans, fontSize: "13px", color: T.goldDim, margin: "0 0 20px" }}>
                        {observationCount} observation{observationCount !== 1 ? "s" : ""} from this conversation
                      </p>
                    )}
                    <Btn primary onClick={() => onComplete(diagnosis)}>See what we found →</Btn>
                  </div>
                </FadeIn>
              );
            }

            if (msg.type === "ai") {
              return (
                <FadeIn key={i} delay={0}>
                  <div style={{ display: "flex", gap: "10px", marginBottom: "16px", alignItems: "flex-start" }}>
                    <ValeAvatar size={24} />
                    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: "0 14px 14px 14px", padding: "14px 18px", maxWidth: "85%" }}>
                      <p style={{ fontFamily: T.sans, fontSize: "14px", color: T.text, lineHeight: 1.65, margin: 0 }}>{msg.content}</p>
                    </div>
                  </div>
                </FadeIn>
              );
            }

            if (msg.type === "observation") {
              return (
                <FadeIn key={i} delay={0}>
                  <div style={{ display: "flex", gap: "10px", marginBottom: "16px", marginLeft: "34px" }}>
                    <div style={{ background: "rgba(200,164,86,0.06)", border: "1px solid rgba(200,164,86,0.15)", borderRadius: "12px", padding: "14px 18px", maxWidth: "85%", position: "relative" }}>
                      <Badge color={T.gold}>OBSERVATION</Badge>
                      <p style={{ fontFamily: T.sans, fontSize: "13px", color: T.goldLight, lineHeight: 1.65, margin: "8px 0 0" }}>{msg.content}</p>
                    </div>
                  </div>
                </FadeIn>
              );
            }

            if (msg.type === "user") {
              return (
                <FadeIn key={i} delay={0}>
                  <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
                    <div style={{ background: "rgba(200,164,86,0.12)", border: "1px solid rgba(200,164,86,0.2)", borderRadius: "14px 0 14px 14px", padding: "12px 18px", maxWidth: "75%" }}>
                      <p style={{ fontFamily: T.sans, fontSize: "14px", color: T.text, lineHeight: 1.5, margin: 0 }}>{msg.content}</p>
                    </div>
                  </div>
                </FadeIn>
              );
            }

            return null;
          })}

          {/* Typing indicator */}
          {isLoading && (
            <FadeIn delay={0}>
              <div style={{ display: "flex", gap: "10px", marginBottom: "16px", alignItems: "flex-start" }}>
                <ValeAvatar size={24} />
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: "0 14px 14px 14px", padding: "14px 18px" }}>
                  <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                    {[0, 1, 2].map((j) => (
                      <div key={j} style={{
                        width: "6px", height: "6px", borderRadius: "50%", background: T.textDim,
                        animation: `typingDot 1.4s infinite ease-in-out ${j * 0.2}s`,
                      }} />
                    ))}
                  </div>
                  <style>{`@keyframes typingDot { 0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); } 40% { opacity: 1; transform: scale(1); } }`}</style>
                </div>
              </div>
            </FadeIn>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input area — fixed at bottom */}
      {showChoices && responseIndex < RINKA_RESPONSES.length && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: `linear-gradient(transparent, ${T.bg} 20%)`, padding: "40px 20px 24px" }}>
          <div style={{ maxWidth: "560px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "8px" }}>
            {RINKA_RESPONSES[responseIndex].choices.map((c, ci) => (
              <button key={ci} onClick={() => handleChoice(ci)} style={{
                background: ci === RINKA_RESPONSES[responseIndex].pick ? "rgba(200,164,86,0.08)" : T.surface,
                border: `1px solid ${ci === RINKA_RESPONSES[responseIndex].pick ? "rgba(200,164,86,0.2)" : T.border}`,
                borderRadius: "12px", padding: "14px 18px", cursor: "pointer", textAlign: "left", transition: "all 0.15s",
                fontFamily: T.sans, fontSize: "13.5px", color: T.text, lineHeight: 1.5,
              }}>{c}</button>
            ))}
          </div>
        </div>
      )}

      {showInput && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: `linear-gradient(transparent, ${T.bg} 20%)`, padding: "40px 20px 24px" }}>
          <div style={{ maxWidth: "560px", margin: "0 auto" }}>
            <div style={{ display: "flex", gap: "10px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: "14px", padding: "4px 4px 4px 18px", alignItems: "flex-end" }}>
              <textarea
                ref={inputRef}
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  // Auto-resize: reset height then set to scrollHeight
                  e.target.style.height = "auto";
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Type a message..."
                disabled={isLoading}
                rows={1}
                style={{
                  flex: 1, background: "none", border: "none", outline: "none", resize: "none",
                  fontFamily: T.sans, fontSize: "14px", color: T.text, padding: "10px 0",
                  lineHeight: 1.5, maxHeight: "120px", overflowY: "auto",
                }}
              />
              <button onClick={handleSend} disabled={isLoading || !inputText.trim()} style={{
                background: inputText.trim() ? `linear-gradient(135deg, ${T.gold}, ${T.goldLight})` : "transparent",
                border: inputText.trim() ? "none" : `1px solid ${T.border}`,
                borderRadius: "10px", padding: "10px 18px", cursor: inputText.trim() ? "pointer" : "default",
                fontFamily: T.sans, fontSize: "12px", fontWeight: 600, color: inputText.trim() ? T.bg : T.textDim,
                transition: "all 0.2s", flexShrink: 0,
              }}>Send</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
