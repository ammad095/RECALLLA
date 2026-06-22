import { useState, useRef } from "react";

// Helper: convert seconds to mm:ss
const fmtTime = (s) => {
  if (!s && s !== 0) return "00:00";
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = Math.floor(s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
};

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
    arrowLeft:  <svg viewBox="0 0 24 24" {...s}><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
    download:   <svg viewBox="0 0 24 24" {...s}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
    share:      <svg viewBox="0 0 24 24" {...s}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
    edit:       <svg viewBox="0 0 24 24" {...s}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    tag:        <svg viewBox="0 0 24 24" {...s}><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
    users:      <svg viewBox="0 0 24 24" {...s}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    check:      <svg viewBox="0 0 24 24" {...s}><polyline points="20 6 9 17 4 12"/></svg>,
    zap:        <svg viewBox="0 0 24 24" {...s}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
    fileText:   <svg viewBox="0 0 24 24" {...s}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
    calendar:   <svg viewBox="0 0 24 24" {...s}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    list:       <svg viewBox="0 0 24 24" {...s}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
    copy:       <svg viewBox="0 0 24 24" {...s}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
    pin:        <svg viewBox="0 0 24 24" {...s}><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/></svg>,
    alertCircle:<svg viewBox="0 0 24 24" {...s}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
    trendUp:    <svg viewBox="0 0 24 24" {...s}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
    maximize:   <svg viewBox="0 0 24 24" {...s}><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>,
    chevDown:   <svg viewBox="0 0 24 24" {...s}><polyline points="6 9 12 15 18 9"/></svg>,
    sparkle:    <svg viewBox="0 0 24 24" {...s}><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>,
  };
  return icons[name] || null;
};

// ── Theme tokens ──────────────────────────────────────────────────────────────
const DARK = {
  bg:"#080B12", sidebar:"rgba(8,11,18,0.97)", topbar:"rgba(8,11,18,0.88)",
  surface:"rgba(255,255,255,0.05)", surfaceHov:"rgba(255,255,255,0.08)",
  surfaceDeep:"rgba(0,0,0,0.25)",
  border:"rgba(255,255,255,0.09)", borderStr:"rgba(99,102,241,0.45)",
  indigoGlow:"rgba(99,102,241,0.15)", cyanGlow:"rgba(34,211,238,0.10)",
  text1:"#F9FAFB", text2:"#C4C9D4", text3:"#6B7280",
  cardBox:"0 10px 28px rgba(0,0,0,0.35)", scrollbar:"rgba(255,255,255,0.1)",
  tagBg:"rgba(99,102,241,0.14)", tagBorder:"rgba(99,102,241,0.28)", tagColor:"#A5B4FC",
  inputBg:"rgba(0,0,0,0.3)", addBtnBg:"rgba(99,102,241,0.14)",
  addBtnBr:"rgba(99,102,241,0.35)", addBtnCl:"#A5B4FC",
  hlBg:"rgba(99,102,241,0.12)", hlBorder:"rgba(99,102,241,0.25)",
};
const LIGHT = {
  bg:"#F4F6FB", sidebar:"#FFFFFF", topbar:"rgba(255,255,255,0.92)",
  surface:"#FFFFFF", surfaceHov:"#F0F3FA",
  surfaceDeep:"rgba(0,0,0,0.04)",
  border:"rgba(0,0,0,0.08)", borderStr:"rgba(99,102,241,0.5)",
  indigoGlow:"rgba(99,102,241,0.10)", cyanGlow:"rgba(34,211,238,0.07)",
  text1:"#111827", text2:"#374151", text3:"#9CA3AF",
  cardBox:"0 2px 12px rgba(0,0,0,0.07)", scrollbar:"rgba(0,0,0,0.12)",
  tagBg:"rgba(99,102,241,0.10)", tagBorder:"rgba(99,102,241,0.22)", tagColor:"#4F46E5",
  inputBg:"rgba(0,0,0,0.04)", addBtnBg:"rgba(99,102,241,0.09)",
  addBtnBr:"rgba(99,102,241,0.28)", addBtnCl:"#4F46E5",
  hlBg:"rgba(99,102,241,0.07)", hlBorder:"rgba(99,102,241,0.18)",
};

const NAV = [
  {icon:"layers",   label:"Dashboard"},
  {icon:"mic",      label:"Meetings"},
  {icon:"brain",    label:"Memory"},
  {icon:"chat",     label:"Ask Recalla"},
  {icon:"bell",     label:"Reminders"},
  {icon:"clock",    label:"Timeline"},
  {icon:"settings", label:"Settings"},
];

// ── Meeting data ──────────────────────────────────────────────────────────────
const MEETING = {
  title:    "Backend Architecture Sync",
  date:     "Monday, 16 June 2026",
  time:     "4:00 PM – 4:32 PM",
  duration: "32 minutes",
  type:     "Team Meeting",
  language: "English",
  participants: [
    { name:"Ammad Ahmad",         initials:"AA", color:"#6366F1", talk:45 },
    { name:"Muhammad Muzammal",   initials:"MM", color:"#22D3EE", talk:35 },
    { name:"Dr. Muhammad Adnan",  initials:"DA", color:"#F59E0B", talk:20 },
  ],
  tags: ["Engineering","Backend","Sprint","ChromaDB","FYP"],
  wordCount: 1247,
  confidence: 96,
};

const SUMMARY = `The Backend Architecture Sync focused on three major decisions heading into the final development sprint. The team agreed to separate the authentication service into its own microservice before integrating ChromaDB. Muhammad Muzammal confirmed the vector embedding pipeline is tested and API endpoints will be ready by end of week. The team also decided to upgrade from Whisper to Whisper v3 to improve transcription accuracy on accented speech, with Muzammal assigned to update the model config and deploy to staging. A project demo for Dr. Adnan was scheduled for Friday, with Muzammal to send calendar invites post-meeting.`;

