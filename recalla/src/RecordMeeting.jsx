import { useState, useEffect, useRef } from "react";
import { transcribeAudio, checkBackendHealth } from "./api";

// ── Icons ─────────────────────────────────────────────────────────────────────
const Icon = ({ name, size = 20, color = "currentColor" }) => {
  const s = { width: size, height: size, stroke: color, fill: "none", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };
  const icons = {
    mic:        <svg viewBox="0 0 24 24" {...s}><rect x="9" y="2" width="6" height="13" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="8" y1="22" x2="16" y2="22"/></svg>,
    brain:      <svg viewBox="0 0 24 24" {...s}><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/></svg>,
    clock:      <svg viewBox="0 0 24 24" {...s}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    search:     <svg viewBox="0 0 24 24" {...s}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    bell:       <svg viewBox="0 0 24 24" {...s}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
    chat:       <svg viewBox="0 0 24 24" {...s}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
    layers:     <svg viewBox="0 0 24 24" {...s}><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
    settings:   <svg viewBox="0 0 24 24" {...s}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
    menu:       <svg viewBox="0 0 24 24" {...s}><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
    sun:        <svg viewBox="0 0 24 24" {...s}><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
    moon:       <svg viewBox="0 0 24 24" {...s}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
    pause:      <svg viewBox="0 0 24 24" {...s}><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>,
    play:       <svg viewBox="0 0 24 24" {...s}><polygon points="5 3 19 12 5 21 5 3"/></svg>,
    square:     <svg viewBox="0 0 24 24" {...s}><rect x="3" y="3" width="18" height="18" rx="2"/></svg>,
    users:      <svg viewBox="0 0 24 24" {...s}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    globe:      <svg viewBox="0 0 24 24" {...s}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
    tag:        <svg viewBox="0 0 24 24" {...s}><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
    plus:       <svg viewBox="0 0 24 24" {...s}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    check:      <svg viewBox="0 0 24 24" {...s}><polyline points="20 6 9 17 4 12"/></svg>,
    chevDown:   <svg viewBox="0 0 24 24" {...s}><polyline points="6 9 12 15 18 9"/></svg>,
    zap:        <svg viewBox="0 0 24 24" {...s}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
    fileText:   <svg viewBox="0 0 24 24" {...s}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
    user:       <svg viewBox="0 0 24 24" {...s}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    arrowLeft:  <svg viewBox="0 0 24 24" {...s}><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
    arrowRight: <svg viewBox="0 0 24 24" {...s}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
    upload:     <svg viewBox="0 0 24 24" {...s}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
    alertCircle:<svg viewBox="0 0 24 24" {...s}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  };
  return icons[name] || null;
};

// ── Themes ────────────────────────────────────────────────────────────────────
const DARK = {
  bg:"#080B12",sidebar:"rgba(8,11,18,0.97)",topbar:"rgba(8,11,18,0.85)",
  surface:"rgba(255,255,255,0.05)",surfaceHov:"rgba(255,255,255,0.09)",
  border:"rgba(255,255,255,0.09)",borderStr:"rgba(99,102,241,0.45)",
  indigoGlow:"rgba(99,102,241,0.15)",
  text1:"#F9FAFB",text2:"#C4C9D4",text3:"#6B7280",
  cardBox:"0 10px 28px rgba(0,0,0,0.35)",scrollbar:"rgba(255,255,255,0.1)",
  tagBg:"rgba(99,102,241,0.14)",tagBorder:"rgba(99,102,241,0.28)",tagColor:"#A5B4FC",
  inputBg:"rgba(0,0,0,0.3)",addBtnBg:"rgba(99,102,241,0.14)",
  addBtnBr:"rgba(99,102,241,0.35)",addBtnCl:"#A5B4FC",
};
const LIGHT = {
  bg:"#F4F6FB",sidebar:"#FFFFFF",topbar:"rgba(255,255,255,0.92)",
  surface:"#FFFFFF",surfaceHov:"#F0F3FA",
  border:"rgba(0,0,0,0.08)",borderStr:"rgba(99,102,241,0.5)",
  indigoGlow:"rgba(99,102,241,0.10)",
  text1:"#111827",text2:"#374151",text3:"#9CA3AF",
  cardBox:"0 2px 12px rgba(0,0,0,0.07)",scrollbar:"rgba(0,0,0,0.12)",
  tagBg:"rgba(99,102,241,0.10)",tagBorder:"rgba(99,102,241,0.22)",tagColor:"#4F46E5",
  inputBg:"rgba(0,0,0,0.04)",addBtnBg:"rgba(99,102,241,0.09)",
  addBtnBr:"rgba(99,102,241,0.28)",addBtnCl:"#4F46E5",
};

