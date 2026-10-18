// ============================================================
// FILE PATH:  recalla-mobile/RecordScreen.js
// PURPOSE:    Record a meeting and watch it transcribe as it happens.
// ============================================================

import { useEffect, useRef, useState, useCallback } from "react";
import {
  ActivityIndicator, Pressable, ScrollView, StyleSheet,
  Text, TextInput, View,
} from "react-native";
// expo-audio exports these at the top level. `Audio` exists only as a types
// namespace, so importing it gives undefined at runtime — which is what
// "Cannot read property 'requestRecordingPermissionsAsync' of undefined"
// was. The old expo-av grouped them under Audio; this package does not.
import {
  requestRecordingPermissionsAsync,
  getRecordingPermissionsAsync,
} from "expo-audio";

import { LiveTranscription } from "./liveTranscribe";
import { createMeeting, appendSegments, updateMeeting } from "./store";
import { C } from "./theme";

function clock(ms) {
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export default function RecordScreen({ onDone, onCancel }) {
  const [title, setTitle] = useState("");
  const [phase, setPhase] = useState("idle");      // idle | recording | stopping
  const [elapsed, setElapsed] = useState(0);
  const [segments, setSegments] = useState([]);
  const [partial, setPartial] = useState("");
  const [pending, setPending] = useState(0);
  const [error, setError] = useState(null);

  const live = useRef(null);
  const meetingRef = useRef(null);
  const timer = useRef(null);
  const scroller = useRef(null);

  useEffect(() => () => { live.current?.release(); clearInterval(timer.current); }, []);

  const begin = useCallback(async () => {
    setError(null);
    try {
      let perm = await getRecordingPermissionsAsync();
      if (!perm.granted && perm.canAskAgain !== false) {
        perm = await requestRecordingPermissionsAsync();
      }
      if (!perm.granted) {
        setError(
          "Recalla needs microphone access to record. Enable it in Settings " +
          "and try again."
        );
        return;
      }

      const meeting = await createMeeting(title.trim() || "Untitled meeting");
      meetingRef.current = meeting;

      live.current = new LiveTranscription({
        // Each finished slice is written to the device immediately, so the
        // transcript survives the app being killed mid-meeting.
        onSegments: async (segs) => {
          setSegments((prev) => [...prev, ...segs].sort((a, b) => a.start - b.start));
          await appendSegments(meeting.id, segs);
        },
        onPartial: setPartial,
        onPending: setPending,
        onError: (e) => setError(String(e?.message || e)),
      });

      await live.current.start();
      setPhase("recording");

      const t0 = Date.now();
      timer.current = setInterval(() => setElapsed(Date.now() - t0), 500);
    } catch (e) {
      setError(String(e?.message || e));
    }
  }, [title]);

  const finish = useCallback(async () => {
    setPhase("stopping");
    clearInterval(timer.current);

    const { durationMs } = await live.current.stop();
    const meeting = meetingRef.current;

    // Hand over immediately. Slices still in flight will land on the
    // transcript screen as they finish — waiting here is exactly the
    // loading-spinner experience this design exists to avoid.
    await updateMeeting(meeting.id, {
      durationMs,
      status: "transcribing",
      pendingSlices: pending,
    });

    onDone(meeting.id, live.current);
  }, [onDone, pending]);

  const recording = phase === "recording";

  return (
    <View style={s.root}>
      <View style={s.header}>
        <Pressable onPress={onCancel} hitSlop={12}>
          <Text style={s.back}>‹ Back</Text>
        </Pressable>
        <Text style={s.heading}>RECORD</Text>
        <View style={{ width: 48 }} />
      </View>

      {!recording && phase === "idle" && (
        <TextInput
          style={s.input}
          placeholder="What's this meeting about?"
          placeholderTextColor={C.textTertiary}
          value={title}
          onChangeText={setTitle}
        />
      )}

      {recording && (
        <View style={s.statusRow}>
          <View style={s.dot} />
          <Text style={s.clock}>{clock(elapsed)}</Text>
          <Text style={s.meta}>
            {segments.length} line{segments.length === 1 ? "" : "s"}
            {pending > 0 ? ` · ${pending} transcribing` : ""}
          </Text>
        </View>
      )}

      <ScrollView
        ref={scroller}
        style={s.transcript}
        contentContainerStyle={{ padding: 16 }}
        onContentSizeChange={() => scroller.current?.scrollToEnd({ animated: true })}
      >
        {segments.length === 0 && !partial && (
          <Text style={s.hint}>
            {recording
              ? "Listening… text appears here every few seconds."
              : "Press record. The transcript builds as you talk, so there is nothing to wait for at the end."}
          </Text>
        )}

        {segments.map((seg, i) => (
          <Text key={i} style={s.line}>
            <Text style={s.time}>{clock(seg.start * 1000)}  </Text>
            {seg.text}
          </Text>
        ))}

        {Boolean(partial) && <Text style={[s.line, s.partial]}>{partial}</Text>}
      </ScrollView>

      {Boolean(error) && <Text style={s.error}>{error}</Text>}

      <View style={s.footer}>
        {phase === "idle" && (
          <Pressable style={[s.button, s.record]} onPress={begin}>
            <Text style={s.buttonText}>START RECORDING</Text>
          </Pressable>
        )}
        {recording && (
          <Pressable style={[s.button, s.stop]} onPress={finish}>
            <Text style={s.buttonText}>STOP</Text>
          </Pressable>
        )}
        {phase === "stopping" && (
          <View style={[s.button, s.stop]}>
            <ActivityIndicator color="#fff" />
          </View>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg, paddingTop: 44 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingBottom: 12,
  },
  back: { color: C.textSecondary, fontSize: 15 },
  heading: { color: C.textPrimary, fontSize: 15, fontWeight: "700", letterSpacing: 2 },
  input: {
    marginHorizontal: 16, marginBottom: 12, padding: 14,
    backgroundColor: C.surface, borderRadius: 12, color: C.textPrimary,
    borderWidth: 1, borderColor: C.border, fontSize: 15,
  },
  statusRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 18, paddingBottom: 10,
  },
  dot: { width: 9, height: 9, borderRadius: 9, backgroundColor: C.red },
  clock: { color: C.textPrimary, fontSize: 19, fontVariant: ["tabular-nums"] },
  meta: { color: C.textTertiary, fontSize: 12 },
  transcript: { flex: 1, backgroundColor: C.surface, marginHorizontal: 12, borderRadius: 14 },
  hint: { color: C.textTertiary, fontSize: 13.5, lineHeight: 21 },
  line: { color: C.textPrimary, fontSize: 14.5, lineHeight: 23, marginBottom: 10 },
  time: { color: C.textTertiary, fontSize: 11.5, fontVariant: ["tabular-nums"] },
  partial: { color: C.textSecondary, fontStyle: "italic" },
  error: { color: C.red, fontSize: 13, paddingHorizontal: 18, paddingTop: 10 },
  footer: { padding: 16, paddingBottom: 28 },
  button: { paddingVertical: 17, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  record: { backgroundColor: C.emerald },
  stop: { backgroundColor: C.red },
  buttonText: { color: "#fff", fontSize: 14, fontWeight: "700", letterSpacing: 1.5 },
});
