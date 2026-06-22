import { useState, useEffect, useRef } from "react";

// ── SVG Icons ────────────────────────────────────────────────────────────────
const Icon = ({ name, size = 20, color = "currentColor" }) => {
  const s = { width: size, height: size, stroke: color, fill: "none", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };
  const icons = {
    mic:       <svg viewBox="0 0 24 24" {...s}><rect x="9" y="2" width="6" height="13" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="8" y1="22" x2="16" y2="22"/></svg>,
    brain:     <svg viewBox="0 0 24 24" {...s}><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/></svg>,
    clock:     <svg viewBox="0 0 24 24" {...s}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    search:    <svg viewBox="0 0 24 24" {...s}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    bell:      <svg viewBox="0 0 24 24" {...s}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
    chat:      <svg viewBox="0 0 24 24" {...s}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
    calendar:  <svg viewBox="0 0 24 24" {...s}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    layers:    <svg viewBox="0 0 24 24" {...s}><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
    settings:  <svg viewBox="0 0 24 24" {...s}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
    tag:       <svg viewBox="0 0 24 24" {...s}><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
    arrowRight:<svg viewBox="0 0 24 24" {...s}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
    plus:      <svg viewBox="0 0 24 24" {...s}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    zap:       <svg viewBox="0 0 24 24" {...s}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
    fileText:  <svg viewBox="0 0 24 24" {...s}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
    trendUp:   <svg viewBox="0 0 24 24" {...s}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
    menu:      <svg viewBox="0 0 24 24" {...s}><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
    sun:       <svg viewBox="0 0 24 24" {...s}><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
    moon:      <svg viewBox="0 0 24 24" {...s}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
  };
  return icons[name] || null;
};

// ── Animated Counter ──────────────────────────────────────────────────────────
const Counter = ({ end, suffix = "" }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const ran = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !ran.current) {
        ran.current = true;
        let cur = 0;
        const step = end / 80;
        const t = setInterval(() => {
          cur = Math.min(cur + step, end);
          setCount(Math.floor(cur));
          if (cur >= end) clearInterval(t);
        }, 16);
      }
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [end]);
  return <span ref={ref}>{count}{suffix}</span>;
};

// ── Waveform ──────────────────────────────────────────────────────────────────
const Waveform = ({ active }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 3, height: 24 }}>
    {[0.4, 0.7, 1, 0.8, 0.5, 0.9, 0.6, 1, 0.7, 0.4].map((h, i) => (
      <div key={i} style={{
        width: 3, borderRadius: 2,
        background: active ? "linear-gradient(180deg,#6366F1,#22D3EE)" : "rgba(99,102,241,0.35)",
        height: `${h * 100}%`,
        animation: active ? `wave ${0.8 + i * 0.1}s ease-in-out ${i * 0.08}s infinite alternate` : "none",
        transition: "background 0.3s",
      }} />
    ))}
  </div>
);

// ── Pulse Rings ───────────────────────────────────────────────────────────────
const PulseRing = () => (
  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
    {[0, 1, 2].map(i => (
      <div key={i} style={{ position: "absolute", width: 110, height: 110, borderRadius: "50%", border: "1px solid rgba(99,102,241,0.35)", animation: "pulse-ring 2.5s ease-out infinite", animationDelay: `${i * 0.83}s` }} />
    ))}
  </div>
);

// ── Theme tokens ──────────────────────────────────────────────────────────────
const DARK = {
  bg:          "#080B12",
  sidebar:     "rgba(8,11,18,0.97)",
  topbar:      "rgba(8,11,18,0.85)",
  surface:     "rgba(255,255,255,0.05)",
  surfaceHov:  "rgba(255,255,255,0.09)",
  border:      "rgba(255,255,255,0.09)",
  borderStr:   "rgba(99,102,241,0.45)",
  indigoGlow:  "rgba(99,102,241,0.15)",
  text1:       "#F9FAFB",
  text2:       "#C4C9D4",
  text3:       "#6B7280",
  heroGrad:    "linear-gradient(135deg,rgba(99,102,241,0.09) 0%,rgba(34,211,238,0.05) 100%)",
  cardBox:     "0 10px 28px rgba(0,0,0,0.35)",
  scrollbar:   "rgba(255,255,255,0.1)",
  tagBg:       "rgba(99,102,241,0.14)",
  tagBorder:   "rgba(99,102,241,0.28)",
  tagColor:    "#A5B4FC",
  statusProBg: "rgba(34,211,238,0.12)",
  statusProCl: "#22D3EE",
  statusProBr: "rgba(34,211,238,0.25)",
  statusIngBg: "rgba(251,191,36,0.12)",
  statusIngCl: "#FBBF24",
  statusIngBr: "rgba(251,191,36,0.25)",
  addBtnBg:    "rgba(99,102,241,0.14)",
  addBtnBr:    "rgba(99,102,241,0.35)",
  addBtnCl:    "#A5B4FC",
};

