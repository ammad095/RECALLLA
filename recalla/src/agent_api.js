// ============================================================
// FILE PATH:  recalla/src/agent_api.js
// PURPOSE:    Frontend helpers — chat, summarize, reminders,
//             email draft send/cancel.
// ============================================================

const API_HOST = import.meta.env.VITE_API_URL || "http://localhost:8001";
const AGENT_BASE = `${API_HOST}/api/agent`;

/** Send a message to the agent. */
export async function agentChat(message, history = []) {
  const res = await fetch(`${AGENT_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Agent error" }));
    throw new Error(err.detail || "Agent request failed");
  }
  return res.json();
}

/** Real AI summary from Groq. */
export async function summarizeTranscript(transcript, includeKeyPoints = false) {
  const res = await fetch(`${AGENT_BASE}/summarize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transcript, include_key_points: includeKeyPoints }),
  });
  if (!res.ok) throw new Error("Summarization failed");
  return res.json();
}

/** Status check — what's configured on backend. */
export async function getAgentStatus() {
  try {
    const res = await fetch(`${AGENT_BASE}/status`);
    return res.ok ? await res.json() : { groq_configured: false, google_configured: false };
  } catch {
    return { groq_configured: false, google_configured: false };
  }
}

// ── Reminders ─────────────────────────────────────────────────────────────
export async function listReminders(status = "pending") {
  const res = await fetch(`${AGENT_BASE}/reminders?status=${status}`);
  if (!res.ok) throw new Error("Failed to fetch reminders");
  return res.json();
}

export async function createReminder({ title, datetime_iso, priority = "medium", category = "general", notes = "" }) {
  const res = await fetch(`${AGENT_BASE}/reminders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, datetime_iso, priority, category, notes }),
  });
  if (!res.ok) throw new Error("Failed to create reminder");
  return res.json();
}

export async function completeReminder(reminderId) {
  const res = await fetch(`${AGENT_BASE}/reminders/${reminderId}/complete`, { method: "PATCH" });
  if (!res.ok) throw new Error("Failed to complete reminder");
  return res.json();
}

export async function deleteReminder(reminderId) {
  const res = await fetch(`${AGENT_BASE}/reminders/${reminderId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete reminder");
  return res.json();
}

// ── Email drafts ──────────────────────────────────────────────────────────
/** User confirmed — actually send the drafted email. */
export async function sendEmailDraft(draftId) {
  const res = await fetch(`${AGENT_BASE}/send-draft/${draftId}`, { method: "POST" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Send failed" }));
    throw new Error(err.detail || "Send failed");
  }
  return res.json();
}

/** User cancelled — mark draft as cancelled. */
export async function cancelEmailDraft(draftId) {
  const res = await fetch(`${AGENT_BASE}/draft/${draftId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Cancel failed");
  return res.json();
}