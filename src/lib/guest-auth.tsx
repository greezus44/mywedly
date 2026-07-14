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

function getStoredAuth(): StoredAuth | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.guestId === "string" && typeof parsed.eventId === "string") {
      return parsed;
    }
  } catch {
    // ignore
  }
  return null;
}

function setStoredAuth(auth: StoredAuth | null) {
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
    const stored = getStoredAuth();
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
        setStoredAuth(null);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (evId: string, username: string): Promise<{ error: string | null }> => {
    if (!username.trim()) {
      return { error: "Please enter your username" };
    }
    const { data, error } = await supabase
      .from("event_guests")
      .select("*")
      .eq("event_id", evId)
      .ilike("username", username.trim())
      .maybeSingle();

    if (error) {
      return { error: error.message };
    }
    if (!data) {
      return { error: "Guest not found. Please check your username." };
    }
    const guestData = data as EventGuest;
    setGuest(guestData);
    setEventId(evId);
    setStoredAuth({ guestId: guestData.id, eventId: evId });
    return { error: null };
  }, []);

  const signOut = useCallback(() => {
    setGuest(null);
    setEventId(null);
    setStoredAuth(null);
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
    throw new Error("useGuestAuth must be used within GuestAuthProvider");
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
