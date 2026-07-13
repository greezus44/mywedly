import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface GuestAuthContextValue {
  guestName: string | null;
  guestId: string | null;
  eventId: string | null;
  signIn: (name: string, eventId: string, guestId?: string) => void;
  signOut: () => void;
}

const GuestAuthContext = createContext<GuestAuthContextValue | null>(null);
const STORAGE_KEY = "mywedly-guest-auth";

interface StoredAuth { guestName: string; guestId?: string; eventId: string; }

export function GuestAuthProvider({ children }: { children: ReactNode }) {
  const [guestName, setGuestName] = useState<string | null>(null);
  const [guestId, setGuestId] = useState<string | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: StoredAuth = JSON.parse(stored);
        setGuestName(parsed.guestName);
        setEventId(parsed.eventId);
        setGuestId(parsed.guestId || null);
      }
    } catch { /* ignore */ }
  }, []);

  function signIn(name: string, evId: string, gId?: string) {
    setGuestName(name); setEventId(evId); setGuestId(gId || null);
    const data: StoredAuth = { guestName: name, eventId: evId, guestId: gId };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function signOut() {
    setGuestName(null); setEventId(null); setGuestId(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <GuestAuthContext.Provider value={{ guestName, guestId, eventId, signIn, signOut }}>
      {children}
    </GuestAuthContext.Provider>
  );
}

export function useGuestAuth() {
  const ctx = useContext(GuestAuthContext);
  if (!ctx) throw new Error("useGuestAuth must be used within GuestAuthProvider");
  return ctx;
}
