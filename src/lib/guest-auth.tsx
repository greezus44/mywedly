import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { supabase } from "./supabase";
import type { EventGuest } from "./supabase";

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

const GuestAuthContext = createContext<GuestAuthContextValue | null>(null);

function readStored(): StoredAuth | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredAuth;
    if (!parsed.guestId || !parsed.eventId) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeStored(auth: StoredAuth | null): void {
  try {
    if (auth) localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore storage errors (private mode, quota, etc.)
  }
}

export const GuestAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [guest, setGuest] = useState<EventGuest | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // hydrate from localStorage on mount
  useEffect(() => {
    const stored = readStored();
    if (!stored) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("event_guests")
          .select("*")
          .eq("id", stored.guestId)
          .eq("event_id", stored.eventId)
          .maybeSingle();
        if (cancelled) return;
        if (error || !data) {
          writeStored(null);
          setGuest(null);
          setEventId(null);
        } else {
          setGuest(data as EventGuest);
          setEventId(stored.eventId);
        }
      } catch {
        if (!cancelled) {
          writeStored(null);
          setGuest(null);
          setEventId(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(
    async (evId: string, username: string): Promise<{ error: string | null }> => {
      if (!username.trim()) return { error: "Username is required" };
      try {
        const { data, error } = await supabase
          .from("event_guests")
          .select("*")
          .eq("event_id", evId)
          .ilike("username", username.trim())
          .maybeSingle();
        if (error) return { error: error.message };
        if (!data) return { error: "Guest not found for this event" };
        const g = data as EventGuest;
        writeStored({ guestId: g.id, eventId: evId });
        setGuest(g);
        setEventId(evId);
        return { error: null };
      } catch (e) {
        return { error: e instanceof Error ? e.message : "Sign in failed" };
      }
    },
    [],
  );

  const signOut = useCallback(() => {
    writeStored(null);
    setGuest(null);
    setEventId(null);
  }, []);

  const value = useMemo<GuestAuthContextValue>(
    () => ({ guest, eventId, loading, signIn, signOut }),
    [guest, eventId, loading, signIn, signOut],
  );

  return <GuestAuthContext.Provider value={value}>{children}</GuestAuthContext.Provider>;
};

export function useGuestAuth(): GuestAuthContextValue {
  const ctx = useContext(GuestAuthContext);
  if (!ctx) throw new Error("useGuestAuth must be used within a GuestAuthProvider");
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
