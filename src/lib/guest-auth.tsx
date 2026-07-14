import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
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

const GuestAuthContext = createContext<GuestAuthContextValue>({
  guest: null,
  eventId: null,
  loading: true,
  signIn: async () => ({ error: "not implemented" }),
  signOut: () => {},
});

function readStoredAuth(): StoredAuth | null {
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

function writeStoredAuth(auth: StoredAuth | null) {
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
  children: React.ReactNode;
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
      .maybeSingle();
    if (error || !data) {
      writeStoredAuth(null);
      setGuest(null);
      setEventId(null);
      return;
    }
    setGuest(data as EventGuest);
    setEventId(evId);
  }, []);

  useEffect(() => {
    const stored = readStoredAuth();
    if (!stored) {
      setLoading(false);
      return;
    }
    fetchGuest(stored.guestId, stored.eventId).finally(() => setLoading(false));
  }, [fetchGuest]);

  const signIn = useCallback(
    async (evId: string, username: string): Promise<{ error: string | null }> => {
      const { data, error } = await supabase
        .from("event_guests")
        .select("*")
        .eq("event_id", evId)
        .ilike("username", username)
        .maybeSingle();

      if (error) return { error: error.message };
      if (!data) return { error: "Guest not found. Please check your username." };

      const g = data as EventGuest;
      writeStoredAuth({ guestId: g.id, eventId: evId });
      setGuest(g);
      setEventId(evId);
      return { error: null };
    },
    []
  );

  const signOut = useCallback(() => {
    writeStoredAuth(null);
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
  return useContext(GuestAuthContext);
}

export function useSignIn() {
  const { signIn } = useGuestAuth();
  return signIn;
}

export function useGuestSignIn() {
  const { signIn } = useGuestAuth();
  return signIn;
}
