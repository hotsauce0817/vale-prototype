import { useState, useEffect } from "react";
import { T } from "../tokens.js";

/**
 * ValeHome — the home screen. Replaces the old diagnosis report.
 *
 * Renders the AI-generated home screen content: score, net worth,
 * mirror line, briefing cards, and work items.
 *
 * Feels like a letter from your CFO, not a dashboard.
 *
 * Props:
 *   homeData: the structured JSON from /api/diagnosis (home screen generation)
 *   onReset: () => void — start a new diagnostic
 */

// ── Color helpers ──

const C = {
  bg: T.bg,
  card: T.surface,
  text: T.text,
  sub: T.textMid,
  hint: T.textDim,
  border: T.border,
  green: T.green,
  amber: T.orange,      // amber/warning color
  red: T.red,
  accent: T.accent,
  accentBg: T.accentFaint,
};

// ── Animated Score Ring ──

function AnimatedScore({ target }) {
  const [val, setVal] = useState(0);
  const [offset, setOffset] = useState(364.4);
  const r = 58;
  const circ = 2 * Math.PI * r;
  const color = target >= 80 ? C.green : target >= 55 ? C.amber : C.red;

  useEffect(() => {
    const t = setTimeout(() => {
      setOffset(circ - (target / 100) * circ);
      const start = Date.now();
      const tick = () => {
        const p = Math.min((Date.now() - start) / 1400, 1);
        setVal(Math.round((1 - Math.pow(1 - p, 3)) * target));
        if (p < 1) requestAnimationFrame(tick);
      };
      tick();
    }, 600);
    return () => clearTimeout(t);
  }, [target, circ]);

  return (
    <div style={{ position: "relative", width: 140, height: 140 }}>
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={r} fill="none" stroke={C.border} strokeWidth="3" />
        <circle
          cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          transform="rotate(-90 70 70)"
          style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(0.16,1,0.3,1)" }}
        />
      </svg>
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%,-50%)", textAlign: "center",
      }}>
        <div style={{ fontSize: 42, fontWeight: 500, color: C.text, lineHeight: 1 }}>{val}</div>
      </div>
    </div>
  );
}

// ── Fade-in animation ──

function Fade({ children, delay = 0 }) {
  const [v, setV] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setV(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <div style={{
      opacity: v ? 1 : 0,
      transform: v ? "translateY(0)" : "translateY(6px)",
      transition: "all 0.5s ease-out",
    }}>
      {children}
    </div>
  );
}

// ── Briefing Card ──

function Brief({ headline, body, cta, urgent, delay }) {
  const [h, setH] = useState(false);
  return (
    <Fade delay={delay}>
      <div
        onMouseEnter={() => setH(true)}
        onMouseLeave={() => setH(false)}
        style={{
          background: C.card,
          border: `0.5px solid ${urgent ? "rgba(184,66,51,0.18)" : C.border}`,
          borderLeft: urgent ? `2.5px solid ${C.red}` : `0.5px solid ${C.border}`,
          borderRadius: urgent ? "2px 10px 10px 2px" : 10,
          padding: "16px 18px",
          marginBottom: 8,
          cursor: "pointer",
          transition: "all 0.15s ease",
          transform: h ? "translateY(-1px)" : "none",
          boxShadow: h ? "0 2px 8px rgba(0,0,0,0.04)" : "none",
        }}
      >
        {headline && (
          <div style={{
            fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 6,
            fontFamily: T.sans,
          }}>
            {headline}
          </div>
        )}
        <div style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "flex-start", gap: 14,
        }}>
          <div style={{
            fontSize: 14.5, color: C.text, lineHeight: 1.6, flex: 1,
            fontFamily: T.serif,
          }}>
            {body}
          </div>
          {cta && (
            <div style={{
              fontSize: 12, color: C.green, fontWeight: 500, whiteSpace: "nowrap",
              marginTop: 3, flexShrink: 0, fontFamily: T.sans,
              transition: "transform 0.15s ease",
              transform: h ? "translateX(2px)" : "none",
            }}>
              {cta} →
            </div>
          )}
        </div>
      </div>
    </Fade>
  );
}

// ── Work Item Row ──

