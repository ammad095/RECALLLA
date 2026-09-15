// ============================================================
// FILE PATH:  recalla/src/Connectors.jsx
// PURPOSE:    Manage which services Recalla can act on.
//
//             Each card states what it can do and — where a service can't be
//             connected — exactly what is blocking it. A greyed card with a
//             reason is more useful than a button that fails.
// ============================================================

import { useState, useEffect } from "react";
import { COLORS, FONTS, MOTION, GLOBAL_CSS } from "./theme";
import Sidebar from "./Sidebar";
import { authFetch } from "./auth_api";
import { API_HOST, isSameMachineAsBackend } from "./config";

const STATE_META = {
  available:      { label: "Available",   color: COLORS.emerald },
  partial:        { label: "Permissions missing", color: COLORS.amber },
  needs_setup:    { label: "Setup first", color: COLORS.amber   },
  needs_provider: { label: "Needs a paid provider", color: COLORS.amber },
  planned:        { label: "Planned",     color: COLORS.cyan    },
  blocked:        { label: "Not possible", color: COLORS.textTertiary },
};

const ICONS = {
  google:    "M",
  desktop:   "▣",
  whatsapp:  "W",
  phone:     "☏",
  slack:     "S",
  notion:    "N",
  linkedin:  "in",
  x:         "X",
  instagram: "◎",
};

export default function Connectors({ navigate, user }) {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [busy, setBusy]       = useState(null);

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
    (async () => {
      try {
        const res = await authFetch(`${API_HOST}/api/connectors`);
        if (!res.ok) throw new Error("Could not load connectors");
        const data = await res.json();
        if (alive) { setItems(data.connectors || []); setError(null); }
      } catch (e) {
        if (alive) setError(e.message);
      } finally {
        if (alive) setLoading(false);
      }
    })();
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
        if (w?.closed) { clearInterval(poll); load(); setBusy(null); }
      }, 800);
    } catch (e) {
      setError(e.message);
      setBusy(null);
    }
  };

  const [waCode, setWaCode] = useState(null);

  const linkWhatsApp = async () => {
    setBusy("whatsapp");
    try {
      const res = await authFetch(`${API_HOST}/api/whatsapp/link-code`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Could not create a code");
      setWaCode(data.code);
      // The code expires; stop showing a stale one.
      setTimeout(() => setWaCode(null), (data.expires_in || 600) * 1000);
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

  const cloud  = items.filter((c) => c.scope === "cloud");
  const device = items.filter((c) => c.scope === "device");
  const onHost = isSameMachineAsBackend();

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <style>{`
        .conn-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px; }
        @media (max-width: 700px) { .conn-grid { grid-template-columns: 1fr; } }
        .conn-card {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 16px; padding: 18px;
          display: flex; flex-direction: column; gap: 11;
          transition: border-color ${MOTION.base} ease, transform ${MOTION.base} ${MOTION.ease};
        }
        .conn-card.live:hover { border-color: var(--border-emerald); transform: translate3d(0,-2px,0); }
        .conn-card.off { opacity: .72; }
      `}</style>

      <div className="themed" style={{ display: "flex", height: "100vh", width: "100vw", background: COLORS.bg }}>
        <Sidebar active="connectors" navigate={navigate} user={user} />

        <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <header style={{ padding: "18px 28px", borderBottom: `1px solid ${COLORS.border}` }}>
            <div style={{
              fontFamily: FONTS.heading, fontSize: 26, lineHeight: 1,
              textTransform: "uppercase", letterSpacing: "0.02em", color: COLORS.textPrimary,
            }}>Connectors</div>
            <div style={{
              fontFamily: FONTS.mono, fontSize: 10, color: COLORS.textSecondary,
              marginTop: 4, textTransform: "uppercase", letterSpacing: "0.12em",
            }}>
              {loading
                ? "Loading…"
                : `${items.filter(c => c.connected && c.state !== "partial").length} connected`}
            </div>
          </header>

          <div style={{ flex: 1, overflowY: "auto", padding: "26px 28px 60px" }}>
            <div style={{ maxWidth: 900, margin: "0 auto" }}>

              {error && (
                <div style={{
                  padding: "11px 15px", borderRadius: 10, marginBottom: 20,
                  background: COLORS.surface, border: `1px solid ${COLORS.red}`,
                  color: COLORS.red, fontSize: 13,
                }}>{error}</div>
              )}

              <SectionTitle
                title="Services"
                hint="These run on the server, so they work the same on your laptop, phone or tablet."
              />
              <div className="conn-grid" style={{ marginBottom: 34 }}>
                {loading
                  ? [0, 1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 150, borderRadius: 16 }} />)
                  : cloud.map((c) => (
                      <Card key={c.id} c={c} busy={busy === c.id}
                            onConnect={c.id === "google" ? connectGoogle
                                     : c.id === "whatsapp" ? linkWhatsApp : null}
                            onDisconnect={() => disconnect(c.id)}
                            code={c.id === "whatsapp" ? waCode : null} />
                    ))}
              </div>

              <SectionTitle
                title="This device"
                hint={
                  onHost
                    ? "Actions that happen on the computer running Recalla."
                    : "You're viewing Recalla from another device. These actions still run on the computer hosting it, not on this one."
                }
              />
              <div className="conn-grid">
                {device.map((c) => (
                  <Card key={c.id} c={c} busy={false} remote={!onHost} />
                ))}
              </div>

            </div>
          </div>
        </main>
      </div>
    </>
  );
}

