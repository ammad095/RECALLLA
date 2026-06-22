import { useState } from "react";

const Icon = ({ name, size = 20, color = "currentColor" }) => {
  const s = { width: size, height: size, stroke: color, fill: "none", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };
  const icons = {
    mic:       <svg viewBox="0 0 24 24" {...s}><rect x="9" y="2" width="6" height="13" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="8" y1="22" x2="16" y2="22"/></svg>,
    brain:     <svg viewBox="0 0 24 24" {...s}><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/></svg>,
    clock:     <svg viewBox="0 0 24 24" {...s}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    search:    <svg viewBox="0 0 24 24" {...s}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    bell:      <svg viewBox="0 0 24 24" {...s}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
    chat:      <svg viewBox="0 0 24 24" {...s}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
    layers:    <svg viewBox="0 0 24 24" {...s}><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
    settings:  <svg viewBox="0 0 24 24" {...s}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
    menu:      <svg viewBox="0 0 24 24" {...s}><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
    sun:       <svg viewBox="0 0 24 24" {...s}><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
    moon:      <svg viewBox="0 0 24 24" {...s}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
    plus:      <svg viewBox="0 0 24 24" {...s}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    calendar:  <svg viewBox="0 0 24 24" {...s}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    arrowRight:<svg viewBox="0 0 24 24" {...s}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
    filter:    <svg viewBox="0 0 24 24" {...s}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
    grid:      <svg viewBox="0 0 24 24" {...s}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
    list:      <svg viewBox="0 0 24 24" {...s}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
    users:     <svg viewBox="0 0 24 24" {...s}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    tag:       <svg viewBox="0 0 24 24" {...s}><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
    fileText:  <svg viewBox="0 0 24 24" {...s}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
    zap:       <svg viewBox="0 0 24 24" {...s}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
    trendUp:   <svg viewBox="0 0 24 24" {...s}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  };
  return icons[name] || null;
};

const DARK = {
  bg:"#080B12", sidebar:"rgba(8,11,18,0.97)", topbar:"rgba(8,11,18,0.85)",
  surface:"rgba(255,255,255,0.05)", surfaceHov:"rgba(255,255,255,0.09)",
  border:"rgba(255,255,255,0.09)", borderStr:"rgba(99,102,241,0.45)",
  indigoGlow:"rgba(99,102,241,0.15)",
  text1:"#F9FAFB", text2:"#C4C9D4", text3:"#6B7280",
  cardBox:"0 10px 28px rgba(0,0,0,0.35)", scrollbar:"rgba(255,255,255,0.1)",
  tagBg:"rgba(99,102,241,0.14)", tagBorder:"rgba(99,102,241,0.28)", tagColor:"#A5B4FC",
  inputBg:"rgba(0,0,0,0.3)",
};
const LIGHT = {
  bg:"#F4F6FB", sidebar:"#FFFFFF", topbar:"rgba(255,255,255,0.92)",
  surface:"#FFFFFF", surfaceHov:"#F0F3FA",
  border:"rgba(0,0,0,0.08)", borderStr:"rgba(99,102,241,0.5)",
  indigoGlow:"rgba(99,102,241,0.10)",
  text1:"#111827", text2:"#374151", text3:"#9CA3AF",
  cardBox:"0 2px 12px rgba(0,0,0,0.07)", scrollbar:"rgba(0,0,0,0.12)",
  tagBg:"rgba(99,102,241,0.10)", tagBorder:"rgba(99,102,241,0.22)", tagColor:"#4F46E5",
  inputBg:"rgba(0,0,0,0.04)",
};

const NAV = [
  { icon:"layers",   label:"Dashboard"   },
  { icon:"mic",      label:"Meetings"    },
  { icon:"brain",    label:"Memory"      },
  { icon:"chat",     label:"Ask Recalla" },
  { icon:"bell",     label:"Reminders"   },
  { icon:"clock",    label:"Timeline"    },
  { icon:"settings", label:"Settings"    },
];

