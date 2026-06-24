// ============================================================
// FILE PATH:  recalla/src/MeetingDetail.jsx
// PURPOSE:    Single-meeting view. Auto-generates AI summary on load.
//             Real summary from Groq, simple tab switcher.
// ============================================================

import { useState, useEffect } from "react";
import { COLORS, FONTS, GLOBAL_CSS } from "./theme";
import Sidebar from "./Sidebar";
import { summarizeTranscript } from "./agent_api";

const SPEAKER_COLORS = [COLORS.emerald, COLORS.violet, COLORS.cyan, COLORS.amber];

const fmtTime = (sec) => {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m.toString().padStart(2,"0")}:${s.toString().padStart(2,"0")}`;
};

export default function MeetingDetail({ navigate, meeting }) {
  const [tab, setTab]                 = useState("summary");
  const [summary, setSummary]         = useState(null);
  const [keyPoints, setKeyPoints]     = useState([]);
  const [generating, setGenerating]   = useState(false);
  const [genError, setGenError]       = useState(null);

  // Auto-generate AI summary on first load
  useEffect(() => {
    if (!meeting?.fullText) return;
    // If already has a summary stored, skip
    if (meeting.aiSummary) { setSummary(meeting.aiSummary); setKeyPoints(meeting.keyPoints || []); return; }
    generateSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generateSummary = async () => {
    if (!meeting?.fullText) return;
    setGenerating(true);
    setGenError(null);
    try {
      const res = await summarizeTranscript(meeting.fullText, true);
      setSummary(res.summary);
      setKeyPoints(res.key_points || []);
    } catch (e) {
      setGenError(e.message);
    } finally {
      setGenerating(false);
    }
  };

  if (!meeting) {
    return (
      <>
        <style>{GLOBAL_CSS}</style>
        <div style={{ display: "flex", height: "100vh", background: COLORS.bg }}>
          <Sidebar active="meetings" navigate={navigate}/>
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
  const speakers = [...new Set((meeting.transcript || []).map(s => s.speaker || "Speaker 1"))];
  const speakerStats = {};
  (meeting.transcript || []).forEach(seg => {
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
        <Sidebar active="meetings" navigate={navigate}/>

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
                {meeting.title || "Untitled Meeting"}
              </div>
              <div style={{
                fontFamily: FONTS.mono, fontSize: 10, color: COLORS.textSecondary,
                marginTop: 4, textTransform: "uppercase", letterSpacing: "0.1em",
              }}>
                {meeting.date} · {meeting.duration} · {meeting.wordCount} words · {speakers.length} speaker{speakers.length !== 1 ? "s" : ""}
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
                    {generating ? "Groq generating..." : "AI Summary · Llama 3.3"}
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
              {tab === "transcript" && (
                <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {(meeting.transcript || []).map((seg, i) => {
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