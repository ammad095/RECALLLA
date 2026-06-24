// ============================================================
// FILE PATH:  recalla/src/RecallaDashboard.jsx
// PURPOSE:    Minimal home. Quick actions + recent meetings + reminders.
// ============================================================

import { useState, useEffect } from "react";
import { COLORS, FONTS, GLOBAL_CSS } from "./theme";
import Sidebar from "./Sidebar";
import { listReminders } from "./agent_api";

const RECENT_MEETINGS = [
  { id: 1, title: "Backend Architecture Sync", date: "Yesterday · 4:00 PM", duration: "32m" },
  { id: 2, title: "Frontend Design Review",    date: "Mon · 3:25 PM",      duration: "45m" },
  { id: 3, title: "Supervisor FYP Check-in",   date: "Last Tue · 11:00 AM", duration: "20m" },
];

export default function RecallaDashboard({ navigate }) {
  const [reminders, setReminders] = useState([]);
  const [askInput, setAskInput] = useState("");

  useEffect(() => {
    listReminders("pending")
      .then(r => setReminders((r.reminders || []).slice(0, 3)))
      .catch(() => {});
  }, []);

  const handleAsk = () => {
    if (askInput.trim()) {
      localStorage.setItem("recalla_pending_question", askInput);
      navigate("ask");
    }
  };

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div style={{ display: "flex", height: "100vh", width: "100vw", background: COLORS.bg }}>
        <Sidebar active="dashboard" navigate={navigate}/>

        <main style={{ flex: 1, overflowY: "auto", padding: "48px 56px" }}>
          <div style={{ maxWidth: 880, margin: "0 auto" }}>

            {/* Hero greeting */}
            <div className="fade-up" style={{ marginBottom: 48 }}>
              <div style={{
                fontFamily: FONTS.mono, fontSize: 11, color: COLORS.textSecondary,
                textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 12,
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <span className="status-dot" style={{ background: COLORS.emerald }}/>
                {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
              </div>
              <h1 style={{
                fontFamily: FONTS.heading, fontSize: 72, lineHeight: 0.95,
                textTransform: "uppercase", letterSpacing: "0.005em", margin: 0,
              }}>
                Welcome back,<br/>
                <span style={{
                  background: `linear-gradient(135deg, ${COLORS.emerald}, ${COLORS.cyan})`,
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                }}>Ammad</span>
              </h1>
            </div>

            {/* Primary actions */}
            <div className="fade-up" style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16, marginBottom: 48 }}>
              {/* Record */}
              <button
                onClick={() => navigate("record")}
                className="corners"
                style={{
                  background: COLORS.surface, border: `1px solid ${COLORS.border}`,
                  padding: "32px 28px", textAlign: "left", cursor: "pointer",
                  fontFamily: FONTS.body, color: COLORS.textPrimary,
                  transition: "all 0.25s",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = COLORS.borderEmerald; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = COLORS.border; }}
              >
                <div style={{
                  display: "flex", alignItems: "center", gap: 10, marginBottom: 16,
                  fontFamily: FONTS.mono, fontSize: 10, color: COLORS.emerald,
                  textTransform: "uppercase", letterSpacing: "0.1em",
                }}>
                  <span className="status-dot" style={{ background: COLORS.emerald }}/>
                  Primary Action
                </div>
                <div style={{
                  fontFamily: FONTS.heading, fontSize: 44, lineHeight: 1,
                  textTransform: "uppercase", letterSpacing: "0.01em", marginBottom: 8,
                }}>
                  Record<br/>Meeting
                </div>
                <div style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 12 }}>
                  Capture audio, get transcript + AI summary
                </div>
              </button>

              {/* Ask */}
              <div className="corners corners-violet" style={{
                background: COLORS.surface, border: `1px solid ${COLORS.borderViolet}`,
                padding: "28px 24px", display: "flex", flexDirection: "column",
              }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 10, marginBottom: 16,
                  fontFamily: FONTS.mono, fontSize: 10, color: COLORS.violet,
                  textTransform: "uppercase", letterSpacing: "0.1em",
                }}>
                  <span className="status-dot" style={{ background: COLORS.violet }}/>
                  Ask Recalla
                </div>
                <div style={{ flex: 1, marginBottom: 16 }}>
                  <textarea
                    value={askInput}
                    onChange={e => setAskInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAsk(); } }}
                    placeholder="What do you want to remember?"
                    style={{
                      width: "100%", minHeight: 80,
                      background: "transparent", border: "none", outline: "none",
                      color: COLORS.textPrimary, fontFamily: FONTS.body,
                      fontSize: 15, lineHeight: 1.5, resize: "none",
                    }}
                  />
                </div>
                <button
                  onClick={handleAsk}
                  disabled={!askInput.trim()}
                  style={{
                    background: askInput.trim()
                      ? `linear-gradient(135deg, ${COLORS.violet}, ${COLORS.cyan})`
                      : COLORS.surfaceRaised,
                    color: askInput.trim() ? COLORS.bg : COLORS.textTertiary,
                    border: "none", padding: "9px 18px",
                    fontFamily: FONTS.mono, fontSize: 11, fontWeight: 600,
                    textTransform: "uppercase", letterSpacing: "0.1em",
                    cursor: askInput.trim() ? "pointer" : "not-allowed",
                    borderRadius: 999, alignSelf: "flex-start",
                  }}
                >
                  Ask →
                </button>
              </div>
            </div>

            {/* Two columns: meetings + reminders */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>

              {/* Recent Meetings */}
              <div className="fade-up">
                <div style={{
                  fontFamily: FONTS.mono, fontSize: 10, color: COLORS.textSecondary,
                  textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12,
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  <span>Recent Meetings</span>
                  <button
                    onClick={() => navigate("meetings")}
                    style={{
                      background: "none", border: "none", color: COLORS.emerald,
                      fontFamily: "inherit", fontSize: "inherit", textTransform: "inherit",
                      letterSpacing: "inherit", cursor: "pointer",
                    }}
                  >
                    View All →
                  </button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {RECENT_MEETINGS.map(m => (
                    <div key={m.id} className="corners" style={{
                      background: COLORS.surface, border: `1px solid ${COLORS.border}`,
                      padding: "12px 16px", cursor: "pointer", transition: "all 0.2s",
                    }}
                    onClick={() => navigate("meetings")}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = COLORS.borderEmerald; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = COLORS.border; }}
                    >
                      <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{m.title}</div>
                      <div style={{
                        fontFamily: FONTS.mono, fontSize: 10,
                        color: COLORS.textSecondary, textTransform: "uppercase",
                        letterSpacing: "0.08em",
                      }}>
                        {m.date} · {m.duration}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pending Reminders */}
              <div className="fade-up">
                <div style={{
                  fontFamily: FONTS.mono, fontSize: 10, color: COLORS.textSecondary,
                  textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12,
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  <span>Pending Reminders</span>
                  <button
                    onClick={() => navigate("reminders")}
                    style={{
                      background: "none", border: "none", color: COLORS.violet,
                      fontFamily: "inherit", fontSize: "inherit", textTransform: "inherit",
                      letterSpacing: "inherit", cursor: "pointer",
                    }}
                  >
                    View All →
                  </button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {reminders.length === 0 ? (
                    <div style={{
                      padding: "20px 16px", textAlign: "center",
                      background: COLORS.surface, border: `1px dashed ${COLORS.border}`,
                      fontSize: 12, color: COLORS.textTertiary,
                    }}>
                      No pending reminders
                    </div>
                  ) : reminders.map(r => (
                    <div key={r.id} className="corners corners-violet" style={{
                      background: COLORS.surface, border: `1px solid ${COLORS.border}`,
                      padding: "12px 16px",
                    }}>
                      <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{r.title}</div>
                      <div style={{
                        fontFamily: FONTS.mono, fontSize: 10,
                        color: COLORS.textSecondary, textTransform: "uppercase",
                        letterSpacing: "0.08em",
                      }}>
                        {new Date(r.datetime).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        </main>
      </div>
    </>
  );
}