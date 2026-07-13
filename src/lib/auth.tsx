import { useEffect, useState } from "react";
import { supabase, type Wedding } from "./supabase";
import type { Session } from "@supabase/supabase-js";

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);
  return { session, loading };
}

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}
export async function signUp(email: string, password: string) {
  return supabase.auth.signUp({ email, password });
}
export async function signOut() {
  await supabase.auth.signOut();
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, loading } = useSession();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-sepia">Loading…</div>;
  if (!session) return <LoginScreen />;
  return <>{children}</>;
}

function LoginScreen() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const fn = mode === "signin" ? signIn : signUp;
    const { error } = await fn(email, password);
    if (error) setError(error.message);
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-mist px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-center text-3xl font-serif text-onyx mb-2">Wedding Studio</h1>
        <p className="text-center text-sepia text-sm mb-8">Create beautiful wedding invitations</p>
        <form onSubmit={submit} className="space-y-4">
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full border-b border-onyx/20 bg-transparent py-2 outline-none focus:border-onyx" />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full border-b border-onyx/20 bg-transparent py-2 outline-none focus:border-onyx" />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button type="submit" className="w-full bg-onyx text-parchment py-3 text-xs uppercase tracking-widest hover:bg-ink transition-colors">{mode === "signin" ? "Sign In" : "Sign Up"}</button>
        </form>
        <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="w-full text-center text-sepia text-sm mt-4 hover:text-onyx">{mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}</button>
      </div>
    </div>
  );
}
