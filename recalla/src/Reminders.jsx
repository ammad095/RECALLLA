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
    plus:       <svg viewBox="0 0 24 24" {...s}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    check:      <svg viewBox="0 0 24 24" {...s}><polyline points="20 6 9 17 4 12"/></svg>,
    trash:      <svg viewBox="0 0 24 24" {...s}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
    edit:       <svg viewBox="0 0 24 24" {...s}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    x:          <svg viewBox="0 0 24 24" {...s}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    alertCircle:<svg viewBox="0 0 24 24" {...s}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
    calendar:   <svg viewBox="0 0 24 24" {...s}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    tag:        <svg viewBox="0 0 24 24" {...s}><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
    zap:        <svg viewBox="0 0 24 24" {...s}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
    repeat:     <svg viewBox="0 0 24 24" {...s}><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>,
    filter:     <svg viewBox="0 0 24 24" {...s}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
    user:       <svg viewBox="0 0 24 24" {...s}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    fileText:   <svg viewBox="0 0 24 24" {...s}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
    trendUp:    <svg viewBox="0 0 24 24" {...s}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  };
  return icons[name] || null;
};

// ── Themes ────────────────────────────────────────────────────────────────────
const DARK = {
  bg:"#080B12", sidebar:"rgba(8,11,18,0.97)", topbar:"rgba(8,11,18,0.85)",
  surface:"rgba(255,255,255,0.05)", surfaceHov:"rgba(255,255,255,0.09)",
  border:"rgba(255,255,255,0.09)", borderStr:"rgba(99,102,241,0.45)",
  indigoGlow:"rgba(99,102,241,0.15)",
  text1:"#F9FAFB", text2:"#C4C9D4", text3:"#6B7280",
  cardBox:"0 10px 28px rgba(0,0,0,0.35)", scrollbar:"rgba(255,255,255,0.1)",
  tagBg:"rgba(99,102,241,0.14)", tagBorder:"rgba(99,102,241,0.28)", tagColor:"#A5B4FC",
  inputBg:"rgba(0,0,0,0.3)", modalBg:"#111827",
};
const LIGHT = {
  bg:"#F4F6FB", sidebar:"#FFFFFF", topbar:"rgba(255,255,255,0.92)",
  surface:"#FFFFFF", surfaceHov:"#F0F3FA",
  border:"rgba(0,0,0,0.08)", borderStr:"rgba(99,102,241,0.5)",
  indigoGlow:"rgba(99,102,241,0.10)",
  text1:"#111827", text2:"#374151", text3:"#9CA3AF",
  cardBox:"0 2px 12px rgba(0,0,0,0.07)", scrollbar:"rgba(0,0,0,0.12)",
  tagBg:"rgba(99,102,241,0.10)", tagBorder:"rgba(99,102,241,0.22)", tagColor:"#4F46E5",
  inputBg:"rgba(0,0,0,0.04)", modalBg:"#FFFFFF",
};

const NAV = [
  { icon:"layers",   label:"Dashboard",   route:"dashboard"  },
  { icon:"mic",      label:"Meetings",    route:"meetings"   },
  { icon:"brain",    label:"Memory",      route:"memory"     },
  { icon:"chat",     label:"Ask Recalla", route:"ask"        },
  { icon:"bell",     label:"Reminders",   route:"reminders"  },
  { icon:"clock",    label:"Timeline",    route:"timeline"   },
  { icon:"settings", label:"Settings",    route:"settings"   },
];

// ── Priority config ───────────────────────────────────────────────────────────
const PRIORITIES = {
  urgent: { label:"Urgent",  color:"#F43F5E", bg:"rgba(244,63,94,0.10)",  border:"rgba(244,63,94,0.25)"  },
  high:   { label:"High",    color:"#F59E0B", bg:"rgba(245,158,11,0.10)", border:"rgba(245,158,11,0.25)" },
  normal: { label:"Normal",  color:"#6366F1", bg:"rgba(99,102,241,0.10)", border:"rgba(99,102,241,0.25)" },
  low:    { label:"Low",     color:"#10B981", bg:"rgba(16,185,129,0.10)", border:"rgba(16,185,129,0.25)" },
};

