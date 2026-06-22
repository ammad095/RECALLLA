import { useState } from "react";

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
    pin:        <svg viewBox="0 0 24 24" {...s}><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/></svg>,
    pinFilled:  <svg viewBox="0 0 24 24" width={size} height={size} fill={color} stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="17" x2="12" y2="22" stroke={color} fill="none"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/></svg>,
    trash:      <svg viewBox="0 0 24 24" {...s}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
    zap:        <svg viewBox="0 0 24 24" {...s}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
    check:      <svg viewBox="0 0 24 24" {...s}><polyline points="20 6 9 17 4 12"/></svg>,
    target:     <svg viewBox="0 0 24 24" {...s}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
    alertCircle:<svg viewBox="0 0 24 24" {...s}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
    helpCircle: <svg viewBox="0 0 24 24" {...s}><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    calendar:   <svg viewBox="0 0 24 24" {...s}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    tag:        <svg viewBox="0 0 24 24" {...s}><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
    fileText:   <svg viewBox="0 0 24 24" {...s}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
    sparkle:    <svg viewBox="0 0 24 24" {...s}><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>,
    grid:       <svg viewBox="0 0 24 24" {...s}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
    list:       <svg viewBox="0 0 24 24" {...s}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
    arrowRight: <svg viewBox="0 0 24 24" {...s}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
    link:       <svg viewBox="0 0 24 24" {...s}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
    trendUp:    <svg viewBox="0 0 24 24" {...s}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
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
  inputBg:"rgba(0,0,0,0.3)",
};
const LIGHT = {
  bg:"#F4F6FB",sidebar:"#FFFFFF",topbar:"rgba(255,255,255,0.92)",
  surface:"#FFFFFF",surfaceHov:"#F0F3FA",
  border:"rgba(0,0,0,0.08)",borderStr:"rgba(99,102,241,0.5)",
  indigoGlow:"rgba(99,102,241,0.10)",
  text1:"#111827",text2:"#374151",text3:"#9CA3AF",
  cardBox:"0 2px 12px rgba(0,0,0,0.07)",scrollbar:"rgba(0,0,0,0.12)",
  tagBg:"rgba(99,102,241,0.10)",tagBorder:"rgba(99,102,241,0.22)",tagColor:"#4F46E5",
  inputBg:"rgba(0,0,0,0.04)",
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

// ── Memory categories ────────────────────────────────────────────────────────
const CATEGORIES = {
  decision:  { label:"Decisions",   icon:"check",        color:"#22D3EE", bg:"rgba(34,211,238,0.12)",  border:"rgba(34,211,238,0.25)" },
  task:      { label:"Tasks",       icon:"target",       color:"#A78BFA", bg:"rgba(167,139,250,0.12)", border:"rgba(167,139,250,0.25)" },
  insight:   { label:"Key Points",  icon:"zap",          color:"#6366F1", bg:"rgba(99,102,241,0.14)",  border:"rgba(99,102,241,0.28)" },
  question:  { label:"Questions",   icon:"helpCircle",   color:"#F59E0B", bg:"rgba(245,158,11,0.12)",  border:"rgba(245,158,11,0.25)" },
  deadline:  { label:"Deadlines",   icon:"alertCircle",  color:"#F43F5E", bg:"rgba(244,63,94,0.12)",   border:"rgba(244,63,94,0.25)" },
};

// ── Mock memory data ─────────────────────────────────────────────────────────
const MEMORIES = [
  { id:1,  type:"decision",  text:"Use ChromaDB as the primary vector database for semantic memory storage. The embedding pipeline is tested and ready for deployment.", source:"Backend Architecture Sync", date:"Yesterday, 4:00 PM", speaker:"Team", confidence:96, tags:["Backend","ChromaDB"], related:3, pinned:true },
  { id:2,  type:"task",      text:"Muhammad Muzammal will deploy Whisper v3 to staging by tomorrow morning. This includes updating the model config and running validation tests.", source:"Backend Architecture Sync", date:"Yesterday, 4:25 PM", speaker:"Ammad Ahmad", confidence:94, tags:["Engineering","Deployment"], related:2, pinned:true },
  { id:3,  type:"insight",   text:"Users struggle with onboarding step 3 — 40% drop-off rate. Proposed simplified flow with inline hints to reduce cognitive load.", source:"UX Research Debrief", date:"Yesterday, 11:00 AM", speaker:"Muhammad Muzammal", confidence:91, tags:["UX","Research"], related:5, pinned:false },
  { id:4,  type:"decision",  text:"Split authentication into its own microservice before ChromaDB integration. This ensures user data is properly scoped at the data layer.", source:"Backend Architecture Sync", date:"Yesterday, 4:15 PM", speaker:"Team", confidence:97, tags:["Architecture","Backend"], related:2, pinned:false },
  { id:5,  type:"question",  text:"Should we schedule a sprint review for next Monday? Need to align on the demo agenda for Dr. Adnan.", source:"Product Sprint Planning", date:"Today, 10:15 AM", speaker:"Ammad Ahmad", confidence:88, tags:["Sprint","FYP"], related:1, pinned:false },
  { id:6,  type:"deadline",  text:"FYP Part 1 report submission due by June 30th, 11:59 PM. Includes chapters 1-3 with updated gap analysis section.", source:"Supervisor FYP Feedback", date:"Mon, 9:30 AM", speaker:"Dr. Muhammad Adnan", confidence:99, tags:["FYP","Deadline"], related:4, pinned:true },
  { id:7,  type:"task",      text:"Update SRS document with new architecture changes — sequence diagram and class diagram need to reflect the microservices split.", source:"Backend Architecture Sync", date:"Yesterday, 3:58 PM", speaker:"Ammad Ahmad", confidence:92, tags:["FYP","Documentation"], related:2, pinned:false },
  { id:8,  type:"insight",   text:"Whisper v3 handles Urdu-accented English significantly better than the base model — recommended upgrade based on test recordings.", source:"Backend Architecture Sync", date:"Yesterday, 2:18 PM", speaker:"Muhammad Muzammal", confidence:90, tags:["AI/ML","Whisper"], related:3, pinned:false },
  { id:9,  type:"decision",  text:"Approved indigo and cyan gradient as the primary color palette for the Recalla dark mode interface. Finalized across all components.", source:"Frontend Design Review", date:"Mon, 3:25 PM", speaker:"Team", confidence:95, tags:["Design","UI"], related:2, pinned:false },
  { id:10, type:"question",  text:"How should we handle speaker diarization for the FYP demo if pyannote is too heavy for our laptops?", source:"Backend Architecture Sync", date:"Yesterday, 4:30 PM", speaker:"Ammad Ahmad", confidence:85, tags:["AI/ML","FYP"], related:2, pinned:false },
  { id:11, type:"task",      text:"Send revised investor pitch deck to Ahmed by 4:00 PM today — updated with refined TAM slide messaging.", source:"Investor Pitch Review", date:"Today, 2:45 PM", speaker:"Ammad Ahmad", confidence:93, tags:["Investor","Finance"], related:1, pinned:false },
  { id:12, type:"insight",   text:"ChromaDB performs 3x faster than expected on local CPU benchmarks — viable for the FYP demo without GPU acceleration.", source:"Database Schema Planning", date:"Sun, 2:45 PM", speaker:"Muhammad Muzammal", confidence:89, tags:["Database","Performance"], related:2, pinned:false },
];

const TABS = ["All", "Decisions", "Tasks", "Key Points", "Questions", "Deadlines"];

// ── Memory card ──────────────────────────────────────────────────────────────
const MemoryCard = ({ m, T, dark, onPin, onDelete, onAsk, viewMode }) => {
  const cat = CATEGORIES[m.type] || CATEGORIES.insight;
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? T.surfaceHov : T.surface,
        border: `1px solid ${hovered ? cat.border : T.border}`,
        borderRadius: 13,
        padding: viewMode === "list" ? "14px 16px" : 16,
        transition: "all .25s",
        boxShadow: T.cardBox,
        position: "relative",
        overflow: "hidden",
        animation: "fade-in .3s ease",
        cursor: "default",
      }}
    >
      {/* Left color accent */}
      <div style={{ position:"absolute", left:0, top:0, bottom:0, width:3, background:`linear-gradient(180deg, ${cat.color}, transparent)`, opacity:0.7 }}/>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10, gap:8 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ width:24, height:24, borderRadius:7, background:cat.bg, border:`1px solid ${cat.border}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <Icon name={cat.icon} size={12} color={cat.color}/>
          </div>
          <span style={{ fontSize:10, fontWeight:700, color:cat.color, textTransform:"uppercase", letterSpacing:".5px" }}>
            {cat.label.slice(0, -1)}
          </span>
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          {/* Confidence badge */}
          <span style={{ display:"flex", alignItems:"center", gap:3, fontSize:10, fontWeight:600, padding:"2px 7px", borderRadius:20, background:T.indigoGlow, border:`1px solid ${T.borderStr}`, color:dark?"#A5B4FC":"#4F46E5" }}>
            <Icon name="sparkle" size={9} color="currentColor"/>
            {m.confidence}%
          </span>
          {/* Pin button */}
          <button
            onClick={() => onPin(m.id)}
            style={{ width:24, height:24, borderRadius:6, background:m.pinned?T.indigoGlow:T.surface, border:`1px solid ${m.pinned?T.borderStr:T.border}`, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", transition:"all .2s" }}
            title={m.pinned ? "Unpin" : "Pin"}
          >
            <Icon name="pin" size={11} color={m.pinned ? "#6366F1" : T.text3}/>
          </button>
        </div>
      </div>

      {/* Memory text */}
      <div style={{ fontSize:13, color:T.text1, lineHeight:1.6, marginBottom:12 }}>
        {m.text}
      </div>

      {/* Tags */}
      <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:10 }}>
        {m.tags.map(t => (
          <span key={t} style={{ fontSize:10, fontWeight:600, padding:"2px 7px", borderRadius:20, background:T.tagBg, border:`1px solid ${T.tagBorder}`, color:T.tagColor }}>
            {t}
          </span>
        ))}
      </div>

      {/* Footer */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:8, paddingTop:10, borderTop:`1px solid ${T.border}` }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:11, color:T.text3, flexWrap:"wrap" }}>
          <span style={{ display:"flex", alignItems:"center", gap:3 }}>
            <Icon name="fileText" size={10} color={T.text3}/>
            {m.source}
          </span>
          <span>·</span>
          <span style={{ display:"flex", alignItems:"center", gap:3 }}>
            <Icon name="clock" size={10} color={T.text3}/>
            {m.date}
          </span>
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          {/* Related count */}
          {m.related > 0 && (
            <span style={{ display:"flex", alignItems:"center", gap:3, fontSize:10, color:T.text3 }}>
              <Icon name="link" size={9} color={T.text3}/>
              {m.related} related
            </span>
          )}

          {/* Ask Recalla quick button */}
          <button
            onClick={() => onAsk(m)}
            style={{
              display:"flex", alignItems:"center", gap:4,
              padding:"4px 8px", borderRadius:6,
              background:hovered ? T.indigoGlow : "transparent",
              border:`1px solid ${hovered ? T.borderStr : T.border}`,
              color: hovered ? (dark?"#A5B4FC":"#4F46E5") : T.text3,
              fontSize:10, fontWeight:600, cursor:"pointer",
              transition:"all .2s", fontFamily:"'Inter',sans-serif",
            }}
            title="Ask Recalla about this"
          >
            <Icon name="sparkle" size={9} color="currentColor"/>
            Ask
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Memory({ navigate: navProp, dark: darkProp, setDark: setDarkProp, sidebarOpen: sidebarProp, setSidebarOpen: setSidebarProp } = {}) {
  const [darkLocal, setDarkLocal]           = useState(true);
  const [sidebarLocal, setSidebarLocal]     = useState(true);
  const dark          = darkProp          !== undefined ? darkProp        : darkLocal;
  const setDark       = setDarkProp       !== undefined ? setDarkProp     : setDarkLocal;
  const sidebarOpen   = sidebarProp       !== undefined ? sidebarProp     : sidebarLocal;
  const setSidebarOpen= setSidebarProp    !== undefined ? setSidebarProp  : setSidebarLocal;

  const [memories, setMemories] = useState(MEMORIES);
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("grid");

  const T = dark ? DARK : LIGHT;

  const handleNav = (route) => { if (navProp) navProp(route); };

  const togglePin = (id) => {
    setMemories(ms => ms.map(m => m.id === id ? { ...m, pinned: !m.pinned } : m));
  };

  const deleteMemory = (id) => setMemories(ms => ms.filter(m => m.id !== id));

  const askRecalla = () => { if (navProp) navProp("ask"); };

  // Filter
  const tabMap = { "All":"all", "Decisions":"decision", "Tasks":"task", "Key Points":"insight", "Questions":"question", "Deadlines":"deadline" };
  const filterKey = tabMap[activeTab];

  const filtered = memories.filter(m => {
    const matchTab = filterKey === "all" || m.type === filterKey;
    const matchSearch = !search ||
      m.text.toLowerCase().includes(search.toLowerCase()) ||
      m.source.toLowerCase().includes(search.toLowerCase()) ||
      m.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    return matchTab && matchSearch;
  });

  const pinnedMemories = filtered.filter(m => m.pinned);
  const unpinnedMemories = filtered.filter(m => !m.pinned);

  const stats = {
    total:     memories.length,
    pinned:    memories.filter(m=>m.pinned).length,
    decisions: memories.filter(m=>m.type==="decision").length,
    tasks:     memories.filter(m=>m.type==="task").length,
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
    .sw{display:flex;align-items:center;gap:8px;background:${T.surface};border:1px solid ${T.border};border-radius:9px;padding:7px 12px;width:260px;transition:all .2s}
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
    .cnt{flex:1;overflow-y:auto;padding:24px 28px;display:flex;flex-direction:column;gap:18px}
    .tab{padding:7px 16px;border-radius:7px;font-size:12px;font-weight:600;cursor:pointer;transition:all .2s;color:${T.text3};border:1px solid transparent;font-family:'Inter',sans-serif}
    .tab:hover{color:${T.text2};background:${T.surfaceHov}}
    .tab.act{background:${T.indigoGlow};border-color:${T.borderStr};color:${dark?"#A5B4FC":"#4F46E5"}}
    .stat-card{background:${T.surface};border:1px solid ${T.border};border-radius:12px;padding:16px;box-shadow:${T.cardBox};transition:all .22s}
    .stat-card:hover{background:${T.surfaceHov};border-color:rgba(99,102,241,.25);transform:translateY(-1px)}
    .semantic-search{position:relative;width:100%}
    .semantic-search-icon{position:absolute;left:18px;top:50%;transform:translateY(-50%);pointer-events:none;color:#6366F1}
    .semantic-search input{width:100%;padding:14px 16px 14px 48px;background:${T.surface};border:1px solid ${T.border};border-radius:14px;color:${T.text1};font-family:'Inter',sans-serif;font-size:14px;outline:none;transition:all .2s;box-shadow:${T.cardBox}}
    .semantic-search input:focus{border-color:${T.borderStr};box-shadow:0 0 0 4px ${T.indigoGlow}, ${T.cardBox}}
    .semantic-search input::placeholder{color:${T.text3}}
    .ai-badge{position:absolute;right:14px;top:50%;transform:translateY(-50%);display:flex;align-items:center;gap:5px;padding:4px 10px;border-radius:20px;background:${T.indigoGlow};border:1px solid ${T.borderStr};color:${dark?"#A5B4FC":"#4F46E5"};font-size:11px;font-weight:600}
    .section-label{font-size:11px;font-weight:700;color:${T.text3};text-transform:uppercase;letter-spacing:.8px;padding:0 2px;display:flex;align-items:center;gap:7px}
    .view-btn{width:32px;height:32px;display:flex;align-items:center;justify-content:center;border-radius:7px;cursor:pointer;transition:all .2s;border:1px solid ${T.border};background:${T.surface};color:${T.text3}}
    .view-btn.act{background:${T.indigoGlow};border-color:${T.borderStr};color:${dark?"#A5B4FC":"#4F46E5"}}
    .view-btn:hover{border-color:${T.borderStr};color:${T.text1}}
    .empty{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 20px;gap:14px;text-align:center}
    @keyframes breathe{0%,100%{opacity:1}50%{opacity:.45}}
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
          {NAV.map(item => (
            <div key={item.label} className={`ni${item.route==="memory"?" act":""}`} onClick={() => handleNav(item.route)}>
              <Icon name={item.icon} size={16} color={item.route==="memory"?"#6366F1":T.text2}/>
              <span className="nlbl">{item.label}</span>
            </div>
          ))}
          <div className="usr">
            <div className="ni">
              <div className="avsm">AA</div>
              {sidebarOpen && (
                <div style={{ overflow:"hidden" }}>
                  <div style={{ fontSize:12, fontWeight:600, color:T.text1, whiteSpace:"nowrap" }}>Ammad Ahmad</div>
                  <div style={{ fontSize:10, color:T.text3, whiteSpace:"nowrap" }}>BSCS · 50908</div>
                </div>
              )}
            </div>
          </div>
          <div className="sbt" onClick={() => setSidebarOpen(p => !p)}>
            <Icon name="menu" size={11} color={T.text3}/>
          </div>
        </aside>

        {/* Main */}
        <main className="main">
          {/* Topbar */}
          <div className="topbar">
            <div>
              <div style={{ fontSize:15, fontWeight:700, letterSpacing:"-.3px", color:T.text1 }}>Memory Bank</div>
              <div style={{ fontSize:11, color:T.text3, marginTop:1 }}>AI-extracted memories from your meetings</div>
            </div>
            <div className="sw">
              <Icon name="search" size={14} color={T.text3}/>
              <input placeholder="Quick search…"/>
            </div>
            <div className="tbr">
              <button className="thbtn" onClick={() => setDark(d => !d)}>
                <Icon name={dark?"sun":"moon"} size={13} color={dark?"#A5B4FC":"#4F46E5"}/>
                {dark?"Light mode":"Dark mode"}
              </button>
              <div className="ibtn"><Icon name="bell" size={15} color={T.text2}/><div className="ndot"/></div>
              <div className="av">AA</div>
            </div>
          </div>

          <div className="cnt">

            {/* Hero header */}
            <div style={{ display:"flex", alignItems:"center", gap:14, animation:"fade-in .3s ease" }}>
              <div style={{ width:42, height:42, borderRadius:11, background:"linear-gradient(135deg,#6366F1,#22D3EE)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 0 20px rgba(99,102,241,.4)" }}>
                <Icon name="brain" size={20} color="#fff"/>
              </div>
              <div>
                <div style={{ fontSize:22, fontWeight:800, color:T.text1, letterSpacing:"-.6px" }}>Memory Bank</div>
                <div style={{ fontSize:13, color:T.text2, marginTop:2 }}>Everything Recalla learned from your meetings</div>
              </div>
            </div>

            {/* Semantic search */}
            <div className="semantic-search" style={{ animation:"fade-in .35s ease" }}>
              <div className="semantic-search-icon">
                <Icon name="sparkle" size={18} color="#6366F1"/>
              </div>
              <input
                placeholder="Search semantically — try 'decisions about backend' or 'tasks for Muzammal'…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <div className="ai-badge">
                <Icon name="zap" size={10} color="currentColor"/>
                AI Search
              </div>
            </div>

            {/* Stats strip */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, animation:"fade-in .4s ease" }}>
              {[
                { icon:"brain",  color:"#6366F1", bg:"rgba(99,102,241,.12)", val:stats.total,     label:"Total Memories" },
                { icon:"pin",    color:"#F59E0B", bg:"rgba(245,158,11,.10)", val:stats.pinned,    label:"Pinned" },
                { icon:"check",  color:"#22D3EE", bg:"rgba(34,211,238,.10)", val:stats.decisions, label:"Decisions" },
                { icon:"target", color:"#A78BFA", bg:"rgba(167,139,250,.12)",val:stats.tasks,     label:"Tasks" },
              ].map((s,i) => (
                <div key={i} className="stat-card">
                  <div style={{ width:32, height:32, borderRadius:7, background:s.bg, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:10 }}>
                    <Icon name={s.icon} size={15} color={s.color}/>
                  </div>
                  <div style={{ fontSize:24, fontWeight:800, letterSpacing:"-1px", color:s.color }}>{s.val}</div>
                  <div style={{ fontSize:11, color:T.text2, marginTop:2, fontWeight:500 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Toolbar */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10, animation:"fade-in .45s ease" }}>
              <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                {TABS.map(tab => (
                  <button key={tab} className={`tab${activeTab===tab?" act":""}`} onClick={() => setActiveTab(tab)}>
                    {tab}
                    <span style={{ marginLeft:5, fontSize:10, padding:"1px 5px", borderRadius:20, background:dark?"rgba(255,255,255,.07)":"rgba(0,0,0,.06)", color:T.text3 }}>
                      {tab==="All" ? memories.length : memories.filter(m=>m.type===tabMap[tab]).length}
                    </span>
                  </button>
                ))}
              </div>

              <div style={{ display:"flex", gap:4 }}>
                <div className={`view-btn${viewMode==="grid"?" act":""}`} onClick={() => setViewMode("grid")} title="Grid view">
                  <Icon name="grid" size={14} color="currentColor"/>
                </div>
                <div className={`view-btn${viewMode==="list"?" act":""}`} onClick={() => setViewMode("list")} title="List view">
                  <Icon name="list" size={14} color="currentColor"/>
                </div>
              </div>
            </div>

            {/* Pinned section */}
            {pinnedMemories.length > 0 && (
              <div style={{ animation:"fade-in .5s ease" }}>
                <div className="section-label" style={{ marginBottom:10 }}>
                  <Icon name="pin" size={12} color="#F59E0B"/>
                  Pinned · {pinnedMemories.length}
                </div>
                <div style={{
                  display:"grid",
                  gridTemplateColumns: viewMode==="grid" ? "repeat(2, 1fr)" : "1fr",
                  gap:12,
                }}>
                  {pinnedMemories.map(m => (
                    <MemoryCard key={m.id} m={m} T={T} dark={dark} onPin={togglePin} onDelete={deleteMemory} onAsk={askRecalla} viewMode={viewMode}/>
                  ))}
                </div>
              </div>
            )}

            {/* All memories */}
            {unpinnedMemories.length > 0 && (
              <div style={{ animation:"fade-in .55s ease" }}>
                <div className="section-label" style={{ marginBottom:10 }}>
                  <Icon name="brain" size={12} color="#6366F1"/>
                  All Memories · {unpinnedMemories.length}
                </div>
                <div style={{
                  display:"grid",
                  gridTemplateColumns: viewMode==="grid" ? "repeat(2, 1fr)" : "1fr",
                  gap:12,
                }}>
                  {unpinnedMemories.map(m => (
                    <MemoryCard key={m.id} m={m} T={T} dark={dark} onPin={togglePin} onDelete={deleteMemory} onAsk={askRecalla} viewMode={viewMode}/>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {filtered.length === 0 && (
              <div className="empty">
                <div style={{ width:60, height:60, borderRadius:"50%", background:"linear-gradient(135deg,#6366F1,#22D3EE)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 0 24px rgba(99,102,241,.35)" }}>
                  <Icon name="brain" size={26} color="#fff"/>
                </div>
                <div style={{ fontSize:16, fontWeight:700, color:T.text1 }}>No memories found</div>
                <div style={{ fontSize:13, color:T.text3, maxWidth:280, lineHeight:1.6 }}>
                  {search ? "Try different search terms — semantic search understands meaning, not just keywords." : "Start by recording your first meeting"}
                </div>
                <button onClick={() => handleNav("record")} style={{ marginTop:4, padding:"9px 18px", background:"linear-gradient(135deg,#6366F1,#818CF8)", border:"none", borderRadius:9, color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'Inter',sans-serif", boxShadow:"0 4px 14px rgba(99,102,241,.35)", display:"flex", alignItems:"center", gap:7 }}>
                  <Icon name="mic" size={14} color="#fff"/>
                  Record a Meeting
                </button>
              </div>
            )}

            <div style={{ height:12 }}/>
          </div>
        </main>
      </div>
    </>
  );
}