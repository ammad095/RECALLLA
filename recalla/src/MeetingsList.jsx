// ============================================================
// FILE PATH:  recalla/src/MeetingsList.jsx
// PURPOSE:    Browse all meetings. Simple search + list, no grid view.
// ============================================================

import { useState, useEffect } from "react";
import { COLORS, FONTS, GLOBAL_CSS } from "./theme";
import Sidebar from "./Sidebar";
import { listMeetings, deleteMeeting } from "./data_api";
import { fmtWhen, fmtDuration } from "./format";

export default function MeetingsList({ navigate, user }) {
  const [search, setSearch]     = useState("");
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const rows = await listMeetings();
        if (alive) { setMeetings(rows); setError(null); }
      } catch (e) {
        if (alive) setError(e.message);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const remove = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Delete this meeting? This cannot be undone.")) return;
    try {
      await deleteMeeting(id);
      setMeetings((prev) => prev.filter((m) => m.id !== id));
    } catch (err) { setError(err.message); }
  };

  const q = search.toLowerCase();
  const filtered = meetings.filter((m) =>
    !q || m.title.toLowerCase().includes(q) || (m.tags || []).some((t) => t.toLowerCase().includes(q))
  );

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div style={{ display: "flex", height: "100vh", width: "100vw", background: COLORS.bg }}>
        <Sidebar active="meetings" navigate={navigate} user={user}/>

        <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Header */}
          <header style={{
            padding: "18px 28px", borderBottom: `1px solid ${COLORS.border}`,
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
          }}>
            <div>
              <div style={{ fontFamily: FONTS.heading, fontSize: 26, lineHeight: 1, textTransform: "uppercase", letterSpacing: "0.02em" }}>
                Meetings
              </div>
              <div style={{
                fontFamily: FONTS.mono, fontSize: 10, color: COLORS.textSecondary,
                marginTop: 4, textTransform: "uppercase", letterSpacing: "0.12em",
              }}>
                {loading ? "Loading…" : `${filtered.length} of ${meetings.length} meetings`}
              </div>
            </div>

            <button
              onClick={() => navigate("record")}
              style={{
                background: `linear-gradient(135deg, ${COLORS.emerald}, ${COLORS.cyan})`,
                color: COLORS.onAccent, border: "none", padding: "9px 18px",
                fontFamily: FONTS.mono, fontSize: 11, fontWeight: 600,
                textTransform: "uppercase", letterSpacing: "0.1em",
                cursor: "pointer", borderRadius: 999,
              }}
            >
              + Record
            </button>
          </header>

          {/* Search bar */}
          <div style={{ padding: "20px 28px 0" }}>
            <div style={{ maxWidth: 760, margin: "0 auto" }}>
              <div className="corners" style={{
                background: COLORS.surface, border: `1px solid ${COLORS.border}`,
                padding: "10px 16px", display: "flex", alignItems: "center", gap: 10,
              }}>
                <svg viewBox="0 0 24 24" width="16" height="16" stroke={COLORS.textTertiary} strokeWidth="2" fill="none">
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  type="text"
                  placeholder="Search by title or tag..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{
                    flex: 1, background: "transparent", border: "none", outline: "none",
                    color: COLORS.textPrimary, fontFamily: FONTS.body, fontSize: 14,
                  }}
                />
              </div>
            </div>
          </div>

          {/* List */}
          <div style={{ flex: 1, overflowY: "auto", padding: "20px 28px 40px" }}>
            <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", flexDirection: "column", gap: 10 }}>
              {error && (
                <div style={{
                  padding: "12px 16px", borderRadius: 10, marginBottom: 4,
                  background: COLORS.surface, border: `1px solid ${COLORS.red}`,
                  color: COLORS.red, fontFamily: FONTS.mono, fontSize: 11,
                }}>{error}</div>
              )}

              {loading ? (
                [0,1,2].map(i => <div key={i} className="skeleton" style={{ height: 74, borderRadius: 14 }}/>)
              ) : filtered.length === 0 ? (
                <div style={{ textAlign: "center", padding: "56px 20px" }}>
                  <div style={{ fontFamily: FONTS.heading, fontSize: 26, marginBottom: 10, color: COLORS.textPrimary }}>
                    {meetings.length === 0 ? "No meetings yet" : "Nothing matches that search"}
                  </div>
                  <div style={{ fontSize: 14, color: COLORS.textSecondary, marginBottom: 22, lineHeight: 1.6 }}>
                    {meetings.length === 0
                      ? "Record your first meeting and it will appear here."
                      : "Try a different title or tag."}
                  </div>
                  {meetings.length === 0 && (
                    <button onClick={() => navigate("record")} className="press" style={{
                      background: `linear-gradient(135deg, ${COLORS.emerald}, ${COLORS.cyan})`,
                      color: COLORS.onAccent, border: "none", padding: "11px 22px",
                      fontFamily: FONTS.mono, fontSize: 11, fontWeight: 600,
                      textTransform: "uppercase", letterSpacing: "0.1em",
                      cursor: "pointer", borderRadius: 999,
                    }}>Record a meeting</button>
                  )}
                </div>
              ) : filtered.map(m => (
                <div
                  key={m.id}
                  onClick={() => navigate("detail", m)}
                  className="corners"
                  style={{
                    background: COLORS.surface, border: `1px solid ${COLORS.border}`,
                    padding: "16px 20px", cursor: "pointer", transition: "all 0.2s",
                    display: "flex", alignItems: "center", gap: 16,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = COLORS.borderEmerald; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = COLORS.border; }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 6 }}>{m.title}</div>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 12,
                      fontFamily: FONTS.mono, fontSize: 10, color: COLORS.textSecondary,
                      textTransform: "uppercase", letterSpacing: "0.08em",
                    }}>
                      <span>{fmtWhen(m.started_at)}</span>
                      <span style={{ color: COLORS.textTertiary }}>·</span>
                      <span>{fmtDuration(m.duration_seconds)}</span>
                      <span style={{ color: COLORS.textTertiary }}>·</span>
                      <span>{(m.speakers || []).length || 1} speaker{((m.speakers || []).length || 1) !== 1 ? "s" : ""}</span>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap", maxWidth: 220, justifyContent: "flex-end" }}>
                    {(m.tags || []).map(t => (
                      <span key={t} style={{
                        fontFamily: FONTS.mono, fontSize: 9, padding: "3px 8px",
                        background: "rgba(52,211,153,0.10)",
                        border: `1px solid ${COLORS.borderEmerald}`,
                        color: COLORS.emerald, borderRadius: 999,
                        textTransform: "uppercase", letterSpacing: "0.08em",
                      }}>{t}</span>
                    ))}
                  </div>

                  <button
                    onClick={(e) => remove(e, m.id)}
                    title="Delete meeting"
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      color: COLORS.textTertiary, padding: 4, display: "flex", borderRadius: 6,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = COLORS.red; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = COLORS.textTertiary; }}
                  >
                    <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                  </button>

                  <svg viewBox="0 0 24 24" width="14" height="14" stroke={COLORS.textTertiary} strokeWidth="2" fill="none" strokeLinecap="round">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}