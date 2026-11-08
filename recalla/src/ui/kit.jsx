// ============================================================
// FILE PATH:  recalla/src/ui/kit.jsx
// PURPOSE:    The handful of building blocks every screen shares:
//             page frame, empty state, banner, tabs, sheet, toggle.
// ============================================================

import { useEffect, useRef } from "react";
import { ChevronLeft, AlertCircle, CheckCircle2, Info, X } from "lucide-react";

/**
 * One screen: a sticky header and a scrolling body.
 *
 * The body leaves room at the bottom for the phone tab bar, so the last item
 * in a list is never hidden behind it. `scroll={false}` hands the layout to
 * the page (Ask Recalla manages its own scroll and composer).
 */
export function Screen({
  title, subtitle, onBack, actions, children,
  scroll = true, width = "max-w-3xl", bodyClass = "",
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="glass-bar sticky top-0 z-20 border-b border-line"
              style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <div className={`mx-auto flex min-h-14 w-full items-center gap-1 px-2 sm:px-4 ${width}`}>
          {onBack ? (
            <button className="icon-btn -ml-1" onClick={onBack} aria-label="Back">
              <ChevronLeft size={24} />
            </button>
          ) : <span className="w-2" />}
          <div className="min-w-0 flex-1 py-2">
            <h1 className="truncate text-[17px] font-semibold leading-tight sm:text-lg">{title}</h1>
            {subtitle && <p className="truncate text-[13px] text-subtle">{subtitle}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
        </div>
      </header>

      {scroll ? (
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className={`mx-auto w-full px-4 pt-4 pb-[calc(96px+env(safe-area-inset-bottom))] sm:px-6 lg:pb-12 ${width} ${bodyClass}`}>
            {children}
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      )}
    </div>
  );
}

/** Friendly "nothing here yet" with a way forward. */
export function EmptyState({ icon: Icon, title, body, action, tone = "brand" }) {
  const toneCls = { brand: "bg-brand/12 text-brand", ai: "bg-ai/12 text-ai", muted: "bg-surface-3 text-muted" }[tone];
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center animate-rise">
      {Icon && (
        <div className={`mb-4 grid size-14 place-items-center rounded-2xl ${toneCls}`}>
          <Icon size={26} strokeWidth={1.8} />
        </div>
      )}
      <h2 className="text-lg font-semibold">{title}</h2>
      {body && <p className="mt-1.5 max-w-sm text-[15px] leading-relaxed text-muted">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** Inline message. `tone`: error | success | info | warn. */
export function Banner({ tone = "error", children, onClose, className = "" }) {
  const cfg = {
    error:   { Icon: AlertCircle,  cls: "border-danger/30 bg-danger/10 text-danger" },
    success: { Icon: CheckCircle2, cls: "border-brand/30 bg-brand/10 text-brand" },
    warn:    { Icon: AlertCircle,  cls: "border-warn/30 bg-warn/10 text-warn" },
    info:    { Icon: Info,         cls: "border-info/30 bg-info/10 text-info" },
  }[tone];
  return (
    <div role={tone === "error" ? "alert" : "status"}
         className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm leading-snug animate-fade-in ${cfg.cls} ${className}`}>
      <cfg.Icon size={18} className="mt-px shrink-0" />
      <div className="min-w-0 flex-1 text-fg/90">{children}</div>
      {onClose && (
        <button onClick={onClose} aria-label="Dismiss" className="-m-1 rounded-md p-1 opacity-70 hover:opacity-100">
          <X size={16} />
        </button>
      )}
    </div>
  );
}

/** Pill tabs that scroll sideways on a narrow phone instead of wrapping. */
export function Segmented({ value, onChange, options, label }) {
  return (
    <div role="tablist" aria-label={label}
         className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      {options.map((o) => (
        <button key={o.value} role="tab" aria-selected={value === o.value} aria-pressed={value === o.value}
                onClick={() => onChange(o.value)} className="chip">
          {o.icon && <o.icon size={15} />}
          {o.label}
          {o.count != null && (
            <span className={`text-xs tabular-nums ${value === o.value ? "opacity-70" : "text-subtle"}`}>{o.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

/** Underlined tabs for switching views inside one record (meeting detail). */
export function Tabs({ value, onChange, options }) {
  return (
    <div role="tablist" className="no-scrollbar flex gap-1 overflow-x-auto border-b border-line">
      {options.map((o) => {
        const on = value === o.value;
        return (
          <button key={o.value} role="tab" aria-selected={on} onClick={() => onChange(o.value)}
                  className={`relative min-h-11 shrink-0 px-3.5 text-[15px] font-medium transition-colors
                    ${on ? "text-fg" : "text-subtle hover:text-muted"}`}>
            {o.label}
            {o.count ? <span className="ml-1.5 text-xs text-subtle tabular-nums">{o.count}</span> : null}
            <span className={`absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand transition-opacity ${on ? "opacity-100" : "opacity-0"}`} />
          </button>
        );
      })}
    </div>
  );
}

export function Toggle({ on, onChange, disabled, label }) {
  return (
    <button role="switch" aria-checked={on} aria-label={label} disabled={disabled}
            onClick={() => onChange(!on)}
            className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200
              ${on ? "bg-brand" : "bg-surface-3"} disabled:opacity-50`}>
      <span className={`absolute top-0.5 left-0.5 size-6 rounded-full bg-white shadow transition-transform duration-200 ease-out-soft
        ${on ? "translate-x-5" : ""}`} />
    </button>
  );
}

export function SkeletonList({ count = 3, h = "h-20" }) {
  return (
    <div className="space-y-2.5" aria-busy="true" aria-label="Loading">
      {Array.from({ length: count }, (_, i) => <div key={i} className={`skeleton ${h}`} />)}
    </div>
  );
}

export function SectionHeader({ title, action, onAction }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-[15px] font-semibold">{title}</h2>
      {action && (
        <button onClick={onAction} className="-mr-2 rounded-lg px-2 py-1.5 text-sm font-medium text-brand hover:bg-brand/10">
          {action}
        </button>
      )}
    </div>
  );
}

function initials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "?";
}

