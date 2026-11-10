// ============================================================
// FILE PATH:  recalla/src/MeetingDetail.jsx
// PURPOSE:    One meeting: summary, what was decided and assigned,
//             the full transcript and who spoke how much.
// ============================================================

import { useState, useEffect } from "react";
import {
  Clock, Users, FileText, RefreshCw, CheckCircle2, ListTodo, Search, Loader2, AudioLines,
} from "lucide-react";
import { summarizeTranscript } from "./agent_api";
import { getRefineStatus } from "./api";
import { getMeeting, updateMeeting, getExtracted, extractMeeting, getSettings } from "./data_api";
import { fmtWhen, fmtDuration, fmtClock } from "./format";
import { Screen, Tabs, EmptyState, Banner, SkeletonList } from "./ui/kit";

// Speaker colours, as class pairs so Tailwind can see them.
const SPEAKER = [
  { dot: "bg-brand", text: "text-brand", soft: "bg-brand/12" },
  { dot: "bg-ai",    text: "text-ai",    soft: "bg-ai/12" },
  { dot: "bg-info",  text: "text-info",  soft: "bg-info/12" },
  { dot: "bg-warn",  text: "text-warn",  soft: "bg-warn/12" },
];

export default function MeetingDetail({ navigate, meeting }) {
  const [tab, setTab]                 = useState("summary");
  const [summary, setSummary]         = useState(null);
  const [tasks, setTasks]             = useState([]);
  const [decisions, setDecisions]     = useState([]);
  const [extracting, setExtracting]   = useState(false);
  // A meeting shorter than a summary is shown in full instead. Say so, or the
  // Summary and Transcript tabs look identical for no visible reason.
  const [verbatim, setVerbatim]       = useState(false);
  // "Write a summary after each meeting" is a real setting; honour it for the
  // automatic pass. The Generate button always works regardless.
  const [autoSummary, setAutoSummary] = useState(true);
  const [keyPoints, setKeyPoints]     = useState([]);
  const [generating, setGenerating]   = useState(false);
  const [genError, setGenError]       = useState(null);
  const [loadError, setLoadError]     = useState(null);
  const [query, setQuery]             = useState("");

  // Live recordings are transcribed with the fast model while the meeting runs;
  // a slower, more accurate pass then re-runs server-side. Poll for it and swap
  // the transcript in when it lands.
  const [segments, setSegments]       = useState(meeting?.transcript || []);
  const [refine, setRefine]           = useState(null);
  const [full, setFull]               = useState(meeting?.transcript ? meeting : null);

  const M = full;
  const meetingId = meeting?.id;
  const hasTranscript = Boolean(meeting?.transcript);

  useEffect(() => {
    getSettings().then((s) => setAutoSummary(s.auto_summary ?? true)).catch(() => {});
  }, []);

  // The meetings list only passes an id, so fetch the rest from the database.
  useEffect(() => {
    if (!meetingId || hasTranscript) return;
    let alive = true;
    getMeeting(meetingId)
      .then((m) => {
        if (!alive) return;
        setFull({
          ...m,
          date: fmtWhen(m.started_at),
          duration: fmtDuration(m.duration_seconds),
          wordCount: m.word_count,
          fullText: m.full_text,
          aiSummary: m.summary,
          keyPoints: m.key_points || [],
          transcript: m.segments,
          tagging: m.tagging,
          sessionId: m.live_session_id,
          liveMode: m.refine_status === "running",
        });
        setSegments(m.segments || []);
        if (m.summary) { setSummary(m.summary); setKeyPoints(m.key_points || []); }
      })
      .catch((e) => alive && setLoadError(e.message));
    return () => { alive = false; };
  }, [meetingId, hasTranscript]);

  useEffect(() => {
    const sid = M?.sessionId;
    if (!sid || !M?.liveMode) return;
    let alive = true;
    let tries = 0;
    const tick = async () => {
      if (!alive || tries++ > 240) return;        // stop after ~20 min
      try {
        const r = await getRefineStatus(sid);
        if (!alive) return;
        setRefine(r.refine);
        if (r.refine?.status === "done" && r.segments?.length) {
          setSegments(r.segments);
          if (M?.id) updateMeeting(M.id, { segments: r.segments, transcript_model: "small" }).catch(() => {});
        } else if (r.refine?.status === "running" || r.refine?.status === "idle") {
          setTimeout(tick, 5000);
        }
      } catch { /* session expired or backend restarted */ }
    };
    tick();
    return () => { alive = false; };
  }, [M?.sessionId, M?.liveMode, M?.id]);

  const generateSummary = async () => {
    if (!M?.fullText) return;
    setGenerating(true);
    setGenError(null);
    try {
      const res = await summarizeTranscript(M.fullText, true);
      setSummary(res.summary);
      setKeyPoints(res.key_points || []);
      setVerbatim(Boolean(res.verbatim));
      // Store it, so reopening the meeting shows the summary instantly rather
      // than paying for the same generation again.
      if (M.id) updateMeeting(M.id, { summary: res.summary, key_points: res.key_points || [] }).catch(() => {});
    } catch (e) {
      setGenError(e.message);
    } finally {
      setGenerating(false);
    }
  };

  const runExtract = async (force = false) => {
    if (!M?.id || !M?.fullText) return;
    setExtracting(true);
    try {
      const r = force ? await extractMeeting(M.id) : await getExtracted(M.id);
      // Nothing stored yet — pay for the extraction once, then it is cached.
      if (!force && !(r.tasks?.length || r.decisions?.length)) {
        const fresh = await extractMeeting(M.id);
        setTasks(fresh.tasks || []); setDecisions(fresh.decisions || []);
      } else {
        setTasks(r.tasks || []); setDecisions(r.decisions || []);
      }
    } catch { /* the tab just stays empty */ }
    finally { setExtracting(false); }
  };

  useEffect(() => { runExtract(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [M?.id, M?.fullText]);

  // Generate the summary once the meeting has actually loaded — it arrives
  // from a fetch, so the first render has nothing to summarise.
  useEffect(() => {
    if (!M?.fullText) return;
    if (M.aiSummary) { setSummary(M.aiSummary); setKeyPoints(M.keyPoints || []); return; }
    if (!autoSummary) return;
    generateSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [M?.id, M?.fullText, autoSummary]);

  const back = () => navigate("back", "meetings");

  if (!meeting) {
    return (
      <Screen title="Meeting" onBack={back}>
        <EmptyState icon={AudioLines} tone="muted" title="No meeting selected"
          action={<button className="btn btn-secondary" onClick={() => navigate("meetings")}>See all meetings</button>} />
      </Screen>
    );
  }

  if (!M) {
    return (
      <Screen title={meeting.title || "Meeting"} onBack={back}>
        {loadError ? <Banner>Couldn't open this meeting: {loadError}</Banner> : (
          <>
            <div className="skeleton mb-4 h-10 w-2/3" />
            <SkeletonList count={3} h="h-28" />
          </>
        )}
      </Screen>
    );
  }

  // Speaker list and talk time, from the segments.
  const speakers = [...new Set((segments || []).map((s) => s.speaker || "Speaker 1"))];
  const stats = {};
  (segments || []).forEach((seg) => {
    const sp = seg.speaker || "Speaker 1";
    stats[sp] ||= { words: 0, duration: 0 };
    stats[sp].words += (seg.text || "").split(/\s+/).filter(Boolean).length;
    stats[sp].duration += Math.max(0, (seg.end || 0) - (seg.start || 0));
  });
  const totalDur = Object.values(stats).reduce((a, s) => a + s.duration, 0);
  const color = (sp) => SPEAKER[Math.max(0, speakers.indexOf(sp)) % SPEAKER.length];

  const q = query.trim().toLowerCase();
  const shown = q ? (segments || []).filter((s) => (s.text || "").toLowerCase().includes(q)) : (segments || []);

  return (
    <Screen title={M.title || "Untitled meeting"} subtitle={M.date} onBack={back}>
      {/* ── Facts ─────────────────────────────────────────────────────── */}
      <div className="mb-4 flex flex-wrap gap-2 text-[13px]">
        <Fact Icon={Clock}>{M.duration}</Fact>
        <Fact Icon={FileText}>{(M.wordCount || 0).toLocaleString()} words</Fact>
        <Fact Icon={Users}>{speakers.length} speaker{speakers.length === 1 ? "" : "s"}</Fact>
        {(M.tags || M.tagging?.auto_tags || []).slice(0, 3).map((t) => <span key={t} className="tag py-1">{t}</span>)}
      </div>

      <div className="bar sticky top-0 z-10 -mx-4 mb-5 px-2 sm:mx-0 sm:px-0">
        <Tabs value={tab} onChange={setTab} options={[
          { value: "summary", label: "Summary" },
          { value: "actions", label: "Tasks & decisions", count: tasks.length + decisions.length },
          { value: "transcript", label: "Transcript" },
          { value: "speakers", label: "Speakers" },
        ]} />
      </div>

      {/* ── Summary ───────────────────────────────────────────────────── */}
      {tab === "summary" && (
        <div className="animate-rise">
          {/* The moment of this screen: the meeting written up like minutes. */}
          <article className="card px-5 py-5 sm:px-8 sm:py-7">
            <header className="mb-4 flex items-baseline justify-between gap-3 border-b border-line pb-3">
              <span className="inline-flex items-center gap-2 text-[13px] font-medium text-muted">
                {generating && <Loader2 size={14} className="animate-spin" />}
                {generating ? "Writing the minutes…" : verbatim ? "Short meeting, shown in full" : "Minutes"}
              </span>
              <span className="font-mono text-xs text-subtle tabular-nums">{M.date} · {M.duration}</span>
            </header>

            {genError && !generating && <Banner className="mb-3">Couldn't write a summary: {genError}</Banner>}
            {generating && !summary ? (
              <div className="space-y-2.5 pt-1"><div className="skeleton h-4" /><div className="skeleton h-4 w-11/12" /><div className="skeleton h-4 w-3/4" /></div>
            ) : summary ? (
              <p className="font-serif text-[19px] leading-[1.6]">{summary}</p>
            ) : !genError && (
              <div className="py-2">
                <p className="mb-3 text-[15px] text-muted">No summary yet</p>
                <button className="btn btn-primary btn-sm" onClick={generateSummary} disabled={!M.fullText}>
                  <FileText size={16} /> Write summary
                </button>
              </div>
            )}

            {keyPoints.length > 0 && (
              <section className="mt-6">
                <h2 className="mb-3 text-[13px] font-medium text-muted">Key points</h2>
                <ol className="space-y-3">
                  {keyPoints.map((p, i) => (
                    <li key={i} className="flex gap-4">
                      <span className="w-5 shrink-0 pt-1 text-right font-mono text-[13px] text-subtle tabular-nums">{i + 1}</span>
                      <span className="font-serif text-[17px] leading-relaxed">{p}</span>
                    </li>
                  ))}
                </ol>
              </section>
            )}
          </article>

          {summary && !generating && (
            <button className="btn btn-ghost btn-sm mt-4 -ml-2" onClick={generateSummary}>
              <RefreshCw size={15} /> Rewrite summary
            </button>
          )}
        </div>
      )}

      {/* ── Tasks & decisions ─────────────────────────────────────────── */}
      {tab === "actions" && (
        <div className="space-y-7 animate-rise">
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-[15px] font-medium">
              <ListTodo size={18} className="text-ai" /> Action items
              {tasks.length > 0 && <span className="text-subtle">{tasks.length}</span>}
            </h2>
            {extracting && !tasks.length ? <SkeletonList count={2} h="h-16" /> : tasks.length === 0 ? (
              <p className="text-[15px] text-subtle">No one committed to anything in this meeting</p>
            ) : (
              <ul className="space-y-2">
                {tasks.map((t, i) => (
                  <li key={i} className="card flex gap-3 p-3.5">
                    <span className={`mt-2 size-2 shrink-0 rounded-full ${t.priority === "high" ? "bg-danger" : t.priority === "low" ? "bg-subtle" : "bg-warn"}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] leading-relaxed">{t.text}</p>
                      {(t.assignee || t.due) && (
                        <p className="mt-1 flex flex-wrap gap-x-3 text-[13px] text-subtle">
                          {t.assignee && <span>{t.assignee}</span>}
                          {t.due && <span className="text-warn">Due {t.due}</span>}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="mb-3 flex items-center gap-2 text-[15px] font-medium">
              <CheckCircle2 size={18} className="text-brand" /> Decisions
              {decisions.length > 0 && <span className="text-subtle">{decisions.length}</span>}
            </h2>
            {extracting && !decisions.length ? <SkeletonList count={2} h="h-16" /> : decisions.length === 0 ? (
              <p className="text-[15px] text-subtle">Nothing was settled in this meeting</p>
            ) : (
              <ul className="space-y-2">
                {decisions.map((d, i) => (
                  <li key={i} className="card border-l-[3px] border-l-brand p-3.5">
                    <p className="text-[15px] leading-relaxed">{d.text}</p>
                    {d.context && <p className="mt-1 text-[13px] leading-snug text-subtle">{d.context}</p>}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <button className="btn btn-ghost btn-sm -ml-2" onClick={() => runExtract(true)} disabled={extracting}>
            <RefreshCw size={15} className={extracting ? "animate-spin" : ""} /> {extracting ? "Reading the meeting…" : "Read the meeting again"}
          </button>
        </div>
      )}

      {/* ── Transcript ────────────────────────────────────────────────── */}
      {tab === "transcript" && (
        <div className="animate-rise">
          {refine && refine.status !== "idle" && (
            <Banner className="mb-4" tone={refine.status === "done" ? "success" : refine.status === "error" ? "warn" : "info"}>
              {refine.status === "running" && `Improving accuracy in the background · ${refine.progress}%`}
              {refine.status === "done" && "Transcript refined for accuracy."}
              {refine.status === "error" && "Kept the live transcript — the accuracy pass wasn't available."}
            </Banner>
          )}

          {(segments || []).length > 6 && (
            <label className="relative mb-4 block">
              <Search size={18} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-subtle" />
              <input type="search" value={query} onChange={(e) => setQuery(e.target.value)}
                     placeholder="Find in transcript" aria-label="Find in transcript" className="input pl-10" />
            </label>
          )}

          {shown.length === 0 ? (
            <p className="py-8 text-center text-[15px] text-subtle">{q ? "No line mentions that." : "No transcript for this meeting."}</p>
          ) : (
            <ol className="space-y-4">
              {shown.map((seg, i) => {
                const c = color(seg.speaker || "Speaker 1");
                return (
                  <li key={i} className="flex gap-3">
                    <span className={`grid size-8 shrink-0 place-items-center rounded-full text-xs font-medium ${c.soft} ${c.text}`}>
                      {(seg.speaker || "S").replace(/^Speaker\s*/i, "") || "S"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="mb-0.5 flex items-baseline gap-2 text-[13px]">
                        <span className={`font-medium ${c.text}`}>{seg.speaker || "Speaker 1"}</span>
                        <span className="font-mono text-xs text-subtle">{fmtClock(seg.start)}</span>
                      </div>
                      <p className="text-[15px] leading-relaxed">{seg.text}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      )}

      {/* ── Speakers ──────────────────────────────────────────────────── */}
      {tab === "speakers" && (
        <div className="space-y-2.5 animate-rise">
          <p className="mb-1 text-sm text-subtle">Who spoke, and for how much of the meeting</p>
          {speakers.map((sp) => {
            const s = stats[sp] || { words: 0, duration: 0 };
            const pct = totalDur > 0 ? Math.round((s.duration / totalDur) * 100) : 0;
            const c = color(sp);
            return (
              <div key={sp} className="card p-4">
                <div className="mb-2.5 flex items-center gap-2.5">
                  <span className={`size-2.5 rounded-full ${c.dot}`} />
                  <span className="flex-1 font-medium">{sp}</span>
                  <span className={`text-2xl font-medium tabular-nums ${c.text}`}>{pct}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface-3">
                  <div className={`h-full rounded-full ${c.dot} transition-[width] duration-700`} style={{ width: `${pct}%` }} />
                </div>
                <div className="mt-2 flex gap-4 text-[13px] text-subtle">
                  <span>{s.words.toLocaleString()} words</span>
                  <span>{fmtDuration(s.duration)} spoken</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Screen>
  );
}

function Fact({ Icon, children }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-surface-3 px-2.5 py-1 text-muted">
      <Icon size={14} /> {children}
    </span>
  );
}
