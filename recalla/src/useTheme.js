// ============================================================
// FILE PATH:  recalla/src/useTheme.js
// PURPOSE:    Theme state + persistence. Follows the OS preference
//             until the user makes an explicit choice.
// ============================================================

import { useState, useEffect, useCallback, useRef } from "react";
import { applyTheme, getInitialTheme, THEME_KEY } from "./theme";

export function useTheme() {
  const [theme, setTheme] = useState(getInitialTheme);
  // Only writes to localStorage once the user actually picks a theme.
  const chosen = useRef(false);

  // Keep <html data-theme> in sync.
  useEffect(() => { applyTheme(theme, chosen.current); }, [theme]);

  // Follow the OS only while the user has not chosen explicitly.
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-color-scheme: light)");
    if (!mq) return;
    const onChange = (e) => {
      if (!localStorage.getItem(THEME_KEY)) setTheme(e.matches ? "light" : "dark");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Sync across tabs.
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === THEME_KEY && (e.newValue === "light" || e.newValue === "dark")) {
        setTheme(e.newValue);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const toggle = useCallback(() => {
    chosen.current = true;
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }, []);

  const choose = useCallback((t) => {
    chosen.current = true;
    setTheme(t);
  }, []);

  return { theme, setTheme: choose, toggle, isDark: theme === "dark" };
}
