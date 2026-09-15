// ============================================================
// FILE PATH:  recalla/src/auth_api.js
// PURPOSE:    Auth calls + token storage, and an authFetch() wrapper
//             that transparently refreshes an expired access token.
// ============================================================

import { API_AUTH as AUTH_BASE } from "./config";

const ACCESS_KEY  = "recalla_access_token";
const REFRESH_KEY = "recalla_refresh_token";
const USER_KEY    = "recalla_user";

// ── Token storage ────────────────────────────────────────────────────────────

export const getAccessToken  = () => localStorage.getItem(ACCESS_KEY);
export const getRefreshToken = () => localStorage.getItem(REFRESH_KEY);

export function getStoredUser() {
  try { return JSON.parse(localStorage.getItem(USER_KEY) || "null"); }
  catch { return null; }
}

function storeSession({ access_token, refresh_token, user }) {
  localStorage.setItem(ACCESS_KEY, access_token);
  localStorage.setItem(REFRESH_KEY, refresh_token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  return user;
}

export function clearSession() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}

export const isSignedIn = () => Boolean(getAccessToken());

// Surface expiry to the app so it can bounce to the login screen.
function notifySignedOut() {
  clearSession();
  window.dispatchEvent(new CustomEvent("recalla:signed-out"));
}

async function parseError(res, fallback) {
  const body = await res.json().catch(() => null);
  const d = body?.detail;
  if (typeof d === "string") return d;
  // FastAPI validation errors come back as a list of objects.
  if (Array.isArray(d) && d[0]?.msg) return d[0].msg;
  return fallback;
}

// ── Public auth calls ────────────────────────────────────────────────────────

export async function register(name, email, password) {
  const res = await fetch(`${AUTH_BASE}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  if (!res.ok) throw new Error(await parseError(res, "Could not create account"));
  return storeSession(await res.json());
}

export async function login(email, password) {
  const res = await fetch(`${AUTH_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(await parseError(res, "Could not sign in"));
  return storeSession(await res.json());
}

export function logout() {
  clearSession();
}

// Only one refresh runs at a time; concurrent 401s wait on the same promise.
let refreshInFlight = null;

async function refreshAccessToken() {
  const rt = getRefreshToken();
  if (!rt) return null;

  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const res = await fetch(`${AUTH_BASE}/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: rt }),
        });
        if (!res.ok) { notifySignedOut(); return null; }
        const data = await res.json();
        storeSession(data);
        return data.access_token;
      } catch {
        return null;                    // offline: keep the session, let the caller fail
      } finally {
        refreshInFlight = null;
      }
    })();
  }
  return refreshInFlight;
}

/**
 * fetch() with the bearer token attached. On a 401 it refreshes once and
 * retries, so an expired access token is invisible to callers.
 */
export async function authFetch(url, options = {}, _retried = false) {
  const token = getAccessToken();
  const headers = { ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, { ...options, headers });

  if (res.status === 401 && !_retried && getRefreshToken()) {
    const fresh = await refreshAccessToken();
    if (fresh) return authFetch(url, options, true);
    notifySignedOut();
  }
  return res;
}

/** Confirm the stored token still works (called on app start). */
export async function fetchMe() {
  const res = await authFetch(`${AUTH_BASE}/me`);
  if (!res.ok) return null;
  const user = await res.json();
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  return user;
}

export async function updateProfile({ name, currentPassword, newPassword }) {
  const res = await authFetch(`${AUTH_BASE}/me`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      current_password: currentPassword,
      new_password: newPassword,
    }),
  });
  if (!res.ok) throw new Error(await parseError(res, "Could not update profile"));
  const user = await res.json();
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  return user;
}
