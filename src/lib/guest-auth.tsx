import React, { createContext, useContext, useState, useCallback } from "react";

interface GuestAuthState {
  guestName: string | null;
  eventId: string | null;
}

interface GuestAuthContextValue extends GuestAuthState {
  signIn: (name: string, eventId: string) => void;
  signOut: () => void;
}

const GuestAuthContext = createContext<GuestAuthContextValue>({
  guestName: null,
  eventId: null,
  signIn: () => {},
  signOut: () => {},
});

const STORAGE_KEY = "guest-auth";

export function GuestAuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GuestAuthState>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
    return { guestName: null, eventId: null };
  });

  const signIn = useCallback((name: string, eventId: string) => {
    const newState = { guestName: name, eventId };
    setState(newState);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(newState)); } catch {}
  }, []);

  const signOut = useCallback(() => {
    setState({ guestName: null, eventId: null });
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }, []);

  return (
    <GuestAuthContext.Provider value={{ ...state, signIn, signOut }}>
      {children}
    </GuestAuthContext.Provider>
  );
}

export function useGuestAuth() {
  return useContext(GuestAuthContext);
}
