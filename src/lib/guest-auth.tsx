import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
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
  signIn: (eventId: string, email: string) => Promise<{ error: string | null }>;
  signOut: () => void;
}

const GuestAuthContext = createContext<GuestAuthContextValue | null>(null);

function readStoredAuth(): StoredAuth | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredAuth;
    if (parsed.guestId && parsed.eventId) return parsed;
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

  useEffect(() => {
    const stored = readStoredAuth();
    if (!stored) {
      setLoading(false);
      return;
    }
    setEventId(stored.eventId);

    supabase
      .from("event_guests")
      .select("*")
      .eq("id", stored.guestId)
      .eq("event_id", stored.eventId)
      .maybeSingle()
      .then(({ data }) => {
        setGuest(data as EventGuest | null);
        setLoading(false);
      })
      .then(undefined, () => {
        setLoading(false);
      });
  }, []);

  const signIn = useCallback(async (evId: string, email: string): Promise<{ error: string | null }> => {
    try {
      const { data, error } = await supabase
        .from("event_guests")
        .select("*")
        .eq("event_id", evId)
        .ilike("email", email)
        .maybeSingle();

      if (error) return { error: error.message };
      if (!data) return { error: "No invitation found for this email address." };

      const guestData = data as EventGuest;
      setGuest(guestData);
      setEventId(evId);
      writeStoredAuth({ guestId: guestData.id, eventId: evId });
      return { error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign in failed";
      return { error: message };
    }
  }, []);

  const signOut = useCallback(() => {
    setGuest(null);
    setEventId(null);
    writeStoredAuth(null);
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
    return {
      guest: null,
      eventId: null,
      loading: false,
      signIn: async () => ({ error: "GuestAuthProvider not mounted" }),
      signOut: () => {},
    };
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
