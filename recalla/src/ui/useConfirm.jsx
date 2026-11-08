// ============================================================
// FILE PATH:  recalla/src/ui/useConfirm.jsx
// PURPOSE:    An in-app confirm dialog in place of window.confirm.
// ============================================================

import { useState, useCallback } from "react";
import { Sheet } from "./kit";

/**
 * A confirm dialog that fits the app, instead of the browser's native one
 * (which in the Android WebView shows the server's address as its title).
 *
 *   const [confirm, dialog] = useConfirm();
 *   if (await confirm({ title, body, action: "Delete" })) …
 *   return <>{…}{dialog}</>;
 */
export function useConfirm() {
  const [state, setState] = useState(null);
  const confirm = useCallback((opts) => new Promise((resolve) => setState({ ...opts, resolve })), []);
  const close = (v) => { state?.resolve(v); setState(null); };

  const dialog = (
    <Sheet open={!!state} onClose={() => close(false)} title={state?.title} labelledBy="confirm-title">
      {state?.body && <p className="mb-5 text-[15px] leading-relaxed text-muted">{state.body}</p>}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button className="btn btn-secondary" onClick={() => close(false)}>Cancel</button>
        <button className={`btn ${state?.tone === "neutral" ? "btn-primary" : "btn-danger"}`} onClick={() => close(true)} autoFocus>
          {state?.action || "Confirm"}
        </button>
      </div>
    </Sheet>
  );
  return [confirm, dialog];
}
