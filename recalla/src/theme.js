// ============================================================
// FILE PATH:  recalla/src/theme.js
// PURPOSE:    Light / dark theme control. The colours themselves live
//             in index.css as CSS custom properties; this file only
//             decides which set is active.
// ============================================================

export const THEME_KEY = "recalla_theme";

/**
 * The resolved value of a token, e.g. cssColor("brand") → "#34D399".
 *
 * A canvas cannot parse var(--brand); handing it one throws, which is why the
 * recording waveform used to draw nothing at all.
 */
export function cssColor(name) {
  if (typeof document === "undefined") return "#888";
  return getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim() || "#888";
}

export function getInitialTheme() {
  if (typeof window === "undefined") return "dark";
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch { /* storage blocked */ }
  return window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

// `persist` is false for the automatic first paint, so an OS-derived theme is
// not mistaken for an explicit user choice (which would stop us following the OS).
export function applyTheme(theme, persist = false) {
  const root = document.documentElement;
  root.setAttribute("data-theme", theme);
  // The Android status bar and browser chrome follow the page colour.
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => {
    m.setAttribute("content", theme === "light" ? "#EEF2F8" : "#070A12");
  });
  if (persist) {
    try { localStorage.setItem(THEME_KEY, theme); } catch { /* private mode */ }
  }
}

// Apply before first paint to avoid a flash of the wrong theme.
if (typeof document !== "undefined") applyTheme(getInitialTheme());
