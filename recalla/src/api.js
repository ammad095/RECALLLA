// ── RECALLA API Service ──────────────────────────────────────────────────────
import { API_MEETINGS as API_BASE, HEALTH_URL } from "./config";

/**
 * Start async transcription with optional speaker count hint.
 * Returns { job_id, model_loaded }
 */
export async function startTranscription(audioBlob, filename = "recording.webm", options = {}) {
  const formData = new FormData();
  formData.append("audio", audioBlob, filename);
  if (options.expectedSpeakers && options.expectedSpeakers > 0) {
    formData.append("expected_speakers", String(options.expectedSpeakers));
  }

  const response = await fetch(`${API_BASE}/transcribe-async`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail || "Failed to start transcription");
  }
  return response.json();
}

/** Poll job status. */
export async function getJobStatus(jobId) {
  const response = await fetch(`${API_BASE}/job/${jobId}`);
  if (!response.ok) throw new Error("Job not found");
  return response.json();
}

/**
 * Polls until done. Calls onProgress on each update.
 * Default interval: 2000ms (less noisy than 800ms).
 */
export async function waitForJob(jobId, onProgress = () => {}, pollInterval = 2000) {
  while (true) {
    const status = await getJobStatus(jobId);
    onProgress(status);

    if (status.status === "done") {
      fetch(`${API_BASE}/job/${jobId}`, { method: "DELETE" }).catch(() => {});
      return status.result;
    }
    if (status.status === "error") {
      fetch(`${API_BASE}/job/${jobId}`, { method: "DELETE" }).catch(() => {});
      throw new Error(status.error || "Transcription failed");
    }

    await new Promise(r => setTimeout(r, pollInterval));
  }
}

/**
 * Full async flow: upload → poll → result.
 * Accepts options.expectedSpeakers to hint diarization.
 */
export async function transcribeAudio(audioBlob, filename = "recording.webm", onProgress = () => {}, options = {}) {
  const { job_id, model_loaded } = await startTranscription(audioBlob, filename, options);
  onProgress({ status: "starting", progress: 5, step: 0, model_loaded });
  return waitForJob(job_id, onProgress);
}

/** Tag plain text without audio. */
export async function tagText(text) {
  const response = await fetch(`${API_BASE}/tag-text`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!response.ok) throw new Error("Tagging failed");
  return response.json();
}

// ── Live session API ─────────────────────────────────────────────────────────
// Audio windows are streamed while recording, so the transcript is already
// built when the user stops. See recalla-backend/models/live_session.py.

/** Open a live session. Returns { session_id, window_seconds, step_seconds, model }. */
export async function startLiveSession(expectedSpeakers = null) {
  const r = await fetch(`${API_BASE}/session/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ expected_speakers: expectedSpeakers }),
  });
  if (!r.ok) throw new Error("Could not start live session");
  return r.json();
}

/**
 * Send one audio window.
 * `offset` is the window's absolute start time in seconds — the recorder is the
 * only reliable source for this, since Whisper trims silence and the server
 * cannot infer true position from transcript length.
 */
export async function sendLiveChunk(sessionId, blob, { offset, isFirst = false, filename = "chunk.wav" }) {
  const fd = new FormData();
  fd.append("audio", blob, filename);
  fd.append("is_first", isFirst ? "true" : "false");
  fd.append("offset", String(offset));
  const r = await fetch(`${API_BASE}/session/${sessionId}/chunk`, { method: "POST", body: fd });
  if (!r.ok) {
    const e = await r.json().catch(() => ({ detail: "Chunk upload failed" }));
    throw new Error(e.detail || "Chunk upload failed");
  }
  return r.json();
}

/** Stop the session: global speaker clustering + tagging. Fast (~1s). */
export async function finalizeLiveSession(sessionId, refine = true) {
  const r = await fetch(`${API_BASE}/session/${sessionId}/finalize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refine }),
  });
  if (!r.ok) throw new Error("Finalize failed");
  return r.json();
}

/** Poll the background high-accuracy pass. */
export async function getRefineStatus(sessionId) {
  const r = await fetch(`${API_BASE}/session/${sessionId}/refine`);
  if (!r.ok) throw new Error("Refine status failed");
  return r.json();
}

export async function deleteLiveSession(sessionId) {
  try { await fetch(`${API_BASE}/session/${sessionId}`, { method: "DELETE" }); } catch { /* best effort */ }
}

/** Check if backend is reachable. */
export async function checkBackendHealth() {
  try {
    const r = await fetch(HEALTH_URL);
    return r.ok;
  } catch {
    return false;
  }
}