// ============================================================
// FILE PATH:  recalla/src/MeetingDetail.jsx
// PURPOSE:    Single-meeting view. Auto-generates AI summary on load.
//             Real summary from Groq, simple tab switcher.
// ============================================================

import { useState, useEffect } from "react";
import { COLORS, FONTS, GLOBAL_CSS } from "./theme";
import Sidebar from "./Sidebar";
import { summarizeTranscript } from "./agent_api";
import { getRefineStatus } from "./api";
import { getMeeting, updateMeeting, getExtracted, extractMeeting, getSettings } from "./data_api";
import { fmtWhen, fmtDuration } from "./format";

const SPEAKER_COLORS = [COLORS.emerald, COLORS.violet, COLORS.cyan, COLORS.amber];

const fmtTime = (sec) => {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m.toString().padStart(2,"0")}:${s.toString().padStart(2,"0")}`;
};

export default function MeetingDetail({ navigate, meeting , user }) {
  const [tab, setTab]                 = useState("summary");
  const [summary, setSummary]         = useState(null);
  const [tasks, setTasks]             = useState([]);
  const [decisions, setDecisions]     = useState([]);
  const [extracting, setExtracting]   = useState(false);
  // "Write a summary after each meeting" is a real setting; honour it for the
  // automatic pass. The Generate button always works regardless.
  const [autoSummary, setAutoSummary] = useState(true);
  useEffect(() => {
    getSettings().then(s => setAutoSummary(s.auto_summary ?? true)).catch(() => {});
  }, []);
  const [keyPoints, setKeyPoints]     = useState([]);
  const [generating, setGenerating]   = useState(false);
  const [genError, setGenError]       = useState(null);

  // Live recordings are transcribed with the fast model while the meeting runs;
  // a slower, more accurate pass then re-runs server-side. Poll for it and swap
  // the transcript in when it lands.
  const [segments, setSegments]       = useState(meeting?.transcript || []);
  const [refine, setRefine]           = useState(null);
  const [full, setFull]               = useState(meeting);

  // Prefer the freshly-loaded record; fall back to whatever was passed in.
  const M = full || meeting;

  // The meetings list only passes an id, so fetch the rest from the database.
  const meetingId = meeting?.id;
  const hasTranscript = Boolean(meeting?.transcript);

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
      .catch(() => {});
    return () => { alive = false; };
  }, [meetingId, hasTranscript]);

  useEffect(() => {
    const sid = meeting?.sessionId;
    if (!sid || !meeting?.liveMode) return;

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
          if (meeting?.id) {
            updateMeeting(meeting.id, {
              segments: r.segments, transcript_model: "small",
            }).catch(() => {});
          }
        } else if (r.refine?.status === "running" || r.refine?.status === "idle") {
          setTimeout(tick, 5000);
        }
      } catch { /* session expired or backend restarted */ }
    };

    tick();
    return () => { alive = false; };
  }, [meeting?.sessionId, meeting?.liveMode]);

  const generateSummary = async () => {
    if (!M?.fullText) return;
    setGenerating(true);
    setGenError(null);
    try {
      const res = await summarizeTranscript(M.fullText, true);
      setSummary(res.summary);
      setKeyPoints(res.key_points || []);

      // Store it, so reopening the meeting shows the summary instantly rather
      // than paying for the same generation again.
      if (M.id) {
        updateMeeting(M.id, { summary: res.summary, key_points: res.key_points || [] })
          .catch(() => {});
      }
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

  // Generate the summary once the meeting has actually loaded.
  //
  // The meeting arrives from a fetch, so on the first render M is still null
  // and there is nothing to summarise. With an empty dependency list this
  // effect bailed on that first pass and never ran again — which is why no
  // summary ever appeared. Depend on the meeting id instead.
  useEffect(() => {
    if (!M?.fullText) return;
    if (M.aiSummary) { setSummary(M.aiSummary); setKeyPoints(M.keyPoints || []); return; }
    if (!autoSummary) return;
    generateSummary();
    // autoSummary is a dependency because settings arrive from their own
    // fetch — without it, a meeting that loads first would never summarise.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [M?.id, M?.fullText, autoSummary]);


  if (!M) {
    return (
      <>
        <style>{GLOBAL_CSS}</style>
        <div style={{ display: "flex", height: "100vh", background: COLORS.bg }}>
          <Sidebar active="meetings" navigate={navigate} user={user}/>
          <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: FONTS.heading, fontSize: 38, marginBottom: 12 }}>No meeting selected</div>
              <button
                onClick={() => navigate("meetings")}
                style={{
                  background: COLORS.surface, border: `1px solid ${COLORS.border}`,
                  color: COLORS.textPrimary, padding: "10px 22px",
                  fontFamily: FONTS.mono, fontSize: 12,
                  textTransform: "uppercase", letterSpacing: "0.1em",
                  cursor: "pointer", borderRadius: 999,
                }}
              >
                Back to Meetings
              </button>
            </div>
          </main>
        </div>
      </>
    );
  }

  // Build speaker list from segments
  const speakers = [...new Set((segments || []).map(s => s.speaker || "Speaker 1"))];
  const speakerStats = {};
  (segments || []).forEach(seg => {
    const sp = seg.speaker || "Speaker 1";
    if (!speakerStats[sp]) speakerStats[sp] = { words: 0, duration: 0 };
    speakerStats[sp].words    += (seg.text || "").split(/\s+/).filter(Boolean).length;
    speakerStats[sp].duration += (seg.end - seg.start);
  });
  const totalDur = Object.values(speakerStats).reduce((a, s) => a + s.duration, 0);

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div style={{ display: "flex", height: "100vh", width: "100vw", background: COLORS.bg }}>
        <Sidebar active="meetings" navigate={navigate} user={user}/>

        <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Header */}
          <header style={{
            padding: "18px 28px", borderBottom: `1px solid ${COLORS.border}`,
            display: "flex", alignItems: "center", gap: 16,
          }}>
            <button
              onClick={() => navigate("meetings")}
              style={{
                background: "transparent", border: `1px solid ${COLORS.border}`,
                color: COLORS.textSecondary, padding: "6px 10px",
                cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
                fontFamily: FONTS.mono, fontSize: 11, borderRadius: 999,
              }}
            >
              <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
              BACK
            </button>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: FONTS.heading, fontSize: 24, lineHeight: 1.1,
                textTransform: "uppercase", letterSpacing: "0.01em",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {M.title || "Untitled Meeting"}
              </div>
              <div style={{
                fontFamily: FONTS.mono, fontSize: 10, color: COLORS.textSecondary,
                marginTop: 4, textTransform: "uppercase", letterSpacing: "0.1em",
              }}>
                {M.date} · {M.duration} · {M.wordCount} words · {speakers.length} speaker{speakers.length !== 1 ? "s" : ""}
              </div>
            </div>
          </header>

          {/* Tabs */}
          <div style={{
            padding: "0 28px", borderBottom: `1px solid ${COLORS.border}`,
            display: "flex", gap: 4,
          }}>
            {[
              { id: "summary",    label: "Summary" },
              { id: "actions",    label: "Tasks & Decisions" },
              { id: "transcript", label: "Transcript" },
              { id: "speakers",   label: "Speakers" },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  background: "transparent", border: "none",
                  color: tab === t.id ? COLORS.emerald : COLORS.textSecondary,
                  padding: "14px 18px",
                  fontFamily: FONTS.mono, fontSize: 11, fontWeight: 600,
                  textTransform: "uppercase", letterSpacing: "0.1em",
                  cursor: "pointer",
                  borderBottom: `2px solid ${tab === t.id ? COLORS.emerald : "transparent"}`,
                  transition: "all 0.2s",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflowY: "auto", padding: "28px 28px" }}>
            <div style={{ maxWidth: 760, margin: "0 auto" }}>

              {/* SUMMARY TAB */}
              {tab === "summary" && (
                <div className="fade-up">
                  <div style={{
                    fontFamily: FONTS.mono, fontSize: 10, color: COLORS.textSecondary,
                    textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10,
                    display: "flex", alignItems: "center", gap: 6,
                  }}>
                    <span className="status-dot" style={{ background: generating ? COLORS.amber : COLORS.emerald, animationDuration: generating ? "0.6s" : "2s" }}/>
                    {generating ? "Writing the summary…" : "Summary"}
                  </div>

                  <div className="corners" style={{
                    background: COLORS.surface, border: `1px solid ${COLORS.border}`,
                    padding: 24, fontSize: 15, lineHeight: 1.7, color: COLORS.textPrimary,
                    minHeight: 100,
                  }}>
                    {generating && !summary && (
                      <span style={{ color: COLORS.textSecondary, fontFamily: FONTS.mono, fontSize: 12 }}>
                        Analyzing transcript...
                      </span>
                    )}
                    {!generating && genError && (
                      <span style={{ color: COLORS.red, fontFamily: FONTS.mono, fontSize: 13 }}>
                        Failed: {genError}
                      </span>
                    )}
                    {summary}
                  </div>

                  {keyPoints.length > 0 && (
                    <>
                      <div style={{
                        fontFamily: FONTS.mono, fontSize: 10, color: COLORS.textSecondary,
                        textTransform: "uppercase", letterSpacing: "0.12em",
                        marginTop: 28, marginBottom: 10,
                      }}>
                        Key Points
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {keyPoints.map((p, i) => (
                          <div key={i} className="corners corners-violet" style={{
                            background: COLORS.surface, border: `1px solid ${COLORS.border}`,
                            padding: "12px 16px", display: "flex", alignItems: "flex-start", gap: 12,
                          }}>
                            <span style={{
                              fontFamily: FONTS.mono, fontSize: 11, color: COLORS.violet,
                              fontWeight: 600, lineHeight: 1.6,
                              minWidth: 20,
                            }}>
                              {String(i+1).padStart(2,"0")}
                            </span>
                            <span style={{ fontSize: 14, lineHeight: 1.6, color: COLORS.textPrimary, flex: 1 }}>
                              {p}
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {summary && !generating && (
                    <button
                      onClick={generateSummary}
                      style={{
                        marginTop: 18, background: "transparent",
                        border: `1px solid ${COLORS.border}`,
                        color: COLORS.textSecondary, padding: "8px 16px",
                        fontFamily: FONTS.mono, fontSize: 11,
                        textTransform: "uppercase", letterSpacing: "0.1em",
                        cursor: "pointer", borderRadius: 999,
                      }}
                    >
                      Regenerate
                    </button>
                  )}
                </div>
              )}

              {/* TRANSCRIPT TAB */}
              {/* TASKS & DECISIONS TAB */}
              {tab === "actions" && (
                <div style={{ display: "grid", gap: 22 }}>
                  <Extracted
                    title="Action items"
                    empty={extracting ? "Reading the meeting…" : "No commitments were made in this meeting."}
                    items={tasks}
                    render={(t, i) => (
                      <li key={i} style={{
                        display: "flex", gap: 11, alignItems: "flex-start",
                        padding: "11px 13px", borderRadius: 10, marginBottom: 8,
                        background: COLORS.surface, border: `1px solid ${COLORS.border}`,
                      }}>
                        <span style={{
                          width: 6, height: 6, borderRadius: 999, marginTop: 7, flexShrink: 0,
                          background: t.priority === "high" ? COLORS.red
                                    : t.priority === "low" ? COLORS.textTertiary
                                    : COLORS.amber,
                        }} />
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: 13.5, color: COLORS.textPrimary, lineHeight: 1.5 }}>
                            {t.text}
                          </div>
                          {(t.assignee || t.due) && (
                            <div style={{
                              fontFamily: FONTS.mono, fontSize: 10.5, marginTop: 4,
                              color: COLORS.textTertiary, display: "flex", gap: 12,
                            }}>
                              {t.assignee && <span>{t.assignee}</span>}
                              {t.due && <span style={{ color: COLORS.amber }}>due {t.due}</span>}
                            </div>
                          )}
                        </div>
                      </li>
                    )}
                  />

                  <Extracted
                    title="Decisions"
                    empty={extracting ? "…" : "No decisions were settled in this meeting."}
                    items={decisions}
                    render={(d, i) => (
                      <li key={i} style={{
                        padding: "11px 13px", borderRadius: 10, marginBottom: 8,
                        background: COLORS.surface,
                        border: `1px solid ${COLORS.border}`,
                        borderLeft: `2px solid ${COLORS.emerald}`,
                      }}>
                        <div style={{ fontSize: 13.5, color: COLORS.textPrimary, lineHeight: 1.5 }}>
                          {d.text}
                        </div>
                        {d.context && (
                          <div style={{ fontSize: 12, color: COLORS.textTertiary, marginTop: 4, lineHeight: 1.5 }}>
                            {d.context}
                          </div>
                        )}
                      </li>
                    )}
                  />

                  <button
                    onClick={() => runExtract(true)}
                    disabled={extracting}
                    className="press"
                    style={{
                      alignSelf: "start", background: "transparent",
                      border: `1px solid ${COLORS.border}`, color: COLORS.textSecondary,
                      padding: "7px 15px", borderRadius: 999, cursor: "pointer",
                      fontFamily: FONTS.mono, fontSize: 11,
                      textTransform: "uppercase", letterSpacing: "0.1em",
                    }}
                  >
                    {extracting ? "Reading…" : "Re-read meeting"}
                  </button>
                </div>
              )}

              {tab === "transcript" && (
                <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 12 }}>

                  {/* Second-pass status — only for live recordings */}
                  {refine && refine.status !== "idle" && (
                    <div style={{
                      display: "flex", alignItems: "center", gap: 9,
                      padding: "9px 13px", borderRadius: 10,
                      background: COLORS.surface,
                      border: `1px solid ${refine.status === "done" ? COLORS.borderEmerald : COLORS.border}`,
                      fontFamily: FONTS.mono, fontSize: 10,
                      letterSpacing: "0.1em", textTransform: "uppercase",
                      color: refine.status === "done" ? COLORS.emerald : COLORS.textSecondary,
                    }}>
                      {refine.status === "running" && (
                        <>
                          <span className="status-dot" style={{ background: COLORS.amber }} />
                          Improving accuracy in background · {refine.progress}%
                        </>
                      )}
                      {refine.status === "done" && (
                        <>
                          <span style={{ fontSize: 12 }}>✓</span>
                          Transcript refined for accuracy
                        </>
                      )}
                      {refine.status === "error" && (
                        <span style={{ color: COLORS.textTertiary }}>
                          Kept the live transcript — second pass unavailable
                        </span>
                      )}
                    </div>
                  )}

                  {(segments || []).map((seg, i) => {
                    const spIdx = speakers.indexOf(seg.speaker);
                    const color = SPEAKER_COLORS[spIdx % SPEAKER_COLORS.length];
                    return (
                      <div key={i} style={{
                        background: COLORS.surface, border: `1px solid ${COLORS.border}`,
                        padding: "12px 16px",
                      }}>
                        <div style={{
                          display: "flex", alignItems: "center", gap: 10, marginBottom: 6,
                          fontFamily: FONTS.mono, fontSize: 10,
                          textTransform: "uppercase", letterSpacing: "0.1em",
                        }}>
                          <span className="status-dot" style={{ background: color }}/>
                          <span style={{ color }}>{seg.speaker}</span>
                          <span style={{ color: COLORS.textTertiary }}>{fmtTime(seg.start)}</span>
                        </div>
                        <div style={{ fontSize: 14, lineHeight: 1.6, color: COLORS.textPrimary }}>
                          {seg.text}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* SPEAKERS TAB */}
              {tab === "speakers" && (
                <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {speakers.map((sp, i) => {
                    const stats = speakerStats[sp] || { words: 0, duration: 0 };
                    const pct = totalDur > 0 ? Math.round((stats.duration / totalDur) * 100) : 0;
                    const color = SPEAKER_COLORS[i % SPEAKER_COLORS.length];
                    return (
                      <div key={sp} className="corners" style={{
                        background: COLORS.surface, border: `1px solid ${COLORS.border}`,
                        padding: "16px 20px",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span className="status-dot" style={{ background: color }}/>
                            <span style={{ fontFamily: FONTS.heading, fontSize: 20, color }}>{sp}</span>
                          </div>
                          <span style={{ fontFamily: FONTS.heading, fontSize: 32, color }}>{pct}%</span>
                        </div>

                        {/* Bar */}
                        <div style={{ height: 4, background: COLORS.surfaceRaised, marginBottom: 12 }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: color, transition: "width 0.6s" }}/>
                        </div>

                        <div style={{ display: "flex", gap: 24, fontFamily: FONTS.mono, fontSize: 11, color: COLORS.textSecondary, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                          <span>{stats.words} words</span>
                          <span>{Math.round(stats.duration)}s spoken</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          </div>
        </main>
      </div>
    </>
  );
}

function Extracted({ title, items, empty, render }) {
  return (
    <div>
      <div style={{
        fontFamily: FONTS.mono, fontSize: 10, letterSpacing: "0.12em",
        textTransform: "uppercase", color: COLORS.textTertiary, marginBottom: 10,
      }}>
        {title}{items.length ? ` · ${items.length}` : ""}
      </div>
      {items.length === 0
        ? <div style={{ fontSize: 13, color: COLORS.textTertiary }}>{empty}</div>
        : <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>{items.map(render)}</ul>}
    </div>
  );
}
