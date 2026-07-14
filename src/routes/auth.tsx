import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { LoadingSpinner } from "../components/ui";
import { cn } from "../lib/utils";

export function AuthPage() {
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
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        // If session is returned, navigate to dashboard
        if (data.session) {
          navigate("/dashboard");
          return;
        }
        // If no session (email confirmation required), show a message
        setError("Account created! Please check your email to confirm, then sign in.");
        setMode("signin");
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        if (data.session) {
          navigate("/dashboard");
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dash-bg px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <span className="text-2xl font-bold text-dash-primary">MyWedly</span>
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-dash-text">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-2 text-sm text-dash-muted">
            {mode === "signin"
              ? "Sign in to manage your invitation websites"
              : "Sign up to start building your invitation website"}
          </p>
        </div>

        <div className="rounded-xl border border-dash-border bg-dash-surface shadow-sm p-6">
          {/* Mode toggle */}
          <div className="flex rounded-lg border border-dash-border overflow-hidden mb-6">
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setError(null);
              }}
              className={cn(
                "flex-1 px-4 py-2 text-sm font-medium transition-colors",
                mode === "signin"
                  ? "bg-dash-primary text-dash-primary-fg"
                  : "bg-dash-surface text-dash-muted hover:bg-dash-bg"
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
                "flex-1 px-4 py-2 text-sm font-medium transition-colors",
                mode === "signup"
                  ? "bg-dash-primary text-dash-primary-fg"
                  : "bg-dash-surface text-dash-muted hover:bg-dash-bg"
              )}
            >
              Sign Up
            </button>
          </div>

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
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              minLength={6}
            />

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>{mode === "signin" ? "Signing in..." : "Signing up..."}</span>
                </>
              ) : mode === "signin" ? (
                "Sign In"
              ) : (
                "Sign Up"
              )}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-dash-muted">
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
          By continuing, you agree to MyWedly's Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
