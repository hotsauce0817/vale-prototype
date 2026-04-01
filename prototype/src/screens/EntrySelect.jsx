/**
 * EntrySelect — Landing page. The first screen users see.
 *
 * Single CTA: "Start your diagnostic" → triggers onStart → transitions to intake phase.
 * No signup, no onboarding, no name capture. Just a card you click.
 *
 * The ✦ icon is Vale's brand mark (gold sparkle). Used here and on ObservationMarker.
 * The hover state shifts background and border to gold tint for affordance.
 */
import { useState } from "react";
import { T } from "../tokens.js";
import { FadeIn, Badge } from "../components/shared.jsx";

export default function EntrySelect({ onStart }) {
  const [hov, setHov] = useState(false);

  return (
    <div style={{ minHeight: "100vh", background: T.bg, padding: "40px 20px" }}>
      <div style={{ maxWidth: "600px", margin: "0 auto" }}>
        <FadeIn delay={100}>
          <Badge>VALE</Badge>
          <h1
            style={{
              fontFamily: T.serif,
              fontSize: "36px",
              fontWeight: 300,
              color: T.text,
              margin: "16px 0 8px",
              letterSpacing: "-0.5px",
            }}
          >
            The AI Family Office
          </h1>
          <p
            style={{
              fontFamily: T.sans,
              fontSize: "14px",
              color: T.textMid,
              lineHeight: 1.6,
              margin: "0 0 40px",
            }}
          >
            See how Vale surfaces what you&rsquo;re missing — and what it costs
            you not to know.
          </p>
        </FadeIn>

        <FadeIn delay={200}>
          <div
            onClick={onStart}
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "20px",
              padding: "20px",
              borderRadius: "14px",
              cursor: "pointer",
              background: hov ? T.bgSub : T.surface,
              border: `1px solid ${hov ? T.accentBorder : T.border}`,
              transition: "all 0.2s",
            }}
          >
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                background: T.accentFaint,
                border: `1px solid ${T.accentBorder}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: T.sans,
                fontSize: "18px",
                flexShrink: 0,
                color: T.accent,
              }}
            >
              ✦
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontFamily: T.sans,
                  fontSize: "15px",
                  fontWeight: 500,
                  color: T.text,
                  marginBottom: "4px",
                }}
              >
                Start your diagnostic
              </div>
              <div
                style={{
                  fontFamily: T.sans,
                  fontSize: "12px",
                  color: T.textDim,
                  lineHeight: 1.5,
                }}
              >
                Tell Vale what&rsquo;s going on and see what it finds
              </div>
            </div>
            <span style={{ color: T.accentMid, fontSize: "16px" }}>→</span>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}
