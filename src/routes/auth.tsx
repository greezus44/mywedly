import { useState } from "react";
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setError("Check your email for a confirmation link.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/dashboard");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-dash-bg">
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-lg border border-dash-border bg-dash-surface p-6">
          <div className="mb-6 flex gap-2">
            <button onClick={() => setMode("signin")} className={cn("flex-1 rounded-lg py-2 text-sm font-medium transition-colors", mode === "signin" ? "bg-dash-primary text-dash-primary-fg" : "text-dash-muted hover:bg-dash-bg")}>Sign In</button>
            <button onClick={() => setMode("signup")} className={cn("flex-1 rounded-lg py-2 text-sm font-medium transition-colors", mode === "signup" ? "bg-dash-primary text-dash-primary-fg" : "text-dash-muted hover:bg-dash-bg")}>Sign Up</button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required autoFocus />
            <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
            {error && <p className="text-sm text-dash-danger">{error}</p>}
            <Button type="submit" className="w-full" loading={loading}>{mode === "signin" ? "Sign In" : "Create Account"}</Button>
          </form>
          <div className="mt-4 text-center text-sm text-dash-muted">
            <Link to="/" className="hover:text-dash-text">← Back to home</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
