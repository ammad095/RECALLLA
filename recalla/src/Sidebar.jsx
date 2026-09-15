// ============================================================
// FILE PATH:  recalla/src/Sidebar.jsx
// PURPOSE:    Minimal shared sidebar used by all main pages.
//             Just icons + labels + active indicator.
// ============================================================

import { COLORS, FONTS } from "./theme";
import { useState, useEffect } from "react";
import { listNotifications } from "./data_api";

const Icon = ({ name, size = 18, color = "currentColor" }) => {
  const s = { width: size, height: size, stroke: color, fill: "none", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };
  const icons = {
    home:      <svg viewBox="0 0 24 24" {...s}><path d="M3 9.5L12 3l9 6.5V21a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z"/></svg>,
    mic:       <svg viewBox="0 0 24 24" {...s}><rect x="9" y="2" width="6" height="13" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/><line x1="12" y1="19" x2="12" y2="22"/></svg>,
    brain:     <svg viewBox="0 0 24 24" {...s}><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/></svg>,
    chat:      <svg viewBox="0 0 24 24" {...s}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
    bell:      <svg viewBox="0 0 24 24" {...s}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
    clock:     <svg viewBox="0 0 24 24" {...s}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    list:      <svg viewBox="0 0 24 24" {...s}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/></svg>,
    plug:      <svg viewBox="0 0 24 24" {...s}><path d="M9 2v6M15 2v6"/><path d="M6 8h12v3a6 6 0 0 1-6 6 6 6 0 0 1-6-6z"/><path d="M12 17v5"/></svg>,
    settings:  <svg viewBox="0 0 24 24" {...s}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  };
  return icons[name] || null;
};

const NAV = [
  { icon: "home",     label: "Home",        route: "dashboard" },
  { icon: "mic",      label: "Record",      route: "record" },
  { icon: "list",     label: "Meetings",    route: "meetings" },
  { icon: "chat",     label: "Ask",         route: "ask" },
  { icon: "bell",     label: "Reminders",   route: "reminders" },
  { icon: "brain",    label: "Memory",      route: "memory" },
  { icon: "clock",    label: "Timeline",    route: "timeline" },
  { icon: "plug",     label: "Connectors",  route: "connectors" },
  { icon: "settings", label: "Settings",    route: "settings" },
];

function initials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "?";
}

export default function Sidebar({ active, navigate, user }) {
  const handleNav = (route) => { if (navigate) navigate(route); };

  // Reminders that have fired and not been dismissed. Polled rather than
  // pushed: the scheduler ticks once a minute, so anything faster would just
  // be asking a question whose answer cannot have changed.
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    let alive = true;
    const poll = () =>
      listNotifications()
        .then((d) => { if (alive) setUnread(d.count || 0); })
        .catch(() => {});
    poll();
    const t = setInterval(poll, 60000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  return (
    <aside style={{
      width: 64,
      flexShrink: 0,
      background: COLORS.surface,
      borderRight: `1px solid ${COLORS.border}`,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "20px 0",
      gap: 6,
      position: "relative",
      zIndex: 2,
    }}>
      {/* Logo mark */}
      <div
        className="press"
        onClick={() => handleNav("dashboard")}
        style={{
          width: 36, height: 36, borderRadius: 10,
          background: `linear-gradient(135deg, ${COLORS.emerald}, ${COLORS.cyan})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: 18, cursor: "pointer",
          boxShadow: COLORS.glow.emerald,
        }}
      >
        <span style={{ fontFamily: FONTS.heading, fontSize: 18, color: COLORS.onAccent }}>R</span>
      </div>

      {/* Nav items */}
      {NAV.map(item => {
        const isActive = item.route === active;
        return (
          <div
            key={item.route}
            onClick={() => handleNav(item.route)}
            title={item.label}
            className="press"
            style={{
              width: 40, height: 40, borderRadius: 10,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
              color: isActive ? COLORS.emerald : COLORS.textSecondary,
              background: isActive ? COLORS.surfaceRaised : "transparent",
              boxShadow: isActive ? `inset 2px 0 0 ${COLORS.emerald}` : "none",
              transition: "color .18s ease, background-color .18s ease, box-shadow .18s ease",
              position: "relative",
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.color = COLORS.textPrimary;
                e.currentTarget.style.background = COLORS.surfaceHover;
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.color = COLORS.textSecondary;
                e.currentTarget.style.background = "transparent";
              }
            }}
          >
            <Icon name={item.icon} size={18} color="currentColor" />

            {item.route === "reminders" && unread > 0 && (
              <span
                title={`${unread} reminder${unread === 1 ? "" : "s"} due`}
                style={{
                  position: "absolute", top: 4, right: 4,
                  minWidth: 15, height: 15, padding: "0 4px",
                  borderRadius: 999, background: COLORS.red, color: "#fff",
                  fontFamily: FONTS.mono, fontSize: 9, fontWeight: 700,
                  display: "grid", placeItems: "center", lineHeight: 1,
                }}
              >
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </div>
        );
      })}

      {/* Bottom: user avatar + sign out */}
      <div style={{
        marginTop: "auto", paddingTop: 12, borderTop: `1px solid ${COLORS.border}`,
        width: 40, display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
      }}>
        <div
          title={user ? `${user.name} · ${user.email}` : "Not signed in"}
          style={{
            width: 32, height: 32, borderRadius: "50%",
            background: `linear-gradient(135deg, ${COLORS.violet}, ${COLORS.emerald})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: FONTS.mono, fontSize: 11, fontWeight: 600,
            color: COLORS.onAccent, flexShrink: 0,
          }}
        >
          {initials(user?.name)}
        </div>

        <div
          className="press"
          onClick={() => handleNav("logout")}
          title="Sign out"
          style={{
            width: 32, height: 32, borderRadius: 8, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: COLORS.textTertiary,
            transition: "color .18s ease, background-color .18s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = COLORS.red;
            e.currentTarget.style.background = COLORS.surfaceHover;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = COLORS.textTertiary;
            e.currentTarget.style.background = "transparent";
          }}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none"
               stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </div>
      </div>
    </aside>
  );
}