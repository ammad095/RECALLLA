// ============================================================
// FILE PATH:  recalla/src/Connectors.jsx
// PURPOSE:    Manage which services Recalla can act on.
//
//             Each card states what it can do and — where a service can't be
//             connected — exactly what is blocking it. A greyed card with a
//             reason is more useful than a button that fails.
// ============================================================

import { useState, useEffect } from "react";
import {
  Mail, MessageCircle, Send, Phone, Hash, NotebookText, Briefcase, AtSign, Camera, Monitor,
  Plug, Check, Copy, ChevronDown, CircleAlert,
} from "lucide-react";
import { authFetch } from "./auth_api";
import { API_HOST, isSameMachineAsBackend } from "./config";
import { Screen, Banner, SkeletonList } from "./ui/kit";

const STATE = {
  connected:      { label: "Connected",          cls: "bg-brand/12 text-brand" },
  partial:        { label: "Needs attention",    cls: "bg-warn/15 text-warn" },
  available:      { label: "Not connected",      cls: "bg-surface-3 text-muted" },
  needs_setup:    { label: "Setup needed",       cls: "bg-warn/15 text-warn" },
  needs_provider: { label: "Needs a paid service", cls: "bg-surface-3 text-subtle" },
  planned:        { label: "Coming soon",        cls: "bg-info/12 text-info" },
  blocked:        { label: "Not possible",       cls: "bg-surface-3 text-subtle" },
};

const ICONS = {
  google: Mail, whatsapp: MessageCircle, telegram: Send, phone: Phone, slack: Hash,
  notion: NotebookText, linkedin: Briefcase, x: AtSign, instagram: Camera, desktop: Monitor,
};

const stateOf = (c) => (c.connected && c.state === "available" ? "connected" : c.state);
const rank = { connected: 0, partial: 1, available: 2, needs_setup: 3 };

