// ============================================================
// FILE PATH:  recalla/src/ui/Shell.jsx
// PURPOSE:    App frame. Phones get a bottom tab bar with Record in
//             the thumb's reach; wide screens get a labelled sidebar.
//             Pages render inside and own their header.
// ============================================================

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  House, AudioLines, Mic, MessageSquareText, LayoutGrid, Bell, Brain, History,
  Plug, Settings, ShieldCheck, LogOut, Sun, Moon, ChevronRight,
} from "lucide-react";
import { listNotifications } from "../data_api";
import { useTheme } from "../useTheme";
import { Avatar, Sheet } from "./kit";
import { ShellCtx } from "./shellContext";
import { Brand } from "./Logo";

// What each place is for, in the user's words. Shown in the More sheet so the
// app explains itself without a tour.
const PLACES = {
  dashboard:  { label: "Home",       icon: House,       hint: "Today at a glance" },
  meetings:   { label: "Meetings",   icon: AudioLines,  hint: "Every recording, transcript and summary" },
  record:     { label: "Record",     icon: Mic,         hint: "Capture a meeting as it happens" },
  ask:        { label: "Ask",        icon: MessageSquareText,    hint: "Ask about meetings, email, calendar" },
  reminders:  { label: "Reminders",  icon: Bell,        hint: "Things Recalla will nudge you about" },
  memory:     { label: "Memory",     icon: Brain,       hint: "Decisions, tasks and deadlines it found" },
  timeline:   { label: "Timeline",   icon: History,     hint: "Everything, in the order it happened" },
  connectors: { label: "Connectors", icon: Plug,        hint: "Link Gmail, Calendar, WhatsApp" },
  settings:   { label: "Settings",   icon: Settings,    hint: "Account, appearance, notifications" },
  admin:      { label: "Admin",      icon: ShieldCheck, hint: "Manage user accounts" },
};

const MORE = ["reminders", "memory", "timeline", "connectors", "settings"];

/** Which tab a page belongs to — a meeting's detail lives under Meetings. */
function section(page) {
  if (page === "detail") return "meetings";
  if (MORE.includes(page) || page === "admin") return "more";
  return page;
}

export default function Shell({ page, navigate, user, children }) {
  // Both belong to the page that set them, so changing page resets them
  // without an effect: a stale value simply no longer matches.
  const [immersiveOn, setImmersiveOn] = useState(null);   // page that asked
  const [moreOn, setMoreOn] = useState(null);             // page it opened on
  const immersive = immersiveOn === page;
  const moreOpen = moreOn === page;

  const unread = useUnreadReminders();
  const setImmersive = useCallback((on) => setImmersiveOn(on ? page : null), [page]);
  const ctx = useMemo(() => ({ setImmersive }), [setImmersive]);

  const go = (route) => { setMoreOn(null); navigate(route); };

  return (
    <ShellCtx.Provider value={ctx}>
      <div className="flex h-dvh w-full overflow-hidden">
        {!immersive && <Sidebar page={page} go={go} user={user} unread={unread} />}

        <main className="relative min-w-0 flex-1">{children}</main>

        {!immersive && (
          <BottomNav active={section(page)} go={go} unread={unread} onMore={() => setMoreOn(page)} />
        )}
      </div>

      <MoreSheet open={moreOpen} onClose={() => setMoreOn(null)} go={go} page={page}
                 user={user} unread={unread} />
    </ShellCtx.Provider>
  );
}

// Reminders that have fired and not been dismissed. Polled rather than
// pushed: the scheduler ticks once a minute, so anything faster would just be
// asking a question whose answer cannot have changed.
function useUnreadReminders() {
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    let alive = true;
    const poll = () => listNotifications()
      .then((d) => alive && setUnread(d.count || 0))
      .catch(() => {});
    poll();
    const t = setInterval(poll, 60000);
    return () => { alive = false; clearInterval(t); };
  }, []);
  return unread;
}

function Badge({ n, className = "" }) {
  if (!n) return null;
  return (
    <span className={`grid h-[18px] min-w-[18px] place-items-center rounded-full bg-danger-fill px-1 text-[11px] font-medium leading-none text-white tabular-nums ${className}`}
          aria-label={`${n} due`}>
      {n > 9 ? "9+" : n}
    </span>
  );
}

// ── Phone: bottom tab bar ────────────────────────────────────────────────────
function TabItem({ id, label, Icon, active, onClick, badge }) {
  const on = active === id;
  return (
    <button onClick={onClick} aria-current={on ? "page" : undefined}
            className={`relative flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium
                        transition-colors ${on ? "text-fg" : "text-subtle"}`}>
      <span className={`grid h-8 w-14 place-items-center rounded-full transition-colors ${on ? "bg-surface-3 text-fg" : ""}`}>
        <Icon size={22} strokeWidth={on ? 2.2 : 1.9} />
      </span>
      {label}
      {badge ? <Badge n={badge} className="absolute top-1.5 left-1/2 ml-2" /> : null}
    </button>
  );
}

