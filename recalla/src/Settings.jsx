// ============================================================
// FILE PATH:  recalla/src/Settings.jsx
// PURPOSE:    Flat settings page. All sections inline, no left nav.
// ============================================================

import { useState } from "react";
import { COLORS, FONTS, GLOBAL_CSS } from "./theme";
import Sidebar from "./Sidebar";

// ── Reusable toggle ─────────────────────────────────────────────────────
const Toggle = ({ on, onChange }) => (
  <button
    onClick={() => onChange(!on)}
    style={{
      width: 36, height: 20, borderRadius: 999, border: "none",
      background: on ? COLORS.emerald : COLORS.surfaceRaised,
      cursor: "pointer", position: "relative", transition: "background 0.2s",
      flexShrink: 0,
    }}
  >
    <span style={{
      position: "absolute", top: 2, left: on ? 18 : 2,
      width: 16, height: 16, borderRadius: "50%",
      background: on ? COLORS.bg : COLORS.textSecondary,
      transition: "left 0.2s",
    }}/>
  </button>
);

const Row = ({ label, hint, children }) => (
  <div style={{
    padding: "16px 0", borderBottom: `1px solid ${COLORS.border}`,
    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20,
  }}>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 14, color: COLORS.textPrimary, marginBottom: hint ? 4 : 0 }}>{label}</div>
      {hint && (
        <div style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.textSecondary }}>{hint}</div>
      )}
    </div>
    {children}
  </div>
);

const Section = ({ title, children }) => (
  <div style={{ marginBottom: 40 }}>
    <div style={{
      fontFamily: FONTS.heading, fontSize: 24, lineHeight: 1,
      textTransform: "uppercase", letterSpacing: "0.02em", marginBottom: 14,
    }}>
      {title}
    </div>
    {children}
  </div>
);

