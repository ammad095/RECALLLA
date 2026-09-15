// ============================================================
// FILE PATH:  recalla/src/ThemeToggle.jsx
// PURPOSE:    Sun/moon switch. Transform + opacity only, so the
//             whole animation stays on the compositor thread.
// ============================================================

import { COLORS, FONTS, MOTION } from "./theme";

export default function ThemeToggle({ theme, toggle, compact = false }) {
  const isDark = theme === "dark";

  return (
    <>
      <style>{`
        .tt-track {
          position: relative; display: inline-flex; align-items: center;
          width: ${compact ? 52 : 60}px; height: ${compact ? 28 : 32}px;
          padding: 3px; border-radius: 999px; cursor: pointer;
          background: var(--surface-raised);
          border: 1px solid var(--border);
          transition: background-color ${MOTION.base} ease, border-color ${MOTION.base} ease;
          flex-shrink: 0;
        }
        .tt-track:hover { border-color: var(--border-strong); }

        .tt-thumb {
          position: absolute; top: 3px; left: 3px;
          width: ${compact ? 20 : 24}px; height: ${compact ? 20 : 24}px;
          border-radius: 50%;
          display: grid; place-items: center;
          background: linear-gradient(135deg, var(--emerald), var(--cyan));
          box-shadow: var(--shadow-sm);
          transform: translate3d(${isDark ? 0 : (compact ? 24 : 28)}px, 0, 0);
          transition: transform ${MOTION.base} ${MOTION.spring};
          will-change: transform;
        }

        .tt-icon {
          position: absolute; inset: 0; display: grid; place-items: center;
          transition: opacity ${MOTION.fast} ease, transform ${MOTION.base} ${MOTION.ease};
        }
        .tt-moon { opacity: ${isDark ? 1 : 0}; transform: rotate(${isDark ? 0 : -70}deg) scale(${isDark ? 1 : 0.5}); }
        .tt-sun  { opacity: ${isDark ? 0 : 1}; transform: rotate(${isDark ? 70 : 0}deg) scale(${isDark ? 0.5 : 1}); }

        /* Dim glyphs sitting on the track behind the thumb */
        .tt-ghost {
          position: absolute; top: 50%; transform: translateY(-50%);
          display: grid; place-items: center; pointer-events: none;
          color: var(--text-tertiary);
          transition: opacity ${MOTION.base} ease;
        }
        .tt-ghost-l { left: ${compact ? 7 : 8}px;  opacity: ${isDark ? 0 : 0.55}; }
        .tt-ghost-r { right: ${compact ? 7 : 8}px; opacity: ${isDark ? 0.55 : 0}; }

        @media (prefers-reduced-motion: reduce) {
          .tt-thumb, .tt-icon { transition-duration: 0.01ms; }
        }
      `}</style>

      <button
        className="tt-track"
        onClick={toggle}
        role="switch"
        aria-checked={!isDark}
        aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
        title={`Switch to ${isDark ? "light" : "dark"} mode`}
        style={{ fontFamily: FONTS.body }}
      >
        <span className="tt-ghost tt-ghost-l"><MoonIcon size={compact ? 11 : 12} /></span>
        <span className="tt-ghost tt-ghost-r"><SunIcon size={compact ? 11 : 12} /></span>

        <span className="tt-thumb">
          <span className="tt-icon tt-moon"><MoonIcon size={compact ? 11 : 13} color={COLORS.onAccent} /></span>
          <span className="tt-icon tt-sun"><SunIcon  size={compact ? 11 : 13} color={COLORS.onAccent} /></span>
        </span>
      </button>
    </>
  );
}

function MoonIcon({ size = 13, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function SunIcon({ size = 13, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 1.6v2.2M12 20.2v2.2M4.2 4.2l1.6 1.6M18.2 18.2l1.6 1.6M1.6 12h2.2M20.2 12h2.2M4.2 19.8l1.6-1.6M18.2 5.8l1.6-1.6" />
    </svg>
  );
}
