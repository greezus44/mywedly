import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

interface GuestAuthState {
  guestName: string | null;
  guestId: string | null;
  eventId: string | null;
  token: string | null;
}

interface GuestAuthContextValue extends GuestAuthState {
  signIn: (name: string, eventId: string, guestId?: string, token?: string) => void;
  signOut: () => void;
}

const STORAGE_KEY = "mywedly-guest-auth";

const GuestAuthContext = createContext<GuestAuthContextValue | undefined>(undefined);

function loadState(): GuestAuthState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { guestName: null, guestId: null, eventId: null, token: null };
    return JSON.parse(raw) as GuestAuthState;
  } catch {
    return { guestName: null, guestId: null, eventId: null, token: null };
  }
}

export function GuestAuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GuestAuthState>(() =>
    typeof window === "undefined"
      ? { guestName: null, guestId: null, eventId: null, token: null }
      : loadState()
  );

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state]);

  const signIn = useCallback(
    (name: string, eventId: string, guestId?: string, token?: string) => {
      setState({ guestName: name, eventId, guestId: guestId ?? null, token: token ?? null });
    },
    []
  );

  const signOut = useCallback(() => {
    setState({ guestName: null, guestId: null, eventId: null, token: null });
  }, []);

  const value: GuestAuthContextValue = { ...state, signIn, signOut };

  return <GuestAuthContext.Provider value={value}>{children}</GuestAuthContext.Provider>;
}

export function useGuestAuth(): GuestAuthContextValue {
  const ctx = useContext(GuestAuthContext);
  if (!ctx) throw new Error("useGuestAuth must be used within a GuestAuthProvider");
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
