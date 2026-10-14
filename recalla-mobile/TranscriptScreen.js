// ============================================================
// FILE PATH:  recalla-mobile/TranscriptScreen.js
// PURPOSE:    The page you land on the instant you stop recording.
// ============================================================

/**
 * Opens with whatever has already been transcribed and fills in the rest.
 *
 * Stopping a 20-minute recording should not produce a progress bar. By the
 * time someone presses stop, every slice but the last one or two is already
 * text, so this screen shows that immediately and appends the tail as it
 * lands. The summary waits for the full transcript — it cannot be written
 * from half a meeting — but reading can start straight away.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import {
  ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View,
} from "react-native";

import { getMeeting, appendSegments, updateMeeting } from "./store";
import { syncMeeting, fetchSummary, fetchExtraction } from "./sync";
import { C } from "./theme";

function clock(sec) {
  const s = Math.floor(sec);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export default function TranscriptScreen({ meetingId, live, getToken, onBack }) {
  const [meeting, setMeeting] = useState(null);
  const [pending, setPending] = useState(0);
  const [stage, setStage] = useState("finishing");   // finishing | syncing | ready | error
  const [error, setError] = useState(null);
  const settled = useRef(false);

  // Keep receiving slices that were still in flight when recording stopped.
  useEffect(() => {
    let alive = true;
    getMeeting(meetingId).then((m) => alive && setMeeting(m));

    if (live) {
      live.h = {
        ...live.h,
        onSegments: async (segs) => {
          const next = await appendSegments(meetingId, segs);
          if (alive) setMeeting(next);
        },
        onPending: (n) => alive && setPending(n),
        onError: (e) => alive && setError(String(e?.message || e)),
      };
    }
    return () => { alive = false; };
  }, [meetingId, live]);

  // Once nothing is left in flight, finish: store, upload, summarise.
  const complete = useCallback(async () => {
    if (settled.current) return;
    settled.current = true;

    try {
      await live?.release();
      const m = await updateMeeting(meetingId, { status: "complete" });
      setMeeting(m);

      const token = await getToken();
      if (!token) {
        setStage("ready");
        setError("Saved on this phone. Sign in to sync it to your account.");
        return;
      }

      setStage("syncing");
      const serverId = await syncMeeting(m, token);
      const sum = await fetchSummary(m, token);
      // Tasks and decisions are a bonus; a failure here must not make the
      // meeting look broken when the transcript and summary are both fine.
      fetchExtraction(serverId, token).catch(() => {});

      setMeeting(await getMeeting(meetingId));
      setStage("ready");
    } catch (e) {
      setError(String(e?.message || e));
      setStage("error");
    }
  }, [meetingId, live, getToken]);

  useEffect(() => {
    if (!meeting) return;
    const stillRunning = pending > 0 || (live?.stats?.()?.slicesInProgress ?? 0) > 0;
    if (!stillRunning && meeting.status === "transcribing") {
      // A short grace period: a slice can be handed over microseconds after
      // the counter reads zero, and committing early would truncate it.
      const t = setTimeout(complete, 1500);
      return () => clearTimeout(t);
    }
  }, [meeting, pending, live, complete]);

  if (!meeting) {
    return (
      <View style={[s.root, s.center]}>
        <ActivityIndicator color={C.emerald} />
      </View>
    );
  }

  const transcribing = meeting.status === "transcribing";

  return (
    <View style={s.root}>
      <View style={s.header}>
        <Pressable onPress={onBack} hitSlop={12}><Text style={s.back}>‹ Done</Text></Pressable>
        <Text style={s.heading} numberOfLines={1}>{meeting.title}</Text>
        <View style={{ width: 52 }} />
      </View>

      <View style={s.statusBar}>
        {transcribing ? (
          <>
            <ActivityIndicator size="small" color={C.amber} />
            <Text style={s.statusText}>
              Still transcribing the last part — the rest is below
              {pending > 0 ? ` (${pending} left)` : ""}
            </Text>
          </>
        ) : stage === "syncing" ? (
          <>
            <ActivityIndicator size="small" color={C.emerald} />
            <Text style={s.statusText}>Saving and writing the summary…</Text>
          </>
        ) : (
          <Text style={[s.statusText, { color: C.emerald }]}>
            {meeting.synced ? "Saved to your account" : "Saved on this phone"}
            {"  ·  "}{meeting.segments.length} lines
          </Text>
        )}
      </View>

      <ScrollView style={s.body} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {Boolean(meeting.summary) && (
          <View style={s.card}>
            <Text style={s.cardLabel}>SUMMARY</Text>
            <Text style={s.summary}>{meeting.summary}</Text>
            {meeting.keyPoints?.length > 0 && (
              <View style={{ marginTop: 12 }}>
                {meeting.keyPoints.map((k, i) => (
                  <Text key={i} style={s.point}>·  {k}</Text>
                ))}
              </View>
            )}
          </View>
        )}

        <Text style={s.cardLabel}>TRANSCRIPT</Text>
        {meeting.segments.map((seg, i) => (
          <Text key={i} style={s.line}>
            <Text style={s.time}>{clock(seg.start)}  </Text>{seg.text}
          </Text>
        ))}

        {transcribing && (
          <View style={s.tail}>
            <ActivityIndicator size="small" color={C.textTertiary} />
            <Text style={s.tailText}>more arriving…</Text>
          </View>
        )}

        {Boolean(error) && <Text style={s.error}>{error}</Text>}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg, paddingTop: 44 },
  center: { alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingBottom: 10,
  },
  back: { color: C.emerald, fontSize: 15 },
  heading: { color: C.textPrimary, fontSize: 15, fontWeight: "600", flex: 1, textAlign: "center" },
  statusBar: {
    flexDirection: "row", alignItems: "center", gap: 9,
    paddingHorizontal: 18, paddingVertical: 10,
    backgroundColor: C.surface, marginHorizontal: 12, borderRadius: 11,
  },
  statusText: { color: C.textSecondary, fontSize: 12.5, flex: 1 },
  body: { flex: 1 },
  card: {
    backgroundColor: C.surface, borderRadius: 14, padding: 16, marginBottom: 20,
    borderWidth: 1, borderColor: C.border,
  },
  cardLabel: {
    color: C.textTertiary, fontSize: 10, letterSpacing: 1.4,
    marginBottom: 9, fontWeight: "700",
  },
  summary: { color: C.textPrimary, fontSize: 14.5, lineHeight: 23 },
  point: { color: C.textSecondary, fontSize: 13.5, lineHeight: 22 },
  line: { color: C.textPrimary, fontSize: 14.5, lineHeight: 23, marginBottom: 10 },
  time: { color: C.textTertiary, fontSize: 11.5, fontVariant: ["tabular-nums"] },
  tail: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 10 },
  tailText: { color: C.textTertiary, fontSize: 12.5, fontStyle: "italic" },
  error: { color: C.amber, fontSize: 12.5, marginTop: 14, lineHeight: 19 },
});
