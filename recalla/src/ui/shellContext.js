// ============================================================
// FILE PATH:  recalla/src/ui/shellContext.js
// PURPOSE:    Lets a page talk to the app frame around it.
// ============================================================

import { createContext, useContext } from "react";

export const ShellCtx = createContext({ setImmersive: () => {} });

/** Pages call setImmersive(true) to hide navigation, e.g. while recording. */
export const useShell = () => useContext(ShellCtx);
