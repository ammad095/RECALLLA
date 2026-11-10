// ============================================================
// FILE PATH:  recalla/src/RecordMeeting.jsx
// PURPOSE:    Record audio, transcribe, auto-generate AI summary.
//             3 states: idle (setup) → recording → processing.
// ============================================================

import { useState, useRef, useEffect } from "react";
import {
  Mic, Square, Upload, ChevronDown, UserPlus, X, ShieldCheck, Users, MessageSquareText, Check, Loader2,
} from "lucide-react";
import { transcribeAudio, finalizeLiveSession } from "./api";
import { BrowserTranscription, browserSttSupported, transcribeFile } from "./localStt";
import { assignSpeakers } from "./diarize";
import { summarizeTranscript } from "./agent_api";
import { saveMeeting, getSettings } from "./data_api";
import { fmtClock } from "./format";
import { cssColor } from "./theme";
import { Screen, Banner } from "./ui/kit";
import { useShell } from "./ui/shellContext";

// Batch path (file uploads) — transcription happens after the fact.
//
// These strings are the only thing the user sees while waiting, so they name
// the outcome rather than the machinery. Which model is loading, and how, is
// not a decision they can act on.
const PROCESSING_STEPS = [
  "Getting ready",
  "Writing the transcript",
  "Working out who spoke",
  "Writing the summary",
  "Done",
];

// Live path — transcription already happened during the recording, so all
// that's left is speaker clustering, tagging and the summary.
const LIVE_STEPS = [
  "Working out who spoke",
  "Picking out topics",
  "Writing the summary",
  "Done",
];

const MEETING_TYPES = ["Team Meeting", "Supervisor Meeting", "Lecture", "Interview", "One-on-One"];

