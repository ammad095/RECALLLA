// ============================================================
// FILE PATH:  recalla/src/data_api.js
// PURPOSE:    Everything the signed-in user owns — meetings, reminders,
//             memory, timeline, settings, admin. All calls go through
//             authFetch, so the backend scopes them to this account.
// ============================================================

import { authFetch } from "./auth_api";

import { API_DATA as BASE } from "./config";

async function req(path, options = {}) {
  const res = await authFetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const d = body?.detail;
    throw new Error(typeof d === "string" ? d : (Array.isArray(d) && d[0]?.msg) || `Request failed (${res.status})`);
  }
  return res.status === 204 ? null : res.json();
}

// ── Meetings ─────────────────────────────────────────────────────────────────

export const listMeetings = (search = "") =>
  req(`/meetings${search ? `?search=${encodeURIComponent(search)}` : ""}`);

export const getMeeting = (id) => req(`/meetings/${id}`);

export const saveMeeting = (meeting) =>
  req("/meetings", { method: "POST", body: JSON.stringify(meeting) });

export const updateMeeting = (id, patch) =>
  req(`/meetings/${id}`, { method: "PATCH", body: JSON.stringify(patch) });

export const deleteMeeting = (id) => req(`/meetings/${id}`, { method: "DELETE" });

/** Action items and decisions. GET returns what is stored; POST re-extracts. */
export const getExtracted     = (id) => req(`/meetings/${id}/extract`);
export const extractMeeting   = (id) => req(`/meetings/${id}/extract`, { method: "POST" });

// ── Reminders ────────────────────────────────────────────────────────────────

export const listReminders = (status = "pending") => req(`/reminders?status=${status}`);

export const createReminder = (r) =>
  req("/reminders", { method: "POST", body: JSON.stringify(r) });

export const completeReminder = (id) => req(`/reminders/${id}/complete`, { method: "PATCH" });

export const deleteReminder = (id) => req(`/reminders/${id}`, { method: "DELETE" });

// ── Memory / timeline / stats ────────────────────────────────────────────────

export const getMemory   = (kind) => req(`/memory${kind ? `?kind=${kind}` : ""}`);
export const getTimeline = ()     => req("/timeline");
export const getStats    = ()     => req("/stats");

// ── Notifications ─────────────────────────────────────────────────────────
export const listNotifications = ()   => req("/notifications");
export const dismissNotification = (id) =>
  req(`/notifications/${id}/seen`, { method: "POST" });

// ── Settings ─────────────────────────────────────────────────────────────────

export const getSettings    = ()      => req("/settings");
export const updateSettings = (patch) => req("/settings", { method: "PATCH", body: JSON.stringify(patch) });

// ── Admin ────────────────────────────────────────────────────────────────────

export const adminListUsers = () => req("/admin/users");
export const adminUpdateUser = (id, patch) =>
  req(`/admin/users/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
