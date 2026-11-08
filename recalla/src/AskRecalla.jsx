// ============================================================
// FILE PATH:  recalla/src/AskRecalla.jsx
// PURPOSE:    Chat with Recalla. Renders preview cards for email drafts
//             (with Send/Cancel) and calendar events. Past chats open
//             from a sheet on phones and a side panel on wide screens.
// ============================================================

import { useState, useRef, useEffect } from "react";
import {
  Sparkles, ArrowUp, Plus, MessagesSquare, Pencil, Trash2, Mail, CalendarCheck,
  CheckCircle2, XCircle, ExternalLink, Loader2, Send,
} from "lucide-react";
import { listChats, getChat, appendTurns, deleteChat, renameChat } from "./chats_api";
import { agentChat, getAgentStatus, sendEmailDraft, cancelEmailDraft } from "./agent_api";
import { useVoiceInput } from "./useVoiceInput";
import MicButton, { MicStatus } from "./MicButton";
import { Screen, Sheet } from "./ui/kit";
import { useConfirm } from "./ui/useConfirm";
import Markdown from "./ui/Markdown";

// ── Email preview: nothing is sent until the user says so ─────────────────
const EmailPreviewCard = ({ preview, draftId }) => {
  const [status, setStatus] = useState("pending"); // pending | sending | sent | cancelled | error
  const [error, setError]   = useState("");

  const send = async () => {
    setStatus("sending"); setError("");
    try { await sendEmailDraft(draftId); setStatus("sent"); }
    catch (e) { setStatus("error"); setError(e.message); }
  };
  const cancel = async () => {
    try { await cancelEmailDraft(draftId); setStatus("cancelled"); }
    catch (e) { setError(e.message); }
  };

  const head = {
    sent:      { text: "Email sent", cls: "text-brand", Icon: CheckCircle2 },
    cancelled: { text: "Draft discarded", cls: "text-subtle", Icon: XCircle },
    sending:   { text: "Sending…", cls: "text-ai", Icon: Loader2 },
  }[status] || { text: "Email draft — check before sending", cls: "text-ai", Icon: Mail };

  return (
    <div className={`card mt-2 w-full overflow-hidden animate-rise ${status === "sent" ? "border-brand/40" : "border-ai/40"}`}>
      <div className={`flex items-center gap-2 border-b border-line px-4 py-2.5 text-sm font-semibold ${head.cls}`}>
        <head.Icon size={16} className={status === "sending" ? "animate-spin" : ""} /> {head.text}
      </div>
      <dl className="space-y-2 px-4 pt-3 text-sm">
        <div className="flex gap-2"><dt className="w-14 shrink-0 text-subtle">To</dt><dd className="min-w-0 break-words">{preview.to}</dd></div>
        {preview.cc && <div className="flex gap-2"><dt className="w-14 shrink-0 text-subtle">Cc</dt><dd className="min-w-0 break-words">{preview.cc}</dd></div>}
        <div className="flex gap-2"><dt className="w-14 shrink-0 text-subtle">Subject</dt><dd className="min-w-0 font-medium">{preview.subject}</dd></div>
      </dl>
      <p className="m-4 mt-3 rounded-xl bg-surface-3/50 p-3 text-sm leading-relaxed whitespace-pre-wrap">{preview.body}</p>
      {error && <p className="mx-4 mb-3 text-sm text-danger">{error}</p>}
      {(status === "pending" || status === "error") && (
        <div className="flex gap-2 px-4 pb-4">
          <button onClick={cancel} className="btn btn-secondary flex-1">Discard</button>
          <button onClick={send} className="btn btn-primary flex-1"><Send size={16} /> Send</button>
        </div>
      )}
    </div>
  );
};

