// ============================================================
// FILE PATH:  recalla/src/Reminders.jsx
// PURPOSE:    Minimal reminder list. Just a list, an add button.
//             Wired to /api/agent/reminders endpoints.
// ============================================================

import { useState, useEffect } from "react";
import { COLORS, FONTS, GLOBAL_CSS } from "./theme";
import Sidebar from "./Sidebar";
import { listReminders, createReminder, completeReminder, deleteReminder } from "./agent_api";

const PRIORITY_COLOR = {
  high:   COLORS.red,
  medium: COLORS.amber,
  low:    COLORS.cyan,
};

const formatDate = (iso) => {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      month: "short", day: "numeric",
      hour: "numeric", minute: "2-digit",
    });
  } catch { return iso; }
};

const isPast = (iso) => {
  try { return new Date(iso) < new Date(); } catch { return false; }
};

// ── Reminder row ──────────────────────────────────────────────────────────
const ReminderRow = ({ r, onToggle, onDelete }) => {
  const past = isPast(r.datetime);
  return (
    <div className="fade-up corners" style={{
      background: COLORS.surface,
      border: `1px solid ${COLORS.border}`,
      padding: "16px 18px",
      display: "flex", alignItems: "center", gap: 14,
      opacity: r.completed ? 0.5 : 1,
      transition: "opacity 0.2s",
    }}>
      {/* Priority indicator */}
      <span className="status-dot" style={{
        background: PRIORITY_COLOR[r.priority] || COLORS.textSecondary,
        animation: past && !r.completed ? "pulse-dot 1s infinite" : "none",
      }}/>

      {/* Toggle complete */}
      <button
        onClick={() => onToggle(r.id)}
        style={{
          width: 18, height: 18,
          border: `1.5px solid ${r.completed ? COLORS.emerald : COLORS.textTertiary}`,
          background: r.completed ? COLORS.emerald : "transparent",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          padding: 0, flexShrink: 0,
        }}
      >
        {r.completed && (
          <svg viewBox="0 0 24 24" width="11" height="11" stroke={COLORS.bg} strokeWidth="3.5" fill="none">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        )}
      </button>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: FONTS.body, fontSize: 14, fontWeight: 500,
          color: COLORS.textPrimary,
          textDecoration: r.completed ? "line-through" : "none",
          marginBottom: 2,
        }}>
          {r.title}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: FONTS.mono, fontSize: 11, color: past && !r.completed ? COLORS.red : COLORS.textSecondary }}>
          <span>{formatDate(r.datetime)}</span>
          <span style={{ color: COLORS.textTertiary }}>·</span>
          <span style={{ textTransform: "uppercase", letterSpacing: "0.08em" }}>{r.priority}</span>
          {r.category && r.category !== "general" && (
            <>
              <span style={{ color: COLORS.textTertiary }}>·</span>
              <span style={{ color: COLORS.textTertiary }}>{r.category}</span>
            </>
          )}
        </div>
      </div>

      {/* Delete */}
      <button
        onClick={() => onDelete(r.id)}
        title="Delete"
        style={{
          background: "transparent", border: "none",
          color: COLORS.textTertiary, cursor: "pointer",
          padding: 6, display: "flex", alignItems: "center", justifyContent: "center",
          transition: "color 0.2s",
        }}
        onMouseEnter={e => { e.currentTarget.style.color = COLORS.red; }}
        onMouseLeave={e => { e.currentTarget.style.color = COLORS.textTertiary; }}
      >
        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  );
};

