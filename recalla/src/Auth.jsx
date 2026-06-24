// ============================================================
// FILE PATH:  recalla/src/Auth.jsx
// PURPOSE:    Login + Register in one component. Minimal centered card.
// ============================================================

import { useState } from "react";
import { COLORS, FONTS, GLOBAL_CSS } from "./theme";

export default function Auth({ navigate, mode: initialMode = "login" }) {
  const [mode, setMode]         = useState(initialMode); // "login" | "register"
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const isRegister = mode === "register";

  // Password strength (only for register)
  const strength = (() => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 8)    s++;
    if (/[A-Z]/.test(password))  s++;
    if (/[0-9]/.test(password))  s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  })();
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][strength];
  const strengthColor = [COLORS.textTertiary, COLORS.red, COLORS.amber, COLORS.cyan, COLORS.emerald][strength];

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (isRegister && !name.trim()) return setError("Name is required");
    if (!email.trim() || !email.includes("@")) return setError("Valid email required");
    if (!password) return setError("Password required");
    if (isRegister && strength < 2) return setError("Password too weak");

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate("dashboard");
    }, 800);
  };

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div style={{
        height: "100vh", width: "100vw", background: COLORS.bg,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24, overflow: "auto",
        backgroundImage: `radial-gradient(circle at 20% 30%, rgba(52,211,153,0.06) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(167,139,250,0.06) 0%, transparent 50%)`,
      }}>
        <div className="fade-up" style={{ width: "100%", maxWidth: 420 }}>

          {/* Logo */}
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{
              width: 56, height: 56, margin: "0 auto 16px",
              background: `linear-gradient(135deg, ${COLORS.emerald}, ${COLORS.cyan})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: COLORS.glow.emerald,
            }}>
              <span style={{ fontFamily: FONTS.heading, fontSize: 28, color: COLORS.bg }}>R</span>
            </div>
            <div style={{
              fontFamily: FONTS.heading, fontSize: 42, lineHeight: 1,
              textTransform: "uppercase", letterSpacing: "0.02em", marginBottom: 8,
            }}>
              Recalla
            </div>
            <div style={{
              fontFamily: FONTS.mono, fontSize: 10, color: COLORS.textSecondary,
              textTransform: "uppercase", letterSpacing: "0.18em",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}>
              <span className="status-dot" style={{ background: COLORS.emerald }}/>
              AI Meeting Memory
            </div>
          </div>

          {/* Card */}
          <div className="corners" style={{
            background: COLORS.surface, border: `1px solid ${COLORS.border}`,
            padding: "28px 28px",
          }}>
            {/* Mode toggle */}
            <div style={{ display: "flex", gap: 4, padding: 3, background: COLORS.bg, marginBottom: 22, borderRadius: 999 }}>
              {["login", "register"].map(m => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setError(""); }}
                  style={{
                    flex: 1, background: mode === m
                      ? `linear-gradient(135deg, ${COLORS.emerald}, ${COLORS.cyan})`
                      : "transparent",
                    color: mode === m ? COLORS.bg : COLORS.textSecondary,
                    border: "none", padding: "8px 12px",
                    fontFamily: FONTS.mono, fontSize: 11, fontWeight: 600,
                    textTransform: "uppercase", letterSpacing: "0.1em",
                    cursor: "pointer", borderRadius: 999,
                    transition: "all 0.2s",
                  }}
                >
                  {m === "login" ? "Sign In" : "Register"}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit}>
              {/* Name (register only) */}
              {isRegister && (
                <div style={{ marginBottom: 14 }}>
                  <label style={{
                    display: "block", fontFamily: FONTS.mono, fontSize: 10,
                    color: COLORS.textSecondary, textTransform: "uppercase",
                    letterSpacing: "0.1em", marginBottom: 6,
                  }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Ammad Ahmad"
                    style={{
                      width: "100%", background: COLORS.bg,
                      border: `1px solid ${COLORS.border}`, color: COLORS.textPrimary,
                      padding: "10px 14px", fontFamily: FONTS.body, fontSize: 14,
                      outline: "none", transition: "border 0.2s",
                    }}
                    onFocus={e => e.target.style.borderColor = COLORS.borderEmerald}
                    onBlur={e => e.target.style.borderColor = COLORS.border}
                  />
                </div>
              )}

              <div style={{ marginBottom: 14 }}>
                <label style={{
                  display: "block", fontFamily: FONTS.mono, fontSize: 10,
                  color: COLORS.textSecondary, textTransform: "uppercase",
                  letterSpacing: "0.1em", marginBottom: 6,
                }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  style={{
                    width: "100%", background: COLORS.bg,
                    border: `1px solid ${COLORS.border}`, color: COLORS.textPrimary,
                    padding: "10px 14px", fontFamily: FONTS.body, fontSize: 14,
                    outline: "none", transition: "border 0.2s",
                  }}
                  onFocus={e => e.target.style.borderColor = COLORS.borderEmerald}
                  onBlur={e => e.target.style.borderColor = COLORS.border}
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  fontFamily: FONTS.mono, fontSize: 10, color: COLORS.textSecondary,
                  textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6,
                }}>
                  <span>Password</span>
                  {!isRegister && (
                    <button type="button" style={{
                      background: "none", border: "none", color: COLORS.emerald,
                      fontFamily: "inherit", fontSize: "inherit", textTransform: "inherit",
                      letterSpacing: "inherit", cursor: "pointer",
                    }}>
                      Forgot?
                    </button>
                  )}
                </label>
                <div style={{
                  display: "flex", background: COLORS.bg,
                  border: `1px solid ${COLORS.border}`,
                }}>
                  <input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{
                      flex: 1, background: "transparent", border: "none",
                      color: COLORS.textPrimary, fontFamily: FONTS.body, fontSize: 14,
                      padding: "10px 14px", outline: "none",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    style={{
                      background: "transparent", border: "none",
                      color: COLORS.textSecondary, padding: "0 12px",
                      cursor: "pointer", fontFamily: FONTS.mono, fontSize: 10,
                      textTransform: "uppercase", letterSpacing: "0.1em",
                    }}
                  >
                    {showPass ? "Hide" : "Show"}
                  </button>
                </div>

                {isRegister && password && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ display: "flex", gap: 3, marginBottom: 4 }}>
                      {[1,2,3,4].map(i => (
                        <div key={i} style={{
                          flex: 1, height: 3,
                          background: i <= strength ? strengthColor : COLORS.surfaceRaised,
                          transition: "background 0.2s",
                        }}/>
                      ))}
                    </div>
                    <div style={{
                      fontFamily: FONTS.mono, fontSize: 10, color: strengthColor,
                      textTransform: "uppercase", letterSpacing: "0.1em",
                    }}>
                      {strengthLabel}
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div style={{
                  padding: "10px 14px", marginBottom: 14,
                  background: "rgba(248,113,113,0.10)",
                  border: `1px solid rgba(248,113,113,0.3)`,
                  color: COLORS.red, fontFamily: FONTS.mono, fontSize: 12,
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  <span className="status-dot" style={{ background: COLORS.red }}/>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  background: loading
                    ? COLORS.surfaceRaised
                    : `linear-gradient(135deg, ${COLORS.emerald}, ${COLORS.cyan})`,
                  color: loading ? COLORS.textTertiary : COLORS.bg,
                  border: "none", padding: "12px",
                  fontFamily: FONTS.mono, fontSize: 12, fontWeight: 600,
                  textTransform: "uppercase", letterSpacing: "0.12em",
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                }}
              >
                {loading ? "..." : isRegister ? "Create Account" : "Sign In"}
              </button>

              {/* Divider */}
              <div style={{
                display: "flex", alignItems: "center", gap: 10,
                margin: "20px 0 14px",
              }}>
                <div style={{ flex: 1, height: 1, background: COLORS.border }}/>
                <span style={{
                  fontFamily: FONTS.mono, fontSize: 10, color: COLORS.textTertiary,
                  textTransform: "uppercase", letterSpacing: "0.1em",
                }}>
                  Or
                </span>
                <div style={{ flex: 1, height: 1, background: COLORS.border }}/>
              </div>

              <button
                type="button"
                style={{
                  width: "100%", background: "transparent",
                  border: `1px solid ${COLORS.border}`, color: COLORS.textPrimary,
                  padding: "10px", fontFamily: FONTS.body, fontSize: 13,
                  cursor: "pointer", transition: "border 0.2s",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = COLORS.borderStrong; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = COLORS.border; }}
              >
                <svg viewBox="0 0 24 24" width="16" height="16">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
            </form>
          </div>

          <div style={{
            textAlign: "center", marginTop: 20,
            fontFamily: FONTS.mono, fontSize: 10, color: COLORS.textTertiary,
            textTransform: "uppercase", letterSpacing: "0.12em",
          }}>
            By continuing, you agree to our Terms
          </div>
        </div>
      </div>
    </>
  );
}