const KEY_POINTS = [
  "Authentication service to be split into its own microservice before ChromaDB integration",
  "ChromaDB vector embedding pipeline is tested and ready for deployment",
  "API endpoints for semantic memory retrieval targeted for end of week",
  "Whisper v3 upgrade approved — improves accuracy on accented speech",
  "Staging deployment of Whisper v3 assigned to Muhammad Muzammal",
  "Demo with Dr. Adnan confirmed for Friday afternoon",
];

const DECISIONS = [
  { text:"Proceed with microservices architecture for auth module",       owner:"Ammad Ahmad",       status:"confirmed" },
  { text:"Use ChromaDB as the primary vector database",                   owner:"Team",              status:"confirmed" },
  { text:"Upgrade transcription model to Whisper v3",                     owner:"Muhammad Muzammal", status:"confirmed" },
  { text:"Schedule supervisor demo for Friday",                           owner:"Muhammad Muzammal", status:"confirmed" },
];

const TASKS = [
  { text:"Update model config to Whisper v3",          owner:"Muhammad Muzammal", due:"Tomorrow",      done:false },
  { text:"Deploy Whisper v3 to staging environment",   owner:"Muhammad Muzammal", due:"Tomorrow",      done:false },
  { text:"Send Friday demo calendar invite",           owner:"Muhammad Muzammal", due:"Today",         done:true  },
  { text:"Complete API endpoints for memory retrieval",owner:"Muhammad Muzammal", due:"End of week",   done:false },
  { text:"Finalize microservices split for auth",      owner:"Ammad Ahmad",       due:"Next sprint",   done:false },
];

const TRANSCRIPT = [
  { speaker:0, time:"00:00", text:"Alright everyone, let's get started. Today we're reviewing the sprint backlog and architecture decisions for Q3." },
  { speaker:1, time:"00:28", text:"I've been looking at the ChromaDB integration. The embedding pipeline is fully tested on our local environment. We just need the API layer on top." },
  { speaker:0, time:"01:02", text:"Great. What's your ETA on the API endpoints?" },
  { speaker:1, time:"01:10", text:"Should have them ready by end of week. I'm thinking Thursday at the latest so we have Friday to test before the demo." },
  { speaker:2, time:"01:35", text:"That sounds reasonable. What about the authentication concern I raised last week? We need to make sure user data is properly scoped before we go live." },
  { speaker:0, time:"01:55", text:"Yes — the plan is to split auth into its own microservice. That way each user's memories are completely isolated at the data layer." },
  { speaker:1, time:"02:18", text:"I also want to flag the transcript accuracy issue. On some of the test recordings with Urdu-accented English, Whisper base model was struggling. Whisper v3 handles it significantly better in my tests." },
  { speaker:0, time:"02:45", text:"Let's make the switch then. Can you handle that? Update the config and get it on staging?" },
  { speaker:1, time:"02:52", text:"Already started. I'll have it on staging by tomorrow morning." },
  { speaker:2, time:"03:10", text:"Good. I'd like to see a demo of the full flow — record, transcribe, query — before our next meeting. Can we schedule that for Friday?" },
  { speaker:0, time:"03:24", text:"Friday works perfectly. Muzammal, can you send out a calendar invite after this?" },
  { speaker:1, time:"03:30", text:"Will do. I'll send it right after we wrap up." },
  { speaker:2, time:"03:42", text:"Perfect. The system is coming together well. Make sure the sequence diagram and class diagram in the report reflect these architecture changes." },
  { speaker:0, time:"03:58", text:"Noted. We'll update the SRS and diagram sections accordingly. Anything else before we wrap?" },
  { speaker:1, time:"04:08", text:"That's everything from my side. Looking forward to the demo." },
  { speaker:2, time:"04:14", text:"Same here. Good work team. Dismissed." },
];

const SPEAKER_COLORS = ["#6366F1", "#22D3EE", "#F59E0B"];
const SPEAKER_INITIALS = ["AA", "MM", "DA"];
const SPEAKER_NAMES = ["Ammad Ahmad", "Muhammad Muzammal", "Dr. Muhammad Adnan"];

// ── Tab system ────────────────────────────────────────────────────────────────
const TABS = ["Summary", "Transcript", "Decisions", "Tasks", "Speakers"];

