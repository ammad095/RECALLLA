// ============================================================
// FILE PATH:  recalla/src/MicButton.jsx
// PURPOSE:    Push-to-talk control. The ring reacts to mic level so it is
//             obvious Recalla is actually hearing you.
// ============================================================

import { Mic, Loader2 } from "lucide-react";

export default function MicButton({
  listening, transcribing, level = 0, onClick, supported = true, size = 44, title,
}) {
  if (!supported) return null;
  const ring = 1 + Math.min(0.3, level * 0.5);   // pulse with the voice

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={listening ? "Stop listening" : "Speak instead of typing"}
      aria-pressed={listening}
      title={title || (listening ? "Listening — tap to stop" : "Tap and speak")}
      className={`relative grid shrink-0 place-items-center rounded-full transition-[background-color,transform] duration-150 active:scale-95
        ${listening ? "bg-danger text-white" : "bg-surface-3 text-muted hover:text-fg"}`}
      style={{ width: size, height: size, transform: listening ? `scale(${ring})` : undefined }}
    >
      {listening && <span className="absolute inset-0 rounded-full bg-danger animate-ping-ring" aria-hidden="true" />}
      {transcribing
        ? <Loader2 size={size * 0.45} className="animate-spin" />
        : <Mic size={size * 0.45} className="relative" />}
    </button>
  );
}

/** Small caption shown while the mic is active. */
export function MicStatus({ listening, transcribing, interim, engine }) {
  if (!listening && !transcribing) return null;
  if (transcribing) return <span className="text-sm text-muted">Turning speech into text…</span>;
  if (interim) return <span className="block truncate text-sm text-muted">{interim}</span>;
  return (
    <span className="inline-flex items-center gap-2 text-sm font-medium text-danger">
      <span className="size-2 rounded-full bg-danger animate-blink" />
      {engine === "whisper" ? "Recording — tap the mic to finish" : "Listening…"}
    </span>
  );
}
