// ============================================================
// FILE PATH:  recalla/src/theme.js
// PURPOSE:    Shared design tokens for all pages (colors, fonts, spacing).
//             Inspired by PixelCraft technical aesthetic.
// ============================================================

export const COLORS = {
  bg:            "#050505",
  surface:       "#09090b",
  surfaceHover:  "#111114",
  surfaceRaised: "#13131a",

  emerald: "#34d399",
  violet:  "#a78bfa",
  cyan:    "#22d3ee",
  red:     "#f87171",
  amber:   "#fbbf24",

  textPrimary:   "#ffffff",
  textSecondary: "#a1a1aa",
  textTertiary:  "#52525b",

  border:        "rgba(255,255,255,0.08)",
  borderStrong:  "rgba(255,255,255,0.14)",
  borderEmerald: "rgba(52,211,153,0.30)",
  borderViolet:  "rgba(167,139,250,0.30)",

  glow: {
    emerald: "0 0 24px rgba(52,211,153,0.25)",
    violet:  "0 0 24px rgba(167,139,250,0.25)",
    cyan:    "0 0 24px rgba(34,211,238,0.25)",
  },
};

export const FONTS = {
  heading: "'Anton', sans-serif",
  body:    "'DM Sans', sans-serif",
  mono:    "'Inter', monospace",
};

export const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Anton&family=DM+Sans:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap');`;

// Reusable global CSS — apply once at top of each page
export const GLOBAL_CSS = `
  ${FONT_IMPORT}
  *,*::before,*::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { height: 100%; width: 100%; }
  body {
    font-family: ${FONTS.body};
    background: ${COLORS.bg};
    color: ${COLORS.textPrimary};
    overflow: hidden;
    letter-spacing: -0.01em;
  }
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-thumb { background: ${COLORS.border}; border-radius: 2px; }
  *::selection { background: ${COLORS.emerald}; color: ${COLORS.bg}; }

  /* L-shaped corner markers — use class="corners corners-emerald" */
  .corners { position: relative; }
  .corners::before, .corners::after,
  .corners > .c-tl, .corners > .c-tr {
    content: ''; position: absolute; width: 12px; height: 12px;
    border-color: ${COLORS.emerald}; border-style: solid; border-width: 0;
    pointer-events: none;
  }
  .corners::before { top: -1px; left: -1px; border-top-width: 1px; border-left-width: 1px; }
  .corners::after  { bottom: -1px; right: -1px; border-bottom-width: 1px; border-right-width: 1px; }
  .corners > .c-tr { top: -1px; right: -1px; border-top-width: 1px; border-right-width: 1px; }
  .corners > .c-bl { bottom: -1px; left: -1px; border-bottom-width: 1px; border-left-width: 1px; }
  .corners-violet::before, .corners-violet::after,
  .corners-violet > .c-tr, .corners-violet > .c-bl { border-color: ${COLORS.violet}; }
  .corners-cyan::before, .corners-cyan::after,
  .corners-cyan > .c-tr, .corners-cyan > .c-bl { border-color: ${COLORS.cyan}; }

  /* Pulsing status dot */
  @keyframes pulse-dot { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.85); } }
  .status-dot { width: 6px; height: 6px; border-radius: 50%; animation: pulse-dot 2s ease-in-out infinite; flex-shrink: 0; }

  /* Glass surface */
  .glass {
    background: rgba(9,9,11,0.6);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid ${COLORS.border};
  }

  @keyframes fade-up { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  .fade-up { animation: fade-up 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
`;