export default function Connectors() {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [busy, setBusy]       = useState(null);
  const [showLater, setShowLater] = useState(false);
  // Link codes, keyed by connector. Both WhatsApp and Telegram prove identity
  // the same way: a code minted from a signed-in session, sent from the app.
  const [codes, setCodes] = useState({});

  const load = async () => {
    try {
      const res = await authFetch(`${API_HOST}/api/connectors`);
      if (!res.ok) throw new Error("Could not load connectors");
      const data = await res.json();
      setItems(data.connectors || []);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let alive = true;
    authFetch(`${API_HOST}/api/connectors`)
      .then((res) => { if (!res.ok) throw new Error("Could not load connectors"); return res.json(); })
      .then((data) => { if (alive) { setItems(data.connectors || []); setError(null); } })
      .catch((e) => alive && setError(e.message))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  const connectGoogle = async () => {
    setBusy("google");
    try {
      const res = await authFetch(`${API_HOST}/api/connectors/google/authorize`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Could not start Google sign-in");
      // Consent opens in a popup; refresh status when it closes.
      const w = window.open(data.url, "recalla-google", "width=520,height=640");
      const poll = setInterval(() => {
        if (!w || w.closed) { clearInterval(poll); load(); setBusy(null); }
      }, 800);
    } catch (e) {
      setError(e.message);
      setBusy(null);
    }
  };

  const linkByCode = (id) => async () => {
    setBusy(id);
    try {
      const res = await authFetch(`${API_HOST}/api/${id}/link-code`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Could not create a code");
      setCodes((c) => ({ ...c, [id]: data }));
      // The code expires; stop showing a stale one.
      setTimeout(() => setCodes((c) => ({ ...c, [id]: null })), (data.expires_in || 600) * 1000);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  };

  const disconnect = async (id) => {
    setBusy(id);
    try {
      await authFetch(`${API_HOST}/api/connectors/${id}`, { method: "DELETE" });
      await load();
    } finally {
      setBusy(null);
    }
  };

  const onHost = isSameMachineAsBackend();
  const cloud = items.filter((c) => c.scope === "cloud");
  const usable = cloud.filter((c) => stateOf(c) in rank).sort((a, b) => rank[stateOf(a)] - rank[stateOf(b)]);
  const later  = cloud.filter((c) => !(stateOf(c) in rank));
  const device = items.filter((c) => c.scope === "device");
  const connectedCount = items.filter((c) => stateOf(c) === "connected").length;

  const handlers = (c) => ({
    onConnect: c.id === "google" ? connectGoogle
      : (c.id === "whatsapp" || c.id === "telegram") ? linkByCode(c.id) : null,
    onDisconnect: () => disconnect(c.id),
  });

  return (
    <Screen title="Connectors"
            subtitle={loading ? "Loading…" : `${connectedCount} connected · let Recalla act for you`}
            width="max-w-4xl">
      {error && <Banner className="mb-4" onClose={() => setError(null)}>{error}</Banner>}

      <p className="mb-4 text-[15px] leading-relaxed text-muted">
        Connect a service and Recalla can use it when you ask — read and send email,
        add calendar events, or answer you on WhatsApp.
      </p>

      {loading ? <SkeletonList count={3} h="h-32" /> : (
        <>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {usable.map((c) => (
              <Card key={c.id} c={c} busy={busy === c.id} code={codes[c.id] || null} {...handlers(c)} />
            ))}
          </div>

          {device.length > 0 && (
            <section className="mt-8">
              <h2 className="text-[15px] font-semibold">On the computer running Recalla</h2>
              <p className="mt-1 mb-3 text-sm leading-relaxed text-subtle">
                {onHost
                  ? "Actions that happen on this computer."
                  : "You're on another device — these still run on the computer hosting Recalla, not on this one."}
              </p>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {device.map((c) => <Card key={c.id} c={c} busy={false} remote={!onHost} />)}
              </div>
            </section>
          )}

          {later.length > 0 && (
            <section className="mt-8">
              <button onClick={() => setShowLater((s) => !s)} aria-expanded={showLater}
                      className="flex min-h-11 w-full items-center gap-2 text-left">
                <span className="flex-1">
                  <span className="block text-[15px] font-semibold">Not available yet</span>
                  <span className="block text-sm text-subtle">{later.map((c) => c.name).join(", ")}</span>
                </span>
                <ChevronDown size={20} className={`text-subtle transition-transform ${showLater ? "rotate-180" : ""}`} />
              </button>
              {showLater && (
                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 animate-fade-in">
                  {later.map((c) => <Card key={c.id} c={c} busy={false} />)}
                </div>
              )}
            </section>
          )}
        </>
      )}
    </Screen>
  );
}

function Card({ c, busy, onConnect, onDisconnect, remote, code }) {
  const st = stateOf(c);
  const meta = STATE[st] || STATE.planned;
  const Icon = ICONS[c.id] || Plug;
  const live = st === "available" || st === "connected" || st === "partial";
  const [copied, setCopied] = useState(false);

  const command = code?.code ? (c.id === "telegram" ? `/link ${code.code}` : `link ${code.code}`) : "";
  const copy = async () => {
    try { await navigator.clipboard.writeText(command); setCopied(true); setTimeout(() => setCopied(false), 1500); }
    catch { /* clipboard blocked — the code is on screen anyway */ }
  };

  return (
    <div className={`card flex flex-col p-4 ${live ? "" : "opacity-75"}`}>
      <div className="flex items-start gap-3">
        <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${live ? "bg-brand/12 text-brand" : "bg-surface-3 text-subtle"}`}>
          <Icon size={21} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="font-semibold">{c.name}</div>
          <span className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${meta.cls}`}>
            {st === "connected" && <Check size={12} strokeWidth={3} />}
            {st === "partial" && <CircleAlert size={12} />}
            {meta.label}
          </span>
        </div>
      </div>

      <p className="mt-3 text-[15px] leading-relaxed text-muted">{c.blurb}</p>
      {c.account && <p className="mt-1 truncate text-sm text-subtle">{c.account}</p>}

      {c.actions && st === "connected" && (
        <ul className="mt-2.5 flex flex-wrap gap-1.5">
          {c.actions.slice(0, 4).map((a) => <li key={a} className="tag">{a}</li>)}
        </ul>
      )}

      {c.reason && <p className="mt-3 rounded-xl bg-surface-3/60 p-3 text-sm leading-relaxed text-muted">{c.reason}</p>}

      {command && (
        <div className="mt-3 rounded-xl border border-brand/40 bg-brand/8 p-3">
          <div className="text-xs font-semibold text-subtle">Send this message from your phone</div>
          <div className="mt-1 flex items-center gap-2">
            <code className="flex-1 font-mono text-lg font-medium text-brand">{command}</code>
            <button onClick={copy} className="btn btn-secondary btn-sm" aria-label="Copy the code">
              {copied ? <Check size={16} /> : <Copy size={16} />}{copied ? "Copied" : "Copy"}
            </button>
          </div>
          <p className="mt-1.5 text-[13px] leading-snug text-subtle">
            {code.instructions || "Send it from the app you're linking. The code expires in 10 minutes."}
          </p>
        </div>
      )}

      {remote && <p className="mt-3 text-sm text-warn">Runs on the host computer, not the device in your hand.</p>}

      {live && (onConnect || onDisconnect) && (
        <div className="mt-auto flex gap-2 pt-4">
          {onConnect && st !== "connected" && (
            <button onClick={onConnect} disabled={busy} className="btn btn-primary flex-1">
              {busy ? "Working…"
                : st === "partial" ? "Reconnect"
                : c.id === "whatsapp" ? "Link my number"
                : c.id === "telegram" ? "Link Telegram"
                : "Connect"}
            </button>
          )}
          {st === "connected" && onDisconnect && (
            <button onClick={onDisconnect} disabled={busy} className="btn btn-secondary flex-1">
              {busy ? "Working…" : "Disconnect"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
