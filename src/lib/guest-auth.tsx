import React, { createContext, useContext, useEffect, useState } from "react";
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
  if (auth) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export const GuestAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [guest, setGuest] = useState<EventGuest | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = readStored();
    if (!stored) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("event_guests")
        .select("*")
        .eq("id", stored.guestId)
        .eq("event_id", stored.eventId)
        .maybeSingle();
      if (cancelled) return;
      if (data && !error) {
        setGuest(data as EventGuest);
        setEventId(stored.eventId);
      } else {
        writeStored(null);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = async (evId: string, username: string): Promise<{ error: string | null }> => {
    const { data, error } = await supabase
      .from("event_guests")
      .select("*")
      .eq("event_id", evId)
      .ilike("username", username)
      .maybeSingle();
    if (error) return { error: error.message };
    if (!data) return { error: "Guest not found. Please check your username." };
    const g = data as EventGuest;
    setGuest(g);
    setEventId(evId);
    writeStored({ guestId: g.id, eventId: evId });
    return { error: null };
  };

  const signOut = () => {
    setGuest(null);
    setEventId(null);
    writeStored(null);
  };

  return (
    <GuestAuthContext.Provider value={{ guest, eventId, loading, signIn, signOut }}>
      {children}
    </GuestAuthContext.Provider>
  );
};

export function useGuestAuth(): GuestAuthContextValue {
  const ctx = useContext(GuestAuthContext);
  if (!ctx) throw new Error("useGuestAuth must be used within GuestAuthProvider");
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
