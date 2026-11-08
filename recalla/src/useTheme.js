// ============================================================
// FILE PATH:  recalla/src/useTheme.js
// PURPOSE:    Theme state + persistence. Follows the OS preference
//             until the user makes an explicit choice.
// ============================================================

import { useSyncExternalStore, useCallback } from "react";
import { applyTheme, getInitialTheme, THEME_KEY } from "./theme";

// One store for the whole app. The navigation and Settings both show the
// theme; with state per component they disagreed after either one changed it.
let current = typeof window === "undefined" ? "dark" : getInitialTheme();
const listeners = new Set();

function set(theme, persist) {
  current = theme;
  applyTheme(theme, persist);
  listeners.forEach((l) => l());
}

if (typeof window !== "undefined") {
  // Follow the OS only while the user has not chosen explicitly.
  window.matchMedia?.("(prefers-color-scheme: light)").addEventListener?.("change", (e) => {
    let saved = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch { /* blocked */ }
    if (!saved) set(e.matches ? "light" : "dark", false);
  });
  // Sync across tabs.
  window.addEventListener("storage", (e) => {
    if (e.key === THEME_KEY && (e.newValue === "light" || e.newValue === "dark")) set(e.newValue, false);
  });
}

const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l); };
const snapshot = () => current;

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, snapshot, snapshot);
  const choose = useCallback((t) => set(t, true), []);
  const toggle = useCallback(() => set(current === "dark" ? "light" : "dark", true), []);

  /** "system" forgets the explicit choice and goes back to following the OS. */
  const followSystem = useCallback(() => {
    try { localStorage.removeItem(THEME_KEY); } catch { /* blocked */ }
    set(window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark", false);
  }, []);

  return { theme, setTheme: choose, toggle, followSystem, isDark: theme === "dark" };
}
