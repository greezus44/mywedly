import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

const STORAGE_KEY = "guest-auth";

interface GuestAuthState {
  guestName: string | null;
  eventId: string | null;
}

interface GuestAuthContextValue extends GuestAuthState {
  signIn: (name: string, eventId: string) => void;
  signOut: () => void;
}

const GuestAuthContext = createContext<GuestAuthContextValue | null>(null);

function readStorage(): GuestAuthState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { guestName: null, eventId: null };
    const parsed = JSON.parse(raw) as Partial<GuestAuthState>;
    return {
      guestName: parsed.guestName ?? null,
      eventId: parsed.eventId ?? null,
    };
  } catch {
    return { guestName: null, eventId: null };
  }
}

function writeStorage(state: GuestAuthState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore write errors
  }
}

export function GuestAuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GuestAuthState>(() => readStorage());

  useEffect(() => {
    writeStorage(state);
  }, [state]);

  const signIn = useCallback((name: string, eventId: string) => {
    setState({ guestName: name, eventId });
  }, []);

  const signOut = useCallback(() => {
    setState({ guestName: null, eventId: null });
  }, []);

  return (
    <GuestAuthContext.Provider value={{ ...state, signIn, signOut }}>
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
