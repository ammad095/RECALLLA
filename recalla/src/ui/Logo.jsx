// ============================================================
// FILE PATH:  recalla/src/ui/Logo.jsx
// PURPOSE:    The Recalla mark and wordmark.
//
//             A speech bubble holding a sound wave: a conversation,
//             captured. The tile is glass — a gradient through the app's
//             three colours with a light sheen on top. On hover the wave
//             ripples, as if it were listening.
// ============================================================

import { useId } from "react";

const SLOGAN = "Every meeting, remembered.";

export default function Logo({ size = 32, className = "" }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true"
         className={`logo shrink-0 ${className}`}>
      <defs>
        <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#34D399" />
          <stop offset=".55" stopColor="#22D3EE" />
          <stop offset="1" stopColor="#A78BFA" />
        </linearGradient>
        <linearGradient id={`${id}-sheen`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".55" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="14" fill={`url(#${id}-fill)`} />
      {/* glass sheen and rim */}
      <path d="M4 16C4 9 9 4 16 4h16c7 0 12 5 12 12-7 4-15 6-20 6S11 20 4 16z" fill={`url(#${id}-sheen)`} opacity=".55" />
      <rect x=".75" y=".75" width="46.5" height="46.5" rx="13.25" fill="none" stroke="#fff" strokeOpacity=".35" strokeWidth="1.5" />
      {/* the bubble */}
      <path d="M18 11.5h12a7 7 0 0 1 7 7v6.5a7 7 0 0 1-7 7h-8.5l-6.2 5.2v-5.6A7 7 0 0 1 11 25v-6.5a7 7 0 0 1 7-7z"
            fill="#fff" fillOpacity=".16" stroke="#fff" strokeWidth="2.6" strokeLinejoin="round" />
      {/* the wave */}
      <g fill="#fff">
        <rect className="logo-bar" x="17.2" y="18.8" width="2.8" height="7"  rx="1.4" />
        <rect className="logo-bar" x="22.6" y="15.8" width="2.8" height="13" rx="1.4" style={{ animationDelay: "120ms" }} />
        <rect className="logo-bar" x="28"   y="18"   width="2.8" height="8.6" rx="1.4" style={{ animationDelay: "240ms" }} />
      </g>
    </svg>
  );
}

/** Mark + name (+ slogan). Hovering anywhere on it brings the mark alive. */
export function Brand({ size = 36, slogan = true, onClick, className = "" }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag onClick={onClick} className={`brand group flex items-center gap-3 text-left ${className}`}>
      <Logo size={size} />
      <span className="min-w-0">
        <span className="brand-name block text-[17px] font-bold leading-tight tracking-tight">Recalla</span>
        {slogan && <span className="block truncate text-xs text-subtle">{SLOGAN}</span>}
      </span>
    </Tag>
  );
}