function BottomNav({ active, go, unread, onMore }) {
  return (
    <nav aria-label="Main"
         className="bar fixed inset-x-0 bottom-0 z-30 border-t border-line lg:hidden"
         style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="mx-auto flex max-w-lg items-end px-1">
        <TabItem id="dashboard" label="Home" Icon={House} active={active} onClick={() => go("dashboard")} />
        <TabItem id="meetings" label="Meetings" Icon={AudioLines} active={active} onClick={() => go("meetings")} />

        {/* Record is the reason the app exists, so it sits in the middle, raised. */}
        <div className="flex flex-1 justify-center">
          <button onClick={() => go("record")} aria-label="Record a meeting"
                  aria-current={active === "record" ? "page" : undefined}
                  className="bg-rec-fill -mt-5 mb-1 grid size-14 place-items-center rounded-full text-white shadow-pop
                             ring-4 ring-white/10 transition-[scale,box-shadow] duration-200 active:scale-95">
            <Mic size={26} strokeWidth={2.2} />
          </button>
        </div>

        <TabItem id="ask" label="Ask" Icon={MessageSquareText} active={active} onClick={() => go("ask")} />
        <TabItem id="more" label="More" Icon={LayoutGrid} active={active} onClick={onMore} badge={unread} />
      </div>
    </nav>
  );
}

function MoreSheet({ open, onClose, go, page, user, unread }) {
  const { isDark, toggle } = useTheme();
  const items = [...MORE, ...(user?.role === "admin" ? ["admin"] : [])];
  return (
    <Sheet open={open} onClose={onClose} labelledBy="more-title">
      <div className="mb-4 flex items-center gap-3">
        <Avatar name={user?.name} size={44} />
        <div className="min-w-0 flex-1">
          <div id="more-title" className="truncate font-medium">{user?.name || "Signed in"}</div>
          <div className="truncate text-sm text-subtle">{user?.email}</div>
        </div>
      </div>

      <div className="-mx-2 mb-3">
        {items.map((id) => {
          const p = PLACES[id];
          return (
            <button key={id} onClick={() => go(id)}
                    className={`flex min-h-14 w-full items-center gap-3.5 rounded-xl px-2 text-left transition-colors hover:bg-surface-2
                                ${page === id ? "bg-surface-2" : ""}`}>
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface-3 text-muted">
                <p.icon size={20} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{p.label}</span>
                <span className="block truncate text-sm text-subtle">{p.hint}</span>
              </span>
              {id === "reminders" && <Badge n={unread} />}
              <ChevronRight size={18} className="text-subtle" />
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-2 border-t border-line pt-4">
        <button onClick={toggle} className="btn btn-secondary">
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
          {isDark ? "Light mode" : "Dark mode"}
        </button>
        <button onClick={() => go("logout")} className="btn btn-secondary text-danger">
          <LogOut size={18} /> Sign out
        </button>
      </div>
    </Sheet>
  );
}

// ── Wide screens: sidebar ────────────────────────────────────────────────────
function SideLink({ id, active, go, unread }) {
  const p = PLACES[id];
  const on = active === id;
  return (
    <button onClick={() => go(id)} aria-current={on ? "page" : undefined}
            className={`group/link relative flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-[15px] font-medium
                        transition-[background-color,color,translate] duration-200
                        ${on ? "bg-surface-2 text-fg shadow-[inset_0_1px_0_var(--glass-hi)]"
                             : "text-muted hover:bg-surface hover:text-fg"}`}>
      {/* active marker: a short bar on the left edge */}
      <span className={`absolute top-1/2 left-0 h-5 w-1 -translate-y-1/2 rounded-full bg-brand transition-opacity duration-200
                        ${on ? "opacity-100" : "opacity-0"}`} />
      <p.icon size={19} className={`transition-[color,scale] duration-200 ${on ? "text-brand" : ""}`} />
      <span className="flex-1 text-left">{p.label}</span>
      {id === "reminders" && <Badge n={unread} />}
    </button>
  );
}

function Sidebar({ page, go, user, unread }) {
  const { isDark, toggle } = useTheme();
  const link = { active: page === "detail" ? "meetings" : page, go, unread };

  return (
    <aside className="panel hidden w-64 shrink-0 flex-col border-r border-line lg:flex">
      <Brand size={38} onClick={() => go("dashboard")} className="px-5 pt-6 pb-6" />

      <nav aria-label="Main" className="flex-1 space-y-0.5 overflow-y-auto px-3">
        <SideLink id="dashboard" {...link} /><SideLink id="record" {...link} />
        <SideLink id="meetings" {...link} /><SideLink id="ask" {...link} />
        <div className="eyebrow px-3 pt-5 pb-2">Your memory</div>
        <SideLink id="reminders" {...link} /><SideLink id="memory" {...link} /><SideLink id="timeline" {...link} />
        <div className="eyebrow px-3 pt-5 pb-2">Account</div>
        <SideLink id="connectors" {...link} /><SideLink id="settings" {...link} />
        {user?.role === "admin" && <SideLink id="admin" {...link} />}
      </nav>

      <div className="flex items-center gap-2.5 border-t border-line p-3">
        <Avatar name={user?.name} size={36} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{user?.name}</div>
          <div className="truncate text-xs text-subtle">{user?.email}</div>
        </div>
        <button onClick={toggle} className="icon-btn size-9" aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}>
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button onClick={() => go("logout")} className="icon-btn size-9 hover:text-danger" aria-label="Sign out">
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
}
