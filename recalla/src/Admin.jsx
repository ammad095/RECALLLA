// ============================================================
// FILE PATH:  recalla/src/Admin.jsx
// PURPOSE:    Admin panel — user management + activity log + system status.
//             Uses red as accent to distinguish from main app emerald..
// ============================================================

import { useState, useEffect } from "react";
import { COLORS, FONTS, GLOBAL_CSS } from "./theme";
import Sidebar from "./Sidebar";
import { adminListUsers, adminUpdateUser } from "./data_api";
import { fmtWhen } from "./format";

const ROLE_COLOR = {
  admin: COLORS.red,
  user:  COLORS.emerald,
};

export default function Admin({ navigate, user }) {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await adminListUsers();
        if (alive) { setUsers(r.users || []); setError(null); }
      } catch (e) {
        if (alive) setError(e.message);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const toggleActive = async (u) => {
    try {
      await adminUpdateUser(u.id, { is_active: !u.is_active });
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, is_active: !x.is_active } : x)));
    } catch (e) { setError(e.message); }
  };

  const totalMeetings = users.reduce((a, u) => a + (u.meetings || 0), 0);
  const activeUsers   = users.filter((u) => u.is_active).length;
  const [tab, setTab] = useState("users");

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div style={{ display: "flex", height: "100vh", width: "100vw", background: COLORS.bg }}>
        <Sidebar active="settings" navigate={navigate} user={user}/>

        <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <header style={{
            padding: "18px 28px", borderBottom: `1px solid ${COLORS.border}`,
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div>
              <div style={{
                display: "flex", alignItems: "center", gap: 10,
                fontFamily: FONTS.heading, fontSize: 26, lineHeight: 1,
                textTransform: "uppercase", letterSpacing: "0.02em",
              }}>
                Admin <span style={{ color: COLORS.red }}>Panel</span>
              </div>
              <div style={{
                fontFamily: FONTS.mono, fontSize: 10, color: COLORS.textSecondary,
                marginTop: 4, textTransform: "uppercase", letterSpacing: "0.12em",
                display: "flex", alignItems: "center", gap: 6,
              }}>
                <span className="status-dot" style={{ background: COLORS.red }}/>
                Restricted Access · System Administration
              </div>
            </div>

            <div style={{
              fontFamily: FONTS.mono, fontSize: 10, color: COLORS.emerald,
              textTransform: "uppercase", letterSpacing: "0.12em",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <span className="status-dot" style={{ background: COLORS.emerald }}/>
              All Systems Operational
            </div>
          </header>

          {/* Stats strip */}
          <div style={{
            padding: "20px 28px", borderBottom: `1px solid ${COLORS.border}`,
            display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12,
            maxWidth: 880, width: "100%", margin: "0 auto",
          }}>
            {[
              { label: "Total Users",      value: loading ? "\u2014" : users.length,   color: COLORS.red },
              { label: "Active Accounts",  value: loading ? "\u2014" : activeUsers,    color: COLORS.emerald },
              { label: "Meetings Stored",  value: loading ? "\u2014" : totalMeetings,  color: COLORS.violet },
              { label: "Admins",           value: loading ? "\u2014" : users.filter(u => u.role === "admin").length, color: COLORS.cyan },
            ].map((s, i) => (
              <div key={i} className="corners" style={{
                background: COLORS.surface, border: `1px solid ${COLORS.border}`,
                padding: "12px 14px",
              }}>
                <div style={{
                  fontFamily: FONTS.mono, fontSize: 9, color: COLORS.textSecondary,
                  textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 6,
                }}>
                  {s.label}
                </div>
                <div style={{
                  fontFamily: FONTS.heading, fontSize: 28, lineHeight: 1, color: s.color,
                }}>
                  {s.value}
                </div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{
            padding: "0 28px", borderBottom: `1px solid ${COLORS.border}`,
            display: "flex", gap: 4,
          }}>
            {[
              { id: "users",    label: "Users" },
              { id: "activity", label: "Activity" },
              { id: "system",   label: "System" },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  background: "transparent", border: "none",
                  color: tab === t.id ? COLORS.red : COLORS.textSecondary,
                  padding: "14px 18px",
                  fontFamily: FONTS.mono, fontSize: 11, fontWeight: 600,
                  textTransform: "uppercase", letterSpacing: "0.1em",
                  cursor: "pointer",
                  borderBottom: `2px solid ${tab === t.id ? COLORS.red : "transparent"}`,
                  transition: "all 0.2s",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflowY: "auto", padding: "20px 28px" }}>
            <div style={{ maxWidth: 880, margin: "0 auto" }}>

              {/* USERS */}
              {tab === "users" && (
                <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {error && (
                    <div style={{
                      padding: "12px 16px", borderRadius: 10, background: COLORS.surface,
                      border: `1px solid ${COLORS.red}`, color: COLORS.red,
                      fontFamily: FONTS.mono, fontSize: 11,
                    }}>{error}</div>
                  )}
                  {loading && [0,1].map(i => <div key={i} className="skeleton" style={{ height: 66, borderRadius: 14 }}/>)}
                  {users.map(u => (
                    <div key={u.id} className="corners" style={{
                      background: COLORS.surface, border: `1px solid ${COLORS.border}`,
                      padding: "14px 18px",
                      display: "flex", alignItems: "center", gap: 16,
                    }}>
                      <div style={{
                        width: 36, height: 36,
                        background: `linear-gradient(135deg, ${ROLE_COLOR[u.role]}, ${COLORS.violet})`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontFamily: FONTS.heading, fontSize: 14, color: COLORS.onAccent,
                        flexShrink: 0,
                      }}>
                        {u.name.split(" ").map(n => n[0]).slice(0,2).join("")}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 2 }}>{u.name}</div>
                        <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.textSecondary }}>
                          {u.email}
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: FONTS.mono, fontSize: 10 }}>
                        <span style={{
                          padding: "3px 8px",
                          background: `${ROLE_COLOR[u.role]}1A`,
                          border: `1px solid ${ROLE_COLOR[u.role]}40`,
                          color: ROLE_COLOR[u.role],
                          textTransform: "uppercase", letterSpacing: "0.08em",
                          borderRadius: 999,
                        }}>
                          {u.role}
                        </span>
                        <button
                          onClick={() => toggleActive(u)}
                          title={u.is_active ? "Deactivate account" : "Reactivate account"}
                          style={{
                            background: "none", border: "none", cursor: "pointer",
                            display: "flex", alignItems: "center", gap: 6, padding: "2px 4px",
                            fontFamily: FONTS.mono, fontSize: 10, letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            color: u.is_active ? COLORS.emerald : COLORS.textTertiary,
                          }}
                        >
                          <span className="status-dot" style={{
                            background: u.is_active ? COLORS.emerald : COLORS.textTertiary,
                          }}/>
                          {u.is_active ? "Active" : "Disabled"}
                        </button>
                      </div>

                      <div style={{
                        fontFamily: FONTS.mono, fontSize: 10, color: COLORS.textSecondary,
                        textTransform: "uppercase", letterSpacing: "0.08em", minWidth: 90, textAlign: "right",
                      }}>
                        {u.meetings} meeting{u.meetings !== 1 ? "s" : ""}
                        <div style={{ fontSize: 9, color: COLORS.textTertiary, marginTop: 3, textTransform: "none", letterSpacing: 0 }}>
                          {u.last_login_at ? `Last seen ${fmtWhen(u.last_login_at)}` : "Never signed in"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ACTIVITY */}
              {tab === "activity" && (
                <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {users.filter(u => u.last_login_at)
                        .sort((a,b) => new Date(b.last_login_at) - new Date(a.last_login_at))
                        .map(u => ({ time: fmtWhen(u.last_login_at), user: u.name, action: "Signed in" }))
                        .map((a, i) => (
                    <div key={i} style={{
                      background: COLORS.surface, border: `1px solid ${COLORS.border}`,
                      padding: "10px 16px",
                      display: "flex", alignItems: "center", gap: 12,
                    }}>
                      <span className="status-dot" style={{ background: COLORS.violet }}/>
                      <span style={{ flex: 1, fontSize: 13, color: COLORS.textPrimary }}>
                        <span style={{ color: COLORS.emerald }}>{a.user}</span> · {a.action}
                      </span>
                      <span style={{
                        fontFamily: FONTS.mono, fontSize: 10, color: COLORS.textTertiary,
                        textTransform: "uppercase", letterSpacing: "0.08em",
                      }}>
                        {a.time}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* SYSTEM */}
              {tab === "system" && (
                <div className="fade-up" style={{ display: "grid", gap: 10 }}>
                  {[
                    { name: "FastAPI Backend",     status: "ok", detail: "Uptime 4d 12h · 312 requests today" },
                    { name: "Whisper Model",       status: "ok", detail: "small · 244 MB loaded" },
                    { name: "Groq API",            status: "ok", detail: "Llama 3.3 70B · 142/14,400 today" },
                    { name: "spaCy Tagger",        status: "ok", detail: "en_core_web_sm · ready" },
                    { name: "Diarization",         status: "ok", detail: "MFCC + clustering · stable" },
                    { name: "Storage",             status: "warning", detail: "2.3 GB / 5 GB · 46% full" },
                  ].map((s, i) => {
                    const ok = s.status === "ok";
                    const color = ok ? COLORS.emerald : COLORS.amber;
                    return (
                      <div key={i} className="corners" style={{
                        background: COLORS.surface, border: `1px solid ${COLORS.border}`,
                        padding: "14px 18px", display: "flex", alignItems: "center", gap: 14,
                      }}>
                        <span className="status-dot" style={{ background: color }}/>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 2 }}>{s.name}</div>
                          <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.textSecondary }}>
                            {s.detail}
                          </div>
                        </div>
                        <span style={{
                          fontFamily: FONTS.mono, fontSize: 10, color,
                          textTransform: "uppercase", letterSpacing: "0.1em",
                        }}>
                          {ok ? "OPERATIONAL" : "WARNING"}
                        </span>
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