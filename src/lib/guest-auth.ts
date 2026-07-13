import { createContext, createElement, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { supabase } from "./supabase";

interface GuestSession {
  guest_id: string;
  guest_name: string;
  wedding_id: string;
  wedding_slug: string;
}

interface GuestAuthContextValue {
  session: GuestSession | null;
  loading: boolean;
  signIn: (username: string, weddingSlug: string) => Promise<{ error: string | null }>;
  signInWithToken: (token: string) => Promise<{ error: string | null }>;
  signOut: () => void;
}

const GuestAuthContext = createContext<GuestAuthContextValue | undefined>(undefined);

const STORAGE_KEY = "guest_session";

export function GuestAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<GuestSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) setSession(JSON.parse(stored));
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  const signIn = useCallback(async (username: string, weddingSlug: string) => {
    try {
      const { data: wedding, error: wError } = await supabase
        .from("weddings")
        .select("id, slug")
        .eq("slug", weddingSlug)
        .maybeSingle();
      if (wError || !wedding) return { error: "Wedding not found" };

      const { data: guest, error: gError } = await supabase
        .from("guests")
        .select("id, name, wedding_id")
        .eq("wedding_id", wedding.id)
        .eq("username", username.trim())
        .maybeSingle();
      if (gError || !guest) return { error: "Invalid name. Please check your invitation." };

      const s: GuestSession = {
        guest_id: guest.id,
        guest_name: guest.name,
        wedding_id: guest.wedding_id,
        wedding_slug: wedding.slug,
      };
      setSession(s);
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(s));
      return { error: null };
    } catch {
      return { error: "Sign-in failed. Please try again." };
    }
  }, []);

  const signInWithToken = useCallback(async (token: string) => {
    try {
      const { data: tokenRow, error: tError } = await supabase
        .from("guest_tokens")
        .select("guest_id, wedding_id")
        .eq("token", token)
        .maybeSingle();
      if (tError || !tokenRow) return { error: "Invalid or expired token" };

      const { data: guest, error: gError } = await supabase
        .from("guests")
        .select("id, name, wedding_id")
        .eq("id", tokenRow.guest_id)
        .maybeSingle();
      if (gError || !guest) return { error: "Guest not found" };

      const { data: wedding } = await supabase
        .from("weddings")
        .select("slug")
        .eq("id", guest.wedding_id)
        .maybeSingle();

      const s: GuestSession = {
        guest_id: guest.id,
        guest_name: guest.name,
        wedding_id: guest.wedding_id,
        wedding_slug: wedding?.slug || "",
      };
      setSession(s);
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(s));
      return { error: null };
    } catch {
      return { error: "Token sign-in failed." };
    }
  }, []);

  const signOut = useCallback(() => {
    setSession(null);
    sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  return createElement(
    GuestAuthContext.Provider,
    { value: { session, loading, signIn, signInWithToken, signOut } },
    children
  );
}

export function useGuestAuth(): GuestAuthContextValue {
  const ctx = useContext(GuestAuthContext);
  if (!ctx) throw new Error("useGuestAuth must be used within GuestAuthProvider");
  return ctx;
}