export default function Settings({ navigate }) {
  const [settings, setSettings] = useState({
    autoTranscribe:    true,
    speakerDiarization: true,
    autoSummary:       true,
    storeRecordings:   false,
    notifications:     true,
    sound:             false,
    language:          "English",
    quality:           "high",
  });

  const update = (key, val) => setSettings(s => ({ ...s, [key]: val }));

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div style={{ display: "flex", height: "100vh", width: "100vw", background: COLORS.bg }}>
        <Sidebar active="settings" navigate={navigate}/>

        <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <header style={{
            padding: "18px 28px", borderBottom: `1px solid ${COLORS.border}`,
          }}>
            <div style={{ fontFamily: FONTS.heading, fontSize: 26, lineHeight: 1, textTransform: "uppercase", letterSpacing: "0.02em" }}>
              Settings
            </div>
          </header>

          <div style={{ flex: 1, overflowY: "auto", padding: "32px 28px" }}>
            <div style={{ maxWidth: 640, margin: "0 auto" }}>

              {/* PROFILE */}
              <Section title="Profile">
                <div className="corners" style={{
                  background: COLORS.surface, border: `1px solid ${COLORS.border}`,
                  padding: 20, display: "flex", alignItems: "center", gap: 16,
                }}>
                  <div style={{
                    width: 56, height: 56,
                    background: `linear-gradient(135deg, ${COLORS.violet}, ${COLORS.emerald})`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: FONTS.heading, fontSize: 22, color: COLORS.bg,
                  }}>
                    AA
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 2 }}>Ammad Ahmad</div>
                    <div style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.textSecondary }}>
                      ammad@riphah.edu.pk · BSCS-FYP
                    </div>
                  </div>
                  <button style={{
                    background: "transparent", border: `1px solid ${COLORS.border}`,
                    color: COLORS.textSecondary, padding: "6px 14px",
                    fontFamily: FONTS.mono, fontSize: 11,
                    textTransform: "uppercase", letterSpacing: "0.1em",
                    cursor: "pointer", borderRadius: 999,
                  }}>
                    Edit
                  </button>
                </div>
              </Section>

              {/* RECORDING */}
              <Section title="Recording">
                <Row label="Auto-transcribe recordings" hint="Process audio immediately after recording">
                  <Toggle on={settings.autoTranscribe} onChange={v => update("autoTranscribe", v)}/>
                </Row>
                <Row label="Speaker diarization" hint="Identify and label different speakers automatically">
                  <Toggle on={settings.speakerDiarization} onChange={v => update("speakerDiarization", v)}/>
                </Row>
                <Row label="Auto-generate AI summary" hint="Use Groq to summarize after transcription">
                  <Toggle on={settings.autoSummary} onChange={v => update("autoSummary", v)}/>
                </Row>
                <Row label="Store audio files" hint="Keep original recordings after transcription">
                  <Toggle on={settings.storeRecordings} onChange={v => update("storeRecordings", v)}/>
                </Row>
                <Row label="Transcription language">
                  <select
                    value={settings.language}
                    onChange={e => update("language", e.target.value)}
                    style={{
                      background: COLORS.surfaceRaised, border: `1px solid ${COLORS.border}`,
                      color: COLORS.textPrimary, padding: "6px 12px",
                      fontFamily: FONTS.mono, fontSize: 12, outline: "none", cursor: "pointer",
                    }}
                  >
                    <option>Auto-detect</option>
                    <option>English</option>
                    <option>Urdu</option>
                    <option>Arabic</option>
                  </select>
                </Row>
                <Row label="Recording quality">
                  <div style={{ display: "flex", gap: 4 }}>
                    {["low", "medium", "high"].map(q => (
                      <button
                        key={q}
                        onClick={() => update("quality", q)}
                        style={{
                          background: settings.quality === q ? "rgba(52,211,153,0.10)" : "transparent",
                          border: `1px solid ${settings.quality === q ? COLORS.borderEmerald : COLORS.border}`,
                          color: settings.quality === q ? COLORS.emerald : COLORS.textSecondary,
                          padding: "5px 12px", fontFamily: FONTS.mono, fontSize: 10,
                          textTransform: "uppercase", letterSpacing: "0.1em",
                          cursor: "pointer", borderRadius: 999,
                        }}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </Row>
              </Section>

              {/* NOTIFICATIONS */}
              <Section title="Notifications">
                <Row label="Reminder notifications" hint="Get notified when reminders are due">
                  <Toggle on={settings.notifications} onChange={v => update("notifications", v)}/>
                </Row>
                <Row label="Notification sound" hint="Play a sound for new notifications">
                  <Toggle on={settings.sound} onChange={v => update("sound", v)}/>
                </Row>
              </Section>

              {/* INTEGRATIONS */}
              <Section title="Integrations">
                <Row label="Google Calendar" hint="Coming soon — let Recalla manage your calendar">
                  <button disabled style={{
                    background: COLORS.surfaceRaised, border: `1px solid ${COLORS.border}`,
                    color: COLORS.textTertiary, padding: "6px 14px",
                    fontFamily: FONTS.mono, fontSize: 10,
                    textTransform: "uppercase", letterSpacing: "0.1em",
                    borderRadius: 999, cursor: "not-allowed",
                  }}>
                    Soon
                  </button>
                </Row>
                <Row label="Gmail" hint="Coming soon — read and send emails through Recalla">
                  <button disabled style={{
                    background: COLORS.surfaceRaised, border: `1px solid ${COLORS.border}`,
                    color: COLORS.textTertiary, padding: "6px 14px",
                    fontFamily: FONTS.mono, fontSize: 10,
                    textTransform: "uppercase", letterSpacing: "0.1em",
                    borderRadius: 999, cursor: "not-allowed",
                  }}>
                    Soon
                  </button>
                </Row>
                <Row label="Groq API" hint="Llama 3.3 70B · Free tier (14,400 req/day)">
                  <div style={{
                    display: "flex", alignItems: "center", gap: 8,
                    fontFamily: FONTS.mono, fontSize: 11,
                    color: COLORS.emerald,
                    textTransform: "uppercase", letterSpacing: "0.1em",
                  }}>
                    <span className="status-dot" style={{ background: COLORS.emerald }}/>
                    Connected
                  </div>
                </Row>
              </Section>

              {/* DANGER */}
              <Section title="Danger Zone">
                <Row label="Clear all data" hint="Permanently delete meetings, reminders, and memories">
                  <button style={{
                    background: "transparent", border: `1px solid rgba(248,113,113,0.4)`,
                    color: COLORS.red, padding: "6px 14px",
                    fontFamily: FONTS.mono, fontSize: 11,
                    textTransform: "uppercase", letterSpacing: "0.1em",
                    cursor: "pointer", borderRadius: 999,
                  }}>
                    Clear
                  </button>
                </Row>
                <Row label="Sign out">
                  <button
                    onClick={() => navigate("login")}
                    style={{
                      background: "transparent", border: `1px solid ${COLORS.border}`,
                      color: COLORS.textSecondary, padding: "6px 14px",
                      fontFamily: FONTS.mono, fontSize: 11,
                      textTransform: "uppercase", letterSpacing: "0.1em",
                      cursor: "pointer", borderRadius: 999,
                    }}
                  >
                    Sign Out
                  </button>
                </Row>
              </Section>

              <div style={{
                fontFamily: FONTS.mono, fontSize: 10, color: COLORS.textTertiary,
                textTransform: "uppercase", letterSpacing: "0.12em",
                textAlign: "center", padding: "16px 0 40px",
              }}>
                Recalla v1.1.0 · FYP 2026 · Riphah Lahore
              </div>

            </div>
          </div>
        </main>
      </div>
    </>
  );
}