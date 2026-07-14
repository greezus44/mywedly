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
    if (!parsed.guestId || !parsed.eventId) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeStoredAuth(auth: StoredAuth | null): void {
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

export function GuestAuthProvider({ children }: { children: React.ReactNode }) {
  const [guest, setGuest] = useState<EventGuest | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = readStoredAuth();
      if (!stored) {
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("event_guests")
        .select("*")
        .eq("id", stored.guestId)
        .eq("event_id", stored.eventId)
        .maybeSingle();

      if (cancelled) return;
      if (!error && data) {
        setGuest(data as EventGuest);
        setEventId(stored.eventId);
      } else {
        writeStoredAuth(null);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (eventId: string, email: string): Promise<{ error: string | null }> => {
    if (!email.trim()) {
      return { error: "Please enter your email" };
    }
    const { data, error } = await supabase
      .from("event_guests")
      .select("*")
      .eq("event_id", eventId)
      .ilike("email", email.trim())
      .maybeSingle();

    if (error) {
      return { error: "Something went wrong. Please try again." };
    }
    if (!data) {
      return { error: "No invitation found for this email. Please check and try again." };
    }

    const guestData = data as EventGuest;
    writeStoredAuth({ guestId: guestData.id, eventId });
    setGuest(guestData);
    setEventId(eventId);
    return { error: null };
  }, []);

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
