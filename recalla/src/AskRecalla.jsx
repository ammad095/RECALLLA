import { useState, useEffect, useRef } from "react";

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
    send:       <svg viewBox="0 0 24 24" {...s}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
    zap:        <svg viewBox="0 0 24 24" {...s}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
    copy:       <svg viewBox="0 0 24 24" {...s}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
    thumbUp:    <svg viewBox="0 0 24 24" {...s}><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>,
    thumbDown:  <svg viewBox="0 0 24 24" {...s}><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/><path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/></svg>,
    refresh:    <svg viewBox="0 0 24 24" {...s}><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>,
    fileText:   <svg viewBox="0 0 24 24" {...s}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
    tag:        <svg viewBox="0 0 24 24" {...s}><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
    plus:       <svg viewBox="0 0 24 24" {...s}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    trash:      <svg viewBox="0 0 24 24" {...s}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
    chevRight:  <svg viewBox="0 0 24 24" {...s}><polyline points="9 18 15 12 9 6"/></svg>,
    link:       <svg viewBox="0 0 24 24" {...s}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
    sparkle:    <svg viewBox="0 0 24 24" {...s}><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>,
    arrowRight: <svg viewBox="0 0 24 24" {...s}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
    pin:        <svg viewBox="0 0 24 24" {...s}><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/></svg>,
    x:          <svg viewBox="0 0 24 24" {...s}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  };
  return icons[name] || null;
};

