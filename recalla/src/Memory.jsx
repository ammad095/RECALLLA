// ============================================================
// FILE PATH:  recalla/src/Memory.jsx
// PURPOSE:    Memory bank — search and browse stored knowledge from meetings.
//             Simple filter chips + list. No stat cards.
// ============================================================

import { useState } from "react";
import { COLORS, FONTS, GLOBAL_CSS } from "./theme";
import Sidebar from "./Sidebar";

const MEMORIES = [
  { id: 1, type: "decision", content: "Use ChromaDB for vector storage instead of Pinecone — free, local, no infra costs.", date: "Yesterday", meeting: "Backend Architecture Sync", pinned: true },
  { id: 2, type: "task",     content: "Muzammal will deploy Whisper v3 to staging by Friday for real-audio testing.", date: "Yesterday", meeting: "Backend Architecture Sync" },
  { id: 3, type: "deadline", content: "FYP final demo scheduled for June 30 — supervisor expects working build.", date: "Mon",       meeting: "Supervisor FYP Check-in", pinned: true },
  { id: 4, type: "insight",  content: "Speaker diarization works well with 2-3 speakers but degrades with 4+ — limit recommendation.", date: "Mon", meeting: "Frontend Design Review" },
  { id: 5, type: "task",     content: "Fix authentication bug before next week's product sprint.", date: "Last Tue", meeting: "Product Sprint Planning" },
  { id: 6, type: "decision", content: "Switch summarization model from local T5 to Groq Llama 3.3 70B for better quality and free tier.", date: "Jun 14", meeting: "AI Model Selection" },
  { id: 7, type: "fact",     content: "Whisper small model handles Urdu transcription with ~80% accuracy on test set.", date: "Jun 12", meeting: "Multilingual Testing" },
];

const TYPE_CONFIG = {
  all:      { label: "All",       color: COLORS.textSecondary },
  decision: { label: "Decisions", color: COLORS.emerald },
  task:     { label: "Tasks",     color: COLORS.violet },
  deadline: { label: "Deadlines", color: COLORS.red },
  insight:  { label: "Insights",  color: COLORS.cyan },
  fact:     { label: "Facts",     color: COLORS.amber },
};

export default function Memory({ navigate }) {
  const [search, setSearch]     = useState("");
  const [filter, setFilter]     = useState("all");
  const [pinnedOnly, setPinned] = useState(false);

  const filtered = MEMORIES.filter(m => {
    if (filter !== "all" && m.type !== filter) return false;
    if (pinnedOnly && !m.pinned) return false;
    if (search && !m.content.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div style={{ display: "flex", height: "100vh", width: "100vw", background: COLORS.bg }}>
        <Sidebar active="memory" navigate={navigate}/>

        <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <header style={{
            padding: "18px 28px", borderBottom: `1px solid ${COLORS.border}`,
          }}>
            <div style={{ fontFamily: FONTS.heading, fontSize: 26, lineHeight: 1, textTransform: "uppercase", letterSpacing: "0.02em" }}>
              Memory
            </div>
            <div style={{
              fontFamily: FONTS.mono, fontSize: 10, color: COLORS.textSecondary,
              marginTop: 4, textTransform: "uppercase", letterSpacing: "0.12em",
            }}>
              {filtered.length} of {MEMORIES.length} stored
            </div>
          </header>

          {/* Search + filters */}
          <div style={{ padding: "20px 28px 12px" }}>
            <div style={{ maxWidth: 760, margin: "0 auto" }}>
              <div className="corners" style={{
                background: COLORS.surface, border: `1px solid ${COLORS.border}`,
                padding: "10px 16px", display: "flex", alignItems: "center", gap: 10,
                marginBottom: 12,
              }}>
                <svg viewBox="0 0 24 24" width="16" height="16" stroke={COLORS.textTertiary} strokeWidth="2" fill="none">
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  type="text"
                  placeholder="Search memories semantically..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{
                    flex: 1, background: "transparent", border: "none", outline: "none",
                    color: COLORS.textPrimary, fontFamily: FONTS.body, fontSize: 14,
                  }}
                />
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    style={{
                      background: filter === key ? `${cfg.color}1A` : "transparent",
                      border: `1px solid ${filter === key ? cfg.color : COLORS.border}`,
                      color: filter === key ? cfg.color : COLORS.textSecondary,
                      padding: "5px 12px", fontFamily: FONTS.mono, fontSize: 10,
                      textTransform: "uppercase", letterSpacing: "0.1em",
                      cursor: "pointer", borderRadius: 999,
                    }}
                  >
                    {cfg.label}
                  </button>
                ))}
                <button
                  onClick={() => setPinned(!pinnedOnly)}
                  style={{
                    background: pinnedOnly ? `${COLORS.amber}1A` : "transparent",
                    border: `1px solid ${pinnedOnly ? COLORS.amber : COLORS.border}`,
                    color: pinnedOnly ? COLORS.amber : COLORS.textSecondary,
                    padding: "5px 12px", fontFamily: FONTS.mono, fontSize: 10,
                    textTransform: "uppercase", letterSpacing: "0.1em",
                    cursor: "pointer", borderRadius: 999,
                    marginLeft: "auto",
                  }}
                >
                  ★ Pinned Only
                </button>
              </div>
            </div>
          </div>

          {/* List */}
          <div style={{ flex: 1, overflowY: "auto", padding: "12px 28px 40px" }}>
            <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", flexDirection: "column", gap: 10 }}>
              {filtered.length === 0 ? (
                <div style={{
                  textAlign: "center", padding: 60,
                  fontFamily: FONTS.mono, fontSize: 11, color: COLORS.textTertiary,
                  textTransform: "uppercase", letterSpacing: "0.1em",
                }}>
                  No memories match
                </div>
              ) : filtered.map(m => {
                const cfg = TYPE_CONFIG[m.type] || TYPE_CONFIG.all;
                return (
                  <div key={m.id} className="corners" style={{
                    background: COLORS.surface,
                    border: `1px solid ${m.pinned ? "rgba(251,191,36,0.3)" : COLORS.border}`,
                    padding: "14px 18px",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <span className="status-dot" style={{ background: cfg.color }}/>
                      <span style={{
                        fontFamily: FONTS.mono, fontSize: 9, color: cfg.color,
                        textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 600,
                      }}>
                        {cfg.label}
                      </span>
                      {m.pinned && (
                        <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.amber }}>★</span>
                      )}
                      <span style={{ marginLeft: "auto", fontFamily: FONTS.mono, fontSize: 10, color: COLORS.textTertiary }}>
                        {m.date}
                      </span>
                    </div>
                    <div style={{ fontSize: 14, lineHeight: 1.6, color: COLORS.textPrimary, marginBottom: 6 }}>
                      {m.content}
                    </div>
                    <div style={{
                      fontFamily: FONTS.mono, fontSize: 10, color: COLORS.textTertiary,
                      textTransform: "uppercase", letterSpacing: "0.08em",
                    }}>
                      from · {m.meeting}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}