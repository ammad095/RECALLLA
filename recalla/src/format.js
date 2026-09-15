// ============================================================
// FILE PATH:  recalla/src/format.js
// PURPOSE:    Shared date/duration formatting so every page renders
//             timestamps the same way.
// ============================================================

/** "Today · 4:00 PM", "Yesterday · 11:20 AM", "Mon · 3:25 PM", "14 Jun · 9:00 AM" */
export function fmtWhen(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";

  const time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

  const startOfDay = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate());
  const days = Math.round((startOfDay(new Date()) - startOfDay(d)) / 86400000);

  if (days === 0)  return `Today · ${time}`;
  if (days === 1)  return `Yesterday · ${time}`;
  if (days === -1) return `Tomorrow · ${time}`;
  if (days > 1 && days < 7)   return `${d.toLocaleDateString(undefined, { weekday: "short" })} · ${time}`;
  if (days < -1 && days > -7) return `${d.toLocaleDateString(undefined, { weekday: "short" })} · ${time}`;
  return `${d.toLocaleDateString(undefined, { day: "numeric", month: "short" })} · ${time}`;
}

/** Relative distance for reminders: "3d overdue", "in 2h", "in 5m". */
export function fmtRelative(iso) {
  if (!iso) return "No date";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "No date";

  const mins = Math.round((d - new Date()) / 60000);
  const abs = Math.abs(mins);
  const unit =
    abs < 60   ? `${abs}m` :
    abs < 1440 ? `${Math.round(abs / 60)}h` :
                 `${Math.round(abs / 1440)}d`;

  return mins < 0 ? `${unit} overdue` : `in ${unit}`;
}

/** Seconds → "32m", "1h 12m", "45s". */
export function fmtDuration(seconds) {
  const s = Math.max(0, Math.round(seconds || 0));
  if (s < 60) return `${s}s`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

/** Seconds → "02:15" for transcript positions. */
export function fmtClock(seconds) {
  const s = Math.max(0, Math.floor(seconds || 0));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}
