// ============================================================
// FILE PATH:  recalla/src/MicButton.jsx
// PURPOSE:    Push-to-talk control. The ring reacts to mic level so it is
//             obvious Recalla is actually hearing you.
// ============================================================

import { COLORS, FONTS, MOTION } from "./theme";

export default function MicButton({
  listening, transcribing, level = 0, onClick, supported = true, size = 42, title,
}) {
  const busy = listening || transcribing;
  const ring = 1 + Math.min(0.35, level * 0.5);   // pulse with the voice

  if (!supported) return null;

  return (
    <>
      <style>{`
        @keyframes mic-ping {
          0%   { transform: scale(1);    opacity: .55; }
          100% { transform: scale(1.85); opacity: 0; }
        }
        .mic-btn {
          position: relative; display: grid; place-items: center;
          border-radius: 50%; cursor: pointer; flex-shrink: 0;
          border: 1px solid var(--border);
          transition: background-color ${MOTION.base} ease,
                      border-color ${MOTION.base} ease,
                      transform ${MOTION.fast} ${MOTION.ease};
        }
        .mic-btn:hover { border-color: var(--border-strong); }
        .mic-btn:active { transform: scale(0.94); }
        .mic-btn.on { border-color: transparent; }
        .mic-halo {
          position: absolute; inset: 0; border-radius: 50%;
          background: var(--red); animation: mic-ping 1.5s ease-out infinite;
          pointer-events: none;
        }
        @media (prefers-reduced-motion: reduce) { .mic-halo { animation: none; opacity: .25; } }
      `}</style>

      <button
        type="button"
        onClick={onClick}
        className={`mic-btn${busy ? " on" : ""}`}
        aria-label={listening ? "Stop listening" : "Speak to Recalla"}
        aria-pressed={listening}
        title={title || (listening ? "Listening — tap to stop" : "Tap and speak")}
        style={{
          width: size, height: size,
          background: transcribing
            ? COLORS.surfaceRaised
            : listening
              ? COLORS.red
              : COLORS.surface,
          transform: listening ? `scale(${ring})` : "scale(1)",
        }}
      >
        {listening && <span className="mic-halo" />}

        {transcribing ? (
          <Spinner size={size * 0.42} />
        ) : (
          <svg
            width={size * 0.44} height={size * 0.44} viewBox="0 0 24 24" fill="none"
            stroke={listening ? COLORS.onAccent : COLORS.textSecondary}
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ position: "relative" }}
          >
            <rect x="9" y="2" width="6" height="12" rx="3" />
            <path d="M5 10a7 7 0 0 0 14 0" />
            <line x1="12" y1="19" x2="12" y2="22" />
          </svg>
        )}
      </button>
    </>
  );
}

function Spinner({ size = 16 }) {
  return (
    <>
      <style>{`@keyframes mic-spin { to { transform: rotate(360deg); } }`}</style>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
           style={{ animation: "mic-spin 0.8s linear infinite" }}>
        <circle cx="12" cy="12" r="9" stroke={COLORS.border} strokeWidth="3" />
        <path d="M21 12a9 9 0 0 0-9-9" stroke={COLORS.emerald} strokeWidth="3" strokeLinecap="round" />
      </svg>
    </>
  );
}

/** Small caption shown next to the button while it is active. */
export function MicStatus({ listening, transcribing, interim, engine }) {
  if (!listening && !transcribing) return null;

  return (
    <span style={{
      fontFamily: FONTS.mono, fontSize: 10.5, letterSpacing: "0.1em",
      textTransform: "uppercase",
      color: transcribing ? COLORS.textSecondary : COLORS.red,
      display: "inline-flex", alignItems: "center", gap: 7, minWidth: 0,
    }}>
      {transcribing
        ? "Transcribing…"
        : interim
          ? <span style={{
              textTransform: "none", letterSpacing: 0, fontFamily: FONTS.body,
              fontSize: 13, color: COLORS.textSecondary,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 320,
            }}>{interim}</span>
          : engine === "whisper" ? "Recording — tap to finish" : "Listening…"}
    </span>
  );
}
