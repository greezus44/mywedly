import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase, type EventGuest } from "./supabase";

const STORAGE_KEY = "mywedly:guest";

interface StoredGuest {
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

function loadStored(): StoredGuest | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.guest && parsed.eventId) return parsed;
    return null;
  } catch {
    return null;
  }
}

function saveStored(value: StoredGuest | null) {
  try {
    if (value) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // ignore storage errors
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
    const stored = loadStored();
    if (stored) {
      setGuest(stored.guest);
      setEventId(stored.eventId);
    }
    setLoading(false);
  }, []);

  const signIn = useCallback(
    async (targetEventId: string, username: string): Promise<{ error: string | null }> => {
      if (!username || !targetEventId) {
        return { error: "Please enter your username." };
      }
      const trimmed = username.trim();
      if (!trimmed) {
        return { error: "Please enter your username." };
      }
      const { data, error } = await supabase
        .from("event_guests")
        .select("*")
        .eq("event_id", targetEventId)
        .ilike("username", trimmed)
        .maybeSingle();

      if (error) {
        return { error: "Something went wrong. Please try again." };
      }
      if (!data) {
        return { error: "We couldn't find that username. Please check and try again." };
      }
      const g = data as EventGuest;
      setGuest(g);
      setEventId(targetEventId);
      saveStored({ guest: g, eventId: targetEventId });
      return { error: null };
    },
    []
  );

  const signOut = useCallback(() => {
    setGuest(null);
    setEventId(null);
    saveStored(null);
  }, []);

  const value: GuestAuthContextValue = {
    guest,
    eventId,
    loading,
    signIn,
    signOut,
  };

  return <GuestAuthContext.Provider value={value}>{children}</GuestAuthContext.Provider>;
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
