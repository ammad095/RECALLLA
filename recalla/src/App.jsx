// ============================================================
// FILE PATH:  recalla/src/App.jsx
// PURPOSE:    Main router. Dark theme only now. Sidebar lives inside each page.
// ============================================================

import { useState, useEffect } from "react";

import AskRecalla    from "./AskRecalla";
import Reminders     from "./Reminders";
import MeetingDetail from "./MeetingDetail";

// Existing pages — will be redesigned in next batch
import RecallaDashboard from "./RecallaDashboard";
import MeetingsList     from "./MeetingsList";
import RecordMeeting    from "./RecordMeeting";
import Memory           from "./Memory";
import Timeline         from "./Timeline";
import Settings         from "./Settings";
import Auth             from "./Auth";
import Admin            from "./Admin";
import Connectors       from "./Connectors";

import { isSignedIn, fetchMe, getStoredUser, clearSession } from "./auth_api";

const STORAGE_PAGE    = "recalla_page";
const STORAGE_MEETING = "recalla_meeting";

const PUBLIC_PAGES = new Set(["auth", "login", "register"]);

export default function App() {
  const [page, setPage] = useState(() => localStorage.getItem(STORAGE_PAGE) || "dashboard");
  const [selectedMeeting, setSelectedMeeting] = useState(() => {
    try {
      const m = localStorage.getItem(STORAGE_MEETING);
      return m ? JSON.parse(m) : null;
    } catch { return null; }
  });

  // null = still checking, false = signed out, object = signed in
  const [user, setUser] = useState(() => (isSignedIn() ? getStoredUser() : false));

  // Validate the stored token once on boot — it may have expired while away.
  // (The initializer above already resolved the signed-out case.)
  useEffect(() => {
    if (!isSignedIn()) return;
    let alive = true;
    fetchMe()
      .then((u) => alive && setUser(u || false))
      .catch(() => alive && setUser(false));
    return () => { alive = false; };
  }, []);

  // auth_api fires this when a refresh token is rejected.
  useEffect(() => {
    const onSignedOut = () => { setUser(false); setPage("login"); };
    window.addEventListener("recalla:signed-out", onSignedOut);
    return () => window.removeEventListener("recalla:signed-out", onSignedOut);
  }, []);

  useEffect(() => { localStorage.setItem(STORAGE_PAGE, page); }, [page]);
  useEffect(() => {
    if (selectedMeeting) localStorage.setItem(STORAGE_MEETING, JSON.stringify(selectedMeeting));
    else localStorage.removeItem(STORAGE_MEETING);
  }, [selectedMeeting]);

  const navigate = (route, meeting = null) => {
    if (route === "logout") {
      clearSession();
      setUser(false);
      setSelectedMeeting(null);
      setPage("login");
      return;
    }
    if (meeting !== null) setSelectedMeeting(meeting);
    // Refresh the cached user after signing in.
    if (route === "dashboard" && !user) setUser(getStoredUser() || false);
    setPage(route);
  };

  // Compatibility props for old pages
  const sharedOld = {
    navigate,
    user,
    dark: true,
    setDark: () => {},
    sidebarOpen: true,
    setSidebarOpen: () => {},
  };

  // Still verifying the stored token — hold off rather than flashing the
  // login screen at someone who is actually signed in.
  if (user === null) {
    return <div style={{ height: "100vh", background: "#0B0E14" }} />;
  }

  // Everything except the auth screens requires a session.
  if (!user && !PUBLIC_PAGES.has(page)) {
    return <Auth navigate={navigate} mode="login" />;
  }

  switch (page) {
    case "ask":       return <AskRecalla navigate={navigate} user={user} />;
    case "reminders": return <Reminders navigate={navigate} user={user} />;
    case "detail":    return <MeetingDetail navigate={navigate} meeting={selectedMeeting} user={user} />;

    case "dashboard": return <RecallaDashboard {...sharedOld} />;
    case "meetings":  return <MeetingsList {...sharedOld} />;
    case "record":    return <RecordMeeting {...sharedOld} />;
    case "memory":    return <Memory {...sharedOld} />;
    case "timeline":  return <Timeline {...sharedOld} />;
    case "settings":  return <Settings {...sharedOld} />;
    case "auth":
    case "login":     return <Auth navigate={navigate} mode="login" />;
    case "register":  return <Auth navigate={navigate} mode="register" />;
    case "connectors":return <Connectors {...sharedOld} />;
    case "admin":     return <Admin {...sharedOld} />;

    default: return <RecallaDashboard {...sharedOld} />;
  }
}