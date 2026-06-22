import { useState } from "react";

// ── Icons ─────────────────────────────────────────────────────────────────────
const Icon = ({ name, size = 20, color = "currentColor" }) => {
  const s = { width: size, height: size, stroke: color, fill: "none", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };
  const icons = {
    brain:      <svg viewBox="0 0 24 24" {...s}><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/></svg>,
    mail:       <svg viewBox="0 0 24 24" {...s}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
    lock:       <svg viewBox="0 0 24 24" {...s}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
    user:       <svg viewBox="0 0 24 24" {...s}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    eye:        <svg viewBox="0 0 24 24" {...s}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
    eyeOff:     <svg viewBox="0 0 24 24" {...s}><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
    check:      <svg viewBox="0 0 24 24" {...s}><polyline points="20 6 9 17 4 12"/></svg>,
    google:     <svg viewBox="0 0 24 24" width={size} height={size}><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>,
    arrowRight: <svg viewBox="0 0 24 24" {...s}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
    sparkle:    <svg viewBox="0 0 24 24" {...s}><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>,
    zap:        <svg viewBox="0 0 24 24" {...s}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
    mic:        <svg viewBox="0 0 24 24" {...s}><rect x="9" y="2" width="6" height="13" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/><line x1="12" y1="19" x2="12" y2="22"/></svg>,
    shield:     <svg viewBox="0 0 24 24" {...s}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    alertCircle:<svg viewBox="0 0 24 24" {...s}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  };
  return icons[name] || null;
};

// ── Password strength calculator ─────────────────────────────────────────────
const calcPasswordStrength = (pw) => {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4);
};

const STRENGTH_LABELS = ["Weak", "Fair", "Good", "Strong", "Excellent"];
const STRENGTH_COLORS = ["#F43F5E", "#F59E0B", "#FBBF24", "#22D3EE", "#10B981"];