export default function MeetingDetail({ navigate: navProp, dark: darkProp, setDark: setDarkProp, sidebarOpen: sidebarProp, setSidebarOpen: setSidebarProp, meeting: realMeeting } = {}) {
  const [darkLocal, setDarkLocal]               = useState(true);
  const [sidebarLocal, setSidebarLocal]         = useState(true);
  const dark          = darkProp          !== undefined ? darkProp        : darkLocal;
  const setDark       = setDarkProp       !== undefined ? setDarkProp     : setDarkLocal;
  const sidebarOpen   = sidebarProp       !== undefined ? sidebarProp     : sidebarLocal;
  const setSidebarOpen= setSidebarProp    !== undefined ? setSidebarProp  : setSidebarLocal;
  const [activeNav, setActiveNav]     = useState("Meetings");
  const [activeTab, setActiveTab]     = useState("Summary");
  const [searchTx, setSearchTx]       = useState("");
  const [expandedTx, setExpandedTx]   = useState(null);

  // ── Use REAL meeting data if available, otherwise fall back to mock ────────
  const isReal = !!realMeeting;

  // Color palette for speakers
  const COLORS = ["#6366F1", "#22D3EE", "#F59E0B", "#A78BFA", "#10B981", "#F43F5E"];

  // ── Calculate REAL speaker stats from transcript segments ───────────────────
  const calculateSpeakerStats = (segments) => {
    if (!segments || segments.length === 0) return {};
    const stats = {};
    segments.forEach(seg => {
      const sp = seg.speaker || "Speaker 1";
      if (!stats[sp]) stats[sp] = { wordCount: 0, duration: 0, segmentCount: 0 };
      stats[sp].wordCount    += (seg.text || "").split(/\s+/).filter(Boolean).length;
      stats[sp].duration     += (seg.end - seg.start);
      stats[sp].segmentCount += 1;
    });
    return stats;
  };

  // Build participant objects with REAL talk time percentages
  const buildRealParticipants = (segments) => {
    const stats = calculateSpeakerStats(segments);
    const speakers = Object.keys(stats);
    if (speakers.length === 0) return [];

    const totalDuration = speakers.reduce((sum, sp) => sum + stats[sp].duration, 0);
    const totalWords    = speakers.reduce((sum, sp) => sum + stats[sp].wordCount, 0);

    return speakers.map((sp, i) => {
      const talk = totalDuration > 0
        ? Math.round((stats[sp].duration / totalDuration) * 100)
        : Math.round((stats[sp].wordCount / Math.max(totalWords, 1)) * 100);
      return {
        name:     sp,                                                  // e.g. "Speaker 1"
        initials: sp.replace("Speaker ", "S"),                          // S1, S2 etc.
        color:    COLORS[i % COLORS.length],
        talk,
        words:    stats[sp].wordCount,
        duration: stats[sp].duration,
      };
    });
  };

  // Fallback for legacy / mock data
  const buildParticipants = (names) => names.map((name, i) => ({
    name,
    initials: name.split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase(),
    color: COLORS[i % COLORS.length],
    talk: Math.round(100 / Math.max(names.length, 1)),
  }));

  // Use real speakers from transcript when available, otherwise fall back to names
  const realParticipants = isReal && realMeeting.transcript
    ? buildRealParticipants(realMeeting.transcript)
    : null;

  const M = isReal ? {
    title:        realMeeting.title || "Untitled Meeting",
    date:         realMeeting.date || new Date().toLocaleDateString(),
    time:         realMeeting.time || new Date().toLocaleTimeString(),
    duration:     realMeeting.duration || "—",
    type:         realMeeting.type || "Team Meeting",
    language:     realMeeting.language || "English",
    participants: (realParticipants && realParticipants.length > 0)
                    ? realParticipants
                    : buildParticipants(realMeeting.participants || ["Speaker 1"]),
    tags:         realMeeting.tags || [],
    wordCount:    realMeeting.wordCount || 0,
    confidence:   96,
  } : MEETING;

  const SUMMARY_TXT  = isReal ? (realMeeting.summary || realMeeting.fullText || "No summary available.") : SUMMARY;
  const KEY_POINTS_R = isReal ? (realMeeting.tagging?.decisions || []).concat(realMeeting.tagging?.tasks || []) : KEY_POINTS;
  const DECISIONS_R  = isReal
    ? (realMeeting.tagging?.decisions || []).map(t => ({ text: t, owner: "Team", status: "confirmed" }))
    : DECISIONS;
  const TASKS_R      = isReal
    ? (realMeeting.tagging?.tasks || []).map(t => ({ text: t, owner: "Team", due: "Soon", done: false }))
    : TASKS;

  // ── Map real transcript segments to speaker INDEX (so existing UI works) ───
  const TRANSCRIPT_R = isReal && realMeeting.transcript
    ? realMeeting.transcript.map(seg => {
        // Find speaker index from real participants list
        const speakerName = seg.speaker || "Speaker 1";
        const idx = M.participants.findIndex(p => p.name === speakerName);
        return {
          speaker: idx >= 0 ? idx : 0,
          time:    fmtTime(seg.start),
          text:    seg.text,
        };
      })
    : TRANSCRIPT;

  const [tasksDone, setTasksDone] = useState(TASKS_R.map(t => t.done));
  const [copiedSummary, setCopiedSummary] = useState(false);
  const T = dark ? DARK : LIGHT;

  const filteredTx = TRANSCRIPT_R.filter(l =>
    l.text.toLowerCase().includes(searchTx.toLowerCase())
  );

  const toggleTask = (i) => setTasksDone(d => d.map((v, j) => j === i ? !v : v));

  const copySummary = () => {
    navigator.clipboard?.writeText(SUMMARY_TXT).catch(() => {});
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    html,body,#root{height:100%;width:100%;overflow:hidden}
    body{font-family:'Inter',sans-serif;background:${T.bg};color:${T.text1};transition:background .3s,color .3s}
    ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-thumb{background:${T.scrollbar};border-radius:2px}
    *{scrollbar-width:thin;scrollbar-color:${T.scrollbar} transparent}
    .app{display:flex;height:100vh;width:100vw;overflow:hidden}
    .main{flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0}

    /* Sidebar */
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

    /* Topbar */
    .topbar{height:60px;border-bottom:1px solid ${T.border};display:flex;align-items:center;justify-content:space-between;padding:0 24px;background:${T.topbar};backdrop-filter:blur(20px);flex-shrink:0;transition:background .3s}
    .tbt{font-size:15px;font-weight:700;letter-spacing:-.3px;color:${T.text1}}
    .tbd{font-size:11px;color:${T.text3};margin-top:1px}
    .sw{display:flex;align-items:center;gap:8px;background:${T.surface};border:1px solid ${T.border};border-radius:9px;padding:7px 12px;width:240px;transition:all .2s}
    .sw:focus-within{border-color:${T.borderStr};box-shadow:0 0 0 3px ${T.indigoGlow}}
    .sw input{background:none;border:none;outline:none;color:${T.text1};font-family:'Inter',sans-serif;font-size:13px;width:100%}
    .sw input::placeholder{color:${T.text3}}
    .tbr{display:flex;align-items:center;gap:10px}
    .ibtn{width:34px;height:34px;display:flex;align-items:center;justify-content:center;background:${T.surface};border:1px solid ${T.border};border-radius:8px;cursor:pointer;color:${T.text2};transition:all .2s;position:relative}
    .ibtn:hover{background:${T.surfaceHov};color:${T.text1};border-color:${T.borderStr}}
    .ndot{position:absolute;top:7px;right:7px;width:6px;height:6px;background:#F43F5E;border-radius:50%;border:1.5px solid ${T.bg};animation:breathe 2s ease-in-out infinite}
    .av{width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,#6366F1,#22D3EE);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff;cursor:pointer;transition:box-shadow .2s}
    .av:hover{box-shadow:0 0 0 2px #6366F1}
    .thbtn{display:flex;align-items:center;gap:6px;padding:6px 12px;border-radius:20px;background:${T.indigoGlow};border:1px solid ${T.borderStr};color:${dark?"#A5B4FC":"#4F46E5"};font-size:12px;font-weight:600;cursor:pointer;transition:all .2s;font-family:'Inter',sans-serif;white-space:nowrap}
    .thbtn:hover{background:${dark?"rgba(99,102,241,.25)":"rgba(99,102,241,.18)"}}

    /* Page layout */
    .page{flex:1;overflow:hidden;display:flex;flex-direction:column}
    .cnt{flex:1;overflow-y:auto;padding:24px 28px;display:flex;flex-direction:column;gap:20px}

    /* Meeting header card */
    .meeting-header{background:${T.heroGrad||"linear-gradient(135deg,rgba(99,102,241,.08),rgba(34,211,238,.05))"};border:1px solid ${T.border};border-radius:18px;padding:24px 28px;position:relative;overflow:hidden;box-shadow:${T.cardBox}}
    .mh-bg{position:absolute;top:-60px;right:-60px;width:240px;height:240px;background:radial-gradient(circle,rgba(99,102,241,.1) 0%,transparent 70%);pointer-events:none;animation:float 6s ease-in-out infinite}
    .mh-top{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;position:relative;z-index:1}
    .mh-left{}
    .back-btn{display:flex;align-items:center;gap:6px;padding:5px 10px;background:${T.surface};border:1px solid ${T.border};border-radius:7px;color:${T.text2};font-size:12px;font-weight:500;cursor:pointer;transition:all .2s;font-family:'Inter',sans-serif;margin-bottom:12px;width:fit-content}
    .back-btn:hover{background:${T.surfaceHov};color:${T.text1}}
    .meeting-title{font-size:22px;font-weight:800;letter-spacing:-.6px;color:${T.text1};margin-bottom:8px}
    .meeting-meta{display:flex;align-items:center;gap:14px;flex-wrap:wrap}
    .meta-item{display:flex;align-items:center;gap:5px;font-size:12px;color:${T.text2}}
    .status-badge{display:flex;align-items:center;gap:5px;padding:4px 10px;border-radius:20px;background:rgba(34,211,238,.1);border:1px solid rgba(34,211,238,.25);color:#22D3EE;font-size:11px;font-weight:700}
    .status-dot{width:6px;height:6px;border-radius:50%;background:#22D3EE}
    .mh-actions{display:flex;gap:8px;flex-shrink:0}
    .action-btn{display:flex;align-items:center;gap:6px;padding:8px 14px;border-radius:9px;font-size:12px;font-weight:600;cursor:pointer;transition:all .2s;font-family:'Inter',sans-serif;border:1px solid ${T.border};background:${T.surface};color:${T.text2}}
    .action-btn:hover{background:${T.surfaceHov};color:${T.text1};border-color:${T.borderStr}}
    .action-btn.primary{background:linear-gradient(135deg,#6366F1,#818CF8);color:#fff;border-color:transparent;box-shadow:0 4px 14px rgba(99,102,241,.35)}
    .action-btn.primary:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(99,102,241,.45)}
    .mh-tags{display:flex;gap:7px;flex-wrap:wrap;margin-top:14px;position:relative;z-index:1}
    .tg{font-size:11px;font-weight:600;padding:3px 9px;border-radius:20px;background:${T.tagBg};border:1px solid ${T.tagBorder};color:${T.tagColor}}

    /* Stats strip */
    .stats-strip{display:grid;grid-template-columns:repeat(5,1fr);gap:12px}
    .stat-mini{background:${T.surface};border:1px solid ${T.border};border-radius:12px;padding:14px 16px;transition:all .22s;box-shadow:${T.cardBox}}
    .stat-mini:hover{background:${T.surfaceHov};border-color:rgba(99,102,241,.25);transform:translateY(-1px)}
    .sm-icon{width:30px;height:30px;border-radius:7px;display:flex;align-items:center;justify-content:center;margin-bottom:10px}
    .sm-val{font-size:18px;font-weight:800;letter-spacing:-.5px}
    .sm-lbl{font-size:11px;color:${T.text2};margin-top:2px;font-weight:500}

    /* Two-column layout */
    .two-col{display:grid;grid-template-columns:1fr 300px;gap:20px;flex:1;min-height:0}

    /* Main card */
    .main-card{background:${T.surface};border:1px solid ${T.border};border-radius:14px;display:flex;flex-direction:column;overflow:hidden;box-shadow:${T.cardBox}}

    /* Tabs */
    .tabs{display:flex;gap:2px;padding:10px 12px;border-bottom:1px solid ${T.border};flex-shrink:0;background:${T.surfaceDeep||"rgba(0,0,0,.15)"}}
    .tab{padding:7px 14px;border-radius:7px;font-size:12px;font-weight:600;cursor:pointer;transition:all .2s;color:${T.text3};border:1px solid transparent}
    .tab:hover{color:${T.text2};background:${T.surfaceHov}}
    .tab.act{background:${T.indigoGlow};border-color:${T.borderStr};color:${dark?"#A5B4FC":"#4F46E5"}}
    .tab-body{flex:1;overflow-y:auto;padding:20px}

    /* Summary tab */
    .summary-text{font-size:14px;line-height:1.8;color:${T.text2};margin-bottom:18px}
    .section-title{font-size:12px;font-weight:700;color:${T.text3};text-transform:uppercase;letter-spacing:.7px;margin-bottom:10px;display:flex;align-items:center;gap:7px}
    .key-point{display:flex;align-items:flex-start;gap:10px;padding:10px 12px;background:${T.hlBg};border:1px solid ${T.hlBorder};border-radius:9px;margin-bottom:7px;transition:all .2s}
    .key-point:hover{border-color:rgba(99,102,241,.35)}
    .kp-dot{width:6px;height:6px;border-radius:50%;background:#6366F1;flex-shrink:0;margin-top:6px}
    .kp-text{font-size:13px;color:${T.text1};line-height:1.6}

    /* Transcript tab */
    .tx-search{display:flex;align-items:center;gap:8px;background:${T.inputBg};border:1px solid ${T.border};border-radius:9px;padding:8px 12px;margin-bottom:14px;transition:all .2s}
    .tx-search:focus-within{border-color:${T.borderStr};box-shadow:0 0 0 3px ${T.indigoGlow}}
    .tx-search input{background:none;border:none;outline:none;color:${T.text1};font-family:'Inter',sans-serif;font-size:13px;width:100%}
    .tx-search input::placeholder{color:${T.text3}}
    .tx-line{display:flex;gap:12px;align-items:flex-start;padding:12px;border-radius:10px;cursor:pointer;transition:background .15s;margin-bottom:4px}
    .tx-line:hover{background:${T.surfaceHov}}
    .tx-line.expanded{background:${T.hlBg};border:1px solid ${T.hlBorder}}
    .tx-av{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#fff;flex-shrink:0}
    .tx-info{flex:1;min-width:0}
    .tx-meta{display:flex;align-items:center;gap:8px;margin-bottom:4px}
    .tx-name{font-size:11px;font-weight:700;color:${T.text2}}
    .tx-time{font-size:10px;color:${T.text3};font-family:'JetBrains Mono',monospace}
    .tx-text{font-size:13px;color:${T.text1};line-height:1.65}

    /* Decisions tab */
    .decision-card{display:flex;align-items:flex-start;gap:12px;padding:14px 16px;background:${T.surface};border:1px solid ${T.border};border-radius:11px;margin-bottom:8px;transition:all .2s}
    .decision-card:hover{border-color:rgba(99,102,241,.25);background:${T.surfaceHov}}
    .dc-check{width:22px;height:22px;border-radius:50%;background:linear-gradient(135deg,#6366F1,#22D3EE);display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 0 8px rgba(99,102,241,.3)}
    .dc-text{font-size:13px;font-weight:500;color:${T.text1};line-height:1.5;margin-bottom:5px}
    .dc-owner{font-size:11px;color:${T.text3};display:flex;align-items:center;gap:5px}

    /* Tasks tab */
    .task-item{display:flex;align-items:flex-start;gap:12px;padding:13px 14px;background:${T.surface};border:1px solid ${T.border};border-radius:11px;margin-bottom:7px;transition:all .2s;cursor:pointer}
    .task-item:hover{border-color:rgba(99,102,241,.25)}
    .task-item.done-task{opacity:.6}
    .task-cb{width:20px;height:20px;border-radius:5px;border:2px solid ${T.border};display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .2s;margin-top:1px}
    .task-cb.checked{background:linear-gradient(135deg,#6366F1,#22D3EE);border-color:transparent}
    .task-text{font-size:13px;font-weight:500;color:${T.text1};line-height:1.5;margin-bottom:4px}
    .task-text.done-text{text-decoration:line-through;color:${T.text3}}
    .task-meta{display:flex;align-items:center;gap:10px;font-size:11px;color:${T.text3}}
    .due-badge{padding:2px 7px;border-radius:20px;font-size:10px;font-weight:600}
    .due-today{background:rgba(244,63,94,.1);border:1px solid rgba(244,63,94,.25);color:#F43F5E}
    .due-soon{background:rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.25);color:#F59E0B}
    .due-later{background:${T.tagBg};border:1px solid ${T.tagBorder};color:${T.tagColor}}

    /* Speakers tab */
    .speaker-card{background:${T.surface};border:1px solid ${T.border};border-radius:12px;padding:18px;margin-bottom:10px;box-shadow:${T.cardBox}}
    .sc-top{display:flex;align-items:center;gap:12px;margin-bottom:14px}
    .sc-av{width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:#fff;flex-shrink:0}
    .sc-name{font-size:14px;font-weight:700;color:${T.text1}}
    .sc-role{font-size:11px;color:${T.text3};margin-top:1px}
    .sc-pct{font-size:22px;font-weight:800;margin-left:auto;letter-spacing:-.5px}
    .sc-bar{height:6px;border-radius:3px;background:${dark?"rgba(255,255,255,.07)":"rgba(0,0,0,.07)"};overflow:hidden;margin-bottom:10px}
    .sc-fill{height:100%;border-radius:3px;transition:width .6s ease}
    .sc-stats{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px}
    .sc-stat{background:${T.surfaceDeep||"rgba(0,0,0,.15)"};border-radius:8px;padding:8px 10px;text-align:center}
    .sc-sv{font-size:14px;font-weight:700;color:${T.text1}}
    .sc-sl{font-size:10px;color:${T.text3};margin-top:2px}

    /* Right panel */
    .right-panel{display:flex;flex-direction:column;gap:14px}
    .rp-card{background:${T.surface};border:1px solid ${T.border};border-radius:13px;overflow:hidden;box-shadow:${T.cardBox}}
    .rp-head{padding:12px 15px;border-bottom:1px solid ${T.border};font-size:12px;font-weight:700;color:${T.text1};display:flex;align-items:center;gap:7px}
    .rp-body{padding:12px 15px;display:flex;flex-direction:column;gap:8px}
    .rp-row{display:flex;align-items:center;justify-content:space-between}
    .rp-label{font-size:12px;color:${T.text2};display:flex;align-items:center;gap:6px}
    .rp-val{font-size:12px;font-weight:600;color:${T.text1};font-family:'JetBrains Mono',monospace}
    .participant-row{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid ${T.border}}
    .participant-row:last-child{border-bottom:none}
    .p-av{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#fff;flex-shrink:0}
    .p-name{font-size:12px;font-weight:600;color:${T.text1};flex:1}
    .p-pct{font-size:11px;color:${T.text3};font-family:'JetBrains Mono',monospace}
    .ask-btn{display:flex;align-items:center;justify-content:center;gap:8px;padding:11px;background:linear-gradient(135deg,#6366F1,#818CF8);border:none;border-radius:10px;color:#fff;font-size:13px;font-weight:700;cursor:pointer;transition:all .2s;font-family:'Inter',sans-serif;box-shadow:0 4px 14px rgba(99,102,241,.35);width:100%}
    .ask-btn:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(99,102,241,.45)}

    @keyframes breathe{0%,100%{opacity:1}50%{opacity:.45}}
    @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-16px)}}
    @keyframes fade-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
  `;

  return (
    <>
      <style>{css}</style>
      <div className="app">

        {/* ── Sidebar ── */}
        <aside className="sb">
          <div className="logo">
            <div className="lmark"><Icon name="brain" size={16} color="#fff"/></div>
            {sidebarOpen && <div className="ltxt">Re<span>calla</span></div>}
          </div>
          {NAV.map(item => (
            <div key={item.label} className={`ni${activeNav===item.label?" act":""}`} onClick={()=>{ setActiveNav(item.label); if(navProp){ const routes={"Dashboard":"dashboard","Meetings":"meetings","Memory":"memory","Ask Recalla":"ask","Reminders":"reminders","Timeline":"timeline","Settings":"settings"}; navProp(routes[item.label]||"dashboard"); } }}>
              <Icon name={item.icon} size={16} color={activeNav===item.label?"#6366F1":T.text2}/>
              <span className="nlbl">{item.label}</span>
            </div>
          ))}
          <div className="usr">
            <div className="ni">
              <div className="avsm">AA</div>
              {sidebarOpen && (
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

        {/* ── Main ── */}
        <main className="main">

          {/* Topbar */}
          <div className="topbar">
            <div>
              <div className="tbt">Meeting Detail</div>
              <div className="tbd">Backend Architecture Sync · 16 Jun 2026</div>
            </div>
            <div className="sw">
              <Icon name="search" size={14} color={T.text3}/>
              <input placeholder="Search meetings…"/>
            </div>
            <div className="tbr">
              <button className="thbtn" onClick={()=>setDark(d=>!d)}>
                <Icon name={dark?"sun":"moon"} size={13} color={dark?"#A5B4FC":"#4F46E5"}/>
                {dark?"Light mode":"Dark mode"}
              </button>
              <div className="ibtn"><Icon name="bell" size={15} color={T.text2}/><div className="ndot"/></div>
              <div className="av">AA</div>
            </div>
          </div>

          <div className="page">
            <div className="cnt">

              {/* ── Meeting header ── */}
              <div className="meeting-header" style={{animation:"fade-in .35s ease"}}>
                <div className="mh-bg"/>
                <div className="mh-top">
                  <div className="mh-left">
                    <button className="back-btn" onClick={() => navProp && navProp("meetings")}>
                      <Icon name="arrowLeft" size={13} color="currentColor"/>
                      Back to Meetings
                    </button>
                    <div className="meeting-title">{M.title}</div>
                    <div className="meeting-meta">
                      <div className="status-badge">
                        <div className="status-dot"/>
                        Processed
                      </div>
                      <div className="meta-item">
                        <Icon name="calendar" size={13} color={T.text3}/>
                        {M.date}
                      </div>
                      <div className="meta-item">
                        <Icon name="clock" size={13} color={T.text3}/>
                        {M.time}
                      </div>
                      <div className="meta-item">
                        <Icon name="users" size={13} color={T.text3}/>
                        {M.participants.length} participants
                      </div>
                    </div>
                  </div>
                  <div className="mh-actions">
                    <button className="action-btn" onClick={copySummary}>
                      <Icon name="copy" size={13} color="currentColor"/>
                      {copiedSummary?"Copied!":"Copy"}
                    </button>
                    <button className="action-btn">
                      <Icon name="download" size={13} color="currentColor"/>
                      Export
                    </button>
                    <button className="action-btn">
                      <Icon name="share" size={13} color="currentColor"/>
                      Share
                    </button>
                    <button className="action-btn primary">
                      <Icon name="sparkle" size={13} color="#fff"/>
                      Ask Recalla
                    </button>
                  </div>
                </div>
                <div className="mh-tags">
                  {M.tags.map(t => <span key={t} className="tg">{t}</span>)}
                </div>
              </div>

              {/* ── Stats strip ── */}
              <div className="stats-strip" style={{animation:"fade-in .4s ease"}}>
                {[
                  {icon:"clock",    color:"#6366F1", bg:"rgba(99,102,241,.12)", val:M.duration,            label:"Duration"},
                  {icon:"fileText", color:"#22D3EE", bg:"rgba(34,211,238,.10)", val:M.wordCount.toLocaleString(), label:"Words Transcribed"},
                  {icon:"users",    color:"#A78BFA", bg:"rgba(167,139,250,.12)",val:`${M.participants.length} speakers`, label:"Participants"},
                  {icon:"zap",      color:"#F59E0B", bg:"rgba(245,158,11,.10)", val:`${M.confidence}%`,   label:"AI Confidence"},
                  {icon:"list",     color:"#10B981", bg:"rgba(16,185,129,.10)", val:`${TASKS_R.length} tasks`,     label:"Action Items"},
                ].map((s,i) => (
                  <div key={i} className="stat-mini">
                    <div className="sm-icon" style={{background:s.bg}}>
                      <Icon name={s.icon} size={14} color={s.color}/>
                    </div>
                    <div className="sm-val" style={{color:s.color}}>{s.val}</div>
                    <div className="sm-lbl">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* ── Two column ── */}
              <div className="two-col" style={{animation:"fade-in .45s ease"}}>

                {/* Main card with tabs */}
                <div className="main-card">
                  <div className="tabs">
                    {TABS.map(tab => (
                      <button key={tab} className={`tab${activeTab===tab?" act":""}`} onClick={()=>setActiveTab(tab)}>
                        {tab}
                        {tab==="Tasks" && (
                          <span style={{marginLeft:5,fontSize:10,padding:"1px 5px",borderRadius:20,background:dark?"rgba(255,255,255,.08)":"rgba(0,0,0,.06)",color:T.text3}}>
                            {tasksDone.filter(Boolean).length}/{TASKS_R.length}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="tab-body">

                    {/* ── SUMMARY TAB ── */}
                    {activeTab==="Summary" && (
                      <div>
                        <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",background:T.hlBg,border:`1px solid ${T.hlBorder}`,borderRadius:10,marginBottom:18}}>
                          <div style={{width:28,height:28,borderRadius:7,background:"linear-gradient(135deg,#6366F1,#22D3EE)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                            <Icon name="brain" size={14} color="#fff"/>
                          </div>
                          <div style={{fontSize:12,color:T.text2,lineHeight:1.5}}>
                            <strong style={{color:T.text1}}>AI-generated summary</strong> · Generated using GPT-4 + Whisper v3 · Confidence {M.confidence}%
                          </div>
                        </div>
                        <p className="summary-text">{SUMMARY_TXT}</p>
                        <div className="section-title">
                          <Icon name="zap" size={13} color="#6366F1"/>
                          Key Points
                        </div>
                        {KEY_POINTS_R.map((kp,i) => (
                          <div key={i} className="key-point">
                            <div className="kp-dot"/>
                            <div className="kp-text">{kp}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* ── TRANSCRIPT TAB ── */}
                    {activeTab==="Transcript" && (
                      <div>
                        <div className="tx-search">
                          <Icon name="search" size={14} color={T.text3}/>
                          <input
                            placeholder="Search transcript…"
                            value={searchTx}
                            onChange={e=>setSearchTx(e.target.value)}
                          />
                          {searchTx && (
                            <span style={{fontSize:11,color:T.text3,whiteSpace:"nowrap"}}>
                              {filteredTx.length} result{filteredTx.length!==1?"s":""}
                            </span>
                          )}
                        </div>
                        {filteredTx.map((line,i) => (
                          <div
                            key={i}
                            className={`tx-line${expandedTx===i?" expanded":""}`}
                            onClick={()=>setExpandedTx(expandedTx===i?null:i)}
                          >
                            <div className="tx-av" style={{background: M.participants[line.speaker]?.color || SPEAKER_COLORS[line.speaker]}}>
                              {M.participants[line.speaker]?.initials || SPEAKER_INITIALS[line.speaker] || `S${line.speaker + 1}`}
                            </div>
                            <div className="tx-info">
                              <div className="tx-meta">
                                <span className="tx-name" style={{color: M.participants[line.speaker]?.color || SPEAKER_COLORS[line.speaker]}}>
                                  {M.participants[line.speaker]?.name || SPEAKER_NAMES[line.speaker] || `Speaker ${line.speaker + 1}`}
                                </span>
                                <span className="tx-time">{line.time}</span>
                              </div>
                              <div className="tx-text">
                                {searchTx
                                  ? line.text.split(new RegExp(`(${searchTx})`, "gi")).map((part, pi) =>
                                      part.toLowerCase()===searchTx.toLowerCase()
                                        ? <mark key={pi} style={{background:"rgba(99,102,241,.3)",color:T.text1,borderRadius:2}}>{part}</mark>
                                        : part
                                    )
                                  : line.text
                                }
                              </div>
                              {expandedTx===i && (
                                <div style={{marginTop:10,display:"flex",gap:7}}>
                                  <button style={{display:"flex",alignItems:"center",gap:4,padding:"4px 9px",background:T.indigoGlow,border:`1px solid ${T.borderStr}`,borderRadius:6,color:dark?"#A5B4FC":"#4F46E5",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>
                                    <Icon name="copy" size={11} color="currentColor"/>Copy
                                  </button>
                                  <button style={{display:"flex",alignItems:"center",gap:4,padding:"4px 9px",background:T.indigoGlow,border:`1px solid ${T.borderStr}`,borderRadius:6,color:dark?"#A5B4FC":"#4F46E5",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>
                                    <Icon name="pin" size={11} color="currentColor"/>Pin
                                  </button>
                                  <button style={{display:"flex",alignItems:"center",gap:4,padding:"4px 9px",background:T.indigoGlow,border:`1px solid ${T.borderStr}`,borderRadius:6,color:dark?"#A5B4FC":"#4F46E5",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>
                                    <Icon name="sparkle" size={11} color="currentColor"/>Ask about this
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* ── DECISIONS TAB ── */}
                    {activeTab==="Decisions" && (
                      <div>
                        <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:T.hlBg,border:`1px solid ${T.hlBorder}`,borderRadius:9,marginBottom:16,fontSize:12,color:T.text2}}>
                          <Icon name="alertCircle" size={13} color="#6366F1"/>
                          {DECISIONS_R.length} decisions were recorded in this meeting
                        </div>
                        {DECISIONS_R.map((d,i) => (
                          <div key={i} className="decision-card">
                            <div className="dc-check">
                              <Icon name="check" size={12} color="#fff"/>
                            </div>
                            <div style={{flex:1}}>
                              <div className="dc-text">{d.text}</div>
                              <div className="dc-owner">
                                <Icon name="users" size={10} color={T.text3}/>
                                Owner: <strong style={{color:T.text2}}>{d.owner}</strong>
                                <span style={{marginLeft:8,padding:"1px 7px",borderRadius:20,background:"rgba(34,211,238,.1)",border:"1px solid rgba(34,211,238,.2)",color:"#22D3EE",fontSize:10,fontWeight:700}}>
                                  {d.status}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* ── TASKS TAB ── */}
                    {activeTab==="Tasks" && (
                      <div>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
                          <div style={{fontSize:13,color:T.text2}}>
                            <strong style={{color:T.text1}}>{tasksDone.filter(Boolean).length}</strong> of <strong style={{color:T.text1}}>{TASKS_R.length}</strong> tasks completed
                          </div>
                          <div style={{flex:1,height:4,borderRadius:2,background:dark?"rgba(255,255,255,.07)":"rgba(0,0,0,.07)",margin:"0 14px",overflow:"hidden"}}>
                            <div style={{height:"100%",borderRadius:2,background:"linear-gradient(90deg,#6366F1,#22D3EE)",width:`${(tasksDone.filter(Boolean).length/TASKS_R.length)*100}%`,transition:"width .4s ease"}}/>
                          </div>
                          <div style={{fontSize:12,fontWeight:700,color:"#6366F1"}}>{Math.round((tasksDone.filter(Boolean).length/TASKS_R.length)*100)}%</div>
                        </div>
                        {TASKS_R.map((task,i) => (
                          <div key={i} className={`task-item${tasksDone[i]?" done-task":""}`} onClick={()=>toggleTask(i)}>
                            <div className={`task-cb${tasksDone[i]?" checked":""}`}>
                              {tasksDone[i] && <Icon name="check" size={11} color="#fff"/>}
                            </div>
                            <div style={{flex:1}}>
                              <div className={`task-text${tasksDone[i]?" done-text":""}`}>{task.text}</div>
                              <div className="task-meta">
                                <Icon name="users" size={10} color={T.text3}/>
                                <span>{task.owner}</span>
                                <span className={`due-badge ${task.due==="Today"?"due-today":task.due==="Tomorrow"?"due-soon":"due-later"}`}>
                                  {task.due}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* ── SPEAKERS TAB ── */}
                    {activeTab==="Speakers" && (
                      <div>
                        {M.participants.map((p,i) => (
                          <div key={i} className="speaker-card">
                            <div className="sc-top">
                              <div className="sc-av" style={{background:p.color,boxShadow:`0 0 10px ${p.color}55`}}>
                                {p.initials}
                              </div>
                              <div>
                                <div className="sc-name">{p.name}</div>
                                <div className="sc-role">{isReal ? (p.duration ? `${p.duration.toFixed(1)}s spoken` : "Detected speaker") : (i===0?"Project Lead":i===1?"Backend Developer":"Project Supervisor")}</div>
                              </div>
                              <div className="sc-pct" style={{color:p.color}}>{p.talk}%</div>
                            </div>
                            <div className="sc-bar">
                              <div className="sc-fill" style={{width:`${p.talk}%`,background:p.color}}/>
                            </div>
                            <div className="sc-stats">
                              {[
                                {v: p.words !== undefined ? p.words : Math.round(M.wordCount * (p.talk/100)), l:"Words"},
                                {v: p.duration !== undefined ? `${Math.round(p.duration/60)}m ${Math.round(p.duration%60)}s` : `${Math.round(32*(p.talk/100))}m`, l:"Talk time"},
                                {v: Math.round(p.talk/10) + 2, l:"Questions"},
                              ].map((s,j) => (
                                <div key={j} className="sc-stat">
                                  <div className="sc-sv">{s.v}</div>
                                  <div className="sc-sl">{s.l}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                  </div>
                </div>

                {/* ── Right panel ── */}
                <div className="right-panel">

                  {/* Meeting info */}
                  <div className="rp-card">
                    <div className="rp-head">
                      <Icon name="fileText" size={13} color="#6366F1"/>
                      Meeting Info
                    </div>
                    <div className="rp-body">
                      {[
                        {label:"Type",      val:M.type,     icon:"tag"},
                        {label:"Duration",  val:M.duration, icon:"clock"},
                        {label:"Language",  val:M.language, icon:"zap"},
                        {label:"Words",     val:M.wordCount.toLocaleString(), icon:"fileText"},
                        {label:"Confidence",val:`${M.confidence}%`, icon:"trendUp"},
                      ].map((r,i) => (
                        <div key={i} className="rp-row" style={{padding:"7px 0",borderBottom:i<4?`1px solid ${T.border}`:"none"}}>
                          <div className="rp-label">
                            <Icon name={r.icon} size={12} color={T.text3}/>
                            {r.label}
                          </div>
                          <div className="rp-val">{r.val}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Participants */}
                  <div className="rp-card">
                    <div className="rp-head">
                      <Icon name="users" size={13} color="#22D3EE"/>
                      Participants
                    </div>
                    <div style={{padding:"6px 15px"}}>
                      {M.participants.map((p,i) => (
                        <div key={i} className="participant-row">
                          <div className="p-av" style={{background:p.color}}>{p.initials}</div>
                          <div className="p-name">{p.name}</div>
                          <div className="p-pct">{p.talk}%</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="rp-card">
                    <div className="rp-head">
                      <Icon name="tag" size={13} color="#F59E0B"/>
                      Tags
                    </div>
                    <div style={{padding:"12px 15px",display:"flex",flexWrap:"wrap",gap:6}}>
                      {M.tags.map(t => <span key={t} className="tg">{t}</span>)}
                    </div>
                  </div>

                  {/* Ask Recalla shortcut */}
                  <button className="ask-btn">
                    <Icon name="sparkle" size={15} color="#fff"/>
                    Ask Recalla about this meeting
                  </button>

                  {/* Related memories */}
                  <div className="rp-card">
                    <div className="rp-head">
                      <Icon name="brain" size={13} color="#A78BFA"/>
                      Stored Memories
                    </div>
                    <div className="rp-body" style={{gap:6}}>
                      {[
                        "Agreed to split auth into microservice",
                        "ChromaDB pipeline is tested and ready",
                        "Whisper v3 approved for upgrade",
                        "Demo scheduled for Friday with Dr. Adnan",
                      ].map((m,i) => (
                        <div key={i} style={{display:"flex",alignItems:"flex-start",gap:8,padding:"8px 10px",background:T.hlBg,border:`1px solid ${T.hlBorder}`,borderRadius:8,cursor:"pointer",transition:"all .2s",fontSize:12,color:T.text2,lineHeight:1.5}}
                          onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(99,102,241,.3)";e.currentTarget.style.color=T.text1}}
                          onMouseLeave={e=>{e.currentTarget.style.borderColor=T.hlBorder;e.currentTarget.style.color=T.text2}}
                        >
                          <div style={{width:5,height:5,borderRadius:"50%",background:"#6366F1",flexShrink:0,marginTop:5}}/>
                          {m}
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>

              <div style={{height:12}}/>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}