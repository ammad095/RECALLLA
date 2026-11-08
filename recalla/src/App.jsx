// ============================================================
// FILE PATH:  recalla/src/App.jsx
// PURPOSE:    Router + session. Every screen change is a history
//             entry, so the Android back button (which calls the
//             WebView's goBack) walks back through the app.
// ============================================================

import { useState, useEffect, useCallback } from "react";

import Shell            from "./ui/Shell";
import RecallaDashboard from "./RecallaDashboard";
import MeetingsList     from "./MeetingsList";
import MeetingDetail    from "./MeetingDetail";
import RecordMeeting    from "./RecordMeeting";
import AskRecalla       from "./AskRecalla";
import Reminders        from "./Reminders";
import Memory           from "./Memory";
import Timeline         from "./Timeline";
import Settings         from "./Settings";
import Connectors       from "./Connectors";
import Admin            from "./Admin";
import Auth             from "./Auth";

import { isSignedIn, fetchMe, getStoredUser, clearSession } from "./auth_api";

const STORAGE_PAGE    = "recalla_page";
const STORAGE_MEETING = "recalla_meeting";

const PAGES = {
  dashboard: RecallaDashboard, meetings: MeetingsList, detail: MeetingDetail,
  record: RecordMeeting, ask: AskRecalla, reminders: Reminders, memory: Memory,
  timeline: Timeline, settings: Settings, connectors: Connectors, admin: Admin,
};
const AUTH_PAGES = new Set(["login", "register"]);

// ── URL <-> screen ───────────────────────────────────────────────────────────
// Hash routes need nothing from the server, which serves index.html for "/".
function fromHash() {
  const [, page, id] = (window.location.hash || "").match(/^#\/([a-z]+)(?:\/([^/?#]+))?/) || [];
  if (page === "meeting" && id) return { page: "detail", meeting: { id: decodeURIComponent(id) } };
  if (page && (PAGES[page] || AUTH_PAGES.has(page))) return { page, meeting: null };
  return null;
}
function toHash(page, meeting) {
  if (page === "detail" && meeting?.id != null) return `#/meeting/${encodeURIComponent(meeting.id)}`;
  return `#/${page}`;
}
function readStoredMeeting() {
  try { return JSON.parse(localStorage.getItem(STORAGE_MEETING) || "null"); } catch { return null; }
}

function initialRoute() {
  const fromUrl = fromHash();
  if (fromUrl) {
    // A reload of a meeting keeps the extra state the recorder handed over
    // (the live session to poll for the refined transcript), if it matches.
    const stored = readStoredMeeting();
    if (fromUrl.page === "detail" && stored && String(stored.id) === String(fromUrl.meeting.id)) {
      return { page: "detail", meeting: stored };
    }
    return fromUrl;
  }
  const page = localStorage.getItem(STORAGE_PAGE);
  return { page: PAGES[page] ? page : "dashboard", meeting: page === "detail" ? readStoredMeeting() : null };
}

export default function App() {
  const [route, setRoute] = useState(initialRoute);
  const { page, meeting } = route;

  // null = still checking, false = signed out, object = signed in
  const [user, setUser] = useState(() => (isSignedIn() ? getStoredUser() : false));

  // Validate the stored token once on boot — it may have expired while away.
  useEffect(() => {
    if (!isSignedIn()) return;
    let alive = true;
    fetchMe()
      .then((u) => alive && setUser(u || false))
      .catch(() => alive && setUser(false));
    return () => { alive = false; };
  }, []);

  // Seed the history entry for the first screen, then follow back/forward.
  useEffect(() => {
    window.history.replaceState({ page, meeting, depth: 0 }, "", toHash(page, meeting));
    const onPop = (e) => setRoute(e.state?.page
      ? { page: e.state.page, meeting: e.state.meeting }
      : (fromHash() || { page: "dashboard", meeting: null }));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // auth_api fires this when a refresh token is rejected.
  useEffect(() => {
    const onSignedOut = () => { setUser(false); setRoute({ page: "login", meeting: null }); };
    window.addEventListener("recalla:signed-out", onSignedOut);
    return () => window.removeEventListener("recalla:signed-out", onSignedOut);
  }, []);

  useEffect(() => {
    if (PAGES[page]) localStorage.setItem(STORAGE_PAGE, page);
    if (page === "detail" && meeting) localStorage.setItem(STORAGE_MEETING, JSON.stringify(meeting));
  }, [page, meeting]);

  const navigate = useCallback((to, data = null) => {
    // An on-screen back arrow should do what the phone's back button does,
    // unless this screen was opened directly (a reload, a shared link).
    if (to === "back") {
      if (window.history.state?.depth > 0) { window.history.back(); return; }
      to = data || "dashboard";
      data = null;
    }
    if (to === "logout") {
      clearSession();
      setUser(false);
      localStorage.removeItem(STORAGE_MEETING);
      window.history.replaceState({ page: "login", meeting: null }, "", "#/login");
      setRoute({ page: "login", meeting: null });
      return;
    }

    // "meeting" with a bare id is how the recorder hands over a saved meeting.
    let next = to, m = data;
    if (to === "meeting") { next = "detail"; m = typeof data === "object" ? data : { id: data }; }
    if (next !== "detail") m = null;
    if (next === "dashboard" && !user) setUser(getStoredUser() || false);

    // History is written here, not inside a state updater: React may run an
    // updater twice, and every extra pushState is an extra Back press.
    const same = route.page === next && (next !== "detail" || String(route.meeting?.id) === String(m?.id));
    const depth = window.history.state?.depth || 0;
    const state = { page: next, meeting: m };
    if (same) window.history.replaceState({ ...state, depth }, "", toHash(next, m));
    else window.history.pushState({ ...state, depth: depth + 1 }, "", toHash(next, m));
    setRoute(state);
  }, [user, route]);

  // Still verifying the stored token — hold off rather than flashing the
  // login screen at someone who is actually signed in.
  if (user === null) return <div className="h-dvh bg-bg" />;

  if (!user) {
    return <Auth navigate={navigate} mode={page === "register" ? "register" : "login"} />;
  }

  // Signed in on an auth address (#/login after a reload) goes Home.
  const Page = PAGES[page] || RecallaDashboard;
  // Admin is only reachable for admins; anyone else lands on Home.
  const Safe = page === "admin" && user.role !== "admin" ? RecallaDashboard : Page;

  return (
    <Shell page={page} navigate={navigate} user={user}>
      <Safe key={page === "detail" ? `detail-${meeting?.id}` : page}
            navigate={navigate} user={user} meeting={meeting} />
    </Shell>
  );
}
