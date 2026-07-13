import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import { cn } from "../lib/utils";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { FormField, Toast } from "../components/ui";

type Mode = "signin" | "signup";

export default function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        navigate("/dashboard");
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        // If email confirmation is required, session will be null.
        if (data.session) {
          navigate("/dashboard");
        } else {
          setToast("Check your email to confirm your account.");
          setMode("signin");
        }
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Authentication failed. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Minimal header */}
      <header className="border-b border-onyx/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center">
          <Link to="/" className="flex items-center gap-2">
            <span className="font-heading text-2xl text-onyx tracking-tight">
              MyWedly
            </span>
            <span className="hidden sm:inline text-[10px] uppercase tracking-widest text-onyx/40 border-l border-onyx/20 pl-2">
              Editorial
            </span>
          </Link>
        </div>
      </header>

      {/* Centered card */}
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <span className="text-xs uppercase tracking-widest text-onyx/40">
              {mode === "signin" ? "Welcome Back" : "Join MyWedly"}
            </span>
            <h1 className="mt-4 font-heading text-4xl text-onyx leading-tight">
              {mode === "signin" ? "Sign In" : "Create Account"}
            </h1>
            <p className="mt-3 text-sm text-onyx/50 leading-relaxed">
              {mode === "signin"
                ? "Continue composing your celebration."
                : "Begin your editorial wedding story."}
            </p>
          </div>

          {/* Mode toggle */}
          <div className="grid grid-cols-2 border border-onyx/10 mb-8">
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setError(null);
              }}
              className={cn(
                "py-3 text-xs uppercase tracking-wider transition-colors",
                mode === "signin"
                  ? "bg-onyx text-cream"
                  : "bg-white text-onyx/50 hover:text-onyx"
              )}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setError(null);
              }}
              className={cn(
                "py-3 text-xs uppercase tracking-wider transition-colors",
                mode === "signup"
                  ? "bg-onyx text-cream"
                  : "bg-white text-onyx/50 hover:text-onyx"
              )}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 bg-white border border-onyx/10 p-8">
            <FormField label="Email">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </FormField>

            <FormField label="Password">
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={
                  mode === "signin" ? "current-password" : "new-password"
                }
                required
              />
            </FormField>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {mode === "signin" ? "Signing In…" : "Creating Account…"}
                </>
              ) : (
                <>{mode === "signin" ? "Sign In" : "Create Account"}</>
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-onyx/50">
            {mode === "signin" ? (
              <>
                New to MyWedly?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setError(null);
                  }}
                  className="text-onyx underline underline-offset-4 hover:no-underline"
                >
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signin");
                    setError(null);
                  }}
                  className="text-onyx underline underline-offset-4 hover:no-underline"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </main>

      {toast && (
        <Toast message={toast} type="success" onClose={() => setToast(null)} />
      )}
    </div>
  );
}
