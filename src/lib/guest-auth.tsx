import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
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
  signIn: async () => ({ error: "Not implemented" }),
  signOut: () => {},
});

function readStored(): StoredAuth | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.guestId === "string" && typeof parsed.eventId === "string") {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function writeStored(auth: StoredAuth | null) {
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

  const fetchGuest = useCallback(async (stored: StoredAuth) => {
    const { data, error } = await supabase
      .from("event_guests")
      .select("*")
      .eq("id", stored.guestId)
      .eq("event_id", stored.eventId)
      .maybeSingle();
    if (error || !data) {
      writeStored(null);
      setGuest(null);
      setEventId(null);
    } else {
      setGuest(data as EventGuest);
      setEventId(stored.eventId);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const stored = readStored();
    if (stored) {
      fetchGuest(stored);
    } else {
      setLoading(false);
    }
  }, [fetchGuest]);

  const signIn = useCallback(
    async (evId: string, username: string): Promise<{ error: string | null }> => {
      try {
        const { data, error } = await supabase
          .from("event_guests")
          .select("*")
          .eq("event_id", evId)
          .ilike("username", username)
          .maybeSingle();

        if (error) {
          return { error: error.message };
        }
        if (!data) {
          return { error: "Guest not found. Please check your username." };
        }

        const g = data as EventGuest;
        writeStored({ guestId: g.id, eventId: evId });
        setGuest(g);
        setEventId(evId);
        return { error: null };
      } catch (err) {
        return { error: err instanceof Error ? err.message : "An error occurred" };
      }
    },
    [],
  );

  const signOut = useCallback(() => {
    writeStored(null);
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