export default function RecordMeeting({ navigate }) {
  const { setImmersive } = useShell();
  const [state, setState]               = useState("idle");     // idle | recording | processing
  const [title, setTitle]               = useState("");
  const [meetingType, setMeetingType]   = useState("Team Meeting");
  const [participants, setParticipants] = useState([]);
  const [newParticipant, setNewParticipant] = useState("");
  const [detailsOpen, setDetailsOpen]   = useState(false);
  const [elapsed, setElapsed]           = useState(0);
  const [progress, setProgress]         = useState(0);
  const [currentStep, setCurrentStep]   = useState(0);
  const [error, setError]               = useState(null);

  // Live pipeline
  const [isLive, setIsLive]             = useState(false);
  const [liveSegments, setLiveSegments] = useState([]);
  const [liveQueued, setLiveQueued]     = useState(0);
  // First run downloads the speech model (~40 MB) into the browser cache.
  const [modelPct, setModelPct]         = useState(null);
  const browserSttRef                   = useRef(null);
  // Stop reads the transcript synchronously, and setState would be a render
  // behind — the last slice would be missing from the saved meeting.
  const liveSegmentsRef                 = useRef([]);

  const liveRecorderRef  = useRef(null);
  const sessionIdRef     = useRef(null);
  const transcriptEndRef = useRef(null);

  const mediaRecorderRef = useRef(null);
  const chunksRef        = useRef([]);
  const streamRef        = useRef(null);
  const audioCtxRef      = useRef(null);
  const analyserRef      = useRef(null);
  const canvasRef        = useRef(null);
  const animationRef     = useRef(null);
  const timerRef         = useRef(null);
  const startTimeRef     = useRef(0);

  // The usual meeting type is a setting; start from it.
  useEffect(() => {
    getSettings().then((s) => s.default_meeting_type && setMeetingType(s.default_meeting_type)).catch(() => {});
  }, []);

  // While recording or processing, the tab bar is hidden: one stray tap
  // should not walk away from a meeting in progress.
  useEffect(() => {
    setImmersive(state !== "idle");
    return () => setImmersive(false);
  }, [state, setImmersive]);

  const cleanup = () => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    if (liveRecorderRef.current) {
      liveRecorderRef.current.stop().catch(() => {});
      liveRecorderRef.current = null;
    }
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      audioCtxRef.current.close().catch(() => {});
    }
  };

  // Cleanup on unmount
  useEffect(() => () => cleanup(), []);

  // Keep the newest line in view as the transcript grows.
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [liveSegments.length]);

  const addParticipant = () => {
    const name = newParticipant.trim();
    if (!name) return;
    setParticipants((p) => [...p, name]);
    setNewParticipant("");
  };

  const startRecording = async () => {
    setError(null);

    // On the Android app, recording belongs to the native side: it streams
    // from the microphone, transcribes in 25-second slices while the meeting
    // is still running, and stores the result on the device before any
    // upload. A page in a WebView can do none of that, and the browser path
    // below would send audio to a server that no longer transcribes.
    if (window.RecallaNative?.hasOnDeviceSTT) {
      window.RecallaNative.record();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Audio context for visualization
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      setLiveSegments([]);
      liveSegmentsRef.current = [];
      sessionIdRef.current = null;
      let live = false;

      // Transcription happens here, in this browser. The server carries no
      // speech model — audio belongs to whoever recorded it and never
      // leaves the device. Slices are cut every 25 seconds and transcribed
      // as they close, so the transcript is nearly complete by the time
      // anyone presses stop.
      if (browserSttSupported()) {
        try {
          const bt = new BrowserTranscription({
            onSegments: (segs) =>
              setLiveSegments((prev) => {
                const all = [...prev, ...segs].sort((a, b) => a.start - b.start);
                liveSegmentsRef.current = all;
                return all;
              }),
            onPending: setLiveQueued,
            onModelProgress: setModelPct,
            onError: (e) => console.warn("[Recalla] slice failed:", e),
          });
          await bt.start();
          browserSttRef.current = bt;
          live = true;
        } catch (e) {
          // There is no useful fallback: the server carries no speech model,
          // so uploading would fail with a server-side error that tells the
          // user nothing. Say what actually went wrong instead.
          console.error("[Recalla] in-browser transcription failed:", e);
          browserSttRef.current = null;
          setError(
            `Could not start transcription in this browser: ${e.message}. ` +
            "Try Chrome or Edge, or record from the Recalla app."
          );
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
      } else {
        setError(
          "This browser cannot transcribe on its own. Use a recent Chrome, Edge, " +
          "Firefox or Safari, or the Recalla app."
        );
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      setIsLive(live);

      // MediaRecorder only runs as the fallback. When the browser is
      // transcribing, the PCM is already captured through the AudioContext,
      // so a second encoded copy would waste memory — and its onstop would
      // fire the old upload path alongside the local one.
      if (!live) {
        const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
        chunksRef.current = [];
        recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
        recorder.onstop = () => {
          if (!sessionIdRef.current && !browserSttRef.current) handleRecordingStop();
        };
        recorder.start();
        mediaRecorderRef.current = recorder;
      } else {
        mediaRecorderRef.current = null;
      }

      setState("recording");
      setElapsed(0);
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);

      // The canvas mounts with the recording view; draw once it exists.
      requestAnimationFrame(drawWaveform);
    } catch {
      setError("Recalla needs the microphone. Allow microphone access and try again.");
    }
  };

  const drawWaveform = () => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    // Sharp on high-density phone screens.
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const ctx = canvas.getContext("2d");
    const data = new Uint8Array(analyser.frequencyBinCount);
    // Canvas cannot read CSS variables — resolve the theme colours once.
    const from = cssColor("brand"), to = cssColor("brand");

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(data);
      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const bars = 40;
      const gap = 3 * dpr;
      const bw = (w - gap * (bars - 1)) / bars;
      const grad = ctx.createLinearGradient(0, 0, w, 0);
      grad.addColorStop(0, from);
      grad.addColorStop(1, to);
      ctx.fillStyle = grad;
      for (let i = 0; i < bars; i++) {
        const v = data[Math.floor((i * data.length) / bars)] / 255;
        const bh = Math.max(4 * dpr, v * h * 0.9);
        const x = i * (bw + gap);
        const y = (h - bh) / 2;
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(x, y, bw, bh, bw / 2) : ctx.rect(x, y, bw, bh);
        ctx.fill();
      }
    };
    draw();
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) clearInterval(timerRef.current);
    if (animationRef.current) cancelAnimationFrame(animationRef.current);

    // The transcript already exists — this is just the summary.
    if (browserSttRef.current) handleLocalStop();
    else if (sessionIdRef.current) handleLiveStop();
  };

  const handleLocalStop = async () => {
    setState("processing");
    setCurrentStep(0);
    setProgress(30);

    const bt = browserSttRef.current;
    const { durationMs } = await bt.stop();

    // Wait only for slices still decoding — usually the final one. Capped,
    // because a wedged worker must not strand the meeting.
    const deadline = Date.now() + 120000;
    while (bt.pendingCount() > 0 && Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 400));
    }
    bt.release();
    browserSttRef.current = null;
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());

    setCurrentStep(1);
    setProgress(70);

    // Group the voice fingerprints into speakers. The participant list is
    // passed as a hint: someone who says two people were in the room is
    // better evidence than a clustering score from half a minute of audio.
    const segs = assignSpeakers(
      liveSegmentsRef.current,
      participants.length > 1 ? participants.length : null
    );
    const fullText = segs.map((x) => x.text).join(" ").replace(/\s+/g, " ").trim();

    let aiSummary = null, keyPoints = [];
    try {
      const sum = await summarizeTranscript(fullText, true);
      aiSummary = sum.summary;
      keyPoints = sum.key_points || [];
    } catch (e) {
      console.error("Summary failed:", e);
    }

    setCurrentStep(2);
    setProgress(95);

    try {
      const saved = await saveMeeting({
        title: title.trim() || "Untitled meeting",
        full_text: fullText,
        segments: segs,
        duration_s: Math.round(durationMs / 1000),
        summary: aiSummary,
        key_points: keyPoints,
        participants,
        meeting_type: meetingType,
      });
      setCurrentStep(3);
      setProgress(100);
      // Straight to the meeting that was just saved.
      navigate("detail", { id: saved.id });
    } catch (e) {
      setError(`Could not save the meeting: ${e.message}`);
      setState("idle");
    }
  };

  const handleLiveStop = async () => {
    const sid = sessionIdRef.current;
    setState("processing");
    setCurrentStep(0);
    setProgress(20);

    try {
      // Flush the final partial window and drain any queued uploads.
      if (liveRecorderRef.current) {
        await liveRecorderRef.current.stop();
        liveRecorderRef.current = null;
      }
      setProgress(45);

      const result = await finalizeLiveSession(sid, true);
      if (result.status !== "done") throw new Error(result.error || "Finalize failed");

      setCurrentStep(1);
      setProgress(70);

      setCurrentStep(2);
      let aiSummary = null, keyPoints = [];
      try {
        const sum = await summarizeTranscript(result.full_text, true);
        aiSummary = sum.summary;
        keyPoints = sum.key_points || [];
      } catch (e) {
        console.error("Summary failed:", e);
      }

      setCurrentStep(3);
      setProgress(100);

      // Persist to the account before navigating, so the meeting survives a
      // refresh and shows up in the meetings list.
      let savedId = null;
      try {
        const res = await saveMeeting({
          title: title || "Untitled Meeting",
          meeting_type: meetingType,
          duration_seconds: result.audio_seconds || 0,
          language: "en",
          full_text: result.full_text || "",
          summary: aiSummary,
          key_points: keyPoints,
          segments: result.segments || [],
          tagging: result.tagging || {},
          source: "live",
          transcript_model: "base",
          live_session_id: sid,
        });
        savedId = res.id;
      } catch (e) {
        console.error("Could not save meeting:", e);
        setError("Recorded, but saving failed: " + e.message);
      }

      const speakers = [...new Set(result.segments.map((s) => s.speaker || "Speaker 1"))];
      const meeting = {
        id:           savedId,
        sessionId:    sid,
        title:        title || "Untitled Meeting",
        type:         meetingType,
        date:         new Date().toLocaleString(),
        duration:     `${Math.max(1, Math.round((result.audio_seconds || 0) / 60))}m`,
        wordCount:    (result.full_text || "").split(/\s+/).filter(Boolean).length,
        language:     "en",
        participants: speakers,
        tags:         result.tagging?.auto_tags || [],
        transcript:   result.segments,
        fullText:     result.full_text,
        aiSummary,
        keyPoints,
        tagging:      result.tagging,
        liveMode:     true,
      };

      // The high-accuracy pass carries on server-side. `sessionId` travels with
      // the meeting so MeetingDetail can pick up the upgraded transcript.
      setTimeout(() => navigate("detail", meeting), 600);
    } catch (err) {
      setError(err.message || "Could not finish the recording");
      setState("idle");
    } finally {
      sessionIdRef.current = null;
    }
  };

  const handleRecordingStop = async () => {
    const blob = new Blob(chunksRef.current, { type: "audio/webm" });
    setState("processing");
    setProgress(0);
    setCurrentStep(0);

    try {
      const onProgress = ({ status, progress: p }) => {
        setProgress(p || 0);
        const stepMap = {
          starting: 0, pending: 0, loading_model: 0,
          transcribing: 1, diarizing: 2, tagging: 3, done: 3,
        };
        if (status in stepMap) setCurrentStep(stepMap[status]);
      };

      const expectedSpeakers = participants.length > 0 ? participants.length : null;
      const result = await transcribeAudio(blob, "recording.webm", onProgress, { expectedSpeakers });

      setCurrentStep(3);
      setProgress(95);
      let aiSummary = null;
      let keyPoints = [];
      try {
        const sumRes = await summarizeTranscript(result.transcript.full_text, true);
        aiSummary = sumRes.summary;
        keyPoints = sumRes.key_points || [];
      } catch (e) {
        console.error("Summary failed:", e);
      }

      setCurrentStep(4);
      setProgress(100);

      const speakers = [...new Set(result.transcript.segments.map((s) => s.speaker || "Speaker 1"))];
      const meeting = {
        id:           Date.now(),
        title:        title || "Untitled Meeting",
        type:         meetingType,
        date:         new Date().toLocaleString(),
        duration:     `${Math.round(result.transcript.duration / 60)}m`,
        wordCount:    result.transcript.word_count,
        language:     result.transcript.language,
        participants: speakers,
        tags:         result.tagging.auto_tags || [],
        transcript:   result.transcript.segments,
        fullText:     result.transcript.full_text,
        aiSummary,
        keyPoints,
        tagging:      result.tagging,
      };

      setTimeout(() => navigate("detail", meeting), 800);
    } catch (err) {
      setError(err.message || "Processing failed");
      setState("idle");
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    e.target.value = "";          // picking the same file again still fires
    if (!file) return;

    if (!browserSttSupported()) {
      setError("This browser cannot transcribe on its own. Try Chrome, Edge or Safari.");
      return;
    }

    setState("processing");
    setIsLive(false);
    setProgress(0);
    setCurrentStep(1);
    setError(null);
    setLiveSegments([]);
    liveSegmentsRef.current = [];

    try {
      // The same browser worker that handles live recording. Uploading to
      // the server is not an option: it carries no speech model.
      const { segments, durationMs } = await transcribeFile(file, {
        onProgress: ({ stage, pct }) => {
          setModelPct(stage === "model" ? pct : null);
          if (stage === "transcribe") setProgress(Math.max(10, Math.round(pct * 0.7)));
        },
        onSegments: (segs) =>
          setLiveSegments((prev) => {
            const all = [...prev, ...segs].sort((a, b) => a.start - b.start);
            liveSegmentsRef.current = all;
            return all;
          }),
      });

      const withSpeakers = assignSpeakers(
        segments,
        participants.length > 1 ? participants.length : null
      );
      const fullText = withSpeakers.map((x) => x.text).join(" ").replace(/\s+/g, " ").trim();

      setCurrentStep(2);
      setProgress(80);

      let aiSummary = null, keyPoints = [];
      try {
        const sum = await summarizeTranscript(fullText, true);
        aiSummary = sum.summary;
        keyPoints = sum.key_points || [];
      } catch (err) {
        console.error("Summary failed:", err);
      }

      setCurrentStep(3);
      setProgress(95);

      const saved = await saveMeeting({
        title: title.trim() || file.name.replace(/\.[^.]+$/, ""),
        full_text: fullText,
        segments: withSpeakers,
        duration_s: Math.round(durationMs / 1000),
        summary: aiSummary,
        key_points: keyPoints,
        participants,
        meeting_type: meetingType,
      });
      navigate("detail", { id: saved.id });
    } catch (err) {
      setError(`Could not transcribe that file: ${err.message}`);
      setState("idle");
    }
  };

  // ── Recording: full screen, nothing else to tap ──────────────────────────
  if (state === "recording") {
    return (
      <div className="flex h-full flex-col" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <div className="flex items-center justify-center gap-2 pt-6 text-sm font-medium text-danger">
          <span className="rec-dot animate-blink" /> Recording
        </div>
        {title && <p className="mt-1 truncate px-6 text-center text-muted">{title}</p>}

        <div className="mt-6 text-center font-mono text-6xl font-medium tabular-nums sm:text-7xl" aria-live="off">
          {fmtClock(elapsed)}
        </div>

        <div className="mx-auto mt-6 w-full max-w-md px-6">
          <canvas ref={canvasRef} className="h-16 w-full" aria-hidden="true" />
        </div>

        {/* Live transcript */}
        {isLive && (
          <div className="mx-auto mt-6 flex min-h-0 w-full max-w-2xl flex-1 flex-col px-4">
            <div className="mb-2 flex items-center justify-between text-[13px]">
              <span className="font-medium text-muted">Live transcript</span>
              <span className="text-subtle">
                {modelPct != null && modelPct < 100 ? `Preparing speech model · ${Math.round(modelPct)}%`
                  : liveQueued > 1 ? `${liveQueued} slices waiting`
                  : liveSegments.length ? "Keeping up" : "Listening…"}
              </span>
            </div>
            <div className="card min-h-0 flex-1 overflow-y-auto p-4">
              {liveSegments.length === 0 ? (
                <p className="py-6 text-center text-[15px] leading-relaxed text-subtle">
                  The first words appear after about 20 seconds,<br />then keep pace with the meeting.
                </p>
              ) : (
                <div className="space-y-3">
                  {liveSegments.map((s, i) => (
                    <div key={`${s.start}-${i}`} className="flex gap-3 animate-rise">
                      <span className="w-11 shrink-0 pt-0.5 font-mono text-xs text-subtle">{fmtClock(s.start)}</span>
                      <span className="font-serif text-[17px] leading-relaxed">{s.text}</span>
                    </div>
                  ))}
                </div>
              )}
              <div ref={transcriptEndRef} />
            </div>
            <p className="mt-2 text-center text-xs text-subtle">Speakers are labelled when you stop</p>
          </div>
        )}

        <div className="mt-auto flex flex-col items-center gap-2 pt-6 pb-[calc(28px+env(safe-area-inset-bottom))]">
          <button onClick={stopRecording} aria-label="Stop and save the recording"
                  className="bg-rec-fill grid size-20 place-items-center rounded-full text-white shadow-pop ring-8 ring-danger/20 transition-[scale] duration-200 active:scale-95">
            <Square size={28} fill="currentColor" />
          </button>
          <span className="text-sm text-muted">Tap to stop and save</span>
        </div>
      </div>
    );
  }

  // ── Processing ──────────────────────────────────────────────────────────
  if (state === "processing") {
    const steps = isLive ? LIVE_STEPS : PROCESSING_STEPS;
    return (
      <div className="flex h-full items-center justify-center px-5" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <div className="w-full max-w-md animate-rise" role="status" aria-live="polite">
          <span className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl bg-surface-3 text-muted">
            <MessageSquareText size={28} />
          </span>
          <h1 className="text-center text-xl font-medium">Making sense of your meeting</h1>
          <p className="mt-1 text-center text-muted">{title || "Untitled meeting"}</p>

          <div className="mt-6 h-2 overflow-hidden rounded-full bg-surface-3">
            <div className="h-full rounded-full bg-brand transition-[width] duration-500"
                 style={{ width: `${Math.round(progress)}%` }} />
          </div>
          <p className="mt-1.5 text-right text-xs text-subtle tabular-nums">{Math.round(progress)}%</p>

          <ol className="card mt-4 space-y-1 p-3">
            {steps.map((step, i) => {
              const done = i < currentStep, now = i === currentStep;
              return (
                <li key={step} className={`flex min-h-10 items-center gap-3 px-1 transition-opacity ${i > currentStep ? "opacity-40" : ""}`}>
                  <span className={`grid size-6 shrink-0 place-items-center rounded-full
                    ${done ? "bg-brand text-on-brand" : now ? "bg-surface-3 text-fg" : "bg-surface-3 text-subtle"}`}>
                    {done ? <Check size={14} strokeWidth={3} /> : now ? <Loader2 size={14} className="animate-spin" /> : <span className="size-1.5 rounded-full bg-current" />}
                  </span>
                  <span className={`text-[15px] ${now ? "font-medium" : done ? "text-muted" : ""}`}>{step}</span>
                </li>
              );
            })}
          </ol>
          {modelPct != null && modelPct < 100 && (
            <p className="mt-3 text-center text-sm text-subtle">First time only: preparing the speech model · {Math.round(modelPct)}%</p>
          )}
          <p className="mt-4 text-center text-sm text-subtle">Keep this screen open until it finishes</p>
        </div>
      </div>
    );
  }

  // ── Idle: one big button, everything else optional ──────────────────────
  return (
    <Screen title="Record" subtitle="Capture a meeting as it happens" width="max-w-xl">
      {error && <Banner className="mb-5" onClose={() => setError(null)}>{error}</Banner>}

      <div className="flex flex-col items-center pt-4 pb-6 text-center sm:pt-8">
        <button onClick={startRecording} aria-label="Start recording"
                className="bg-rec-fill group relative grid size-36 place-items-center rounded-full text-white shadow-pop
                           transition-[scale,box-shadow] duration-300 active:scale-95 sm:size-40">
          <span className="absolute -inset-3 rounded-full border-2 border-danger/25" aria-hidden="true" />
          <Mic size={48} strokeWidth={1.8} className="relative" />
        </button>
        <h2 className="mt-7 text-xl font-medium">Tap to start recording</h2>
        <p className="mt-1.5 max-w-sm text-[15px] leading-relaxed text-muted">
          Put your phone on the table. Recalla writes down what's said and tidies it up when you stop.
        </p>

        <ul className="mt-5 flex flex-wrap justify-center gap-2 text-[13px]">
          {[
            { Icon: ShieldCheck, text: "Audio stays on this device" },
            { Icon: Users, text: "Speakers labelled" },
            { Icon: MessageSquareText, text: "Summary when you stop" },
          ].map(({ Icon, text }) => (
            <li key={text} className="inline-flex items-center gap-1.5 rounded-md bg-surface-3 px-3 py-1.5 text-muted">
              <Icon size={14} className="text-brand" /> {text}
            </li>
          ))}
        </ul>
      </div>

      {/* Optional details — better speaker labels and titles, never required */}
      <section className="card overflow-hidden">
        <button onClick={() => setDetailsOpen((o) => !o)} aria-expanded={detailsOpen}
                className="flex min-h-14 w-full items-center gap-3 px-4 text-left">
          <span className="min-w-0 flex-1">
            <span className="block font-medium">Meeting details</span>
            <span className="block truncate text-[13px] text-subtle">
              {title || participants.length
                ? [title, participants.length && `${participants.length} people`].filter(Boolean).join(" · ")
                : "Optional — a title and who's there"}
            </span>
          </span>
          <ChevronDown size={20} className={`shrink-0 text-subtle transition-transform ${detailsOpen ? "rotate-180" : ""}`} />
        </button>

        {detailsOpen && (
          <div className="space-y-4 border-t border-line p-4 animate-fade-in">
            <div>
              <label className="label" htmlFor="m-title">Title</label>
              <input id="m-title" className="input" value={title} onChange={(e) => setTitle(e.target.value)}
                     placeholder="Weekly project sync" />
            </div>
            <div>
              <span className="label">Kind of meeting</span>
              <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
                {MEETING_TYPES.map((t) => (
                  <button key={t} aria-pressed={meetingType === t} onClick={() => setMeetingType(t)} className="chip">{t}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="label" htmlFor="m-person">Who's there</label>
              <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); addParticipant(); }}>
                <input id="m-person" className="input" value={newParticipant} enterKeyHint="done"
                       onChange={(e) => setNewParticipant(e.target.value)} placeholder="Add a name" />
                <button type="submit" className="btn btn-secondary px-3" aria-label="Add person" disabled={!newParticipant.trim()}>
                  <UserPlus size={18} />
                </button>
              </form>
              {participants.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {participants.map((p, i) => (
                    <span key={`${p}-${i}`} className="inline-flex items-center gap-1 rounded-full bg-ai/12 py-1 pr-1 pl-3 text-sm font-medium text-ai">
                      {p}
                      <button onClick={() => setParticipants(participants.filter((_, idx) => idx !== i))}
                              aria-label={`Remove ${p}`} className="grid size-6 place-items-center rounded-full hover:bg-ai/20">
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <p className="mt-2 text-[13px] text-subtle">Knowing how many people are talking helps Recalla tell voices apart.</p>
            </div>
          </div>
        )}
      </section>

      <label className="btn btn-ghost mt-3 w-full border border-dashed border-line-strong">
        <Upload size={18} /> Upload a recording instead
        <input type="file" accept="audio/*" onChange={handleFileUpload} className="sr-only" />
      </label>
    </Screen>
  );
}
