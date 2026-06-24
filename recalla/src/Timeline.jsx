// ============================================================
// FILE PATH:  recalla/src/Timeline.jsx
// PURPOSE:    Chronological activity feed. Date-grouped event list.
// ============================================================

import { useState } from "react";
import { COLORS, FONTS, GLOBAL_CSS } from "./theme";
import Sidebar from "./Sidebar";

const EVENTS = [
  { date: "Today",        time: "2:15 PM",  type: "reminder", text: "Created reminder: Call Muzammal about API bug" },
  { date: "Today",        time: "11:30 AM", type: "memory",   text: "Stored 3 new memories from Backend Architecture Sync" },
  { date: "Today",        time: "10:00 AM", type: "meeting",  text: "Recorded: Backend Architecture Sync (32m)" },
  { date: "Yesterday",    time: "5:45 PM",  type: "task",     text: "Completed task: Update Whisper to small model" },
  { date: "Yesterday",    time: "4:00 PM",  type: "meeting",  text: "Recorded: Frontend Design Review (45m)" },
  { date: "Yesterday",    time: "2:10 PM",  type: "memory",   text: "Pinned memory: Use ChromaDB for vector storage" },
  { date: "Yesterday",    time: "9:30 AM",  type: "reminder", text: "Reminder triggered: Submit weekly progress report" },
  { date: "Mon, Jun 23",  time: "3:25 PM",  type: "meeting",  text: "Recorded: Supervisor FYP Check-in (20m)" },
  { date: "Mon, Jun 23",  time: "11:00 AM", type: "decision", text: "Decision: Switch to Groq Llama 3.3 for summarization" },
  { date: "Sun, Jun 22",  time: "8:30 PM",  type: "task",     text: "Created task: Fix authentication bug" },
  { date: "Sun, Jun 22",  time: "2:45 PM",  type: "meeting",  text: "Recorded: Database Schema Planning (28m)" },
];

const TYPE_CONFIG = {
  meeting:  { label: "Meeting",  color: COLORS.emerald, icon: "🎙" },
  reminder: { label: "Reminder", color: COLORS.violet,  icon: "⏰" },
  memory:   { label: "Memory",   color: COLORS.cyan,    icon: "💾" },
  task:     { label: "Task",     color: COLORS.amber,   icon: "✓" },
  decision: { label: "Decision", color: COLORS.red,     icon: "★" },
};

export default function Timeline({ navigate }) {
  const [filter, setFilter] = useState("all");

  const filtered = filter === "all" ? EVENTS : EVENTS.filter(e => e.type === filter);
  const grouped = filtered.reduce((acc, e) => {
    if (!acc[e.date]) acc[e.date] = [];
    acc[e.date].push(e);
    return acc;
  }, {});

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div style={{ display: "flex", height: "100vh", width: "100vw", background: COLORS.bg }}>
        <Sidebar active="timeline" navigate={navigate}/>

        <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <header style={{
            padding: "18px 28px", borderBottom: `1px solid ${COLORS.border}`,
          }}>
            <div style={{ fontFamily: FONTS.heading, fontSize: 26, lineHeight: 1, textTransform: "uppercase", letterSpacing: "0.02em" }}>
              Timeline
            </div>
            <div style={{
              fontFamily: FONTS.mono, fontSize: 10, color: COLORS.textSecondary,
              marginTop: 4, textTransform: "uppercase", letterSpacing: "0.12em",
            }}>
              {filtered.length} events
            </div>
          </header>

          {/* Filter chips */}
          <div style={{ padding: "16px 28px", borderBottom: `1px solid ${COLORS.border}` }}>
            <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", flexWrap: "wrap", gap: 6 }}>
              <button
                onClick={() => setFilter("all")}
                style={{
                  background: filter === "all" ? "rgba(255,255,255,0.08)" : "transparent",
                  border: `1px solid ${filter === "all" ? COLORS.borderStrong : COLORS.border}`,
                  color: filter === "all" ? COLORS.textPrimary : COLORS.textSecondary,
                  padding: "5px 12px", fontFamily: FONTS.mono, fontSize: 10,
                  textTransform: "uppercase", letterSpacing: "0.1em",
                  cursor: "pointer", borderRadius: 999,
                }}
              >
                All
              </button>
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
            </div>
          </div>

          {/* Timeline list */}
          <div style={{ flex: 1, overflowY: "auto", padding: "20px 28px 40px" }}>
            <div style={{ maxWidth: 760, margin: "0 auto" }}>
              {Object.entries(grouped).map(([date, events]) => (
                <div key={date} style={{ marginBottom: 28 }}>
                  {/* Date header */}
                  <div style={{
                    fontFamily: FONTS.mono, fontSize: 10, color: COLORS.textSecondary,
                    textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 12,
                    display: "flex", alignItems: "center", gap: 10,
                  }}>
                    <span style={{ flexShrink: 0 }}>{date}</span>
                    <span style={{ flex: 1, height: 1, background: COLORS.border }}/>
                  </div>

                  {/* Events */}
                  <div style={{ position: "relative", paddingLeft: 22 }}>
                    {/* Vertical line */}
                    <div style={{
                      position: "absolute", left: 5, top: 8, bottom: 8,
                      width: 1, background: COLORS.border,
                    }}/>

                    {events.map((e, i) => {
                      const cfg = TYPE_CONFIG[e.type] || TYPE_CONFIG.meeting;
                      return (
                        <div key={i} style={{
                          position: "relative", marginBottom: 12,
                          paddingTop: 2,
                        }}>
                          {/* Dot */}
                          <div style={{
                            position: "absolute", left: -22, top: 10,
                            width: 11, height: 11, borderRadius: "50%",
                            background: COLORS.bg,
                            border: `1.5px solid ${cfg.color}`,
                          }}/>

                          <div style={{
                            background: COLORS.surface, border: `1px solid ${COLORS.border}`,
                            padding: "10px 14px",
                          }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                              <span style={{
                                fontFamily: FONTS.mono, fontSize: 9, color: cfg.color,
                                textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600,
                              }}>
                                {cfg.label}
                              </span>
                              <span style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.textTertiary }}>
                                {e.time}
                              </span>
                            </div>
                            <div style={{ fontSize: 13, color: COLORS.textPrimary, lineHeight: 1.5 }}>
                              {e.text}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}