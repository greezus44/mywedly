import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "./supabase";

interface GuestAuthState {
  token: string | null;
  guestId: string | null;
  eventId: string | null;
  guestName: string | null;
  signIn: (name: string, eventId: string) => Promise<void>;
  signInWithToken: (token: string) => Promise<void>;
  signOut: () => void;
}

const GuestAuthContext = createContext<GuestAuthState | null>(null);

const STORAGE_KEY = "event_guest_auth";

export function GuestAuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [guestId, setGuestId] = useState<string | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);
  const [guestName, setGuestName] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setToken(parsed.token || null);
        setGuestId(parsed.guestId || null);
        setEventId(parsed.eventId || null);
        setGuestName(parsed.guestName || null);
      }
    } catch {}
  }, []);

  const persist = (data: { token: string | null; guestId: string | null; eventId: string | null; guestName: string | null }) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

  const signIn = useCallback(async (name: string, evId: string) => {
    const { data, error } = await supabase
      .from("event_guests")
      .insert({ event_id: evId, name, token: Math.random().toString(36).substring(2) + Date.now().toString(36) })
      .select()
      .single();
    if (error) {
      const { data: existing } = await supabase
        .from("event_guests")
        .select("*")
        .eq("event_id", evId)
        .eq("name", name)
        .maybeSingle();
      if (existing) {
        const newToken = existing.token || Math.random().toString(36).substring(2) + Date.now().toString(36);
        setToken(newToken);
        setGuestId(existing.id);
        setEventId(evId);
        setGuestName(name);
        persist({ token: newToken, guestId: existing.id, eventId: evId, guestName: name });
        return;
      }
      throw error;
    }
    setToken(data.token);
    setGuestId(data.id);
    setEventId(evId);
    setGuestName(name);
    persist({ token: data.token, guestId: data.id, eventId: evId, guestName: name });
  }, []);

  const signInWithToken = useCallback(async (tkn: string) => {
    const { data, error } = await supabase
      .from("event_guests")
      .select("*")
      .eq("token", tkn)
      .maybeSingle();
    if (error) throw error;
    if (data) {
      setToken(data.token);
      setGuestId(data.id);
      setEventId(data.event_id);
      setGuestName(data.name);
      persist({ token: data.token, guestId: data.id, eventId: data.event_id, guestName: data.name });
    }
  }, []);

  const signOut = useCallback(() => {
    setToken(null);
    setGuestId(null);
    setEventId(null);
    setGuestName(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <GuestAuthContext.Provider value={{ token, guestId, eventId, guestName, signIn, signInWithToken, signOut }}>
      {children}
    </GuestAuthContext.Provider>
  );
}

export function useGuestAuth(): GuestAuthState {
  const ctx = useContext(GuestAuthContext);
  if (!ctx) throw new Error("useGuestAuth must be used within GuestAuthProvider");
  return ctx;
}
