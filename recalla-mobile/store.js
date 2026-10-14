// ============================================================
// FILE PATH:  recalla-mobile/store.js
// PURPOSE:    Meetings live on the phone first, the server second.
// ============================================================

/**
 * Local-first meeting storage.
 *
 * A meeting is written to the device the moment recording stops, before any
 * network call. That ordering is the point: transcription happens here, so
 * the phone always holds the authoritative copy, and losing signal in a
 * basement meeting room costs nothing.
 *
 * Sync is a separate, retryable step. A meeting carries `synced` and the
 * server id it was given, so an upload that fails is simply tried again
 * rather than lost or duplicated.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

const INDEX_KEY = "recalla.meetings.index";
const MEETING_KEY = (id) => `recalla.meeting.${id}`;

function newId() {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function listMeetings() {
  const raw = await AsyncStorage.getItem(INDEX_KEY);
  const ids = raw ? JSON.parse(raw) : [];
  const out = [];
  for (const id of ids) {
    const m = await getMeeting(id);
    if (m) out.push(m);
  }
  return out.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

export async function getMeeting(id) {
  const raw = await AsyncStorage.getItem(MEETING_KEY(id));
  return raw ? JSON.parse(raw) : null;
}

export async function createMeeting(title) {
  const m = {
    id: newId(),
    title: title || "Untitled meeting",
    createdAt: Date.now(),
    segments: [],
    fullText: "",
    // "recording" → "transcribing" → "complete". The middle state is what
    // lets the transcript open immediately while the tail is still running.
    status: "recording",
    pendingSlices: 0,
    durationMs: 0,
    synced: false,
    serverId: null,
    summary: null,
    keyPoints: [],
  };
  await saveMeeting(m);
  const raw = await AsyncStorage.getItem(INDEX_KEY);
  const ids = raw ? JSON.parse(raw) : [];
  await AsyncStorage.setItem(INDEX_KEY, JSON.stringify([m.id, ...ids]));
  return m;
}

export async function saveMeeting(m) {
  await AsyncStorage.setItem(MEETING_KEY(m.id), JSON.stringify(m));
  return m;
}

/** Merge a patch into a stored meeting. Reads fresh to avoid clobbering. */
export async function updateMeeting(id, patch) {
  const current = await getMeeting(id);
  if (!current) return null;
  const next = { ...current, ...patch };
  await saveMeeting(next);
  return next;
}

/**
 * Append a transcribed slice.
 *
 * Slices can finish out of order — a short one queued later may complete
 * before a long one ahead of it — so segments are kept sorted by start time
 * rather than by arrival.
 */
export async function appendSegments(id, segments) {
  const m = await getMeeting(id);
  if (!m) return null;
  const all = [...m.segments, ...segments].sort((a, b) => a.start - b.start);
  const next = {
    ...m,
    segments: all,
    fullText: all.map((s) => s.text).join(" ").replace(/\s+/g, " ").trim(),
  };
  await saveMeeting(next);
  return next;
}

export async function deleteMeeting(id) {
  await AsyncStorage.removeItem(MEETING_KEY(id));
  const raw = await AsyncStorage.getItem(INDEX_KEY);
  const ids = raw ? JSON.parse(raw) : [];
  await AsyncStorage.setItem(INDEX_KEY, JSON.stringify(ids.filter((x) => x !== id)));
}

export async function unsyncedMeetings() {
  const all = await listMeetings();
  return all.filter((m) => m.status === "complete" && !m.synced);
}
