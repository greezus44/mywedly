import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card } from "../components/ui";
import { cn } from "../lib/utils";

export function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) throw signUpError;
        if (data.user) {
          navigate("/dashboard");
        }
      } else {
        const { data, error: signInError } =
          await supabase.auth.signInWithPassword({
            email,
            password,
          });
        if (signInError) throw signInError;
        if (data.user) {
          navigate("/dashboard");
        }
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Authentication failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-dash-bg px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <a href="/" className="inline-flex items-center gap-2 text-2xl font-bold text-dash-text">
            <span className="text-dash-primary">My</span>Wedly
          </a>
          <p className="mt-2 text-sm text-dash-muted">
            {mode === "signin" ? "Sign in to your account" : "Create your account"}
          </p>
        </div>

        <Card>
          <div className="flex gap-1 p-1 rounded-md bg-dash-bg mb-6">
            <button
              type="button"
              onClick={() => { setMode("signin"); setError(null); }}
              className={cn(
                "flex-1 px-3 py-1.5 text-sm rounded transition-colors font-medium",
                mode === "signin"
                  ? "bg-dash-surface text-dash-text shadow-sm"
                  : "text-dash-muted hover:text-dash-text",
              )}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode("signup"); setError(null); }}
              className={cn(
                "flex-1 px-3 py-1.5 text-sm rounded transition-colors font-medium",
                mode === "signup"
                  ? "bg-dash-surface text-dash-text shadow-sm"
                  : "text-dash-muted hover:text-dash-text",
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
              <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" loading={loading}>
              {mode === "signin" ? "Sign In" : "Create Account"}
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-dash-muted">
            {mode === "signin" ? (
              <>
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => { setMode("signup"); setError(null); }}
                  className="text-dash-primary hover:underline font-medium"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => { setMode("signin"); setError(null); }}
                  className="text-dash-primary hover:underline font-medium"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </Card>
      </div>
    </div>
  );
}
