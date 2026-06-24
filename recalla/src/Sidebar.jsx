// ============================================================
// FILE PATH:  recalla/src/Sidebar.jsx
// PURPOSE:    Minimal shared sidebar used by all main pages.
//             Just icons + labels + active indicator.
// ============================================================

import { COLORS, FONTS } from "./theme";

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
  { icon: "settings", label: "Settings",    route: "settings" },
];

export default function Sidebar({ active, navigate }) {
  const handleNav = (route) => { if (navigate) navigate(route); };

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
    }}>
      {/* Logo mark */}
      <div
        onClick={() => handleNav("dashboard")}
        style={{
          width: 36, height: 36,
          background: `linear-gradient(135deg, ${COLORS.emerald}, ${COLORS.cyan})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: 18, cursor: "pointer",
          boxShadow: COLORS.glow.emerald,
        }}
      >
        <span style={{ fontFamily: FONTS.heading, fontSize: 18, color: COLORS.bg }}>R</span>
      </div>

      {/* Nav items */}
      {NAV.map(item => {
        const isActive = item.route === active;
        return (
          <div
            key={item.route}
            onClick={() => handleNav(item.route)}
            title={item.label}
            style={{
              width: 40, height: 40,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
              color: isActive ? COLORS.emerald : COLORS.textSecondary,
              background: isActive ? "rgba(52,211,153,0.08)" : "transparent",
              borderLeft: isActive ? `2px solid ${COLORS.emerald}` : "2px solid transparent",
              transition: "all 0.2s ease",
              position: "relative",
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.color = COLORS.textPrimary;
                e.currentTarget.style.background = "rgba(255,255,255,0.04)";
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
          </div>
        );
      })}

      {/* Bottom user avatar */}
      <div style={{ marginTop: "auto", paddingTop: 12, borderTop: `1px solid ${COLORS.border}`, width: 40, display: "flex", justifyContent: "center" }}>
        <div style={{
          width: 32, height: 32,
          background: `linear-gradient(135deg, ${COLORS.violet}, ${COLORS.emerald})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: FONTS.mono, fontSize: 11, fontWeight: 600,
          color: COLORS.bg,
        }}>
          AA
        </div>
      </div>
    </aside>
  );
}