function SectionTitle({ title, hint }) {
  return (
    <div style={{ marginBottom: 13 }}>
      <div style={{
        fontFamily: FONTS.heading, fontSize: 20, textTransform: "uppercase",
        letterSpacing: "0.02em", color: COLORS.textPrimary, marginBottom: 5,
      }}>{title}</div>
      <div style={{ fontSize: 13, color: COLORS.textSecondary, lineHeight: 1.55, maxWidth: 620 }}>
        {hint}
      </div>
    </div>
  );
}

function Card({ c, busy, onConnect, onDisconnect, remote, code }) {
  const meta = STATE_META[c.state] || STATE_META.planned;
  // "partial" is a working integration missing a permission, so it keeps the
  // full-colour card and its buttons — it just cannot claim to be connected.
  const partial = c.state === "partial";
  const live = c.state === "available" || partial;

  return (
    <div className={`conn-card ${live ? "live" : "off"}`}>
      <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 4 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 9, flexShrink: 0,
          display: "grid", placeItems: "center",
          background: COLORS.surfaceRaised,
          fontFamily: FONTS.mono, fontSize: 13, fontWeight: 600,
          color: live ? COLORS.emerald : COLORS.textTertiary,
        }}>{ICONS[c.id] || "•"}</div>

        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 14.5, fontWeight: 500, color: COLORS.textPrimary }}>{c.name}</div>
          <div style={{
            fontFamily: FONTS.mono, fontSize: 9, letterSpacing: "0.1em",
            textTransform: "uppercase", color: meta.color, marginTop: 2,
          }}>
            {c.connected && live && !partial ? "Connected" : meta.label}
          </div>
        </div>

        {c.connected && live && (
          <span className="status-dot"
                style={{ background: partial ? COLORS.amber : COLORS.emerald }} />
        )}
      </div>

      <div style={{ fontSize: 13, color: COLORS.textSecondary, lineHeight: 1.55, marginBottom: 4 }}>
        {c.blurb}
      </div>

      {c.account && (
        <div style={{ fontFamily: FONTS.mono, fontSize: 10.5, color: COLORS.textTertiary }}>
          {c.account}
        </div>
      )}

      {c.actions && live && !partial && (
        <ul style={{ margin: "2px 0 0", padding: 0, listStyle: "none" }}>
          {c.actions.slice(0, 4).map((a) => (
            <li key={a} style={{
              fontSize: 12.5, color: COLORS.textTertiary, lineHeight: 1.7,
              display: "flex", gap: 7,
            }}>
              <span style={{ color: COLORS.emerald }}>·</span>{a}
            </li>
          ))}
        </ul>
      )}

      {c.reason && (
        <div style={{
          fontSize: 12, color: COLORS.textTertiary, lineHeight: 1.55,
          background: COLORS.bg, border: `1px solid ${COLORS.border}`,
          borderRadius: 9, padding: "9px 11px", marginTop: 4,
        }}>{c.reason}</div>
      )}

      {code && (
        <div style={{
          marginTop: 4, padding: "11px 13px", borderRadius: 10,
          background: COLORS.bg, border: `1px solid ${COLORS.emerald}`,
        }}>
          <div style={{
            fontFamily: FONTS.mono, fontSize: 9, letterSpacing: "0.12em",
            textTransform: "uppercase", color: COLORS.textTertiary, marginBottom: 5,
          }}>Send this from your phone</div>
          <div style={{
            fontFamily: FONTS.mono, fontSize: 17, color: COLORS.emerald,
            letterSpacing: "0.06em",
          }}>link {code}</div>
          <div style={{ fontSize: 11.5, color: COLORS.textTertiary, marginTop: 6, lineHeight: 1.5 }}>
            Message it to the Recalla WhatsApp number. Expires in 10 minutes.
          </div>
        </div>
      )}

      {remote && (
        <div style={{
          fontSize: 12, color: COLORS.amber, lineHeight: 1.5, marginTop: 4,
        }}>
          Runs on the host computer, not the device you're holding.
        </div>
      )}

      <div style={{ marginTop: "auto", paddingTop: 12 }}>
        {live && onConnect && (!c.connected || partial) && (
          <button onClick={onConnect} disabled={busy} className="press" style={btn(true)}>
            {busy ? "Working…"
              : partial ? "Reconnect"
              : c.id === "whatsapp" ? "Link my number"
              : "Connect"}
          </button>
        )}
        {live && c.connected && !partial && onDisconnect && (
          <button onClick={onDisconnect} disabled={busy} className="press" style={btn(false)}>
            {busy ? "…" : "Disconnect"}
          </button>
        )}
      </div>
    </div>
  );
}

const btn = (primary) => ({
  background: primary ? `linear-gradient(135deg, ${COLORS.emerald}, ${COLORS.cyan})` : "transparent",
  color: primary ? COLORS.onAccent : COLORS.textSecondary,
  border: primary ? "none" : `1px solid ${COLORS.border}`,
  padding: "8px 16px", borderRadius: 999,
  fontFamily: FONTS.mono, fontSize: 10.5, fontWeight: 600,
  textTransform: "uppercase", letterSpacing: "0.1em", cursor: "pointer",
});