// ── Initial reminders data ────────────────────────────────────────────────────
const INITIAL = [
  { id:1,  text:"Send revised pitch deck to Ahmed",           time:"Today, 4:00 PM",       date:"2026-06-16", priority:"urgent", category:"follow-up", source:"Investor Pitch Review",    done:false, repeat:"none"   },
  { id:2,  text:"Deploy Whisper v3 to staging",              time:"Tomorrow, 9:00 AM",     date:"2026-06-17", priority:"high",   category:"task",      source:"Backend Architecture Sync", done:false, repeat:"none"   },
  { id:3,  text:"Team standup recording",                    time:"Tomorrow, 9:30 AM",     date:"2026-06-17", priority:"normal", category:"meeting",   source:"Manual",                    done:false, repeat:"daily"  },
  { id:4,  text:"Review PR for memory retrieval module",     time:"Tomorrow, 10:00 AM",    date:"2026-06-17", priority:"high",   category:"task",      source:"Backend Architecture Sync", done:false, repeat:"none"   },
  { id:5,  text:"Demo for Dr. Adnan — prepare slides",       time:"Fri 19 Jun, 2:00 PM",   date:"2026-06-19", priority:"urgent", category:"meeting",   source:"Backend Architecture Sync", done:false, repeat:"none"   },
  { id:6,  text:"Complete API endpoints for memory retrieval",time:"Fri 19 Jun, 5:00 PM",  date:"2026-06-19", priority:"high",   category:"task",      source:"Backend Architecture Sync", done:false, repeat:"none"   },
  { id:7,  text:"Weekly project report to supervisor",       time:"Mon 22 Jun, 10:00 AM",  date:"2026-06-22", priority:"normal", category:"follow-up", source:"Manual",                    done:false, repeat:"weekly" },
  { id:8,  text:"Update SRS document with new arch changes", time:"Mon 22 Jun, 2:00 PM",   date:"2026-06-22", priority:"normal", category:"task",      source:"Backend Architecture Sync", done:false, repeat:"none"   },
  { id:9,  text:"Submit FYP Part 1 report",                  time:"30 Jun, 11:59 PM",      date:"2026-06-30", priority:"urgent", category:"deadline",  source:"Manual",                    done:false, repeat:"none"   },
  { id:10, text:"Send calendar invite for Friday demo",       time:"Today, 2:00 PM",        date:"2026-06-16", priority:"normal", category:"meeting",   source:"Backend Architecture Sync", done:true,  repeat:"none"   },
];

const CATEGORIES = ["all","task","meeting","follow-up","deadline"];
const TABS = ["All","Today","Upcoming","Completed"];

