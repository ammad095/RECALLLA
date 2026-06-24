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

const STORAGE_PAGE    = "recalla_page";
const STORAGE_MEETING = "recalla_meeting";

export default function App() {
  const [page, setPage] = useState(() => localStorage.getItem(STORAGE_PAGE) || "dashboard");
  const [selectedMeeting, setSelectedMeeting] = useState(() => {
    try {
      const m = localStorage.getItem(STORAGE_MEETING);
      return m ? JSON.parse(m) : null;
    } catch { return null; }
  });

  useEffect(() => { localStorage.setItem(STORAGE_PAGE, page); }, [page]);
  useEffect(() => {
    if (selectedMeeting) localStorage.setItem(STORAGE_MEETING, JSON.stringify(selectedMeeting));
    else localStorage.removeItem(STORAGE_MEETING);
  }, [selectedMeeting]);

  const navigate = (route, meeting = null) => {
    if (meeting !== null) setSelectedMeeting(meeting);
    setPage(route);
  };

  // Compatibility props for old pages
  const sharedOld = {
    navigate,
    dark: true,
    setDark: () => {},
    sidebarOpen: true,
    setSidebarOpen: () => {},
  };

  switch (page) {
    case "ask":       return <AskRecalla navigate={navigate} />;
    case "reminders": return <Reminders navigate={navigate} />;
    case "detail":    return <MeetingDetail navigate={navigate} meeting={selectedMeeting} />;

    case "dashboard": return <RecallaDashboard {...sharedOld} />;
    case "meetings":  return <MeetingsList {...sharedOld} />;
    case "record":    return <RecordMeeting {...sharedOld} />;
    case "memory":    return <Memory {...sharedOld} />;
    case "timeline":  return <Timeline {...sharedOld} />;
    case "settings":  return <Settings {...sharedOld} />;
    case "auth":
    case "login":     return <Auth navigate={navigate} mode="login" />;
    case "register":  return <Auth navigate={navigate} mode="register" />;
    case "admin":     return <Admin {...sharedOld} />;

    default: return <RecallaDashboard {...sharedOld} />;
  }
}