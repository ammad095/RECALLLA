// ============================================================
// FILE PATH:  recalla/src/MeetingsList.jsx
// PURPOSE:    Every recorded meeting, newest first, searchable.
// ============================================================

import { useState, useEffect, useMemo } from "react";
import { Search, Plus, AudioLines, Trash2, Users, Clock, ChevronRight, X } from "lucide-react";
import { listMeetings, deleteMeeting } from "./data_api";
import { fmtWhen, fmtDuration } from "./format";
import { Screen, EmptyState, Banner, SkeletonList } from "./ui/kit";
import { useConfirm } from "./ui/useConfirm";

export default function MeetingsList({ navigate }) {
  const [search, setSearch]     = useState("");
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [confirm, confirmDialog] = useConfirm();

  useEffect(() => {
    let alive = true;
    listMeetings()
      .then((rows) => { if (alive) { setMeetings(rows); setError(null); } })
      .catch((e) => alive && setError(e.message))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  const remove = async (e, m) => {
    e.stopPropagation();
    const ok = await confirm({
      title: "Delete this meeting?",
      body: `“${m.title}” and its transcript will be removed for good.`,
      action: "Delete",
    });
    if (!ok) return;
    try {
      await deleteMeeting(m.id);
      setMeetings((prev) => prev.filter((x) => x.id !== m.id));
    } catch (err) { setError(err.message); }
  };

  const q = search.trim().toLowerCase();
  const filtered = useMemo(() => meetings.filter((m) =>
    !q || m.title.toLowerCase().includes(q) || (m.tags || []).some((t) => t.toLowerCase().includes(q))
  ), [meetings, q]);

  return (
    <Screen
      title="Meetings"
      subtitle={loading ? "Loading…" : `${meetings.length} recorded`}
      actions={
        <button className="btn btn-primary btn-sm" onClick={() => navigate("record")}>
          <Plus size={17} /> <span className="hidden sm:inline">Record</span><span className="sm:hidden">New</span>
        </button>
      }
    >
      {meetings.length > 0 && (
        <label className="relative mb-4 block">
          <Search size={18} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-subtle" />
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)}
                 placeholder="Search titles and topics" aria-label="Search meetings"
                 className="input pr-10 pl-10" />
          {search && (
            <button onClick={() => setSearch("")} aria-label="Clear search"
                    className="absolute top-1/2 right-1.5 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-subtle hover:text-fg">
              <X size={16} />
            </button>
          )}
        </label>
      )}

      {error && <Banner className="mb-4" onClose={() => setError(null)}>{error}</Banner>}

      {loading ? <SkeletonList count={4} h="h-[84px]" /> : filtered.length === 0 ? (
        meetings.length === 0 ? (
          <EmptyState icon={AudioLines} title="No meetings yet"
            body="Record your first meeting. Recalla will write the transcript and summary, and remember it for later."
            action={<button className="btn btn-primary" onClick={() => navigate("record")}><Plus size={18} /> Record a meeting</button>} />
        ) : (
          <EmptyState icon={Search} tone="muted" title="No matches"
            body={`Nothing called “${search}”. Try another word, or ask Recalla — it searches what was said, too.`} />
        )
      ) : (
        <ul className="space-y-2.5">
          {filtered.map((m, i) => {
            const speakers = (m.speakers || []).length || 1;
            return (
              <li key={m.id} className="animate-rise" style={{ animationDelay: `${Math.min(i, 8) * 30}ms` }}>
                <div role="button" tabIndex={0}
                     onClick={() => navigate("detail", m)}
                     onKeyDown={(e) => e.key === "Enter" && navigate("detail", m)}
                     className="card-tap group flex w-full items-start gap-3 p-3.5 sm:p-4">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand/12 text-brand">
                    <AudioLines size={20} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold leading-snug">{m.title}</span>
                    <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-subtle">
                      <span>{fmtWhen(m.started_at)}</span>
                      <span className="inline-flex items-center gap-1"><Clock size={13} />{fmtDuration(m.duration_seconds)}</span>
                      <span className="inline-flex items-center gap-1"><Users size={13} />{speakers}</span>
                    </span>
                    {m.tags?.length > 0 && (
                      <span className="mt-2 flex flex-wrap gap-1.5">
                        {m.tags.slice(0, 4).map((t) => <span key={t} className="tag">{t}</span>)}
                      </span>
                    )}
                  </span>
                  <button onClick={(e) => remove(e, m)} aria-label={`Delete ${m.title}`}
                          className="icon-btn -my-1 -mr-1.5 size-10 text-subtle hover:text-danger sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100">
                    <Trash2 size={18} />
                  </button>
                  <ChevronRight size={18} className="mt-3 hidden shrink-0 text-subtle sm:block" />
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {confirmDialog}
    </Screen>
  );
}