const MEETINGS = [
  { id:1, title:"Product Sprint Planning",      date:"Today, 10:00 AM",       duration:"2h 14m", type:"Team Meeting",  status:"processed",  tags:["Sprint","Product"],      participants:["AA","MM","DA"], summary:"Discussed Q3 roadmap and prioritised feature backlog. Action items assigned to frontend team." },
  { id:2, title:"Investor Pitch Review",         date:"Today, 2:30 PM",        duration:"45m",    type:"One-on-One",   status:"processing", tags:["Investor","Finance"],    participants:["AA","MM"],      summary:"Reviewed slide deck, refined messaging on TAM slide. Follow-up scheduled for Thursday." },
  { id:3, title:"UX Research Debrief",           date:"Yesterday, 11:00 AM",   duration:"1h 08m", type:"Team Meeting",  status:"processed",  tags:["Research","UX"],         participants:["AA","MM","DA"], summary:"Key insight: users struggle with onboarding step 3. Proposed simplified flow with inline hints." },
  { id:4, title:"Backend Architecture Sync",     date:"Yesterday, 4:00 PM",    duration:"32m",    type:"Team Meeting",  status:"processed",  tags:["Engineering","Backend"], participants:["AA","MM","DA"], summary:"Agreed on microservices split. ChromaDB integration timeline confirmed for next sprint." },
  { id:5, title:"Supervisor FYP Feedback",       date:"Mon, 9:00 AM",          duration:"55m",    type:"One-on-One",   status:"processed",  tags:["FYP","Supervisor"],      participants:["AA","DA"],      summary:"Dr. Adnan reviewed chapters 1–3. Suggested expanding the gap analysis section." },
  { id:6, title:"Frontend Design Review",        date:"Mon, 3:00 PM",          duration:"40m",    type:"Team Meeting",  status:"processed",  tags:["Frontend","Design"],     participants:["AA","MM"],      summary:"Reviewed Figma mockups. Dark mode palette approved. Waveform animation needs refinement." },
  { id:7, title:"Database Schema Planning",      date:"Sun, 2:00 PM",          duration:"1h 20m", type:"Brainstorm",   status:"processed",  tags:["Database","Backend"],    participants:["AA","MM"],      summary:"Finalised ERD with 10 entities. ChromaDB and PostgreSQL split confirmed." },
  { id:8, title:"Project Kickoff Meeting",       date:"15 Jun, 10:00 AM",      duration:"1h 45m", type:"Team Meeting",  status:"processed",  tags:["Kickoff","FYP"],         participants:["AA","MM","DA"], summary:"Initial project scope defined. Team roles assigned. Weekly sync scheduled every Monday." },
];

const PCOLORS = { AA:"#6366F1", MM:"#22D3EE", DA:"#F59E0B" };
const TABS = ["All", "Processed", "Processing", "Drafts"];

