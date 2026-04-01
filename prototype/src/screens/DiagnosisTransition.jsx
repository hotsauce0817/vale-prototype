import { useState, useEffect, useRef } from "react";
import { T } from "../tokens.js";

/**
 * DiagnosisTransition — "Building your picture..." loading state.
 *
 * Calls /api/diagnosis (home screen generation) in parallel with the animation.
 * When the API returns, fades out and calls onComplete(homeData).
 *
 * Props:
 *   intakeData: { rawHistory, observations, closing, sessionId }
 *   onComplete: (homeData) => void
 */
export default function DiagnosisTransition({ intakeData, onComplete }) {
  const [homeData, setHomeData] = useState(null);
  const [visible, setVisible] = useState(true);
  const exitingRef = useRef(false);

  // Start home screen generation API call on mount (with single retry on transient errors)
  useEffect(() => {
    if (!intakeData) return;

    const fetchHomeData = async (attempt = 1) => {
      try {
        const res = await fetch("/api/diagnosis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rawHistory: intakeData.rawHistory,
            observations: intakeData.observations,
            closing: intakeData.closing,
            sessionId: intakeData.sessionId,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          setHomeData(data);
          return;
        }

        console.error("Home screen generation failed:", res.status);
        const retryable = res.status === 429 || res.status >= 500;

        if (retryable && attempt === 1) {
          console.log("Retrying in 3s...");
          setTimeout(() => fetchHomeData(2), 3000);
          return;
        }

        // Retries exhausted or non-retryable — fail gracefully
        if (!exitingRef.current) {
          exitingRef.current = true;
          onComplete(null);
        }
      } catch (err) {
        console.error("Home screen generation error:", err);

        if (attempt === 1) {
          console.log("Retrying in 3s...");
          setTimeout(() => fetchHomeData(2), 3000);
          return;
        }

        if (!exitingRef.current) {
          exitingRef.current = true;
          onComplete(null);
        }
      }
    };

    fetchHomeData();
  }, [intakeData, onComplete]);

  // When homeData arrives, start exit sequence
  useEffect(() => {
    if (!homeData) return;
    if (exitingRef.current) return;

    exitingRef.current = true;
    // Brief pause, then fade out and complete
    const t1 = setTimeout(() => setVisible(false), 500);
    const t2 = setTimeout(() => onComplete(homeData), 1000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      exitingRef.current = false; // StrictMode compat
    };
  }, [homeData, onComplete]);

  // Fallback: if no response after 60s, complete with null
  useEffect(() => {
    const t = setTimeout(() => {
      if (!exitingRef.current) {
        console.warn("Home screen generation timed out after 60s");
        exitingRef.current = true;
        onComplete(null);
      }
    }, 60000);
    return () => clearTimeout(t);
  }, [onComplete]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: T.bg,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.5s ease",
      }}
    >
      <style>{`
        @keyframes gentlePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>

      <p
        style={{
          fontFamily: T.serif,
          fontSize: "20px",
          fontWeight: 300,
          fontStyle: "italic",
          color: T.text,
          margin: 0,
          animation: "gentlePulse 2.5s ease-in-out infinite",
        }}
      >
        Building your picture...
      </p>
    </div>
  );
}