const LIGHT = {
  bg:          "#F4F6FB",
  sidebar:     "#FFFFFF",
  topbar:      "rgba(255,255,255,0.92)",
  surface:     "#FFFFFF",
  surfaceHov:  "#F0F3FA",
  border:      "rgba(0,0,0,0.08)",
  borderStr:   "rgba(99,102,241,0.5)",
  indigoGlow:  "rgba(99,102,241,0.10)",
  text1:       "#111827",
  text2:       "#374151",
  text3:       "#9CA3AF",
  heroGrad:    "linear-gradient(135deg,rgba(99,102,241,0.08) 0%,rgba(34,211,238,0.06) 100%)",
  cardBox:     "0 2px 12px rgba(0,0,0,0.07)",
  scrollbar:   "rgba(0,0,0,0.12)",
  tagBg:       "rgba(99,102,241,0.10)",
  tagBorder:   "rgba(99,102,241,0.22)",
  tagColor:    "#4F46E5",
  statusProBg: "rgba(5,150,105,0.10)",
  statusProCl: "#059669",
  statusProBr: "rgba(5,150,105,0.22)",
  statusIngBg: "rgba(217,119,6,0.10)",
  statusIngCl: "#D97706",
  statusIngBr: "rgba(217,119,6,0.22)",
  addBtnBg:    "rgba(99,102,241,0.09)",
  addBtnBr:    "rgba(99,102,241,0.28)",
  addBtnCl:    "#4F46E5",
};

// ── Data ──────────────────────────────────────────────────────────────────────
const meetings = [
  { id: 1, title: "Product Sprint Planning",    time: "2h 14m", date: "Today, 10:00 AM",    tags: ["Sprint","Product"],      summary: "Discussed Q3 roadmap and prioritised feature backlog. Action items assigned to frontend team.", status: "processed" },
  { id: 2, title: "Investor Pitch Review",       time: "45m",    date: "Today, 2:30 PM",     tags: ["Investor","Finance"],    summary: "Reviewed slide deck, refined messaging on TAM slide. Follow-up scheduled for Thursday.",       status: "processing" },
  { id: 3, title: "UX Research Debrief",         time: "1h 08m", date: "Yesterday, 11:00 AM",tags: ["Research","UX"],         summary: "Key insight: users struggle with onboarding step 3. Proposed simplified flow with inline hints.",status: "processed" },
  { id: 4, title: "Backend Architecture Sync",   time: "32m",    date: "Yesterday, 4:00 PM", tags: ["Engineering","Backend"], summary: "Agreed on microservices split. ChromaDB integration timeline confirmed for next sprint.",        status: "processed" },
];

const reminders = [
  { id: 1, text: "Send revised pitch deck to Ahmed",      time: "4:00 PM today",        urgent: true  },
  { id: 2, text: "Review PR for memory retrieval module", time: "Tomorrow, 10:00 AM",   urgent: false },
  { id: 3, text: "Team standup recording",                time: "Tomorrow, 9:00 AM",    urgent: false },
];

const navItems = [
  { icon: "layers",   label: "Dashboard"   },
  { icon: "mic",      label: "Meetings"    },
  { icon: "brain",    label: "Memory"      },
  { icon: "chat",     label: "Ask Recalla" },
  { icon: "bell",     label: "Reminders"   },
  { icon: "clock",    label: "Timeline"    },
  { icon: "settings", label: "Settings"    },
];

const STATS = [
  { icon: "mic",      color: "#6366F1", bgD: "rgba(99,102,241,0.14)",  bgL: "rgba(99,102,241,0.10)",  num: 47,   suffix: "",  label: "Meetings Recorded",  delta: "+12%" },
  { icon: "fileText", color: "#22D3EE", bgD: "rgba(34,211,238,0.12)",  bgL: "rgba(34,211,238,0.09)",  num: 312,  suffix: "",  label: "Hours Transcribed",  delta: "+8%"  },
  { icon: "brain",    color: "#A78BFA", bgD: "rgba(167,139,250,0.14)", bgL: "rgba(167,139,250,0.10)", num: 2847, suffix: "",  label: "Memories Stored",    delta: "+24%" },
  { icon: "zap",      color: "#F59E0B", bgD: "rgba(245,158,11,0.12)",  bgL: "rgba(245,158,11,0.09)",  num: 98,   suffix: "%", label: "Query Accuracy",     delta: "+2%"  },
];

