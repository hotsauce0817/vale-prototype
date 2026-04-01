import { useState, useEffect, useRef } from "react";
import { T } from "../tokens.js";
import { FadeIn, Badge, Btn, TopBar, ObservationMarker } from "../components/shared.jsx";
import useDiagnosticChat from "../hooks/useDiagnosticChat.js";

/**
 * LiveIntake — the diagnostic conversation screen.
 *
 * Full-screen chat with an observation strip that appears at the top
 * when the first observation fires. No map panel.
 *
 * Props:
 *   onComplete: ({ closing, rawHistory, observations, sessionId }) => void
 *   onBack: () => void
 */
export default function LiveIntake({ onComplete, onBack }) {
  const {
    messages,
    isLoading,
    observationCount,
    observationSummaries,
    closing,
    sessionId,
    rawHistory,
    observations,
    startConversation,
    sendMessage,
  } = useDiagnosticChat();

  const [inputText, setInputText] = useState("");
  const bottomRef = useRef(null);
  const lastMsgRef = useRef(null);
  const inputRef = useRef(null);
  const started = useRef(false);
  const completeCalled = useRef(false);

  // Start conversation on mount
  useEffect(() => {
    if (!started.current) {
      started.current = true;
      startConversation();
    }
  }, [startConversation]);

  // Auto-scroll on new messages.
  // When the latest message has an observation card, scroll to the START of that
  // message container so the observation (rendered above the AI text) is fully visible.
  // Otherwise, scroll to the bottom as usual.
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    const hasObservation = lastMsg?.type === "ai" && lastMsg?.observation;

    setTimeout(
      () => {
        if (hasObservation && lastMsgRef.current) {
          lastMsgRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        } else {
          bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        }
      },
      hasObservation ? 200 : 100  // slightly longer delay for observation FadeIn
    );
  }, [messages, isLoading]);

  const handleSend = () => {
    const text = inputText.trim();
    if (!text || isLoading) return;
    setInputText("");
    if (inputRef.current) inputRef.current.style.height = "auto";
    sendMessage(text);
  };

  const isDone = !!closing;
  const showInput = !isDone;
  const hasObservations = observationSummaries.length > 0;

  return (
    <div
      style={{
        height: "100vh",
        background: T.bg,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <TopBar left="Vale" right="Diagnostic Intake" onBack={onBack} />

      {/* ── Observation Strip ── */}
      {/* Appears on first observation, accumulates one-line summaries */}
      <div
        style={{
          maxHeight: hasObservations ? "200px" : "0px",
          opacity: hasObservations ? 1 : 0,
          overflow: "hidden",
          transition: "max-height 0.5s cubic-bezier(0.23,1,0.32,1), opacity 0.4s ease-out",
          borderBottom: hasObservations ? `1px solid ${T.border}` : "none",
          background: T.bg,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            padding: "10px 20px",
            display: "flex",
            alignItems: "flex-start",
            gap: "10px",
          }}
        >
          <ObservationMarker size={18} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", flex: 1 }}>
            {observationSummaries.map((summary, i) => (
              <FadeIn key={i} delay={0} y={4}>
                <span
                  style={{
                    fontFamily: T.sans,
                    fontSize: "11.5px",
                    color: T.accent,
                    background: T.accentFaint,
                    border: `1px solid ${T.accentBorder}`,
                    borderRadius: "6px",
                    padding: "4px 10px",
                    lineHeight: 1.4,
                    display: "inline-block",
                  }}
                >
                  {summary}
                </span>
              </FadeIn>
            ))}
          </div>
        </div>
      </div>

      {/* ── Chat area ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Messages area */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "24px 20px 200px",
          }}
        >
          <div style={{ maxWidth: "600px", margin: "0 auto" }}>
            {messages.map((msg, i) => {
              const isLast = i === messages.length - 1;

              if (msg.type === "done") {
                return (
                  <FadeIn key={i} delay={0}>
                    <div style={{ textAlign: "center", padding: "32px 0" }}>
                      <p
                        style={{
                          fontFamily: T.serif,
                          fontSize: "17px",
                          fontStyle: "italic",
                          color: T.text,
                          margin: "0 0 8px",
                        }}
                      >
                        Your picture is ready.
                      </p>
                      {observationCount > 0 && (
                        <p
                          style={{
                            fontFamily: T.sans,
                            fontSize: "13px",
                            color: T.accentMid,
                            margin: "0 0 20px",
                          }}
                        >
                          {observationCount} observation
                          {observationCount !== 1 ? "s" : ""} from this
                          conversation
                        </p>
                      )}
                      <Btn
                        primary
                        onClick={() => {
                          if (completeCalled.current) return;
                          completeCalled.current = true;
                          onComplete({
                            closing,
                            rawHistory: rawHistory.current,
                            observations,
                            sessionId,
                          });
                        }}
                      >
                        See your picture →
                      </Btn>
                    </div>
                  </FadeIn>
                );
              }

              if (msg.type === "ai") {
                return (
                  <div key={i} ref={isLast ? lastMsgRef : undefined}>
                    {/* Observation card above AI message */}
                    {msg.observation && (
                      <FadeIn delay={0} y={10}>
                        <div style={{ marginBottom: "16px" }}>
                          <div
                            style={{
                              background: T.accentFaint,
                              border: `1px solid ${T.accentBorder}`,
                              borderRadius: "12px",
                              padding: "14px 18px",
                              animation:
                                "obsBorderPulse 2s ease-in-out",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                marginBottom: "8px",
                              }}
                            >
                              <ObservationMarker size={18} />
                              <Badge color={T.accent}>OBSERVATION</Badge>
                            </div>
                            <p
                              style={{
                                fontFamily: T.sans,
                                fontSize: "13px",
                                color: T.textMid,
                                lineHeight: 1.65,
                                margin: 0,
                              }}
                            >
                              {msg.observation}
                            </p>
                          </div>
                        </div>
                      </FadeIn>
                    )}
                    <FadeIn delay={msg.observation ? 600 : 0}>
                      <div
                        style={{
                          marginBottom: "16px",
                          background: T.surface,
                          border: `1px solid ${T.border}`,
                          borderRadius: "14px",
                          padding: "14px 18px",
                        }}
                      >
                        <p
                          style={{
                            fontFamily: T.sans,
                            fontSize: "14px",
                            color: T.text,
                            lineHeight: 1.65,
                            margin: 0,
                          }}
                        >
                          {msg.content}
                        </p>
                      </div>
                    </FadeIn>
                  </div>
                );
              }

              if (msg.type === "user") {
                return (
                  <FadeIn key={i} delay={0}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        marginBottom: "16px",
                      }}
                    >
                      <div
                        style={{
                          background: T.accentFaint,
                          border: `1px solid ${T.accentBorder}`,
                          borderRadius: "14px 14px 0 14px",
                          padding: "12px 18px",
                          maxWidth: "85%",
                        }}
                      >
                        <p
                          style={{
                            fontFamily: T.sans,
                            fontSize: "14px",
                            color: T.text,
                            lineHeight: 1.5,
                            margin: 0,
                          }}
                        >
                          {msg.content}
                        </p>
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
                <div
                  style={{
                    marginBottom: "16px",
                    background: T.surface,
                    border: `1px solid ${T.border}`,
                    borderRadius: "14px",
                    padding: "14px 18px",
                    display: "inline-block",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: "4px",
                      alignItems: "center",
                    }}
                  >
                    {[0, 1, 2].map((j) => (
                      <div
                        key={j}
                        style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          background: T.textDim,
                          animation: `typingDot 1.4s infinite ease-in-out ${j * 0.2}s`,
                        }}
                      />
                    ))}
                  </div>
                  <style>{`
                    @keyframes typingDot { 0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); } 40% { opacity: 1; transform: scale(1); } }
                    @keyframes obsBorderPulse { 0% { border-color: ${T.accentBorder}; } 40% { border-color: ${T.accentMid}; } 100% { border-color: ${T.accentBorder}; } }
                  `}</style>
                </div>
              </FadeIn>
            )}

            <div ref={bottomRef} />
          </div>
        </div>

        {/* Input area */}
        {showInput && (
          <div
            style={{
              padding: "12px 20px 16px",
              borderTop: `1px solid ${T.border}`,
              background: T.bg,
            }}
          >
            <div style={{ maxWidth: "600px", margin: "0 auto" }}>
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  background: T.surface,
                  border: `1px solid ${T.border}`,
                  borderRadius: "14px",
                  padding: "4px 4px 4px 18px",
                  alignItems: "flex-end",
                }}
              >
                <textarea
                  ref={inputRef}
                  value={inputText}
                  onChange={(e) => {
                    setInputText(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height =
                      Math.min(e.target.scrollHeight, 120) + "px";
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
                    flex: 1,
                    background: "none",
                    border: "none",
                    outline: "none",
                    resize: "none",
                    fontFamily: T.sans,
                    fontSize: "14px",
                    color: T.text,
                    padding: "10px 0",
                    lineHeight: 1.5,
                    maxHeight: "120px",
                    overflowY: "auto",
                  }}
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading || !inputText.trim()}
                  style={{
                    background: inputText.trim() ? T.accent : "transparent",
                    border: inputText.trim()
                      ? "none"
                      : `1px solid ${T.border}`,
                    borderRadius: "10px",
                    padding: "10px 18px",
                    cursor: inputText.trim() ? "pointer" : "default",
                    fontFamily: T.sans,
                    fontSize: "12px",
                    fontWeight: 600,
                    color: inputText.trim() ? "#FFFFFF" : T.textDim,
                    transition: "all 0.2s",
                    flexShrink: 0,
                  }}
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
