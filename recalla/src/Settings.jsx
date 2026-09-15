// ============================================================
// FILE PATH:  recalla/src/Settings.jsx
// PURPOSE:    Account settings, backed by the database.
//
// NOTE: This page deliberately exposes no transcription engine controls.
//       Model size, speaker diarization and "store transcript" are not
//       decisions a user should have to make — Recalla always records at
//       the best quality available, always identifies speakers, and always
//       keeps the transcript. Those are stated as facts, not toggles.
// ============================================================

import { useState, useEffect } from "react";
import { COLORS, FONTS, MOTION, GLOBAL_CSS } from "./theme";
import Sidebar from "./Sidebar";
import { useTheme } from "./useTheme";
import { getSettings, updateSettings } from "./data_api";
import { updateProfile } from "./auth_api";

const Toggle = ({ on, onChange, disabled }) => (
  <button
    onClick={() => !disabled && onChange(!on)}
    role="switch"
    aria-checked={on}
    disabled={disabled}
    style={{
      width: 40, height: 22, borderRadius: 999, border: "none",
      background: on ? COLORS.emerald : COLORS.surfaceRaised,
      cursor: disabled ? "not-allowed" : "pointer",
      position: "relative", flexShrink: 0, opacity: disabled ? 0.5 : 1,
      transition: `background-color ${MOTION.base} ease`,
    }}
  >
    <span style={{
      position: "absolute", top: 3, left: 3,
      width: 16, height: 16, borderRadius: "50%",
      background: on ? COLORS.onAccent : COLORS.textSecondary,
      transform: `translate3d(${on ? 18 : 0}px,0,0)`,
      transition: `transform ${MOTION.base} ${MOTION.spring}`,
    }}/>
  </button>
);

const Select = ({ value, onChange, options }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    style={{
      background: COLORS.surfaceRaised, color: COLORS.textPrimary,
      border: `1px solid ${COLORS.border}`, borderRadius: 8,
      padding: "7px 11px", fontFamily: FONTS.body, fontSize: 13,
      cursor: "pointer", minWidth: 150,
    }}
  >
    {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
  </select>
);

const Row = ({ label, hint, children }) => (
  <div style={{
    padding: "15px 0", borderBottom: `1px solid ${COLORS.border}`,
    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20,
  }}>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 14, color: COLORS.textPrimary, marginBottom: hint ? 4 : 0 }}>{label}</div>
      {hint && <div style={{ fontSize: 12.5, color: COLORS.textSecondary, lineHeight: 1.5 }}>{hint}</div>}
    </div>
    {children}
  </div>
);

const Section = ({ title, children }) => (
  <div style={{ marginBottom: 36 }}>
    <div style={{
      fontFamily: FONTS.heading, fontSize: 22, lineHeight: 1,
      textTransform: "uppercase", letterSpacing: "0.02em", marginBottom: 12,
      color: COLORS.textPrimary,
    }}>{title}</div>
    {children}
  </div>
);

const inputStyle = {
  background: COLORS.surfaceRaised, color: COLORS.textPrimary,
  border: `1px solid ${COLORS.border}`, borderRadius: 8,
  padding: "8px 11px", fontFamily: FONTS.body, fontSize: 13,
  outline: "none", width: 220,
};

