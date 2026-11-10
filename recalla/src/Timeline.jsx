// ============================================================
// FILE PATH:  recalla/src/Timeline.jsx
// PURPOSE:    Everything Recalla knows about, in the order it happened,
//             grouped by day.
// ============================================================

import { useState, useEffect } from "react";
import { History, AudioLines, Bell, ChevronRight } from "lucide-react";
import { getTimeline } from "./data_api";
import { Screen, EmptyState, Segmented, SkeletonList } from "./ui/kit";

const TYPES = {
  meeting:  { label: "Meetings",  Icon: AudioLines, tone: "bg-surface-3 text-muted", to: "detail" },
  reminder: { label: "Reminders", Icon: Bell,       tone: "bg-surface-3 text-muted",       to: "reminders" },
};

// Group by calendar day so the feed reads as "Today / Yesterday / 14 Jun".
function dayLabel(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Earlier";
  const day = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate());
  const diff = Math.round((day(new Date()) - day(d)) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff === -1) return "Tomorrow";
  if (diff > 1 && diff < 7) return d.toLocaleDateString(undefined, { weekday: "long" });
  return d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
}

export default function Timeline({ navigate }) {
  const [filter, setFilter]   = useState("all");
  const [events, setEvents]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    getTimeline()
      .then((r) => alive && setEvents((r.events || []).map((e) => ({
        ...e,
        day: dayLabel(e.at),
        time: new Date(e.at).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }),
      }))))
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  const filtered = filter === "all" ? events : events.filter((e) => e.type === filter);
  const groups = filtered.reduce((acc, e) => {
    (acc[e.day] ||= []).push(e);
    return acc;
  }, {});

  const open = (e) => (e.type === "meeting" ? navigate("detail", { id: e.id }) : navigate("reminders"));

  return (
    <Screen title="Timeline" subtitle="Meetings and reminders, in order">
      {events.length > 0 && (
        <div className="mb-5">
          <Segmented label="Filter" value={filter} onChange={setFilter} options={[
            { value: "all", label: "All", count: events.length },
            ...Object.entries(TYPES).map(([value, t]) => ({
              value, label: t.label, count: events.filter((e) => e.type === value).length,
            })),
          ]} />
        </div>
      )}

      {loading ? <SkeletonList count={4} h="h-16" /> : filtered.length === 0 ? (
        <EmptyState icon={History} title="Nothing here yet"
          body="Meetings you record and reminders you set show up here, day by day." />
      ) : (
        Object.entries(groups).map(([day, list]) => (
          <section key={day} className="mb-6">
            <h2 className="sticky top-0 z-10 -mx-4 mb-2 bar px-4 py-1.5 text-sm font-medium text-muted rounded-lg sm:mx-0 sm:px-0">
              {day}
            </h2>
            <ol className="relative ml-5 border-l border-line">
              {list.map((e, i) => {
                const t = TYPES[e.type] || TYPES.meeting;
                return (
                  <li key={`${e.type}-${e.id}-${i}`} className="relative mb-2 pl-6">
                    <span className={`absolute top-3.5 -left-[17px] grid size-8 place-items-center rounded-full ring-4 ring-bg ${t.tone}`}>
                      <t.Icon size={15} />
                    </span>
                    <button onClick={() => open(e)} className="card-tap flex w-full items-center gap-3 p-3">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{e.title}</span>
                        <span className="block text-[13px] text-subtle">{e.time} · {e.detail}</span>
                      </span>
                      <ChevronRight size={17} className="shrink-0 text-subtle" />
                    </button>
                  </li>
                );
              })}
            </ol>
          </section>
        ))
      )}
    </Screen>
  );
}