// ── nav label → route key map ─────────────────────────────────────────────────
const NAV_ROUTES = {
  "Dashboard":   "dashboard",
  "Meetings":    "meetings",
  "Memory":      "memory",
  "Ask Recalla": "ask",
  "Reminders":   "reminders",
  "Timeline":    "timeline",
  "Settings":    "settings",
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function RecallaDashboard({ navigate: navProp, dark: darkProp, setDark: setDarkProp, sidebarOpen: sidebarProp, setSidebarOpen: setSidebarProp } = {}) {
  const [darkLocal, setDarkLocal]               = useState(true);
  const [sidebarLocal, setSidebarLocal]         = useState(true);
  const [recording, setRecording]               = useState(false);
  const [activeNav, setActiveNav]               = useState("Dashboard");

  // Use props from App router if provided, otherwise use local state
  const dark          = darkProp          !== undefined ? darkProp          : darkLocal;
  const setDark       = setDarkProp       !== undefined ? setDarkProp       : setDarkLocal;
  const sidebarOpen   = sidebarProp       !== undefined ? sidebarProp       : sidebarLocal;
  const setSidebarOpen= setSidebarProp    !== undefined ? setSidebarProp    : setSidebarLocal;

  const handleNav = (label) => {
    setActiveNav(label);
    if (navProp) navProp(NAV_ROUTES[label] || "dashboard");
  };

  const T = dark ? DARK : LIGHT;

  // CSS string — rebuilt on every theme/state change
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body, #root { height: 100%; width: 100%; overflow: hidden; }
    body { font-family: 'Inter', sans-serif; background: ${T.bg}; color: ${T.text1}; transition: background .3s, color .3s; }

    /* scrollbar */
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: ${T.scrollbar}; border-radius: 2px; }
    * { scrollbar-width: thin; scrollbar-color: ${T.scrollbar} transparent; }

    /* layout */
    .app  { display: flex; height: 100vh; width: 100vw; overflow: hidden; }
    .main { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0; }

    /* sidebar */
    .sb {
      width: ${sidebarOpen ? "236px" : "68px"};
      flex-shrink: 0;
      background: ${T.sidebar};
      border-right: 1px solid ${T.border};
      display: flex; flex-direction: column;
      padding: 18px 10px; gap: 3px;
      transition: width .3s cubic-bezier(.4,0,.2,1), background .3s;
      position: relative; z-index: 10; overflow: hidden;
    }
    .logo { display: flex; align-items: center; gap: 10px; padding: 6px 10px 18px; border-bottom: 1px solid ${T.border}; margin-bottom: 6px; white-space: nowrap; }
    .lmark { width: 30px; height: 30px; background: linear-gradient(135deg,#6366F1,#22D3EE); border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 0 14px rgba(99,102,241,.35); }
    .ltxt  { font-size: 16px; font-weight: 800; letter-spacing: -.5px; color: ${T.text1}; white-space: nowrap; }
    .ltxt span { color: #6366F1; }
    .nav-lbl { opacity: ${sidebarOpen ? 1 : 0}; transition: opacity .2s; white-space: nowrap; overflow: hidden; }

    .ni {
      display: flex; align-items: center; gap: 10px;
      padding: 9px 10px; border-radius: 9px; cursor: pointer;
      transition: all .2s; color: ${T.text2};
      font-size: 13px; font-weight: 500;
      border: 1px solid transparent; position: relative; overflow: hidden;
    }
    .ni:hover  { background: ${T.surfaceHov}; color: ${T.text1}; }
    .ni.act    { background: ${T.indigoGlow}; border-color: ${T.borderStr}; color: ${T.text1}; }
    .ni.act::before { content:''; position:absolute; left:0; top:20%; bottom:20%; width:2px; background:#6366F1; border-radius:0 2px 2px 0; box-shadow:0 0 8px #6366F1; }

    .sb-toggle {
      position: absolute; top: 20px; right: -11px;
      width: 22px; height: 22px;
      background: ${T.sidebar}; border: 1px solid ${T.border};
      border-radius: 50%; display: flex; align-items: center; justify-content: center;
      cursor: pointer; color: ${T.text3}; z-index: 20; transition: all .2s;
    }
    .sb-toggle:hover { border-color: #6366F1; color: #6366F1; }

    .usr { margin-top: auto; padding-top: 10px; border-top: 1px solid ${T.border}; }
    .av-sm { width: 26px; height: 26px; border-radius: 50%; background: linear-gradient(135deg,#6366F1,#22D3EE); display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:700; color:#fff; flex-shrink:0; }

    /* topbar */
    .topbar {
      height: 60px; border-bottom: 1px solid ${T.border};
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 24px; background: ${T.topbar};
      backdrop-filter: blur(20px); flex-shrink: 0; transition: background .3s;
    }
    .tb-title  { font-size: 15px; font-weight: 700; letter-spacing: -.3px; color: ${T.text1}; }
    .tb-date   { font-size: 11px; color: ${T.text3}; margin-top: 1px; }
    .sw {
      display: flex; align-items: center; gap: 8px;
      background: ${T.surface}; border: 1px solid ${T.border};
      border-radius: 9px; padding: 7px 12px; width: 280px; transition: all .2s;
    }
    .sw:focus-within { border-color: ${T.borderStr}; box-shadow: 0 0 0 3px ${T.indigoGlow}; }
    .sw input { background: none; border: none; outline: none; color: ${T.text1}; font-family:'Inter',sans-serif; font-size: 13px; width: 100%; }
    .sw input::placeholder { color: ${T.text3}; }
    .tbr { display: flex; align-items: center; gap: 10px; }
    .ibtn { width: 34px; height: 34px; display:flex; align-items:center; justify-content:center; background:${T.surface}; border:1px solid ${T.border}; border-radius:8px; cursor:pointer; color:${T.text2}; transition:all .2s; position:relative; }
    .ibtn:hover { background:${T.surfaceHov}; color:${T.text1}; border-color:${T.borderStr}; }
    .ndot { position:absolute; top:7px; right:7px; width:6px; height:6px; background:#F43F5E; border-radius:50%; border:1.5px solid ${T.bg}; animation:breathe 2s ease-in-out infinite; }
    .av   { width:34px; height:34px; border-radius:50%; background:linear-gradient(135deg,#6366F1,#22D3EE); display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700; color:#fff; cursor:pointer; transition:box-shadow .2s; }
    .av:hover { box-shadow:0 0 0 2px #6366F1; }

    /* theme toggle */
    .theme-btn {
      display: flex; align-items: center; gap: 6px;
      padding: 6px 12px; border-radius: 20px;
      background: ${T.indigoGlow}; border: 1px solid ${T.borderStr};
      color: ${dark ? "#A5B4FC" : "#4F46E5"}; font-size: 12px; font-weight: 600;
      cursor: pointer; transition: all .2s; font-family:'Inter',sans-serif;
      white-space: nowrap;
    }
    .theme-btn:hover { background: ${dark ? "rgba(99,102,241,0.25)" : "rgba(99,102,241,0.18)"}; }

    /* content area */
    .cnt { flex:1; overflow-y:auto; padding:22px 24px; display:flex; flex-direction:column; gap:20px; }

    /* hero */
    .hero {
      position:relative; background:${T.heroGrad};
      border:1px solid ${T.border}; border-radius:18px;
      padding:26px 30px; overflow:visible;
      display:flex; align-items:center; justify-content:space-between; gap:20px;
      box-shadow: ${T.cardBox};
    }
    .hbg  { position:absolute; top:-50px; right:-50px; width:260px; height:260px; background:radial-gradient(circle,rgba(99,102,241,.1) 0%,transparent 70%); pointer-events:none; animation:float 6s ease-in-out infinite; }
    .hbg2 { position:absolute; bottom:-70px; left:25%; width:180px; height:180px; background:radial-gradient(circle,rgba(34,211,238,.07) 0%,transparent 70%); pointer-events:none; animation:float 8s ease-in-out infinite reverse; }
    .hl   { position:relative; z-index:1; }
    .greet    { font-size:11px; color:${T.text2}; font-weight:600; margin-bottom:5px; letter-spacing:.8px; text-transform:uppercase; }
    .h-title  { font-size:24px; font-weight:800; letter-spacing:-.8px; line-height:1.2; margin-bottom:7px; color:${T.text1}; }
    .h-title span { background:linear-gradient(90deg,#6366F1,#22D3EE); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
    .h-sub    { font-size:13px; color:${T.text2}; line-height:1.7; max-width:320px; }
    .h-btns   { margin-top:18px; display:flex; gap:8px; flex-wrap:wrap; }

    .rec-btn {
      background:linear-gradient(135deg,#6366F1,#818CF8); color:#fff; border:none;
      border-radius:8px; padding:9px 17px; font-size:13px; font-weight:600;
      cursor:pointer; display:flex; align-items:center; gap:6px;
      transition:all .2s; font-family:'Inter',sans-serif;
      box-shadow:0 4px 14px rgba(99,102,241,.35);
    }
    .rec-btn:hover   { transform:translateY(-1px); box-shadow:0 6px 22px rgba(99,102,241,.45); }
    .rec-btn.active  { background:linear-gradient(135deg,#F43F5E,#FB7185); box-shadow:0 4px 14px rgba(244,63,94,.35); }
    .rec-btn.active:hover { box-shadow:0 6px 22px rgba(244,63,94,.45); }

    .add-btn {
      display:flex; align-items:center; gap:6px;
      padding:9px 15px; background:${T.addBtnBg}; border:1px solid ${T.addBtnBr};
      border-radius:8px; color:${T.addBtnCl}; font-size:13px; font-weight:500;
      cursor:pointer; transition:all .2s; font-family:'Inter',sans-serif;
    }
    .add-btn:hover { background:${dark ? "rgba(99,102,241,0.22)" : "rgba(99,102,241,0.16)"}; color:${dark ? "#fff" : "#4F46E5"}; }

    .rec-area  { position:relative; display:flex; flex-direction:column; align-items:center; gap:10px; z-index:1; }
    .rec-circle {
      width:72px; height:72px; border-radius:50%;
      background:${recording ? "linear-gradient(135deg,#F43F5E,#FB7185)" : "linear-gradient(135deg,#6366F1,#818CF8)"};
      display:flex; align-items:center; justify-content:center; cursor:pointer;
      transition:all .3s cubic-bezier(.4,0,.2,1);
      box-shadow:${recording ? "0 0 36px rgba(244,63,94,.45)" : "0 0 28px rgba(99,102,241,.35)"};
      position:relative;
    }
    .rec-circle:hover  { transform:scale(1.06); }
    .rec-circle:active { transform:scale(0.95); }
    .rec-lbl { font-size:11px; color:${T.text2}; font-weight:500; letter-spacing:.5px; }

    /* stats */
    .sg { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; }
    .sc {
      background:${T.surface}; border:1px solid ${T.border};
      border-radius:var(--r,14px); padding:18px; cursor:default;
      transition:all .25s; position:relative; overflow:hidden;
      box-shadow:${T.cardBox};
    }
    .sc::before { content:''; position:absolute; top:0; left:0; right:0; height:1px; background:linear-gradient(90deg,transparent,#6366F1,transparent); opacity:0; transition:opacity .3s; }
    .sc:hover { background:${T.surfaceHov}; border-color:rgba(99,102,241,.3); transform:translateY(-2px); box-shadow:${dark ? "0 12px 32px rgba(0,0,0,.4)" : "0 8px 24px rgba(99,102,241,.12)"}; }
    .sc:hover::before { opacity:1; }
    .sic { width:34px; height:34px; border-radius:8px; display:flex; align-items:center; justify-content:center; margin-bottom:12px; }
    .sn  { font-size:26px; font-weight:800; letter-spacing:-1px; }
    .sl  { font-size:11px; color:${T.text2}; font-weight:500; margin-top:3px; }
    .sd  { display:flex; align-items:center; gap:4px; margin-top:7px; font-size:11px; font-weight:600; color:#10B981; }

    /* query box */
    .qb   { background:${T.surface}; border:1px solid ${T.border}; border-radius:14px; padding:18px; box-shadow:${T.cardBox}; }
    .qh   { font-size:13px; font-weight:600; margin-bottom:12px; display:flex; align-items:center; gap:7px; color:${T.text1}; }
    .qiw  { display:flex; align-items:center; gap:8px; background:${dark ? "rgba(0,0,0,.25)" : "rgba(0,0,0,.04)"}; border:1px solid ${T.border}; border-radius:9px; padding:10px 12px; margin-bottom:10px; transition:all .2s; }
    .qiw:focus-within { border-color:${T.borderStr}; box-shadow:0 0 0 3px ${T.indigoGlow}; }
    .qi   { flex:1; background:none; border:none; outline:none; color:${T.text1}; font-family:'Inter',sans-serif; font-size:13px; }
    .qi::placeholder { color:${T.text3}; }
    .qsend { background:linear-gradient(135deg,#6366F1,#818CF8); color:#fff; border:none; border-radius:7px; padding:7px 14px; font-size:12px; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:5px; transition:all .2s; font-family:'Inter',sans-serif; box-shadow:0 3px 10px rgba(99,102,241,.3); white-space:nowrap; }
    .qsend:hover { transform:translateY(-1px); box-shadow:0 5px 16px rgba(99,102,241,.4); }
    .qs   { display:flex; gap:7px; flex-wrap:wrap; }
    .qc   { font-size:11px; padding:5px 11px; border-radius:20px; background:${dark ? "rgba(255,255,255,.05)" : "rgba(0,0,0,.05)"}; border:1px solid ${T.border}; color:${T.text2}; cursor:pointer; transition:all .2s; font-family:'Inter',sans-serif; }
    .qc:hover { border-color:${T.borderStr}; color:${T.text1}; background:${T.indigoGlow}; }

    /* two col */
    .tc  { display:grid; grid-template-columns:1fr 300px; gap:18px; }
    .gc  { background:${T.surface}; border:1px solid ${T.border}; border-radius:14px; overflow:hidden; box-shadow:${T.cardBox}; }
    .ch  { display:flex; align-items:center; justify-content:space-between; padding:14px 18px; border-bottom:1px solid ${T.border}; }
    .ct  { font-size:13px; font-weight:600; display:flex; align-items:center; gap:7px; color:${T.text1}; }
    .va  { font-size:12px; color:#6366F1; cursor:pointer; display:flex; align-items:center; gap:4px; font-weight:500; transition:gap .2s; background:none; border:none; padding:0; }
    .va:hover { gap:7px; }
    .add2 { display:flex; align-items:center; gap:4px; padding:4px 9px; background:${T.addBtnBg}; border:1px solid ${T.addBtnBr}; border-radius:7px; color:${T.addBtnCl}; font-size:11px; font-weight:500; cursor:pointer; transition:all .2s; font-family:'Inter',sans-serif; }
    .add2:hover { background:${dark ? "rgba(99,102,241,0.22)" : "rgba(99,102,241,0.16)"}; }

    /* meeting rows */
    .mr  { display:flex; align-items:flex-start; gap:12px; padding:13px 18px; border-bottom:1px solid ${T.border}; cursor:pointer; transition:background .15s; position:relative; }
    .mr:last-child { border-bottom:none; }
    .mr:hover { background:${T.surfaceHov}; }
    .mr:hover .ma { opacity:1; transform:translateY(-50%) translateX(0); }
    .md  { width:7px; height:7px; border-radius:50%; flex-shrink:0; margin-top:5px; }
    .mi  { flex:1; min-width:0; }
    .mt  { font-size:13px; font-weight:600; margin-bottom:3px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; display:flex; align-items:center; gap:7px; color:${T.text1}; }
    .mm  { display:flex; align-items:center; gap:8px; font-size:11px; color:${T.text2}; margin-bottom:5px; }
    .mm span { display:flex; align-items:center; gap:3px; }
    .ms  { font-size:12px; color:${T.text3}; line-height:1.55; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
    .tgs { display:flex; gap:5px; flex-wrap:wrap; margin-top:7px; }
    .tg  { font-size:10px; font-weight:600; padding:2px 8px; border-radius:20px; background:${T.tagBg}; border:1px solid ${T.tagBorder}; color:${T.tagColor}; }
    .ma  { position:absolute; right:18px; top:50%; transform:translateY(-50%) translateX(4px); opacity:0; transition:all .2s; color:#6366F1; }
    .sb2 { font-size:10px; font-weight:600; padding:2px 7px; border-radius:20px; text-transform:uppercase; letter-spacing:.5px; }
    .sp  { background:${T.statusProBg}; color:${T.statusProCl}; border:1px solid ${T.statusProBr}; }
    .spr { background:${T.statusIngBg}; color:${T.statusIngCl}; border:1px solid ${T.statusIngBr}; animation:breathe 2s ease-in-out infinite; }

    /* reminders */
    .ri  { display:flex; align-items:flex-start; gap:10px; padding:12px 18px; border-bottom:1px solid ${T.border}; cursor:pointer; transition:background .15s; }
    .ri:last-child { border-bottom:none; }
    .ri:hover { background:${T.surfaceHov}; }
    .rind { width:3px; align-self:stretch; border-radius:2px; flex-shrink:0; margin-top:2px; }
    .rtx  { font-size:12px; font-weight:500; line-height:1.4; margin-bottom:2px; color:${T.text1}; }
    .rtm  { font-size:10px; color:${T.text3}; font-family:'JetBrains Mono',monospace; }
    .nb   { background:#F43F5E; color:#fff; border-radius:20px; font-size:9px; font-weight:700; padding:1px 5px; }

    /* keyframes */
    @keyframes wave       { 0%{transform:scaleY(.4)} 100%{transform:scaleY(1)} }
    @keyframes breathe    { 0%,100%{opacity:1} 50%{opacity:.45} }
    @keyframes float      { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-18px)} }
    @keyframes pulse-ring { 0%{transform:scale(.8);opacity:.6} 100%{transform:scale(2.2);opacity:0} }
    @keyframes fade-in    { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
    .fi  { animation:fade-in .4s ease forwards; }
    .fi1 { animation-delay:.05s; opacity:0; }
    .fi2 { animation-delay:.1s;  opacity:0; }
    .fi3 { animation-delay:.15s; opacity:0; }
    .fi4 { animation-delay:.2s;  opacity:0; }
  `;

  return (
    <>
      <style>{css}</style>
      <div className="app">

        {/* ── Sidebar ── */}
        <aside className="sb">
          <div className="logo">
            <div className="lmark">
              <Icon name="brain" size={16} color="#fff" />
            </div>
            {sidebarOpen && <div className="ltxt">Re<span>calla</span></div>}
          </div>

          {navItems.map(item => (
            <div
              key={item.label}
              className={`ni${activeNav === item.label ? " act" : ""}`}
              onClick={() => handleNav(item.label)}
            >
              <Icon name={item.icon} size={16} color={activeNav === item.label ? "#6366F1" : T.text2} />
              <span className="nav-lbl">{item.label}</span>
            </div>
          ))}

          <div className="usr">
            <div className="ni">
              <div className="av-sm">AA</div>
              {sidebarOpen && (
                <div style={{ overflow: "hidden" }}>
                  <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", color: T.text1 }}>Ammad Ahmad</div>
                  <div style={{ fontSize: 10, color: T.text3, whiteSpace: "nowrap" }}>BSCS · 50908</div>
                </div>
              )}
            </div>
          </div>

          <div className="sb-toggle" onClick={() => setSidebarOpen(p => !p)}>
            <Icon name="menu" size={11} color={T.text3} />
          </div>
        </aside>

        {/* ── Main ── */}
        <main className="main">

          {/* Topbar */}
          <div className="topbar">
            <div>
              <div className="tb-title">Dashboard</div>
              <div className="tb-date">Monday, 16 June 2026</div>
            </div>

            <div className="sw">
              <Icon name="search" size={14} color={T.text3} />
              <input placeholder="Search meetings, memories…" />
            </div>

            <div className="tbr">
              {/* Theme toggle */}
              <button className="theme-btn" onClick={() => setDark(d => !d)}>
                <Icon name={dark ? "sun" : "moon"} size={13} color={dark ? "#A5B4FC" : "#4F46E5"} />
                {dark ? "Light mode" : "Dark mode"}
              </button>
              <div className="ibtn">
                <Icon name="bell" size={15} color={T.text2} />
                <div className="ndot" />
              </div>
              <div className="av">AA</div>
            </div>
          </div>

          {/* Scrollable content */}
          <div className="cnt">

            {/* Hero */}
            <div className="hero fi fi1">
              <div className="hbg" /><div className="hbg2" />
              <div className="hl">
                <div className="greet">Good morning</div>
                <div className="h-title">Your memory is<br /><span>always on.</span></div>
                <div className="h-sub">4 meetings processed today. 3 reminders pending. Ask Recalla anything about your past conversations.</div>
                <div className="h-btns">
                  <button
                    className="rec-btn"
                    onClick={() => navProp ? navProp("record") : setRecording(r => !r)}
                  >
                    <Icon name="mic" size={13} color="#fff" />
                    Start Recording
                  </button>
                  <button className="add-btn">
                    <Icon name="plus" size={13} color={T.addBtnCl} />
                    Add Note
                  </button>
                </div>
              </div>

              <div className="rec-area">
                <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {recording && <PulseRing />}
                  <div className="rec-circle" onClick={() => setRecording(r => !r)}>
                    <Icon name="mic" size={26} color="#fff" />
                  </div>
                </div>
                <Waveform active={recording} />
                <div className="rec-lbl">{recording ? "Recording…" : "Tap to record"}</div>
              </div>
            </div>

            {/* Stats */}
            <div className="sg fi fi2">
              {STATS.map((s, i) => (
                <div className="sc" key={i}>
                  <div className="sic" style={{ background: dark ? s.bgD : s.bgL }}>
                    <Icon name={s.icon} size={15} color={s.color} />
                  </div>
                  <div className="sn" style={{ color: s.color }}>
                    <Counter end={s.num} suffix={s.suffix} />
                  </div>
                  <div className="sl">{s.label}</div>
                  <div className="sd">
                    <Icon name="trendUp" size={10} color="#10B981" />
                    {s.delta} this week
                  </div>
                </div>
              ))}
            </div>

            {/* Ask Recalla */}
            <div className="qb fi fi3">
              <div className="qh">
                <Icon name="chat" size={13} color="#6366F1" />
                Ask Recalla anything
              </div>
              <div className="qiw">
                <Icon name="search" size={14} color={T.text3} />
                <input className="qi" placeholder="What did we decide about the backend architecture?" />
                <button className="qsend" onClick={() => navProp && navProp("ask")}>
                  <Icon name="zap" size={12} color="#fff" />
                  Ask
                </button>
              </div>
              <div className="qs">
                {["What tasks are overdue?", "Summarise yesterday's meetings", "Who mentioned deployment?", "Show Q3 decisions"].map(s => (
                  <button key={s} className="qc">{s}</button>
                ))}
              </div>
            </div>

            {/* Two-col */}
            <div className="tc fi fi4">

              {/* Recent meetings */}
              <div className="gc">
                <div className="ch">
                  <div className="ct">
                    <Icon name="mic" size={13} color="#6366F1" />
                    Recent Meetings
                  </div>
                  <button className="va" onClick={() => navProp && navProp("meetings")}>
                    View all <Icon name="arrowRight" size={11} color="#6366F1" />
                  </button>
                </div>
                {meetings.map(m => (
                  <div className="mr" key={m.id} onClick={() => navProp && navProp("detail", m)}>
                    <div className="md" style={{ background: m.status === "processed" ? "#22D3EE" : "#FBBF24" }} />
                    <div className="mi">
                      <div className="mt">
                        {m.title}
                        <span className={`sb2 ${m.status === "processed" ? "sp" : "spr"}`}>{m.status}</span>
                      </div>
                      <div className="mm">
                        <span><Icon name="clock" size={10} color={T.text2} />{m.time}</span>
                        <span><Icon name="calendar" size={10} color={T.text2} />{m.date}</span>
                      </div>
                      <div className="ms">{m.summary}</div>
                      <div className="tgs">{m.tags.map(t => <span key={t} className="tg">{t}</span>)}</div>
                    </div>
                    <div className="ma"><Icon name="arrowRight" size={13} color="#6366F1" /></div>
                  </div>
                ))}
              </div>

              {/* Right col */}
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                {/* Reminders */}
                <div className="gc">
                  <div className="ch">
                    <div className="ct">
                      <Icon name="bell" size={13} color="#F59E0B" />
                      Reminders
                      <div className="nb">{reminders.filter(r => r.urgent).length}</div>
                    </div>
                    <button className="add2">
                      <Icon name="plus" size={11} color={T.addBtnCl} />
                      Add
                    </button>
                  </div>
                  {reminders.map(r => (
                    <div className="ri" key={r.id}>
                      <div className="rind" style={{ background: r.urgent ? "#F43F5E" : "#6366F1" }} />
                      <div>
                        <div className="rtx">{r.text}</div>
                        <div className="rtm">{r.time}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Active Tags */}
                <div className="gc">
                  <div className="ch">
                    <div className="ct">
                      <Icon name="tag" size={13} color="#22D3EE" />
                      Active Tags
                    </div>
                  </div>
                  <div style={{ padding: "14px 18px", display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {["Sprint","Product","Investor","Finance","Research","UX","Engineering","Backend"].map(t => (
                      <span key={t} className="tg">{t}</span>
                    ))}
                  </div>
                </div>

              </div>
            </div>

            <div style={{ height: 12 }} />
          </div>
        </main>
      </div>
    </>
  );
}