export default function Settings({ navigate, user }) {
  const { setTheme } = useTheme();

  const [settings, setSettings] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState(null);

  const [name, setName]         = useState(user?.name || "");
  const [curPw, setCurPw]       = useState("");
  const [newPw, setNewPw]       = useState("");
  const [pwMsg, setPwMsg]       = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const s = await getSettings();
        if (!alive) return;
        setSettings(s);
        if (s.theme !== "system") setTheme(s.theme);
      } catch (e) {
        if (alive) setError(e.message);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const flashSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  };

  const update = async (key, value) => {
    setSettings((s) => ({ ...s, [key]: value }));       // optimistic
    if (key === "theme" && value !== "system") setTheme(value);
    try {
      await updateSettings({ [key]: value });
      flashSaved();
    } catch (e) {
      setError(e.message);
    }
  };

  const saveName = async () => {
    if (!name.trim() || name === user?.name) return;
    try {
      await updateProfile({ name: name.trim() });
      flashSaved();
    } catch (e) { setError(e.message); }
  };

  const changePassword = async () => {
    setPwMsg(null);
    if (!curPw || !newPw) return setPwMsg({ ok: false, text: "Fill in both password fields" });
    try {
      await updateProfile({ currentPassword: curPw, newPassword: newPw });
      setCurPw(""); setNewPw("");
      setPwMsg({ ok: true, text: "Password updated" });
    } catch (e) {
      setPwMsg({ ok: false, text: e.message });
    }
  };

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div className="themed" style={{ display: "flex", height: "100vh", width: "100vw", background: COLORS.bg }}>
        <Sidebar active="settings" navigate={navigate} user={user} />

        <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <header style={{
            padding: "18px 28px", borderBottom: `1px solid ${COLORS.border}`,
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{
              fontFamily: FONTS.heading, fontSize: 26, lineHeight: 1,
              textTransform: "uppercase", letterSpacing: "0.02em", color: COLORS.textPrimary,
            }}>Settings</div>
            <span style={{
              fontFamily: FONTS.mono, fontSize: 10, letterSpacing: "0.12em",
              textTransform: "uppercase", color: COLORS.emerald,
              opacity: saved ? 1 : 0, transition: `opacity ${MOTION.base} ease`,
            }}>Saved</span>
          </header>

          <div style={{ flex: 1, overflowY: "auto", padding: "30px 28px 60px" }}>
            <div style={{ maxWidth: 640, margin: "0 auto" }}>

              {error && (
                <div style={{
                  padding: "11px 15px", borderRadius: 10, marginBottom: 22,
                  background: COLORS.surface, border: `1px solid ${COLORS.red}`,
                  color: COLORS.red, fontSize: 13,
                }}>{error}</div>
              )}

              {/* ── Account ─────────────────────────────────────────── */}
              <Section title="Account">
                <Row label="Name">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={saveName}
                    onKeyDown={(e) => e.key === "Enter" && saveName()}
                    style={inputStyle}
                  />
                </Row>
                <Row label="Email" hint="Your sign-in address cannot be changed">
                  <span style={{ fontSize: 13, color: COLORS.textSecondary }}>{user?.email || "—"}</span>
                </Row>
                <Row label="Account type">
                  <span style={{
                    fontFamily: FONTS.mono, fontSize: 10, padding: "4px 10px", borderRadius: 999,
                    textTransform: "uppercase", letterSpacing: "0.1em",
                    background: COLORS.surfaceRaised,
                    color: user?.role === "admin" ? COLORS.red : COLORS.emerald,
                  }}>{user?.role || "user"}</span>
                </Row>
              </Section>

              {/* ── Password ────────────────────────────────────────── */}
              <Section title="Password">
                <Row label="Current password">
                  <input type="password" value={curPw} onChange={(e) => setCurPw(e.target.value)}
                         placeholder="••••••••" style={inputStyle}/>
                </Row>
                <Row label="New password" hint="At least 8 characters, with a letter and a number">
                  <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)}
                         placeholder="••••••••" style={inputStyle}/>
                </Row>
                <div style={{ paddingTop: 14, display: "flex", alignItems: "center", gap: 14 }}>
                  <button onClick={changePassword} className="press" style={{
                    background: COLORS.surfaceRaised, color: COLORS.textPrimary,
                    border: `1px solid ${COLORS.borderStrong}`, borderRadius: 999,
                    padding: "9px 18px", fontFamily: FONTS.mono, fontSize: 11,
                    textTransform: "uppercase", letterSpacing: "0.1em", cursor: "pointer",
                  }}>Change password</button>
                  {pwMsg && (
                    <span style={{ fontSize: 12.5, color: pwMsg.ok ? COLORS.emerald : COLORS.red }}>
                      {pwMsg.text}
                    </span>
                  )}
                </div>
              </Section>

              {/* ── Appearance ──────────────────────────────────────── */}
              <Section title="Appearance">
                <Row label="Theme" hint="“System” follows your computer's light or dark setting">
                  <Select
                    value={settings?.theme || "system"}
                    onChange={(v) => update("theme", v)}
                    options={[
                      { value: "system", label: "System" },
                      { value: "light",  label: "Light" },
                      { value: "dark",   label: "Dark" },
                    ]}
                  />
                </Row>
              </Section>

              {/* ── Meetings ────────────────────────────────────────── */}
              <Section title="Meetings">
                <Row label="Default meeting type" hint="Pre-selected when you start a new recording">
                  <Select
                    value={settings?.default_meeting_type || "Team Meeting"}
                    onChange={(v) => update("default_meeting_type", v)}
                    options={[
                      { value: "Team Meeting",       label: "Team Meeting" },
                      { value: "Supervisor Meeting", label: "Supervisor Meeting" },
                      { value: "Lecture",            label: "Lecture" },
                      { value: "Interview",          label: "Interview" },
                      { value: "One-on-One",         label: "One-on-One" },
                    ]}
                  />
                </Row>
                <Row label="Spoken language" hint="Detected automatically unless you pick one">
                  <Select
                    value={settings?.spoken_language || "auto"}
                    onChange={(v) => update("spoken_language", v)}
                    options={[
                      { value: "auto", label: "Detect automatically" },
                      { value: "en",   label: "English" },
                      { value: "ur",   label: "Urdu" },
                    ]}
                  />
                </Row>
                <Row label="Write a summary after each meeting"
                     hint="A short recap with the key decisions and action items">
                  <Toggle on={settings?.auto_summary ?? true} disabled={loading}
                          onChange={(v) => update("auto_summary", v)}/>
                </Row>
              </Section>

              {/* ── Notifications ───────────────────────────────────── */}
              <Section title="Notifications">
                <Row label="Remind me about upcoming items">
                  <Toggle on={settings?.notifications_enabled ?? true} disabled={loading}
                          onChange={(v) => update("notifications_enabled", v)}/>
                </Row>
                <Row label="Play a sound">
                  <Toggle on={settings?.notification_sound ?? true} disabled={loading}
                          onChange={(v) => update("notification_sound", v)}/>
                </Row>
                <Row label="How early to remind me">
                  <Select
                    value={String(settings?.reminder_lead_minutes ?? 10)}
                    onChange={(v) => update("reminder_lead_minutes", parseInt(v, 10))}
                    options={[
                      { value: "0",    label: "At the time" },
                      { value: "5",    label: "5 minutes before" },
                      { value: "10",   label: "10 minutes before" },
                      { value: "30",   label: "30 minutes before" },
                      { value: "60",   label: "1 hour before" },
                      { value: "1440", label: "1 day before" },
                    ]}
                  />
                </Row>
                <Row label="Your time zone"
                     hint="Reminder times are shown in this zone">
                  <Select
                    value={settings?.timezone_name ?? "Asia/Karachi"}
                    onChange={(v) => update("timezone_name", v)}
                    options={[
                      { value: "Asia/Karachi",     label: "Pakistan (PKT)" },
                      { value: "Asia/Dubai",       label: "Gulf (GST)" },
                      { value: "Asia/Kolkata",     label: "India (IST)" },
                      { value: "Europe/London",    label: "UK (GMT/BST)" },
                      { value: "America/New_York", label: "US Eastern" },
                      { value: "UTC",              label: "UTC" },
                    ]}
                  />
                </Row>
              </Section>

              {/* ── How Recalla records ─────────────────────────────── */}
              {/* Stated, not configurable: these always run at full quality. */}
              <Section title="How Recalla records">
                <div style={{
                  background: COLORS.surface, border: `1px solid ${COLORS.border}`,
                  borderRadius: 14, padding: "16px 18px",
                }}>
                  <div style={{ fontSize: 13, color: COLORS.textSecondary, lineHeight: 1.65, marginBottom: 14 }}>
                    Every meeting is handled the same way, at the highest quality your
                    computer supports. There is nothing to configure.
                  </div>
                  {[
                    ["Transcribed as you speak",   "Words appear live, so the transcript is ready the moment you stop."],
                    ["Speakers identified",        "Each line is labelled with who said it."],
                    ["Accuracy improved afterwards","A second, more careful pass refines the text in the background."],
                    ["Saved to your account",      "Transcripts stay private to you and are searchable later."],
                  ].map(([title, hint]) => (
                    <div key={title} style={{ display: "flex", gap: 10, marginBottom: 11 }}>
                      <span style={{ color: COLORS.emerald, fontSize: 13, lineHeight: 1.5 }}>✓</span>
                      <div>
                        <div style={{ fontSize: 13.5, color: COLORS.textPrimary }}>{title}</div>
                        <div style={{ fontSize: 12.5, color: COLORS.textTertiary, lineHeight: 1.5 }}>{hint}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>

              {/* ── Danger zone ─────────────────────────────────────── */}
              <Section title="Danger Zone">
                <div style={{
                  border: `1px solid ${COLORS.red}`, borderRadius: 14, padding: "16px 18px",
                  background: COLORS.surface,
                }}>
                  <div style={{ fontSize: 14, color: COLORS.textPrimary, marginBottom: 5 }}>Sign out</div>
                  <div style={{ fontSize: 12.5, color: COLORS.textSecondary, marginBottom: 14, lineHeight: 1.5 }}>
                    Your meetings and reminders stay saved to your account.
                  </div>
                  <button onClick={() => navigate("logout")} className="press" style={{
                    background: "transparent", color: COLORS.red,
                    border: `1px solid ${COLORS.red}`, borderRadius: 999,
                    padding: "9px 18px", fontFamily: FONTS.mono, fontSize: 11,
                    textTransform: "uppercase", letterSpacing: "0.1em", cursor: "pointer",
                  }}>Sign out</button>
                </div>
              </Section>

            </div>
          </div>
        </main>
      </div>
    </>
  );
}
