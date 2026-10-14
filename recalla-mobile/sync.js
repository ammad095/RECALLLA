// ============================================================
// FILE PATH:  recalla-mobile/sync.js
// PURPOSE:    Push finished meetings to the server, and get the summary.
// ============================================================

/**
 * Uploading a finished meeting.
 *
 * Only text goes up — the audio never leaves the device. The payload is the
 * shape /api/data/meetings already accepts, so the server needed no changes
 * to support recording moving to the phone.
 *
 * Summaries, tasks and decisions stay server-side deliberately: they are a
 * Groq call, which needs a network round trip anyway and would be slower and
 * far larger to run locally than transcription is.
 */

import { updateMeeting } from "./store";

const BASE = "https://141-145-152-202.sslip.io";

async function req(path, token, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`${res.status} ${body.slice(0, 120)}`);
  }
  return res.json();
}

/**
 * Upload one meeting. Safe to call twice — a meeting already carrying a
 * serverId is patched rather than duplicated.
 */
export async function syncMeeting(meeting, token) {
  if (!token) throw new Error("Not signed in");

  const payload = {
    title: meeting.title,
    full_text: meeting.fullText,
    segments: meeting.segments.map((s) => ({
      start: s.start,
      end: s.end,
      speaker: s.speaker || "Speaker 1",
      text: s.text,
    })),
    duration_s: Math.round((meeting.durationMs || 0) / 1000),
    source: "mobile",
  };

  let serverId = meeting.serverId;
  if (serverId) {
    await req(`/api/data/meetings/${serverId}`, token, {
      method: "PATCH",
      body: JSON.stringify({ segments: payload.segments, title: payload.title }),
    });
  } else {
    const created = await req("/api/data/meetings", token, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    serverId = created.id;
  }

  await updateMeeting(meeting.id, { synced: true, serverId });
  return serverId;
}

/** Summary and key points, once the full transcript exists. */
export async function fetchSummary(meeting, token) {
  const r = await req("/api/agent/summarize", token, {
    method: "POST",
    body: JSON.stringify({ transcript: meeting.fullText, include_key_points: true }),
  });
  await updateMeeting(meeting.id, {
    summary: r.summary || "",
    keyPoints: r.key_points || [],
    verbatim: Boolean(r.verbatim),
  });
  return r;
}

/** Tasks and decisions, extracted server-side after the upload. */
export async function fetchExtraction(serverId, token) {
  if (!serverId) return { tasks: [], decisions: [] };
  return req(`/api/data/meetings/${serverId}/extract`, token, { method: "POST" });
}
