import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase, type EventGuest } from "./supabase";

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

const GuestAuthContext = createContext<GuestAuthContextValue | null>(null);

const STORAGE_KEY = "mywedly_guest_session";

export function GuestAuthProvider({ children }: { children: React.ReactNode }) {
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
    }
    setLoading(false);
  }, []);

  const signIn = useCallback(async (evId: string, username: string) => {
    const { data, error } = await supabase
      .from("event_guests")
      .select("*")
      .ilike("username", username)
      .eq("event_id", evId)
      .maybeSingle();

    if (error) return { error: error.message };
    if (!data) return { error: "Guest not found. Please check your name." };

    const g = data as EventGuest;
    setGuest(g);
    setEventId(evId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ guest: g, eventId: evId }));
    return { error: null };
  }, []);

  const signOut = useCallback(() => {
    setGuest(null);
    setEventId(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <GuestAuthContext.Provider value={{ guest, eventId, loading, signIn, signOut }}>
      {children}
    </GuestAuthContext.Provider>
  );
}

export function useGuestAuth() {
  const ctx = useContext(GuestAuthContext);
  if (!ctx) throw new Error("useGuestAuth must be used within GuestAuthProvider");
  return ctx;
}