// ── Theme tokens ──────────────────────────────────────────────────────────────
const DARK = {
  bg:"#080B12", sidebar:"rgba(8,11,18,0.97)", topbar:"rgba(8,11,18,0.88)",
  surface:"rgba(255,255,255,0.05)", surfaceHov:"rgba(255,255,255,0.09)",
  surfaceMed:"rgba(255,255,255,0.07)",
  border:"rgba(255,255,255,0.09)", borderStr:"rgba(99,102,241,0.45)",
  indigoGlow:"rgba(99,102,241,0.15)", cyanGlow:"rgba(34,211,238,0.10)",
  text1:"#F9FAFB", text2:"#C4C9D4", text3:"#6B7280",
  cardBox:"0 10px 28px rgba(0,0,0,0.35)", scrollbar:"rgba(255,255,255,0.1)",
  tagBg:"rgba(99,102,241,0.14)", tagBorder:"rgba(99,102,241,0.28)", tagColor:"#A5B4FC",
  inputBg:"rgba(0,0,0,0.3)", addBtnBg:"rgba(99,102,241,0.14)",
  addBtnBr:"rgba(99,102,241,0.35)", addBtnCl:"#A5B4FC",
  userBubble:"linear-gradient(135deg,#6366F1,#818CF8)",
  aiBubble:"rgba(255,255,255,0.05)",
  aiBubbleBorder:"rgba(255,255,255,0.09)",
  sourceCard:"rgba(255,255,255,0.04)",
  sourceCardBorder:"rgba(255,255,255,0.07)",
  inputArea:"rgba(8,11,18,0.95)",
};
const LIGHT = {
  bg:"#F4F6FB", sidebar:"#FFFFFF", topbar:"rgba(255,255,255,0.92)",
  surface:"#FFFFFF", surfaceHov:"#F0F3FA",
  surfaceMed:"#F7F8FC",
  border:"rgba(0,0,0,0.08)", borderStr:"rgba(99,102,241,0.5)",
  indigoGlow:"rgba(99,102,241,0.10)", cyanGlow:"rgba(34,211,238,0.07)",
  text1:"#111827", text2:"#374151", text3:"#9CA3AF",
  cardBox:"0 2px 12px rgba(0,0,0,0.07)", scrollbar:"rgba(0,0,0,0.12)",
  tagBg:"rgba(99,102,241,0.10)", tagBorder:"rgba(99,102,241,0.22)", tagColor:"#4F46E5",
  inputBg:"rgba(0,0,0,0.04)", addBtnBg:"rgba(99,102,241,0.09)",
  addBtnBr:"rgba(99,102,241,0.28)", addBtnCl:"#4F46E5",
  userBubble:"linear-gradient(135deg,#6366F1,#818CF8)",
  aiBubble:"#FFFFFF",
  aiBubbleBorder:"rgba(0,0,0,0.08)",
  sourceCard:"#F7F8FC",
  sourceCardBorder:"rgba(0,0,0,0.07)",
  inputArea:"rgba(255,255,255,0.95)",
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

// ── Chat history sessions (left panel) ───────────────────────────────────────
const SESSIONS = [
  { id:1, title:"Backend architecture decisions", date:"Today",     preview:"What did we decide about ChromaDB vs Pinecone?", active:true },
  { id:2, title:"Sprint Q3 action items",         date:"Today",     preview:"List all tasks assigned to Muzammal",           active:false },
  { id:3, title:"Investor pitch follow-ups",      date:"Yesterday", preview:"Who mentioned the TAM slide issue?",            active:false },
  { id:4, title:"UX research findings",           date:"Yesterday", preview:"What were the key pain points from testing?",   active:false },
  { id:5, title:"Supervisor feedback session",    date:"Mon",       preview:"What changes did Dr. Adnan suggest?",          active:false },
  { id:6, title:"Deployment timeline",            date:"Mon",       preview:"When is the staging deployment scheduled?",    active:false },
];

// ── Suggested questions ───────────────────────────────────────────────────────
const SUGGESTIONS = [
  "What tasks are overdue from last week?",
  "Summarise all Q3 decisions made so far",
  "Who is responsible for the API endpoints?",
  "What did Dr. Adnan say about the demo?",
  "List all deadlines mentioned this week",
  "What issues were raised in UX testing?",
];

// ── Source cards data ─────────────────────────────────────────────────────────
const SOURCES = [
  { title:"Backend Architecture Sync",   date:"Yesterday, 4:00 PM",    match:"94%" },
  { title:"Product Sprint Planning",     date:"Today, 10:00 AM",       match:"87%" },
  { title:"UX Research Debrief",         date:"Yesterday, 11:00 AM",   match:"71%" },
];

// ── Pre-loaded conversation ───────────────────────────────────────────────────
const INITIAL_MESSAGES = [
  {
    id:1, role:"user",
    text:"What did we decide about the backend architecture in yesterday's meeting?",
    time:"2:14 PM",
  },
  {
    id:2, role:"ai",
    text:"Based on your **Backend Architecture Sync** meeting yesterday, here's what was decided:\n\n**1. Microservices split for auth module**\nThe team agreed to separate the authentication service into its own microservice. This was flagged as a priority before the ChromaDB integration.\n\n**2. ChromaDB for vector storage**\nChromaDB was confirmed as the vector database for semantic memory storage. The embedding pipeline has already been tested and is ready.\n\n**3. Whisper v3 upgrade**\nMuhammad Muzammal was assigned to update the transcription model config to Whisper v3 and deploy it to staging by the following morning.\n\n**4. Demo scheduled for Friday**\nA demo for Dr. Adnan was scheduled for Friday. Muhammad Muzammal was to send out the calendar invite.\n\n*3 memories retrieved · Confidence: 94%*",
    time:"2:14 PM",
    sources:SOURCES,
  },
  {
    id:3, role:"user",
    text:"Who is responsible for the ChromaDB integration?",
    time:"2:16 PM",
  },
  {
    id:4, role:"ai",
    text:"From the **Backend Architecture Sync** meeting, **Muhammad Muzammal** is responsible for the ChromaDB integration. Specifically:\n\n- The embedding pipeline is already tested\n- API endpoints are targeted for end of week\n- Staging deployment of Whisper v3 was assigned to him as well\n\nNo explicit deadline was mentioned for ChromaDB itself beyond \"end of week\" for the API endpoints.\n\n*2 memories retrieved · Confidence: 91%*",
    time:"2:16 PM",
    sources:[SOURCES[0], SOURCES[1]],
  },
];

// ── Typing indicator ──────────────────────────────────────────────────────────
const TypingIndicator = ({ T }) => (
  <div style={{ display:"flex", alignItems:"center", gap:5, padding:"10px 14px" }}>
    <div style={{ width:32, height:32, borderRadius:"50%", background:"linear-gradient(135deg,#6366F1,#22D3EE)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, boxShadow:"0 0 12px rgba(99,102,241,.4)" }}>
      <Icon name="brain" size={15} color="#fff"/>
    </div>
    <div style={{ background:T.aiBubble, border:`1px solid ${T.aiBubbleBorder}`, borderRadius:"4px 14px 14px 14px", padding:"10px 14px", display:"flex", gap:5, alignItems:"center" }}>
      {[0,1,2].map(i => (
        <div key={i} style={{ width:7, height:7, borderRadius:"50%", background:"#6366F1", animation:`typing-dot 1.2s ease-in-out ${i*0.2}s infinite` }}/>
      ))}
    </div>
  </div>
);

// ── Markdown-lite renderer (bold + newlines) ──────────────────────────────────
const MdText = ({ text, color }) => {
  const lines = text.split("\n");
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
      {lines.map((line, li) => {
        if (!line) return <div key={li} style={{ height:4 }}/>;
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <div key={li} style={{ fontSize:13, lineHeight:1.7, color }}>
            {parts.map((p, pi) =>
              p.startsWith("**") && p.endsWith("**")
                ? <strong key={pi} style={{ fontWeight:700 }}>{p.slice(2,-2)}</strong>
                : <span key={pi}>{p}</span>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ── Source citation card ──────────────────────────────────────────────────────
const SourceCard = ({ src, T }) => (
  <div style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 12px", background:T.sourceCard, border:`1px solid ${T.sourceCardBorder}`, borderRadius:9, cursor:"pointer", transition:"all .2s" }}
    onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(99,102,241,.3)"}
    onMouseLeave={e => e.currentTarget.style.borderColor = T.sourceCardBorder}
  >
    <div style={{ width:28, height:28, borderRadius:7, background:"rgba(99,102,241,.12)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
      <Icon name="fileText" size={13} color="#6366F1"/>
    </div>
    <div style={{ flex:1, minWidth:0 }}>
      <div style={{ fontSize:11, fontWeight:600, color:T.text1, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{src.title}</div>
      <div style={{ fontSize:10, color:T.text3, fontFamily:"'JetBrains Mono',monospace" }}>{src.date}</div>
    </div>
    <div style={{ fontSize:10, fontWeight:700, color:"#22D3EE", background:"rgba(34,211,238,.1)", border:"1px solid rgba(34,211,238,.2)", borderRadius:20, padding:"2px 7px", flexShrink:0 }}>{src.match}</div>
    <Icon name="chevRight" size={12} color={T.text3}/>
  </div>
);

// ── AI Message bubble ─────────────────────────────────────────────────────────
const AIMessage = ({ msg, T, dark, onCopy }) => {
  const [copied, setCopied] = useState(false);
  const [liked, setLiked]   = useState(null);
  const [showSrc, setShowSrc] = useState(false);

  const handleCopy = () => {
    setCopied(true);
    onCopy(msg.text);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ display:"flex", gap:10, alignItems:"flex-start", animation:"msg-in .3s ease" }}>
      {/* Avatar */}
      <div style={{ width:32, height:32, borderRadius:"50%", background:"linear-gradient(135deg,#6366F1,#22D3EE)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, boxShadow:"0 0 12px rgba(99,102,241,.35)", marginTop:2 }}>
        <Icon name="brain" size={15} color="#fff"/>
      </div>

      <div style={{ flex:1, minWidth:0 }}>
        {/* Label */}
        <div style={{ fontSize:11, fontWeight:600, color:T.text3, marginBottom:5, letterSpacing:".3px" }}>
          RECALLA · {msg.time}
        </div>

        {/* Bubble */}
        <div style={{ background:T.aiBubble, border:`1px solid ${T.aiBubbleBorder}`, borderRadius:"4px 14px 14px 14px", padding:"14px 16px", boxShadow:T.cardBox }}>
          <MdText text={msg.text} color={T.text1}/>
        </div>

        {/* Source citations */}
        {msg.sources?.length > 0 && (
          <div style={{ marginTop:8 }}>
            <button
              onClick={() => setShowSrc(s=>!s)}
              style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, color:T.text3, background:"none", border:"none", cursor:"pointer", fontFamily:"'Inter',sans-serif", padding:0, marginBottom:showSrc?8:0, transition:"color .2s" }}
              onMouseEnter={e=>e.currentTarget.style.color="#6366F1"}
              onMouseLeave={e=>e.currentTarget.style.color=T.text3}
            >
              <Icon name="link" size={11} color="currentColor"/>
              {msg.sources.length} source{msg.sources.length>1?"s":""} retrieved
              <Icon name="chevRight" size={10} color="currentColor" style={{ transform:showSrc?"rotate(90deg)":"none", transition:"transform .2s" }}/>
            </button>
            {showSrc && (
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {msg.sources.map((src,i) => <SourceCard key={i} src={src} T={T}/>)}
              </div>
            )}
          </div>
        )}

        {/* Action row */}
        <div style={{ display:"flex", alignItems:"center", gap:4, marginTop:8 }}>
          {[
            { icon:"copy",      label:copied?"Copied!":"Copy",   action:handleCopy,              active:copied },
            { icon:"thumbUp",   label:"Helpful",                 action:()=>setLiked("up"),      active:liked==="up" },
            { icon:"thumbDown", label:"Not helpful",             action:()=>setLiked("down"),    active:liked==="down" },
            { icon:"refresh",   label:"Regenerate",              action:()=>{},                  active:false },
          ].map(btn => (
            <button
              key={btn.icon}
              onClick={btn.action}
              title={btn.label}
              style={{ display:"flex", alignItems:"center", gap:4, padding:"4px 8px", borderRadius:6, background:btn.active?(dark?"rgba(99,102,241,.2)":"rgba(99,102,241,.12)"):"none", border:`1px solid ${btn.active?T.borderStr:"transparent"}`, color:btn.active?"#6366F1":T.text3, cursor:"pointer", fontSize:11, fontFamily:"'Inter',sans-serif", transition:"all .2s" }}
              onMouseEnter={e=>{ if(!btn.active){ e.currentTarget.style.background=T.surfaceHov; e.currentTarget.style.color=T.text2; } }}
              onMouseLeave={e=>{ if(!btn.active){ e.currentTarget.style.background="none"; e.currentTarget.style.color=T.text3; } }}
            >
              <Icon name={btn.icon} size={12} color="currentColor"/>
              <span>{btn.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── User message bubble ───────────────────────────────────────────────────────
const UserMessage = ({ msg, T }) => (
  <div style={{ display:"flex", gap:10, alignItems:"flex-start", justifyContent:"flex-end", animation:"msg-in .3s ease" }}>
    <div style={{ maxWidth:"72%" }}>
      <div style={{ fontSize:11, fontWeight:600, color:T.text3, marginBottom:5, textAlign:"right", letterSpacing:".3px" }}>
        YOU · {msg.time}
      </div>
      <div style={{ background:T.userBubble, borderRadius:"14px 4px 14px 14px", padding:"12px 16px", boxShadow:"0 4px 16px rgba(99,102,241,.3)" }}>
        <div style={{ fontSize:13, lineHeight:1.7, color:"#fff" }}>{msg.text}</div>
      </div>
    </div>
    <div style={{ width:32, height:32, borderRadius:"50%", background:"linear-gradient(135deg,#6366F1,#22D3EE)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:11, fontWeight:700, color:"#fff", marginTop:2 }}>
      AA
    </div>
  </div>
);

// ── AI responses for new questions ────────────────────────────────────────────
const AI_RESPONSES = [
  "Based on your recent meetings, I found several relevant memories. The most recent discussion on this topic was in your **Sprint Planning** session where the team agreed on a phased approach.\n\n*Confidence: 88% · 4 memories retrieved*",
  "I searched through **12 meeting transcripts** and found this was discussed in depth during your **Backend Architecture Sync**.\n\nThe key decision was to proceed with the modular approach, with Muzammal handling the implementation.\n\n*Confidence: 92% · 3 memories retrieved*",
  "From your stored memories, here's what I found:\n\n**Primary source:** UX Research Debrief (Yesterday)\n- Users struggled with onboarding step 3\n- Simplified flow was proposed with inline hints\n- Follow-up usability test was scheduled\n\n*Confidence: 85% · 2 memories retrieved*",
  "Looking through your conversations, this was flagged by **Dr. Adnan** in the supervisor session. He recommended simplifying the architecture diagram for the report and ensuring all use cases are covered in the SRS.\n\n*Confidence: 89% · 1 memory retrieved*",
];

let aiRespIdx = 0;

// ── Main component ────────────────────────────────────────────────────────────
export default function AskRecalla({ navigate: navProp, dark: darkProp, setDark: setDarkProp, sidebarOpen: sidebarProp, setSidebarOpen: setSidebarProp } = {}) {
  const [darkLocal, setDarkLocal]       = useState(true);
  const [sidebarLocal, setSidebarLocal] = useState(true);
  const dark           = darkProp        !== undefined ? darkProp        : darkLocal;
  const setDark        = setDarkProp     !== undefined ? setDarkProp     : setDarkLocal;
  const sidebarOpen    = sidebarProp     !== undefined ? sidebarProp     : sidebarLocal;
  const setSidebarOpen = setSidebarProp  !== undefined ? setSidebarProp  : setSidebarLocal;

  const [activeNav, setActiveNav]     = useState("Ask Recalla");
  const [messages, setMessages]       = useState(INITIAL_MESSAGES);
  const [input, setInput]             = useState("");
  const [isTyping, setIsTyping]       = useState(false);
  const [activeSession, setActiveSession] = useState(1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);
  const T = dark ? DARK : LIGHT;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [messages, isTyping]);

  const sendMessage = (text) => {
    const q = (text || input).trim();
    if (!q) return;
    setInput("");
    setShowSuggestions(false);

    const userMsg = { id:Date.now(), role:"user", text:q, time:new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}) };
    setMessages(m => [...m, userMsg]);
    setIsTyping(true);

    const delay = 1400 + Math.random() * 800;
    setTimeout(() => {
      const aiMsg = {
        id:Date.now()+1,
        role:"ai",
        text:AI_RESPONSES[aiRespIdx % AI_RESPONSES.length],
        time:new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}),
        sources:SOURCES.slice(0, Math.floor(Math.random()*3)+1),
      };
      aiRespIdx++;
      setMessages(m => [...m, aiMsg]);
      setIsTyping(false);
    }, delay);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const clearChat = () => { setMessages([]); setIsTyping(false); };

  const copyToClipboard = (text) => {
    navigator.clipboard?.writeText(text).catch(()=>{});
  };

  // ── CSS ────────────────────────────────────────────────────────────────────
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

    /* Chat layout — 3 columns */
    .chat-layout{flex:1;display:grid;grid-template-columns:260px 1fr 260px;overflow:hidden;min-height:0}

    /* Left panel — chat sessions */
    .sessions-panel{border-right:1px solid ${T.border};display:flex;flex-direction:column;background:${T.sidebar};overflow:hidden}
    .sp-header{padding:14px 16px;border-bottom:1px solid ${T.border};display:flex;align-items:center;justify-content:space-between;flex-shrink:0}
    .sp-title{font-size:12px;font-weight:700;color:${T.text1};letter-spacing:.3px}
    .new-chat-btn{display:flex;align-items:center;gap:4px;padding:5px 10px;background:${T.indigoGlow};border:1px solid ${T.borderStr};border-radius:7px;color:${dark?"#A5B4FC":"#4F46E5"};font-size:11px;font-weight:600;cursor:pointer;transition:all .2s;font-family:'Inter',sans-serif}
    .new-chat-btn:hover{background:${dark?"rgba(99,102,241,.22)":"rgba(99,102,241,.16)"}}
    .sp-list{flex:1;overflow-y:auto;padding:8px}
    .session-item{padding:10px 12px;border-radius:9px;cursor:pointer;transition:all .2s;margin-bottom:2px;border:1px solid transparent;position:relative}
    .session-item:hover{background:${T.surfaceHov}}
    .session-item.act{background:${T.indigoGlow};border-color:${T.borderStr}}
    .session-item.act::before{content:'';position:absolute;left:0;top:20%;bottom:20%;width:2px;background:#6366F1;border-radius:0 2px 2px 0}
    .si-date{font-size:10px;color:${T.text3};font-family:'JetBrains Mono',monospace;margin-bottom:3px}
    .si-title{font-size:12px;font-weight:600;color:${T.text1};margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .si-preview{font-size:11px;color:${T.text2};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.4}
    .sp-section{padding:4px 8px;font-size:10px;font-weight:700;color:${T.text3};letter-spacing:.8px;text-transform:uppercase;margin-top:8px}

    /* Centre — chat area */
    .chat-center{display:flex;flex-direction:column;overflow:hidden;min-width:0}
    .messages-area{flex:1;overflow-y:auto;padding:24px 20px;display:flex;flex-direction:column;gap:20px}

    /* Empty state */
    .empty-state{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:40px;text-align:center}
    .es-brain{width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,#6366F1,#22D3EE);display:flex;align-items:center;justify-content:center;box-shadow:0 0 28px rgba(99,102,241,.4);animation:float 4s ease-in-out infinite}
    .es-title{font-size:20px;font-weight:800;letter-spacing:-.5px;color:${T.text1}}
    .es-sub{font-size:13px;color:${T.text2};line-height:1.7;max-width:320px}
    .es-chips{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:8px}
    .es-chip{padding:8px 14px;border-radius:20px;background:${T.surface};border:1px solid ${T.border};color:${T.text2};font-size:12px;cursor:pointer;transition:all .2s;font-family:'Inter',sans-serif;font-weight:500}
    .es-chip:hover{border-color:${T.borderStr};color:${T.text1};background:${T.indigoGlow}}

    /* Input area */
    .input-area{padding:16px 20px;border-top:1px solid ${T.border};background:${T.inputArea};backdrop-filter:blur(20px);flex-shrink:0}
    .input-wrap{display:flex;align-items:flex-end;gap:10px;background:${T.surface};border:1px solid ${T.border};border-radius:14px;padding:10px 14px;transition:all .2s;position:relative}
    .input-wrap:focus-within{border-color:${T.borderStr};box-shadow:0 0 0 3px ${T.indigoGlow}}
    .chat-input{flex:1;background:none;border:none;outline:none;color:${T.text1};font-family:'Inter',sans-serif;font-size:14px;resize:none;max-height:120px;line-height:1.6;padding:2px 0}
    .chat-input::placeholder{color:${T.text3}}
    .send-btn{width:36px;height:36px;border-radius:9px;background:linear-gradient(135deg,#6366F1,#818CF8);border:none;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s;flex-shrink:0;box-shadow:0 3px 10px rgba(99,102,241,.35)}
    .send-btn:hover{transform:scale(1.08);box-shadow:0 5px 16px rgba(99,102,241,.45)}
    .send-btn:active{transform:scale(.96)}
    .send-btn:disabled{opacity:.4;cursor:default;transform:none}
    .input-meta{display:flex;align-items:center;justify-content:space-between;margin-top:8px}
    .input-hint{font-size:11px;color:${T.text3}}
    .input-actions{display:flex;gap:6px}
    .ia-btn{display:flex;align-items:center;gap:5px;padding:4px 9px;border-radius:6px;background:none;border:1px solid ${T.border};color:${T.text3};font-size:11px;cursor:pointer;transition:all .2s;font-family:'Inter',sans-serif}
    .ia-btn:hover{border-color:${T.borderStr};color:${T.text1};background:${T.indigoGlow}}

    /* Suggestions dropdown */
    .suggestions-drop{position:absolute;bottom:calc(100% + 8px);left:0;right:0;background:${T.sidebar};border:1px solid ${T.border};border-radius:12px;padding:8px;box-shadow:0 -8px 32px rgba(0,0,0,.2);z-index:20;animation:fade-up .2s ease}
    .sug-item{display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:8px;cursor:pointer;transition:background .15s;font-size:13px;color:${T.text2}}
    .sug-item:hover{background:${T.surfaceHov};color:${T.text1}}

    /* Right panel — context */
    .context-panel{border-left:1px solid ${T.border};display:flex;flex-direction:column;background:${T.sidebar};overflow:hidden}
    .cp-header{padding:14px 16px;border-bottom:1px solid ${T.border};font-size:12px;font-weight:700;color:${T.text1};letter-spacing:.3px;flex-shrink:0}
    .cp-body{flex:1;overflow-y:auto;padding:12px}
    .cp-section{margin-bottom:16px}
    .cp-sec-title{font-size:10px;font-weight:700;color:${T.text3};text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;padding:0 4px}
    .cp-stat{display:flex;align-items:center;justify-content:space-between;padding:8px 10px;background:${T.surface};border:1px solid ${T.border};border-radius:9px;margin-bottom:6px}
    .cp-stat-label{font-size:11px;color:${T.text2};display:flex;align-items:center;gap:6px}
    .cp-stat-val{font-size:12px;font-weight:700;color:${T.text1};font-family:'JetBrains Mono',monospace}
    .cp-source{padding:10px 12px;background:${T.surface};border:1px solid ${T.border};border-radius:9px;margin-bottom:6px;cursor:pointer;transition:all .2s}
    .cp-source:hover{border-color:rgba(99,102,241,.3);background:${T.surfaceHov}}
    .cp-src-title{font-size:12px;font-weight:600;color:${T.text1};margin-bottom:3px}
    .cp-src-meta{font-size:10px;color:${T.text3};display:flex;align-items:center;gap:5px}
    .tag{font-size:10px;font-weight:600;padding:2px 7px;border-radius:20px;background:${T.tagBg};border:1px solid ${T.tagBorder};color:${T.tagColor}}

    @keyframes breathe{0%,100%{opacity:1}50%{opacity:.45}}
    @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
    @keyframes typing-dot{0%,60%,100%{transform:translateY(0);opacity:.4}30%{transform:translateY(-5px);opacity:1}}
    @keyframes msg-in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
    @keyframes fade-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    @keyframes fade-up{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
  `;

  const sessionsByDate = [
    { label:"TODAY",     items:SESSIONS.filter(s=>s.date==="Today") },
    { label:"YESTERDAY", items:SESSIONS.filter(s=>s.date==="Yesterday") },
    { label:"EARLIER",   items:SESSIONS.filter(s=>s.date==="Mon") },
  ];

  return (
    <>
      <style>{css}</style>
      <div className="app">

        {/* ── Nav Sidebar ── */}
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
              <div className="tbt">Ask Recalla</div>
              <div className="tbd">AI-powered memory retrieval</div>
            </div>
            <div className="sw">
              <Icon name="search" size={14} color={T.text3}/>
              <input placeholder="Search conversations…"/>
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

          {/* 3-column chat layout */}
          <div className="chat-layout">

            {/* ── LEFT: Chat sessions ── */}
            <div className="sessions-panel">
              <div className="sp-header">
                <div className="sp-title">CONVERSATIONS</div>
                <button className="new-chat-btn" onClick={clearChat}>
                  <Icon name="plus" size={11} color="currentColor"/>
                  New
                </button>
              </div>
              <div className="sp-list">
                {sessionsByDate.map(group => group.items.length > 0 && (
                  <div key={group.label}>
                    <div className="sp-section">{group.label}</div>
                    {group.items.map(s => (
                      <div
                        key={s.id}
                        className={`session-item${activeSession===s.id?" act":""}`}
                        onClick={()=>setActiveSession(s.id)}
                      >
                        <div className="si-date">{s.date}</div>
                        <div className="si-title">{s.title}</div>
                        <div className="si-preview">{s.preview}</div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* ── CENTRE: Chat ── */}
            <div className="chat-center">

              {messages.length === 0 ? (
                /* Empty / new chat state */
                <div className="empty-state">
                  <div className="es-brain">
                    <Icon name="brain" size={32} color="#fff"/>
                  </div>
                  <div className="es-title">Ask me anything</div>
                  <div className="es-sub">
                    I have memory of all your meetings, decisions, and conversations. Ask me in plain English.
                  </div>
                  <div className="es-chips">
                    {SUGGESTIONS.map(s => (
                      <button key={s} className="es-chip" onClick={()=>sendMessage(s)}>{s}</button>
                    ))}
                  </div>
                </div>
              ) : (
                /* Messages */
                <div className="messages-area">
                  {messages.map(msg =>
                    msg.role === "user"
                      ? <UserMessage key={msg.id} msg={msg} T={T}/>
                      : <AIMessage   key={msg.id} msg={msg} T={T} dark={dark} onCopy={copyToClipboard}/>
                  )}
                  {isTyping && <TypingIndicator T={T}/>}
                  <div ref={messagesEndRef}/>
                </div>
              )}

              {/* Input */}
              <div className="input-area">
                <div className="input-wrap">
                  {showSuggestions && input.length === 0 && (
                    <div className="suggestions-drop">
                      {SUGGESTIONS.map(s => (
                        <div key={s} className="sug-item" onClick={()=>{ sendMessage(s); setShowSuggestions(false); }}>
                          <Icon name="sparkle" size={12} color="#6366F1"/>
                          {s}
                        </div>
                      ))}
                    </div>
                  )}
                  <textarea
                    ref={inputRef}
                    className="chat-input"
                    placeholder="Ask about your meetings, decisions, tasks…"
                    value={input}
                    rows={1}
                    onChange={e => { setInput(e.target.value); setShowSuggestions(e.target.value.length===0); }}
                    onKeyDown={handleKey}
                    onFocus={()=>setShowSuggestions(input.length===0)}
                    onBlur={()=>setTimeout(()=>setShowSuggestions(false),200)}
                  />
                  <button
                    className="send-btn"
                    onClick={()=>sendMessage()}
                    disabled={!input.trim() || isTyping}
                  >
                    <Icon name="send" size={15} color="#fff"/>
                  </button>
                </div>
                <div className="input-meta">
                  <div className="input-hint">Press Enter to send · Shift+Enter for new line</div>
                  <div className="input-actions">
                    <button className="ia-btn" onClick={clearChat}>
                      <Icon name="trash" size={11} color="currentColor"/>
                      Clear chat
                    </button>
                    <button className="ia-btn">
                      <Icon name="pin" size={11} color="currentColor"/>
                      Pin conversation
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ── RIGHT: Context panel ── */}
            <div className="context-panel">
              <div className="cp-header">CONTEXT &amp; SOURCES</div>
              <div className="cp-body">

                {/* Memory stats */}
                <div className="cp-section">
                  <div className="cp-sec-title">Session Stats</div>
                  {[
                    { label:"Messages",       val:`${messages.length}`,  icon:"chat"     },
                    { label:"Memories used",  val:"12",                  icon:"brain"    },
                    { label:"Avg confidence", val:"90%",                 icon:"zap"      },
                    { label:"Sources cited",  val:"7",                   icon:"fileText" },
                  ].map((s,i) => (
                    <div key={i} className="cp-stat">
                      <div className="cp-stat-label">
                        <Icon name={s.icon} size={12} color={T.text3}/>
                        {s.label}
                      </div>
                      <div className="cp-stat-val">{s.val}</div>
                    </div>
                  ))}
                </div>

                {/* Top sources */}
                <div className="cp-section">
                  <div className="cp-sec-title">Top Sources</div>
                  {SOURCES.map((src,i) => (
                    <div key={i} className="cp-source">
                      <div className="cp-src-title">{src.title}</div>
                      <div className="cp-src-meta">
                        <Icon name="clock" size={10} color={T.text3}/>
                        {src.date}
                        <span style={{marginLeft:"auto",fontSize:10,fontWeight:700,color:"#22D3EE"}}>{src.match}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Suggested follow-ups */}
                <div className="cp-section">
                  <div className="cp-sec-title">Follow-up Questions</div>
                  {[
                    "What is the deployment deadline?",
                    "Who was assigned the API work?",
                    "Any blockers mentioned?",
                    "What about the demo on Friday?",
                  ].map((q,i) => (
                    <div
                      key={i}
                      onClick={()=>sendMessage(q)}
                      style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 10px", background:T.surface, border:`1px solid ${T.border}`, borderRadius:9, marginBottom:6, cursor:"pointer", transition:"all .2s", fontSize:12, color:T.text2, lineHeight:1.4 }}
                      onMouseEnter={e=>{ e.currentTarget.style.borderColor="rgba(99,102,241,.3)"; e.currentTarget.style.color=T.text1; e.currentTarget.style.background=T.surfaceHov; }}
                      onMouseLeave={e=>{ e.currentTarget.style.borderColor=T.border; e.currentTarget.style.color=T.text2; e.currentTarget.style.background=T.surface; }}
                    >
                      <Icon name="sparkle" size={11} color="#6366F1"/>
                      {q}
                    </div>
                  ))}
                </div>

                {/* Active tags */}
                <div className="cp-section">
                  <div className="cp-sec-title">Related Tags</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                    {["Sprint","Backend","ChromaDB","Whisper","Demo","API","Friday"].map(t=>(
                      <span key={t} className="tag">{t}</span>
                    ))}
                  </div>
                </div>

              </div>
            </div>

          </div>
        </main>
      </div>
    </>
  );
}