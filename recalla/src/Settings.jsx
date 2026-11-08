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
import { Monitor, Sun, Moon, Check, LogOut, ShieldCheck } from "lucide-react";
import { useTheme } from "./useTheme";
import { getSettings, updateSettings } from "./data_api";
import { updateProfile } from "./auth_api";
import { Screen, Banner, Toggle, Avatar } from "./ui/kit";

/** A grouped list, like a phone's own settings. */
const Group = ({ title, footer, children }) => (
  <section className="mb-7">
    <h2 className="eyebrow mb-2 px-1">{title}</h2>
    <div className="card divide-y divide-line">{children}</div>
    {footer && <p className="mt-2 px-1 text-[13px] leading-relaxed text-subtle">{footer}</p>}
  </section>
);

/** Label on the left, control on the right; wide controls drop below on a phone. */
const Row = ({ label, hint, children, stack = false, htmlFor }) => (
  <div className={`flex gap-3 px-4 py-3.5 ${stack ? "flex-col sm:flex-row sm:items-center" : "items-center"}`}>
    <div className="min-w-0 flex-1">
      <label htmlFor={htmlFor} className="block text-[15px] font-medium">{label}</label>
      {hint && <p className="mt-0.5 text-[13px] leading-snug text-subtle">{hint}</p>}
    </div>
    <div className={stack ? "w-full sm:w-56" : "shrink-0"}>{children}</div>
  </div>
);

