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
    user:       <svg viewBox="0 0 24 24" {...s}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    lock:       <svg viewBox="0 0 24 24" {...s}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
    mail:       <svg viewBox="0 0 24 24" {...s}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
    globe:      <svg viewBox="0 0 24 24" {...s}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
    palette:    <svg viewBox="0 0 24 24" {...s}><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>,
    zap:        <svg viewBox="0 0 24 24" {...s}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
    shield:     <svg viewBox="0 0 24 24" {...s}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    download:   <svg viewBox="0 0 24 24" {...s}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
    trash:      <svg viewBox="0 0 24 24" {...s}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>,
    logOut:     <svg viewBox="0 0 24 24" {...s}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
    check:      <svg viewBox="0 0 24 24" {...s}><polyline points="20 6 9 17 4 12"/></svg>,
    chevRight:  <svg viewBox="0 0 24 24" {...s}><polyline points="9 18 15 12 9 6"/></svg>,
    plug:       <svg viewBox="0 0 24 24" {...s}><path d="M9 2v6"/><path d="M15 2v6"/><path d="M12 17v5"/><path d="M5 8h14a1 1 0 0 1 1 1v3a7 7 0 0 1-14 0V9a1 1 0 0 1 1-1z"/></svg>,
    camera:     <svg viewBox="0 0 24 24" {...s}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
    sparkle:    <svg viewBox="0 0 24 24" {...s}><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>,
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

// ── Settings sections ────────────────────────────────────────────────────────
const SECTIONS = [
  { id:"profile",      label:"Profile",         icon:"user"     },
  { id:"account",      label:"Account",         icon:"lock"     },
  { id:"preferences",  label:"Preferences",     icon:"palette"  },
  { id:"ai",           label:"AI & Models",     icon:"sparkle"  },
  { id:"integrations", label:"Integrations",    icon:"plug"     },
  { id:"privacy",      label:"Privacy",         icon:"shield"   },
  { id:"data",         label:"Data & Storage",  icon:"download" },
];

// ── Toggle switch component ───────────────────────────────────────────────────
const Toggle = ({ on, onChange }) => (
  <div
    onClick={() => onChange(!on)}
    style={{
      width: 38, height: 22, borderRadius: 999,
      background: on ? "linear-gradient(135deg,#6366F1,#22D3EE)" : "rgba(128,128,128,0.3)",
      position: "relative", cursor: "pointer",
      transition: "background .25s",
      boxShadow: on ? "0 0 12px rgba(99,102,241,0.4)" : "none",
    }}
  >
    <div style={{
      position:"absolute", top:2,
      left: on ? 18 : 2,
      width: 18, height: 18, borderRadius: "50%",
      background: "#fff", boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
      transition: "left .25s",
    }}/>
  </div>
);

