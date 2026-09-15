// ============================================================
// FILE PATH:  recalla/src/RecallaDashboard.jsx
// PURPOSE:    Home. Light/dark aware, AI-Native UI styling,
//             compositor-only motion.
// ============================================================

import { useState, useEffect, useMemo } from "react";
import { COLORS, FONTS, MOTION, GLOBAL_CSS } from "./theme";
import { useTheme } from "./useTheme";
import ThemeToggle from "./ThemeToggle";
import Sidebar from "./Sidebar";
import { getAgentStatus } from "./agent_api";
import { listReminders, listMeetings, getStats } from "./data_api";
import { fmtWhen, fmtDuration, fmtRelative } from "./format";
import { useVoiceInput } from "./useVoiceInput";
import MicButton, { MicStatus } from "./MicButton";

const PRIORITY_COLOR = { high: COLORS.red, medium: COLORS.amber, low: COLORS.cyan };

export default function RecallaDashboard({ navigate, user }) {
  const { theme, toggle } = useTheme();
  const [reminders, setReminders] = useState([]);
  const [meetings, setMeetings]   = useState([]);
  const [counts, setCounts]       = useState({ meetings: 0, pending: 0, memories: 0 });
  const [status, setStatus] = useState({ online: null, groq: false });
  const [askInput, setAskInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [voiceError, setVoiceError] = useState(null);

  // Speaking from the dashboard hands straight over to Ask Recalla, so
  // "remind me to call Ammad at 5" works without typing anything.
  const voice = useVoiceInput({
    onResult: (text) => {
      setVoiceError(null);
      localStorage.setItem("recalla_pending_question", text);
      navigate("ask");
    },
    onError: (msg) => setVoiceError(msg),
  });

  useEffect(() => {
    let alive = true;
    Promise.allSettled([listReminders("pending"), listMeetings(), getStats()])
      .then(([rem, mtg, st]) => {
        if (!alive) return;
        if (rem.status === "fulfilled") setReminders((rem.value.reminders || []).slice(0, 3));
        if (mtg.status === "fulfilled") setMeetings(mtg.value.slice(0, 3));
        if (st.status === "fulfilled") setCounts(st.value);
      })
      .finally(() => alive && setLoading(false));

    getAgentStatus()
      .then((s) => alive && setStatus({ online: true, groq: !!s.groq_configured }))
      .catch(() => alive && setStatus({ online: false, groq: false }));

    return () => { alive = false; };
  }, []);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  const handleAsk = () => {
    if (!askInput.trim()) return;
    localStorage.setItem("recalla_pending_question", askInput);
    navigate("ask");
  };

  const stats = [
    { label: "Meetings", value: counts.meetings, accent: COLORS.emerald },
    { label: "Pending",  value: counts.pending,  accent: COLORS.violet  },
    { label: "Memories", value: counts.memories, accent: COLORS.cyan    },
  ];

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <style>{`
        .dash-scroll { flex: 1; overflow-y: auto; overflow-x: hidden; }
        .dash-wrap   { max-width: 940px; margin: 0 auto; padding: 28px 44px 64px; }

        .card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
        }
        .card-i { cursor: pointer; }
        .card-i:hover { border-color: var(--border-emerald); background: var(--surface-hover); }
        .card-i.violet:hover { border-color: var(--border-violet); }

        .stat-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 28px; }
        .grid-2   { display: grid; grid-template-columns: 1.45fr 1fr; gap: 16px; margin-bottom: 28px; }
        .grid-cols{ display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

        @media (max-width: 900px) {
          .dash-wrap { padding: 24px 20px 56px; }
          .grid-2, .grid-cols { grid-template-columns: 1fr; }
          .stat-row { grid-template-columns: 1fr; }
          .hero-h1 { font-size: 44px !important; }
        }

        .ask-area::placeholder { color: var(--text-tertiary); }
        .ask-area:focus { outline: none; }

        .chip {
          font-family: ${FONTS.mono}; font-size: 9px; letter-spacing: .08em;
          text-transform: uppercase; padding: 3px 7px; border-radius: 5px;
          background: var(--surface-raised); color: var(--text-secondary);
        }
        .link-btn {
          background: none; border: none; cursor: pointer; padding: 2px 4px;
          font-family: inherit; font-size: inherit; letter-spacing: inherit;
          text-transform: inherit; border-radius: 4px;
          transition: opacity ${MOTION.fast} ease, transform ${MOTION.fast} ${MOTION.ease};
        }
        .link-btn:hover { opacity: .72; transform: translate3d(2px,0,0); }
      `}</style>

      <div className="themed mesh-bg" style={{ display: "flex", height: "100vh", width: "100vw", background: COLORS.bg }}>
        <Sidebar active="dashboard" navigate={navigate} user={user} />

        <main className="dash-scroll">
          <div className="dash-wrap">

            {/* ── Top bar ─────────────────────────────────────────────── */}
            <div className="fade-up" style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              marginBottom: 36, gap: 16,
            }}>
              <div style={{
                fontFamily: FONTS.mono, fontSize: 11, color: COLORS.textSecondary,
                textTransform: "uppercase", letterSpacing: "0.14em",
                display: "flex", alignItems: "center", gap: 9, minWidth: 0,
              }}>
                <span className="status-dot" style={{
                  background: status.online === false ? COLORS.red
                            : status.online ? COLORS.emerald : COLORS.textTertiary,
                }} />
                <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {status.online === false ? "Backend offline"
                    : status.online ? (status.groq ? "AI online" : "Online · no AI key")
                    : "Connecting…"}
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span style={{
                  fontFamily: FONTS.mono, fontSize: 11, color: COLORS.textTertiary,
                  textTransform: "uppercase", letterSpacing: "0.12em", whiteSpace: "nowrap",
                }}>
                  {new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                </span>
                <ThemeToggle theme={theme} toggle={toggle} />
              </div>
            </div>

            {/* ── Hero ────────────────────────────────────────────────── */}
            <div className="fade-up stagger-1" style={{ marginBottom: 32 }}>
              <h1 className="hero-h1" style={{
                fontFamily: FONTS.heading, fontSize: 64, lineHeight: 0.98,
                textTransform: "uppercase", letterSpacing: "0.005em",
                color: COLORS.textPrimary, margin: 0,
              }}>
                {greeting},<br />
                <span style={{
                  backgroundImage: `linear-gradient(120deg, ${COLORS.emerald}, ${COLORS.cyan} 55%, ${COLORS.violet})`,
                  WebkitBackgroundClip: "text", backgroundClip: "text",
                  WebkitTextFillColor: "transparent", color: "transparent",
                }}>{(user?.name || "there").split(" ")[0]}</span>
              </h1>
              <p style={{
                marginTop: 12, fontSize: 15, color: COLORS.textSecondary, maxWidth: 460, lineHeight: 1.55,
              }}>
                Everything from your meetings, remembered and searchable.
              </p>
            </div>

            {/* ── Stats ───────────────────────────────────────────────── */}
            <div className="stat-row fade-up stagger-2">
              {stats.map((s) => (
                <div key={s.label} className="card lift" style={{ padding: "16px 18px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <span style={{ width: 7, height: 7, borderRadius: 2, background: s.accent, flexShrink: 0 }} />
                    <span style={{
                      fontFamily: FONTS.mono, fontSize: 10, letterSpacing: "0.12em",
                      textTransform: "uppercase", color: COLORS.textSecondary,
                    }}>{s.label}</span>
                  </div>
                  <div style={{
                    fontFamily: FONTS.heading, fontSize: 34, lineHeight: 1,
                    color: COLORS.textPrimary,
                  }}>
                    {loading ? "—" : s.value}
                  </div>
                </div>
              ))}
            </div>

            {/* ── Record + Ask ────────────────────────────────────────── */}
            <div className="grid-2 fade-up stagger-3">
              <button
                onClick={() => navigate("record")}
                className="card card-i corners lift"
                style={{
                  padding: "30px 28px", textAlign: "left",
                  fontFamily: FONTS.body, color: COLORS.textPrimary,
                }}
              >
                <div style={{
                  display: "flex", alignItems: "center", gap: 9, marginBottom: 18,
                  fontFamily: FONTS.mono, fontSize: 10, color: COLORS.emerald,
                  textTransform: "uppercase", letterSpacing: "0.12em",
                }}>
                  <span className="status-dot" style={{ background: COLORS.emerald }} />
                  Primary Action
                </div>
                <div style={{
                  fontFamily: FONTS.heading, fontSize: 42, lineHeight: 1,
                  textTransform: "uppercase", letterSpacing: "0.01em",
                  color: COLORS.textPrimary,
                }}>
                  Record<br />Meeting
                </div>
                <div style={{ fontSize: 13.5, color: COLORS.textSecondary, marginTop: 14, lineHeight: 1.5 }}>
                  Capture audio → transcript, speakers, and an AI summary.
                </div>
              </button>

              <div className="card corners corners-violet" style={{
                padding: "26px 24px", display: "flex", flexDirection: "column",
                borderColor: COLORS.borderViolet,
              }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 9, marginBottom: 14,
                  fontFamily: FONTS.mono, fontSize: 10, color: COLORS.violet,
                  textTransform: "uppercase", letterSpacing: "0.12em",
                }}>
                  <span className="status-dot" style={{ background: COLORS.violet }} />
                  <span>Ask Recalla</span>
                  <span style={{ marginLeft: "auto" }}>
                    <MicButton
                      supported={voice.supported}
                      listening={voice.listening}
                      transcribing={voice.transcribing}
                      level={voice.level}
                      onClick={voice.toggle}
                      size={32}
                    />
                  </span>
                </div>

                <textarea
                  className="ask-area"
                  value={askInput}
                  onChange={(e) => setAskInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAsk(); }
                  }}
                  placeholder={voice.listening ? "Listening…" : "What did we decide about the database?"}
                  disabled={voice.listening}
                  style={{
                    width: "100%", flex: 1, minHeight: 84, marginBottom: 14,
                    background: "transparent", border: "none",
                    color: COLORS.textPrimary, fontFamily: FONTS.body,
                    fontSize: 14.5, lineHeight: 1.55, resize: "none",
                  }}
                />

                <button
                  onClick={handleAsk}
                  disabled={!askInput.trim()}
                  className="press"
                  style={{
                    background: askInput.trim()
                      ? `linear-gradient(120deg, ${COLORS.violet}, ${COLORS.cyan})`
                      : COLORS.surfaceRaised,
                    color: askInput.trim() ? COLORS.onAccent : COLORS.textTertiary,
                    border: "none", padding: "9px 18px",
                    fontFamily: FONTS.mono, fontSize: 11, fontWeight: 600,
                    textTransform: "uppercase", letterSpacing: "0.1em",
                    cursor: askInput.trim() ? "pointer" : "not-allowed",
                    borderRadius: 999, alignSelf: "flex-start",
                    transition: `background ${MOTION.base} ease, color ${MOTION.base} ease`,
                  }}
                >
                  Ask →
                </button>

                <div style={{ minHeight: 16, marginTop: 9 }}>
                  {voiceError ? (
                    <span style={{ fontSize: 12, color: COLORS.amber, lineHeight: 1.4 }}>{voiceError}</span>
                  ) : (voice.listening || voice.transcribing) ? (
                    <MicStatus listening={voice.listening} transcribing={voice.transcribing}
                               interim={voice.interim} engine={voice.engine} />
                  ) : voice.supported ? (
                    <span style={{
                      fontFamily: FONTS.mono, fontSize: 9.5, color: COLORS.textTertiary,
                      textTransform: "uppercase", letterSpacing: "0.1em",
                    }}>
                      Or tap the mic and speak
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            {/* ── Meetings + Reminders ────────────────────────────────── */}
            <div className="grid-cols fade-up stagger-4">

              <section>
                <SectionHead title="Recent Meetings" accent={COLORS.emerald}
                             onClick={() => navigate("meetings")} />
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {loading ? (
                    [0, 1, 2].map((i) => (
                      <div key={i} className="skeleton" style={{ height: 58, borderRadius: 16 }} />
                    ))
                  ) : meetings.length === 0 ? (
                    <div style={{
                      padding: "22px 16px", textAlign: "center", borderRadius: 16,
                      background: COLORS.surface, border: `1px dashed ${COLORS.borderStrong}`,
                      fontSize: 13, color: COLORS.textTertiary, lineHeight: 1.6,
                    }}>
                      No meetings yet.<br />Record one and it will appear here.
                    </div>
                  ) : (
                    meetings.map((m) => (
                      <div key={m.id} className="card card-i lift"
                           onClick={() => navigate("detail", { id: m.id })}
                           style={{ padding: "13px 16px" }}>
                        <div style={{
                          display: "flex", justifyContent: "space-between",
                          alignItems: "flex-start", gap: 10, marginBottom: 6,
                        }}>
                          <span style={{ fontSize: 14, fontWeight: 500, color: COLORS.textPrimary }}>
                            {m.title}
                          </span>
                          {m.tags?.[0] && <span className="chip">{m.tags[0]}</span>}
                        </div>
                        <div style={{
                          fontFamily: FONTS.mono, fontSize: 10, color: COLORS.textTertiary,
                          textTransform: "uppercase", letterSpacing: "0.08em",
                        }}>
                          {fmtWhen(m.started_at)} · {fmtDuration(m.duration_seconds)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section>
                <SectionHead title="Pending Reminders" accent={COLORS.violet}
                             onClick={() => navigate("reminders")} />
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {loading ? (
                    [0, 1, 2].map((i) => (
                      <div key={i} className="skeleton" style={{ height: 58, borderRadius: 16 }} />
                    ))
                  ) : reminders.length === 0 ? (
                    <div style={{
                      padding: "22px 16px", textAlign: "center", borderRadius: 16,
                      background: COLORS.surface, border: `1px dashed ${COLORS.borderStrong}`,
                      fontSize: 13, color: COLORS.textTertiary,
                    }}>
                      Nothing pending — you're clear.
                    </div>
                  ) : (
                    reminders.map((r) => (
                      <div key={r.id} className="card card-i violet lift"
                           onClick={() => navigate("reminders")}
                           style={{ padding: "13px 16px", display: "flex", gap: 11, alignItems: "flex-start" }}>
                        <span style={{
                          width: 6, height: 6, borderRadius: "50%", marginTop: 6, flexShrink: 0,
                          background: PRIORITY_COLOR[r.priority] || COLORS.cyan,
                        }} />
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{
                            fontSize: 14, fontWeight: 500, marginBottom: 5, color: COLORS.textPrimary,
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          }}>
                            {r.title}
                          </div>
                          <div style={{
                            fontFamily: FONTS.mono, fontSize: 10, color: COLORS.textTertiary,
                            textTransform: "uppercase", letterSpacing: "0.08em",
                          }}>
                            {fmtRelative(r.datetime)}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>

            </div>
          </div>
        </main>
      </div>
    </>
  );
}

function SectionHead({ title, accent, onClick }) {
  return (
    <div style={{
      fontFamily: FONTS.mono, fontSize: 10, color: COLORS.textSecondary,
      textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 11,
      display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <span>{title}</span>
      <button className="link-btn" onClick={onClick} style={{ color: accent }}>
        View All →
      </button>
    </div>
  );
}

