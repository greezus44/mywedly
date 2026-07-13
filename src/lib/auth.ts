import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import type { Session } from "@supabase/supabase-js";

export function useHostSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);
  return { session, loading };
}

export async function signInWithEmail(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}
export async function signUpWithEmail(email: string, password: string) {
  return supabase.auth.signUp({ email, password });
}
export async function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin + "/admin" } });
}
export async function signOutHost() { await supabase.auth.signOut(); }
