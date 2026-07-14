import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "./supabase";
import type { EventGuest } from "./supabase";

const STORAGE_KEY = "mywedly:guest-session";

interface StoredGuestSession {
  guest: EventGuest;
  eventId: string;
}

interface GuestAuthContextValue {
  guest: EventGuest | null;
  eventId: string | null;
  loading: boolean;
  signIn: (eventId: string, username: string) => Promise<{ error: string | null }>;
  signOut: () => void;
}

const GuestAuthContext = createContext<GuestAuthContextValue | null>(null);

function loadSession(): StoredGuestSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredGuestSession;
    if (!parsed.guest || !parsed.eventId) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveSession(session: StoredGuestSession | null): void {
  try {
    if (session) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors (e.g. private mode)
  }
}

interface GuestAuthProviderProps {
  children: ReactNode;
}

export function GuestAuthProvider({ children }: GuestAuthProviderProps) {
  const [guest, setGuest] = useState<EventGuest | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = loadSession();
    if (session) {
      setGuest(session.guest);
      setEventId(session.eventId);
    }
    setLoading(false);
  }, []);

  const signIn = useCallback(
    async (targetEventId: string, username: string): Promise<{ error: string | null }> => {
      if (!targetEventId) return { error: "Event ID is required." };
      if (!username) return { error: "Please enter your username." };

      const trimmed = username.trim();
      const { data, error } = await supabase
        .from("event_guests")
        .select("*")
        .eq("event_id", targetEventId)
        .ilike("username", trimmed)
        .maybeSingle();

      if (error) {
        return { error: "We couldn't sign you in. Please try again." };
      }

      if (!data) {
        return { error: "We couldn't find that username. Please check and try again." };
      }

      const guestRecord = data as EventGuest;
      const session: StoredGuestSession = { guest: guestRecord, eventId: targetEventId };
      saveSession(session);
      setGuest(guestRecord);
      setEventId(targetEventId);
      return { error: null };
    },
    []
  );

  const signOut = useCallback(() => {
    saveSession(null);
    setGuest(null);
    setEventId(null);
  }, []);

  const value = useMemo<GuestAuthContextValue>(
    () => ({ guest, eventId, loading, signIn, signOut }),
    [guest, eventId, loading, signIn, signOut]
  );

  return <GuestAuthContext.Provider value={value}>{children}</GuestAuthContext.Provider>;
}

/** Access the guest auth context. Must be used within a GuestAuthProvider. */
export function useGuestAuth(): GuestAuthContextValue {
  const ctx = useContext(GuestAuthContext);
  if (!ctx) {
    throw new Error("useGuestAuth must be used within a GuestAuthProvider");
  }
  return ctx;
}

/** Convenience hook returning just the sign-in function. */
export function useSignIn() {
  const { signIn } = useGuestAuth();
  return signIn;
}

/** Convenience hook returning just the guest sign-in function (alias). */
export function useGuestSignIn() {
  const { signIn } = useGuestAuth();
  return signIn;
}
