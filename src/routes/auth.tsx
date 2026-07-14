import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui";
import { LoadingSpinner } from "../components/ui";

export default function Auth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
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
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-dash-primary text-dash-primary-fg">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 15.5c-1.874 0-3.625.554-5 1.5m-9-1.5c1.874 0 3.625.554 5 1.5m4-1.5c-1.874 0-3.625.554-5 1.5m0 0V12m0 5.5v3.5m0-9V4m0 0C9.5 4 8 5.5 8 7.5S9.5 11 11 11s3-1.5 3-3.5S12.5 4 11 4z" />
              </svg>
            </span>
            <span className="text-2xl font-bold text-dash-text">
              My<span className="text-dash-primary">Wedly</span>
            </span>
          </Link>
        </div>

        <div className="rounded-xl border border-dash-border bg-dash-surface p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-dash-text">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-1 text-sm text-dash-muted">
            {mode === "signin"
              ? "Sign in to manage your invitation websites"
              : "Sign up to start creating your invitation website"}
          </p>

          {/* Mode toggle */}
          <div className="mt-6 flex rounded-lg border border-dash-border p-1">
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                mode === "signin"
                  ? "bg-dash-primary text-dash-primary-fg"
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
                  ? "bg-dash-primary text-dash-primary-fg"
                  : "text-dash-muted hover:text-dash-text"
              }`}
            >
              Sign up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <LoadingSpinner size="sm" />}
              {mode === "signin" ? "Sign in" : "Sign up"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-dash-muted">
            {mode === "signin" ? (
              <>
                Don't have an account?{" "}
                <button
                  onClick={() => setMode("signup")}
                  className="font-medium text-dash-primary hover:underline"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => setMode("signin")}
                  className="font-medium text-dash-primary hover:underline"
                >
                  Sign in
                </button>
              </>
            )}
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
