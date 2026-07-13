import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

interface GuestAuthState {
  guestName: string | null;
  eventId: string | null;
}

interface GuestAuthContextValue extends GuestAuthState {
  signIn: (name: string, eventId: string) => void;
  signOut: () => void;
}

const STORAGE_KEY = "guest-auth";

const GuestAuthContext = createContext<GuestAuthContextValue>({
  guestName: null,
  eventId: null,
  signIn: () => {},
  signOut: () => {},
});

interface GuestAuthProviderProps {
  children: React.ReactNode;
}

function readStorage(): GuestAuthState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { guestName: null, eventId: null };
    const parsed = JSON.parse(raw);
    return {
      guestName: parsed.guestName || null,
      eventId: parsed.eventId || null,
    };
  } catch {
    return { guestName: null, eventId: null };
  }
}

export function GuestAuthProvider({ children }: GuestAuthProviderProps) {
  const [state, setState] = useState<GuestAuthState>(() => {
    if (typeof window === "undefined") return { guestName: null, eventId: null };
    return readStorage();
  });

  const signIn = useCallback((name: string, eventId: string) => {
    const newState = { guestName: name, eventId };
    setState(newState);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    } catch {
      // ignore storage errors
    }
  }, []);

  const signOut = useCallback(() => {
    const newState = { guestName: null, eventId: null };
    setState(newState);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setState(readStorage());
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const value: GuestAuthContextValue = {
    guestName: state.guestName,
    eventId: state.eventId,
    signIn,
    signOut,
  };

  return (
    <GuestAuthContext.Provider value={value}>
      {children}
    </GuestAuthContext.Provider>
  );
}

export function useGuestAuth(): GuestAuthContextValue {
  return useContext(GuestAuthContext);
}