export function Avatar({ name, size = 36 }) {
  return (
    <span className="grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand to-ai font-semibold text-on-brand"
          style={{ width: size, height: size, fontSize: size * 0.36 }} aria-hidden="true">
      {initials(name)}
    </span>
  );
}

/**
 * Bottom sheet on phones, centred dialog on wider screens.
 * Closes on the scrim, on Escape, and returns focus where it came from.
 */
export function Sheet({ open, onClose, title, children, labelledBy }) {
  const panel = useRef(null);
  // Callers pass a fresh onClose each render; reading it through a ref keeps
  // the effect below from re-running (and re-grabbing focus) mid-typing.
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; });
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement;
    const onKey = (e) => e.key === "Escape" && closeRef.current();
    window.addEventListener("keydown", onKey);
    // Move focus into the sheet, unless a field inside already took it
    // (autoFocus), which is what brings up the phone keyboard.
    if (!panel.current?.contains(document.activeElement)) panel.current?.focus();
    return () => { window.removeEventListener("keydown", onKey); prev?.focus?.(); };
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div className="absolute inset-0 animate-fade-in" style={{ background: "var(--scrim)" }} onClick={onClose} />
      <div ref={panel} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={labelledBy}
           className="relative max-h-[88dvh] w-full overflow-y-auto glass-panel rounded-t-3xl border border-line p-5 pb-[calc(20px+env(safe-area-inset-bottom))]
                      outline-none animate-sheet-in sm:max-w-md sm:rounded-3xl sm:pb-5">
        <div className="mx-auto -mt-2 mb-3 h-1 w-10 rounded-full bg-line-strong sm:hidden" />
        {title && <h2 id={labelledBy} className="mb-3 text-lg font-semibold">{title}</h2>}
        {children}
      </div>
    </div>
  );
}
