import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { GuestSession } from "./supabase";
import { supabase } from "./supabase";

interface GuestAuthContextValue {
  session: GuestSession | null;
  loading: boolean;
  signIn: (username: string, slug: string) => Promise<{ error: string | null }>;
  signOut: () => void;
}

const GuestAuthContext = createContext<GuestAuthContextValue | null>(null);

export function GuestAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<GuestSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = sessionStorage.getItem("guest-session");
    if (stored) {
      try {
        setSession(JSON.parse(stored));
      } catch {
        sessionStorage.removeItem("guest-session");
      }
    }
    setLoading(false);
  }, []);

  const signIn = async (username: string, slug: string) => {
    try {
      const { data: wedding, error: wErr } = await supabase
        .from("weddings")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .single();

      if (wErr || !wedding) return { error: "Wedding not found" };

      const { data: guest, error: gErr } = await supabase
        .from("guests")
        .select("*")
        .eq("wedding_id", wedding.id)
        .eq("username", username.trim())
        .maybeSingle();

      if (gErr || !guest) return { error: "Invalid username. Please check your invitation." };

      const newSession: GuestSession = { guest, wedding };
      setSession(newSession);
      sessionStorage.setItem("guest-session", JSON.stringify(newSession));
      return { error: null };
    } catch {
      return { error: "Sign in failed. Please try again." };
    }
  };

  const signOut = () => {
    setSession(null);
    sessionStorage.removeItem("guest-session");
  };

  return (
    <GuestAuthContext.Provider value={{ session, loading, signIn, signOut }}>
      {children}
    </GuestAuthContext.Provider>
  );
}

export function useGuestAuth() {
  const ctx = useContext(GuestAuthContext);
  if (!ctx) throw new Error("useGuestAuth must be used within GuestAuthProvider");
  return ctx;
}
