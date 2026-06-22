import { useState } from "react";

// ── Icons ─────────────────────────────────────────────────────────────────────
const Icon = ({ name, size = 20, color = "currentColor" }) => {
  const s = { width: size, height: size, stroke: color, fill: "none", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };
  const icons = {
    mic:        <svg viewBox="0 0 24 24" {...s}><rect x="9" y="2" width="6" height="13" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/><line x1="12" y1="19" x2="12" y2="22"/></svg>,
    brain:      <svg viewBox="0 0 24 24" {...s}><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/></svg>,
    clock:      <svg viewBox="0 0 24 24" {...s}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    search:     <svg viewBox="0 0 24 24" {...s}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    bell:       <svg viewBox="0 0 24 24" {...s}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
    menu:       <svg viewBox="0 0 24 24" {...s}><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
    sun:        <svg viewBox="0 0 24 24" {...s}><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/></svg>,
    moon:       <svg viewBox="0 0 24 24" {...s}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
    users:      <svg viewBox="0 0 24 24" {...s}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    layers:     <svg viewBox="0 0 24 24" {...s}><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
    activity:   <svg viewBox="0 0 24 24" {...s}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
    shield:     <svg viewBox="0 0 24 24" {...s}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    cpu:        <svg viewBox="0 0 24 24" {...s}><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>,
    server:     <svg viewBox="0 0 24 24" {...s}><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>,
    database:   <svg viewBox="0 0 24 24" {...s}><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>,
    moreV:      <svg viewBox="0 0 24 24" {...s}><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>,
    check:      <svg viewBox="0 0 24 24" {...s}><polyline points="20 6 9 17 4 12"/></svg>,
    x:          <svg viewBox="0 0 24 24" {...s}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    trash:      <svg viewBox="0 0 24 24" {...s}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>,
    edit:       <svg viewBox="0 0 24 24" {...s}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    mail:       <svg viewBox="0 0 24 24" {...s}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
    trendUp:    <svg viewBox="0 0 24 24" {...s}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
    trendDown:  <svg viewBox="0 0 24 24" {...s}><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>,
    download:   <svg viewBox="0 0 24 24" {...s}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
    settings:   <svg viewBox="0 0 24 24" {...s}><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83"/></svg>,
    user:       <svg viewBox="0 0 24 24" {...s}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    logOut:     <svg viewBox="0 0 24 24" {...s}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
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
  tableHeader:"rgba(255,255,255,0.04)",
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
  tableHeader:"#F8FAFC",
};

const ADMIN_NAV = [
  { icon:"layers",   label:"Overview",   id:"overview"   },
  { icon:"users",    label:"Users",      id:"users"      },
  { icon:"mic",      label:"Meetings",   id:"meetings"   },
  { icon:"activity", label:"Activity",   id:"activity"   },
  { icon:"cpu",      label:"System",     id:"system"     },
  { icon:"settings", label:"Settings",   id:"settings"   },
];

// ── Mock data ─────────────────────────────────────────────────────────────────
const USERS = [
  { id:1,  name:"Ammad Ahmad",          email:"ammad@riphah.edu.pk",    role:"admin",   status:"active",   meetings:47, joined:"15 Jun 2026", lastActive:"Just now",      avatar:"AA", color:"#6366F1" },
  { id:2,  name:"Muhammad Muzammal",    email:"muzammal@riphah.edu.pk", role:"user",    status:"active",   meetings:38, joined:"15 Jun 2026", lastActive:"2 min ago",     avatar:"MM", color:"#22D3EE" },
  { id:3,  name:"Dr. Muhammad Adnan",   email:"adnan@riphah.edu.pk",    role:"supervisor", status:"active", meetings:12, joined:"10 Jun 2026", lastActive:"1 hour ago",    avatar:"DA", color:"#F59E0B" },
  { id:4,  name:"Sarah Khan",           email:"sarah.k@gmail.com",      role:"user",    status:"active",   meetings:23, joined:"12 Jun 2026", lastActive:"3 hours ago",   avatar:"SK", color:"#A78BFA" },
  { id:5,  name:"Ahmed Ali",            email:"ahmed.a@startup.io",     role:"user",    status:"inactive", meetings:8,  joined:"8 Jun 2026",  lastActive:"5 days ago",    avatar:"AA", color:"#10B981" },
  { id:6,  name:"Fatima Hassan",        email:"fatima.h@gmail.com",     role:"user",    status:"active",   meetings:31, joined:"5 Jun 2026",  lastActive:"30 min ago",    avatar:"FH", color:"#F43F5E" },
  { id:7,  name:"Bilal Tariq",          email:"bilal.t@riphah.edu.pk",  role:"user",    status:"pending",  meetings:0,  joined:"Today",       lastActive:"Never",         avatar:"BT", color:"#6366F1" },
  { id:8,  name:"Ayesha Malik",         email:"ayesha.m@gmail.com",     role:"user",    status:"active",   meetings:19, joined:"3 Jun 2026",  lastActive:"1 day ago",     avatar:"AM", color:"#22D3EE" },
];

const ACTIVITY_LOG = [
  { id:1, user:"Ammad Ahmad",       action:"Created meeting",         target:"Product Sprint Planning", time:"2 min ago",  type:"create" },
  { id:2, user:"Muhammad Muzammal", action:"Deployed",                target:"Whisper v3 to staging",   time:"15 min ago", type:"deploy" },
  { id:3, user:"Sarah Khan",        action:"Asked Recalla",           target:"What was decided about backend?", time:"32 min ago", type:"query" },
  { id:4, user:"Fatima Hassan",     action:"Joined meeting",          target:"UX Research Debrief",     time:"1 hour ago", type:"join"   },
  { id:5, user:"Dr. Adnan",         action:"Updated user role",       target:"Bilal Tariq → User",      time:"2 hours ago", type:"admin"  },
  { id:6, user:"Ammad Ahmad",       action:"Exported memories",       target:"4.3 MB JSON",             time:"3 hours ago", type:"export" },
  { id:7, user:"System",            action:"Auto-backup completed",   target:"All meetings backed up",  time:"4 hours ago", type:"system" },
  { id:8, user:"Ahmed Ali",         action:"Account deactivated",     target:"By admin",                time:"5 days ago", type:"admin"  },
];

const ACTION_COLORS = {
  create: "#22D3EE", deploy: "#A78BFA", query: "#6366F1",
  join: "#10B981",   admin:  "#F59E0B", export: "#F43F5E",
  system: "#9CA3AF",
};

const ROLE_COLORS = {
  admin:      { color:"#F43F5E", bg:"rgba(244,63,94,0.10)",  border:"rgba(244,63,94,0.25)" },
  supervisor: { color:"#F59E0B", bg:"rgba(245,158,11,0.10)", border:"rgba(245,158,11,0.25)" },
  user:       { color:"#22D3EE", bg:"rgba(34,211,238,0.10)", border:"rgba(34,211,238,0.25)" },
};

const STATUS_COLORS = {
  active:   { color:"#10B981", bg:"rgba(16,185,129,0.10)", border:"rgba(16,185,129,0.25)" },
  inactive: { color:"#9CA3AF", bg:"rgba(156,163,175,0.10)",border:"rgba(156,163,175,0.25)" },
  pending:  { color:"#F59E0B", bg:"rgba(245,158,11,0.10)", border:"rgba(245,158,11,0.25)" },
};

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Admin({ navigate: navProp, dark: darkProp, setDark: setDarkProp, sidebarOpen: sidebarProp, setSidebarOpen: setSidebarProp } = {}) {
  const [darkLocal, setDarkLocal]           = useState(true);
  const [sidebarLocal, setSidebarLocal]     = useState(true);
  const dark          = darkProp          !== undefined ? darkProp        : darkLocal;
  const setDark       = setDarkProp       !== undefined ? setDarkProp     : setDarkLocal;
  const sidebarOpen   = sidebarProp       !== undefined ? sidebarProp     : sidebarLocal;
  const setSidebarOpen= setSidebarProp    !== undefined ? setSidebarProp  : setSidebarLocal;

  const [activeSection, setActiveSection] = useState("overview");
  const [search, setSearch]               = useState("");
  const [users, setUsers]                 = useState(USERS);
  const [statusFilter, setStatusFilter]   = useState("all");
  const [roleFilter, setRoleFilter]       = useState("all");
  const [actionMenuId, setActionMenuId]   = useState(null);

  const T = dark ? DARK : LIGHT;

  const filteredUsers = users.filter(u => {
    const matchSearch = !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || u.status === statusFilter;
    const matchRole   = roleFilter   === "all" || u.role   === roleFilter;
    return matchSearch && matchStatus && matchRole;
  });

  const toggleStatus = (id) => setUsers(us => us.map(u => u.id===id ? { ...u, status: u.status==="active"?"inactive":"active" } : u));
  const deleteUser   = (id) => setUsers(us => us.filter(u => u.id!==id));

  const stats = {
    totalUsers:   users.length,
    activeUsers:  users.filter(u=>u.status==="active").length,
    totalMeetings: users.reduce((sum, u) => sum + u.meetings, 0),
    pendingApproval: users.filter(u=>u.status==="pending").length,
  };

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    html,body,#root{height:100%;width:100%;overflow:hidden}
    body{font-family:'Inter',sans-serif;background:${T.bg};color:${T.text1};transition:background .3s,color .3s}
    ::-webkit-scrollbar{width:4px;height:4px} ::-webkit-scrollbar-thumb{background:${T.scrollbar};border-radius:2px}
    *{scrollbar-width:thin;scrollbar-color:${T.scrollbar} transparent}
    .app{display:flex;height:100vh;width:100vw;overflow:hidden}
    .main{flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0}

    /* Admin sidebar */
    .sb{width:${sidebarOpen?"240px":"68px"};flex-shrink:0;background:${T.sidebar};border-right:1px solid ${T.border};display:flex;flex-direction:column;padding:18px 10px;gap:3px;transition:width .3s;position:relative;z-index:10;overflow:hidden}
    .logo{display:flex;align-items:center;gap:10px;padding:6px 10px 6px;margin-bottom:6px;white-space:nowrap}
    .lmark{width:30px;height:30px;background:linear-gradient(135deg,#F43F5E,#FB7185);border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 0 14px rgba(244,63,94,.35)}
    .ltxt{font-size:16px;font-weight:800;letter-spacing:-.5px;color:${T.text1}} .ltxt span{color:#F43F5E}
    .admin-badge{font-size:9px;padding:2px 7px;border-radius:20px;background:rgba(244,63,94,0.15);border:1px solid rgba(244,63,94,0.3);color:#F43F5E;font-weight:700;letter-spacing:.5px;margin-left:4px}
    .sub-label{font-size:10px;font-weight:700;color:${T.text3};letter-spacing:.8px;text-transform:uppercase;padding:14px 10px 6px;opacity:${sidebarOpen?1:0};transition:opacity .2s}
    .nlbl{opacity:${sidebarOpen?1:0};transition:opacity .2s;white-space:nowrap;overflow:hidden;flex:1}
    .ni{display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:9px;cursor:pointer;transition:all .2s;color:${T.text2};font-size:13px;font-weight:500;border:1px solid transparent;position:relative;overflow:hidden}
    .ni:hover{background:${T.surfaceHov};color:${T.text1}}
    .ni.act{background:rgba(244,63,94,0.10);border-color:rgba(244,63,94,0.3);color:${T.text1}}
    .ni.act::before{content:'';position:absolute;left:0;top:20%;bottom:20%;width:2px;background:#F43F5E;border-radius:0 2px 2px 0;box-shadow:0 0 8px #F43F5E}
    .sbt{position:absolute;top:20px;right:-11px;width:22px;height:22px;background:${T.sidebar};border:1px solid ${T.border};border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;color:${T.text3};z-index:20}
    .sbt:hover{border-color:#F43F5E;color:#F43F5E}
    .usr{margin-top:auto;padding-top:10px;border-top:1px solid ${T.border}}
    .avsm{width:26px;height:26px;border-radius:50%;background:linear-gradient(135deg,#F43F5E,#FB7185);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#fff;flex-shrink:0}
    .exit-btn{display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:9px;cursor:pointer;color:${T.text2};font-size:13px;font-weight:500;transition:all .2s;border:1px solid transparent;margin-top:4px}
    .exit-btn:hover{background:${T.surfaceHov};color:${T.text1}}

    .topbar{height:60px;border-bottom:1px solid ${T.border};display:flex;align-items:center;justify-content:space-between;padding:0 24px;background:${T.topbar};backdrop-filter:blur(20px);flex-shrink:0}
    .ibtn{width:34px;height:34px;display:flex;align-items:center;justify-content:center;background:${T.surface};border:1px solid ${T.border};border-radius:8px;cursor:pointer;color:${T.text2};transition:all .2s}
    .ibtn:hover{background:${T.surfaceHov};color:${T.text1}}
    .av{width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,#F43F5E,#FB7185);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff;cursor:pointer}
    .thbtn{display:flex;align-items:center;gap:6px;padding:6px 12px;border-radius:20px;background:rgba(244,63,94,0.10);border:1px solid rgba(244,63,94,0.3);color:#F43F5E;font-size:12px;font-weight:600;cursor:pointer;transition:all .2s;font-family:'Inter',sans-serif}
    .sw{display:flex;align-items:center;gap:8px;background:${T.surface};border:1px solid ${T.border};border-radius:9px;padding:7px 12px;width:280px}
    .sw:focus-within{border-color:#F43F5E;box-shadow:0 0 0 3px rgba(244,63,94,.15)}
    .sw input{background:none;border:none;outline:none;color:${T.text1};font-family:'Inter',sans-serif;font-size:13px;width:100%}
    .sw input::placeholder{color:${T.text3}}

    .cnt{flex:1;overflow-y:auto;padding:24px 28px;display:flex;flex-direction:column;gap:18px}
    .stat-card{background:${T.surface};border:1px solid ${T.border};border-radius:12px;padding:18px;box-shadow:${T.cardBox};transition:all .25s}
    .stat-card:hover{background:${T.surfaceHov};transform:translateY(-2px)}

    /* Table */
    .table-card{background:${T.surface};border:1px solid ${T.border};border-radius:14px;overflow:hidden;box-shadow:${T.cardBox}}
    .table-header{padding:18px 22px;border-bottom:1px solid ${T.border};display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px}
    .table-title{font-size:15px;font-weight:700;color:${T.text1};letter-spacing:-.3px}
    .table-sub{font-size:11px;color:${T.text3};margin-top:2px}
    .filter-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
    .filter-chip{padding:6px 12px;border-radius:7px;font-size:11px;font-weight:600;cursor:pointer;transition:all .2s;border:1px solid ${T.border};background:${T.surface};color:${T.text2};font-family:'Inter',sans-serif}
    .filter-chip:hover{border-color:#F43F5E;color:${T.text1}}
    .filter-chip.act{background:rgba(244,63,94,0.10);border-color:rgba(244,63,94,0.3);color:#F43F5E}

    table{width:100%;border-collapse:collapse}
    thead{background:${T.tableHeader}}
    th{padding:12px 16px;text-align:left;font-size:10px;font-weight:700;color:${T.text3};letter-spacing:.6px;text-transform:uppercase;border-bottom:1px solid ${T.border}}
    td{padding:14px 16px;border-bottom:1px solid ${T.border};font-size:13px;color:${T.text1};vertical-align:middle}
    tbody tr{transition:background .2s}
    tbody tr:hover{background:${T.surfaceHov}}
    tbody tr:last-child td{border-bottom:none}

    .role-badge,.status-badge{display:inline-flex;align-items:center;gap:5px;padding:3px 9px;border-radius:20px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.4px}
    .status-dot{width:5px;height:5px;border-radius:50%;animation:breathe 2s ease-in-out infinite}

    .action-btn{width:28px;height:28px;border-radius:7px;background:transparent;border:1px solid transparent;display:flex;align-items:center;justify-content:center;cursor:pointer;color:${T.text3};transition:all .2s}
    .action-btn:hover{background:${T.surfaceHov};color:${T.text1};border-color:${T.border}}

    .action-menu{position:absolute;right:0;top:100%;margin-top:4px;background:${T.surface};border:1px solid ${T.border};border-radius:10px;box-shadow:${T.cardBox};padding:5px;min-width:160px;z-index:50}
    .action-item{display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:7px;cursor:pointer;font-size:12px;color:${T.text2};transition:all .15s}
    .action-item:hover{background:${T.surfaceHov};color:${T.text1}}
    .action-item.danger:hover{background:rgba(244,63,94,0.10);color:#F43F5E}

    /* Activity */
    .activity-row{display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid ${T.border}}
    .activity-row:last-child{border-bottom:none}
    .activity-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}

    /* System */
    .health-bar{height:8px;background:${T.inputBg};border-radius:4px;overflow:hidden;margin-top:8px}
    .health-fill{height:100%;border-radius:4px;transition:width .6s}

    @keyframes breathe{0%,100%{opacity:1}50%{opacity:.45}}
    @keyframes fade-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    .fi{animation:fade-in .35s ease}
  `;

  return (
    <>
      <style>{css}</style>
      <div className="app">

        {/* Sidebar */}
        <aside className="sb">
          <div className="logo">
            <div className="lmark"><Icon name="shield" size={16} color="#fff"/></div>
            {sidebarOpen && (
              <div style={{display:"flex", alignItems:"center"}}>
                <div className="ltxt">Re<span>calla</span></div>
                <span className="admin-badge">ADMIN</span>
              </div>
            )}
          </div>

          {sidebarOpen && <div className="sub-label">Administration</div>}
          {ADMIN_NAV.map(item => (
            <div key={item.id} className={`ni${activeSection===item.id?" act":""}`} onClick={() => setActiveSection(item.id)}>
              <Icon name={item.icon} size={16} color={activeSection===item.id?"#F43F5E":T.text2}/>
              <span className="nlbl">{item.label}</span>
            </div>
          ))}

          <div className="usr">
            <div className="ni">
              <div className="avsm">AA</div>
              {sidebarOpen && (
                <div style={{ overflow:"hidden" }}>
                  <div style={{ fontSize:12, fontWeight:600, color:T.text1, whiteSpace:"nowrap" }}>Ammad Ahmad</div>
                  <div style={{ fontSize:10, color:T.text3, whiteSpace:"nowrap" }}>Admin · 50908</div>
                </div>
              )}
            </div>
            <div className="exit-btn" onClick={() => navProp && navProp("dashboard")}>
              <Icon name="logOut" size={14} color={T.text2}/>
              <span className="nlbl">Exit Admin</span>
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
              <div style={{ fontSize:15, fontWeight:700, letterSpacing:"-.3px", color:T.text1, display:"flex", alignItems:"center", gap:8 }}>
                <Icon name="shield" size={15} color="#F43F5E"/>
                Admin Panel
              </div>
              <div style={{ fontSize:11, color:T.text3, marginTop:1 }}>Manage users, system health, and platform settings</div>
            </div>
            <div className="sw">
              <Icon name="search" size={14} color={T.text3}/>
              <input placeholder="Search users, meetings, logs…" value={search} onChange={e=>setSearch(e.target.value)}/>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <button className="thbtn" onClick={() => setDark(d => !d)}>
                <Icon name={dark?"sun":"moon"} size={13} color="#F43F5E"/>
                {dark?"Light mode":"Dark mode"}
              </button>
              <div className="ibtn"><Icon name="bell" size={15} color={T.text2}/></div>
              <div className="av">AA</div>
            </div>
          </div>

          <div className="cnt">

            {/* OVERVIEW */}
            {activeSection === "overview" && (
              <div className="fi">
                {/* Stats grid */}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
                  {[
                    { icon:"users",    color:"#F43F5E", bg:"rgba(244,63,94,.10)",  val:stats.totalUsers,      label:"Total Users",      trend:"+3 this week", trendUp:true },
                    { icon:"activity", color:"#10B981", bg:"rgba(16,185,129,.10)", val:stats.activeUsers,     label:"Active Now",       trend:"68% active",   trendUp:true },
                    { icon:"mic",      color:"#22D3EE", bg:"rgba(34,211,238,.10)", val:stats.totalMeetings,   label:"Total Meetings",   trend:"+47 today",    trendUp:true },
                    { icon:"clock",    color:"#F59E0B", bg:"rgba(245,158,11,.10)", val:stats.pendingApproval, label:"Pending Approval", trend:"Action needed", trendUp:false },
                  ].map((s,i) => (
                    <div key={i} className="stat-card">
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:14 }}>
                        <div style={{ width:36, height:36, borderRadius:9, background:s.bg, display:"flex", alignItems:"center", justifyContent:"center" }}>
                          <Icon name={s.icon} size={17} color={s.color}/>
                        </div>
                        <span style={{ display:"flex", alignItems:"center", gap:3, fontSize:10, fontWeight:600, color:s.trendUp?"#10B981":"#F43F5E" }}>
                          <Icon name={s.trendUp?"trendUp":"trendDown"} size={10} color="currentColor"/>
                          {s.trend}
                        </span>
                      </div>
                      <div style={{ fontSize:26, fontWeight:800, letterSpacing:"-1px", color:s.color }}>{s.val}</div>
                      <div style={{ fontSize:11, color:T.text2, marginTop:3, fontWeight:500 }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Recent activity + System health */}
                <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:16, marginTop:18 }}>
                  {/* Recent Activity */}
                  <div className="table-card">
                    <div className="table-header">
                      <div>
                        <div className="table-title">Recent Activity</div>
                        <div className="table-sub">Latest actions across the platform</div>
                      </div>
                      <button className="filter-chip" onClick={() => setActiveSection("activity")}>View all</button>
                    </div>
                    <div style={{ padding:"6px 22px 18px" }}>
                      {ACTIVITY_LOG.slice(0,6).map(log => (
                        <div key={log.id} className="activity-row">
                          <div className="activity-dot" style={{ background:ACTION_COLORS[log.type]||"#9CA3AF" }}/>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontSize:13, color:T.text1 }}>
                              <strong>{log.user}</strong> {log.action} <span style={{color:T.text3}}>{log.target}</span>
                            </div>
                            <div style={{ fontSize:10, color:T.text3, marginTop:2 }}>{log.time}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* System Health */}
                  <div className="table-card">
                    <div className="table-header">
                      <div>
                        <div className="table-title">System Health</div>
                        <div className="table-sub">Live status</div>
                      </div>
                    </div>
                    <div style={{ padding:"18px 22px" }}>
                      {[
                        { label:"API Server",      val:99, color:"#10B981", status:"Online"  },
                        { label:"Whisper Service", val:87, color:"#22D3EE", status:"Healthy" },
                        { label:"ChromaDB",        val:94, color:"#A78BFA", status:"Healthy" },
                        { label:"Storage Used",    val:42, color:"#F59E0B", status:"42%"     },
                      ].map((m,i) => (
                        <div key={i} style={{ marginBottom:i===3?0:18 }}>
                          <div style={{ display:"flex", justifyContent:"space-between", fontSize:12 }}>
                            <span style={{ color:T.text2 }}>{m.label}</span>
                            <span style={{ color:m.color, fontWeight:600 }}>{m.status}</span>
                          </div>
                          <div className="health-bar">
                            <div className="health-fill" style={{ width:`${m.val}%`, background:`linear-gradient(90deg, ${m.color}, ${m.color}88)` }}/>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* USERS */}
            {activeSection === "users" && (
              <div className="fi">
                <div className="table-card">
                  <div className="table-header">
                    <div>
                      <div className="table-title">User Management</div>
                      <div className="table-sub">{filteredUsers.length} of {users.length} users</div>
                    </div>
                    <div className="filter-row">
                      <div className="filter-row">
                        <span style={{ fontSize:11, color:T.text3, fontWeight:600 }}>Status:</span>
                        {["all","active","inactive","pending"].map(f => (
                          <button key={f} className={`filter-chip${statusFilter===f?" act":""}`} onClick={()=>setStatusFilter(f)}>
                            {f.charAt(0).toUpperCase()+f.slice(1)}
                          </button>
                        ))}
                      </div>
                      <div style={{ width:1, height:20, background:T.border, margin:"0 6px" }}/>
                      <div className="filter-row">
                        <span style={{ fontSize:11, color:T.text3, fontWeight:600 }}>Role:</span>
                        {["all","admin","supervisor","user"].map(f => (
                          <button key={f} className={`filter-chip${roleFilter===f?" act":""}`} onClick={()=>setRoleFilter(f)}>
                            {f.charAt(0).toUpperCase()+f.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div style={{ overflowX:"auto" }}>
                    <table>
                      <thead>
                        <tr>
                          <th>User</th>
                          <th>Role</th>
                          <th>Status</th>
                          <th>Meetings</th>
                          <th>Last Active</th>
                          <th>Joined</th>
                          <th style={{ textAlign:"right" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map(u => {
                          const role = ROLE_COLORS[u.role];
                          const status = STATUS_COLORS[u.status];
                          return (
                            <tr key={u.id}>
                              <td>
                                <div style={{ display:"flex", alignItems:"center", gap:11 }}>
                                  <div style={{ width:32, height:32, borderRadius:"50%", background:u.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:"#fff", flexShrink:0 }}>{u.avatar}</div>
                                  <div>
                                    <div style={{ fontSize:13, fontWeight:600, color:T.text1 }}>{u.name}</div>
                                    <div style={{ fontSize:11, color:T.text3 }}>{u.email}</div>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <span className="role-badge" style={{ background:role.bg, border:`1px solid ${role.border}`, color:role.color }}>
                                  {u.role}
                                </span>
                              </td>
                              <td>
                                <span className="status-badge" style={{ background:status.bg, border:`1px solid ${status.border}`, color:status.color }}>
                                  <span className="status-dot" style={{ background:status.color }}/>
                                  {u.status}
                                </span>
                              </td>
                              <td style={{ fontWeight:600, fontFamily:"'JetBrains Mono',monospace" }}>{u.meetings}</td>
                              <td style={{ color:T.text2, fontSize:12 }}>{u.lastActive}</td>
                              <td style={{ color:T.text2, fontSize:12 }}>{u.joined}</td>
                              <td>
                                <div style={{ display:"flex", justifyContent:"flex-end", gap:4, position:"relative" }}>
                                  <button className="action-btn" title="Edit"><Icon name="edit" size={13} color="currentColor"/></button>
                                  <button className="action-btn" title="Email"><Icon name="mail" size={13} color="currentColor"/></button>
                                  <button
                                    className="action-btn"
                                    onClick={() => setActionMenuId(actionMenuId===u.id ? null : u.id)}
                                    title="More"
                                  >
                                    <Icon name="moreV" size={13} color="currentColor"/>
                                  </button>
                                  {actionMenuId === u.id && (
                                    <div className="action-menu">
                                      <div className="action-item" onClick={() => { toggleStatus(u.id); setActionMenuId(null); }}>
                                        <Icon name={u.status==="active"?"x":"check"} size={12} color="currentColor"/>
                                        {u.status==="active"?"Deactivate":"Activate"}
                                      </div>
                                      <div className="action-item">
                                        <Icon name="shield" size={12} color="currentColor"/>
                                        Change Role
                                      </div>
                                      <div className="action-item">
                                        <Icon name="download" size={12} color="currentColor"/>
                                        Export Data
                                      </div>
                                      <div style={{ height:1, background:T.border, margin:"4px 0" }}/>
                                      <div className="action-item danger" onClick={() => { deleteUser(u.id); setActionMenuId(null); }}>
                                        <Icon name="trash" size={12} color="currentColor"/>
                                        Delete User
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ACTIVITY */}
            {activeSection === "activity" && (
              <div className="fi">
                <div className="table-card">
                  <div className="table-header">
                    <div>
                      <div className="table-title">Activity Log</div>
                      <div className="table-sub">All recent actions across the platform</div>
                    </div>
                    <button className="filter-chip"><Icon name="download" size={11} color="currentColor"/> Export</button>
                  </div>
                  <div style={{ padding:"6px 22px 18px" }}>
                    {ACTIVITY_LOG.map(log => (
                      <div key={log.id} className="activity-row">
                        <div style={{ width:36, height:36, borderRadius:9, background:ACTION_COLORS[log.type]+"20", border:`1px solid ${ACTION_COLORS[log.type]}40`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                          <Icon name="activity" size={14} color={ACTION_COLORS[log.type]}/>
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:13, color:T.text1 }}>
                            <strong>{log.user}</strong> {log.action} <span style={{color:T.text3}}>{log.target}</span>
                          </div>
                          <div style={{ fontSize:11, color:T.text3, marginTop:3 }}>{log.time}</div>
                        </div>
                        <span style={{ fontSize:10, fontWeight:600, padding:"3px 8px", borderRadius:20, background:ACTION_COLORS[log.type]+"15", color:ACTION_COLORS[log.type], border:`1px solid ${ACTION_COLORS[log.type]}30`, textTransform:"uppercase", letterSpacing:".4px" }}>
                          {log.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* SYSTEM */}
            {activeSection === "system" && (
              <div className="fi">
                <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:14 }}>
                  {[
                    { title:"API Server",       icon:"server",   color:"#10B981", uptime:"99.98%", load:34, requests:"1.2M today" },
                    { title:"Whisper Service",  icon:"cpu",      color:"#22D3EE", uptime:"99.50%", load:67, requests:"847 transcriptions today" },
                    { title:"ChromaDB",         icon:"database", color:"#A78BFA", uptime:"99.99%", load:42, requests:"5.4M embeddings stored" },
                    { title:"Storage",          icon:"download", color:"#F59E0B", uptime:"Active", load:42, requests:"42 GB used of 100 GB" },
                  ].map((s,i) => (
                    <div key={i} className="table-card" style={{ padding:22 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:16 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:11 }}>
                          <div style={{ width:38, height:38, borderRadius:10, background:s.color+"20", border:`1px solid ${s.color}40`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                            <Icon name={s.icon} size={17} color={s.color}/>
                          </div>
                          <div>
                            <div style={{ fontSize:14, fontWeight:700, color:T.text1 }}>{s.title}</div>
                            <div style={{ fontSize:11, color:T.text3, marginTop:2 }}>{s.requests}</div>
                          </div>
                        </div>
                        <span style={{ fontSize:11, fontWeight:600, color:"#10B981", padding:"4px 10px", background:"rgba(16,185,129,0.1)", border:"1px solid rgba(16,185,129,0.25)", borderRadius:20 }}>
                          {s.uptime}
                        </span>
                      </div>
                      <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:T.text3, marginBottom:5 }}>
                        <span>Current Load</span>
                        <span style={{ color:s.color, fontWeight:600 }}>{s.load}%</span>
                      </div>
                      <div className="health-bar" style={{ height:6 }}>
                        <div className="health-fill" style={{ width:`${s.load}%`, background:`linear-gradient(90deg, ${s.color}, ${s.color}88)` }}/>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* OTHER SECTIONS - placeholder */}
            {(activeSection === "meetings" || activeSection === "settings") && (
              <div className="fi" style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:60, flexDirection:"column", gap:12 }}>
                <div style={{ width:60, height:60, borderRadius:"50%", background:"linear-gradient(135deg,#F43F5E,#FB7185)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <Icon name={activeSection==="meetings"?"mic":"settings"} size={24} color="#fff"/>
                </div>
                <div style={{ fontSize:16, fontWeight:700, color:T.text1 }}>{activeSection.charAt(0).toUpperCase()+activeSection.slice(1)} Section</div>
                <div style={{ fontSize:13, color:T.text3 }}>Coming soon in the next release</div>
              </div>
            )}

            <div style={{ height:12 }}/>
          </div>
        </main>
      </div>
    </>
  );
}