// ── Main Auth Component ──────────────────────────────────────────────────────
export default function Auth({ navigate: navProp, mode: initialMode = "login" } = {}) {
  const [mode, setMode]         = useState(initialMode); // "login" or "register"
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [name, setName]         = useState("");
  const [studentId, setStudentId] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [showCpw, setShowCpw]   = useState(false);
  const [remember, setRemember] = useState(true);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const isLogin = mode === "login";
  const pwStrength = calcPasswordStrength(password);

  const handleSubmit = (e) => {
    e?.preventDefault();
    setError("");

    // Validation
    if (isLogin) {
      if (!email || !password) { setError("Please fill in all fields"); return; }
    } else {
      if (!name || !email || !password || !confirmPw) { setError("Please fill in all fields"); return; }
      if (password !== confirmPw) { setError("Passwords don't match"); return; }
      if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
      if (!agreeTerms) { setError("Please accept the terms and conditions"); return; }
    }

    // Simulate auth call
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      // On success, go to dashboard
      if (navProp) navProp("dashboard");
    }, 1200);
  };

  const switchMode = () => {
    setMode(isLogin ? "register" : "login");
    setError("");
  };

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    html,body,#root{height:100%;width:100%;overflow:hidden;font-family:'Inter',sans-serif}
    body{background:#080B12;color:#F9FAFB}
    ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:2px}

    .auth-wrap{display:grid;grid-template-columns:1fr 1fr;height:100vh;width:100vw;overflow:hidden}

    /* Left side - branding */
    .auth-brand{
      background:linear-gradient(135deg, #0B0E1A 0%, #1E1B4B 100%);
      display:flex;flex-direction:column;justify-content:space-between;
      padding:48px;position:relative;overflow:hidden;
    }
    .auth-brand::before{
      content:'';position:absolute;top:-100px;right:-100px;width:400px;height:400px;
      background:radial-gradient(circle, rgba(99,102,241,0.3), transparent 70%);
      border-radius:50%;
    }
    .auth-brand::after{
      content:'';position:absolute;bottom:-150px;left:-100px;width:500px;height:500px;
      background:radial-gradient(circle, rgba(34,211,238,0.2), transparent 70%);
      border-radius:50%;
    }
    .brand-top{display:flex;align-items:center;gap:12px;position:relative;z-index:1}
    .brand-mark{width:40px;height:40px;background:linear-gradient(135deg,#6366F1,#22D3EE);border-radius:11px;display:flex;align-items:center;justify-content:center;box-shadow:0 0 22px rgba(99,102,241,.5)}
    .brand-text{font-size:22px;font-weight:800;letter-spacing:-.7px}
    .brand-text span{color:#6366F1}

    .brand-hero{position:relative;z-index:1;display:flex;flex-direction:column;gap:18px}
    .brand-title{font-size:38px;font-weight:800;letter-spacing:-1.5px;line-height:1.15;color:#fff;background:linear-gradient(135deg,#fff 0%, #C4C9D4 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
    .brand-sub{font-size:15px;color:#C4C9D4;line-height:1.7;max-width:420px}

    .features{display:flex;flex-direction:column;gap:14px;margin-top:20px}
    .feat{display:flex;align-items:flex-start;gap:14px;padding:14px 16px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;backdrop-filter:blur(10px);transition:all .25s}
    .feat:hover{background:rgba(255,255,255,0.07);transform:translateX(4px);border-color:rgba(99,102,241,0.3)}
    .feat-icon{width:34px;height:34px;border-radius:9px;background:linear-gradient(135deg,#6366F1,#22D3EE);display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 0 12px rgba(99,102,241,.3)}
    .feat-title{font-size:13px;font-weight:700;color:#F9FAFB;margin-bottom:3px}
    .feat-desc{font-size:11px;color:#9CA3AF;line-height:1.55}

    .brand-foot{position:relative;z-index:1;font-size:11px;color:#6B7280}

    /* Right side - form */
    .auth-form-wrap{
      background:#080B12;
      display:flex;align-items:center;justify-content:center;
      padding:48px;overflow-y:auto;position:relative;
    }
    .auth-form{width:100%;max-width:380px;animation:fade-in .5s ease}

    .form-header{margin-bottom:32px}
    .form-mode-switcher{display:flex;gap:4px;padding:4px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:11px;margin-bottom:24px}
    .mode-btn{flex:1;padding:9px 14px;border-radius:8px;border:none;background:transparent;color:#9CA3AF;font-size:12px;font-weight:600;cursor:pointer;transition:all .25s;font-family:'Inter',sans-serif}
    .mode-btn.act{background:linear-gradient(135deg,#6366F1,#22D3EE);color:#fff;box-shadow:0 4px 12px rgba(99,102,241,.35)}

    .form-title{font-size:26px;font-weight:800;letter-spacing:-.8px;color:#F9FAFB;margin-bottom:6px}
    .form-sub{font-size:13px;color:#9CA3AF;line-height:1.6}

    .field-group{margin-bottom:14px}
    .field-label{display:block;font-size:10px;font-weight:700;color:#9CA3AF;letter-spacing:.7px;text-transform:uppercase;margin-bottom:6px}
    .input-wrap{position:relative}
    .input-icon{position:absolute;left:13px;top:50%;transform:translateY(-50%);color:#6B7280;pointer-events:none;display:flex;align-items:center}
    .form-input{
      width:100%;padding:11px 14px 11px 40px;
      background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);
      border-radius:10px;color:#F9FAFB;
      font-family:'Inter',sans-serif;font-size:13px;
      outline:none;transition:all .25s;
    }
    .form-input:focus{
      border-color:rgba(99,102,241,0.5);
      background:rgba(255,255,255,0.06);
      box-shadow:0 0 0 4px rgba(99,102,241,0.10);
    }
    .form-input::placeholder{color:#6B7280}
    .show-pw{position:absolute;right:13px;top:50%;transform:translateY(-50%);background:none;border:none;color:#6B7280;cursor:pointer;display:flex;align-items:center;padding:0;transition:color .2s}
    .show-pw:hover{color:#C4C9D4}

    /* Password strength */
    .pw-strength{display:flex;gap:4px;margin-top:7px}
    .pw-bar{flex:1;height:3px;border-radius:2px;background:rgba(255,255,255,0.08);transition:background .3s}
    .pw-strength-label{font-size:10px;color:#9CA3AF;margin-top:5px;display:flex;justify-content:space-between}

    /* Error message */
    .error-msg{display:flex;align-items:center;gap:8px;padding:10px 12px;background:rgba(244,63,94,0.10);border:1px solid rgba(244,63,94,0.25);border-radius:8px;color:#F43F5E;font-size:12px;font-weight:500;margin-bottom:14px;animation:shake .3s}

    /* Checkbox */
    .check-row{display:flex;align-items:center;gap:8px;margin-bottom:16px;cursor:pointer;user-select:none}
    .check-box{width:16px;height:16px;border:1.5px solid rgba(255,255,255,0.2);border-radius:4px;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .2s}
    .check-box.on{background:linear-gradient(135deg,#6366F1,#22D3EE);border-color:transparent}
    .check-label{font-size:12px;color:#C4C9D4;flex:1;line-height:1.5}
    .check-label a{color:#A5B4FC;text-decoration:none;font-weight:600}
    .check-label a:hover{text-decoration:underline}

    /* Submit button */
    .submit-btn{
      width:100%;padding:11px 0;
      background:linear-gradient(135deg,#6366F1,#818CF8);
      border:none;border-radius:10px;color:#fff;
      font-size:13px;font-weight:700;
      cursor:pointer;font-family:'Inter',sans-serif;
      box-shadow:0 6px 24px rgba(99,102,241,.4);
      transition:all .25s;
      display:flex;align-items:center;justify-content:center;gap:7px;
    }
    .submit-btn:hover{transform:translateY(-1px);box-shadow:0 10px 32px rgba(99,102,241,.5)}
    .submit-btn:disabled{opacity:.6;cursor:not-allowed}

    /* Divider */
    .divider{display:flex;align-items:center;gap:12px;margin:20px 0}
    .divider-line{flex:1;height:1px;background:rgba(255,255,255,0.08)}
    .divider-text{font-size:11px;color:#6B7280;font-weight:500}

    /* Social button */
    .social-btn{
      width:100%;padding:10px 0;
      background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);
      border-radius:10px;color:#F9FAFB;
      font-size:13px;font-weight:600;cursor:pointer;font-family:'Inter',sans-serif;
      display:flex;align-items:center;justify-content:center;gap:9px;
      transition:all .2s;
    }
    .social-btn:hover{background:rgba(255,255,255,0.07);border-color:rgba(255,255,255,0.15)}

    /* Forgot password */
    .forgot-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px}
    .forgot-link{font-size:11px;color:#A5B4FC;text-decoration:none;font-weight:600;cursor:pointer}
    .forgot-link:hover{text-decoration:underline}

    /* Foot link */
    .auth-foot{text-align:center;margin-top:18px;font-size:12px;color:#9CA3AF}
    .auth-foot button{background:none;border:none;color:#A5B4FC;font-weight:700;cursor:pointer;font-family:'Inter',sans-serif;font-size:12px;text-decoration:none}
    .auth-foot button:hover{text-decoration:underline}

    /* Spinner */
    .spinner{width:14px;height:14px;border:2px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:spin .6s linear infinite}

    @keyframes fade-in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
    @keyframes spin{to{transform:rotate(360deg)}}
    @keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}

    /* Responsive */
    @media (max-width: 900px) {
      .auth-wrap{grid-template-columns:1fr}
      .auth-brand{display:none}
    }
  `;

  return (
    <>
      <style>{css}</style>
      <div className="auth-wrap">

        {/* LEFT — Brand panel */}
        <div className="auth-brand">
          <div className="brand-top">
            <div className="brand-mark">
              <Icon name="brain" size={20} color="#fff"/>
            </div>
            <div className="brand-text">Re<span>calla</span></div>
          </div>

          <div className="brand-hero">
            <div className="brand-title">Your AI-powered meeting memory assistant</div>
            <div className="brand-sub">Never forget what was said. Recalla captures every meeting, extracts the important parts, and lets you ask questions naturally.</div>

            <div className="features">
              <div className="feat">
                <div className="feat-icon">
                  <Icon name="mic" size={15} color="#fff"/>
                </div>
                <div>
                  <div className="feat-title">Live Transcription</div>
                  <div className="feat-desc">Powered by Whisper AI — accurate, multilingual, runs locally for privacy</div>
                </div>
              </div>
              <div className="feat">
                <div className="feat-icon">
                  <Icon name="sparkle" size={15} color="#fff"/>
                </div>
                <div>
                  <div className="feat-title">Smart Memory</div>
                  <div className="feat-desc">Auto-extracts decisions, tasks, and deadlines from every meeting</div>
                </div>
              </div>
              <div className="feat">
                <div className="feat-icon">
                  <Icon name="zap" size={15} color="#fff"/>
                </div>
                <div>
                  <div className="feat-title">Natural Language Search</div>
                  <div className="feat-desc">Ask anything — "What did we decide about backend?" — and get instant answers</div>
                </div>
              </div>
            </div>
          </div>

          <div className="brand-foot">
            © 2026 Recalla · Riphah International University · BSCS FYP
          </div>
        </div>

        {/* RIGHT — Auth form */}
        <div className="auth-form-wrap">
          <div className="auth-form">
            {/* Mode switcher */}
            <div className="form-mode-switcher">
              <button className={`mode-btn${isLogin?" act":""}`} onClick={()=>setMode("login")}>
                Sign In
              </button>
              <button className={`mode-btn${!isLogin?" act":""}`} onClick={()=>setMode("register")}>
                Create Account
              </button>
            </div>

            {/* Header */}
            <div className="form-header">
              <div className="form-title">{isLogin ? "Welcome back" : "Get started"}</div>
              <div className="form-sub">
                {isLogin
                  ? "Sign in to access your meetings, memories, and AI assistant."
                  : "Create your Recalla account in seconds — no credit card required."
                }
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="error-msg">
                <Icon name="alertCircle" size={14} color="#F43F5E"/>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Name (register only) */}
              {!isLogin && (
                <div className="field-group">
                  <label className="field-label">Full Name</label>
                  <div className="input-wrap">
                    <div className="input-icon">
                      <Icon name="user" size={15} color="#6B7280"/>
                    </div>
                    <input
                      className="form-input"
                      placeholder="Ammad Ahmad"
                      value={name}
                      onChange={e=>setName(e.target.value)}
                      autoFocus
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div className="field-group">
                <label className="field-label">Email Address</label>
                <div className="input-wrap">
                  <div className="input-icon">
                    <Icon name="mail" size={15} color="#6B7280"/>
                  </div>
                  <input
                    className="form-input"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e=>setEmail(e.target.value)}
                    autoFocus={isLogin}
                  />
                </div>
              </div>

              {/* Student ID (register only - optional) */}
              {!isLogin && (
                <div className="field-group">
                  <label className="field-label">Student ID <span style={{opacity:.6}}>(optional)</span></label>
                  <div className="input-wrap">
                    <div className="input-icon">
                      <Icon name="shield" size={15} color="#6B7280"/>
                    </div>
                    <input
                      className="form-input"
                      placeholder="50908"
                      value={studentId}
                      onChange={e=>setStudentId(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Password */}
              <div className="field-group">
                <label className="field-label">Password</label>
                <div className="input-wrap">
                  <div className="input-icon">
                    <Icon name="lock" size={15} color="#6B7280"/>
                  </div>
                  <input
                    className="form-input"
                    type={showPw ? "text" : "password"}
                    placeholder={isLogin?"Enter your password":"At least 8 characters"}
                    value={password}
                    onChange={e=>setPassword(e.target.value)}
                    style={{paddingRight:40}}
                  />
                  <button type="button" className="show-pw" onClick={()=>setShowPw(s=>!s)}>
                    <Icon name={showPw?"eyeOff":"eye"} size={15} color="currentColor"/>
                  </button>
                </div>

                {/* Strength bar (register only) */}
                {!isLogin && password && (
                  <>
                    <div className="pw-strength">
                      {[0,1,2,3].map(i => (
                        <div
                          key={i}
                          className="pw-bar"
                          style={{ background: i < pwStrength ? STRENGTH_COLORS[pwStrength] : "rgba(255,255,255,0.08)" }}
                        />
                      ))}
                    </div>
                    <div className="pw-strength-label">
                      <span>Password strength</span>
                      <span style={{ color: STRENGTH_COLORS[pwStrength], fontWeight:600 }}>
                        {STRENGTH_LABELS[pwStrength]}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Confirm password (register only) */}
              {!isLogin && (
                <div className="field-group">
                  <label className="field-label">Confirm Password</label>
                  <div className="input-wrap">
                    <div className="input-icon">
                      <Icon name="lock" size={15} color="#6B7280"/>
                    </div>
                    <input
                      className="form-input"
                      type={showCpw ? "text" : "password"}
                      placeholder="Re-enter your password"
                      value={confirmPw}
                      onChange={e=>setConfirmPw(e.target.value)}
                      style={{paddingRight:40}}
                    />
                    <button type="button" className="show-pw" onClick={()=>setShowCpw(s=>!s)}>
                      <Icon name={showCpw?"eyeOff":"eye"} size={15} color="currentColor"/>
                    </button>
                  </div>
                  {confirmPw && password !== confirmPw && (
                    <div style={{fontSize:11, color:"#F43F5E", marginTop:5, display:"flex", alignItems:"center", gap:4}}>
                      <Icon name="alertCircle" size={11} color="#F43F5E"/>
                      Passwords don't match
                    </div>
                  )}
                </div>
              )}

              {/* Remember / Forgot (login only) */}
              {isLogin && (
                <div className="forgot-row">
                  <div className="check-row" onClick={()=>setRemember(r=>!r)} style={{marginBottom:0}}>
                    <div className={`check-box${remember?" on":""}`}>
                      {remember && <Icon name="check" size={10} color="#fff"/>}
                    </div>
                    <span className="check-label" style={{fontSize:11}}>Remember me</span>
                  </div>
                  <a className="forgot-link">Forgot password?</a>
                </div>
              )}

              {/* Terms (register only) */}
              {!isLogin && (
                <div className="check-row" onClick={()=>setAgreeTerms(t=>!t)}>
                  <div className={`check-box${agreeTerms?" on":""}`}>
                    {agreeTerms && <Icon name="check" size={10} color="#fff"/>}
                  </div>
                  <span className="check-label">
                    I agree to the <a>Terms of Service</a> and <a>Privacy Policy</a>
                  </span>
                </div>
              )}

              {/* Submit */}
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? (
                  <>
                    <div className="spinner"/>
                    {isLogin ? "Signing in…" : "Creating account…"}
                  </>
                ) : (
                  <>
                    {isLogin ? "Sign In" : "Create Account"}
                    <Icon name="arrowRight" size={14} color="#fff"/>
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="divider">
              <div className="divider-line"/>
              <div className="divider-text">OR</div>
              <div className="divider-line"/>
            </div>

            {/* Social */}
            <button className="social-btn">
              <Icon name="google" size={16}/>
              Continue with Google
            </button>

            {/* Foot link */}
            <div className="auth-foot">
              {isLogin ? (
                <>Don't have an account? <button onClick={switchMode}>Create one</button></>
              ) : (
                <>Already have an account? <button onClick={switchMode}>Sign in</button></>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}