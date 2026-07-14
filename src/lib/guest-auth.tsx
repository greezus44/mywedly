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
  guest: null,
  eventId: null,
  loading: true,
  signIn: async () => ({ error: "Not implemented" }),
  signOut: () => {},
});

const STORAGE_KEY = "guest_session";

interface StoredSession {
  guestId: string;
  eventId: string;
}

export function GuestAuthProvider({ children }: { children: ReactNode }) {
  const [guest, setGuest] = useState<EventGuest | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const session = JSON.parse(stored) as StoredSession;
          const { data, error } = await supabase
            .from("event_guests")
            .select("*")
            .eq("id", session.guestId)
            .eq("event_id", session.eventId)
            .maybeSingle();
          if (!cancelled && !error && data) {
            setGuest(data as EventGuest);
            setEventId(session.eventId);
          } else if (!cancelled) {
            localStorage.removeItem(STORAGE_KEY);
          }
        }
      } catch {
        // ignore parse errors
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const signIn = useCallback(async (targetEventId: string, username: string): Promise<{ error: string | null }> => {
    if (!username.trim()) return { error: "Please enter your username" };

    // FIX #1: use `name` column (not `full_name`) + `.ilike` for case-insensitive username
    const { data, error } = await supabase
      .from("event_guests")
      .select("*")
      .eq("event_id", targetEventId)
      .ilike("username", username.trim())
      .maybeSingle();

    if (error) return { error: "Unable to sign in. Please try again." };
    if (!data) return { error: "Username not found. Please check and try again." };

    const guestData = data as EventGuest;
    setGuest(guestData);
    setEventId(targetEventId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ guestId: guestData.id, eventId: targetEventId }));
    return { error: null };
  }, []);

  const signOut = useCallback(() => {
    setGuest(null);
    setEventId(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <GuestAuthContext.Provider value={{ guest, eventId, loading, signIn, signOut }}>
      {children}
    </GuestAuthContext.Provider>
  );
}

export function useGuestAuth() {
  return useContext(GuestAuthContext);
}

export function useSignIn() {
  const { signIn } = useGuestAuth();
  return signIn;
}

export function useGuestSignIn() {
  return useSignIn();
}
