// ============================================================
// FILE PATH:  recalla/src/RecallaDashboard.jsx
// PURPOSE:    Home. Says what Recalla is for and puts its two jobs —
//             record, then ask — first, above anything to browse.
// ============================================================

import { useState, useEffect, useMemo } from "react";
import {
  Mic, Sparkles, ArrowUp, ChevronRight, AudioLines, Bell, Brain, Clock,
} from "lucide-react";
import { getAgentStatus } from "./agent_api";
import { listReminders, listMeetings, getStats } from "./data_api";
import { fmtWhen, fmtDuration, fmtRelative } from "./format";
import { useVoiceInput } from "./useVoiceInput";
import MicButton, { MicStatus } from "./MicButton";
import { Screen, SectionHeader, SkeletonList } from "./ui/kit";
import Logo from "./ui/Logo";

const PRIORITY_DOT = { high: "bg-danger", medium: "bg-warn", low: "bg-info" };

const STARTERS = [
  "What did we decide in my last meeting?",
  "What's on my calendar today?",
  "Remind me to send the report tomorrow at 10",
];

export default function RecallaDashboard({ navigate, user }) {
  const [reminders, setReminders] = useState([]);
  const [meetings, setMeetings]   = useState([]);
  const [counts, setCounts]       = useState({ meetings: 0, pending: 0, memories: 0 });
  const [status, setStatus]       = useState({ online: null, groq: false });
  const [askInput, setAskInput]   = useState("");
  const [loading, setLoading]     = useState(true);
  const [voiceError, setVoiceError] = useState(null);

  // Speaking from Home hands straight over to Ask Recalla, so "remind me to
  // call Ammad at 5" works without typing anything.
  const voice = useVoiceInput({
    onResult: (text) => { setVoiceError(null); ask(text); },
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
    return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  }, []);

  function ask(text) {
    const q = (text ?? askInput).trim();
    if (!q) return;
    localStorage.setItem("recalla_pending_question", q);
    navigate("ask");
  }

  const statusText = status.online === false ? "Can't reach Recalla's server"
    : status.online ? (status.groq ? "Ready" : "Online · AI key missing")
    : "Connecting…";
  const statusDot = status.online === false ? "bg-danger" : status.online ? (status.groq ? "bg-brand" : "bg-warn") : "bg-subtle";
  const firstRun = !loading && counts.meetings === 0;

  return (
    <Screen
      width="max-w-5xl"
      // Phones show the brand here; on wide screens the sidebar already does.
      title={<>
        <span className="brand group flex items-center gap-2.5 lg:hidden">
          <Logo size={30} /><span className="brand-name">Recalla</span>
        </span>
        <span className="hidden lg:inline">Home</span>
      </>}
      subtitle={<span className="lg:hidden">Every meeting, remembered.</span>}
    >
      {/* ── Greeting + what this is ─────────────────────────────────────── */}
      <section className="mb-5 animate-rise">
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-subtle">
          {new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2 py-0.5 text-xs font-medium">
            <span className={`size-1.5 rounded-full ${statusDot}`} />{statusText}
          </span>
        </p>
        <h2 className="mt-0.5 text-[26px] font-bold leading-tight tracking-tight sm:text-3xl">
          {greeting}, {(user?.name || "there").split(" ")[0]}
        </h2>
        <p className="mt-1.5 max-w-xl text-[15px] leading-relaxed text-muted">
          Recalla listens to your meetings, remembers what was said and decided,
          and answers when you ask.
        </p>
      </section>

      {/* ── The two jobs: record, then ask ──────────────────────────────── */}
      <div className="mb-6 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <button onClick={() => navigate("record")}
                className="card-tap group relative flex items-center gap-4 overflow-clip p-4 sm:p-5 animate-rise"
                style={{ animationDelay: "40ms" }}>
          <span className="pointer-events-none absolute -top-10 -right-10 size-40 rounded-full bg-ai/15 blur-2xl" />
          <span className="bg-rec grid size-14 shrink-0 place-items-center rounded-2xl text-white shadow-pop transition-[scale,rotate] duration-300 group-hover:scale-105 group-hover:-rotate-3">
            <Mic size={26} strokeWidth={2.2} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-lg font-semibold">Record a meeting</span>
            <span className="mt-0.5 block text-sm leading-snug text-muted">
              Transcribed as you talk, speakers labelled, summary written for you.
            </span>
          </span>
          <ChevronRight size={20} className="shrink-0 text-subtle transition-transform group-hover:translate-x-0.5" />
        </button>

        <div className="card p-4 sm:p-5 animate-rise" style={{ animationDelay: "80ms" }}>
          <div className="mb-3 flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-ai/15 text-ai"><Sparkles size={17} /></span>
            <span className="font-semibold">Ask Recalla</span>
            <span className="ml-auto text-xs text-subtle">meetings · email · calendar</span>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); ask(); }}
                className="flex items-center gap-2 rounded-xl border border-line bg-surface-3/50 p-1 pl-3.5 focus-within:border-ai">
            <input
              value={askInput}
              onChange={(e) => setAskInput(e.target.value)}
              placeholder={voice.listening ? "Listening…" : "Ask anything…"}
              disabled={voice.listening}
              enterKeyHint="send"
              aria-label="Ask Recalla a question"
              className="min-h-10 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-subtle"
            />
            <MicButton supported={voice.supported} listening={voice.listening} transcribing={voice.transcribing}
                       level={voice.level} onClick={voice.toggle} size={40} />
            <button type="submit" disabled={!askInput.trim()} aria-label="Ask"
                    className="grid size-10 shrink-0 place-items-center rounded-full bg-ai-fill text-white transition-[opacity,scale] hover:scale-105 disabled:opacity-30">
              <ArrowUp size={20} strokeWidth={2.4} />
            </button>
          </form>

          <div className="mt-2 min-h-5">
            {voiceError ? <p className="text-sm text-warn">{voiceError}</p>
              : <MicStatus listening={voice.listening} transcribing={voice.transcribing}
                           interim={voice.interim} engine={voice.engine} />}
          </div>

          <div className="no-scrollbar -mx-4 mt-1 flex gap-2 overflow-x-auto px-4 sm:-mx-5 sm:px-5">
            {STARTERS.map((s) => (
              <button key={s} onClick={() => ask(s)} className="chip text-[13px]">{s}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ── First run: how it works ─────────────────────────────────────── */}
      {firstRun && (
        <section className="card mb-6 p-4 sm:p-5 animate-rise">
          <h2 className="mb-3 font-semibold">How Recalla works</h2>
          <ol className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { Icon: Mic, tone: "bg-danger/12 text-danger", title: "1. Record",
                body: "Tap the red button when a meeting starts. Audio stays on your device." },
              { Icon: Brain, tone: "bg-brand/12 text-brand", title: "2. It remembers",
                body: "You get a transcript, a summary, and the decisions and tasks it heard." },
              { Icon: Sparkles, tone: "bg-ai/12 text-ai", title: "3. Ask later",
                body: "“What did we agree on the budget?” — or have it email and schedule for you." },
            ].map(({ Icon, tone, title, body }) => (
              <li key={title} className="flex gap-3 sm:flex-col">
                <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${tone}`}><Icon size={20} /></span>
                <span>
                  <span className="block font-medium">{title}</span>
                  <span className="block text-sm leading-snug text-muted">{body}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* ── At a glance ─────────────────────────────────────────────────── */}
      <div className="mb-7 grid grid-cols-3 gap-2.5">
        {[
          { label: "Meetings", value: counts.meetings, Icon: AudioLines, to: "meetings", tone: "text-brand" },
          { label: "To do",    value: counts.pending,  Icon: Bell,       to: "reminders", tone: "text-warn" },
          { label: "Memories", value: counts.memories, Icon: Brain,      to: "memory",    tone: "text-ai" },
        ].map((s) => (
          <button key={s.label} onClick={() => navigate(s.to)} className="card-tap p-3 sm:p-4">
            <s.Icon size={18} className={s.tone} />
            <div className="mt-2 text-2xl font-bold tabular-nums sm:text-3xl">{loading ? "–" : s.value}</div>
            <div className="text-[13px] text-muted">{s.label}</div>
          </button>
        ))}
      </div>

      {/* ── Recent + upcoming ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-7 lg:grid-cols-2">
        <section>
          <SectionHeader title="Recent meetings" action={meetings.length ? "See all" : null}
                         onAction={() => navigate("meetings")} />
          {loading ? <SkeletonList h="h-[68px]" /> : meetings.length === 0 ? (
            <Placeholder text="Your recorded meetings will appear here." />
          ) : (
            <div className="space-y-2">
              {meetings.map((m) => (
                <button key={m.id} onClick={() => navigate("detail", { id: m.id })}
                        className="card-tap flex w-full items-center gap-3 p-3.5">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand/12 text-brand">
                    <AudioLines size={19} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{m.title}</span>
                    <span className="block text-[13px] text-subtle">
                      {fmtWhen(m.started_at)} · {fmtDuration(m.duration_seconds)}
                    </span>
                  </span>
                  <ChevronRight size={18} className="shrink-0 text-subtle" />
                </button>
              ))}
            </div>
          )}
        </section>

        <section>
          <SectionHeader title="Coming up" action={reminders.length ? "See all" : null}
                         onAction={() => navigate("reminders")} />
          {loading ? <SkeletonList h="h-[68px]" /> : reminders.length === 0 ? (
            <Placeholder text="Nothing pending. Ask Recalla to remind you of something." />
          ) : (
            <div className="space-y-2">
              {reminders.map((r) => {
                const overdue = r.datetime && new Date(r.datetime) < new Date();
                return (
                  <button key={r.id} onClick={() => navigate("reminders")}
                          className="card-tap flex w-full items-center gap-3 p-3.5">
                    <span className="relative grid size-10 shrink-0 place-items-center rounded-xl bg-surface-3 text-muted">
                      <Clock size={19} />
                      <span className={`absolute top-1.5 right-1.5 size-2 rounded-full ${PRIORITY_DOT[r.priority] || "bg-info"}`} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{r.title}</span>
                      <span className={`block text-[13px] ${overdue ? "text-danger" : "text-subtle"}`}>
                        {fmtRelative(r.datetime)}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </Screen>
  );
}

function Placeholder({ text }) {
  return (
    <div className="rounded-2xl border border-dashed border-line-strong px-4 py-6 text-center text-sm text-subtle">
      {text}
    </div>
  );
}
