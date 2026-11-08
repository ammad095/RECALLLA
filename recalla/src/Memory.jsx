// ============================================================
// FILE PATH:  recalla/src/Memory.jsx
// PURPOSE:    What Recalla took away from your meetings: decisions,
//             tasks, deadlines and open questions, each linked back
//             to the meeting it came from.
// ============================================================

import { useState, useEffect, useMemo } from "react";
import { Search, Brain, CheckCircle2, ListTodo, CalendarClock, HelpCircle, ChevronRight } from "lucide-react";
import { getMemory } from "./data_api";
import { fmtWhen } from "./format";
import { Screen, EmptyState, Segmented, SkeletonList } from "./ui/kit";

const TYPES = {
  decision: { label: "Decisions", Icon: CheckCircle2,  tone: "bg-brand/12 text-brand" },
  task:     { label: "Tasks",     Icon: ListTodo,      tone: "bg-ai/12 text-ai" },
  deadline: { label: "Deadlines", Icon: CalendarClock, tone: "bg-danger/12 text-danger" },
  question: { label: "Questions", Icon: HelpCircle,    tone: "bg-info/12 text-info" },
};

export default function Memory({ navigate }) {
  const [search, setSearch]   = useState("");
  const [filter, setFilter]   = useState("all");
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    getMemory()
      .then((r) => alive && setItems((r.items || []).map((m) => ({
        id: m.id, type: m.kind, content: m.text,
        date: fmtWhen(m.at), meeting: m.meeting_title, meetingId: m.meeting_id,
      }))))
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  const counts = useMemo(() => items.reduce((a, m) => ({ ...a, [m.type]: (a[m.type] || 0) + 1 }), {}), [items]);
  const q = search.trim().toLowerCase();
  const filtered = items.filter((m) =>
    (filter === "all" || m.type === filter) && (!q || m.content.toLowerCase().includes(q)));

  return (
    <Screen title="Memory" subtitle="What Recalla took away from your meetings">
      {items.length > 0 && (
        <>
          <label className="relative mb-3 block">
            <Search size={18} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-subtle" />
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)}
                   placeholder="Search memories" aria-label="Search memories" className="input pl-10" />
          </label>
          <div className="mb-4">
            <Segmented label="Filter by kind" value={filter} onChange={setFilter} options={[
              { value: "all", label: "All", count: items.length },
              ...Object.entries(TYPES).map(([value, t]) => ({ value, label: t.label, count: counts[value] || 0 })),
            ]} />
          </div>
        </>
      )}

      {loading ? <SkeletonList count={4} h="h-24" /> : filtered.length === 0 ? (
        items.length === 0 ? (
          <EmptyState icon={Brain} title="Nothing remembered yet"
            body="After each meeting Recalla picks out the decisions, tasks, deadlines and open questions. They collect here."
            action={<button className="btn btn-primary" onClick={() => navigate("record")}>Record a meeting</button>} />
        ) : <EmptyState icon={Search} tone="muted" title="Nothing matches" body="Try a different word or kind." />
      ) : (
        <ul className="space-y-2.5">
          {filtered.map((m, i) => {
            const t = TYPES[m.type] || TYPES.question;
            return (
              <li key={m.id} className="card p-3.5 animate-rise sm:p-4" style={{ animationDelay: `${Math.min(i, 8) * 30}ms` }}>
                <div className="flex gap-3">
                  <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${t.tone}`}>
                    <t.Icon size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] leading-relaxed">{m.content}</p>
                    {m.meetingId ? (
                      <button onClick={() => navigate("detail", { id: m.meetingId })}
                              className="mt-1.5 -ml-1 inline-flex max-w-full items-center gap-1 rounded-md px-1 py-0.5 text-[13px] text-subtle hover:bg-surface-2 hover:text-fg">
                        <span className="truncate">{m.meeting} · {m.date}</span>
                        <ChevronRight size={14} className="shrink-0" />
                      </button>
                    ) : (
                      <p className="mt-1.5 text-[13px] text-subtle">{m.meeting} · {m.date}</p>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Screen>
  );
}