// ── Setting row ───────────────────────────────────────────────────────────────
const SettingRow = ({ icon, iconColor, title, description, T, children, danger }) => (
  <div style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 0", borderBottom:`1px solid ${T.border}` }}>
    {icon && (
      <div style={{ width:34, height:34, borderRadius:8, background:danger?"rgba(244,63,94,0.10)":T.indigoGlow, border:`1px solid ${danger?"rgba(244,63,94,0.25)":T.borderStr}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
        <Icon name={icon} size={15} color={iconColor || (danger ? "#F43F5E" : "#6366F1")}/>
      </div>
    )}
    <div style={{ flex:1, minWidth:0 }}>
      <div style={{ fontSize:13, fontWeight:600, color: danger ? "#F43F5E" : T.text1, marginBottom:2 }}>{title}</div>
      {description && <div style={{ fontSize:11, color:T.text2, lineHeight:1.5 }}>{description}</div>}
    </div>
    <div style={{ flexShrink:0 }}>
      {children}
    </div>
  </div>
);

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Settings({ navigate: navProp, dark: darkProp, setDark: setDarkProp, sidebarOpen: sidebarProp, setSidebarOpen: setSidebarProp } = {}) {
  const [darkLocal, setDarkLocal]           = useState(true);
  const [sidebarLocal, setSidebarLocal]     = useState(true);
  const dark          = darkProp          !== undefined ? darkProp        : darkLocal;
  const setDark       = setDarkProp       !== undefined ? setDarkProp     : setDarkLocal;
  const sidebarOpen   = sidebarProp       !== undefined ? sidebarProp     : sidebarLocal;
  const setSidebarOpen= setSidebarProp    !== undefined ? setSidebarProp  : setSidebarLocal;

  const [activeSection, setActiveSection] = useState("profile");

  // Form states
  const [name, setName]               = useState("Ammad Ahmad");
  const [email, setEmail]             = useState("ammad@riphah.edu.pk");
  const [bio, setBio]                 = useState("BSCS Final Year Student · FYP: Recalla");
  const [language, setLanguage]       = useState("English");
  const [transcriptionLang, setTranscriptionLang] = useState("English");
  const [whisperModel, setWhisperModel] = useState("small");
  const [autoTagging, setAutoTagging]   = useState(true);
  const [autoSummary, setAutoSummary]   = useState(true);
  const [speakerDiarization, setSpeakerDiarization] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [emailNotif, setEmailNotif]       = useState(false);
  const [reminderSounds, setReminderSounds] = useState(true);
  const [autoSave, setAutoSave]           = useState(true);
  const [localOnly, setLocalOnly]         = useState(true);
  const [analytics, setAnalytics]         = useState(false);
  const [saved, setSaved]                 = useState(false);

  // Integrations connection state
  const [integrations, setIntegrations] = useState({
    gmail: false,
    calendar: false,
    slack: false,
    drive: false,
  });

  const toggleIntegration = (key) => setIntegrations(i => ({ ...i, [key]: !i[key] }));

  const T = dark ? DARK : LIGHT;

  const handleNav = (route) => { if (navProp) navProp(route); };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const inputStyle = {
    width:"100%", padding:"9px 12px",
    background:T.inputBg, border:`1px solid ${T.border}`,
    borderRadius:8, color:T.text1,
    fontFamily:"'Inter',sans-serif", fontSize:13,
    outline:"none", transition:"all .2s",
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
    .sbt{position:absolute;top:20px;right:-11px;width:22px;height:22px;background:${T.sidebar};border:1px solid ${T.border};border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;color:${T.text3};z-index:20}
    .sbt:hover{border-color:#6366F1;color:#6366F1}
    .usr{margin-top:auto;padding-top:10px;border-top:1px solid ${T.border}}
    .avsm{width:26px;height:26px;border-radius:50%;background:linear-gradient(135deg,#6366F1,#22D3EE);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#fff;flex-shrink:0}
    .topbar{height:60px;border-bottom:1px solid ${T.border};display:flex;align-items:center;justify-content:space-between;padding:0 24px;background:${T.topbar};backdrop-filter:blur(20px);flex-shrink:0}
    .ibtn{width:34px;height:34px;display:flex;align-items:center;justify-content:center;background:${T.surface};border:1px solid ${T.border};border-radius:8px;cursor:pointer;color:${T.text2};transition:all .2s}
    .ibtn:hover{background:${T.surfaceHov};color:${T.text1};border-color:${T.borderStr}}
    .av{width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,#6366F1,#22D3EE);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff;cursor:pointer}
    .thbtn{display:flex;align-items:center;gap:6px;padding:6px 12px;border-radius:20px;background:${T.indigoGlow};border:1px solid ${T.borderStr};color:${dark?"#A5B4FC":"#4F46E5"};font-size:12px;font-weight:600;cursor:pointer;transition:all .2s;font-family:'Inter',sans-serif;white-space:nowrap}
    .thbtn:hover{background:${dark?"rgba(99,102,241,.25)":"rgba(99,102,241,.18)"}}

    .layout{flex:1;display:grid;grid-template-columns:240px 1fr;overflow:hidden}
    .sub-nav{border-right:1px solid ${T.border};background:${T.sidebar};padding:18px 12px;overflow-y:auto}
    .sub-nav-title{font-size:11px;font-weight:700;color:${T.text3};letter-spacing:.7px;text-transform:uppercase;padding:0 10px;margin-bottom:8px}
    .sub-item{display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:8px;cursor:pointer;transition:all .2s;color:${T.text2};font-size:13px;font-weight:500;margin-bottom:2px;border:1px solid transparent}
    .sub-item:hover{background:${T.surfaceHov};color:${T.text1}}
    .sub-item.act{background:${T.indigoGlow};border-color:${T.borderStr};color:${T.text1}}

    .content{padding:28px 32px;overflow-y:auto}
    .section-card{background:${T.surface};border:1px solid ${T.border};border-radius:14px;padding:24px;box-shadow:${T.cardBox};margin-bottom:18px}
    .section-title{font-size:18px;font-weight:800;letter-spacing:-.4px;color:${T.text1};margin-bottom:5px}
    .section-sub{font-size:13px;color:${T.text2};margin-bottom:22px;line-height:1.6}

    .input-field{width:100%;padding:9px 12px;background:${T.inputBg};border:1px solid ${T.border};border-radius:8px;color:${T.text1};font-family:'Inter',sans-serif;font-size:13px;outline:none;transition:all .2s}
    .input-field:focus{border-color:${T.borderStr};box-shadow:0 0 0 3px ${T.indigoGlow}}
    .input-field::placeholder{color:${T.text3}}
    .field-label{display:block;font-size:10px;font-weight:700;color:${T.text3};text-transform:uppercase;letter-spacing:.7px;margin-bottom:5px}
    .field-group{margin-bottom:14px}

    .save-btn{display:flex;align-items:center;gap:8px;padding:10px 22px;background:linear-gradient(135deg,#6366F1,#818CF8);border:none;border-radius:9px;color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:'Inter',sans-serif;box-shadow:0 4px 14px rgba(99,102,241,.35);transition:all .2s}
    .save-btn:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(99,102,241,.45)}
    .save-btn.saved{background:linear-gradient(135deg,#10B981,#34D399);box-shadow:0 4px 14px rgba(16,185,129,.4)}
    .danger-btn{display:flex;align-items:center;gap:7px;padding:8px 16px;background:rgba(244,63,94,0.1);border:1px solid rgba(244,63,94,0.3);border-radius:8px;color:#F43F5E;font-size:12px;font-weight:600;cursor:pointer;font-family:'Inter',sans-serif;transition:all .2s}
    .danger-btn:hover{background:rgba(244,63,94,0.16)}

    .conn-btn{padding:6px 12px;border-radius:7px;font-size:11px;font-weight:600;cursor:pointer;font-family:'Inter',sans-serif;transition:all .2s;border:1px solid}
    .conn-btn.connected{background:rgba(16,185,129,0.10);border-color:rgba(16,185,129,0.3);color:#10B981}
    .conn-btn.disconnected{background:${T.indigoGlow};border-color:${T.borderStr};color:${dark?"#A5B4FC":"#4F46E5"}}
    .conn-btn:hover{transform:translateY(-1px)}

    @keyframes fade-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    .fi{animation:fade-in .35s ease}
  `;

  return (
    <>
      <style>{css}</style>
      <div className="app">

        {/* Main sidebar */}
        <aside className="sb">
          <div className="logo">
            <div className="lmark"><Icon name="brain" size={16} color="#fff"/></div>
            {sidebarOpen && <div className="ltxt">Re<span>calla</span></div>}
          </div>
          {NAV.map(item => (
            <div key={item.label} className={`ni${item.route==="settings"?" act":""}`} onClick={() => handleNav(item.route)}>
              <Icon name={item.icon} size={16} color={item.route==="settings"?"#6366F1":T.text2}/>
              <span className="nlbl">{item.label}</span>
            </div>
          ))}
          <div className="usr">
            <div className="ni">
              <div className="avsm">AA</div>
              {sidebarOpen && (
                <div style={{ overflow:"hidden" }}>
                  <div style={{ fontSize:12, fontWeight:600, color:T.text1, whiteSpace:"nowrap" }}>{name}</div>
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
              <div style={{ fontSize:15, fontWeight:700, letterSpacing:"-.3px", color:T.text1 }}>Settings</div>
              <div style={{ fontSize:11, color:T.text3, marginTop:1 }}>Manage your account and preferences</div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <button className={`save-btn${saved?" saved":""}`} onClick={handleSave}>
                <Icon name={saved?"check":"check"} size={13} color="#fff"/>
                {saved ? "Saved!" : "Save Changes"}
              </button>
              <button className="thbtn" onClick={() => setDark(d => !d)}>
                <Icon name={dark?"sun":"moon"} size={13} color={dark?"#A5B4FC":"#4F46E5"}/>
                {dark?"Light mode":"Dark mode"}
              </button>
              <div className="ibtn"><Icon name="bell" size={15} color={T.text2}/></div>
              <div className="av">AA</div>
            </div>
          </div>

          {/* 2-column layout */}
          <div className="layout">
            {/* Sub navigation */}
            <div className="sub-nav">
              <div className="sub-nav-title">Settings</div>
              {SECTIONS.map(s => (
                <div key={s.id} className={`sub-item${activeSection===s.id?" act":""}`} onClick={() => setActiveSection(s.id)}>
                  <Icon name={s.icon} size={14} color={activeSection===s.id?"#6366F1":T.text2}/>
                  <span style={{ flex:1 }}>{s.label}</span>
                  <Icon name="chevRight" size={11} color={T.text3}/>
                </div>
              ))}
            </div>

            {/* Content */}
            <div className="content">

              {/* PROFILE */}
              {activeSection === "profile" && (
                <div className="fi">
                  <div className="section-card">
                    <div className="section-title">Profile</div>
                    <div className="section-sub">Your personal information visible across Recalla.</div>

                    {/* Avatar */}
                    <div style={{ display:"flex", alignItems:"center", gap:18, marginBottom:24, paddingBottom:24, borderBottom:`1px solid ${T.border}` }}>
                      <div style={{ position:"relative" }}>
                        <div style={{ width:72, height:72, borderRadius:"50%", background:"linear-gradient(135deg,#6366F1,#22D3EE)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, fontWeight:700, color:"#fff", boxShadow:"0 0 24px rgba(99,102,241,0.35)" }}>
                          AA
                        </div>
                        <div style={{ position:"absolute", bottom:-2, right:-2, width:26, height:26, borderRadius:"50%", background:T.surface, border:`2px solid ${T.bg}`, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                          <Icon name="camera" size={11} color={T.text2}/>
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize:16, fontWeight:700, color:T.text1, marginBottom:3 }}>{name}</div>
                        <div style={{ fontSize:12, color:T.text2 }}>{email}</div>
                        <div style={{ fontSize:11, color:T.text3, marginTop:4 }}>Member since June 2026 · 47 meetings recorded</div>
                      </div>
                    </div>

                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                      <div className="field-group">
                        <label className="field-label">Full Name</label>
                        <input className="input-field" value={name} onChange={e=>setName(e.target.value)}/>
                      </div>
                      <div className="field-group">
                        <label className="field-label">Email</label>
                        <input className="input-field" type="email" value={email} onChange={e=>setEmail(e.target.value)}/>
                      </div>
                      <div className="field-group" style={{ gridColumn:"1/-1" }}>
                        <label className="field-label">Bio</label>
                        <input className="input-field" value={bio} onChange={e=>setBio(e.target.value)}/>
                      </div>
                      <div className="field-group">
                        <label className="field-label">University</label>
                        <input className="input-field" value="Riphah International University" readOnly/>
                      </div>
                      <div className="field-group">
                        <label className="field-label">Student ID</label>
                        <input className="input-field" value="50908" readOnly/>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ACCOUNT */}
              {activeSection === "account" && (
                <div className="fi">
                  <div className="section-card">
                    <div className="section-title">Account &amp; Security</div>
                    <div className="section-sub">Manage your password, login sessions, and security preferences.</div>

                    <SettingRow icon="lock" title="Password" description="Last changed 2 months ago" T={T}>
                      <button className="conn-btn disconnected">Change</button>
                    </SettingRow>

                    <SettingRow icon="shield" title="Two-Factor Authentication" description="Add an extra layer of security to your account" T={T}>
                      <Toggle on={false} onChange={()=>{}}/>
                    </SettingRow>

                    <SettingRow icon="mail" title="Email Verified" description={email} T={T} iconColor="#10B981">
                      <span style={{ display:"flex", alignItems:"center", gap:4, fontSize:11, fontWeight:600, color:"#10B981" }}>
                        <Icon name="check" size={11} color="#10B981"/>
                        Verified
                      </span>
                    </SettingRow>

                    <SettingRow icon="logOut" title="Active Sessions" description="2 active sessions across devices" T={T}>
                      <button className="conn-btn disconnected">Manage</button>
                    </SettingRow>
                  </div>

                  <div className="section-card" style={{ borderColor:"rgba(244,63,94,0.2)" }}>
                    <div className="section-title" style={{ color:"#F43F5E" }}>Danger Zone</div>
                    <div className="section-sub">Irreversible actions. Proceed with caution.</div>

                    <SettingRow icon="trash" title="Delete Account" description="Permanently delete your account and all data" T={T} danger>
                      <button className="danger-btn">Delete Account</button>
                    </SettingRow>
                  </div>
                </div>
              )}

              {/* PREFERENCES */}
              {activeSection === "preferences" && (
                <div className="fi">
                  <div className="section-card">
                    <div className="section-title">Appearance &amp; Language</div>
                    <div className="section-sub">Customize how Recalla looks and which language to use.</div>

                    <SettingRow icon={dark?"moon":"sun"} title="Theme" description={`Currently using ${dark?"dark":"light"} mode`} T={T}>
                      <Toggle on={!dark} onChange={() => setDark(d => !d)}/>
                    </SettingRow>

                    <div className="field-group" style={{ paddingTop:14 }}>
                      <label className="field-label">Interface Language</label>
                      <select className="input-field" value={language} onChange={e=>setLanguage(e.target.value)} style={{ appearance:"none", cursor:"pointer" }}>
                        {["English","Urdu","Arabic","French","Spanish"].map(l => <option key={l} value={l} style={{ background:dark?"#1E2130":"#fff" }}>{l}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="section-card">
                    <div className="section-title">Notifications</div>
                    <div className="section-sub">Choose what you want to be notified about.</div>

                    <SettingRow icon="bell" title="In-app Notifications" description="Show notifications in the app" T={T}>
                      <Toggle on={notifications} onChange={setNotifications}/>
                    </SettingRow>

                    <SettingRow icon="mail" title="Email Notifications" description="Receive notifications via email" T={T}>
                      <Toggle on={emailNotif} onChange={setEmailNotif}/>
                    </SettingRow>

                    <SettingRow icon="zap" title="Reminder Sounds" description="Play sound when a reminder triggers" T={T}>
                      <Toggle on={reminderSounds} onChange={setReminderSounds}/>
                    </SettingRow>
                  </div>
                </div>
              )}

              {/* AI & MODELS */}
              {activeSection === "ai" && (
                <div className="fi">
                  <div className="section-card">
                    <div className="section-title">AI &amp; Transcription</div>
                    <div className="section-sub">Configure how Recalla processes your meetings.</div>

                    <div className="field-group" style={{ marginBottom:18 }}>
                      <label className="field-label">Default Transcription Language</label>
                      <select className="input-field" value={transcriptionLang} onChange={e=>setTranscriptionLang(e.target.value)} style={{ appearance:"none", cursor:"pointer" }}>
                        {["English","Urdu","Arabic","French","Spanish","German","Auto-detect"].map(l => <option key={l} value={l} style={{ background:dark?"#1E2130":"#fff" }}>{l}</option>)}
                      </select>
                    </div>

                    <div className="field-group" style={{ marginBottom:18 }}>
                      <label className="field-label">Whisper Model Size</label>
                      <div style={{ display:"flex", gap:7, flexWrap:"wrap" }}>
                        {[
                          { id:"tiny",   label:"Tiny",   info:"75 MB · Fastest"   },
                          { id:"base",   label:"Base",   info:"142 MB · Fast"     },
                          { id:"small",  label:"Small",  info:"466 MB · Balanced" },
                          { id:"medium", label:"Medium", info:"1.5 GB · Accurate" },
                        ].map(m => (
                          <button key={m.id} onClick={()=>setWhisperModel(m.id)} style={{
                            padding:"10px 14px", borderRadius:9,
                            border:`1px solid ${whisperModel===m.id ? T.borderStr : T.border}`,
                            background: whisperModel===m.id ? T.indigoGlow : T.surface,
                            color: whisperModel===m.id ? T.text1 : T.text2,
                            fontSize:12, fontWeight:600, cursor:"pointer",
                            transition:"all .2s", fontFamily:"'Inter',sans-serif",
                            textAlign:"left", minWidth:120,
                          }}>
                            <div>{m.label}</div>
                            <div style={{ fontSize:10, color:T.text3, marginTop:2, fontWeight:500 }}>{m.info}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <SettingRow icon="sparkle" title="Auto-Tagging" description="Automatically extract tags and entities from transcripts" T={T}>
                      <Toggle on={autoTagging} onChange={setAutoTagging}/>
                    </SettingRow>

                    <SettingRow icon="zap" title="Auto-Summary" description="Generate AI summaries for completed meetings" T={T}>
                      <Toggle on={autoSummary} onChange={setAutoSummary}/>
                    </SettingRow>

                    <SettingRow icon="user" title="Speaker Diarization" description="Identify different speakers automatically (beta)" T={T}>
                      <Toggle on={speakerDiarization} onChange={setSpeakerDiarization}/>
                    </SettingRow>
                  </div>
                </div>
              )}

              {/* INTEGRATIONS */}
              {activeSection === "integrations" && (
                <div className="fi">
                  <div className="section-card">
                    <div className="section-title">Connected Services</div>
                    <div className="section-sub">Connect Recalla with the tools you already use.</div>

                    {[
                      { key:"gmail",    name:"Gmail",            desc:"Send and read emails from Ask Recalla", icon:"mail",  iconColor:"#F43F5E" },
                      { key:"calendar", name:"Google Calendar",  desc:"Sync meetings to your calendar",         icon:"clock", iconColor:"#4285F4" },
                      { key:"slack",    name:"Slack",            desc:"Share meeting summaries to channels",    icon:"chat",  iconColor:"#A78BFA" },
                      { key:"drive",    name:"Google Drive",     desc:"Backup recordings and transcripts",      icon:"download",iconColor:"#10B981" },
                    ].map(s => (
                      <SettingRow key={s.key} icon={s.icon} iconColor={s.iconColor} title={s.name} description={s.desc} T={T}>
                        <button
                          className={`conn-btn ${integrations[s.key]?"connected":"disconnected"}`}
                          onClick={()=>toggleIntegration(s.key)}
                        >
                          {integrations[s.key] ? "✓ Connected" : "Connect"}
                        </button>
                      </SettingRow>
                    ))}
                  </div>
                </div>
              )}

              {/* PRIVACY */}
              {activeSection === "privacy" && (
                <div className="fi">
                  <div className="section-card">
                    <div className="section-title">Privacy &amp; Security</div>
                    <div className="section-sub">Control how your data is processed and stored.</div>

                    <SettingRow icon="shield" title="Process Audio Locally Only" description="Don't send audio to cloud — process on your device" T={T}>
                      <Toggle on={localOnly} onChange={setLocalOnly}/>
                    </SettingRow>

                    <SettingRow icon="zap" title="Auto-Save Recordings" description="Automatically save meetings after processing" T={T}>
                      <Toggle on={autoSave} onChange={setAutoSave}/>
                    </SettingRow>

                    <SettingRow icon="user" title="Usage Analytics" description="Help improve Recalla by sharing anonymous usage data" T={T}>
                      <Toggle on={analytics} onChange={setAnalytics}/>
                    </SettingRow>
                  </div>
                </div>
              )}

              {/* DATA */}
              {activeSection === "data" && (
                <div className="fi">
                  <div className="section-card">
                    <div className="section-title">Data &amp; Storage</div>
                    <div className="section-sub">Manage your storage and exported data.</div>

                    <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:20 }}>
                      {[
                        { val:"312 hours",  label:"Audio recorded" },
                        { val:"2,847",      label:"Memories stored" },
                        { val:"1.2 GB",     label:"Storage used"   },
                      ].map((s,i) => (
                        <div key={i} style={{ padding:16, background:T.indigoGlow, border:`1px solid ${T.borderStr}`, borderRadius:11 }}>
                          <div style={{ fontSize:20, fontWeight:800, color:dark?"#A5B4FC":"#4F46E5", letterSpacing:"-.5px" }}>{s.val}</div>
                          <div style={{ fontSize:11, color:T.text2, marginTop:3, fontWeight:500 }}>{s.label}</div>
                        </div>
                      ))}
                    </div>

                    <SettingRow icon="download" title="Export All Data" description="Download all your meetings and memories as JSON" T={T}>
                      <button className="conn-btn disconnected">Export</button>
                    </SettingRow>

                    <SettingRow icon="trash" title="Clear Cache" description="Remove temporary files and re-downloaded models" T={T}>
                      <button className="conn-btn disconnected">Clear</button>
                    </SettingRow>

                    <SettingRow icon="trash" title="Delete All Meetings" description="Permanently remove all meetings, transcripts, and memories" T={T} danger>
                      <button className="danger-btn">Delete All</button>
                    </SettingRow>
                  </div>
                </div>
              )}

              <div style={{ height:40 }}/>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}