// ============================================================
// FILE PATH:  recalla/src/Timeline.jsx
// PURPOSE:    Chronological activity feed. Date-grouped event list.
// ============================================================

import { useState, useEffect } from "react";
import { COLORS, FONTS, GLOBAL_CSS } from "./theme";
import Sidebar from "./Sidebar";
import { getTimeline } from "./data_api";

const TYPE_CONFIG = {
  meeting:  { label: "Meeting",  color: COLORS.emerald, icon: "\u{1F399}" },
  reminder: { label: "Reminder", color: COLORS.violet,  icon: "\u23F0" },
};

// Group by calendar day so the feed reads as "Today / Yesterday / 14 Jun".
function dayLabel(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Unknown";
  const day = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate());
  const diff = Math.round((day(new Date()) - day(d)) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff > 1 && diff < 7) return d.toLocaleDateString(undefined, { weekday: "long" });
  return d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
}

export default function Timeline({ navigate, user }) {
  const [filter, setFilter]   = useState("all");
  const [events, setEvents]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    getTimeline()
      .then((r) => alive && setEvents(
        (r.events || []).map((e) => ({
          ...e,
          date: dayLabel(e.at),
          time: new Date(e.at).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }),
          text: e.type === "meeting" ? `Recorded: ${e.title} (${e.detail})` : `Reminder: ${e.title}`,
        }))
      ))
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  const filtered = filter === "all" ? events : events.filter(e => e.type === filter);
  const grouped = filtered.reduce((acc, e) => {
    if (!acc[e.date]) acc[e.date] = [];
    acc[e.date].push(e);
    return acc;
  }, {});

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div style={{ display: "flex", height: "100vh", width: "100vw", background: COLORS.bg }}>
        <Sidebar active="timeline" navigate={navigate} user={user}/>

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
              {loading ? "Loading\u2026" : `${filtered.length} events`}
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
              {!loading && filtered.length === 0 && (
                <div style={{ textAlign: "center", padding: "56px 20px" }}>
                  <div style={{ fontFamily: FONTS.heading, fontSize: 24, marginBottom: 8, color: COLORS.textPrimary }}>
                    Nothing here yet
                  </div>
                  <div style={{ fontSize: 14, color: COLORS.textSecondary }}>
                    Your meetings and reminders will show up on this timeline.
                  </div>
                </div>
              )}

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