import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft } from "lucide-react";
import { supabase } from "../lib/supabase";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";

type Mode = "signin" | "signup" | "forgot";

function passwordStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const labels = ["Very Weak", "Weak", "Fair", "Good", "Strong", "Very Strong"];
  const colors = ["bg-red-500", "bg-red-500", "bg-yellow-500", "bg-yellow-500", "bg-green-500", "bg-green-600"];
  return { score, label: labels[score], color: colors[score] };
}

export default function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const strength = passwordStrength(password);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (mode === "signup" && !agreeTerms) { setError("Please accept the terms to continue"); return; }
    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/dashboard");
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } });
        if (error) throw error;
        setSuccess("Account created! Please sign in.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
        setSuccess("Password reset link sent to your email.");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [mode, email, password, name, agreeTerms, navigate]);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
        <button onClick={() => navigate("/")} className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center transition-transform group-hover:scale-105">
            <span className="text-white text-sm font-bold tracking-tight">E</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-gray-900 leading-tight">Event Studio</span>
            <span className="text-[11px] text-gray-400 leading-tight">Create beautiful event websites</span>
          </div>
        </button>
        <button onClick={() => navigate("/")} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft className="w-4 h-4" /><span className="hidden sm:inline">Back to site</span>
        </button>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-[400px]">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gray-900 mb-4 shadow-sm">
              <span className="text-white text-xl font-bold tracking-tight">E</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {mode === "signin" ? "Welcome back" : mode === "signup" ? "Create your account" : "Reset password"}
            </h1>
            <p className="text-sm text-gray-500 mt-1.5">
              {mode === "signin" ? "Sign in to your dashboard" : mode === "signup" ? "Start building event websites" : "We'll send you a reset link"}
            </p>
          </div>

          <div className="bg-gray-50 rounded-2xl border border-gray-100 p-6 shadow-sm">
            {error && <div className="mb-4 px-3.5 py-2.5 rounded-lg bg-red-50 border border-red-100 text-sm text-red-600">{error}</div>}
            {success && <div className="mb-4 px-3.5 py-2.5 rounded-lg bg-green-50 border border-green-100 text-sm text-green-600">{success}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required className="pl-9 bg-white" />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className="pl-9 bg-white" />
                </div>
              </div>
              {mode !== "forgot" && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} className="pl-9 pr-9 bg-white" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {mode === "signup" && password && (
                    <div className="mt-2">
                      <div className="flex gap-1">{[0,1,2,3,4].map(i => <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < strength.score ? strength.color : "bg-gray-200"}`} />)}</div>
                      <p className="text-xs text-gray-500 mt-1">{strength.label}</p>
                    </div>
                  )}
                </div>
              )}
              {mode === "signin" && (
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="rounded border-gray-300 text-gray-900 focus:ring-gray-900" />
                    Remember me
                  </label>
                  <button type="button" onClick={() => setMode("forgot")} className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Forgot password?</button>
                </div>
              )}
              {mode === "signup" && (
                <label className="flex items-start gap-2 text-sm text-gray-600 cursor-pointer">
                  <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} className="mt-0.5 rounded border-gray-300 text-gray-900 focus:ring-gray-900" />
                  <span>I agree to the Terms of Service and Privacy Policy</span>
                </label>
              )}
              <Button type="submit" className="w-full" loading={loading} size="lg">
                {mode === "signin" ? "Sign In" : mode === "signup" ? "Create Account" : "Send Reset Link"}
              </Button>
            </form>
          </div>

          <div className="mt-6 text-center text-sm text-gray-500">
            {mode === "signin" ? (
              <>Don't have an account? <button onClick={() => setMode("signup")} className="text-gray-900 font-medium hover:underline transition-colors">Sign Up</button></>
            ) : mode === "signup" ? (
              <>Already have an account? <button onClick={() => setMode("signin")} className="text-gray-900 font-medium hover:underline transition-colors">Sign In</button></>
            ) : (
              <button onClick={() => setMode("signin")} className="text-gray-900 font-medium hover:underline transition-colors">Back to Sign In</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
