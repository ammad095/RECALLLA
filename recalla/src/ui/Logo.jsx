// ============================================================
// FILE PATH:  recalla/src/ui/Logo.jsx
// PURPOSE:    The Recalla mark and wordmark. A speech bubble holding a
//             sound wave — a conversation, captured — drawn flat in the
//             one accent colour. (Redrawn in an unslop pass by @heydamir's
//             method: no gradient tile, no glow.)
// ============================================================

const SLOGAN = "Every meeting, remembered";

export default function Logo({ size = 32, className = "" }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" fill="none"
         stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
         className={`shrink-0 text-brand ${className}`}>
      <path d="M8 3.5h8a4.5 4.5 0 0 1 4.5 4.5v4.5a4.5 4.5 0 0 1-4.5 4.5h-5.5l-4 3.5v-3.8A4.5 4.5 0 0 1 3.5 12.5V8A4.5 4.5 0 0 1 8 3.5z" />
      <path d="M9 9v2.5M12 7.5v5.5M15 8.75v3" />
    </svg>
  );
}

/** Mark + name (+ slogan). */
export function Brand({ size = 28, slogan = true, onClick, className = "" }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag onClick={onClick} className={`flex items-center gap-2.5 text-left ${className}`}>
      <Logo size={size} />
      <span className="min-w-0">
        <span className="block text-[17px] font-medium leading-tight">Recalla</span>
        {slogan && <span className="block truncate text-xs text-subtle">{SLOGAN}</span>}
      </span>
    </Tag>
  );
}
