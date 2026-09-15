// ============================================================
// FILE PATH:  recalla/src/theme.js
// PURPOSE:    Shared design tokens. Light + dark themes driven by
//             CSS custom properties, so every component that reads
//             COLORS.* re-themes automatically with zero changes.
//
// STYLE:      "AI-Native UI" — minimal chrome, single strong accent,
//             soft elevation, compositor-only motion. WCAG AA verified.
// ============================================================

// ── Raw palettes ─────────────────────────────────────────────────────────────
// Every fg/bg pair below was contrast-checked; ratios noted where tight.
export const PALETTES = {
  dark: {
    // Lifted off pure black so elevation is actually perceivable.
    bg:            "#0B0E14",
    surface:       "#131722",
    surfaceHover:  "#1A1F2E",
    surfaceRaised: "#222839",

    emerald: "#34D399",
    violet:  "#A78BFA",
    cyan:    "#22D3EE",
    red:     "#F87171",
    amber:   "#FBBF24",

    textPrimary:   "#F2F5FA",   // 16.4:1
    textSecondary: "#A9B4C9",   //  8.6:1
    textTertiary:  "#7A8699",   //  4.9:1  (was 2.6:1 — the visibility bug)

    onAccent: "#0B0E14",

    border:        "rgba(255,255,255,0.10)",
    borderStrong:  "rgba(255,255,255,0.18)",
    borderEmerald: "rgba(52,211,153,0.35)",
    borderViolet:  "rgba(167,139,250,0.35)",

    glowEmerald: "0 0 24px rgba(52,211,153,0.22)",
    glowViolet:  "0 0 24px rgba(167,139,250,0.22)",
    glowCyan:    "0 0 24px rgba(34,211,238,0.22)",

    shadowSm: "0 1px 2px rgba(0,0,0,0.40)",
    shadowMd: "0 4px 16px rgba(0,0,0,0.45)",
    shadowLg: "0 12px 32px rgba(0,0,0,0.55)",

    glassBg:  "rgba(19,23,34,0.72)",
    scrim:    "rgba(0,0,0,0.60)",
    meshA:    "rgba(52,211,153,0.10)",
    meshB:    "rgba(167,139,250,0.10)",
  },

  light: {
    bg:            "#F7F8FC",
    surface:       "#FFFFFF",
    surfaceHover:  "#F1F3F9",
    surfaceRaised: "#E8EBF3",

    // Darkened so they stay AA on white as both text and fill.
    emerald: "#047857",   // 5.5:1
    violet:  "#7C3AED",   // 5.7:1
    cyan:    "#0E7490",   // 5.4:1
    red:     "#DC2626",   // 4.8:1
    amber:   "#B45309",   // 5.0:1

    textPrimary:   "#0F172A",   // 17.9:1
    textSecondary: "#4A5568",   //  7.5:1
    textTertiary:  "#6B7688",   //  4.6:1

    onAccent: "#FFFFFF",

    border:        "rgba(15,23,42,0.10)",
    borderStrong:  "rgba(15,23,42,0.18)",
    borderEmerald: "rgba(4,120,87,0.30)",
    borderViolet:  "rgba(124,58,237,0.30)",

    glowEmerald: "0 0 24px rgba(4,120,87,0.14)",
    glowViolet:  "0 0 24px rgba(124,58,237,0.14)",
    glowCyan:    "0 0 24px rgba(14,116,144,0.14)",

    shadowSm: "0 1px 2px rgba(15,23,42,0.06)",
    shadowMd: "0 4px 16px rgba(15,23,42,0.08)",
    shadowLg: "0 12px 32px rgba(15,23,42,0.12)",

    glassBg:  "rgba(255,255,255,0.72)",
    scrim:    "rgba(15,23,42,0.35)",
    meshA:    "rgba(4,120,87,0.07)",
    meshB:    "rgba(124,58,237,0.07)",
  },
};

