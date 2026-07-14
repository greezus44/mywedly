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

const GuestAuthContext = createContext<GuestAuthContextValue | null>(null);

function readStored(): StoredAuth | null {
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

function writeStored(data: StoredAuth | null) {
  if (data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function GuestAuthProvider({ children }: { children: React.ReactNode }) {
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
      if (!cancelled) {
        if (data && !error) {
          setGuest(data as EventGuest);
          setEventId(stored.eventId);
        } else {
          writeStored(null);
        }
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (evId: string, username: string): Promise<{ error: string | null }> => {
    try {
      const { data, error } = await supabase
        .from("event_guests")
        .select("*")
        .eq("event_id", evId)
        .ilike("username", username)
        .maybeSingle();
      if (error) return { error: error.message };
      if (!data) return { error: "Guest not found. Please check your username." };
      setGuest(data as EventGuest);
      setEventId(evId);
      writeStored({ guestId: data.id, eventId: evId });
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Sign in failed" };
    }
  }, []);

  const signOut = useCallback(() => {
    setGuest(null);
    setEventId(null);
    writeStored(null);
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
