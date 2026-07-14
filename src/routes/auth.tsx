import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui";
import { LoadingSpinner } from "../components/ui";

export function AuthPage() {
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
          options: { data: { full_name: fullName } },
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
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dash-bg flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <span className="text-3xl font-bold text-dash-text">
              My<span className="text-dash-primary">Wedly</span>
            </span>
          </Link>
          <p className="mt-2 text-sm text-dash-muted">
            {mode === "signin"
              ? "Sign in to manage your invitation websites"
              : "Create an account to get started"}
          </p>
        </div>

        <div className="rounded-lg border border-dash-border bg-dash-surface shadow-sm p-6">
          <div className="flex rounded-lg border border-dash-border bg-dash-bg p-0.5 mb-6">
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                mode === "signin"
                  ? "bg-dash-primary text-dash-primary-fg"
                  : "text-dash-text hover:bg-dash-surface"
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
                  : "text-dash-text hover:bg-dash-surface"
              }`}
            >
              Sign up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <Input
                label="Full name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                required
              />
            )}
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
              <div className="rounded-md border border-dash-danger/20 bg-dash-danger/5 px-4 py-3">
                <p className="text-sm text-dash-danger">{error}</p>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <LoadingSpinner className="h-4 w-4" />
                  {mode === "signin" ? "Signing in..." : "Signing up..."}
                </>
              ) : mode === "signin" ? (
                "Sign in"
              ) : (
                "Sign up"
              )}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-dash-muted">
          <Link to="/" className="text-dash-primary hover:text-dash-primary-hover">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
