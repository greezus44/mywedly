import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
const Eye = (p: { className?: string }) => (<svg className={p.className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>);
const EyeOff = (p: { className?: string }) => (<svg className={p.className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>);
const Mail = (p: { className?: string }) => (<svg className={p.className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>);
const Lock = (p: { className?: string }) => (<svg className={p.className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>);
const Heart = (p: { className?: string }) => (<svg className={p.className} fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>);
const ArrowRight = (p: { className?: string }) => (<svg className={p.className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>);
const Loader2 = (p: { className?: string }) => (<svg className={`${p.className ?? ""} animate-spin`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>);
const CheckCircle2 = (p: { className?: string }) => (<svg className={p.className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>);
const AlertCircle = (p: { className?: string }) => (<svg className={p.className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>);
const ShieldCheck = (p: { className?: string }) => (<svg className={p.className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>);

type Mode = "login" | "forgot";

export function AdminLogin() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [loading, setLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => { emailRef.current?.focus(); }, [mode]);

  const validateEmail = (val: string): string | undefined => {
    if (!val.trim()) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return "Please enter a valid email address";
    return undefined;
  };

  const validatePassword = (val: string): string | undefined => {
    if (!val) return "Password is required";
    if (val.length < 6) return "Password must be at least 6 characters";
    return undefined;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailErr = validateEmail(email);
    const passErr = validatePassword(password);
    setErrors({ email: emailErr, password: passErr });
    if (emailErr || passErr) { if (emailErr) emailRef.current?.focus(); else passwordRef.current?.focus(); return; }
    setLoading(true); setErrors({});
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes("invalid") || msg.includes("credentials")) setErrors({ general: "Incorrect email or password. Please try again." });
        else if (msg.includes("rate") || msg.includes("limit")) setErrors({ general: "Too many attempts. Please wait a moment and try again." });
        else if (msg.includes("network") || msg.includes("fetch")) setErrors({ general: "Unable to connect. Please check your internet connection." });
        else setErrors({ general: "Sign-in failed. Please try again." });
        setLoading(false); return;
      }
      navigate("/admin");
    } catch { setErrors({ general: "An unexpected error occurred. Please try again." }); setLoading(false); }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailErr = validateEmail(email);
    setErrors({ email: emailErr });
    if (emailErr) { emailRef.current?.focus(); return; }
    setLoading(true); setErrors({});
    try {
      await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/admin-login` });
      setForgotSent(true);
    } catch { setErrors({ general: "Unable to send reset email. Please try again." }); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row">
      <div className="hidden lg:flex lg:w-1/2 bg-gray-950 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 25% 25%, white 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        <div className="relative z-10 max-w-md text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 border border-white/10 mb-8"><Heart className="h-8 w-8 text-white" /></div>
          <h1 className="font-heading text-4xl text-white font-light tracking-tight mb-4">Wedding Invitation</h1>
          <p className="text-gray-400 text-lg leading-relaxed font-light">Create beautiful, customisable digital wedding invitations with QR codes, RSVP management, and premium guest experiences.</p>
          <div className="mt-12 flex items-center justify-center gap-2 text-gray-500 text-sm"><ShieldCheck className="h-4 w-4" /><span>Secure admin access</span></div>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-gray-50">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center justify-center mb-8"><div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gray-900 mb-3"><Heart className="h-6 w-6 text-white" /></div></div>
          {mode === "login" ? (
            <>
              <div className="mb-8"><h2 className="text-2xl font-semibold text-gray-900 tracking-tight">Admin Login</h2><p className="mt-2 text-sm text-gray-500">Sign in to manage your wedding dashboard</p></div>
              <form onSubmit={handleLogin} className="space-y-5" noValidate>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    <input ref={emailRef} id="email" type="email" autoComplete="email" value={email} onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors({ ...errors, email: undefined }); }} className={`w-full rounded-lg border bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all duration-200 focus:ring-2 focus:ring-gray-900/5 ${errors.email ? "border-red-400 focus:border-red-500" : "border-gray-200 focus:border-gray-900"}`} placeholder="you@example.com" aria-invalid={!!errors.email} aria-describedby={errors.email ? "email-error" : undefined} />
                  </div>
                  {errors.email && <p id="email-error" className="mt-1.5 flex items-center gap-1 text-xs text-red-600"><AlertCircle className="h-3 w-3" /> {errors.email}</p>}
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    <input ref={passwordRef} id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors({ ...errors, password: undefined }); }} className={`w-full rounded-lg border bg-white py-2.5 pl-10 pr-10 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all duration-200 focus:ring-2 focus:ring-gray-900/5 ${errors.password ? "border-red-400 focus:border-red-500" : "border-gray-200 focus:border-gray-900"}`} placeholder="Enter your password" aria-invalid={!!errors.password} aria-describedby={errors.password ? "password-error" : undefined} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors" aria-label={showPassword ? "Hide password" : "Show password"} tabIndex={-1}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                  </div>
                  {errors.password && <p id="password-error" className="mt-1.5 flex items-center gap-1 text-xs text-red-600"><AlertCircle className="h-3 w-3" /> {errors.password}</p>}
                </div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer select-none"><input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900/20 cursor-pointer" /><span className="text-sm text-gray-600">Remember me</span></label>
                  <button type="button" onClick={() => { setMode("forgot"); setErrors({}); setForgotSent(false); }} className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium">Forgot password?</button>
                </div>
                {errors.general && <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 flex items-center gap-2 text-sm text-red-700"><AlertCircle className="h-4 w-4 flex-shrink-0" />{errors.general}</div>}
                <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 rounded-lg bg-gray-900 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:ring-offset-2">{loading ? (<><Loader2 className="h-4 w-4 animate-spin" />Signing in...</>) : (<>Sign In<ArrowRight className="h-4 w-4" /></>)}</button>
              </form>
              <p className="mt-8 text-center text-xs text-gray-400"><Link to="/" className="hover:text-gray-600 transition-colors">Back to home</Link></p>
            </>
          ) : (
            <>
              <div className="mb-8"><h2 className="text-2xl font-semibold text-gray-900 tracking-tight">Reset Password</h2><p className="mt-2 text-sm text-gray-500">Enter your email and we'll send you a secure link to reset your password.</p></div>
              {forgotSent ? (
                <div className="space-y-6">
                  <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-4 flex items-start gap-3"><CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" /><div><p className="text-sm font-medium text-green-800">Check your email</p><p className="mt-1 text-sm text-green-700">If an account exists for this email, a password reset link has been sent.</p></div></div>
                  <button type="button" onClick={() => { setMode("login"); setForgotSent(false); setEmail(""); }} className="w-full flex items-center justify-center gap-2 rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-gray-50">Back to sign in</button>
                </div>
              ) : (
                <form onSubmit={handleForgot} className="space-y-5" noValidate>
                  <div>
                    <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                      <input ref={emailRef} id="forgot-email" type="email" autoComplete="email" value={email} onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors({ ...errors, email: undefined }); }} className={`w-full rounded-lg border bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all duration-200 focus:ring-2 focus:ring-gray-900/5 ${errors.email ? "border-red-400 focus:border-red-500" : "border-gray-200 focus:border-gray-900"}`} placeholder="you@example.com" aria-invalid={!!errors.email} aria-describedby={errors.email ? "forgot-email-error" : undefined} />
                    </div>
                    {errors.email && <p id="forgot-email-error" className="mt-1.5 flex items-center gap-1 text-xs text-red-600"><AlertCircle className="h-3 w-3" /> {errors.email}</p>}
                  </div>
                  {errors.general && <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 flex items-center gap-2 text-sm text-red-700"><AlertCircle className="h-4 w-4 flex-shrink-0" />{errors.general}</div>}
                  <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 rounded-lg bg-gray-900 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:ring-offset-2">{loading ? (<><Loader2 className="h-4 w-4 animate-spin" />Sending reset link...</>) : "Send Reset Link"}</button>
                  <button type="button" onClick={() => { setMode("login"); setErrors({}); }} className="w-full text-center text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium">Back to sign in</button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
