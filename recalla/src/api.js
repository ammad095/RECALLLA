// ── RECALLA API Service ──────────────────────────────────────────────────────
// All backend communication goes through this file
const API_BASE = "http://localhost:8000/api/meetings";
const HEALTH_URL = "http://localhost:8000/health";

/**
 * Send an audio blob/file to the backend for transcription + tagging.
 * Returns { success, transcript, tagging }
 */
export async function transcribeAudio(audioBlob, filename = "recording.webm") {
  const formData = new FormData();
  formData.append("audio", audioBlob, filename);

  const response = await fetch(`${API_BASE}/transcribe`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail || "Transcription failed");
  }
  return response.json();
}

/**
 * Tag plain text without audio. Returns { success, tagging }
 */
export async function tagText(text) {
  const response = await fetch(`${API_BASE}/tag-text`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) throw new Error("Tagging failed");
  return response.json();
}

/**
 * Check if backend is reachable.
 */
export async function checkBackendHealth() {
  try {
    const r = await fetch(HEALTH_URL);
    return r.ok;
  } catch {
    return false;
  }
}