export default function MeetingsList({ navigate, dark, setDark, sidebarOpen, setSidebarOpen }) {
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch]       = useState("");
  const [viewMode, setViewMode]   = useState("grid"); // grid | list
  const T = dark ? DARK : LIGHT;

  const filtered = MEETINGS.filter(m => {
    const matchTab = activeTab === "All" || m.status === activeTab.toLowerCase();
    const matchSearch = m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    return matchTab && matchSearch;
  });

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
    .sw{display:flex;align-items:center;gap:8px;background:${T.surface};border:1px solid ${T.border};border-radius:9px;padding:7px 12px;width:260px;transition:all .2s}
    .sw:focus-within{border-color:${T.borderStr};box-shadow:0 0 0 3px ${T.indigoGlow}}
    .sw input{background:none;border:none;outline:none;color:${T.text1};font-family:'Inter',sans-serif;font-size:13px;width:100%}
    .sw input::placeholder{color:${T.text3}}
    .ibtn{width:34px;height:34px;display:flex;align-items:center;justify-content:center;background:${T.surface};border:1px solid ${T.border};border-radius:8px;cursor:pointer;color:${T.text2};transition:all .2s;position:relative}
    .ibtn:hover{background:${T.surfaceHov};color:${T.text1};border-color:${T.borderStr}}
    .ndot{position:absolute;top:7px;right:7px;width:6px;height:6px;background:#F43F5E;border-radius:50%;border:1.5px solid ${T.bg};animation:breathe 2s ease-in-out infinite}
    .av-ring{width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,#6366F1,#22D3EE);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff;cursor:pointer;transition:box-shadow .2s}
    .av-ring:hover{box-shadow:0 0 0 2px #6366F1}
    .thbtn{display:flex;align-items:center;gap:6px;padding:6px 12px;border-radius:20px;background:${T.indigoGlow};border:1px solid ${T.borderStr};color:${dark?"#A5B4FC":"#4F46E5"};font-size:12px;font-weight:600;cursor:pointer;transition:all .2s;font-family:'Inter',sans-serif;white-space:nowrap}
    .thbtn:hover{background:${dark?"rgba(99,102,241,.25)":"rgba(99,102,241,.18)"}}
    .ni{display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:9px;cursor:pointer;transition:all .2s;color:${T.text2};font-size:13px;font-weight:500;border:1px solid transparent;position:relative;overflow:hidden}
    .ni:hover{background:${T.surfaceHov};color:${T.text1}}
    .ni.act{background:${T.indigoGlow};border-color:${T.borderStr};color:${T.text1}}
    .ni.act::before{content:'';position:absolute;left:0;top:20%;bottom:20%;width:2px;background:#6366F1;border-radius:0 2px 2px 0;box-shadow:0 0 8px #6366F1}
    .nlbl{opacity:${sidebarOpen?1:0};transition:opacity .2s;white-space:nowrap;overflow:hidden}
    .sbt{position:absolute;top:20px;right:-11px;width:22px;height:22px;background:${T.sidebar};border:1px solid ${T.border};border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;color:${T.text3};z-index:20;transition:all .2s}
    .sbt:hover{border-color:#6366F1;color:#6366F1}
    .meeting-card{background:${T.surface};border:1px solid ${T.border};border-radius:14px;padding:18px;cursor:pointer;transition:all .25s;box-shadow:${T.cardBox};position:relative;overflow:hidden}
    .meeting-card::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,#6366F1,transparent);opacity:0;transition:opacity .3s}
    .meeting-card:hover{background:${T.surfaceHov};border-color:rgba(99,102,241,.3);transform:translateY(-2px);box-shadow:${dark?"0 14px 36px rgba(0,0,0,.4)":"0 8px 24px rgba(99,102,241,.12)"}}
    .meeting-card:hover::before{opacity:1}
    .meeting-card:hover .card-arrow{opacity:1;transform:translateX(0)}
    .card-arrow{position:absolute;top:18px;right:18px;opacity:0;transform:translateX(4px);transition:all .2s;color:#6366F1}
    .meeting-list-row{background:${T.surface};border:1px solid ${T.border};border-radius:12px;padding:14px 18px;cursor:pointer;transition:all .2s;box-shadow:${T.cardBox};display:flex;align-items:center;gap:16px}
    .meeting-list-row:hover{background:${T.surfaceHov};border-color:rgba(99,102,241,.3);transform:translateX(2px)}
    .meeting-list-row:hover .card-arrow{opacity:1;transform:translateX(0)}
    .tab{padding:7px 16px;border-radius:7px;font-size:12px;font-weight:600;cursor:pointer;transition:all .2s;color:${T.text3};border:1px solid transparent;font-family:'Inter',sans-serif}
    .tab:hover{color:${T.text2};background:${T.surfaceHov}}
    .tab.act{background:${T.indigoGlow};border-color:${T.borderStr};color:${dark?"#A5B4FC":"#4F46E5"}}
    .view-btn{width:32px;height:32px;display:flex;align-items:center;justify-content:center;border-radius:7px;cursor:pointer;transition:all .2s;border:1px solid ${T.border};background:${T.surface};color:${T.text3}}
    .view-btn.act{background:${T.indigoGlow};border-color:${T.borderStr};color:${dark?"#A5B4FC":"#4F46E5"}}
    .view-btn:hover{border-color:${T.borderStr};color:${T.text1}}
    .tg{font-size:10px;font-weight:600;padding:2px 8px;border-radius:20px;background:${T.tagBg};border:1px solid ${T.tagBorder};color:${T.tagColor}}
    .stat-card{background:${T.surface};border:1px solid ${T.border};border-radius:12px;padding:16px;box-shadow:${T.cardBox};transition:all .22s}
    .stat-card:hover{background:${T.surfaceHov};border-color:rgba(99,102,241,.25);transform:translateY(-1px)}
    .new-btn{display:flex;align-items:center;gap:7px;padding:9px 18px;background:linear-gradient(135deg,#6366F1,#818CF8);border:none;border-radius:9px;color:#fff;font-size:13px;font-weight:700;cursor:pointer;transition:all .2s;font-family:'Inter',sans-serif;box-shadow:0 4px 14px rgba(99,102,241,.35)}
    .new-btn:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(99,102,241,.45)}
    @keyframes breathe{0%,100%{opacity:1}50%{opacity:.45}}
    @keyframes fade-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    .fi{animation:fade-in .35s ease forwards}
  `;

  return (
    <>
      <style>{css}
        {`
          html,body,#root{height:100%;width:100%;overflow:hidden;margin:0;padding:0;box-sizing:border-box;}
          body{font-family:'Inter',sans-serif;background:${T.bg};color:${T.text1};transition:background .3s,color .3s;}
          *{box-sizing:border-box;}
          ::-webkit-scrollbar{width:4px;}
          ::-webkit-scrollbar-thumb{background:${T.scrollbar};border-radius:2px;}
        `}
      </style>
      <div style={{ display:"flex", height:"100vh", width:"100vw", overflow:"hidden", background:T.bg, fontFamily:"'Inter',sans-serif" }}>

      {/* Sidebar */}
      <aside style={{ width:sidebarOpen?"236px":"68px", flexShrink:0, background:T.sidebar, borderRight:`1px solid ${T.border}`, display:"flex", flexDirection:"column", padding:"18px 10px", gap:3, transition:"width .3s cubic-bezier(.4,0,.2,1),background .3s", position:"relative", zIndex:10, overflow:"hidden" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"6px 10px 18px", borderBottom:`1px solid ${T.border}`, marginBottom:6, whiteSpace:"nowrap" }}>
          <div style={{ width:30, height:30, background:"linear-gradient(135deg,#6366F1,#22D3EE)", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, boxShadow:"0 0 14px rgba(99,102,241,.35)" }}>
            <Icon name="brain" size={16} color="#fff"/>
          </div>
          {sidebarOpen && <div style={{ fontSize:16, fontWeight:800, letterSpacing:"-.5px", color:T.text1 }}>Re<span style={{color:"#6366F1"}}>calla</span></div>}
        </div>
        {NAV.map(item => (
          <div key={item.label}
            className={`ni${item.label==="Meetings"?" act":""}`}
            onClick={() => navigate(item.label==="Dashboard"?"dashboard":item.label==="Meetings"?"meetings":item.label==="Ask Recalla"?"ask":item.label==="Memory"?"memory":item.label.toLowerCase())}
          >
            <Icon name={item.icon} size={16} color={item.label==="Meetings"?"#6366F1":T.text2}/>
            <span className="nlbl">{item.label}</span>
          </div>
        ))}
        <div style={{ marginTop:"auto", paddingTop:10, borderTop:`1px solid ${T.border}` }}>
          <div className="ni">
            <div style={{ width:26, height:26, borderRadius:"50%", background:"linear-gradient(135deg,#6366F1,#22D3EE)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:700, color:"#fff", flexShrink:0 }}>AA</div>
            {sidebarOpen && <div style={{ overflow:"hidden" }}>
              <div style={{ fontSize:12, fontWeight:600, color:T.text1, whiteSpace:"nowrap" }}>Ammad Ahmad</div>
              <div style={{ fontSize:10, color:T.text3, whiteSpace:"nowrap" }}>BSCS · 50908</div>
            </div>}
          </div>
        </div>
        <div className="sbt" onClick={() => setSidebarOpen(p => !p)}>
          <Icon name="menu" size={11} color={T.text3}/>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", minWidth:0 }}>

        {/* Topbar */}
        <div style={{ height:60, borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 24px", background:T.topbar, backdropFilter:"blur(20px)", flexShrink:0, transition:"background .3s" }}>
          <div>
            <div style={{ fontSize:15, fontWeight:700, letterSpacing:"-.3px", color:T.text1 }}>Meetings</div>
            <div style={{ fontSize:11, color:T.text3, marginTop:1 }}>Monday, 16 June 2026</div>
          </div>
          <div className="sw">
            <Icon name="search" size={14} color={T.text3}/>
            <input placeholder="Search meetings, tags…" value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <button className="thbtn" onClick={() => setDark(d => !d)}>
              <Icon name={dark?"sun":"moon"} size={13} color={dark?"#A5B4FC":"#4F46E5"}/>
              {dark?"Light mode":"Dark mode"}
            </button>
            <div className="ibtn"><Icon name="bell" size={15} color={T.text2}/><div className="ndot"/></div>
            <div className="av-ring">AA</div>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex:1, overflowY:"auto", padding:"24px 28px", display:"flex", flexDirection:"column", gap:20, scrollbarWidth:"thin", scrollbarColor:`${T.scrollbar} transparent` }}>

          {/* Stats row */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, animation:"fade-in .3s ease" }}>
            {[
              { icon:"mic",      color:"#6366F1", bg:"rgba(99,102,241,.12)", val:"47",    label:"Total Meetings" },
              { icon:"clock",    color:"#22D3EE", bg:"rgba(34,211,238,.10)", val:"312h",  label:"Hours Recorded" },
              { icon:"zap",      color:"#A78BFA", bg:"rgba(167,139,250,.12)",val:"2,847", label:"Memories Stored" },
              { icon:"trendUp",  color:"#10B981", bg:"rgba(16,185,129,.10)", val:"96%",   label:"Avg Confidence" },
            ].map((s,i) => (
              <div key={i} className="stat-card">
                <div style={{ width:32, height:32, borderRadius:7, background:s.bg, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:10 }}>
                  <Icon name={s.icon} size={15} color={s.color}/>
                </div>
                <div style={{ fontSize:22, fontWeight:800, letterSpacing:"-.5px", color:s.color }}>{s.val}</div>
                <div style={{ fontSize:11, color:T.text2, marginTop:2, fontWeight:500 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Toolbar */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", animation:"fade-in .35s ease" }}>
            <div style={{ display:"flex", gap:4 }}>
              {TABS.map(tab => (
                <button key={tab} className={`tab${activeTab===tab?" act":""}`} onClick={()=>setActiveTab(tab)}>
                  {tab}
                  <span style={{ marginLeft:5, fontSize:10, padding:"1px 5px", borderRadius:20, background:dark?"rgba(255,255,255,.07)":"rgba(0,0,0,.06)", color:T.text3 }}>
                    {tab==="All"?MEETINGS.length:MEETINGS.filter(m=>m.status===tab.toLowerCase()).length}
                  </span>
                </button>
              ))}
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ display:"flex", gap:4 }}>
                <div className={`view-btn${viewMode==="grid"?" act":""}`} onClick={()=>setViewMode("grid")}>
                  <Icon name="grid" size={14} color="currentColor"/>
                </div>
                <div className={`view-btn${viewMode==="list"?" act":""}`} onClick={()=>setViewMode("list")}>
                  <Icon name="list" size={14} color="currentColor"/>
                </div>
              </div>
              <button className="new-btn" onClick={() => navigate("record")}>
                <Icon name="plus" size={14} color="#fff"/>
                New Meeting
              </button>
            </div>
          </div>

          {/* Meetings grid / list */}
          {viewMode === "grid" ? (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16, animation:"fade-in .4s ease" }}>
              {filtered.map(m => (
                <div key={m.id} className="meeting-card" onClick={() => navigate("detail", m)}>
                  <div className="card-arrow"><Icon name="arrowRight" size={14} color="#6366F1"/></div>

                  {/* Status + type */}
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
                    <span style={{ fontSize:10, fontWeight:700, padding:"3px 8px", borderRadius:20, background:m.status==="processed"?"rgba(34,211,238,.1)":"rgba(251,191,36,.1)", border:`1px solid ${m.status==="processed"?"rgba(34,211,238,.25)":"rgba(251,191,36,.25)"}`, color:m.status==="processed"?"#22D3EE":"#FBBF24", textTransform:"uppercase", letterSpacing:".4px" }}>
                      {m.status}
                    </span>
                    <span style={{ fontSize:11, color:T.text3 }}>{m.type}</span>
                  </div>

                  {/* Title */}
                  <div style={{ fontSize:14, fontWeight:700, color:T.text1, marginBottom:6, letterSpacing:"-.2px", lineHeight:1.3 }}>{m.title}</div>

                  {/* Meta */}
                  <div style={{ display:"flex", alignItems:"center", gap:10, fontSize:11, color:T.text2, marginBottom:10 }}>
                    <span style={{ display:"flex", alignItems:"center", gap:4 }}><Icon name="calendar" size={10} color={T.text3}/>{m.date}</span>
                    <span style={{ display:"flex", alignItems:"center", gap:4 }}><Icon name="clock" size={10} color={T.text3}/>{m.duration}</span>
                  </div>

                  {/* Summary */}
                  <div style={{ fontSize:12, color:T.text3, lineHeight:1.55, marginBottom:12, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>{m.summary}</div>

                  {/* Footer */}
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                    <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                      {m.tags.map(t => <span key={t} className="tg">{t}</span>)}
                    </div>
                    <div style={{ display:"flex" }}>
                      {m.participants.map((p,i) => (
                        <div key={p} style={{ width:22, height:22, borderRadius:"50%", background:PCOLORS[p]||"#6366F1", display:"flex", alignItems:"center", justifyContent:"center", fontSize:8, fontWeight:700, color:"#fff", marginLeft:i>0?-6:0, border:`2px solid ${T.surface}` }}>{p}</div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:8, animation:"fade-in .4s ease" }}>
              {filtered.map(m => (
                <div key={m.id} className="meeting-list-row" onClick={() => navigate("detail", m)} style={{ position:"relative" }}>
                  <div style={{ width:8, height:8, borderRadius:"50%", background:m.status==="processed"?"#22D3EE":"#FBBF24", flexShrink:0 }}/>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:T.text1, marginBottom:3 }}>{m.title}</div>
                    <div style={{ display:"flex", alignItems:"center", gap:10, fontSize:11, color:T.text2 }}>
                      <span style={{ display:"flex", alignItems:"center", gap:3 }}><Icon name="calendar" size={10} color={T.text3}/>{m.date}</span>
                      <span style={{ display:"flex", alignItems:"center", gap:3 }}><Icon name="clock" size={10} color={T.text3}/>{m.duration}</span>
                      <span>{m.type}</span>
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:5 }}>
                    {m.tags.map(t => <span key={t} className="tg">{t}</span>)}
                  </div>
                  <div style={{ display:"flex" }}>
                    {m.participants.map((p,i) => (
                      <div key={p} style={{ width:22, height:22, borderRadius:"50%", background:PCOLORS[p]||"#6366F1", display:"flex", alignItems:"center", justifyContent:"center", fontSize:8, fontWeight:700, color:"#fff", marginLeft:i>0?-6:0, border:`2px solid ${T.surface}` }}>{p}</div>
                    ))}
                  </div>
                  <div className="card-arrow" style={{ position:"static", opacity:0, transition:"all .2s", color:"#6366F1" }}><Icon name="arrowRight" size={14} color="#6366F1"/></div>
                </div>
              ))}
            </div>
          )}

          {filtered.length === 0 && (
            <div style={{ textAlign:"center", padding:"60px 20px", color:T.text3 }}>
              <Icon name="mic" size={36} color={T.text3}/>
              <div style={{ fontSize:16, fontWeight:600, color:T.text2, marginTop:12 }}>No meetings found</div>
              <div style={{ fontSize:13, marginTop:4 }}>Try a different filter or record a new meeting</div>
            </div>
          )}

          <div style={{ height:12 }}/>
        </div>
      </main>
      </div>
    </>
  );
}