const CalendarEventCard = ({ event }) => {
  const start = event.start ? new Date(event.start) : null;
  return (
    <div className="card mt-2 flex w-full gap-3 border-info/40 p-3.5 animate-rise">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-info/12 text-info"><CalendarCheck size={20} /></span>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-semibold text-info">Added to your calendar</div>
        <div className="font-medium">{event.title || event.summary}</div>
        <div className="mt-0.5 text-[13px] text-subtle">
          {start && start.toLocaleString(undefined, { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
          {event.attendees?.length > 0 && ` · ${event.attendees.length} invited`}
        </div>
        {event.html_link && (
          <a href={event.html_link} target="_blank" rel="noreferrer"
             className="mt-2 inline-flex min-h-9 items-center gap-1 text-sm font-medium text-info">
            Open in Google Calendar <ExternalLink size={14} />
          </a>
        )}
      </div>
    </div>
  );
};

// A link has to be tapped by the user. Browsers block a page from opening
// apps on its own — deliberately — but a tap is a user gesture, so this is
// what actually opens Netflix on the phone in their hand rather than on the
// laptop running the backend.
const OpenLinkCard = ({ result }) => {
  let host = result.url;
  try { host = new URL(result.url).hostname.replace(/^www\./, ""); } catch { /* keep raw */ }
  return (
    <a href={result.url} target="_blank" rel="noopener noreferrer"
       className="card-tap mt-2 flex w-full items-center gap-3 border-brand/40 p-3.5">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand/12 text-brand"><ExternalLink size={19} /></span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium">{result.label || "Open"}</span>
        <span className="block truncate text-[13px] text-subtle">{result.note || host}</span>
      </span>
      <span className="text-sm font-semibold text-brand">Open</span>
    </a>
  );
};

const TOOL_LABEL = {
  create_reminder: "Reminder set", list_reminders: "Checked reminders",
  complete_reminder: "Marked done", delete_reminder: "Reminder deleted",
  list_calendar_events: "Checked calendar", find_free_slot: "Found a free slot",
  delete_calendar_event: "Event deleted", read_recent_emails: "Read inbox",
  search_emails: "Searched email", search_memory: "Searched your meetings",
  decision_history: "Checked past decisions", list_commitments: "Checked commitments",
  meeting_timeline: "Checked meeting history", recurring_themes: "Looked for recurring topics",
  send_email_draft: "Email sent", cancel_email_draft: "Draft discarded",
  create_folder: "Folder created", create_project: "Project created", list_folder: "Looked in folder",
  open_app: "Opened app", open_path: "Opened file",
};

const ActionCard = ({ action }) => {
  const r = action.result;
  if (action.tool === "draft_email" && r?.success && r?.preview) return <EmailPreviewCard preview={r.preview} draftId={r.draft_id} />;
  if (action.tool === "create_calendar_event" && r?.success) return <CalendarEventCard event={r} />;
  if (action.tool === "open_link" && r?.url) return <OpenLinkCard result={r} />;

  const ok = r?.success !== false;
  let detail;
  if (action.tool === "create_reminder" && r?.reminder) {
    detail = `${r.reminder.title} · ${new Date(r.reminder.datetime).toLocaleString(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" })}`;
  } else if (r?.count != null) detail = `${r.count} found`;
  else if (!ok) detail = r?.error || r?.message || "Didn't work";
  else detail = r?.message || "";

  return (
    <div className="mt-1.5 inline-flex max-w-full items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-[13px]">
      {ok ? <CheckCircle2 size={15} className="shrink-0 text-brand" /> : <XCircle size={15} className="shrink-0 text-danger" />}
      <span className="font-medium">{TOOL_LABEL[action.tool] || action.tool.replace(/_/g, " ")}</span>
      {detail && <span className="truncate text-subtle">{detail}</span>}
    </div>
  );
};

const Message = ({ msg }) => {
  if (msg.role === "user") {
    return (
      <div className="mb-4 flex justify-end animate-rise">
        <div className="max-w-[85%] rounded-3xl rounded-br-lg bg-ai-fill px-4 py-2.5 text-[15px] leading-relaxed text-white whitespace-pre-wrap break-words">
          {msg.content}
        </div>
      </div>
    );
  }
  return (
    <div className="mb-5 flex gap-2.5 animate-rise">
      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-ai/15 text-ai"><Sparkles size={16} /></span>
      <div className="min-w-0 flex-1">
        <div className={`text-[15px] leading-relaxed break-words ${msg.error ? "text-danger" : ""}`}>
          <Markdown text={msg.content || "…"} />
        </div>
        {msg.actions?.length > 0 && (
          <div className="flex flex-col items-start">{msg.actions.map((a, i) => <ActionCard key={i} action={a} />)}</div>
        )}
      </div>
    </div>
  );
};

const Thinking = () => (
  <div className="mb-5 flex items-center gap-2.5" role="status">
    <span className="grid size-8 place-items-center rounded-full bg-ai/15 text-ai"><Sparkles size={16} /></span>
    <span className="flex gap-1" aria-label="Recalla is thinking">
      {[0, 150, 300].map((d) => <span key={d} className="size-2 rounded-full bg-ai animate-blink" style={{ animationDelay: `${d}ms` }} />)}
    </span>
  </div>
);

const SUGGESTIONS = [
  { group: "Your meetings", items: ["What did we decide in my last meeting?", "Which tasks were assigned to me this week?"] },
  { group: "Calendar",      items: ["What's on my calendar tomorrow?", "Find a free 30-minute slot on Friday"] },
  { group: "Email",         items: ["Summarise my unread emails", "Email the team the notes from today's meeting"] },
  { group: "Reminders",     items: ["Remind me to submit the report on Friday at 5"] },
];

export default function AskRecalla() {
  const [messages, setMessages] = useState([]);
  const [history, setHistory]   = useState([]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [agentStatus, setAgentStatus] = useState({ groq_configured: true, google_configured: false });
  const [voiceError, setVoiceError] = useState(null);
  const [sessions, setSessions]   = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [confirm, confirmDialog] = useConfirm();
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  // sendMessage saves the exchange when it finishes, by which time a state
  // update would be a render behind. A ref always holds the current session.
  const sessionRef = useRef(null);
  const setSession = (id) => { sessionRef.current = id; setSessionId(id); };

  const refreshSessions = () => listChats().then((d) => setSessions(d.sessions || [])).catch(() => {});

  // Speaking is the primary flow: a finished utterance is sent straight away
  // rather than dropped into the box for the user to confirm.
  const voice = useVoiceInput({
    onResult: (text) => { setVoiceError(null); sendMessage(text); },
    onError: (msg) => setVoiceError(msg),
  });

  useEffect(() => {
    getAgentStatus().then(setAgentStatus).catch(() => {});
    refreshSessions();
    // A question asked from Home arrives here.
    const pending = localStorage.getItem("recalla_pending_question");
    if (pending) {
      localStorage.removeItem("recalla_pending_question");
      setTimeout(() => sendMessage(pending), 150);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Follow the newest message — but leave the welcome screen at its top.
  useEffect(() => {
    const el = scrollRef.current;
    if (el && (messages.length || loading)) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  // Grow the box with the question, up to a few lines.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, [input]);

  async function sendMessage(text) {
    const message = (text ?? input).trim();
    if (!message || loading) return;
    setMessages((m) => [...m, { role: "user", content: message }]);
    setInput("");
    setLoading(true);
    try {
      const res = await agentChat(message, history);
      // ActionCard renders from { tool, result }. The backend reports every
      // call it made in tool_calls as { name, args, result }.
      const cards = (res.tool_calls || []).map((t) => ({ tool: t.name, args: t.args, result: t.result }));
      setMessages((m) => [...m, { role: "assistant", content: res.response, actions: cards }]);
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
      setMessages((m) => [...m, { role: "assistant", error: true,
        content: `Sorry — that didn't go through. ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  }

  const openSession = async (id) => {
    setHistoryOpen(false);
    if (id === sessionRef.current) return;
    try {
      const c = await getChat(id);
      setMessages((c.messages || []).map((m) => ({ role: m.role, content: m.content, actions: m.actions || [] })));
      // Replay the text of the conversation so the agent keeps its thread —
      // tool call plumbing is not restored, only what was said.
      setHistory((c.messages || []).map((m) => ({ role: m.role, content: m.content })));
      setSession(id);
    } catch { /* a deleted session just stays unopened */ }
  };

  const newSession = () => { setMessages([]); setHistory([]); setSession(null); setHistoryOpen(false); };

  const removeSession = async (id) => {
    if (!(await confirm({ title: "Delete this chat?", body: "The conversation will be removed.", action: "Delete" }))) return;
    try {
      await deleteChat(id);
      if (id === sessionRef.current) newSession();
      refreshSessions();
    } catch { /* ignore */ }
  };

  const retitle = async (id) => {
    const current = sessions.find((x) => x.id === id);
    const next = window.prompt("Rename this chat", current?.title || "");
    if (next === null || !next.trim()) return;
    try { await renameChat(id, next.trim()); refreshSessions(); } catch { /* ignore */ }
  };

  const can = agentStatus.google_configured
    ? "Meetings, reminders, Gmail and Calendar"
    : "Meetings and reminders · connect Google for email & calendar";

  const chatList = (
    <div className="space-y-0.5">
      {sessions.length === 0 && <p className="px-3 py-6 text-center text-sm text-subtle">No saved chats yet.</p>}
      {sessions.map((s) => (
        <div key={s.id} className={`group flex items-center rounded-xl ${s.id === sessionId ? "bg-surface-3" : "hover:bg-surface-2"}`}>
          <button onClick={() => openSession(s.id)} className="min-h-12 min-w-0 flex-1 px-3 py-2 text-left">
            <span className="block truncate text-sm font-medium">{s.title}</span>
            <span className="block text-xs text-subtle">{s.message_count} message{s.message_count === 1 ? "" : "s"}</span>
          </button>
          <button onClick={() => retitle(s.id)} aria-label="Rename chat" className="icon-btn size-9 lg:opacity-0 lg:group-hover:opacity-100"><Pencil size={15} /></button>
          <button onClick={() => removeSession(s.id)} aria-label="Delete chat" className="icon-btn size-9 hover:text-danger lg:opacity-0 lg:group-hover:opacity-100"><Trash2 size={15} /></button>
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex h-full">
      {/* Wide screens: past chats alongside */}
      <aside className="glass-panel hidden w-72 shrink-0 flex-col border-r border-line xl:flex">
        <div className="p-3">
          <button onClick={newSession} className="btn btn-secondary w-full"><Plus size={18} /> New chat</button>
        </div>
        <div className="eyebrow px-5 pb-2">Recent chats</div>
        <div className="flex-1 overflow-y-auto px-2 pb-4">{chatList}</div>
      </aside>

      <div className="min-w-0 flex-1">
        <Screen
          scroll={false}
          title="Ask Recalla"
          subtitle={agentStatus.groq_configured ? can : "AI is not configured on the server"}
          actions={<>
            <button className="icon-btn xl:hidden" onClick={() => setHistoryOpen(true)} aria-label="Past chats">
              <MessagesSquare size={21} />
            </button>
            {messages.length > 0 && (
              <button className="icon-btn" onClick={newSession} aria-label="New chat"><Plus size={22} /></button>
            )}
          </>}
        >
          <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <div className="mx-auto w-full max-w-3xl px-4 pt-5 pb-4 sm:px-6">
              {messages.length === 0 ? (
                <div className="animate-rise">
                  <div className="mb-6 text-center">
                    <span className="mx-auto mb-3 grid size-14 place-items-center rounded-2xl bg-ai/15 text-ai"><Sparkles size={26} /></span>
                    <h2 className="text-2xl font-bold tracking-tight">What can I help with?</h2>
                    <p className="mx-auto mt-1.5 max-w-md text-[15px] leading-relaxed text-muted">
                      Ask about anything said in your meetings, or have me handle email,
                      calendar and reminders. I always show you an email before it's sent.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {SUGGESTIONS.map((g) => (
                      <div key={g.group}>
                        <div className="eyebrow mb-2">{g.group}</div>
                        <div className="space-y-2">
                          {g.items.map((s) => (
                            <button key={s} onClick={() => sendMessage(s)}
                                    className="card-tap w-full px-3.5 py-3 text-left text-[15px]">{s}</button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : messages.map((m, i) => <Message key={i} msg={m} />)}
              {loading && <Thinking />}
            </div>
          </div>

          {/* Composer: sits above the phone tab bar */}
          <div className="glass-bar border-t border-line px-3 pt-2.5 pb-[calc(84px+env(safe-area-inset-bottom))] backdrop-blur lg:pb-4">
            <form className="mx-auto flex max-w-3xl items-end gap-2" onSubmit={(e) => { e.preventDefault(); sendMessage(); }}>
              <div className="flex min-w-0 flex-1 items-end rounded-3xl border border-line bg-surface-2 py-1 pr-1 pl-4 focus-within:border-ai">
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    // Enter sends on a keyboard; on a phone the return key adds a line.
                    if (e.key === "Enter" && !e.shiftKey && !("ontouchstart" in window)) { e.preventDefault(); sendMessage(); }
                  }}
                  placeholder={voice.listening ? "Listening…" : "Message Recalla"}
                  disabled={voice.listening}
                  aria-label="Message Recalla"
                  className="max-h-36 min-h-10 min-w-0 flex-1 resize-none bg-transparent py-2 text-base leading-snug outline-none placeholder:text-subtle"
                />
                <MicButton supported={voice.supported} listening={voice.listening} transcribing={voice.transcribing}
                           level={voice.level} onClick={voice.toggle} size={40} />
              </div>
              <button type="submit" disabled={loading || !input.trim()} aria-label="Send"
                      className="grid size-12 shrink-0 place-items-center rounded-full bg-ai-fill text-white transition-[opacity,scale] hover:scale-105 disabled:opacity-30">
                <ArrowUp size={22} strokeWidth={2.4} />
              </button>
            </form>
            {(voiceError || voice.listening || voice.transcribing) && (
              <div className="mx-auto mt-1.5 max-w-3xl px-2">
                {voiceError ? <p className="text-sm text-warn">{voiceError}</p>
                  : <MicStatus listening={voice.listening} transcribing={voice.transcribing}
                               interim={voice.interim} engine={voice.engine} />}
              </div>
            )}
          </div>
        </Screen>
      </div>

      <Sheet open={historyOpen} onClose={() => setHistoryOpen(false)} title="Past chats" labelledBy="past-chats">
        <button onClick={newSession} className="btn btn-secondary mb-3 w-full"><Plus size={18} /> New chat</button>
        {chatList}
      </Sheet>
      {confirmDialog}
    </div>
  );
}
