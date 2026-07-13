import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react";

interface GuestAuthState {
  guestName: string | null;
  guestId: string | null;
  eventId: string | null;
}

interface GuestAuthContextValue extends GuestAuthState {
  signIn: (name: string, eventId: string, guestId?: string) => void;
  signOut: () => void;
}

const STORAGE_KEY = "mywedly-guest-auth";

const GuestAuthContext = createContext<GuestAuthContextValue | null>(null);

function loadState(): GuestAuthState {
  if (typeof window === "undefined") {
    return { guestName: null, guestId: null, eventId: null };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { guestName: null, guestId: null, eventId: null };
    const parsed = JSON.parse(raw) as GuestAuthState;
    return {
      guestName: parsed.guestName ?? null,
      guestId: parsed.guestId ?? null,
      eventId: parsed.eventId ?? null,
    };
  } catch {
    return { guestName: null, guestId: null, eventId: null };
  }
}

export function GuestAuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GuestAuthState>(() => loadState());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore write errors
    }
  }, [state]);

  const signIn = (name: string, eventId: string, guestId?: string) => {
    setState({ guestName: name, eventId, guestId: guestId ?? null });
  };

  const signOut = () => {
    setState({ guestName: null, guestId: null, eventId: null });
  };

  return (
    <GuestAuthContext.Provider value={{ ...state, signIn, signOut }}>
      {children}
    </GuestAuthContext.Provider>
  );
}

export function useGuestAuth(): GuestAuthContextValue {
  const ctx = useContext(GuestAuthContext);
  if (!ctx) throw new Error("useGuestAuth must be used within GuestAuthProvider");
  return ctx;
}
