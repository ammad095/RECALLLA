// ============================================================
// FILE PATH:  recalla/src/Admin.jsx
// PURPOSE:    Admin — user accounts and recent sign-ins.
//
//             The old "System" tab and "All systems operational" badge
//             showed hard-coded numbers, not real status, so they are gone.
// ============================================================

import { useState, useEffect } from "react";
import { Users, UserCheck, AudioLines, ShieldCheck, Search } from "lucide-react";
import { adminListUsers, adminUpdateUser } from "./data_api";
import { fmtWhen } from "./format";
import { Screen, Banner, SkeletonList, Segmented, Toggle, Avatar } from "./ui/kit";

export default function Admin({ navigate }) {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [tab, setTab]         = useState("users");
  const [search, setSearch]   = useState("");

  useEffect(() => {
    let alive = true;
    adminListUsers()
      .then((r) => { if (alive) { setUsers(r.users || []); setError(null); } })
      .catch((e) => alive && setError(e.message))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  const toggleActive = async (u) => {
    try {
      await adminUpdateUser(u.id, { is_active: !u.is_active });
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, is_active: !x.is_active } : x)));
    } catch (e) { setError(e.message); }
  };

  const q = search.trim().toLowerCase();
  const shown = users.filter((u) => !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  const signIns = users.filter((u) => u.last_login_at)
    .sort((a, b) => new Date(b.last_login_at) - new Date(a.last_login_at));

  const stats = [
    { label: "Users",    value: users.length, Icon: Users, tone: "text-info" },
    { label: "Active",   value: users.filter((u) => u.is_active).length, Icon: UserCheck, tone: "text-brand" },
    { label: "Meetings", value: users.reduce((a, u) => a + (u.meetings || 0), 0), Icon: AudioLines, tone: "text-ai" },
    { label: "Admins",   value: users.filter((u) => u.role === "admin").length, Icon: ShieldCheck, tone: "text-danger" },
  ];

  return (
    <Screen title="Admin" subtitle="Accounts on this Recalla server" onBack={() => navigate("back", "settings")} width="max-w-4xl">
      {error && <Banner className="mb-4" onClose={() => setError(null)}>{error}</Banner>}

      <div className="mb-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card p-3.5">
            <s.Icon size={18} className={s.tone} />
            <div className="mt-2 text-2xl font-bold tabular-nums">{loading ? "–" : s.value}</div>
            <div className="text-[13px] text-muted">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="mb-4">
        <Segmented label="View" value={tab} onChange={setTab} options={[
          { value: "users", label: "Users" },
          { value: "activity", label: "Recent sign-ins" },
        ]} />
      </div>

      {loading ? <SkeletonList count={4} h="h-[72px]" /> : tab === "users" ? (
        <>
          <label className="relative mb-3 block">
            <Search size={18} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-subtle" />
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)}
                   placeholder="Search by name or email" aria-label="Search users" className="input pl-10" />
          </label>
          <ul className="card divide-y divide-line">
            {shown.map((u) => (
              <li key={u.id} className="flex items-center gap-3 px-4 py-3">
                <Avatar name={u.name} size={40} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium">{u.name}</span>
                    {u.role === "admin" && <span className="rounded bg-danger/12 px-1.5 text-[11px] font-semibold text-danger">ADMIN</span>}
                  </div>
                  <div className="truncate text-[13px] text-subtle">{u.email}</div>
                  <div className="text-xs text-subtle">
                    {u.meetings} meeting{u.meetings === 1 ? "" : "s"} · {u.last_login_at ? `seen ${fmtWhen(u.last_login_at)}` : "never signed in"}
                  </div>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Toggle on={u.is_active} onChange={() => toggleActive(u)}
                          label={`${u.is_active ? "Disable" : "Enable"} ${u.name}`} />
                  <span className={`text-[11px] font-medium ${u.is_active ? "text-brand" : "text-subtle"}`}>
                    {u.is_active ? "Active" : "Off"}
                  </span>
                </div>
              </li>
            ))}
            {shown.length === 0 && <li className="px-4 py-8 text-center text-subtle">No users match.</li>}
          </ul>
        </>
      ) : (
        <ul className="card divide-y divide-line">
          {signIns.map((u) => (
            <li key={u.id} className="flex items-center gap-3 px-4 py-3">
              <Avatar name={u.name} size={34} />
              <span className="min-w-0 flex-1 truncate text-[15px]"><span className="font-medium">{u.name}</span> signed in</span>
              <span className="shrink-0 text-[13px] text-subtle">{fmtWhen(u.last_login_at)}</span>
            </li>
          ))}
          {signIns.length === 0 && <li className="px-4 py-8 text-center text-subtle">No sign-ins yet.</li>}
        </ul>
      )}
    </Screen>
  );
}
