import { useState, FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function Auth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/dashboard");
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        navigate("/dashboard");
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
        setSuccess("Password reset link sent to your email.");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="px-6 h-14 flex items-center">
        <Link to="/" className="flex items-center gap-2 font-semibold text-sm">
          <span className="w-6 h-6 rounded-md bg-black text-white flex items-center justify-center text-xs font-bold">E</span>
          Event Studio
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight">
              {mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Reset password"}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {mode === "signin" ? "Welcome back to Event Studio." : mode === "signup" ? "Start building your event website." : "We'll send you a reset link."}
            </p>
          </div>

          {error && <div className="mb-4 px-3 py-2 rounded-lg bg-red-50 text-sm text-red-600">{error}</div>}
          {success && <div className="mb-4 px-3 py-2 rounded-lg bg-gray-50 text-sm text-gray-700">{success}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-gray-900"
              />
            </div>

            {mode !== "forgot" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full px-3 py-2 pr-10 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-gray-900"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            {mode === "signin" && (
              <>
                <button onClick={() => setMode("signup")} className="text-black hover:underline">Don't have an account? Sign up</button>
                <br />
                <button onClick={() => setMode("forgot")} className="text-gray-500 hover:text-black mt-2">Forgot password?</button>
              </>
            )}
            {mode === "signup" && (
              <button onClick={() => setMode("signin")} className="text-black hover:underline">Already have an account? Sign in</button>
            )}
            {mode === "forgot" && (
              <button onClick={() => setMode("signin")} className="text-black hover:underline">Back to sign in</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
