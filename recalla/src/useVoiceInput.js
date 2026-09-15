// ============================================================
// FILE PATH:  recalla/src/useVoiceInput.js
// PURPOSE:    Speak-to-Recalla, on every platform.
//
// Two engines, chosen automatically:
//
//   native   Chrome, Edge and Android expose SpeechRecognition. Results
//            stream back word by word, so the user sees text as they talk.
//
//   whisper  iOS Safari has no SpeechRecognition at all. There we record
//            audio and post it to the transcription endpoint Recalla already
//            runs. No live preview, but it works — and it uses the same
//            model as meeting transcription.
// ============================================================

import { useState, useRef, useCallback, useEffect } from "react";
import { hasNativeSpeech, hasMicRecording, API_MEETINGS } from "./config";

export function useVoiceInput({ onResult, onError, lang = "en-US" } = {}) {
  const [listening, setListening]   = useState(false);
  const [interim, setInterim]       = useState("");
  const [level, setLevel]           = useState(0);
  const [transcribing, setTranscribing] = useState(false);

  const recognitionRef = useRef(null);
  const mediaRef       = useRef(null);
  const chunksRef      = useRef([]);
  const streamRef      = useRef(null);
  const audioCtxRef    = useRef(null);
  const rafRef         = useRef(null);
  const finalRef       = useRef("");

  const engine = hasNativeSpeech() ? "native" : hasMicRecording() ? "whisper" : "none";
  const supported = engine !== "none";

  const cleanupAudio = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      audioCtxRef.current.close().catch(() => {});
    }
    audioCtxRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setLevel(0);
  }, []);

  useEffect(() => () => {
    try { recognitionRef.current?.abort(); } catch { /* not started */ }
    try { mediaRef.current?.stop(); } catch { /* not started */ }
    cleanupAudio();
  }, [cleanupAudio]);

  /** Drive the mic level ring while listening. */
  const meter = useCallback((stream) => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);

      const tick = () => {
        analyser.getByteFrequencyData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += data[i];
        setLevel(Math.min(1, sum / data.length / 90));
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch { /* meter is cosmetic */ }
  }, []);

  // ── Native ─────────────────────────────────────────────────────────────────

  const startNative = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = true;

    finalRef.current = "";

    rec.onresult = (e) => {
      let live = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const chunk = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalRef.current += chunk + " ";
        else live += chunk;
      }
      setInterim(live);
    };

    rec.onerror = (e) => {
      setListening(false);
      cleanupAudio();
      if (e.error === "no-speech") return;                 // benign
      if (e.error === "not-allowed") {
        onError?.("Microphone permission denied. Allow it in your browser settings.");
      } else if (e.error === "network") {
        onError?.("Speech service unreachable. Check your connection.");
      } else {
        onError?.(`Voice input failed (${e.error})`);
      }
    };

    rec.onend = () => {
      setListening(false);
      cleanupAudio();
      const text = (finalRef.current + interim).trim();
      setInterim("");
      if (text) onResult?.(text);
    };

    recognitionRef.current = rec;
    rec.start();
    setListening(true);

    navigator.mediaDevices?.getUserMedia({ audio: true })
      .then((s) => { streamRef.current = s; meter(s); })
      .catch(() => { /* recognition still works without the meter */ });
    // `interim` is intentionally read at call time inside onend.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, onResult, onError, meter, cleanupAudio]);

  // ── Whisper fallback (iOS Safari) ──────────────────────────────────────────

  const startWhisper = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      meter(stream);

      const mime = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4") ? "audio/mp4" : "";

      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };

      rec.onstop = async () => {
        cleanupAudio();
        const type = mime || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        if (blob.size < 1200) { setTranscribing(false); return; }   // basically silence

        setTranscribing(true);
        try {
          const fd = new FormData();
          fd.append("audio", blob, type.includes("mp4") ? "speech.m4a" : "speech.webm");
          const res = await fetch(`${API_MEETINGS}/transcribe`, { method: "POST", body: fd });
          if (!res.ok) throw new Error("Could not transcribe");
          const data = await res.json();
          const text = (data.transcript?.full_text || "").trim();
          if (text) onResult?.(text);
          else onError?.("Didn't catch that — try again.");
        } catch (e) {
          onError?.(e.message || "Could not transcribe that");
        } finally {
          setTranscribing(false);
        }
      };

      mediaRef.current = rec;
      rec.start();
      setListening(true);
    } catch {
      onError?.("Microphone permission denied.");
    }
  }, [onResult, onError, meter, cleanupAudio]);

  // ── Public controls ────────────────────────────────────────────────────────

  const start = useCallback(() => {
    if (listening || transcribing) return;
    if (engine === "native") startNative();
    else if (engine === "whisper") startWhisper();
    else onError?.("This browser cannot record audio.");
  }, [listening, transcribing, engine, startNative, startWhisper, onError]);

  const stop = useCallback(() => {
    if (engine === "native") {
      try { recognitionRef.current?.stop(); } catch { /* already stopped */ }
    } else {
      try { mediaRef.current?.stop(); } catch { /* already stopped */ }
      setListening(false);
    }
  }, [engine]);

  const toggle = useCallback(() => (listening ? stop() : start()), [listening, stop, start]);

  return { supported, engine, listening, transcribing, interim, level, start, stop, toggle };
}
