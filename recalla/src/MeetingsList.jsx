// ============================================================
// FILE PATH:  recalla/src/MeetingsList.jsx
// PURPOSE:    Browse all meetings. Simple search + list, no grid view.
// ============================================================

import { useState } from "react";
import { COLORS, FONTS, GLOBAL_CSS } from "./theme";
import Sidebar from "./Sidebar";

const MEETINGS = [
  { id: 1, title: "Backend Architecture Sync",   date: "Yesterday · 4:00 PM",  duration: "32m", speakers: 2, tags: ["Backend", "AI/ML"] },
  { id: 2, title: "Frontend Design Review",      date: "Mon · 3:25 PM",        duration: "45m", speakers: 3, tags: ["Design", "Frontend"] },
  { id: 3, title: "Supervisor FYP Check-in",     date: "Last Tue · 11:00 AM",  duration: "20m", speakers: 2, tags: ["FYP"] },
  { id: 4, title: "Database Schema Planning",    date: "Last Sun · 2:45 PM",   duration: "28m", speakers: 2, tags: ["Database"] },
  { id: 5, title: "Product Sprint Planning",     date: "Last Mon · 10:15 AM",  duration: "55m", speakers: 4, tags: ["Sprint"] },
  { id: 6, title: "UX Research Debrief",         date: "Jun 14 · 11:00 AM",    duration: "38m", speakers: 3, tags: ["UX"] },
];

export default function MeetingsList({ navigate }) {
  const [search, setSearch] = useState("");

  const filtered = MEETINGS.filter(m =>
    !search ||
    m.title.toLowerCase().includes(search.toLowerCase()) ||
    m.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div style={{ display: "flex", height: "100vh", width: "100vw", background: COLORS.bg }}>
        <Sidebar active="meetings" navigate={navigate}/>

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
                {filtered.length} of {MEETINGS.length} meetings
              </div>
            </div>

            <button
              onClick={() => navigate("record")}
              style={{
                background: `linear-gradient(135deg, ${COLORS.emerald}, ${COLORS.cyan})`,
                color: COLORS.bg, border: "none", padding: "9px 18px",
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
              {filtered.length === 0 ? (
                <div style={{
                  textAlign: "center", padding: 60,
                  fontFamily: FONTS.mono, fontSize: 11,
                  color: COLORS.textTertiary, textTransform: "uppercase", letterSpacing: "0.1em",
                }}>
                  No meetings found
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
                      <span>{m.date}</span>
                      <span style={{ color: COLORS.textTertiary }}>·</span>
                      <span>{m.duration}</span>
                      <span style={{ color: COLORS.textTertiary }}>·</span>
                      <span>{m.speakers} speakers</span>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap", maxWidth: 220, justifyContent: "flex-end" }}>
                    {m.tags.map(t => (
                      <span key={t} style={{
                        fontFamily: FONTS.mono, fontSize: 9, padding: "3px 8px",
                        background: "rgba(52,211,153,0.10)",
                        border: `1px solid ${COLORS.borderEmerald}`,
                        color: COLORS.emerald, borderRadius: 999,
                        textTransform: "uppercase", letterSpacing: "0.08em",
                      }}>{t}</span>
                    ))}
                  </div>

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