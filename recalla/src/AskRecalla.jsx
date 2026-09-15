// ============================================================
// FILE PATH:  recalla/src/AskRecalla.jsx
// PURPOSE:    Full-focus chat. Renders preview cards for email drafts
//             (with Send/Cancel) and calendar events.
// ============================================================

import { useState, useRef, useEffect } from "react";
import { COLORS, FONTS, GLOBAL_CSS } from "./theme";
import Sidebar from "./Sidebar";
import { listChats, getChat, appendTurns, deleteChat, renameChat } from "./chats_api";
import { agentChat, getAgentStatus, sendEmailDraft, cancelEmailDraft } from "./agent_api";
import { useVoiceInput } from "./useVoiceInput";
import MicButton, { MicStatus } from "./MicButton";

// ── Email Preview Card ────────────────────────────────────────────────────
const EmailPreviewCard = ({ preview, draftId, onSent, onCancelled }) => {
  const [status, setStatus] = useState("pending"); // pending | sending | sent | cancelled | error
  const [error, setError]   = useState("");

  const handleSend = async () => {
    setStatus("sending");
    setError("");
    try {
      await sendEmailDraft(draftId);
      setStatus("sent");
      onSent?.();
    } catch (e) {
      setStatus("error");
      setError(e.message);
    }
  };

  const handleCancel = async () => {
    try {
      await cancelEmailDraft(draftId);
      setStatus("cancelled");
      onCancelled?.();
    } catch (e) {
      setError(e.message);
    }
  };

  const isLocked = status === "sent" || status === "cancelled" || status === "sending";

  return (
    <div className="corners corners-violet fade-up" style={{
      background: COLORS.surface,
      border: `1px solid ${status === "sent" ? COLORS.borderEmerald : COLORS.borderViolet}`,
      padding: "16px 18px", marginTop: 10, maxWidth: 540,
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 14, paddingBottom: 12, borderBottom: `1px solid ${COLORS.border}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="status-dot" style={{
            background: status === "sent" ? COLORS.emerald : status === "cancelled" ? COLORS.textTertiary : COLORS.violet,
          }}/>
          <span style={{
            fontFamily: FONTS.mono, fontSize: 10, fontWeight: 600,
            color: status === "sent" ? COLORS.emerald : status === "cancelled" ? COLORS.textTertiary : COLORS.violet,
            textTransform: "uppercase", letterSpacing: "0.1em",
          }}>
            {status === "sent" ? "Email Sent ✓" : status === "cancelled" ? "Cancelled" : status === "sending" ? "Sending..." : "Email Draft"}
          </span>
        </div>
      </div>

      {/* Fields */}
      <div style={{ marginBottom: 6 }}>
        <div style={{ fontFamily: FONTS.mono, fontSize: 9, color: COLORS.textTertiary, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 2 }}>To</div>
        <div style={{ fontSize: 13, color: COLORS.textPrimary, marginBottom: 10 }}>{preview.to}</div>
      </div>

      {preview.cc && (
        <div style={{ marginBottom: 6 }}>
          <div style={{ fontFamily: FONTS.mono, fontSize: 9, color: COLORS.textTertiary, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 2 }}>CC</div>
          <div style={{ fontSize: 13, color: COLORS.textPrimary, marginBottom: 10 }}>{preview.cc}</div>
        </div>
      )}

      <div style={{ marginBottom: 6 }}>
        <div style={{ fontFamily: FONTS.mono, fontSize: 9, color: COLORS.textTertiary, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 2 }}>Subject</div>
        <div style={{ fontSize: 14, fontWeight: 500, color: COLORS.textPrimary, marginBottom: 12 }}>{preview.subject}</div>
      </div>

      <div style={{
        fontSize: 13, lineHeight: 1.6, color: COLORS.textPrimary,
        whiteSpace: "pre-wrap", padding: "10px 12px",
        background: COLORS.bg, border: `1px solid ${COLORS.border}`,
        marginBottom: 14, fontFamily: FONTS.body,
      }}>
        {preview.body}
      </div>

      {error && (
        <div style={{
          color: COLORS.red, fontFamily: FONTS.mono, fontSize: 11,
          marginBottom: 10, padding: "6px 10px",
          background: "rgba(248,113,113,0.10)", border: "1px solid rgba(248,113,113,0.3)",
        }}>
          {error}
        </div>
      )}

      {/* Actions */}
      {!isLocked && (
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            onClick={handleCancel}
            style={{
              background: "transparent", border: `1px solid ${COLORS.border}`,
              color: COLORS.textSecondary, padding: "8px 16px",
              fontFamily: FONTS.mono, fontSize: 11, fontWeight: 600,
              textTransform: "uppercase", letterSpacing: "0.1em",
              cursor: "pointer", borderRadius: 999,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            style={{
              background: `linear-gradient(135deg, ${COLORS.emerald}, ${COLORS.cyan})`,
              color: COLORS.bg, border: "none", padding: "8px 22px",
              fontFamily: FONTS.mono, fontSize: 11, fontWeight: 600,
              textTransform: "uppercase", letterSpacing: "0.1em",
              cursor: "pointer", borderRadius: 999,
            }}
          >
            Send →
          </button>
        </div>
      )}
    </div>
  );
};

// ── Calendar Event Card ───────────────────────────────────────────────────
const CalendarEventCard = ({ event }) => {
  const start = event.start ? new Date(event.start) : null;
  return (
    <div className="corners corners-cyan fade-up" style={{
      background: COLORS.surface,
      border: `1px solid rgba(34,211,238,0.30)`,
      padding: "14px 18px", marginTop: 8, maxWidth: 480,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span className="status-dot" style={{ background: COLORS.cyan }}/>
        <span style={{
          fontFamily: FONTS.mono, fontSize: 10, fontWeight: 600, color: COLORS.cyan,
          textTransform: "uppercase", letterSpacing: "0.1em",
        }}>
          Calendar Event Created
        </span>
      </div>
      <div style={{ fontSize: 15, fontWeight: 500, color: COLORS.textPrimary, marginBottom: 6 }}>
        {event.title || event.summary}
      </div>
      <div style={{
        fontFamily: FONTS.mono, fontSize: 11, color: COLORS.textSecondary,
        display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
      }}>
        {start && <span>{start.toLocaleString()}</span>}
        {event.attendees && event.attendees.length > 0 && (
          <>
            <span style={{ color: COLORS.textTertiary }}>·</span>
            <span>{event.attendees.length} attendee{event.attendees.length !== 1 ? "s" : ""}</span>
          </>
        )}
        {event.html_link && (
          <>
            <span style={{ color: COLORS.textTertiary }}>·</span>
            <a href={event.html_link} target="_blank" rel="noreferrer" style={{ color: COLORS.cyan, textDecoration: "none" }}>
              Open in Google →
            </a>
          </>
        )}
      </div>
    </div>
  );
};

// ── Generic action card (reminders, etc.) ─────────────────────────────────
const ActionCard = ({ action }) => {
  // Email draft uses its own card
  if (action.tool === "draft_email" && action.result?.success && action.result?.preview) {
    return <EmailPreviewCard preview={action.result.preview} draftId={action.result.draft_id}/>;
  }

  // Calendar event creation uses its own card
  if (action.tool === "create_calendar_event" && action.result?.success) {
    return <CalendarEventCard event={action.result}/>;
  }

  // A link has to be tapped by the user. Browsers block a page from opening
  // apps on its own — deliberately — but a tap is a user gesture, so this is
  // what actually opens Netflix on the phone in their hand rather than on the
  // laptop running the backend.
  if (action.tool === "open_link" && action.result?.url) {
    return <OpenLinkCard result={action.result}/>;
  }

  // Generic action chip for everything else
  const isSuccess = action.result?.success;
  const accent = isSuccess ? COLORS.emerald : COLORS.red;

  let title  = action.tool;
  let detail = "";
  if (action.tool === "create_reminder" && action.result?.reminder) {
    title = "Reminder created";
    detail = `${action.result.reminder.title} — ${new Date(action.result.reminder.datetime).toLocaleString()}`;
  } else if (action.tool === "list_reminders") {
    title = "Looked up reminders"; detail = `${action.result?.count || 0} found`;
  } else if (action.tool === "complete_reminder") {
    title = "Marked complete"; detail = action.result?.message || "";
  } else if (action.tool === "delete_reminder") {
    title = "Deleted reminder"; detail = action.result?.message || "";
  } else if (action.tool === "list_calendar_events") {
    title = "Checked calendar"; detail = `${action.result?.count || 0} events`;
  } else if (action.tool === "find_free_slot") {
    title = "Found free slot"; detail = action.result?.message || "";
  } else if (action.tool === "delete_calendar_event") {
    title = "Event deleted"; detail = action.result?.message || "";
  } else if (action.tool === "read_recent_emails") {
    title = "Read inbox"; detail = `${action.result?.count || 0} emails`;
  } else if (action.tool === "search_emails") {
    title = "Searched emails"; detail = `${action.result?.count || 0} results`;
  } else if (!isSuccess) {
    detail = action.result?.error || action.result?.message || "Failed";
  }

  return (
    <div className="corners" style={{
      background: COLORS.surface, border: `1px solid ${COLORS.border}`,
      padding: "10px 14px", marginTop: 8,
      display: "flex", alignItems: "center", gap: 10,
      fontFamily: FONTS.mono, fontSize: 12, maxWidth: 420,
    }}>
      <span className="status-dot" style={{ background: accent }}/>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          color: accent, fontSize: 10, fontWeight: 600,
          textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2,
        }}>{title}</div>
        {detail && (
          <div style={{ color: COLORS.textSecondary, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {detail}
          </div>
        )}
      </div>
    </div>
  );
};

const OpenLinkCard = ({ result }) => {
  let host = result.url;
  try { host = new URL(result.url).hostname.replace(/^www\./, ""); } catch { /* keep raw */ }

  return (
    <a
      href={result.url}
      target="_blank"
      rel="noopener noreferrer"
      className="corners press"
      style={{
        display: "flex", alignItems: "center", gap: 11, marginTop: 8,
        maxWidth: 420, padding: "12px 15px", textDecoration: "none",
        background: COLORS.surface, border: `1px solid ${COLORS.emerald}`,
      }}
    >
      <span style={{ fontSize: 15, color: COLORS.emerald }}>↗</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: FONTS.mono, fontSize: 10, fontWeight: 600, color: COLORS.emerald,
          textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3,
        }}>
          {result.label || "Open"}
        </div>
        <div style={{
          fontSize: 12, color: COLORS.textSecondary,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {host}
        </div>
        {result.note && (
          <div style={{ fontSize: 11, color: COLORS.textTertiary, marginTop: 3 }}>
            {result.note}
          </div>
        )}
      </div>
      <span style={{
        fontFamily: FONTS.mono, fontSize: 10, color: COLORS.textTertiary,
        textTransform: "uppercase", letterSpacing: "0.08em",
      }}>Tap</span>
    </a>
  );
};

// ── Single chat message ───────────────────────────────────────────────────
const Message = ({ msg, actions }) => {
  const isUser = msg.role === "user";
  return (
    <div className="fade-up" style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", marginBottom: 18 }}>
      <div style={{ maxWidth: "78%", display: "flex", flexDirection: "column", alignItems: isUser ? "flex-end" : "flex-start" }}>
        <div style={{
          fontFamily: FONTS.mono, fontSize: 10, fontWeight: 600,
          color: isUser ? COLORS.violet : COLORS.emerald,
          textTransform: "uppercase", letterSpacing: "0.1em",
          marginBottom: 6, display: "flex", alignItems: "center", gap: 6,
        }}>
          <span className="status-dot" style={{ background: isUser ? COLORS.violet : COLORS.emerald }}/>
          {isUser ? "You" : "Recalla"}
        </div>
        <div style={{
          background: isUser ? "rgba(167,139,250,0.08)" : COLORS.surface,
          border: `1px solid ${isUser ? COLORS.borderViolet : COLORS.border}`,
          padding: "12px 16px", color: COLORS.textPrimary,
          fontSize: 14, lineHeight: 1.6, fontFamily: FONTS.body,
          whiteSpace: "pre-wrap", wordBreak: "break-word",
        }}>
          {msg.content || "..."}
        </div>
        {!isUser && actions && actions.length > 0 && (
          <div style={{ width: "100%" }}>
            {actions.map((a, i) => <ActionCard key={i} action={a}/>)}
          </div>
        )}
      </div>
    </div>
  );
};

const Thinking = () => (
  <div className="fade-up" style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", marginBottom: 18 }}>
    <span className="status-dot" style={{ background: COLORS.emerald, animationDuration: "1s" }}/>
    <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.textSecondary, textTransform: "uppercase", letterSpacing: "0.1em" }}>
      Thinking...
    </span>
  </div>
);

const SUGGESTIONS = [
  "Email Muzammal about the API bug",
  "Schedule a 30-min sync with Adnan tomorrow at 3pm",
  "What's on my calendar this week?",
  "Remind me to submit the FYP report by Friday",
];

export default function AskRecalla({ navigate , user }) {
  const [messages, setMessages] = useState([]);
  const [history, setHistory]   = useState([]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [agentStatus, setAgentStatus] = useState({ groq_configured: false, google_configured: false });
  const [voiceError, setVoiceError] = useState(null);
  const [sessions, setSessions]     = useState([]);
  const [sessionId, setSessionId]   = useState(null);
  const [panelOpen, setPanelOpen]   = useState(true);
  const scrollRef = useRef(null);

  // sendMessage saves the exchange when it finishes, by which time a state
  // update would be a render behind. A ref always holds the current session.
  const sessionRef = useRef(null);
  const setSession = (id) => { sessionRef.current = id; setSessionId(id); };

  const refreshSessions = () =>
    listChats().then(d => setSessions(d.sessions || [])).catch(() => {});

  // Speaking is the primary flow: a finished utterance is sent straight away
  // rather than dropped into the box for the user to confirm.
  const voice = useVoiceInput({
    onResult: (text) => { setVoiceError(null); sendMessage(text); },
    onError: (msg) => setVoiceError(msg),
  });

  useEffect(() => {
    getAgentStatus().then(setAgentStatus);
    refreshSessions();
    // Pull pending question from dashboard if exists
    const pending = localStorage.getItem("recalla_pending_question");
    if (pending) {
      localStorage.removeItem("recalla_pending_question");
      setTimeout(() => sendMessage(pending), 200);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const message = (text || input).trim();
    if (!message || loading) return;
    setMessages(m => [...m, { role: "user", content: message }]);
    setInput("");
    setLoading(true);
    try {
      const res = await agentChat(message, history);
      // ActionCard renders from { tool, result }. The backend reports every
      // call it made in tool_calls as { name, args, result }, so map that —
      // action_card only ever covered a couple of tool shapes.
      const cards = (res.tool_calls || []).map(t => ({ tool: t.name, args: t.args, result: t.result }));
      setMessages(m => [...m, { role: "assistant", content: res.response, actions: cards }]);
      setHistory(res.history || []);

      // Save the pair together, so a failed reply never leaves a question
      // stored with nothing beside it.
      try {
        const saved = await appendTurns(sessionRef.current, [
          { role: "user", content: message },
          { role: "assistant", content: res.response, actions: cards },
        ]);
        if (!sessionRef.current) setSession(saved.session_id);
        refreshSessions();
      } catch { /* history is a convenience; never break the chat over it */ }
    } catch (err) {
      setMessages(m => [...m, { role: "assistant", content: `Error: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const openSession = async (id) => {
    if (id === sessionRef.current) return;
    try {
      const c = await getChat(id);
      setMessages((c.messages || []).map(m => ({
        role: m.role, content: m.content, actions: m.actions || [],
      })));
      // Replay the text of the conversation so the agent keeps its thread —
      // tool call plumbing is not restored, only what was said.
      setHistory((c.messages || []).map(m => ({ role: m.role, content: m.content })));
      setSession(id);
    } catch { /* a deleted session just stays unopened */ }
  };

  const newSession = () => {
    setMessages([]); setHistory([]); setSession(null);
  };

  const removeSession = async (id, e) => {
    e.stopPropagation();
    try {
      await deleteChat(id);
      if (id === sessionRef.current) newSession();
      refreshSessions();
    } catch { /* ignore */ }
  };

  const retitle = async (id, e) => {
    e.stopPropagation();
    const current = sessions.find(x => x.id === id);
    const next = window.prompt("Rename this chat", current?.title || "");
    if (next === null) return;
    try { await renameChat(id, next); refreshSessions(); } catch { /* ignore */ }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const statusLabel = agentStatus.google_configured
    ? "Reminders · Calendar · Email"
    : "Reminders only — Google not configured";

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <style>{`
        .chat-panel {
          width: 244px; flex-shrink: 0; display: flex; flex-direction: column;
          background: var(--surface); border-right: 1px solid var(--border);
        }
        .new-chat {
          width: 100%; padding: 9px 12px; border-radius: 10px; cursor: pointer;
          background: transparent; border: 1px dashed var(--border);
          color: var(--text-secondary); font-family: ${FONTS.mono}; font-size: 11.5;
          letter-spacing: .06em; transition: all .18s ease;
        }
        .new-chat:hover { border-color: var(--border-emerald); color: var(--emerald); }
        .chat-row {
          display: flex; align-items: center; gap: 6px;
          padding: 9px 10px; border-radius: 9px; cursor: pointer;
          transition: background .15s ease;
        }
        .chat-row:hover { background: var(--surface-raised); }
        .chat-row.on { background: var(--surface-raised); box-shadow: inset 2px 0 0 var(--emerald); }
        .chat-row-title {
          font-size: 12.5px; color: var(--text-primary);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .chat-row-acts { display: flex; gap: 2px; opacity: 0; transition: opacity .15s ease; }
        .chat-row:hover .chat-row-acts { opacity: 1; }
        .chat-row-acts button {
          background: none; border: none; cursor: pointer; padding: 2px 5px;
          color: var(--text-tertiary); font-size: 13px; line-height: 1; border-radius: 5px;
        }
        .chat-row-acts button:hover { color: var(--text-primary); background: var(--bg); }
        @media (max-width: 760px) { .chat-panel { display: none; } }
      `}</style>
      <div style={{ display: "flex", height: "100vh", width: "100vw", background: COLORS.bg }}>
        <Sidebar active="ask" navigate={navigate} user={user}/>

        {panelOpen && (
          <aside className="chat-panel">
            <div style={{ padding: "16px 14px 10px" }}>
              <button onClick={newSession} className="press new-chat">+ New chat</button>
            </div>

            <div style={{
              fontFamily: FONTS.mono, fontSize: 9, letterSpacing: "0.12em",
              textTransform: "uppercase", color: COLORS.textTertiary,
              padding: "2px 16px 8px",
            }}>
              {sessions.length ? `${sessions.length} saved` : "No saved chats"}
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "0 8px 16px" }}>
              {sessions.map(sv => (
                <div key={sv.id}
                     onClick={() => openSession(sv.id)}
                     className={`chat-row ${sv.id === sessionId ? "on" : ""}`}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="chat-row-title">{sv.title}</div>
                    <div style={{
                      fontFamily: FONTS.mono, fontSize: 9.5, color: COLORS.textTertiary,
                      marginTop: 2,
                    }}>
                      {sv.message_count} message{sv.message_count === 1 ? "" : "s"}
                    </div>
                  </div>
                  <div className="chat-row-acts">
                    <button title="Rename" onClick={(e) => retitle(sv.id, e)}>✎</button>
                    <button title="Delete" onClick={(e) => removeSession(sv.id, e)}>×</button>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        )}

        <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
          <header style={{
            padding: "18px 28px", borderBottom: `1px solid ${COLORS.border}`,
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div>
              <div style={{ fontFamily: FONTS.heading, fontSize: 26, lineHeight: 1, textTransform: "uppercase", letterSpacing: "0.02em" }}>
                Ask <span style={{ color: COLORS.emerald }}>Recalla</span>
              </div>
              <div style={{
                fontFamily: FONTS.mono, fontSize: 10, color: COLORS.textSecondary,
                marginTop: 4, textTransform: "uppercase", letterSpacing: "0.12em",
                display: "flex", alignItems: "center", gap: 6,
              }}>
                <span className="status-dot" style={{ background: agentStatus.groq_configured ? COLORS.emerald : COLORS.red }}/>
                {statusLabel}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              onClick={() => setPanelOpen(o => !o)}
              title={panelOpen ? "Hide chat history" : "Show chat history"}
              style={{
                background: "transparent", border: `1px solid ${COLORS.border}`,
                color: COLORS.textSecondary, padding: "6px 12px",
                fontFamily: FONTS.mono, fontSize: 11,
                cursor: "pointer", borderRadius: 999,
              }}
            >
              {panelOpen ? "‹ History" : "History ›"}
            </button>
            {messages.length > 0 && (
              <button
                onClick={newSession}
                style={{
                  background: "transparent", border: `1px solid ${COLORS.border}`,
                  color: COLORS.textSecondary, padding: "6px 14px",
                  fontFamily: FONTS.mono, fontSize: 11,
                  textTransform: "uppercase", letterSpacing: "0.1em",
                  cursor: "pointer", borderRadius: 999, transition: "all 0.2s",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = COLORS.emerald; e.currentTarget.style.color = COLORS.emerald; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = COLORS.border; e.currentTarget.style.color = COLORS.textSecondary; }}
              >
                New
              </button>
            )}
            </div>
          </header>

          <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "32px 40px" }}>
            <div style={{ maxWidth: 760, width: "100%", margin: "0 auto" }}>
              {messages.length === 0 && (
                <div style={{ textAlign: "center", padding: "60px 20px" }} className="fade-up">
                  <div style={{
                    fontFamily: FONTS.heading, fontSize: 52, lineHeight: 1.05,
                    textTransform: "uppercase", letterSpacing: "0.01em", marginBottom: 14,
                  }}>
                    What can I<br/><span style={{
                      background: `linear-gradient(135deg, ${COLORS.emerald}, ${COLORS.cyan})`,
                      WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                    }}>do for you?</span>
                  </div>
                  <div style={{ fontSize: 14, color: COLORS.textSecondary, maxWidth: 480, margin: "0 auto 36px", lineHeight: 1.6 }}>
                    Send emails, schedule meetings, set reminders. I'll always show a preview before sending email.
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", maxWidth: 600, margin: "0 auto" }}>
                    {SUGGESTIONS.map((s, i) => (
                      <button
                        key={i} onClick={() => sendMessage(s)}
                        style={{
                          background: COLORS.surface, border: `1px solid ${COLORS.border}`,
                          color: COLORS.textPrimary, padding: "10px 16px",
                          fontFamily: FONTS.body, fontSize: 12,
                          cursor: "pointer", borderRadius: 999, transition: "all 0.2s",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = COLORS.borderEmerald; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = COLORS.border; }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((m, i) => <Message key={i} msg={m} actions={m.actions}/>)}
              {loading && <Thinking/>}
            </div>
          </div>

          <div style={{ padding: "20px 40px 28px", borderTop: `1px solid ${COLORS.border}`, background: COLORS.bg }}>
            <div className="corners" style={{
              maxWidth: 760, margin: "0 auto",
              background: COLORS.surface, border: `1px solid ${COLORS.border}`,
              padding: "4px 4px 4px 16px",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <input
                type="text" value={input}
                onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
                placeholder={voice.listening ? "Listening…" : "Ask Recalla, or tap the mic and speak"}
                disabled={loading || voice.listening}
                style={{
                  flex: 1, background: "transparent", border: "none", outline: "none",
                  color: COLORS.textPrimary, fontFamily: FONTS.body, fontSize: 14, padding: "12px 0",
                }}
              />

              <MicButton
                supported={voice.supported}
                listening={voice.listening}
                transcribing={voice.transcribing}
                level={voice.level}
                onClick={voice.toggle}
                size={38}
              />
              <button
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
                style={{
                  background: input.trim() && !loading
                    ? `linear-gradient(135deg, ${COLORS.emerald}, ${COLORS.cyan})`
                    : COLORS.surfaceRaised,
                  color: input.trim() && !loading ? COLORS.onAccent : COLORS.textTertiary,
                  border: "none", padding: "10px 22px",
                  fontFamily: FONTS.mono, fontSize: 12, fontWeight: 600,
                  textTransform: "uppercase", letterSpacing: "0.1em",
                  cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                }}
              >
                Send
              </button>
            </div>
            <div style={{
              maxWidth: 760, margin: "8px auto 0", minHeight: 18,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              fontFamily: FONTS.mono, fontSize: 10, color: COLORS.textTertiary,
              textTransform: "uppercase", letterSpacing: "0.1em", textAlign: "center",
            }}>
              {voiceError ? (
                <span style={{ color: COLORS.amber, textTransform: "none", letterSpacing: 0, fontFamily: FONTS.body, fontSize: 12.5 }}>
                  {voiceError}
                </span>
              ) : (voice.listening || voice.transcribing) ? (
                <MicStatus listening={voice.listening} transcribing={voice.transcribing}
                           interim={voice.interim} engine={voice.engine} />
              ) : (
                <span>{voice.supported ? "Press Enter to send · or tap the mic" : "Press Enter to send"}</span>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}