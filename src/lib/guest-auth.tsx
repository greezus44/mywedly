import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { supabase, type EventGuest } from "./supabase";

const STORAGE_KEY = "mywedly_guest_session";

interface GuestSession {
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

interface GuestAuthProviderProps {
  children: ReactNode;
}

function loadSession(): GuestSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GuestSession;
    if (!parsed.guest || !parsed.eventId) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveSession(session: GuestSession | null): void {
  try {
    if (session) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // ignore storage errors
  }
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
    async (eventId: string, username: string): Promise<{ error: string | null }> => {
      const trimmed = username.trim();
      if (!trimmed) {
        return { error: "Please enter your username." };
      }

      const { data, error } = await supabase
        .from("event_guests")
        .select("*")
        .eq("event_id", eventId)
        .ilike("username", trimmed)
        .maybeSingle();

      if (error) {
        return { error: "Unable to sign in. Please try again." };
      }

      if (!data) {
        return { error: "We couldn't find that username. Please check and try again." };
      }

      const guestData = data as EventGuest;
      setGuest(guestData);
      setEventId(eventId);
      saveSession({ guest: guestData, eventId });

      return { error: null };
    },
    []
  );

  const signOut = useCallback(() => {
    setGuest(null);
    setEventId(null);
    saveSession(null);
  }, []);

  const value: GuestAuthContextValue = {
    guest,
    eventId,
    loading,
    signIn,
    signOut,
  };

  return (
    <GuestAuthContext.Provider value={value}>{children}</GuestAuthContext.Provider>
  );
}

export function useGuestAuth(): GuestAuthContextValue {
  const ctx = useContext(GuestAuthContext);
  if (!ctx) {
    throw new Error("useGuestAuth must be used within a GuestAuthProvider");
  }
  return ctx;
}

/**
 * Convenience hook for sign-in forms. Returns a signIn function and loading state.
 */
export function useSignIn() {
  const { signIn, loading } = useGuestAuth();
  return { signIn, loading };
}

/**
 * Convenience hook returning the current guest's sign-in state.
 */
export function useGuestSignIn() {
  const { guest, eventId, loading, signOut } = useGuestAuth();
  return { guest, eventId, loading, signOut };
}