// ── Add reminder modal (inline expansion at top) ─────────────────────────
const AddInline = ({ onClose, onCreated }) => {
  const [title, setTitle]       = useState("");
  const [date, setDate]         = useState("");
  const [time, setTime]         = useState("");
  const [priority, setPriority] = useState("medium");
  const [saving, setSaving]     = useState(false);

  const handleSave = async () => {
    if (!title.trim() || !date) return;
    setSaving(true);
    try {
      const datetime_iso = `${date}T${time || "09:00"}:00`;
      await createReminder({ title: title.trim(), datetime_iso, priority });
      onCreated();
      onClose();
    } catch (e) {
      alert("Failed to create reminder: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fade-up corners corners-violet" style={{
      background: COLORS.surface,
      border: `1px solid ${COLORS.borderViolet}`,
      padding: "18px 20px",
      marginBottom: 16,
    }}>
      <input
        type="text"
        placeholder="Remind me to..."
        value={title}
        onChange={e => setTitle(e.target.value)}
        autoFocus
        style={{
          width: "100%", background: "transparent", border: "none", outline: "none",
          color: COLORS.textPrimary, fontFamily: FONTS.body, fontSize: 15,
          marginBottom: 14, padding: 0,
        }}
      />

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          style={{
            background: COLORS.bg, border: `1px solid ${COLORS.border}`,
            color: COLORS.textPrimary, padding: "6px 10px",
            fontFamily: FONTS.mono, fontSize: 12, outline: "none",
            colorScheme: "dark",
          }}
        />
        <input
          type="time"
          value={time}
          onChange={e => setTime(e.target.value)}
          style={{
            background: COLORS.bg, border: `1px solid ${COLORS.border}`,
            color: COLORS.textPrimary, padding: "6px 10px",
            fontFamily: FONTS.mono, fontSize: 12, outline: "none",
            colorScheme: "dark",
          }}
        />

        <div style={{ display: "flex", gap: 4 }}>
          {["low", "medium", "high"].map(p => (
            <button
              key={p}
              onClick={() => setPriority(p)}
              style={{
                background: priority === p ? `${PRIORITY_COLOR[p]}22` : "transparent",
                border: `1px solid ${priority === p ? PRIORITY_COLOR[p] : COLORS.border}`,
                color: priority === p ? PRIORITY_COLOR[p] : COLORS.textSecondary,
                padding: "6px 12px", fontFamily: FONTS.mono, fontSize: 11,
                textTransform: "uppercase", letterSpacing: "0.08em", cursor: "pointer",
              }}
            >
              {p}
            </button>
          ))}
        </div>

        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button
            onClick={onClose}
            style={{
              background: "transparent", border: `1px solid ${COLORS.border}`,
              color: COLORS.textSecondary, padding: "8px 16px",
              fontFamily: FONTS.mono, fontSize: 11,
              textTransform: "uppercase", letterSpacing: "0.1em",
              cursor: "pointer", borderRadius: 999,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim() || !date || saving}
            style={{
              background: title.trim() && date && !saving
                ? `linear-gradient(135deg, ${COLORS.emerald}, ${COLORS.cyan})`
                : COLORS.surfaceRaised,
              color: title.trim() && date && !saving ? COLORS.bg : COLORS.textTertiary,
              border: "none", padding: "8px 18px",
              fontFamily: FONTS.mono, fontSize: 11, fontWeight: 600,
              textTransform: "uppercase", letterSpacing: "0.1em",
              cursor: title.trim() && date && !saving ? "pointer" : "not-allowed",
              borderRadius: 999,
            }}
          >
            {saving ? "..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────
export default function Reminders({ navigate }) {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState("pending"); // pending | completed | all
  const [showAdd, setShowAdd]     = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await listReminders(filter);
      setReminders(res.reminders || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, [filter]);

  const handleToggle = async (id) => {
    try {
      await completeReminder(id);
      refresh();
    } catch (e) { alert(e.message); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this reminder?")) return;
    try {
      await deleteReminder(id);
      refresh();
    } catch (e) { alert(e.message); }
  };

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div style={{ display: "flex", height: "100vh", width: "100vw", background: COLORS.bg }}>
        <Sidebar active="reminders" navigate={navigate}/>

        <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Header */}
          <header style={{
            padding: "18px 28px", borderBottom: `1px solid ${COLORS.border}`,
            display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14,
          }}>
            <div>
              <div style={{ fontFamily: FONTS.heading, fontSize: 26, lineHeight: 1, textTransform: "uppercase", letterSpacing: "0.02em" }}>
                Reminders
              </div>
              <div style={{
                fontFamily: FONTS.mono, fontSize: 10, color: COLORS.textSecondary,
                marginTop: 4, textTransform: "uppercase", letterSpacing: "0.12em",
              }}>
                {reminders.length} {filter}
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {/* Filter tabs */}
              {["pending", "completed", "all"].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    background: filter === f ? "rgba(52,211,153,0.10)" : "transparent",
                    border: `1px solid ${filter === f ? COLORS.borderEmerald : COLORS.border}`,
                    color: filter === f ? COLORS.emerald : COLORS.textSecondary,
                    padding: "6px 14px", fontFamily: FONTS.mono, fontSize: 11,
                    textTransform: "uppercase", letterSpacing: "0.1em",
                    cursor: "pointer", borderRadius: 999,
                  }}
                >
                  {f}
                </button>
              ))}

              <button
                onClick={() => setShowAdd(s => !s)}
                style={{
                  background: showAdd ? COLORS.surfaceRaised : `linear-gradient(135deg, ${COLORS.emerald}, ${COLORS.cyan})`,
                  color: showAdd ? COLORS.textSecondary : COLORS.bg,
                  border: "none", padding: "8px 18px", marginLeft: 8,
                  fontFamily: FONTS.mono, fontSize: 11, fontWeight: 600,
                  textTransform: "uppercase", letterSpacing: "0.1em",
                  cursor: "pointer", borderRadius: 999,
                }}
              >
                {showAdd ? "Cancel" : "+ Add"}
              </button>
            </div>
          </header>

          {/* List */}
          <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
            <div style={{ maxWidth: 720, margin: "0 auto" }}>

              {showAdd && (
                <AddInline onClose={() => setShowAdd(false)} onCreated={refresh}/>
              )}

              {loading && reminders.length === 0 && (
                <div style={{
                  textAlign: "center", padding: 60,
                  fontFamily: FONTS.mono, fontSize: 11, color: COLORS.textTertiary,
                  textTransform: "uppercase", letterSpacing: "0.1em",
                }}>
                  Loading...
                </div>
              )}

              {!loading && reminders.length === 0 && !showAdd && (
                <div style={{ textAlign: "center", padding: "80px 20px" }} className="fade-up">
                  <div style={{
                    fontFamily: FONTS.heading, fontSize: 38, lineHeight: 1.1,
                    textTransform: "uppercase", marginBottom: 12, letterSpacing: "0.01em",
                  }}>
                    No reminders<br/><span style={{ color: COLORS.emerald }}>set</span>
                  </div>
                  <div style={{ fontSize: 13, color: COLORS.textSecondary, marginBottom: 28 }}>
                    Add one manually, or ask Recalla to set one for you.
                  </div>
                  <button
                    onClick={() => setShowAdd(true)}
                    style={{
                      background: `linear-gradient(135deg, ${COLORS.emerald}, ${COLORS.cyan})`,
                      color: COLORS.bg, border: "none", padding: "10px 24px",
                      fontFamily: FONTS.mono, fontSize: 12, fontWeight: 600,
                      textTransform: "uppercase", letterSpacing: "0.1em",
                      cursor: "pointer", borderRadius: 999,
                    }}
                  >
                    Add First Reminder
                  </button>
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {reminders.map(r => (
                  <ReminderRow key={r.id} r={r} onToggle={handleToggle} onDelete={handleDelete}/>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}