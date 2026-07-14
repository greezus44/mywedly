import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase, type EventGuest } from "./supabase";

const STORAGE_KEY = "guest_session";

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

const GuestAuthContext = createContext<GuestAuthContextValue>({
  guest: null,
  eventId: null,
  loading: true,
  signIn: async () => ({ error: "Not initialised" }),
  signOut: () => {},
});

export function GuestAuthProvider({ children }: { children: ReactNode }) {
  const [guest, setGuest] = useState<EventGuest | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const session: GuestSession = JSON.parse(raw);
        setGuest(session.guest);
        setEventId(session.eventId);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  const signIn = useCallback(
    async (evtId: string, username: string): Promise<{ error: string | null }> => {
      try {
        const { data, error } = await supabase
          .from("event_guests")
          .select("*")
          .eq("event_id", evtId)
          .ilike("username", username)
          .maybeSingle();

        if (error) return { error: error.message };
        if (!data) return { error: "Guest not found. Please check your username." };

        const g = data as EventGuest;
        const session: GuestSession = { guest: g, eventId: evtId };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
        setGuest(g);
        setEventId(evtId);
        return { error: null };
      } catch (err) {
        return { error: err instanceof Error ? err.message : "An error occurred" };
      }
    },
    [],
  );

  const signOut = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
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
  return useMutation({
    mutationFn: async ({ eventId, username }: { eventId: string; username: string }) => {
      const result = await signIn(eventId, username);
      if (result.error) throw new Error(result.error);
      return result;
    },
  });
}
