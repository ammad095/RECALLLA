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
    calendar:   <svg viewBox="0 0 24 24" {...s}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    check:      <svg viewBox="0 0 24 24" {...s}><polyline points="20 6 9 17 4 12"/></svg>,
    users:      <svg viewBox="0 0 24 24" {...s}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    fileText:   <svg viewBox="0 0 24 24" {...s}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
    zap:        <svg viewBox="0 0 24 24" {...s}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
    tag:        <svg viewBox="0 0 24 24" {...s}><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
    alertCircle:<svg viewBox="0 0 24 24" {...s}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
    arrowRight: <svg viewBox="0 0 24 24" {...s}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
    chevDown:   <svg viewBox="0 0 24 24" {...s}><polyline points="6 9 12 15 18 9"/></svg>,
    chevUp:     <svg viewBox="0 0 24 24" {...s}><polyline points="18 15 12 9 6 15"/></svg>,
    target:     <svg viewBox="0 0 24 24" {...s}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
    sparkle:    <svg viewBox="0 0 24 24" {...s}><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>,
    today:      <svg viewBox="0 0 24 24" {...s}><circle cx="12" cy="12" r="10"/><line x1="12" y1="2" x2="12" y2="12"/><line x1="12" y1="12" x2="16" y2="12"/></svg>,
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
  timelineLine:"rgba(255,255,255,0.12)",
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
  timelineLine:"rgba(0,0,0,0.12)",
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

// ── Event types configuration ────────────────────────────────────────────────
const EVENT_TYPES = {
  meeting:  { label:"Meeting",   icon:"mic",         color:"#6366F1", bg:"rgba(99,102,241,0.12)", border:"rgba(99,102,241,0.25)" },
  decision: { label:"Decision",  icon:"check",       color:"#22D3EE", bg:"rgba(34,211,238,0.12)", border:"rgba(34,211,238,0.25)" },
  task:     { label:"Task",      icon:"target",      color:"#A78BFA", bg:"rgba(167,139,250,0.12)",border:"rgba(167,139,250,0.25)" },
  reminder: { label:"Reminder",  icon:"bell",        color:"#F59E0B", bg:"rgba(245,158,11,0.12)", border:"rgba(245,158,11,0.25)" },
  deadline: { label:"Deadline",  icon:"alertCircle", color:"#F43F5E", bg:"rgba(244,63,94,0.12)",  border:"rgba(244,63,94,0.25)" },
  memory:   { label:"Memory",    icon:"brain",       color:"#10B981", bg:"rgba(16,185,129,0.12)", border:"rgba(16,185,129,0.25)" },
};