function WorkRow({ title, sub, pts, last }) {
  const [h, setH] = useState(false);
  const sc = sub.startsWith("Ready") ? C.green : sub.startsWith("Need") ? C.amber : C.sub;
  return (
    <div
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "13px 2px",
        borderBottom: last ? "none" : `0.5px solid ${C.border}`,
        cursor: "pointer",
        background: h ? "rgba(0,0,0,0.012)" : "transparent",
        transition: "background 0.1s ease",
        borderRadius: 3,
      }}
    >
      <div>
        <div style={{ fontSize: 14, color: C.text, fontWeight: 500 }}>{title}</div>
        <div style={{ fontSize: 12, color: sc, marginTop: 2 }}>{sub}</div>
      </div>
      {pts > 0 ? (
        <div style={{ fontSize: 17, fontWeight: 500, color: C.green }}>+{pts}</div>
      ) : (
        <div style={{ fontSize: 14, color: C.hint }}>—</div>
      )}
    </div>
  );
}

// ── Format helpers ──

function formatCurrency(value) {
  if (value == null) return "—";
  const abs = Math.abs(value);
  if (abs >= 1000000) {
    const m = (abs / 1000000).toFixed(1).replace(/\.0$/, "");
    return `$${m}M`;
  }
  if (abs >= 1000) {
    const k = Math.round(abs / 1000);
    return `$${k}K`;
  }
  return `$${abs}`;
}

function formatCashFlow(value) {
  if (value == null) return null;
  const prefix = value < 0 ? "−" : "+";
  return `${prefix}${formatCurrency(Math.abs(value))}/mo`;
}

// ── Main Component ──

