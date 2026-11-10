// ============================================================
// FILE PATH:  recalla/src/Reminders.jsx
// PURPOSE:    Things Recalla will nudge you about. Add one by hand,
//             or ask Recalla ("remind me to…") and it lands here.
// ============================================================

import { useState, useEffect } from "react";
import { Plus, Bell, Check, Trash2, MessageSquareText } from "lucide-react";
import { listReminders, createReminder, completeReminder, deleteReminder } from "./data_api";
import { fmtRelative } from "./format";
import { Screen, EmptyState, Segmented, SkeletonList, Banner, Sheet } from "./ui/kit";
import { useConfirm } from "./ui/useConfirm";

const PRIORITY = {
  high:   { label: "High",   dot: "bg-danger", on: "border-danger bg-danger/12 text-danger" },
  medium: { label: "Medium", dot: "bg-warn",   on: "border-warn bg-warn/12 text-warn" },
  low:    { label: "Low",    dot: "bg-info",   on: "border-info bg-info/12 text-info" },
};

const pad = (n) => String(n).padStart(2, "0");
const toDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const toTime = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

const fmtAbsolute = (iso) => {
  try {
    return new Date(iso).toLocaleString(undefined, {
      weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit",
    });
  } catch { return iso; }
};

// One tap covers most reminders; the pickers are there for the rest.
function presets() {
  const now = new Date();
  const inHour = new Date(now.getTime() + 60 * 60000);
  inHour.setMinutes(Math.ceil(inHour.getMinutes() / 5) * 5, 0, 0);
  const evening = new Date(now); evening.setHours(18, 0, 0, 0);
  const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1); tomorrow.setHours(9, 0, 0, 0);
  const list = [{ label: "In 1 hour", d: inHour }];
  if (now.getHours() < 17) list.push({ label: "This evening", d: evening });
  list.push({ label: "Tomorrow 9 AM", d: tomorrow });
  return list;
}