const Select = ({ id, value, onChange, options }) => (
  <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className="input pr-8">
    {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
  </select>
);

export default function Settings({ navigate, user }) {
  const { setTheme, followSystem } = useTheme();

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
    getSettings()
      .then((s) => {
        if (!alive) return;
        setSettings(s);
        if (s.theme !== "system") setTheme(s.theme);
      })
      .catch((e) => alive && setError(e.message))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const flashSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  };

  const update = async (key, value) => {
    setSettings((s) => ({ ...s, [key]: value }));       // optimistic
    if (key === "theme") value === "system" ? followSystem() : setTheme(value);
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

  const changePassword = async (e) => {
    e.preventDefault();
    setPwMsg(null);
    if (!curPw || !newPw) return setPwMsg({ ok: false, text: "Fill in both password fields." });
    try {
      await updateProfile({ currentPassword: curPw, newPassword: newPw });
      setCurPw(""); setNewPw("");
      setPwMsg({ ok: true, text: "Password updated." });
    } catch (err) {
      setPwMsg({ ok: false, text: err.message });
    }
  };

  const theme = settings?.theme || "system";

  return (
    <Screen
      title="Settings"
      width="max-w-2xl"
      actions={
        <span aria-live="polite" className={`inline-flex items-center gap-1 pr-2 text-sm font-medium text-brand transition-opacity ${saved ? "opacity-100" : "opacity-0"}`}>
          <Check size={16} /> Saved
        </span>
      }
    >
      {error && <Banner className="mb-5" onClose={() => setError(null)}>{error}</Banner>}

      {/* ── Profile card ──────────────────────────────────────────────── */}
      <div className="card mb-7 flex items-center gap-3.5 p-4">
        <Avatar name={name || user?.name} size={52} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-lg font-semibold">{name || user?.name}</div>
          <div className="truncate text-sm text-subtle">{user?.email}</div>
        </div>
        {user?.role === "admin" && (
          <span className="inline-flex items-center gap-1 rounded-full bg-danger/12 px-2.5 py-1 text-xs font-semibold text-danger">
            <ShieldCheck size={13} /> Admin
          </span>
        )}
      </div>

      <Group title="Account" footer="Your sign-in email can't be changed.">
        <Row label="Name" htmlFor="s-name" stack>
          <input id="s-name" className="input" value={name} onChange={(e) => setName(e.target.value)}
                 onBlur={saveName} onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()} autoComplete="name" />
        </Row>
      </Group>

      <Group title="Appearance">
        <div className="px-4 py-3.5">
          <div className="mb-2.5 text-[15px] font-medium">Theme</div>
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Theme">
            {[
              { value: "system", label: "System", Icon: Monitor },
              { value: "light",  label: "Light",  Icon: Sun },
              { value: "dark",   label: "Dark",   Icon: Moon },
            ].map(({ value, label, Icon }) => (
              <button key={value} role="radio" aria-checked={theme === value} onClick={() => update("theme", value)}
                      className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl border text-sm font-medium transition-colors
                        ${theme === value ? "border-brand bg-brand/10 text-brand" : "border-line text-muted hover:bg-surface-2"}`}>
                <Icon size={20} /> {label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[13px] text-subtle">System follows your phone's light or dark setting.</p>
        </div>
      </Group>

      <Group title="Meetings">
        <Row label="Usual kind of meeting" hint="Pre-selected when you start recording" htmlFor="s-type" stack>
          <Select id="s-type" value={settings?.default_meeting_type || "Team Meeting"}
                  onChange={(v) => update("default_meeting_type", v)}
                  options={["Team Meeting", "Supervisor Meeting", "Lecture", "Interview", "One-on-One"].map((v) => ({ value: v, label: v }))} />
        </Row>
        <Row label="Spoken language" hint="Detected automatically unless you pick one" htmlFor="s-lang" stack>
          <Select id="s-lang" value={settings?.spoken_language || "auto"} onChange={(v) => update("spoken_language", v)}
                  options={[{ value: "auto", label: "Detect automatically" }, { value: "en", label: "English" }, { value: "ur", label: "Urdu" }]} />
        </Row>
        <Row label="Summary after each meeting" hint="A short recap with the decisions and action items">
          <Toggle label="Summary after each meeting" on={settings?.auto_summary ?? true} disabled={loading}
                  onChange={(v) => update("auto_summary", v)} />
        </Row>
      </Group>

      <Group title="Notifications">
        <Row label="Remind me about upcoming items">
          <Toggle label="Reminders" on={settings?.notifications_enabled ?? true} disabled={loading}
                  onChange={(v) => update("notifications_enabled", v)} />
        </Row>
        <Row label="Play a sound">
          <Toggle label="Sound" on={settings?.notification_sound ?? true} disabled={loading}
                  onChange={(v) => update("notification_sound", v)} />
        </Row>
        <Row label="How early" htmlFor="s-lead" stack>
          <Select id="s-lead" value={String(settings?.reminder_lead_minutes ?? 10)}
                  onChange={(v) => update("reminder_lead_minutes", parseInt(v, 10))}
                  options={[
                    { value: "0", label: "At the time" }, { value: "5", label: "5 minutes before" },
                    { value: "10", label: "10 minutes before" }, { value: "30", label: "30 minutes before" },
                    { value: "60", label: "1 hour before" }, { value: "1440", label: "1 day before" },
                  ]} />
        </Row>
        <Row label="Time zone" hint="Reminder times are shown in this zone" htmlFor="s-tz" stack>
          <Select id="s-tz" value={settings?.timezone_name ?? "Asia/Karachi"} onChange={(v) => update("timezone_name", v)}
                  options={[
                    { value: "Asia/Karachi", label: "Pakistan (PKT)" }, { value: "Asia/Dubai", label: "Gulf (GST)" },
                    { value: "Asia/Kolkata", label: "India (IST)" }, { value: "Europe/London", label: "UK (GMT/BST)" },
                    { value: "America/New_York", label: "US Eastern" }, { value: "UTC", label: "UTC" },
                  ]} />
        </Row>
      </Group>

      {/* Stated, not configurable: these always run at full quality. */}
      <Group title="How Recalla records" footer="Every meeting is handled the same way — there's nothing to configure.">
        {[
          ["Transcribed as you speak", "Words appear live, so the transcript is ready the moment you stop."],
          ["Speakers identified", "Each line is labelled with who said it."],
          ["Audio stays on your device", "Only the text is sent to your account."],
          ["Private and searchable", "Transcripts are yours alone, and Recalla can answer questions about them."],
        ].map(([title, hint]) => (
          <div key={title} className="flex gap-3 px-4 py-3">
            <Check size={18} className="mt-0.5 shrink-0 text-brand" />
            <div>
              <div className="text-[15px] font-medium">{title}</div>
              <div className="text-[13px] leading-snug text-subtle">{hint}</div>
            </div>
          </div>
        ))}
      </Group>

      <Group title="Password">
        <form onSubmit={changePassword} className="space-y-3 p-4">
          <div>
            <label className="label" htmlFor="s-cur">Current password</label>
            <input id="s-cur" type="password" className="input" value={curPw} onChange={(e) => setCurPw(e.target.value)}
                   autoComplete="current-password" />
          </div>
          <div>
            <label className="label" htmlFor="s-new">New password</label>
            <input id="s-new" type="password" className="input" value={newPw} onChange={(e) => setNewPw(e.target.value)}
                   autoComplete="new-password" aria-describedby="s-new-hint" />
            <p id="s-new-hint" className="mt-1 text-[13px] text-subtle">At least 8 characters, with a letter and a number.</p>
          </div>
          {pwMsg && <Banner tone={pwMsg.ok ? "success" : "error"}>{pwMsg.text}</Banner>}
          <button type="submit" className="btn btn-secondary w-full sm:w-auto">Change password</button>
        </form>
      </Group>

      <button onClick={() => navigate("logout")} className="btn btn-secondary mb-4 w-full text-danger">
        <LogOut size={18} /> Sign out
      </button>
      <p className="text-center text-[13px] text-subtle">Your meetings and reminders stay saved to your account.</p>
    </Screen>
  );
}
