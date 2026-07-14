import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { LoadingSpinner } from "../components/ui";

export function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName || undefined } },
        });
        if (signUpError) throw signUpError;
        if (data.user && !data.session) {
          setError("Check your email to confirm your account.");
          setLoading(false);
          return;
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
      }
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-dash-bg px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="text-2xl font-bold text-dash-primary">
            MyWedly
          </Link>
          <p className="mt-2 text-sm text-dash-muted">
            {mode === "signin" ? "Sign in to your account" : "Create a new account"}
          </p>
        </div>

        <div className="rounded-lg border border-dash-border bg-dash-surface p-6 shadow-sm">
          <div className="mb-6 flex rounded-md border border-dash-border p-0.5">
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={`flex-1 rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                mode === "signin" ? "bg-dash-primary text-dash-primary-fg" : "text-dash-muted hover:text-dash-text"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                mode === "signup" ? "bg-dash-primary text-dash-primary-fg" : "text-dash-muted hover:text-dash-text"
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <Input
                label="Full Name"
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
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
            <Input
              label="Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              minLength={6}
            />

            {error && (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-dash-danger">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <LoadingSpinner className="h-4 w-4" /> : null}
              {mode === "signin" ? "Sign In" : "Sign Up"}
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

        <p className="mt-4 text-center text-xs text-dash-muted">
          <Link to="/" className="hover:underline">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
