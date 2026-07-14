import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { LoadingSpinner } from "../components/ui";

export default function Auth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-dash-bg px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-block">
            <span className="text-2xl font-bold tracking-tight text-dash-text">
              My<span className="text-dash-primary">Wedly</span>
            </span>
          </Link>
        </div>

        <div className="rounded-xl border border-dash-border bg-dash-surface p-8 shadow-sm">
          <div className="mb-6 flex rounded-lg border border-dash-border bg-dash-bg p-1">
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                mode === "signin"
                  ? "bg-dash-surface text-dash-text shadow-sm"
                  : "text-dash-muted hover:text-dash-text"
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                mode === "signup"
                  ? "bg-dash-surface text-dash-text shadow-sm"
                  : "text-dash-muted hover:text-dash-text"
              }`}
            >
              Sign up
            </button>
          </div>

          <h1 className="mb-2 text-xl font-semibold text-dash-text">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mb-6 text-sm text-dash-muted">
            {mode === "signin"
              ? "Sign in to manage your invitation websites."
              : "Sign up to create your first invitation website."}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete={
                mode === "signin" ? "current-password" : "new-password"
              }
              minLength={6}
            />

            {error && (
              <div className="rounded-lg border border-dash-danger/30 bg-red-50 px-4 py-3 text-sm text-dash-danger">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" loading={loading}>
              {loading ? (
                <LoadingSpinner size="sm" />
              ) : mode === "signin" ? (
                "Sign in"
              ) : (
                "Sign up"
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-dash-muted">
            {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                setError(null);
              }}
              className="font-medium text-dash-primary hover:underline"
            >
              {mode === "signin" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-dash-muted">
          <Link to="/" className="hover:text-dash-text">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
