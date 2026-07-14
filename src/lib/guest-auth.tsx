import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { supabase, type EventGuest } from "./supabase";

const STORAGE_KEY = "mywedly-guest-auth";

interface StoredAuth {
  guestId: string;
  eventId: string;
}

interface GuestAuthContextValue {
  guest: EventGuest | null;
  eventId: string | null;
  loading: boolean;
  signIn: (eventId: string, username: string) => Promise<{ error: string | null }>;
  signOut: () => void;
}

const GuestAuthContext = createContext<GuestAuthContextValue | undefined>(undefined);

function getStoredAuth(): StoredAuth | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredAuth;
    if (parsed && parsed.guestId && parsed.eventId) return parsed;
    return null;
  } catch {
    return null;
  }
}

function setStoredAuth(auth: StoredAuth | null): void {
  try {
    if (auth) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // ignore
  }
}

interface GuestAuthProviderProps {
  children: ReactNode;
}

export function GuestAuthProvider({ children }: GuestAuthProviderProps) {
  const [guest, setGuest] = useState<EventGuest | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchGuest = useCallback(async (guestId: string, evId: string) => {
    const { data, error } = await supabase
      .from("event_guests")
      .select("*")
      .eq("id", guestId)
      .eq("event_id", evId)
      .maybeSingle();
    if (error || !data) {
      setStoredAuth(null);
      setGuest(null);
      setEventId(null);
      return;
    }
    setGuest(data as EventGuest);
    setEventId(evId);
  }, []);

  useEffect(() => {
    const stored = getStoredAuth();
    if (!stored) {
      setLoading(false);
      return;
    }
    setEventId(stored.eventId);
    fetchGuest(stored.guestId, stored.eventId).finally(() => setLoading(false));
  }, [fetchGuest]);

  const signIn = useCallback(
    async (evId: string, username: string): Promise<{ error: string | null }> => {
      try {
        const { data, error } = await supabase
          .from("event_guests")
          .select("*")
          .eq("event_id", evId)
          .ilike("username", username.trim())
          .maybeSingle();

        if (error) {
          return { error: "Failed to sign in. Please try again." };
        }
        if (!data) {
          return { error: "Guest not found. Please check your username." };
        }

        const g = data as EventGuest;
        setStoredAuth({ guestId: g.id, eventId: evId });
        setGuest(g);
        setEventId(evId);
        return { error: null };
      } catch {
        return { error: "Failed to sign in. Please try again." };
      }
    },
    [],
  );

  const signOut = useCallback(() => {
    setStoredAuth(null);
    setGuest(null);
    setEventId(null);
  }, []);

  return (
    <GuestAuthContext.Provider value={{ guest, eventId, loading, signIn, signOut }}>
      {children}
    </GuestAuthContext.Provider>
  );
}

export function useGuestAuth(): GuestAuthContextValue {
  const ctx = useContext(GuestAuthContext);
  if (!ctx) {
    throw new Error("useGuestAuth must be used within a GuestAuthProvider");
  }
  return ctx;
}

export function useSignIn() {
  const { signIn } = useGuestAuth();
  return signIn;
}

export function useGuestSignIn() {
  const { signIn } = useGuestAuth();
  return signIn;
}
