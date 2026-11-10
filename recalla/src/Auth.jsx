// ============================================================
// FILE PATH:  recalla/src/Auth.jsx
// PURPOSE:    Sign in / create account. For a first-time visitor this
//             is the front door, so it says what Recalla does first.
// ============================================================

import { useState } from "react";
import { Eye, EyeOff, Mic, Brain, MessageSquareText, Loader2 } from "lucide-react";
import { login as apiLogin, register as apiRegister } from "./auth_api";
import { Banner } from "./ui/kit";
import Logo from "./ui/Logo";

const STRENGTH = [
  { label: "",       bar: "bg-surface-3" },
  { label: "Weak",   bar: "bg-danger" },
  { label: "Fair",   bar: "bg-warn" },
  { label: "Good",   bar: "bg-info" },
  { label: "Strong", bar: "bg-brand" },
];

const FEATURES = [
  { Icon: Mic,      tone: "bg-surface-3 text-muted", title: "Record",       body: "Capture any meeting from your phone." },
  { Icon: Brain,    tone: "bg-surface-3 text-muted",   title: "Remember",     body: "Transcript, summary, decisions and tasks." },
  { Icon: MessageSquareText, tone: "bg-surface-3 text-muted",         title: "Ask anything", body: "Get answers, emails and reminders on demand." },
];

export default function Auth({ navigate, mode: initialMode = "login" }) {
  const [mode, setMode]         = useState(initialMode);
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const isRegister = mode === "register";

  const strength = (() => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  })();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (isRegister && !name.trim()) return setError("Please enter your name.");
    if (!email.trim() || !email.includes("@")) return setError("Please enter a valid email address.");
    if (!password) return setError("Please enter your password.");
    if (isRegister && strength < 2) return setError("Choose a stronger password — at least 8 characters with a number or capital letter.");

    setLoading(true);
    try {
      if (isRegister) await apiRegister(name.trim(), email.trim(), password);
      else await apiLogin(email.trim(), password);
      navigate("dashboard");
    } catch (err) {
      setError(err.message === "Failed to fetch"
        ? "Can't reach the Recalla server. Check your connection and try again."
        : err.message);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (m) => { setMode(m); setError(""); };

  return (
    <div className="h-dvh overflow-y-auto"
         style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="relative mx-auto grid min-h-dvh max-w-5xl grid-cols-1 items-center gap-8 px-5 py-10 lg:grid-cols-2 lg:gap-16">
        {/* What this is */}
        <div className="animate-rise">
          <div className="inline-flex items-center gap-3.5">
            <Logo size={52} />
            <div>
              <div className="text-[28px] font-medium leading-none">Recalla</div>
              <div className="mt-1 text-[15px] font-medium text-muted">Every meeting, remembered</div>
            </div>
          </div>
          <h1 className="mt-6 text-[28px] font-medium leading-tight sm:text-4xl">
            Never lose track of what was said in a meeting.
          </h1>
          <ul className="mt-6 hidden space-y-4 sm:block">
            {FEATURES.map(({ Icon, tone, title, body }) => (
              <li key={title} className="flex items-center gap-3.5">
                <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${tone}`}><Icon size={21} /></span>
                <span>
                  <span className="block font-medium">{title}</span>
                  <span className="block text-[15px] text-muted">{body}</span>
                </span>
              </li>
            ))}
          </ul>
          {/* Phones: the same three ideas, compact */}
          <div className="mt-4 flex gap-2 sm:hidden">
            {FEATURES.map(({ Icon, tone, title }) => (
              <span key={title} className="flex flex-1 flex-col items-center gap-1.5 rounded-2xl border border-line bg-surface p-3 text-center text-[13px] font-medium">
                <span className={`grid size-9 place-items-center rounded-lg ${tone}`}><Icon size={18} /></span>
                {title}
              </span>
            ))}
          </div>
        </div>

        {/* The form */}
        <div className="card w-full p-5 animate-rise sm:p-7 lg:max-w-md lg:justify-self-end" style={{ animationDelay: "60ms" }}>
          <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-surface-3/60 p-1" role="tablist">
            {[["login", "Sign in"], ["register", "Create account"]].map(([m, label]) => (
              <button key={m} role="tab" aria-selected={mode === m} onClick={() => switchMode(m)}
                      className={`min-h-10 rounded-lg text-sm font-medium transition-colors
                        ${mode === m ? "bg-surface text-fg shadow-card" : "text-muted hover:text-fg"}`}>
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {isRegister && (
              <div>
                <label className="label" htmlFor="a-name">Your name</label>
                <input id="a-name" className="input" value={name} onChange={(e) => setName(e.target.value)}
                       autoComplete="name" placeholder="Ammad Ahmad" />
              </div>
            )}

            <div>
              <label className="label" htmlFor="a-email">Email</label>
              <input id="a-email" type="email" inputMode="email" autoComplete="email" autoCapitalize="none"
                     className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>

            <div>
              <label className="label" htmlFor="a-pass">Password</label>
              <div className="relative">
                <input id="a-pass" type={showPass ? "text" : "password"} className="input pr-12"
                       autoComplete={isRegister ? "new-password" : "current-password"}
                       value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="button" onClick={() => setShowPass((s) => !s)}
                        aria-label={showPass ? "Hide password" : "Show password"}
                        className="absolute top-1/2 right-1 grid size-10 -translate-y-1/2 place-items-center rounded-lg text-subtle hover:text-fg">
                  {showPass ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
              {isRegister && password && (
                <div className="mt-2" aria-live="polite">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <span key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= strength ? STRENGTH[strength].bar : "bg-surface-3"}`} />
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-subtle">Password strength: {STRENGTH[strength].label}</p>
                </div>
              )}
            </div>

            {error && <Banner>{error}</Banner>}

            <button type="submit" disabled={loading} className="btn btn-primary w-full">
              {loading && <Loader2 size={18} className="animate-spin" />}
              {loading ? (isRegister ? "Creating your account…" : "Signing in…") : isRegister ? "Create account" : "Sign in"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-muted">
            {isRegister ? "Already have an account? " : "New to Recalla? "}
            <button className="font-medium text-brand" onClick={() => switchMode(isRegister ? "login" : "register")}>
              {isRegister ? "Sign in" : "Create an account"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
