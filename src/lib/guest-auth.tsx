import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { supabase, type EventGuest } from "./supabase";

interface GuestAuthContextValue {
  guest: EventGuest | null;
  eventId: string | null;
  loading: boolean;
  signIn: (eventId: string, username: string) => Promise<{ error: string | null }>;
  signOut: () => void;
}

const GuestAuthContext = createContext<GuestAuthContextValue>({
  guest: null, eventId: null, loading: true,
  signIn: async () => ({ error: "Not implemented" }), signOut: () => {},
});

const STORAGE_KEY = "guest_session";

export function GuestAuthProvider({ children }: { children: ReactNode }) {
  const [guest, setGuest] = useState<EventGuest | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const session = JSON.parse(stored) as { guestId: string; eventId: string };
          const { data, error } = await supabase
            .from("event_guests").select("*").eq("id", session.guestId).eq("event_id", session.eventId).maybeSingle();
          if (!cancelled && !error && data) { setGuest(data as EventGuest); setEventId(session.eventId); }
          else if (!cancelled) { try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ } }
        }
      } catch { /* ignore */ }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const signIn = useCallback(async (targetEventId: string, username: string): Promise<{ error: string | null }> => {
    if (!username.trim()) return { error: "Please enter your username" };
    // Normalize: replace non-breaking spaces and other Unicode whitespace, collapse multiple spaces, trim
    const normalized = username.replace(/[\u00A0\u2000-\u200B\u202F\u205F\u3000]/g, " ").replace(/\s+/g, " ").trim();
    if (!normalized) return { error: "Please enter your username" };
    // Escape ILIKE wildcards so the input is matched literally (case-insensitively)
    const escaped = normalized.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
    const { data, error } = await supabase
      .from("event_guests").select("*").eq("event_id", targetEventId).ilike("username", escaped).maybeSingle();
    if (error) return { error: "Unable to sign in. Please try again." };
    if (!data) return { error: "Username not found. Please check and try again." };
    const guestData = data as EventGuest;
    setGuest(guestData); setEventId(targetEventId);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ guestId: guestData.id, eventId: targetEventId })); } catch { /* localStorage may throw in iOS Safari private mode */ }
    return { error: null };
  }, []);

  const signOut = useCallback(() => { setGuest(null); setEventId(null); try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ } }, []);

  return <GuestAuthContext.Provider value={{ guest, eventId, loading, signIn, signOut }}>{children}</GuestAuthContext.Provider>;
}

export function useGuestAuth() { return useContext(GuestAuthContext); }
export function useSignIn() { const { signIn } = useGuestAuth(); return signIn; }
export function useGuestSignIn() { return useSignIn(); }
