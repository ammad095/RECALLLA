// ============================================================
// FILE PATH:  recalla/src/ui/Logo.jsx
// PURPOSE:    The Recalla mark: a waveform — what it listens to.
// ============================================================

export default function Logo({ size = 32 }) {
  return (
    <span className="grid shrink-0 place-items-center rounded-[10px] bg-gradient-to-br from-brand to-info text-on-brand"
          style={{ width: size, height: size }} aria-hidden="true">
      <svg viewBox="0 0 24 24" width={size * 0.56} height={size * 0.56} fill="none" stroke="currentColor"
           strokeWidth="2.4" strokeLinecap="round">
        <path d="M4 12h1M8 8v8M12 5v14M16 9v6M20 12h0" />
      </svg>
    </span>
  );
}
