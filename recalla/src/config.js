// ============================================================
// FILE PATH:  recalla/src/config.js
// PURPOSE:    One place that decides where the backend lives, and what
//             this particular device is capable of.
// ============================================================

/**
 * Backend base URL.
 *
 * "localhost" is only correct when the browser is on the same machine as the
 * backend. Opened from a phone or tablet, localhost resolves to the phone
 * itself and every request fails — so we derive the host from whatever
 * address the page was loaded from and keep the backend's port.
 *
 * Override with VITE_API_URL when the API lives somewhere else entirely.
 */
const BACKEND_PORT = 8001;

function resolveApiHost() {
  const explicit = import.meta.env.VITE_API_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  if (typeof window !== "undefined" && window.location) {
    const { protocol, hostname } = window.location;
    return `${protocol}//${hostname}:${BACKEND_PORT}`;
  }
  return `http://localhost:${BACKEND_PORT}`;
}

export const API_HOST = resolveApiHost();
export const API_MEETINGS = `${API_HOST}/api/meetings`;
export const API_AGENT    = `${API_HOST}/api/agent`;
export const API_AUTH     = `${API_HOST}/api/auth`;
export const API_DATA     = `${API_HOST}/api/data`;
export const HEALTH_URL   = `${API_HOST}/health`;

// ── Device capabilities ──────────────────────────────────────────────────────
// Recalla runs in a browser, so what it can do depends on the device. Cloud
// connectors behave identically everywhere; anything touching the local
// machine only makes sense on the computer running the backend.

export const isTouchDevice = () =>
  typeof window !== "undefined" &&
  (window.matchMedia?.("(pointer: coarse)").matches || "ontouchstart" in window);

/** True when the page is served from the same machine as the backend. */
export const isSameMachineAsBackend = () => {
  if (typeof window === "undefined") return false;
  const h = window.location.hostname;
  return h === "localhost" || h === "127.0.0.1" || h === "[::1]";
};

/** Chrome/Edge/Android expose SpeechRecognition; iOS Safari does not. */
export const hasNativeSpeech = () =>
  typeof window !== "undefined" &&
  Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

/** Any device with a microphone can record and let Whisper transcribe it. */
export const hasMicRecording = () =>
  typeof navigator !== "undefined" &&
  Boolean(navigator.mediaDevices?.getUserMedia);