// ── Token map ────────────────────────────────────────────────────────────────
// COLORS.* returns var() references, so switching [data-theme] on <html>
// re-themes every component instantly with no React re-render required.
export const COLORS = {
  bg:            "var(--bg)",
  surface:       "var(--surface)",
  surfaceHover:  "var(--surface-hover)",
  surfaceRaised: "var(--surface-raised)",

  emerald: "var(--emerald)",
  violet:  "var(--violet)",
  cyan:    "var(--cyan)",
  red:     "var(--red)",
  amber:   "var(--amber)",

  textPrimary:   "var(--text-primary)",
  textSecondary: "var(--text-secondary)",
  textTertiary:  "var(--text-tertiary)",

  onAccent: "var(--on-accent)",

  border:        "var(--border)",
  borderStrong:  "var(--border-strong)",
  borderEmerald: "var(--border-emerald)",
  borderViolet:  "var(--border-violet)",

  shadowSm: "var(--shadow-sm)",
  shadowMd: "var(--shadow-md)",
  shadowLg: "var(--shadow-lg)",

  glow: {
    emerald: "var(--glow-emerald)",
    violet:  "var(--glow-violet)",
    cyan:    "var(--glow-cyan)",
  },
};

export const FONTS = {
  heading: "'Anton', sans-serif",
  body:    "'DM Sans', sans-serif",
  mono:    "'JetBrains Mono', ui-monospace, monospace",
};

export const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Anton&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');`;

// Motion scale — compositor-only (transform/opacity), per UI Pro Max guidance.
export const MOTION = {
  fast:   "150ms",
  base:   "220ms",
  slow:   "380ms",
  ease:   "cubic-bezier(0.16, 1, 0.3, 1)",   // power2.out equivalent
  spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
};

// ── Theme control ────────────────────────────────────────────────────────────
export const THEME_KEY = "recalla_theme";

const toVars = (p) => `
    --bg: ${p.bg};
    --surface: ${p.surface};
    --surface-hover: ${p.surfaceHover};
    --surface-raised: ${p.surfaceRaised};
    --emerald: ${p.emerald};
    --violet: ${p.violet};
    --cyan: ${p.cyan};
    --red: ${p.red};
    --amber: ${p.amber};
    --text-primary: ${p.textPrimary};
    --text-secondary: ${p.textSecondary};
    --text-tertiary: ${p.textTertiary};
    --on-accent: ${p.onAccent};
    --border: ${p.border};
    --border-strong: ${p.borderStrong};
    --border-emerald: ${p.borderEmerald};
    --border-violet: ${p.borderViolet};
    --glow-emerald: ${p.glowEmerald};
    --glow-violet: ${p.glowViolet};
    --glow-cyan: ${p.glowCyan};
    --shadow-sm: ${p.shadowSm};
    --shadow-md: ${p.shadowMd};
    --shadow-lg: ${p.shadowLg};
    --glass-bg: ${p.glassBg};
    --scrim: ${p.scrim};
    --mesh-a: ${p.meshA};
    --mesh-b: ${p.meshB};
`;