// ── Timeline data (mock) ─────────────────────────────────────────────────────
const TIMELINE = [
  // Today
  { id:1,  type:"meeting",  title:"Product Sprint Planning",        time:"10:00 AM",  dateGroup:"Today",     duration:"2h 14m", description:"Discussed Q3 roadmap and prioritised feature backlog. Action items assigned to frontend team.", tags:["Sprint","Product"], participants:["AA","MM","DA"], meetingId:1 },
  { id:2,  type:"decision", title:"Use ChromaDB for vector storage", time:"10:42 AM", dateGroup:"Today",     description:"Team agreed to use ChromaDB as the primary semantic memory database.", tags:["Backend"], source:"Product Sprint Planning" },
  { id:3,  type:"task",     title:"Update Whisper model config",     time:"11:15 AM", dateGroup:"Today",     description:"Muhammad Muzammal assigned to upgrade transcription to Whisper v3.", tags:["Engineering"], source:"Product Sprint Planning", owner:"MM" },
  { id:4,  type:"reminder", title:"Send revised pitch deck",         time:"4:00 PM",  dateGroup:"Today",     description:"Send the updated investor pitch deck to Ahmed.", urgent:true, tags:["Investor"] },
  { id:5,  type:"meeting",  title:"Investor Pitch Review",           time:"2:30 PM",  dateGroup:"Today",     duration:"45m",    description:"Reviewed slide deck, refined messaging on TAM slide.", tags:["Investor","Finance"], participants:["AA","MM"], meetingId:2 },

  // Yesterday
  { id:6,  type:"meeting",  title:"Backend Architecture Sync",       time:"4:00 PM",  dateGroup:"Yesterday", duration:"32m",    description:"Agreed on microservices split. ChromaDB integration timeline confirmed.", tags:["Engineering","Backend"], participants:["AA","MM","DA"], meetingId:4 },
  { id:7,  type:"decision", title:"Split auth into microservice",    time:"4:15 PM",  dateGroup:"Yesterday", description:"Authentication service to be separated from main backend before ChromaDB integration.", tags:["Backend"], source:"Backend Architecture Sync" },
  { id:8,  type:"task",     title:"Deploy Whisper v3 to staging",    time:"4:25 PM",  dateGroup:"Yesterday", description:"Muhammad Muzammal to complete deployment by tomorrow morning.", tags:["Deployment"], source:"Backend Architecture Sync", owner:"MM" },
  { id:9,  type:"deadline", title:"FYP Part 1 Submission",           time:"5:00 PM",  dateGroup:"Yesterday", description:"Reminder: FYP Part 1 report due by June 30th.", tags:["FYP"] },
  { id:10, type:"meeting",  title:"UX Research Debrief",             time:"11:00 AM", dateGroup:"Yesterday", duration:"1h 08m", description:"Key insight: users struggle with onboarding step 3.", tags:["Research","UX"], participants:["AA","MM","DA"], meetingId:3 },
  { id:11, type:"memory",   title:"Sprint review insight",           time:"3:00 PM",  dateGroup:"Yesterday", description:"Onboarding step 3 has 40% drop-off — simplified flow proposed with inline hints.", tags:["UX","Insight"] },

  // Earlier this week
  { id:12, type:"meeting",  title:"Supervisor FYP Feedback",          time:"Mon 9:00 AM",  dateGroup:"This Week", duration:"55m",    description:"Dr. Adnan reviewed chapters 1-3. Suggested expanding gap analysis section.", tags:["FYP","Supervisor"], participants:["AA","DA"], meetingId:5 },
  { id:13, type:"task",     title:"Expand gap analysis section",     time:"Mon 10:00 AM", dateGroup:"This Week", description:"Address supervisor feedback on chapter 1 gap analysis.", tags:["FYP","Writing"], source:"Supervisor FYP Feedback", owner:"AA" },
  { id:14, type:"meeting",  title:"Frontend Design Review",          time:"Mon 3:00 PM",  dateGroup:"This Week", duration:"40m",    description:"Dark mode palette approved. Waveform animation needs refinement.", tags:["Frontend","Design"], participants:["AA","MM"], meetingId:6 },
  { id:15, type:"decision", title:"Approve dark mode palette",       time:"Mon 3:25 PM",  dateGroup:"This Week", description:"Indigo + cyan gradient palette finalized for production.", tags:["Design"], source:"Frontend Design Review" },
  { id:16, type:"meeting",  title:"Database Schema Planning",        time:"Sun 2:00 PM",  dateGroup:"This Week", duration:"1h 20m", description:"Finalized ERD with 10 entities.", tags:["Database","Backend"], participants:["AA","MM"], meetingId:7 },
];

// ── Date group order ─────────────────────────────────────────────────────────
const DATE_GROUPS = ["Today", "Yesterday", "This Week", "Last Week"];

const FILTER_TABS = ["All", "Meetings", "Decisions", "Tasks", "Reminders", "Memories"];