export default function ValeHome({ homeData, onReset }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!homeData) {
    return (
      <div style={{
        minHeight: "100vh", background: C.bg,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "40px 20px", textAlign: "center",
      }}>
        <p style={{
          fontFamily: T.serif, fontSize: 18, color: C.text,
          margin: "0 0 8px",
        }}>
          We couldn't build your picture.
        </p>
        <p style={{
          fontFamily: T.sans, fontSize: 13, color: C.sub,
          margin: "0 0 24px",
        }}>
          This is usually temporary. Your conversation is saved.
        </p>
        <button
          onClick={onReset}
          style={{
            fontFamily: T.sans, fontSize: 12, fontWeight: 600,
            color: T.surface, background: C.accent, border: "none",
            borderRadius: 8, padding: "10px 20px", cursor: "pointer",
          }}
        >
          Start over
        </button>
      </div>
    );
  }

  const score = homeData.score || 0;
  const netWorth = homeData.balance_sheet?.net_worth;
  const cashFlow = homeData.balance_sheet?.monthly_cash_flow;
  const mirrorLine = homeData.score_explanation;
  const briefing = homeData.briefing_items || [];
  const workItems = homeData.work_items || [];

  // Format today's date
  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });

  return (
    <div style={{ minHeight: "100vh", background: C.bg }}>
      <div style={{
        maxWidth: 460, margin: "0 auto", padding: "48px 24px 80px",
        opacity: mounted ? 1 : 0, transition: "opacity 0.3s ease-out",
        fontFamily: T.serif,
      }}>

        {/* ── Header ── */}
        <Fade delay={100}>
          <div style={{
            display: "flex", justifyContent: "space-between",
            alignItems: "center", marginBottom: 48,
            fontFamily: T.sans,
          }}>
            <div style={{
              fontSize: 12, color: C.accent,
              letterSpacing: "0.08em", fontWeight: 500,
            }}>
              VALE
            </div>
            <div style={{ fontSize: 12, color: C.hint }}>{dateStr}</div>
          </div>
        </Fade>

        {/* ── Score + Net Worth ── */}
        <Fade delay={250}>
          <div style={{
            display: "flex", justifyContent: "space-between",
            alignItems: "flex-end", marginBottom: 12,
          }}>
            <div>
              <div style={{
                fontSize: 11, color: C.sub, letterSpacing: "0.03em",
                marginBottom: 8, fontFamily: T.sans,
              }}>
                Financial well-being
              </div>
              <AnimatedScore target={score} />
            </div>
            <div style={{ textAlign: "right", paddingBottom: 8 }}>
              <div style={{
                fontSize: 11, color: C.sub, letterSpacing: "0.03em",
                marginBottom: 8, fontFamily: T.sans,
              }}>
                Net worth
              </div>
              <div style={{
                fontSize: 28, fontWeight: 500, color: C.text, lineHeight: 1,
              }}>
                {formatCurrency(netWorth)}
              </div>
              {cashFlow != null && (
                <div style={{
                  fontSize: 12, marginTop: 6,
                  color: cashFlow < 0 ? C.red : C.green,
                  fontFamily: T.sans,
                }}>
                  {formatCashFlow(cashFlow)}
                </div>
              )}
            </div>
          </div>
        </Fade>

        {/* ── Mirror Line ── */}
        {mirrorLine && (
          <Fade delay={400}>
            <div style={{
              fontSize: 14, color: C.sub, lineHeight: 1.55, marginBottom: 32,
              fontFamily: T.serif, fontStyle: "italic",
            }}>
              {mirrorLine}
            </div>
          </Fade>
        )}

        {/* ── Open Door ── */}
        <Fade delay={500}>
          <div
            style={{
              background: "rgba(0,0,0,0.025)", borderRadius: 12,
              padding: "14px 18px", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 12,
              fontFamily: T.sans,
              transition: "background 0.15s ease", marginBottom: 40,
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(0,0,0,0.045)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "rgba(0,0,0,0.025)"}
          >
            <div style={{
              width: 26, height: 26, borderRadius: "50%", background: C.card,
              border: `0.5px solid ${C.border}`, display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 13, color: C.accent,
            }}>
              ✦
            </div>
            <div style={{ fontSize: 14, color: C.sub }}>What's on your mind?</div>
          </div>
        </Fade>

        {/* ── Briefing ── */}
        {briefing.length > 0 && (
          <>
            <Fade delay={600}>
              <div style={{
                fontSize: 11, color: C.sub, letterSpacing: "0.05em", fontWeight: 500,
                marginBottom: 12, fontFamily: T.sans,
              }}>
                YOUR BRIEFING
              </div>
            </Fade>

            {briefing.map((item, i) => (
              <Brief
                key={i}
                headline={item.headline}
                body={item.body}
                cta={item.cta_label}
                urgent={item.urgent}
                delay={700 + i * 100}
              />
            ))}
          </>
        )}

        {/* ── Work Items ── */}
        {workItems.length > 0 && (
          <Fade delay={700 + briefing.length * 100 + 100}>
            <div style={{ marginTop: 40, marginBottom: 48 }}>
              <div style={{
                display: "flex", justifyContent: "space-between",
                alignItems: "baseline", marginBottom: 8,
              }}>
                <div style={{
                  fontSize: 11, color: C.sub, letterSpacing: "0.05em",
                  fontWeight: 500, fontFamily: T.sans,
                }}>
                  THE WORK
                </div>
                <div style={{ fontSize: 12, color: C.hint, fontFamily: T.sans }}>
                  All done → <span style={{ fontWeight: 500, color: C.text }}>100</span>
                </div>
              </div>
              <div style={{ fontFamily: T.sans }}>
                {workItems.map((item, i) => (
                  <WorkRow
                    key={i}
                    title={item.title}
                    sub={`${item.status}${item.status_detail ? " · " + item.status_detail : ""}`}
                    pts={item.points || 0}
                    last={i === workItems.length - 1}
                  />
                ))}
              </div>
            </div>
          </Fade>
        )}

        {/* ── Footer ── */}
        <Fade delay={700 + briefing.length * 100 + 300}>
          <div style={{ textAlign: "center", paddingTop: 20 }}>
            <button
              onClick={onReset}
              style={{
                fontFamily: T.sans, fontSize: 12, color: C.sub,
                background: "none", border: `1px solid ${C.border}`,
                borderRadius: 8, padding: "8px 16px", cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = C.accent;
                e.currentTarget.style.color = C.accent;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = C.border;
                e.currentTarget.style.color = C.sub;
              }}
            >
              Start a new diagnostic
            </button>
          </div>
        </Fade>

      </div>
    </div>
  );
}