const NAV = [
  {icon:"layers",label:"Dashboard",route:"dashboard"},
  {icon:"mic",label:"Meetings",route:"meetings"},
  {icon:"brain",label:"Memory",route:"memory"},
  {icon:"chat",label:"Ask Recalla",route:"ask"},
  {icon:"bell",label:"Reminders",route:"reminders"},
  {icon:"clock",label:"Timeline",route:"timeline"},
  {icon:"settings",label:"Settings",route:"settings"},
];

const MEETING_TYPES = ["Team Meeting","One-on-One","Lecture","Interview","Brainstorm","Client Call"];

// ── Live waveform (driven by real audio analyser) ─────────────────────────────
const LiveWaveform = ({ active, audioLevels, dark }) => {
  // Use real levels if available, otherwise fallback to pattern
  const levels = audioLevels && audioLevels.length === 32
    ? audioLevels
    : Array.from({length:32}, (_,i) => 0.2+0.8*Math.abs(Math.sin(i*0.45)));

  return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:4,height:64,width:"100%"}}>
      {levels.map((h,i)=>(
        <div key={i} style={{
          width:4,borderRadius:3,
          background:active ? "linear-gradient(180deg,#6366F1,#22D3EE)" : dark?"rgba(255,255,255,0.12)":"rgba(0,0,0,0.1)",
          height:`${Math.max(0.1, h)*100}%`,
          transition:"height .08s linear, background .4s",
          opacity:active?1:0.4,
        }}/>
      ))}
    </div>
  );
};

// ── Speaker avatar ────────────────────────────────────────────────────────────
const SpeakerAvatar = ({ num }) => {
  const colors = ["#6366F1","#22D3EE","#F59E0B","#A78BFA"];
  const initials = ["S1","S2","S3","S4"];
  const idx = (num - 1) % colors.length;
  return (
    <div style={{width:28,height:28,borderRadius:"50%",flexShrink:0,background:colors[idx],display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:"#fff",boxShadow:`0 0 8px ${colors[idx]}55`}}>
      {initials[idx]}
    </div>
  );
};

