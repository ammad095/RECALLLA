import { useState } from "react";

// ── Page imports ──────────────────────────────────────────────────────────────
import RecallaDashboard from "./RecallaDashboard";
import MeetingsList     from "./MeetingsList";
import RecordMeeting    from "./RecordMeeting";
import MeetingDetail    from "./MeetingDetail";
import AskRecalla       from "./AskRecalla";
import Reminders        from "./Reminders";
import Timeline         from "./Timeline";
import Memory           from "./Memory";
import Settings         from "./Settings";
import Auth             from "./Auth";
import Admin            from "./Admin";

// ── Pages that don't exist yet show a placeholder ─────────────────────────────
const ComingSoon = ({ page, navigate, dark, setDark, sidebarOpen, setSidebarOpen }) => {
  const bg     = dark ? "#080B12" : "#F4F6FB";
  const text1  = dark ? "#F9FAFB" : "#111827";
  const text2  = dark ? "#C4C9D4" : "#374151";
  const border = dark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.08)";
  const surface= dark ? "rgba(255,255,255,0.05)" : "#FFFFFF";

  const NAV = [
    { icon:"layers",   label:"Dashboard",   page:"dashboard" },
    { icon:"mic",      label:"Meetings",    page:"meetings"  },
    { icon:"brain",    label:"Memory",      page:"memory"    },
    { icon:"chat",     label:"Ask Recalla", page:"ask"       },
    { icon:"bell",     label:"Reminders",   page:"reminders" },
    { icon:"clock",    label:"Timeline",    page:"timeline"  },
    { icon:"settings", label:"Settings",    page:"settings"  },
  ];

  const icons = {
    layers:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
    mic:      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="2" width="6" height="13" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/><line x1="12" y1="19" x2="12" y2="22"/></svg>,
    brain:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/></svg>,
    chat:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
    bell:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
    clock:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    settings: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83"/></svg>,
    menu:     <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
    sun:      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/></svg>,
    moon:     <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
  };

  return (
    <div style={{ display:"flex", height:"100vh", width:"100vw", overflow:"hidden", background:bg, fontFamily:"'Inter',sans-serif" }}>
      {/* Sidebar */}
      <aside style={{ width:sidebarOpen?"236px":"68px", flexShrink:0, background:dark?"rgba(8,11,18,0.97)":"#FFFFFF", borderRight:`1px solid ${border}`, display:"flex", flexDirection:"column", padding:"18px 10px", gap:3, transition:"width .3s", position:"relative", overflow:"hidden" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"6px 10px 18px", borderBottom:`1px solid ${border}`, marginBottom:6, whiteSpace:"nowrap" }}>
          <div style={{ width:30, height:30, background:"linear-gradient(135deg,#6366F1,#22D3EE)", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            {icons.brain}
          </div>
          {sidebarOpen && <span style={{ fontSize:16, fontWeight:800, color:text1 }}>Re<span style={{color:"#6366F1"}}>calla</span></span>}
        </div>
        {NAV.map(item => (
          <div key={item.label}
            onClick={() => navigate(item.page)}
            style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 10px", borderRadius:9, cursor:"pointer", color:item.page===page?"#F9FAFB":text2, background:item.page===page?"rgba(99,102,241,0.15)":"transparent", border:`1px solid ${item.page===page?"rgba(99,102,241,0.45)":"transparent"}`, fontSize:13, fontWeight:500, transition:"all .2s", position:"relative", overflow:"hidden" }}
          >
            {item.page===page && <div style={{ position:"absolute", left:0, top:"20%", bottom:"20%", width:2, background:"#6366F1", borderRadius:"0 2px 2px 0", boxShadow:"0 0 8px #6366F1" }}/>}
            <span style={{ color:item.page===page?"#6366F1":text2 }}>{icons[item.icon]}</span>
            {sidebarOpen && <span style={{ whiteSpace:"nowrap", overflow:"hidden" }}>{item.label}</span>}
          </div>
        ))}
        <div style={{ marginTop:"auto", paddingTop:10, borderTop:`1px solid ${border}` }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 10px", borderRadius:9, cursor:"default" }}>
            <div style={{ width:26, height:26, borderRadius:"50%", background:"linear-gradient(135deg,#6366F1,#22D3EE)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:700, color:"#fff", flexShrink:0 }}>AA</div>
            {sidebarOpen && <div><div style={{ fontSize:12, fontWeight:600, color:text1, whiteSpace:"nowrap" }}>Ammad Ahmad</div><div style={{ fontSize:10, color:text2 }}>BSCS · 50908</div></div>}
          </div>
        </div>
        <div onClick={() => setSidebarOpen(p => !p)} style={{ position:"absolute", top:20, right:-11, width:22, height:22, background:dark?"rgba(8,11,18,0.97)":"#FFFFFF", border:`1px solid ${border}`, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:text2, zIndex:20 }}>
          {icons.menu}
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        {/* Topbar */}
        <div style={{ height:60, borderBottom:`1px solid ${border}`, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 24px", background:dark?"rgba(8,11,18,.85)":"rgba(255,255,255,.92)", backdropFilter:"blur(20px)", flexShrink:0 }}>
          <div>
            <div style={{ fontSize:15, fontWeight:700, color:text1, letterSpacing:"-.3px" }}>{page.charAt(0).toUpperCase()+page.slice(1)}</div>
            <div style={{ fontSize:11, color:text2, marginTop:1 }}>Coming soon</div>
          </div>
          <div />
          <button onClick={() => setDark(d=>!d)} style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 12px", borderRadius:20, background:"rgba(99,102,241,0.15)", border:"1px solid rgba(99,102,241,0.45)", color:dark?"#A5B4FC":"#4F46E5", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"'Inter',sans-serif" }}>
            {dark ? icons.sun : icons.moon}
            {dark?"Light mode":"Dark mode"}
          </button>
        </div>

        {/* Coming soon content */}
        <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:16 }}>
          <div style={{ width:72, height:72, borderRadius:"50%", background:"linear-gradient(135deg,#6366F1,#22D3EE)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 0 32px rgba(99,102,241,.4)" }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/></svg>
          </div>
          <div style={{ fontSize:22, fontWeight:800, color:text1, letterSpacing:"-.5px" }}>
            {page.charAt(0).toUpperCase()+page.slice(1)} — Coming Soon
          </div>
          <div style={{ fontSize:14, color:text2, textAlign:"center", maxWidth:360, lineHeight:1.7 }}>
            This page is being built. Check back soon or navigate to a completed page.
          </div>
          <div style={{ display:"flex", gap:10, marginTop:8 }}>
            <button onClick={() => navigate("dashboard")} style={{ padding:"9px 20px", background:"linear-gradient(135deg,#6366F1,#818CF8)", border:"none", borderRadius:9, color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'Inter',sans-serif", boxShadow:"0 4px 14px rgba(99,102,241,.35)" }}>
              Go to Dashboard
            </button>
            <button onClick={() => navigate("meetings")} style={{ padding:"9px 20px", background:surface, border:`1px solid ${border}`, borderRadius:9, color:text1, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'Inter',sans-serif" }}>
              View Meetings
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

// ── Router ────────────────────────────────────────────────────────────────────
export default function App() {
  // Global shared state — persisted across refresh
  const [page, setPage]               = useState(() => localStorage.getItem("recalla_page") || "dashboard");
  const [dark, setDark]               = useState(() => localStorage.getItem("recalla_dark") !== "false");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedMeeting, setSelectedMeeting] = useState(() => {
    try {
      const saved = localStorage.getItem("recalla_meeting");
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  // Central navigate function passed to every page
  const navigate = (target, data = null) => {
    if (data) {
      setSelectedMeeting(data);
      try { localStorage.setItem("recalla_meeting", JSON.stringify(data)); } catch {}
    }
    setPage(target);
    localStorage.setItem("recalla_page", target);
  };

  // Persist dark mode
  const handleSetDark = (val) => {
    const next = typeof val === "function" ? val(dark) : val;
    setDark(next);
    localStorage.setItem("recalla_dark", String(next));
  };

  // Shared props every page receives
  const shared = { navigate, dark, setDark: handleSetDark, sidebarOpen, setSidebarOpen };

  // Page switcher
  switch (page) {
    case "dashboard":
      return <RecallaDashboard {...shared} />;

    case "meetings":
      return <MeetingsList {...shared} />;

    case "record":
      return <RecordMeeting {...shared} />;

    case "detail":
      return <MeetingDetail {...shared} meeting={selectedMeeting} />;

    case "ask":
      return <AskRecalla {...shared} />;

    case "reminders":
      return <Reminders {...shared} />;

    case "timeline":
      return <Timeline {...shared} />;

    case "memory":
      return <Memory {...shared} />;

    case "settings":
      return <Settings {...shared} />;

    case "auth":
    case "login":
      return <Auth navigate={navigate} mode="login" />;

    case "register":
      return <Auth navigate={navigate} mode="register" />;

    case "admin":
      return <Admin {...shared} />;

    default:
      return <RecallaDashboard {...shared} />;
  }
}