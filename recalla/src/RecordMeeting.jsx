// ============================================================
// FILE PATH:  recalla/src/RecordMeeting.jsx
// PURPOSE:    Record audio, transcribe, auto-generate AI summary.
//             3 states: idle (setup) → recording → processing.
// ============================================================

import { useState, useRef, useEffect } from "react";
import { COLORS, FONTS, GLOBAL_CSS } from "./theme";
import Sidebar from "./Sidebar";
import { transcribeAudio } from "./api";
import { summarizeTranscript } from "./agent_api";

const PROCESSING_STEPS = [
  "Loading Whisper model",
  "Transcribing audio",
  "Detecting speakers",
  "Generating AI summary",
  "Done",
];

export default function RecordMeeting({ navigate }) {
  const [state, setState]               = useState("idle");     // idle | recording | processing
  const [title, setTitle]               = useState("");
  const [meetingType, setMeetingType]   = useState("Team Meeting");
  const [participants, setParticipants] = useState([]);
  const [newParticipant, setNewParticipant] = useState("");
  const [elapsed, setElapsed]           = useState(0);
  const [progress, setProgress]         = useState(0);
  const [currentStep, setCurrentStep]   = useState(0);
  const [error, setError]               = useState(null);

  const mediaRecorderRef = useRef(null);
  const chunksRef        = useRef([]);
  const streamRef        = useRef(null);
  const audioCtxRef      = useRef(null);
  const analyserRef      = useRef(null);
  const canvasRef        = useRef(null);
  const animationRef     = useRef(null);
  const timerRef         = useRef(null);
  const startTimeRef     = useRef(0);

  // Cleanup on unmount
  useEffect(() => () => cleanup(), []);

  const cleanup = () => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      audioCtxRef.current.close().catch(() => {});
    }
  };

  const startRecording = async () => {
    setError(null);
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

      // MediaRecorder
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = handleRecordingStop;
      recorder.start();
      mediaRecorderRef.current = recorder;

      setState("recording");
      setElapsed(0);
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);

      drawWaveform();
    } catch (err) {
      setError("Microphone access denied. Please allow microphone permissions.");
    }
  };

  const drawWaveform = () => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext("2d");
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const barCount = 64;
      const barWidth = w / barCount;
      for (let i = 0; i < barCount; i++) {
        const val = dataArray[Math.floor(i * dataArray.length / barCount)];
        const barH = (val / 255) * h * 0.85;
        const x = i * barWidth;
        const y = (h - barH) / 2;

        // Gradient bars
        const gradient = ctx.createLinearGradient(0, y, 0, y + barH);
        gradient.addColorStop(0, COLORS.emerald);
        gradient.addColorStop(1, COLORS.cyan);
        ctx.fillStyle = gradient;
        ctx.fillRect(x + 1, y, barWidth - 2, barH);
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

      // Step 4 — Auto-generate AI summary
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

      // Build meeting from real data
      const speakers = [...new Set(result.transcript.segments.map(s => s.speaker || "Speaker 1"))];

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
        aiSummary:    aiSummary,
        keyPoints:    keyPoints,
        tagging:      result.tagging,
      };

      setTimeout(() => navigate("detail", meeting), 800);

    } catch (err) {
      setError(err.message || "Processing failed");
      setState("idle");
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setState("processing");
    setProgress(0);
    setCurrentStep(0);
    chunksRef.current = [file];
    handleRecordingStop();
  };

  const fmtTime = (s) => `${Math.floor(s/60).toString().padStart(2,"0")}:${(s%60).toString().padStart(2,"0")}`;

  // ── Render based on state ──────────────────────────────────────────────
  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div style={{ display: "flex", height: "100vh", width: "100vw", background: COLORS.bg }}>
        <Sidebar active="record" navigate={navigate}/>

        <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <header style={{
            padding: "18px 28px", borderBottom: `1px solid ${COLORS.border}`,
          }}>
            <div style={{ fontFamily: FONTS.heading, fontSize: 26, lineHeight: 1, textTransform: "uppercase", letterSpacing: "0.02em" }}>
              Record <span style={{ color: COLORS.emerald }}>Meeting</span>
            </div>
            <div style={{
              fontFamily: FONTS.mono, fontSize: 10, color: COLORS.textSecondary,
              marginTop: 4, textTransform: "uppercase", letterSpacing: "0.12em",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <span className="status-dot" style={{
                background: state === "recording" ? COLORS.red : state === "processing" ? COLORS.amber : COLORS.emerald,
                animationDuration: state === "recording" ? "0.8s" : "2s",
              }}/>
              {state === "idle" && "Ready"}
              {state === "recording" && `Recording · ${fmtTime(elapsed)}`}
              {state === "processing" && "Processing..."}
            </div>
          </header>

          <div style={{ flex: 1, overflowY: "auto", padding: "32px 28px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: "100%", maxWidth: 640 }}>

              {/* ── IDLE STATE ──────────────────────────────────────── */}
              {state === "idle" && (
                <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 24 }}>

                  {/* Form fields */}
                  <div className="corners" style={{
                    background: COLORS.surface, border: `1px solid ${COLORS.border}`,
                    padding: "20px 24px",
                  }}>
                    <div style={{ display: "grid", gap: 14 }}>
                      <div>
                        <label style={{
                          display: "block", fontFamily: FONTS.mono, fontSize: 10,
                          color: COLORS.textSecondary, textTransform: "uppercase",
                          letterSpacing: "0.1em", marginBottom: 6,
                        }}>Title</label>
                        <input
                          type="text"
                          value={title}
                          onChange={e => setTitle(e.target.value)}
                          placeholder="What's this meeting about?"
                          style={{
                            width: "100%", background: COLORS.bg,
                            border: `1px solid ${COLORS.border}`, color: COLORS.textPrimary,
                            padding: "10px 14px", fontFamily: FONTS.body, fontSize: 14,
                            outline: "none",
                          }}
                        />
                      </div>

                      <div>
                        <label style={{
                          display: "block", fontFamily: FONTS.mono, fontSize: 10,
                          color: COLORS.textSecondary, textTransform: "uppercase",
                          letterSpacing: "0.1em", marginBottom: 6,
                        }}>Participants ({participants.length})</label>
                        <div style={{ display: "flex", gap: 6, marginBottom: participants.length > 0 ? 10 : 0 }}>
                          <input
                            type="text"
                            value={newParticipant}
                            onChange={e => setNewParticipant(e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter" && newParticipant.trim()) { setParticipants([...participants, newParticipant.trim()]); setNewParticipant(""); } }}
                            placeholder="Add name + Enter"
                            style={{
                              flex: 1, background: COLORS.bg,
                              border: `1px solid ${COLORS.border}`, color: COLORS.textPrimary,
                              padding: "10px 14px", fontFamily: FONTS.body, fontSize: 14,
                              outline: "none",
                            }}
                          />
                        </div>
                        {participants.length > 0 && (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                            {participants.map((p, i) => (
                              <span key={i} style={{
                                fontFamily: FONTS.mono, fontSize: 11, padding: "4px 10px",
                                background: "rgba(167,139,250,0.10)",
                                border: `1px solid ${COLORS.borderViolet}`,
                                color: COLORS.violet, borderRadius: 999,
                                display: "flex", alignItems: "center", gap: 6,
                              }}>
                                {p}
                                <button onClick={() => setParticipants(participants.filter((_, idx) => idx !== i))} style={{ background: "none", border: "none", color: COLORS.violet, cursor: "pointer", padding: 0, fontSize: 14 }}>×</button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Record button */}
                  <button
                    onClick={startRecording}
                    style={{
                      background: `linear-gradient(135deg, ${COLORS.emerald}, ${COLORS.cyan})`,
                      color: COLORS.bg, border: "none",
                      padding: "32px", fontFamily: FONTS.heading, fontSize: 38,
                      textTransform: "uppercase", letterSpacing: "0.02em", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 14,
                      boxShadow: COLORS.glow.emerald,
                    }}
                  >
                    <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor"><rect x="9" y="2" width="6" height="13" rx="3"/><path d="M5 10a7 7 0 0 0 14 0" fill="none" stroke="currentColor" strokeWidth="2"/><line x1="12" y1="19" x2="12" y2="22" stroke="currentColor" strokeWidth="2"/></svg>
                    Start Recording
                  </button>

                  {/* Or upload */}
                  <label style={{
                    background: "transparent", border: `1px dashed ${COLORS.border}`,
                    color: COLORS.textSecondary, padding: "16px",
                    fontFamily: FONTS.mono, fontSize: 12,
                    textTransform: "uppercase", letterSpacing: "0.1em",
                    cursor: "pointer", textAlign: "center", display: "block",
                  }}>
                    Or upload audio file
                    <input type="file" accept="audio/*" onChange={handleFileUpload} style={{ display: "none" }}/>
                  </label>

                  {error && (
                    <div style={{
                      padding: "12px 16px", background: "rgba(248,113,113,0.10)",
                      border: `1px solid rgba(248,113,113,0.3)`, color: COLORS.red,
                      fontFamily: FONTS.mono, fontSize: 12,
                    }}>
                      {error}
                    </div>
                  )}
                </div>
              )}

              {/* ── RECORDING STATE ──────────────────────────────────────── */}
              {state === "recording" && (
                <div className="fade-up corners corners-emerald" style={{
                  background: COLORS.surface, border: `1px solid ${COLORS.borderEmerald}`,
                  padding: "40px 32px", textAlign: "center",
                }}>
                  <div style={{
                    fontFamily: FONTS.mono, fontSize: 10, color: COLORS.red,
                    textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 12,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  }}>
                    <span className="status-dot" style={{ background: COLORS.red, animationDuration: "0.8s" }}/>
                    Recording
                  </div>

                  <div style={{ fontFamily: FONTS.heading, fontSize: 80, lineHeight: 1, color: COLORS.emerald, marginBottom: 24 }}>
                    {fmtTime(elapsed)}
                  </div>

                  <canvas ref={canvasRef} width="500" height="80" style={{ width: "100%", maxWidth: 500, marginBottom: 28, display: "block", margin: "0 auto 28px" }}/>

                  <button
                    onClick={stopRecording}
                    style={{
                      background: COLORS.red, color: COLORS.bg, border: "none",
                      padding: "12px 32px", fontFamily: FONTS.mono, fontSize: 12, fontWeight: 600,
                      textTransform: "uppercase", letterSpacing: "0.1em", cursor: "pointer",
                      borderRadius: 999,
                    }}
                  >
                    Stop Recording
                  </button>
                </div>
              )}

              {/* ── PROCESSING STATE ──────────────────────────────────────── */}
              {state === "processing" && (
                <div className="fade-up corners" style={{
                  background: COLORS.surface, border: `1px solid ${COLORS.border}`,
                  padding: "40px 32px",
                }}>
                  <div style={{
                    fontFamily: FONTS.mono, fontSize: 10, color: COLORS.amber,
                    textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 8,
                    display: "flex", alignItems: "center", gap: 8,
                  }}>
                    <span className="status-dot" style={{ background: COLORS.amber, animationDuration: "0.6s" }}/>
                    Processing
                  </div>
                  <div style={{ fontFamily: FONTS.heading, fontSize: 38, lineHeight: 1, marginBottom: 28, textTransform: "uppercase" }}>
                    {title || "Untitled"}
                  </div>

                  {/* Progress bar */}
                  <div style={{ height: 6, background: COLORS.surfaceRaised, marginBottom: 8 }}>
                    <div style={{
                      height: "100%", width: `${progress}%`,
                      background: `linear-gradient(90deg, ${COLORS.emerald}, ${COLORS.cyan})`,
                      transition: "width 0.5s",
                    }}/>
                  </div>
                  <div style={{
                    fontFamily: FONTS.mono, fontSize: 11, color: COLORS.textSecondary,
                    textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 28,
                  }}>
                    {progress}%
                  </div>

                  {/* Steps */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {PROCESSING_STEPS.map((step, i) => (
                      <div key={i} style={{
                        display: "flex", alignItems: "center", gap: 12,
                        opacity: i <= currentStep ? 1 : 0.35,
                        transition: "opacity 0.3s",
                      }}>
                        <span className="status-dot" style={{
                          background: i < currentStep ? COLORS.emerald : i === currentStep ? COLORS.amber : COLORS.textTertiary,
                          animationDuration: i === currentStep ? "0.6s" : "2s",
                        }}/>
                        <span style={{
                          fontFamily: FONTS.body, fontSize: 14,
                          color: i < currentStep ? COLORS.emerald : i === currentStep ? COLORS.textPrimary : COLORS.textSecondary,
                        }}>
                          {step}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </main>
      </div>
    </>
  );
}