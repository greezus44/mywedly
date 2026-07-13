import { useEffect, useState } from "react";
import { supabase } from "./supabase";
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
export async function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin + "/dashboard" } });
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

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
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

  const google = async () => {
    setError(null);
    const { error } = await signInWithGoogle();
    if (error) setError(error.message);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-mist px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-center text-3xl font-serif text-onyx mb-2">Wedding Studio</h1>
        <p className="text-center text-sepia text-sm mb-8">Create beautiful wedding invitations</p>
        <button onClick={google} className="w-full flex items-center justify-center gap-3 border border-onyx/20 bg-white py-3 text-sm text-onyx rounded-md hover:bg-mist transition-colors mb-4">
          <GoogleIcon />
          Continue with Google
        </button>
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-onyx/10" />
          <span className="text-xs text-sepia/60 uppercase tracking-widest">or</span>
          <div className="flex-1 h-px bg-onyx/10" />
        </div>
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
