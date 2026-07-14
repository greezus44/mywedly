import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { LoadingSpinner } from "../components/ui";
import { cn } from "../lib/utils";

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName || undefined },
          },
        });
        if (signUpError) throw signUpError;
        if (data.user) {
          // If email confirmation is disabled, session is created immediately
          if (data.session) {
            navigate("/dashboard");
            return;
          }
          setError("Check your email to confirm your account, then sign in.");
          setMode("signin");
        }
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        if (data.user) {
          navigate("/dashboard");
        }
      }
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
          <Link to="/" className="inline-flex items-center gap-2 text-lg font-bold text-dash-text">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-dash-primary text-dash-primary-fg">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15.5c0-.9-.4-1.7-1-2.3V8a3 3 0 00-3-3h-1V3h-2v2h-4V3H8v2H7a3 3 0 00-3 3v5.2c-.6.6-1 1.4-1 2.3v4a1 1 0 001 1h1v2h2v-2h10v2h2v-2h1a1 1 0 001-1v-4z" />
              </svg>
            </span>
            MyWedly
          </Link>
        </div>

        <div className="rounded-lg border border-dash-border bg-dash-surface p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-dash-text">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-1 text-sm text-dash-muted">
            {mode === "signin"
              ? "Sign in to manage your invitation websites"
              : "Start building your invitation website today"}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {mode === "signup" && (
              <Input
                label="Full name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Doe"
                autoComplete="name"
              />
            )}
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
              minLength={6}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
            />

            {error && (
              <div className="rounded-md border border-dash-danger/30 bg-dash-danger/5 px-3 py-2 text-sm text-dash-danger">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading} loading={loading}>
              {mode === "signin" ? "Sign in" : "Sign up"}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-dash-muted">
            {mode === "signin" ? (
              <>
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setError(null);
                  }}
                  className="font-medium text-dash-primary hover:underline"
                >
                  Sign up
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
                  className="font-medium text-dash-primary hover:underline"
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-dash-muted">
          By continuing, you agree to our{" "}
          <a href="#" className="underline">Terms</a> and{" "}
          <a href="#" className="underline">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
};