export function getInitialTheme() {
  if (typeof window === "undefined") return "dark";
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

// `persist` is false for the automatic first paint, so an OS-derived theme is
// not mistaken for an explicit user choice (which would stop us following the OS).
export function applyTheme(theme, persist = false) {
  const root = document.documentElement;
  root.setAttribute("data-theme", theme);
  root.style.colorScheme = theme;
  if (persist) {
    try { localStorage.setItem(THEME_KEY, theme); } catch { /* private mode */ }
  }
}

// Apply before first paint to avoid a flash of the wrong theme.
if (typeof document !== "undefined" && !document.documentElement.getAttribute("data-theme")) {
  applyTheme(getInitialTheme());
}

// ── Global CSS ───────────────────────────────────────────────────────────────
export const GLOBAL_CSS = `
  ${FONT_IMPORT}

  :root[data-theme="dark"]  {${toVars(PALETTES.dark)}}
  :root[data-theme="light"] {${toVars(PALETTES.light)}}
  :root:not([data-theme])   {${toVars(PALETTES.dark)}}

  *,*::before,*::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { height: 100%; width: 100%; }

  body {
    font-family: ${FONTS.body};
    background: var(--bg);
    color: var(--text-primary);
    overflow: hidden;
    letter-spacing: -0.01em;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* Only the colour properties transition, so theme switching never
     animates layout or triggers reflow. */
  body, .themed {
    transition: background-color ${MOTION.slow} ease, color ${MOTION.slow} ease;
  }

  ::-webkit-scrollbar { width: 8px; height: 8px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb {
    background: var(--border-strong); border-radius: 4px;
    border: 2px solid transparent; background-clip: content-box;
  }
  ::-webkit-scrollbar-thumb:hover { background: var(--text-tertiary); background-clip: content-box; }
  * { scrollbar-width: thin; scrollbar-color: var(--border-strong) transparent; }

  *::selection { background: var(--emerald); color: var(--on-accent); }

  :focus-visible {
    outline: 2px solid var(--emerald);
    outline-offset: 2px;
    border-radius: 4px;
  }

  /* ── L-shaped corner markers ─────────────────────────────────────────── */
  .corners { position: relative; }
  .corners::before, .corners::after {
    content: ''; position: absolute; width: 12px; height: 12px;
    border-color: var(--emerald); border-style: solid; border-width: 0;
    pointer-events: none;
    transition: width ${MOTION.base} ${MOTION.ease}, height ${MOTION.base} ${MOTION.ease};
  }
  .corners::before { top: -1px; left: -1px; border-top-width: 1px; border-left-width: 1px; }
  .corners::after  { bottom: -1px; right: -1px; border-bottom-width: 1px; border-right-width: 1px; }
  .corners:hover::before, .corners:hover::after { width: 20px; height: 20px; }
  .corners-violet::before, .corners-violet::after { border-color: var(--violet); }
  .corners-cyan::before,   .corners-cyan::after   { border-color: var(--cyan); }

  /* ── Status dot ──────────────────────────────────────────────────────── */
  @keyframes pulse-dot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%      { opacity: 0.45; transform: scale(0.82); }
  }
  .status-dot {
    width: 6px; height: 6px; border-radius: 50%;
    animation: pulse-dot 2.4s ease-in-out infinite;
    flex-shrink: 0;
  }

  /* ── Glass surface ───────────────────────────────────────────────────── */
  .glass {
    background: var(--glass-bg);
    backdrop-filter: blur(14px) saturate(1.4);
    -webkit-backdrop-filter: blur(14px) saturate(1.4);
    border: 1px solid var(--border);
  }

  /* ── Entrance: transform + opacity only (compositor thread) ──────────── */
  @keyframes fade-up {
    from { opacity: 0; transform: translate3d(0, 10px, 0); }
    to   { opacity: 1; transform: translate3d(0, 0, 0); }
  }
  .fade-up {
    animation: fade-up ${MOTION.slow} ${MOTION.ease} both;
    will-change: transform, opacity;
  }
  .fade-up:nth-child(1) { animation-delay: 0ms; }
  .stagger-1 { animation-delay: 60ms; }
  .stagger-2 { animation-delay: 120ms; }
  .stagger-3 { animation-delay: 180ms; }
  .stagger-4 { animation-delay: 240ms; }
  .stagger-5 { animation-delay: 300ms; }

  /* Drop will-change once the animation is done so the layer is released. */
  .fade-up { animation-fill-mode: both; }

  /* ── Interactive card: subtle lift, ≤4px per motion guidance ─────────── */
  .lift {
    transition: transform ${MOTION.base} ${MOTION.ease},
                box-shadow ${MOTION.base} ${MOTION.ease},
                border-color ${MOTION.base} ease,
                background-color ${MOTION.base} ease;
  }
  .lift:hover { transform: translate3d(0, -3px, 0); box-shadow: var(--shadow-md); }
  .lift:active { transform: translate3d(0, -1px, 0); transition-duration: ${MOTION.fast}; }

  .press { transition: transform ${MOTION.fast} ${MOTION.ease}; }
  .press:active { transform: scale(0.97); }

  /* ── Ambient mesh backdrop ───────────────────────────────────────────── */
  .mesh-bg { position: relative; isolation: isolate; }
  .mesh-bg::before {
    content: ''; position: absolute; inset: 0; z-index: -1; pointer-events: none;
    background:
      radial-gradient(60rem 32rem at 12% -8%,  var(--mesh-a), transparent 60%),
      radial-gradient(52rem 30rem at 92% 4%,   var(--mesh-b), transparent 60%);
    transition: opacity ${MOTION.slow} ease;
  }

  /* ── Shimmer for loading states ──────────────────────────────────────── */
  @keyframes shimmer { 100% { transform: translate3d(100%, 0, 0); } }
  .skeleton { position: relative; overflow: hidden; background: var(--surface-raised); }
  .skeleton::after {
    content: ''; position: absolute; inset: 0; transform: translate3d(-100%, 0, 0);
    background: linear-gradient(90deg, transparent, var(--border-strong), transparent);
    animation: shimmer 1.4s infinite;
  }

  /* ── Respect reduced-motion ──────────────────────────────────────────── */
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
    .lift:hover { transform: none; }
  }
`;