// ── Add Reminder Modal ────────────────────────────────────────────────────────
const AddModal = ({ T, dark, onAdd, onClose }) => {
  const [text, setText]         = useState("");
  const [date, setDate]         = useState("");
  const [time, setTime]         = useState("");
  const [priority, setPriority] = useState("normal");
  const [category, setCategory] = useState("task");
  const [repeat, setRepeat]     = useState("none");

  const inputStyle = {
    width:"100%", padding:"9px 12px",
    background:T.inputBg, border:`1px solid ${T.border}`,
    borderRadius:8, color:T.text1,
    fontFamily:"'Inter',sans-serif", fontSize:13,
    outline:"none", transition:"all .2s",
  };

  const handleAdd = () => {
    if (!text.trim()) return;
    onAdd({
      id: Date.now(),
      text: text.trim(),
      date, time,
      priority, category, repeat,
      source:"Manual", done:false,
      displayTime: date && time ? `${date}, ${time}` : date || "No date set",
    });
    onClose();
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", backdropFilter:"blur(6px)", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", animation:"fade-in .2s ease" }}>
      <div style={{ background:T.modalBg, border:`1px solid ${T.border}`, borderRadius:18, padding:28, width:480, boxShadow:"0 24px 64px rgba(0,0,0,0.5)", animation:"slide-up .25s ease" }}>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:34, height:34, borderRadius:9, background:"linear-gradient(135deg,#6366F1,#22D3EE)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Icon name="bell" size={16} color="#fff"/>
            </div>
            <div style={{ fontSize:16, fontWeight:800, color:T.text1, letterSpacing:"-.3px" }}>New Reminder</div>
          </div>
          <button onClick={onClose} style={{ width:28, height:28, borderRadius:"50%", background:T.surface, border:`1px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
            <Icon name="x" size={13} color={T.text3}/>
          </button>
        </div>

        {/* Fields */}
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <div>
            <label style={{ fontSize:10, fontWeight:700, color:T.text3, textTransform:"uppercase", letterSpacing:".6px", display:"block", marginBottom:5 }}>Reminder Text *</label>
            <input style={inputStyle} placeholder="What do you need to be reminded about?" value={text} onChange={e=>setText(e.target.value)} autoFocus
              onFocus={e=>{ e.target.style.borderColor="#6366F1"; e.target.style.boxShadow="0 0 0 3px rgba(99,102,241,.15)"; }}
              onBlur={e=>{ e.target.style.borderColor=T.border; e.target.style.boxShadow="none"; }}
            />
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <div>
              <label style={{ fontSize:10, fontWeight:700, color:T.text3, textTransform:"uppercase", letterSpacing:".6px", display:"block", marginBottom:5 }}>Date</label>
              <input type="date" style={inputStyle} value={date} onChange={e=>setDate(e.target.value)}
                onFocus={e=>{ e.target.style.borderColor="#6366F1"; e.target.style.boxShadow="0 0 0 3px rgba(99,102,241,.15)"; }}
                onBlur={e=>{ e.target.style.borderColor=T.border; e.target.style.boxShadow="none"; }}
              />
            </div>
            <div>
              <label style={{ fontSize:10, fontWeight:700, color:T.text3, textTransform:"uppercase", letterSpacing:".6px", display:"block", marginBottom:5 }}>Time</label>
              <input type="time" style={inputStyle} value={time} onChange={e=>setTime(e.target.value)}
                onFocus={e=>{ e.target.style.borderColor="#6366F1"; e.target.style.boxShadow="0 0 0 3px rgba(99,102,241,.15)"; }}
                onBlur={e=>{ e.target.style.borderColor=T.border; e.target.style.boxShadow="none"; }}
              />
            </div>
          </div>

          {/* Priority */}
          <div>
            <label style={{ fontSize:10, fontWeight:700, color:T.text3, textTransform:"uppercase", letterSpacing:".6px", display:"block", marginBottom:7 }}>Priority</label>
            <div style={{ display:"flex", gap:7 }}>
              {Object.entries(PRIORITIES).map(([key, p]) => (
                <button key={key} onClick={()=>setPriority(key)} style={{ flex:1, padding:"7px 0", borderRadius:8, border:`1px solid ${priority===key ? p.color : T.border}`, background:priority===key ? p.bg : "transparent", color:priority===key ? p.color : T.text3, fontSize:12, fontWeight:600, cursor:"pointer", transition:"all .2s", fontFamily:"'Inter',sans-serif" }}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category + Repeat */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <div>
              <label style={{ fontSize:10, fontWeight:700, color:T.text3, textTransform:"uppercase", letterSpacing:".6px", display:"block", marginBottom:5 }}>Category</label>
              <select value={category} onChange={e=>setCategory(e.target.value)} style={{ ...inputStyle, appearance:"none", cursor:"pointer" }}>
                {["task","meeting","follow-up","deadline"].map(c => <option key={c} value={c} style={{ background:dark?"#1E2130":"#fff" }}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:10, fontWeight:700, color:T.text3, textTransform:"uppercase", letterSpacing:".6px", display:"block", marginBottom:5 }}>Repeat</label>
              <select value={repeat} onChange={e=>setRepeat(e.target.value)} style={{ ...inputStyle, appearance:"none", cursor:"pointer" }}>
                {["none","daily","weekly","monthly"].map(r => <option key={r} value={r} style={{ background:dark?"#1E2130":"#fff" }}>{r.charAt(0).toUpperCase()+r.slice(1)}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display:"flex", gap:10, marginTop:22 }}>
          <button onClick={onClose} style={{ flex:1, padding:"10px 0", background:T.surface, border:`1px solid ${T.border}`, borderRadius:9, color:T.text2, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'Inter',sans-serif", transition:"all .2s" }}>
            Cancel
          </button>
          <button onClick={handleAdd} style={{ flex:2, padding:"10px 0", background:"linear-gradient(135deg,#6366F1,#818CF8)", border:"none", borderRadius:9, color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'Inter',sans-serif", boxShadow:"0 4px 14px rgba(99,102,241,.35)", transition:"all .2s" }}>
            Add Reminder
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Reminder Card ─────────────────────────────────────────────────────────────
const ReminderCard = ({ r, T, dark, onToggle, onDelete, onEdit }) => {
  const p = PRIORITIES[r.priority] || PRIORITIES.normal;
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display:"flex", alignItems:"flex-start", gap:14,
        padding:"14px 16px",
        background: hovered ? T.surfaceHov : T.surface,
        border:`1px solid ${hovered ? "rgba(99,102,241,.3)" : T.border}`,
        borderRadius:12,
        transition:"all .2s",
        opacity: r.done ? 0.55 : 1,
        animation:"fade-in .3s ease",
        position:"relative",
        boxShadow: T.cardBox,
      }}
    >
      {/* Priority bar */}
      <div style={{ position:"absolute", left:0, top:"15%", bottom:"15%", width:3, borderRadius:"0 2px 2px 0", background:p.color, opacity: r.done ? 0.4 : 1 }}/>

      {/* Checkbox */}
      <div
        onClick={() => onToggle(r.id)}
        style={{
          width:22, height:22, borderRadius:6, flexShrink:0,
          border:`2px solid ${r.done ? p.color : T.border}`,
          background: r.done ? p.bg : "transparent",
          display:"flex", alignItems:"center", justifyContent:"center",
          cursor:"pointer", transition:"all .2s", marginTop:1,
        }}
      >
        {r.done && <Icon name="check" size={12} color={p.color}/>}
      </div>

      {/* Content */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13, fontWeight:r.done ? 400 : 600, color: r.done ? T.text3 : T.text1, textDecoration: r.done ? "line-through" : "none", marginBottom:5, lineHeight:1.4 }}>
          {r.text}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
          {/* Time */}
          <span style={{ display:"flex", alignItems:"center", gap:4, fontSize:11, color: r.priority==="urgent" && !r.done ? "#F43F5E" : T.text3, fontFamily:"'JetBrains Mono',monospace", fontWeight: r.priority==="urgent" && !r.done ? 600 : 400 }}>
            <Icon name="clock" size={10} color="currentColor"/>
            {r.time || r.displayTime}
          </span>
          {/* Category */}
          <span style={{ fontSize:10, fontWeight:600, padding:"2px 7px", borderRadius:20, background:T.tagBg, border:`1px solid ${T.tagBorder}`, color:T.tagColor }}>
            {r.category}
          </span>
          {/* Repeat */}
          {r.repeat && r.repeat !== "none" && (
            <span style={{ display:"flex", alignItems:"center", gap:3, fontSize:10, color:T.text3 }}>
              <Icon name="repeat" size={9} color={T.text3}/>
              {r.repeat}
            </span>
          )}
          {/* Source */}
          {r.source && r.source !== "Manual" && (
            <span style={{ display:"flex", alignItems:"center", gap:3, fontSize:10, color:T.text3 }}>
              <Icon name="fileText" size={9} color={T.text3}/>
              {r.source}
            </span>
          )}
        </div>
      </div>

      {/* Priority badge */}
      <div style={{ fontSize:10, fontWeight:700, padding:"3px 8px", borderRadius:20, background:p.bg, border:`1px solid ${p.border}`, color:p.color, flexShrink:0, letterSpacing:".3px" }}>
        {p.label}
      </div>

      {/* Action buttons — show on hover */}
      <div style={{ display:"flex", gap:5, opacity: hovered ? 1 : 0, transition:"opacity .2s", flexShrink:0 }}>
        <button onClick={() => onEdit(r)} style={{ width:28, height:28, borderRadius:7, background:T.surface, border:`1px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", transition:"all .2s" }}
          onMouseEnter={e=>{ e.currentTarget.style.borderColor="rgba(99,102,241,.4)"; e.currentTarget.style.background=T.indigoGlow; }}
          onMouseLeave={e=>{ e.currentTarget.style.borderColor=T.border; e.currentTarget.style.background=T.surface; }}
        >
          <Icon name="edit" size={12} color={T.text2}/>
        </button>
        <button onClick={() => onDelete(r.id)} style={{ width:28, height:28, borderRadius:7, background:T.surface, border:`1px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", transition:"all .2s" }}
          onMouseEnter={e=>{ e.currentTarget.style.borderColor="rgba(244,63,94,.4)"; e.currentTarget.style.background="rgba(244,63,94,.08)"; }}
          onMouseLeave={e=>{ e.currentTarget.style.borderColor=T.border; e.currentTarget.style.background=T.surface; }}
        >
          <Icon name="trash" size={12} color="#F43F5E"/>
        </button>
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
export default function Reminders({ navigate: navProp, dark: darkProp, setDark: setDarkProp, sidebarOpen: sidebarProp, setSidebarOpen: setSidebarProp } = {}) {
  const [darkLocal, setDarkLocal]           = useState(true);
  const [sidebarLocal, setSidebarLocal]     = useState(true);
  const dark          = darkProp          !== undefined ? darkProp        : darkLocal;
  const setDark       = setDarkProp       !== undefined ? setDarkProp     : setDarkLocal;
  const sidebarOpen   = sidebarProp       !== undefined ? sidebarProp     : sidebarLocal;
  const setSidebarOpen= setSidebarProp    !== undefined ? setSidebarProp  : setSidebarLocal;

  const [reminders, setReminders] = useState(INITIAL);
  const [activeTab, setActiveTab] = useState("All");
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch]       = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editReminder, setEditReminder] = useState(null);
  const T = dark ? DARK : LIGHT;

  const handleNav = (route) => { if (navProp) navProp(route); };

  const toggleDone  = (id) => setReminders(rs => rs.map(r => r.id===id ? {...r, done:!r.done} : r));
  const deleteItem  = (id) => setReminders(rs => rs.filter(r => r.id!==id));
  const addReminder = (r)  => setReminders(rs => [r, ...rs]);

  const filtered = reminders.filter(r => {
    const matchSearch   = r.text.toLowerCase().includes(search.toLowerCase());
    const matchCategory = activeCategory==="all" || r.category===activeCategory;
    const matchTab = activeTab==="All" ? true
      : activeTab==="Today"     ? (r.time?.toLowerCase().includes("today") && !r.done)
      : activeTab==="Upcoming"  ? (!r.time?.toLowerCase().includes("today") && !r.done)
      : activeTab==="Completed" ? r.done
      : true;
    return matchSearch && matchCategory && matchTab;
  });

  const stats = {
    total:     reminders.filter(r=>!r.done).length,
    urgent:    reminders.filter(r=>r.priority==="urgent"&&!r.done).length,
    today:     reminders.filter(r=>r.time?.toLowerCase().includes("today")&&!r.done).length,
    completed: reminders.filter(r=>r.done).length,
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
    .cat-chip{padding:5px 12px;border-radius:20px;font-size:11px;font-weight:600;cursor:pointer;transition:all .2s;border:1px solid ${T.border};background:${T.surface};color:${T.text2};font-family:'Inter',sans-serif}
    .cat-chip:hover{border-color:${T.borderStr};color:${T.text1}}
    .cat-chip.act{background:${T.indigoGlow};border-color:${T.borderStr};color:${dark?"#A5B4FC":"#4F46E5"}}
    .stat-card{background:${T.surface};border:1px solid ${T.border};border-radius:12px;padding:16px;box-shadow:${T.cardBox};transition:all .22s}
    .stat-card:hover{background:${T.surfaceHov};border-color:rgba(99,102,241,.25);transform:translateY(-1px)}
    .add-btn{display:flex;align-items:center;gap:7px;padding:9px 18px;background:linear-gradient(135deg,#6366F1,#818CF8);border:none;border-radius:9px;color:#fff;font-size:13px;font-weight:700;cursor:pointer;transition:all .2s;font-family:'Inter',sans-serif;box-shadow:0 4px 14px rgba(99,102,241,.35)}
    .add-btn:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(99,102,241,.45)}
    .section-label{font-size:11px;font-weight:700;color:${T.text3};text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;padding:0 2px;display:flex;align-items:center;gap:7px}
    .empty{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:48px 20px;gap:12px;text-align:center}
    @keyframes breathe{0%,100%{opacity:1}50%{opacity:.45}}
    @keyframes fade-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    @keyframes slide-up{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
  `;

  // Group filtered reminders by date section
  const todayItems    = filtered.filter(r => r.time?.toLowerCase().includes("today"));
  const tomorrowItems = filtered.filter(r => r.time?.toLowerCase().includes("tomorrow"));
  const upcomingItems = filtered.filter(r => !r.time?.toLowerCase().includes("today") && !r.time?.toLowerCase().includes("tomorrow") && !r.done);
  const doneItems     = filtered.filter(r => r.done);

  const ReminderGroup = ({ label, items, icon, iconColor }) => {
    if (items.length === 0) return null;
    return (
      <div>
        <div className="section-label">
          <Icon name={icon} size={12} color={iconColor}/>
          {label} · {items.length}
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {items.map(r => (
            <ReminderCard key={r.id} r={r} T={T} dark={dark} onToggle={toggleDone} onDelete={deleteItem} onEdit={setEditReminder}/>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      <style>{css}</style>
      {showModal && <AddModal T={T} dark={dark} onAdd={addReminder} onClose={()=>setShowModal(false)}/>}

      <div className="app">
        {/* Sidebar */}
        <aside className="sb">
          <div className="logo">
            <div className="lmark"><Icon name="brain" size={16} color="#fff"/></div>
            {sidebarOpen && <div className="ltxt">Re<span>calla</span></div>}
          </div>
          {NAV.map(item => (
            <div key={item.label} className={`ni${item.route==="reminders"?" act":""}`} onClick={()=>handleNav(item.route)}>
              <Icon name={item.icon} size={16} color={item.route==="reminders"?"#6366F1":T.text2}/>
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
          <div className="sbt" onClick={()=>setSidebarOpen(p=>!p)}>
            <Icon name="menu" size={11} color={T.text3}/>
          </div>
        </aside>

        {/* Main */}
        <main className="main">
          {/* Topbar */}
          <div className="topbar">
            <div>
              <div style={{ fontSize:15, fontWeight:700, letterSpacing:"-.3px", color:T.text1 }}>Reminders</div>
              <div style={{ fontSize:11, color:T.text3, marginTop:1 }}>Monday, 16 June 2026</div>
            </div>
            <div className="sw">
              <Icon name="search" size={14} color={T.text3}/>
              <input placeholder="Search reminders…" value={search} onChange={e=>setSearch(e.target.value)}/>
            </div>
            <div className="tbr">
              <button className="thbtn" onClick={()=>setDark(d=>!d)}>
                <Icon name={dark?"sun":"moon"} size={13} color={dark?"#A5B4FC":"#4F46E5"}/>
                {dark?"Light mode":"Dark mode"}
              </button>
              <div className="ibtn"><Icon name="bell" size={15} color={T.text2}/><div className="ndot" style={{ display: stats.urgent > 0 ? "block" : "none" }}/></div>
              <div className="av">AA</div>
            </div>
          </div>

          <div className="cnt">

            {/* Stats strip */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, animation:"fade-in .3s ease" }}>
              {[
                { icon:"bell",     color:"#6366F1", bg:"rgba(99,102,241,.12)", val:stats.total,     label:"Active Reminders"  },
                { icon:"alertCircle",color:"#F43F5E",bg:"rgba(244,63,94,.10)", val:stats.urgent,    label:"Urgent"            },
                { icon:"clock",    color:"#F59E0B", bg:"rgba(245,158,11,.10)", val:stats.today,     label:"Due Today"         },
                { icon:"check",    color:"#10B981", bg:"rgba(16,185,129,.10)", val:stats.completed, label:"Completed"         },
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
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10, animation:"fade-in .35s ease" }}>
              {/* Tabs */}
              <div style={{ display:"flex", gap:4 }}>
                {TABS.map(tab => (
                  <button key={tab} className={`tab${activeTab===tab?" act":""}`} onClick={()=>setActiveTab(tab)}>
                    {tab}
                    <span style={{ marginLeft:5, fontSize:10, padding:"1px 5px", borderRadius:20, background:dark?"rgba(255,255,255,.07)":"rgba(0,0,0,.06)", color:T.text3 }}>
                      {tab==="All"        ? reminders.length
                      :tab==="Today"      ? reminders.filter(r=>r.time?.toLowerCase().includes("today")&&!r.done).length
                      :tab==="Upcoming"   ? reminders.filter(r=>!r.time?.toLowerCase().includes("today")&&!r.done).length
                      : reminders.filter(r=>r.done).length}
                    </span>
                  </button>
                ))}
              </div>

              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                {/* Category filter */}
                <div style={{ display:"flex", gap:5 }}>
                  {CATEGORIES.map(c => (
                    <button key={c} className={`cat-chip${activeCategory===c?" act":""}`} onClick={()=>setActiveCategory(c)}>
                      {c==="all"?"All":c.charAt(0).toUpperCase()+c.slice(1)}
                    </button>
                  ))}
                </div>
                {/* Add button */}
                <button className="add-btn" onClick={()=>setShowModal(true)}>
                  <Icon name="plus" size={14} color="#fff"/>
                  New Reminder
                </button>
              </div>
            </div>

            {/* Reminder groups */}
            <div style={{ display:"flex", flexDirection:"column", gap:22, animation:"fade-in .4s ease" }}>
              {activeTab==="Completed" ? (
                <ReminderGroup label="Completed" items={doneItems} icon="check" iconColor="#10B981"/>
              ) : activeTab==="Today" ? (
                <ReminderGroup label="Due Today" items={todayItems} icon="alertCircle" iconColor="#F43F5E"/>
              ) : activeTab==="Upcoming" ? (
                <>
                  <ReminderGroup label="Tomorrow"  items={tomorrowItems} icon="clock"        iconColor="#F59E0B"/>
                  <ReminderGroup label="Upcoming"  items={upcomingItems} icon="calendar"     iconColor="#6366F1"/>
                </>
              ) : (
                <>
                  {todayItems.length > 0    && <ReminderGroup label="Today"    items={todayItems}    icon="alertCircle" iconColor="#F43F5E"/>}
                  {tomorrowItems.length > 0 && <ReminderGroup label="Tomorrow" items={tomorrowItems} icon="clock"       iconColor="#F59E0B"/>}
                  {upcomingItems.length > 0 && <ReminderGroup label="Upcoming" items={upcomingItems} icon="calendar"    iconColor="#6366F1"/>}
                  {doneItems.length > 0     && <ReminderGroup label="Done"     items={doneItems}     icon="check"       iconColor="#10B981"/>}
                </>
              )}

              {filtered.length === 0 && (
                <div className="empty">
                  <div style={{ width:60, height:60, borderRadius:"50%", background:"linear-gradient(135deg,#6366F1,#22D3EE)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 0 24px rgba(99,102,241,.35)" }}>
                    <Icon name="bell" size={26} color="#fff"/>
                  </div>
                  <div style={{ fontSize:16, fontWeight:700, color:T.text1 }}>No reminders found</div>
                  <div style={{ fontSize:13, color:T.text3, maxWidth:280, lineHeight:1.6 }}>
                    {search ? "Try a different search term" : "You're all caught up! Add a new reminder to get started."}
                  </div>
                  {!search && (
                    <button className="add-btn" onClick={()=>setShowModal(true)} style={{ marginTop:4 }}>
                      <Icon name="plus" size={14} color="#fff"/>
                      Add First Reminder
                    </button>
                  )}
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