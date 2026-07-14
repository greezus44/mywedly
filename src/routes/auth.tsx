import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui";
import { SiteHeader } from "../components/site/SiteHeader";
import { cn } from "../lib/utils";

export function AuthPage() {
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
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
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
    <div className="flex min-h-screen flex-col bg-dash-bg">
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-dash-text">
              {mode === "signin" ? "Welcome Back" : "Create Account"}
            </h1>
            <p className="mt-1 text-sm text-dash-muted">
              {mode === "signin" ? "Sign in to manage your events" : "Sign up to get started with MyWedly"}
            </p>
          </div>
          <div className="mb-4 flex rounded-lg border border-dash-border bg-dash-surface p-1">
            {(["signin", "signup"] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(null); }}
                className={cn(
                  "flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors",
                  mode === m ? "bg-dash-primary text-dash-primary-fg" : "text-dash-muted hover:text-dash-text"
                )}
              >
                {m === "signin" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>
          <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-dash-border bg-dash-surface p-6">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoFocus
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
            {error && <p className="text-sm text-dash-danger">{error}</p>}
            <Button type="submit" className="w-full" loading={loading}>
              {mode === "signin" ? "Sign In" : "Sign Up"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-dash-muted">
            <Link to="/" className="hover:underline">← Back to home</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