export default function Reminders({ navigate }) {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState("pending");
  const [adding, setAdding]       = useState(false);
  const [error, setError]         = useState(null);
  const [confirm, confirmDialog]  = useConfirm();

  // Bumping `version` re-reads the list for the current filter.
  const [version, setVersion] = useState(0);
  const refresh = () => setVersion((v) => v + 1);

  useEffect(() => {
    let alive = true;
    listReminders(filter)
      .then((res) => { if (alive) { setReminders(res.reminders || []); setError(null); } })
      .catch((e) => alive && setError(e.message))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [filter, version]);

  const changeFilter = (f) => {
    if (f === filter) return;
    setLoading(true);
    setFilter(f);
  };

  const toggle = async (r) => {
    // Feels instant; the list catches up with the server right after.
    setReminders((list) => list.map((x) => (x.id === r.id ? { ...x, completed: !x.completed } : x)));
    try { await completeReminder(r.id); refresh(); }
    catch (e) { setError(e.message); refresh(); }
  };

  const remove = async (r) => {
    if (!(await confirm({ title: "Delete this reminder?", body: `“${r.title}”`, action: "Delete" }))) return;
    try { await deleteReminder(r.id); refresh(); }
    catch (e) { setError(e.message); }
  };

  return (
    <Screen
      title="Reminders"
      subtitle="Recalla nudges you when these are due"
      actions={<button className="btn btn-primary btn-sm" onClick={() => setAdding(true)}><Plus size={17} /> Add</button>}
    >
      <div className="mb-4">
        <Segmented label="Show" value={filter} onChange={changeFilter} options={[
          { value: "pending", label: "To do" },
          { value: "completed", label: "Done" },
          { value: "all", label: "All" },
        ]} />
      </div>

      {error && <Banner className="mb-4" onClose={() => setError(null)}>{error}</Banner>}

      {loading ? <SkeletonList count={3} h="h-[72px]" /> : reminders.length === 0 ? (
        <EmptyState icon={Bell}
          title={filter === "completed" ? "Nothing done yet" : "You're all clear"}
          body={filter === "completed" ? "Reminders you tick off appear here."
            : "Add one here, or just tell Recalla: “remind me to call Ammad at 5”."}
          action={filter !== "completed" && (
            <div className="flex flex-wrap justify-center gap-2">
              <button className="btn btn-primary" onClick={() => setAdding(true)}><Plus size={18} /> Add reminder</button>
              <button className="btn btn-secondary" onClick={() => navigate("ask")}><MessageSquareText size={18} /> Ask Recalla</button>
            </div>
          )} />
      ) : (
        <ul className="space-y-2.5">
          {reminders.map((r) => {
            const overdue = !r.completed && r.datetime && new Date(r.datetime) < new Date();
            const p = PRIORITY[r.priority] || PRIORITY.medium;
            return (
              <li key={r.id} className={`card flex items-center gap-1 py-1.5 pr-1.5 pl-1.5 transition-opacity animate-rise ${r.completed ? "opacity-60" : ""}`}>
                <button onClick={() => toggle(r)} aria-label={r.completed ? "Mark as not done" : "Mark as done"}
                        className="grid size-11 shrink-0 place-items-center">
                  <span className={`grid size-6 place-items-center rounded-full border-2 transition-colors
                    ${r.completed ? "border-brand bg-brand text-on-brand" : "border-line-strong hover:border-brand"}`}>
                    {r.completed && <Check size={14} strokeWidth={3} />}
                  </span>
                </button>
                <div className="min-w-0 flex-1 py-1.5">
                  <div className={`font-medium leading-snug ${r.completed ? "line-through decoration-subtle" : ""}`}>{r.title}</div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[13px]">
                    <span className={overdue ? "font-medium text-danger" : "text-subtle"}>{fmtRelative(r.datetime)}</span>
                    <span className="text-subtle">· {fmtAbsolute(r.datetime)}</span>
                    <span className="inline-flex items-center gap-1 text-subtle">
                      · <span className={`size-1.5 rounded-full ${p.dot}`} />{p.label}
                    </span>
                  </div>
                </div>
                <button onClick={() => remove(r)} aria-label={`Delete ${r.title}`}
                        className="icon-btn size-10 text-subtle hover:text-danger">
                  <Trash2 size={18} />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* Mounted only while open, so every opening starts from a fresh form. */}
      {adding && (
        <AddReminder onClose={() => setAdding(false)}
                     onCreated={() => (filter === "pending" ? refresh() : changeFilter("pending"))} />
      )}
      {confirmDialog}
    </Screen>
  );
}

function AddReminder({ onClose, onCreated }) {
  const [title, setTitle]       = useState("");
  const [date, setDate]         = useState(() => toDate(presets()[0].d));
  const [time, setTime]         = useState(() => toTime(presets()[0].d));
  const [priority, setPriority] = useState("medium");
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState(null);

  const save = async (e) => {
    e.preventDefault();
    if (!title.trim() || !date) return;
    setSaving(true);
    try {
      // The picked time is the phone's local time. Sent without a zone, the
      // server read it as UTC — 9 AM in Karachi was stored as 2 PM.
      const when = new Date(`${date}T${time || "09:00"}:00`).toISOString();
      await createReminder({ title: title.trim(), datetime_iso: when, priority });
      onCreated();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open onClose={onClose} title="New reminder" labelledBy="add-reminder">
      <form onSubmit={save} className="space-y-4">
        <div>
          <label className="label" htmlFor="r-title">Remind me to…</label>
          <input id="r-title" className="input" value={title} onChange={(e) => setTitle(e.target.value)}
                 placeholder="Send the meeting notes to the team" autoFocus enterKeyHint="done" />
        </div>

        <div>
          <span className="label">When</span>
          <div className="no-scrollbar -mx-5 mb-2.5 flex gap-2 overflow-x-auto px-5">
            {presets().map((p) => {
              const on = toDate(p.d) === date && toTime(p.d) === time;
              return (
                <button type="button" key={p.label} aria-pressed={on} className="chip"
                        onClick={() => { setDate(toDate(p.d)); setTime(toTime(p.d)); }}>
                  {p.label}
                </button>
              );
            })}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input type="date" aria-label="Date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
            <input type="time" aria-label="Time" className="input" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
        </div>

        <div>
          <span className="label">Priority</span>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(PRIORITY).map(([key, p]) => (
              <button type="button" key={key} onClick={() => setPriority(key)} aria-pressed={priority === key}
                      className={`btn btn-sm border ${priority === key ? p.on : "border-line text-muted"}`}>
                <span className={`size-2 rounded-full ${p.dot}`} />{p.label}
              </button>
            ))}
          </div>
        </div>

        {error && <Banner>{error}</Banner>}

        <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={!title.trim() || !date || saving}>
            {saving ? "Saving…" : "Save reminder"}
          </button>
        </div>
      </form>
    </Sheet>
  );
}
