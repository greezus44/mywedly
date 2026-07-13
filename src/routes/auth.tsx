import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Eye, EyeOff, Mail, Lock, User, Heart, ArrowRight, Loader2, CheckCircle2, AlertCircle, ShieldCheck, Check, X } from "lucide-react";

type Mode = "signin" | "signup" | "forgot";

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
  checks: { label: string; met: boolean }[];
}

function getPasswordStrength(pw: string): PasswordStrength {
  const checks = [
    { label: "At least 8 characters", met: pw.length >= 8 },
    { label: "Contains uppercase letter", met: /[A-Z]/.test(pw) },
    { label: "Contains lowercase letter", met: /[a-z]/.test(pw) },
    { label: "Contains a number", met: /[0-9]/.test(pw) },
    { label: "Contains a special character", met: /[^A-Za-z0-9]/.test(pw) },
  ];
  const score = checks.filter((c) => c.met).length;
  const labels = ["Very weak", "Weak", "Fair", "Good", "Strong", "Excellent"];
  const colors = ["#ef4444", "#f97316", "#eab308", "#84cc16", "#22c55e", "#16a34a"];
  return { score, label: labels[score], color: colors[score], checks };
}

export function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [coupleNames, setCoupleNames] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [loading, setLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => { emailRef.current?.focus(); setErrors({}); }, [mode]);

  const validateEmail = (val: string): string | undefined => {
    if (!val.trim()) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return "Please enter a valid email address";
    return undefined;
  };

  const validatePassword = (val: string): string | undefined => {
    if (!val) return "Password is required";
    if (val.length < 8) return "Password must be at least 8 characters";
    if (!/[A-Z]/.test(val)) return "Password must contain an uppercase letter";
    if (!/[a-z]/.test(val)) return "Password must contain a lowercase letter";
    if (!/[0-9]/.test(val)) return "Password must contain a number";
    return undefined;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailErr = validateEmail(email);
    const passErr = password ? undefined : "Password is required";
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

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string | undefined> = {};
    newErrors.email = validateEmail(email);
    newErrors.password = validatePassword(password);
    if (!fullName.trim()) newErrors.fullName = "Full name is required";
    if (password !== confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    if (!agreeTerms) newErrors.terms = "Please accept the Terms & Conditions to continue";
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) return;
    setLoading(true); setErrors({});
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: fullName.trim(), couple_names: coupleNames.trim() || undefined } },
      });
      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) setErrors({ general: "An account with this email already exists. Please sign in instead." });
        else if (msg.includes("rate") || msg.includes("limit")) setErrors({ general: "Too many attempts. Please wait a moment and try again." });
        else if (msg.includes("password") && msg.includes("weak")) setErrors({ general: "Password is too weak. Please choose a stronger password." });
        else setErrors({ general: "Sign-up failed. Please try again." });
        setLoading(false); return;
      }
      if (data.session) { navigate("/admin"); return; }
      setSignupSuccess(true);
      setLoading(false);
    } catch { setErrors({ general: "An unexpected error occurred. Please try again." }); setLoading(false); }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailErr = validateEmail(email);
    setErrors({ email: emailErr });
    if (emailErr) { emailRef.current?.focus(); return; }
    setLoading(true); setErrors({});
    try {
      await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/login` });
      setForgotSent(true);
    } catch { setErrors({ general: "Unable to send reset email. Please try again." }); }
    setLoading(false);
  };

  const pwStrength = getPasswordStrength(password);

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gray-950 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 25% 25%, white 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        <div className="relative z-10 max-w-md text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 border border-white/10 mb-8"><Heart className="h-8 w-8 text-white" /></div>
          <h1 className="font-heading text-4xl text-white font-light tracking-tight mb-4">Wedding Invitation</h1>
          <p className="text-gray-400 text-lg leading-relaxed font-light">Create beautiful, customisable digital wedding invitations with QR codes, RSVP management, and premium guest experiences.</p>
          <div className="mt-12 flex items-center justify-center gap-2 text-gray-500 text-sm"><ShieldCheck className="h-4 w-4" /><span>Secure creator access</span></div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-gray-50">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center mb-8">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gray-900 mb-3"><Heart className="h-6 w-6 text-white" /></div>
          </div>

          {signupSuccess ? (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-green-100 mb-4"><CheckCircle2 className="h-7 w-7 text-green-600" /></div>
                <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">Account Created</h2>
                <p className="mt-2 text-sm text-gray-500">Your Wedding Creator account has been created. Please check your email to verify your account, then sign in.</p>
              </div>
              <button onClick={() => { setSignupSuccess(false); setMode("signin"); setPassword(""); setConfirmPassword(""); }} className="w-full flex items-center justify-center gap-2 rounded-lg bg-gray-900 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-gray-800">Continue to Sign In <ArrowRight className="h-4 w-4" /></button>
            </div>
          ) : forgotSent ? (
            <div className="space-y-6">
              <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-4 flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-800">Check your email</p>
                  <p className="mt-1 text-sm text-green-700">If an account exists for this email, a password reset link has been sent.</p>
                </div>
              </div>
              <button onClick={() => { setMode("signin"); setForgotSent(false); setEmail(""); }} className="w-full flex items-center justify-center gap-2 rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-gray-50">Back to sign in</button>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">
                  {mode === "signin" ? "Wedding Creator Login" : mode === "signup" ? "Create Your Account" : "Reset Password"}
                </h2>
                <p className="mt-2 text-sm text-gray-500">
                  {mode === "signin" ? "Sign in to manage your wedding dashboard" : mode === "signup" ? "Start creating your dream wedding invitation" : "Enter your email and we'll send you a reset link"}
                </p>
              </div>

              {/* Mode toggle */}
              {mode !== "forgot" && (
                <div className="mb-6 flex rounded-lg border border-gray-200 p-1 bg-white">
                  <button onClick={() => setMode("signin")} className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${mode === "signin" ? "bg-gray-900 text-white" : "text-gray-500 hover:text-gray-700"}`}>Sign In</button>
                  <button onClick={() => setMode("signup")} className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${mode === "signup" ? "bg-gray-900 text-white" : "text-gray-500 hover:text-gray-700"}`}>Create Account</button>
                </div>
              )}

              {mode === "signin" && (
                <form onSubmit={handleSignIn} className="space-y-5" noValidate>
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
                    <button type="button" onClick={() => { setMode("forgot"); setErrors({}); }} className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium">Forgot password?</button>
                  </div>
                  {errors.general && <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 flex items-center gap-2 text-sm text-red-700"><AlertCircle className="h-4 w-4 flex-shrink-0" />{errors.general}</div>}
                  <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 rounded-lg bg-gray-900 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:ring-offset-2">{loading ? (<><Loader2 className="h-4 w-4 animate-spin" />Signing in...</>) : (<>Sign In<ArrowRight className="h-4 w-4" /></>)}</button>
                </form>
              )}

              {mode === "signup" && (
                <form onSubmit={handleSignUp} className="space-y-4" noValidate>
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                      <input id="fullName" type="text" autoComplete="name" value={fullName} onChange={(e) => { setFullName(e.target.value); if (errors.fullName) setErrors({ ...errors, fullName: undefined }); }} className={`w-full rounded-lg border bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all duration-200 focus:ring-2 focus:ring-gray-900/5 ${errors.fullName ? "border-red-400 focus:border-red-500" : "border-gray-200 focus:border-gray-900"}`} placeholder="Jane Doe" aria-invalid={!!errors.fullName} aria-describedby={errors.fullName ? "fullName-error" : undefined} />
                    </div>
                    {errors.fullName && <p id="fullName-error" className="mt-1.5 flex items-center gap-1 text-xs text-red-600"><AlertCircle className="h-3 w-3" /> {errors.fullName}</p>}
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                      <input ref={emailRef} id="email" type="email" autoComplete="email" value={email} onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors({ ...errors, email: undefined }); }} className={`w-full rounded-lg border bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all duration-200 focus:ring-2 focus:ring-gray-900/5 ${errors.email ? "border-red-400 focus:border-red-500" : "border-gray-200 focus:border-gray-900"}`} placeholder="you@example.com" aria-invalid={!!errors.email} aria-describedby={errors.email ? "email-error" : undefined} />
                    </div>
                    {errors.email && <p id="email-error" className="mt-1.5 flex items-center gap-1 text-xs text-red-600"><AlertCircle className="h-3 w-3" /> {errors.email}</p>}
                  </div>
                  <div>
                    <label htmlFor="coupleNames" className="block text-sm font-medium text-gray-700 mb-1.5">Couple Names <span className="text-gray-400 font-normal">(optional)</span></label>
                    <input id="coupleNames" type="text" value={coupleNames} onChange={(e) => setCoupleNames(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white py-2.5 px-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all duration-200 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/5" placeholder="Jane & John" />
                  </div>
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                      <input ref={passwordRef} id="password" type={showPassword ? "text" : "password"} autoComplete="new-password" value={password} onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors({ ...errors, password: undefined }); }} className={`w-full rounded-lg border bg-white py-2.5 pl-10 pr-10 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all duration-200 focus:ring-2 focus:ring-gray-900/5 ${errors.password ? "border-red-400 focus:border-red-500" : "border-gray-200 focus:border-gray-900"}`} placeholder="Create a password" aria-invalid={!!errors.password} aria-describedby={errors.password ? "password-error" : undefined} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors" aria-label={showPassword ? "Hide password" : "Show password"} tabIndex={-1}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                    </div>
                    {errors.password && <p id="password-error" className="mt-1.5 flex items-center gap-1 text-xs text-red-600"><AlertCircle className="h-3 w-3" /> {errors.password}</p>}
                    {password && (
                      <div className="mt-2 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-300" style={{ width: `${(pwStrength.score / 5) * 100}%`, background: pwStrength.color }} />
                          </div>
                          <span className="text-xs font-medium" style={{ color: pwStrength.color }}>{pwStrength.label}</span>
                        </div>
                        <div className="grid grid-cols-1 gap-0.5">
                          {pwStrength.checks.map((c) => (
                            <div key={c.label} className="flex items-center gap-1.5 text-xs">
                              {c.met ? <Check className="h-3 w-3 text-green-500" /> : <X className="h-3 w-3 text-gray-300" />}
                              <span className={c.met ? "text-gray-600" : "text-gray-400"}>{c.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                      <input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} autoComplete="new-password" value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: undefined }); }} className={`w-full rounded-lg border bg-white py-2.5 pl-10 pr-10 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all duration-200 focus:ring-2 focus:ring-gray-900/5 ${errors.confirmPassword ? "border-red-400 focus:border-red-500" : "border-gray-200 focus:border-gray-900"}`} placeholder="Re-enter your password" aria-invalid={!!errors.confirmPassword} aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined} />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors" aria-label={showConfirmPassword ? "Hide password" : "Show password"} tabIndex={-1}>{showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                    </div>
                    {errors.confirmPassword && <p id="confirmPassword-error" className="mt-1.5 flex items-center gap-1 text-xs text-red-600"><AlertCircle className="h-3 w-3" /> {errors.confirmPassword}</p>}
                  </div>
                  <div>
                    <label className="flex items-start gap-2 cursor-pointer select-none">
                      <input type="checkbox" checked={agreeTerms} onChange={(e) => { setAgreeTerms(e.target.checked); if (errors.terms) setErrors({ ...errors, terms: undefined }); }} className="h-4 w-4 mt-0.5 rounded border-gray-300 text-gray-900 focus:ring-gray-900/20 cursor-pointer" />
                      <span className="text-sm text-gray-600">I agree to the <a href="#" className="font-medium text-gray-900 underline hover:text-gray-700">Terms & Conditions</a> and <a href="#" className="font-medium text-gray-900 underline hover:text-gray-700">Privacy Policy</a></span>
                    </label>
                    {errors.terms && <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600"><AlertCircle className="h-3 w-3" /> {errors.terms}</p>}
                  </div>
                  {errors.general && <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 flex items-center gap-2 text-sm text-red-700"><AlertCircle className="h-4 w-4 flex-shrink-0" />{errors.general}</div>}
                  <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 rounded-lg bg-gray-900 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:ring-offset-2">{loading ? (<><Loader2 className="h-4 w-4 animate-spin" />Creating account...</>) : (<>Create Account<ArrowRight className="h-4 w-4" /></>)}</button>
                </form>
              )}

              {mode === "forgot" && (
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
                  <button type="button" onClick={() => { setMode("signin"); setErrors({}); }} className="w-full text-center text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium">Back to sign in</button>
                </form>
              )}

              <p className="mt-8 text-center text-xs text-gray-400"><Link to="/" className="hover:text-gray-600 transition-colors">Back to home</Link></p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default AuthPage;
