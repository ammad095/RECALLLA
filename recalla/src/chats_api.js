// ============================================================
// FILE PATH:  recalla/src/chats_api.js
// PURPOSE:    Saved Ask Recalla conversations.
// ============================================================

import { API_HOST } from "./config";
import { authFetch } from "./auth_api";

const BASE = `${API_HOST}/api/chats`;

async function req(path, opts = {}) {
  const res = await authFetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.detail || "Chat history request failed");
  }
  return res.json();
}

export const listChats  = ()   => req("");
export const getChat    = (id) => req(`/${id}`);
export const deleteChat = (id) => req(`/${id}`, { method: "DELETE" });

export const renameChat = (id, title) =>
  req(`/${id}`, { method: "PATCH", body: JSON.stringify({ title }) });

/** Save a completed exchange. Omit sessionId to start a new conversation. */
export const appendTurns = (sessionId, turns) =>
  req("/append", {
    method: "POST",
    body: JSON.stringify({ session_id: sessionId || null, turns }),
  });