// ── Event card ───────────────────────────────────────────────────────────────
const EventCard = ({ event, T, dark, isLast, onClick }) => {
  const cfg = EVENT_TYPES[event.type] || EVENT_TYPES.meeting;
  const [hovered, setHovered] = useState(false);

  return (
    <div style={{ position:"relative", paddingLeft:48, paddingBottom:isLast?0:18 }}>
      {/* Vertical line connector */}
      {!isLast && (
        <div style={{ position:"absolute", left:18, top:40, bottom:-6, width:2, background:T.timelineLine, borderRadius:1 }}/>
      )}

      {/* Timeline dot */}
      <div style={{
        position:"absolute", left:8, top:10,
        width:22, height:22, borderRadius:"50%",
        background:cfg.bg, border:`2px solid ${cfg.color}`,
        display:"flex", alignItems:"center", justifyContent:"center",
        boxShadow:`0 0 12px ${cfg.color}40`,
        zIndex:1,
      }}>
        <Icon name={cfg.icon} size={11} color={cfg.color}/>
      </div>

      {/* Event card */}
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => onClick && onClick(event)}
        style={{
          background: hovered ? T.surfaceHov : T.surface,
          border: `1px solid ${hovered ? cfg.border : T.border}`,
          borderRadius: 12,
          padding: "14px 16px",
          cursor: event.meetingId ? "pointer" : "default",
          transition: "all .2s",
          boxShadow: T.cardBox,
          animation:"fade-in .3s ease",
          position:"relative",
          overflow:"hidden",
        }}
      >
        {/* Subtle left accent */}
        <div style={{ position:"absolute", left:0, top:0, bottom:0, width:3, background:`linear-gradient(180deg, ${cfg.color}, transparent)`, opacity:0.6 }}/>

        {/* Header row */}
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12, marginBottom:6 }}>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
              <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:20, background:cfg.bg, border:`1px solid ${cfg.border}`, color:cfg.color, textTransform:"uppercase", letterSpacing:".5px" }}>
                {cfg.label}
              </span>
              {event.urgent && (
                <span style={{ fontSize:9, fontWeight:700, padding:"2px 7px", borderRadius:20, background:"rgba(244,63,94,0.12)", border:"1px solid rgba(244,63,94,0.3)", color:"#F43F5E", letterSpacing:".3px" }}>
                  URGENT
                </span>
              )}
            </div>
            <div style={{ fontSize:14, fontWeight:700, color:T.text1, letterSpacing:"-.2px", lineHeight:1.35 }}>
              {event.title}
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, color:T.text3, fontFamily:"'JetBrains Mono',monospace", whiteSpace:"nowrap", flexShrink:0, marginTop:2 }}>
            <Icon name="clock" size={10} color={T.text3}/>
            {event.time}
          </div>
        </div>

        {/* Description */}
        {event.description && (
          <div style={{ fontSize:12, color:T.text2, lineHeight:1.55, marginBottom:10, marginLeft:0 }}>
            {event.description}
          </div>
        )}

        {/* Footer row */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:10, flexWrap:"wrap" }}>
          <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
            {event.tags?.map(t => (
              <span key={t} style={{ fontSize:10, fontWeight:600, padding:"2px 7px", borderRadius:20, background:T.tagBg, border:`1px solid ${T.tagBorder}`, color:T.tagColor }}>
                {t}
              </span>
            ))}
            {event.duration && (
              <span style={{ display:"flex", alignItems:"center", gap:3, fontSize:11, color:T.text3 }}>
                <Icon name="clock" size={10} color={T.text3}/>
                {event.duration}
              </span>
            )}
            {event.source && (
              <span style={{ display:"flex", alignItems:"center", gap:3, fontSize:11, color:T.text3 }}>
                <Icon name="fileText" size={10} color={T.text3}/>
                {event.source}
              </span>
            )}
          </div>

          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            {/* Participants */}
            {event.participants && (
              <div style={{ display:"flex" }}>
                {event.participants.map((p,i) => {
                  const cols = { AA:"#6366F1", MM:"#22D3EE", DA:"#F59E0B" };
                  return (
                    <div key={p} style={{ width:22, height:22, borderRadius:"50%", background:cols[p]||"#6366F1", display:"flex", alignItems:"center", justifyContent:"center", fontSize:8, fontWeight:700, color:"#fff", marginLeft:i>0?-6:0, border:`2px solid ${T.surface}` }}>
                      {p}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Owner */}
            {event.owner && (
              <div style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, color:T.text3 }}>
                <Icon name="users" size={10} color={T.text3}/>
                Owner: <strong style={{ color:T.text2 }}>{event.owner}</strong>
              </div>
            )}

            {/* Arrow */}
            {event.meetingId && (
              <div style={{ opacity:hovered?1:0, transition:"opacity .2s", color:cfg.color }}>
                <Icon name="arrowRight" size={13} color="currentColor"/>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main Component ───────────────────────────────────────────────────────────
export default function Timeline({ navigate: navProp, dark: darkProp, setDark: setDarkProp, sidebarOpen: sidebarProp, setSidebarOpen: setSidebarProp } = {}) {
  const [darkLocal, setDarkLocal]           = useState(true);
  const [sidebarLocal, setSidebarLocal]     = useState(true);
  const dark          = darkProp          !== undefined ? darkProp        : darkLocal;
  const setDark       = setDarkProp       !== undefined ? setDarkProp     : setDarkLocal;
  const sidebarOpen   = sidebarProp       !== undefined ? sidebarProp     : sidebarLocal;
  const setSidebarOpen= setSidebarProp    !== undefined ? setSidebarProp  : setSidebarLocal;

  const [activeFilter, setActiveFilter] = useState("All");
  const [search, setSearch]             = useState("");
  const [expandedGroups, setExpandedGroups] = useState({ Today: true, Yesterday: true, "This Week": true, "Last Week": true });

  const T = dark ? DARK : LIGHT;

  const handleNav = (route) => { if (navProp) navProp(route); };

  // Filter events
  const filterMap = {
    "All":"all", "Meetings":"meeting", "Decisions":"decision",
    "Tasks":"task", "Reminders":"reminder", "Memories":"memory",
  };
  const filterKey = filterMap[activeFilter];

  const filteredEvents = TIMELINE.filter(e => {
    const matchType   = filterKey==="all" || e.type===filterKey;
    const matchSearch = !search || e.title.toLowerCase().includes(search.toLowerCase()) ||
                        e.description?.toLowerCase().includes(search.toLowerCase()) ||
                        e.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()));
    return matchType && matchSearch;
  });

  // Group by date
  const grouped = DATE_GROUPS.reduce((acc, group) => {
    const items = filteredEvents.filter(e => e.dateGroup === group);
    if (items.length > 0) acc[group] = items;
    return acc;
  }, {});

  const stats = {
    total:     TIMELINE.length,
    meetings:  TIMELINE.filter(e=>e.type==="meeting").length,
    decisions: TIMELINE.filter(e=>e.type==="decision").length,
    tasks:     TIMELINE.filter(e=>e.type==="task").length,
  };

  const handleEventClick = (event) => {
    if (event.meetingId) {
      // Navigate to meeting detail
      handleNav("detail");
    }
  };

  const toggleGroup = (group) => {
    setExpandedGroups(g => ({ ...g, [group]: !g[group] }));
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
    .group-header{display:flex;align-items:center;gap:10px;padding:8px 4px;cursor:pointer;transition:all .2s;border-radius:8px;user-select:none}
    .group-header:hover{background:${T.surfaceHov}}
    .group-line{flex:1;height:1px;background:linear-gradient(90deg, ${T.border}, transparent)}
    .empty{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 20px;gap:14px;text-align:center}
    @keyframes breathe{0%,100%{opacity:1}50%{opacity:.45}}
    @keyframes fade-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    @keyframes slide-in{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:translateX(0)}}
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
            <div key={item.label} className={`ni${item.route==="timeline"?" act":""}`} onClick={() => handleNav(item.route)}>
              <Icon name={item.icon} size={16} color={item.route==="timeline"?"#6366F1":T.text2}/>
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
              <div style={{ fontSize:15, fontWeight:700, letterSpacing:"-.3px", color:T.text1 }}>Timeline</div>
              <div style={{ fontSize:11, color:T.text3, marginTop:1 }}>A chronological view of everything</div>
            </div>
            <div className="sw">
              <Icon name="search" size={14} color={T.text3}/>
              <input placeholder="Search timeline events…" value={search} onChange={e=>setSearch(e.target.value)}/>
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
                <Icon name="clock" size={20} color="#fff"/>
              </div>
              <div>
                <div style={{ fontSize:22, fontWeight:800, color:T.text1, letterSpacing:"-.6px" }}>Your Timeline</div>
                <div style={{ fontSize:13, color:T.text2, marginTop:2 }}>Browse meetings, decisions, tasks, and reminders across time</div>
              </div>
            </div>

            {/* Stats strip */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, animation:"fade-in .35s ease" }}>
              {[
                { icon:"clock",  color:"#6366F1", bg:"rgba(99,102,241,.12)", val:stats.total,     label:"Total Events" },
                { icon:"mic",    color:"#22D3EE", bg:"rgba(34,211,238,.10)", val:stats.meetings,  label:"Meetings"     },
                { icon:"check",  color:"#A78BFA", bg:"rgba(167,139,250,.12)",val:stats.decisions, label:"Decisions"    },
                { icon:"target", color:"#F59E0B", bg:"rgba(245,158,11,.10)", val:stats.tasks,     label:"Tasks"        },
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

            {/* Filter tabs */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10, animation:"fade-in .4s ease" }}>
              <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                {FILTER_TABS.map(tab => (
                  <button key={tab} className={`tab${activeFilter===tab?" act":""}`} onClick={() => setActiveFilter(tab)}>
                    {tab}
                    <span style={{ marginLeft:5, fontSize:10, padding:"1px 5px", borderRadius:20, background:dark?"rgba(255,255,255,.07)":"rgba(0,0,0,.06)", color:T.text3 }}>
                      {tab==="All" ? TIMELINE.length : TIMELINE.filter(e=>e.type===filterMap[tab]).length}
                    </span>
                  </button>
                ))}
              </div>
              <div style={{ fontSize:11, color:T.text3, display:"flex", alignItems:"center", gap:5 }}>
                <Icon name="sparkle" size={11} color="#6366F1"/>
                Showing {filteredEvents.length} of {TIMELINE.length} events
              </div>
            </div>

            {/* Timeline groups */}
            <div style={{ display:"flex", flexDirection:"column", gap:8, animation:"fade-in .45s ease" }}>
              {Object.entries(grouped).map(([group, items]) => {
                const isOpen = expandedGroups[group] !== false;
                return (
                  <div key={group}>
                    {/* Group header */}
                    <div className="group-header" onClick={() => toggleGroup(group)}>
                      <div style={{ width:28, height:28, borderRadius:8, background:T.indigoGlow, border:`1px solid ${T.borderStr}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                        <Icon name={group==="Today" ? "today" : "calendar"} size={13} color="#6366F1"/>
                      </div>
                      <div style={{ fontSize:13, fontWeight:700, color:T.text1, letterSpacing:"-.2px" }}>{group}</div>
                      <span style={{ fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:20, background:T.tagBg, border:`1px solid ${T.tagBorder}`, color:T.tagColor }}>
                        {items.length} {items.length===1?"event":"events"}
                      </span>
                      <div className="group-line"/>
                      <Icon name={isOpen?"chevUp":"chevDown"} size={14} color={T.text3}/>
                    </div>

                    {/* Group items */}
                    {isOpen && (
                      <div style={{ marginTop:12, marginBottom:18, animation:"slide-in .3s ease" }}>
                        {items.map((event, i) => (
                          <EventCard
                            key={event.id}
                            event={event}
                            T={T}
                            dark={dark}
                            isLast={i === items.length - 1}
                            onClick={handleEventClick}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Empty state */}
              {filteredEvents.length === 0 && (
                <div className="empty">
                  <div style={{ width:60, height:60, borderRadius:"50%", background:"linear-gradient(135deg,#6366F1,#22D3EE)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 0 24px rgba(99,102,241,.35)" }}>
                    <Icon name="clock" size={26} color="#fff"/>
                  </div>
                  <div style={{ fontSize:16, fontWeight:700, color:T.text1 }}>No events found</div>
                  <div style={{ fontSize:13, color:T.text3, maxWidth:280, lineHeight:1.6 }}>
                    {search ? "Try a different search term or filter" : "Start by recording your first meeting"}
                  </div>
                  <button onClick={() => handleNav("record")} style={{ marginTop:4, padding:"9px 18px", background:"linear-gradient(135deg,#6366F1,#818CF8)", border:"none", borderRadius:9, color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'Inter',sans-serif", boxShadow:"0 4px 14px rgba(99,102,241,.35)", display:"flex", alignItems:"center", gap:7 }}>
                    <Icon name="mic" size={14} color="#fff"/>
                    Record a Meeting
                  </button>
                </div>
              )}
            </div>

            <div style={{ height:12 }}/>
          </div>
        </main>
      </div>
    </>
  );
}