// ── RECALLA API Service ──────────────────────────────────────────────────────
const API_BASE = "http://localhost:8001/api/meetings";
const HEALTH_URL = "http://localhost:8001/health";

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

/** Check if backend is reachable. */
export async function checkBackendHealth() {
  try {
    const r = await fetch(HEALTH_URL);
    return r.ok;
  } catch {
    return false;
  }
}