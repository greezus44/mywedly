import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui";
import { LoadingSpinner } from "../components/ui";
import { cn } from "../lib/utils";

export default function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.user && data.session) {
          navigate("/dashboard");
        } else {
          setError("Check your email to confirm your account.");
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.session) {
          navigate("/dashboard");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-dash-bg px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Link to="/" className="text-2xl font-bold text-dash-primary">
            MyWedly
          </Link>
        </div>
        <div className="rounded-lg border border-dash-border bg-dash-surface p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-dash-text">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-1 text-sm text-dash-muted">
            {mode === "signin"
              ? "Sign in to manage your invitation websites."
              : "Sign up to start building your event website."}
          </p>

          {/* Toggle */}
          <div className="mt-6 inline-flex w-full rounded-md border border-dash-border bg-dash-bg p-0.5 text-sm">
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={cn(
                "flex-1 rounded px-3 py-1.5 font-medium transition-colors",
                mode === "signin"
                  ? "bg-dash-primary text-dash-primary-fg"
                  : "text-dash-muted hover:text-dash-text"
              )}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={cn(
                "flex-1 rounded px-3 py-1.5 font-medium transition-colors",
                mode === "signup"
                  ? "bg-dash-primary text-dash-primary-fg"
                  : "text-dash-muted hover:text-dash-text"
              )}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
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
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              minLength={6}
            />
            {error && (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-dash-danger">{error}</p>
            )}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? <LoadingSpinner /> : mode === "signin" ? "Sign In" : "Sign Up"}
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-dash-muted">
            <Link to="/" className="hover:text-dash-text">
              ← Back to home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