// ── Processing screen ─────────────────────────────────────────────────────────
const ProcessingScreen = ({ T, dark, title, progress, currentStep, error }) => {
  const steps = [
    "Loading Whisper model",
    "Transcribing audio",
    "Detecting speakers",
    "Extracting tags & tasks",
    "Done!",
  ];

  return (
    <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:40}}>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:20,padding:"44px 48px",maxWidth:480,width:"100%",boxShadow:T.cardBox,textAlign:"center",animation:"fade-in .4s ease"}}>
        <div style={{position:"relative",width:96,height:96,margin:"0 auto 28px"}}>
          <div style={{position:"absolute",inset:0,borderRadius:"50%",background:error ? "#F43F5E" : `conic-gradient(#6366F1 ${progress*3.6}deg,${dark?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.06)"} 0deg)`,animation:error ? "none" : "spin 2s linear infinite"}}/>
          <div style={{position:"absolute",inset:6,borderRadius:"50%",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <div style={{width:52,height:52,borderRadius:"50%",background:error ? "#F43F5E" : "linear-gradient(135deg,#6366F1,#22D3EE)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:error ? "0 0 22px rgba(244,63,94,.5)" : "0 0 22px rgba(99,102,241,.5)",animation:error ? "none" : "breathe 2s ease-in-out infinite"}}>
              <Icon name={error ? "alertCircle" : "brain"} size={24} color="#fff"/>
            </div>
          </div>
        </div>

        <div style={{fontSize:20,fontWeight:800,color:T.text1,marginBottom:5,letterSpacing:"-.5px"}}>
          {error ? "Processing Failed" : "Processing Meeting"}
        </div>
        <div style={{fontSize:13,color:T.text2,marginBottom:26,lineHeight:1.6}}>
          {error ? error : `"${title || "Untitled Meeting"}"`}
        </div>

        {!error && (
          <>
            <div style={{background:dark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.07)",borderRadius:999,height:6,marginBottom:7,overflow:"hidden"}}>
              <div style={{height:"100%",borderRadius:999,background:"linear-gradient(90deg,#6366F1,#22D3EE)",width:`${progress}%`,transition:"width .3s ease",boxShadow:"0 0 10px rgba(99,102,241,.5)"}}/>
            </div>
            <div style={{fontSize:12,color:T.text3,marginBottom:26,fontFamily:"'JetBrains Mono',monospace"}}>{Math.round(progress)}% complete</div>

            <div style={{display:"flex",flexDirection:"column",gap:10,textAlign:"left"}}>
              {steps.map((step,i)=>{
                const done = i < currentStep;
                const active = i === currentStep;
                return (
                  <div key={i} style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{width:20,height:20,borderRadius:"50%",flexShrink:0,background:done?"linear-gradient(135deg,#6366F1,#22D3EE)":dark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.07)",border:active?"2px solid #6366F1":"none",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .4s",animation:active?"breathe 1s ease-in-out infinite":"none"}}>
                      {done && <Icon name="check" size={10} color="#fff"/>}
                    </div>
                    <div style={{fontSize:13,fontWeight:done?500:400,color:done?T.text1:T.text3,transition:"color .3s"}}>
                      {step}{active && <span style={{color:"#6366F1",marginLeft:6,animation:"breathe 1s infinite"}}>…</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {error && (
          <button onClick={()=>window.location.reload()} style={{marginTop:24,width:"100%",padding:"12px 0",background:"linear-gradient(135deg,#F43F5E,#FB7185)",border:"none",borderRadius:10,color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"'Inter',sans-serif",boxShadow:"0 4px 16px rgba(244,63,94,.4)"}}>
            Try Again
          </button>
        )}
      </div>
    </div>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────
export default function RecordMeeting({ navigate: navProp, dark: darkProp, setDark: setDarkProp, sidebarOpen: sidebarProp, setSidebarOpen: setSidebarProp } = {}) {
  const [darkLocal,setDarkLocal]           = useState(true);
  const [sidebarLocal,setSidebarLocal]     = useState(true);
  const dark          = darkProp          !== undefined ? darkProp        : darkLocal;
  const setDark       = setDarkProp       !== undefined ? setDarkProp     : setDarkLocal;
  const sidebarOpen   = sidebarProp       !== undefined ? sidebarProp     : sidebarLocal;
  const setSidebarOpen= setSidebarProp    !== undefined ? setSidebarProp  : setSidebarLocal;

  const [pageState,setPageState]     = useState("pre"); // pre | recording | paused | processing
  const [title,setTitle]             = useState("");
  const [meetingType,setMeetingType] = useState("Team Meeting");
  const [participants,setParticipants] = useState(["Ammad Ahmad","Muhammad Muzammal"]);
  const [newParticipant,setNewParticipant] = useState("");
  const [tags,setTags]               = useState(["Sprint","FYP"]);
  const [newTag,setNewTag]           = useState("");
  const [elapsed,setElapsed]         = useState(0);
  const [audioLevels,setAudioLevels] = useState(Array(32).fill(0.2));

  // Processing state
  const [processProgress,setProcessProgress] = useState(0);
  const [processStep,setProcessStep]         = useState(0);
  const [processError,setProcessError]       = useState(null);

  // Backend status
  const [backendOk,setBackendOk] = useState(true);

  // Recording refs
  const mediaRecorderRef = useRef(null);
  const audioChunksRef   = useRef([]);
  const streamRef        = useRef(null);
  const audioCtxRef      = useRef(null);
  const analyserRef      = useRef(null);
  const animFrameRef     = useRef(null);
  const timerRef         = useRef(null);
  const fileInputRef     = useRef(null);

  const T = dark ? DARK : LIGHT;

  // Check backend on mount
  useEffect(() => {
    checkBackendHealth().then(setBackendOk);
  }, []);

  const fmt = s => {
    const h=Math.floor(s/3600).toString().padStart(2,"0");
    const m=Math.floor((s%3600)/60).toString().padStart(2,"0");
    const sc=(s%60).toString().padStart(2,"0");
    return `${h}:${m}:${sc}`;
  };

  // ── Live audio level visualization ──────────────────────────────────────────
  const updateAudioLevels = () => {
    if (!analyserRef.current) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Sample 32 frequency bins
    const bars = 32;
    const step = Math.floor(bufferLength / bars);
    const newLevels = [];
    for (let i = 0; i < bars; i++) {
      const value = dataArray[i * step] / 255;
      newLevels.push(Math.max(0.15, value));
    }
    setAudioLevels(newLevels);

    animFrameRef.current = requestAnimationFrame(updateAudioLevels);
  };

  // ── Start real microphone recording ─────────────────────────────────────────
  const startRecording = async () => {
    setProcessError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Set up audio context for waveform visualization
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioCtxRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioCtxRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      // Set up MediaRecorder
      const recorder = new MediaRecorder(stream, { mimeType: getMimeType() });
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;

      setPageState("recording");
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
      updateAudioLevels();
    } catch (err) {
      console.error("Microphone error:", err);
      alert("Could not access microphone. Please grant permission and try again.\n\nError: " + err.message);
    }
  };

  const getMimeType = () => {
    const types = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/mp4"];
    for (const t of types) {
      if (MediaRecorder.isTypeSupported(t)) return t;
    }
    return "";
  };

  const pauseResume = () => {
    if (!mediaRecorderRef.current) return;
    if (pageState === "recording") {
      mediaRecorderRef.current.pause();
      cancelAnimationFrame(animFrameRef.current);
      clearInterval(timerRef.current);
      setPageState("paused");
    } else if (pageState === "paused") {
      mediaRecorderRef.current.resume();
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
      updateAudioLevels();
      setPageState("recording");
    }
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current) return;

    mediaRecorderRef.current.onstop = async () => {
      const blob = new Blob(audioChunksRef.current, { type: mediaRecorderRef.current.mimeType });
      cleanup();
      await processAudio(blob, "recording.webm");
    };
    mediaRecorderRef.current.stop();
  };

  const cleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    if (audioCtxRef.current) audioCtxRef.current.close().catch(()=>{});
    streamRef.current = null;
    audioCtxRef.current = null;
    analyserRef.current = null;
  };

  // ── File upload alternative ─────────────────────────────────────────────────
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!title) setTitle(file.name.replace(/\.[^/.]+$/, ""));
    await processAudio(file, file.name);
  };

  // ── Send audio to backend ───────────────────────────────────────────────────
  const processAudio = async (blob, filename) => {
    setPageState("processing");
    setProcessError(null);
    setProcessProgress(0);
    setProcessStep(0);

    try {
      // Real progress callback — driven by backend polling
      const onProgress = ({ status, progress, step, model_loaded }) => {
        setProcessProgress(progress || 0);

        // Map backend status to frontend step (0-4)
        const stepMap = {
          starting:       0,
          pending:        0,
          loading_model:  0,
          transcribing:   1,
          diarizing:      2,
          tagging:        3,
          done:           4,
        };
        if (status in stepMap) setProcessStep(stepMap[status]);
      };

      // Pass participant count as a speaker count hint — much more accurate
      // when user knows how many people are in the meeting.
      const expectedSpeakers = participants.length > 0 ? participants.length : null;

      const result = await transcribeAudio(blob, filename, onProgress, { expectedSpeakers });

      // Final step
      setProcessStep(4);
      setProcessProgress(100);

      // ── Build participant list from REAL speakers in transcript ──
      const speakerSet = new Set();
      result.transcript.segments.forEach(seg => {
        if (seg.speaker) speakerSet.add(seg.speaker);
      });
      const detectedSpeakers = Array.from(speakerSet);

      // Calculate actual talk time per speaker
      const speakerStats = {};
      result.transcript.segments.forEach(seg => {
        const sp = seg.speaker || "Speaker 1";
        if (!speakerStats[sp]) speakerStats[sp] = { wordCount: 0, duration: 0 };
        speakerStats[sp].wordCount += seg.text.split(/\s+/).filter(Boolean).length;
        speakerStats[sp].duration  += (seg.end - seg.start);
      });

      // Use detected speakers as participants (real, not hardcoded)
      // User can rename them later
      const realParticipants = detectedSpeakers.length > 0
        ? detectedSpeakers
        : (participants.length > 0 ? participants : ["Speaker 1"]);

      // Build meeting object for the detail page
      const meeting = {
        id: Date.now(),
        title:        title || "Untitled Meeting",
        type:         meetingType,
        date:         new Date().toLocaleString(),
        duration:     `${Math.round(result.transcript.duration / 60)}m`,
        wordCount:    result.transcript.word_count,
        language:     result.transcript.language,
        participants: realParticipants,
        speakerStats: speakerStats,
        tags:         [...new Set([...tags, ...result.tagging.auto_tags])],
        transcript:   result.transcript.segments,
        fullText:     result.transcript.full_text,
        summary:      generateSummary(result.transcript.full_text),
        tagging:      result.tagging,
        status:       "processed",
      };

      // Store and navigate after 1s
      setTimeout(() => {
        if (navProp) navProp("detail", meeting);
      }, 800);

    } catch (err) {
      console.error(err);
      setProcessError(err.message || "Something went wrong. Make sure the backend is running.");
    }
  };

  // Build a quick summary from first sentences (placeholder until BART integrated)
  const generateSummary = (text) => {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    return sentences.slice(0, 3).join(" ").trim();
  };

  // Cleanup on unmount
  useEffect(() => () => cleanup(), []);

  const addParticipant = () => { if(newParticipant.trim()){ setParticipants(p=>[...p,newParticipant.trim()]); setNewParticipant(""); } };
  const addTag         = () => { if(newTag.trim()&&!tags.includes(newTag.trim())){ setTags(t=>[...t,newTag.trim()]); setNewTag(""); } };

  const isRec    = pageState==="recording";
  const isPaused = pageState==="paused";

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    html,body,#root{height:100%;width:100%;overflow:hidden}
    body{font-family:'Inter',sans-serif;background:${T.bg};color:${T.text1};transition:background .3s,color .3s}
    ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-thumb{background:${T.scrollbar};border-radius:2px}
    *{scrollbar-width:thin;scrollbar-color:${T.scrollbar} transparent}
    .app{display:flex;height:100vh;width:100vw;overflow:hidden}
    .main{flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0}
    .sb{width:${sidebarOpen?"236px":"68px"};flex-shrink:0;background:${T.sidebar};border-right:1px solid ${T.border};display:flex;flex-direction:column;padding:18px 10px;gap:3px;transition:width .3s cubic-bezier(.4,0,.2,1),background .3s;position:relative;z-index:10;overflow:hidden}
    .logo{display:flex;align-items:center;gap:10px;padding:6px 10px 18px;border-bottom:1px solid ${T.border};margin-bottom:6px;white-space:nowrap}
    .lmark{width:30px;height:30px;background:linear-gradient(135deg,#6366F1,#22D3EE);border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 0 14px rgba(99,102,241,.35)}
    .ltxt{font-size:16px;font-weight:800;letter-spacing:-.5px;color:${T.text1}} .ltxt span{color:#6366F1}
    .nlbl{opacity:${sidebarOpen?1:0};transition:opacity .2s;white-space:nowrap;overflow:hidden}
    .ni{display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:9px;cursor:pointer;transition:all .2s;color:${T.text2};font-size:13px;font-weight:500;border:1px solid transparent;position:relative;overflow:hidden}
    .ni:hover{background:${T.surfaceHov};color:${T.text1}}
    .ni.act{background:${T.indigoGlow};border-color:${T.borderStr};color:${T.text1}}
    .ni.act::before{content:'';position:absolute;left:0;top:20%;bottom:20%;width:2px;background:#6366F1;border-radius:0 2px 2px 0;box-shadow:0 0 8px #6366F1}
    .sbt{position:absolute;top:20px;right:-11px;width:22px;height:22px;background:${T.sidebar};border:1px solid ${T.border};border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;color:${T.text3};z-index:20;transition:all .2s}
    .sbt:hover{border-color:#6366F1;color:#6366F1}
    .usr{margin-top:auto;padding-top:10px;border-top:1px solid ${T.border}}
    .avsm{width:26px;height:26px;border-radius:50%;background:linear-gradient(135deg,#6366F1,#22D3EE);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#fff;flex-shrink:0}
    .topbar{height:60px;border-bottom:1px solid ${T.border};display:flex;align-items:center;justify-content:space-between;padding:0 24px;background:${T.topbar};backdrop-filter:blur(20px);flex-shrink:0;transition:background .3s}
    .tbt{font-size:15px;font-weight:700;letter-spacing:-.3px;color:${T.text1}}
    .tbd{font-size:11px;color:${T.text3};margin-top:1px}
    .sw{display:flex;align-items:center;gap:8px;background:${T.surface};border:1px solid ${T.border};border-radius:9px;padding:7px 12px;width:260px;transition:all .2s}
    .sw:focus-within{border-color:${T.borderStr};box-shadow:0 0 0 3px ${T.indigoGlow}}
    .sw input{background:none;border:none;outline:none;color:${T.text1};font-family:'Inter',sans-serif;font-size:13px;width:100%}
    .sw input::placeholder{color:${T.text3}}
    .tbr{display:flex;align-items:center;gap:10px}
    .ibtn{width:34px;height:34px;display:flex;align-items:center;justify-content:center;background:${T.surface};border:1px solid ${T.border};border-radius:8px;cursor:pointer;color:${T.text2};transition:all .2s;position:relative}
    .ibtn:hover{background:${T.surfaceHov};color:${T.text1};border-color:${T.borderStr}}
    .av{width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,#6366F1,#22D3EE);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff;cursor:pointer;transition:box-shadow .2s}
    .av:hover{box-shadow:0 0 0 2px #6366F1}
    .thbtn{display:flex;align-items:center;gap:6px;padding:6px 12px;border-radius:20px;background:${T.indigoGlow};border:1px solid ${T.borderStr};color:${dark?"#A5B4FC":"#4F46E5"};font-size:12px;font-weight:600;cursor:pointer;transition:all .2s;font-family:'Inter',sans-serif;white-space:nowrap}
    .thbtn:hover{background:${dark?"rgba(99,102,241,.25)":"rgba(99,102,241,.18)"}}
    .cnt{flex:1;overflow-y:auto;display:flex;flex-direction:column}
    .fw{padding:24px 28px;display:flex;flex-direction:column;gap:18px;flex:1;animation:fade-in .35s ease}
    .back-btn{display:flex;align-items:center;gap:6px;padding:5px 10px;background:${T.surface};border:1px solid ${T.border};border-radius:7px;color:${T.text2};font-size:12px;font-weight:500;cursor:pointer;font-family:'Inter',sans-serif;margin-bottom:12px;width:fit-content;transition:all .2s}
    .back-btn:hover{background:${T.surfaceHov};color:${T.text1}}
    .ph{display:flex;align-items:center;gap:12px;margin-bottom:4px}
    .pt{font-size:20px;font-weight:800;letter-spacing:-.5px;color:${T.text1}}
    .ps{font-size:13px;color:${T.text2};margin-top:2px}
    .fg{display:grid;grid-template-columns:1fr 1fr;gap:18px}
    .fc{background:${T.surface};border:1px solid ${T.border};border-radius:14px;padding:20px;box-shadow:${T.cardBox}}
    .fc.full{grid-column:1/-1}
    .fct{font-size:13px;font-weight:600;color:${T.text1};margin-bottom:13px;display:flex;align-items:center;gap:8px}
    .fld{margin-bottom:13px} .fld:last-child{margin-bottom:0}
    .fld label{display:block;font-size:10px;font-weight:700;color:${T.text3};text-transform:uppercase;letter-spacing:.7px;margin-bottom:5px}
    .fld input,.fld select{width:100%;padding:9px 12px;background:${T.inputBg};border:1px solid ${T.border};border-radius:8px;color:${T.text1};font-family:'Inter',sans-serif;font-size:13px;outline:none;transition:all .2s}
    .fld input:focus,.fld select:focus{border-color:${T.borderStr};box-shadow:0 0 0 3px ${T.indigoGlow}}
    .fld input::placeholder{color:${T.text3}}
    .tchips{display:flex;gap:7px;flex-wrap:wrap}
    .chip{padding:6px 13px;border-radius:20px;font-size:12px;font-weight:500;cursor:pointer;transition:all .2s;border:1px solid ${T.border};background:${T.surface};color:${T.text2};font-family:'Inter',sans-serif}
    .chip:hover{border-color:${T.borderStr};color:${T.text1}}
    .chip.sel{background:${T.indigoGlow};border-color:${T.borderStr};color:${dark?"#A5B4FC":"#4F46E5"}}
    .irow{display:flex;gap:8px}
    .irow input{flex:1;padding:8px 12px;background:${T.inputBg};border:1px solid ${T.border};border-radius:8px;color:${T.text1};font-family:'Inter',sans-serif;font-size:12px;outline:none}
    .irow input:focus{border-color:${T.borderStr};box-shadow:0 0 0 3px ${T.indigoGlow}}
    .mbtn{padding:8px 12px;background:${T.addBtnBg};border:1px solid ${T.addBtnBr};border-radius:8px;color:${T.addBtnCl};font-size:12px;font-weight:600;cursor:pointer;font-family:'Inter',sans-serif;display:flex;align-items:center;gap:4px;white-space:nowrap}
    .mbtn:hover{background:${dark?"rgba(99,102,241,.22)":"rgba(99,102,241,.16)"}}
    .pills{display:flex;flex-wrap:wrap;gap:6px;margin-top:9px}
    .pill{display:flex;align-items:center;gap:5px;padding:4px 9px;border-radius:20px;background:${T.tagBg};border:1px solid ${T.tagBorder};color:${T.tagColor};font-size:11px;font-weight:600}
    .pillx{cursor:pointer;opacity:.6;display:flex;align-items:center;line-height:1}
    .pillx:hover{opacity:1}
    .sbtn{display:flex;align-items:center;gap:10px;padding:14px 32px;background:linear-gradient(135deg,#6366F1,#818CF8);border:none;border-radius:12px;color:#fff;font-size:15px;font-weight:700;cursor:pointer;font-family:'Inter',sans-serif;box-shadow:0 6px 24px rgba(99,102,241,.4);letter-spacing:-.2px;transition:all .25s}
    .sbtn:hover{transform:translateY(-2px);box-shadow:0 10px 32px rgba(99,102,241,.5)}
    .sbtn:active{transform:translateY(0)}
    .ubtn{display:flex;align-items:center;gap:8px;padding:14px 28px;background:${T.surface};border:1px solid ${T.borderStr};border-radius:12px;color:${T.text1};font-size:14px;font-weight:600;cursor:pointer;font-family:'Inter',sans-serif;transition:all .2s}
    .ubtn:hover{background:${T.indigoGlow};color:${dark?"#A5B4FC":"#4F46E5"}}
    .backend-warn{padding:12px 16px;background:rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.3);border-radius:10px;display:flex;align-items:center;gap:10px;font-size:12px;color:#F59E0B}

    /* Recording */
    .rw{padding:20px 24px;display:flex;flex-direction:column;gap:16px;flex:1;min-height:0;animation:fade-in .35s ease;overflow:hidden}
    .rctr{background:${T.surface};border:1px solid ${T.border};border-radius:16px;padding:30px;box-shadow:${T.cardBox};display:flex;flex-direction:column;align-items:center;gap:14px}
    .timer{font-size:56px;font-weight:800;letter-spacing:-2px;font-family:'JetBrains Mono',monospace;color:${T.text1};line-height:1}
    .tsub{font-size:11px;color:${T.text3};letter-spacing:.6px}
    .rbadge{display:flex;align-items:center;gap:7px;padding:6px 14px;background:rgba(244,63,94,0.12);border:1px solid rgba(244,63,94,0.3);border-radius:20px;color:#F43F5E;font-size:13px;font-weight:700}
    .rdot{width:8px;height:8px;border-radius:50%;background:#F43F5E;animation:breathe 1s ease-in-out infinite}
    .pbadge{background:rgba(245,158,11,.12);border-color:rgba(245,158,11,.3);color:#F59E0B}
    .pdot{background:#F59E0B}
    .rctls{display:flex;gap:12px;align-items:center;margin-top:8px}
    .cbtn{border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;border:none;transition:all .2s}
    .cbtn.pause{width:48px;height:48px;background:${dark?"rgba(255,255,255,.08)":"rgba(0,0,0,.07)"};color:${T.text1}}
    .cbtn.pause:hover{background:${dark?"rgba(255,255,255,.14)":"rgba(0,0,0,.12)"}}
    .cbtn.stop{width:60px;height:60px;background:linear-gradient(135deg,#F43F5E,#FB7185);color:#fff;box-shadow:0 4px 18px rgba(244,63,94,.4)}
    .cbtn.stop:hover{transform:scale(1.06);box-shadow:0 6px 24px rgba(244,63,94,.5)}

    @keyframes breathe{0%,100%{opacity:1}50%{opacity:.45}}
    @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
    @keyframes fade-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
  `;

  return (
    <>
      <style>{css}</style>
      <div className="app">

        {/* Sidebar */}
        <aside className="sb">
          <div className="logo">
            <div className="lmark"><Icon name="brain" size={16} color="#fff"/></div>
            {sidebarOpen && <div className="ltxt">Re<span>calla</span></div>}
          </div>
          {NAV.map(item=>(
            <div key={item.label} className={`ni${item.route==="meetings"?" act":""}`} onClick={()=>navProp&&navProp(item.route)}>
              <Icon name={item.icon} size={16} color={item.route==="meetings"?"#6366F1":T.text2}/>
              <span className="nlbl">{item.label}</span>
            </div>
          ))}
          <div className="usr">
            <div className="ni">
              <div className="avsm">AA</div>
              {sidebarOpen&&(
                <div style={{overflow:"hidden"}}>
                  <div style={{fontSize:12,fontWeight:600,color:T.text1,whiteSpace:"nowrap"}}>Ammad Ahmad</div>
                  <div style={{fontSize:10,color:T.text3,whiteSpace:"nowrap"}}>BSCS · 50908</div>
                </div>
              )}
            </div>
          </div>
          <div className="sbt" onClick={()=>setSidebarOpen(p=>!p)}>
            <Icon name="menu" size={11} color={T.text3}/>
          </div>
        </aside>

        {/* Main */}
        <main className="main">

          {/* Topbar */}
          <div className="topbar">
            <div>
              <div className="tbt">{pageState==="pre"?"New Meeting":pageState==="processing"?"Processing…":`Recording — ${title||"Untitled"}`}</div>
              <div className="tbd">Monday, 16 June 2026</div>
            </div>
            <div className="sw">
              <Icon name="search" size={14} color={T.text3}/>
              <input placeholder="Search meetings, memories…"/>
            </div>
            <div className="tbr">
              <button className="thbtn" onClick={()=>setDark(d=>!d)}>
                <Icon name={dark?"sun":"moon"} size={13} color={dark?"#A5B4FC":"#4F46E5"}/>
                {dark?"Light mode":"Dark mode"}
              </button>
              <div className="ibtn"><Icon name="bell" size={15} color={T.text2}/></div>
              <div className="av">AA</div>
            </div>
          </div>

          {/* STATE 1: PRE-RECORDING FORM */}
          {pageState==="pre"&&(
            <div className="cnt">
              <div className="fw">
                <div>
                  <button className="back-btn" onClick={()=>navProp&&navProp("meetings")}>
                    <Icon name="arrowLeft" size={13} color="currentColor"/>
                    Back to Meetings
                  </button>
                  <div className="ph">
                    <div style={{width:38,height:38,borderRadius:10,background:"linear-gradient(135deg,#6366F1,#22D3EE)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 16px rgba(99,102,241,.35)"}}>
                      <Icon name="mic" size={18} color="#fff"/>
                    </div>
                    <div>
                      <div className="pt">Record a Meeting</div>
                      <div className="ps">Set up your session, then start recording or upload an audio file</div>
                    </div>
                  </div>
                </div>

                {!backendOk && (
                  <div className="backend-warn">
                    <Icon name="alertCircle" size={16} color="#F59E0B"/>
                    <div>
                      <strong>Backend not reachable.</strong> Make sure the FastAPI server is running on port 8000.
                    </div>
                  </div>
                )}

                <div className="fg">
                  {/* Meeting details */}
                  <div className="fc">
                    <div className="fct"><Icon name="fileText" size={13} color="#6366F1"/>Meeting Details</div>
                    <div className="fld">
                      <label>Meeting Title</label>
                      <input placeholder="e.g. Sprint Planning Q3 2026" value={title} onChange={e=>setTitle(e.target.value)}/>
                    </div>
                    <div className="fld">
                      <label>Meeting Type</label>
                      <div className="tchips">
                        {MEETING_TYPES.map(t=>(
                          <button key={t} className={`chip${meetingType===t?" sel":""}`} onClick={()=>setMeetingType(t)}>{t}</button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right col */}
                  <div style={{display:"flex",flexDirection:"column",gap:16}}>
                    <div className="fc">
                      <div className="fct"><Icon name="users" size={13} color="#22D3EE"/>Participants</div>
                      <div className="irow">
                        <input placeholder="Add participant name…" value={newParticipant} onChange={e=>setNewParticipant(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addParticipant()}/>
                        <button className="mbtn" onClick={addParticipant}><Icon name="plus" size={12} color={T.addBtnCl}/>Add</button>
                      </div>
                      <div className="pills">
                        {participants.map((p,i)=>(
                          <div key={i} className="pill">
                            <Icon name="user" size={10} color={T.tagColor}/>{p}
                            <span className="pillx" onClick={()=>setParticipants(ps=>ps.filter((_,j)=>j!==i))}>×</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="fc">
                      <div className="fct"><Icon name="tag" size={13} color="#F59E0B"/>Tags</div>
                      <div className="irow">
                        <input placeholder="Add a tag…" value={newTag} onChange={e=>setNewTag(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addTag()}/>
                        <button className="mbtn" onClick={addTag}><Icon name="plus" size={12} color={T.addBtnCl}/>Add</button>
                      </div>
                      <div className="pills">
                        {tags.map((t,i)=>(
                          <div key={i} className="pill">{t}<span className="pillx" onClick={()=>setTags(ts=>ts.filter((_,j)=>j!==i))}>×</span></div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Tips */}
                  <div className="fc full" style={{background:dark?"rgba(99,102,241,.07)":"rgba(99,102,241,.05)",borderColor:dark?"rgba(99,102,241,.2)":"rgba(99,102,241,.15)",padding:"15px 20px"}}>
                    <div style={{display:"flex",gap:16,alignItems:"center"}}>
                      <div style={{width:40,height:40,borderRadius:10,background:"rgba(99,102,241,.15)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        <Icon name="zap" size={17} color="#6366F1"/>
                      </div>
                      <div>
                        <div style={{fontSize:13,fontWeight:600,color:T.text1,marginBottom:3}}>Tips for better transcription</div>
                        <div style={{fontSize:12,color:T.text2,lineHeight:1.6}}>
                          Speak clearly and reduce background noise. Recalla uses OpenAI Whisper for transcription and spaCy for auto-tagging.
                          Click <strong>Start Recording</strong> for live capture, or <strong>Upload Audio</strong> to process an existing file.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div style={{display:"flex",justifyContent:"center",gap:14,paddingTop:8,flexWrap:"wrap"}}>
                  <button className="sbtn" onClick={startRecording} disabled={!backendOk}>
                    <Icon name="mic" size={17} color="#fff"/>
                    Start Recording Session
                  </button>
                  <button className="ubtn" onClick={()=>fileInputRef.current?.click()} disabled={!backendOk}>
                    <Icon name="upload" size={16} color={T.text1}/>
                    Upload Audio File
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*,video/mp4,.webm,.m4a,.ogg,.mp3,.wav"
                    style={{display:"none"}}
                    onChange={handleFileUpload}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STATE 2: RECORDING / PAUSED */}
          {(isRec||isPaused)&&(
            <div className="cnt">
              <div className="rw">
                {/* Recording card */}
                <div className="rctr">
                  <div className={`rbadge${isPaused?" pbadge":""}`}>
                    <div className={`rdot${isPaused?" pdot":""}`}/>
                    {isPaused?"Paused":"Recording"}
                  </div>
                  <div className="timer">{fmt(elapsed)}</div>
                  <div className="tsub">{isPaused?"PAUSED":"LIVE RECORDING"}</div>
                  <LiveWaveform active={isRec} audioLevels={audioLevels} dark={dark}/>
                  <div className="rctls">
                    <button className="cbtn pause" onClick={pauseResume}>
                      <Icon name={isPaused?"play":"pause"} size={19} color={T.text1}/>
                    </button>
                    <button className="cbtn stop" onClick={stopRecording}>
                      <Icon name="square" size={22} color="#fff"/>
                    </button>
                  </div>
                  <div style={{fontSize:11,color:T.text3,marginTop:4}}>
                    {isPaused?"Click play to resume":"Click square to stop and process"}
                  </div>
                </div>

                <div style={{textAlign:"center",fontSize:12,color:T.text3,lineHeight:1.7}}>
                  <Icon name="alertCircle" size={11} color={T.text3}/> Audio is being captured locally and will be sent to your backend for transcription when you stop.
                </div>
              </div>
            </div>
          )}

          {/* STATE 3: PROCESSING */}
          {pageState==="processing"&&(
            <div className="cnt">
              <ProcessingScreen T={T} dark={dark} title={title} progress={processProgress} currentStep={processStep} error={processError}/>
            </div>
          )}
        </main>
      </div>
    </>
  );
}