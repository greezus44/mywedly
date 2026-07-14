import React, { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";

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

function loadFromStorage(): GuestAuthState {
  if (typeof localStorage === "undefined") {
    return { guestName: null, guestId: null, eventId: null, token: null };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { guestName: null, guestId: null, eventId: null, token: null };
    const parsed = JSON.parse(raw) as GuestAuthState;
    return {
      guestName: parsed.guestName ?? null,
      guestId: parsed.guestId ?? null,
      eventId: parsed.eventId ?? null,
      token: parsed.token ?? null,
    };
  } catch {
    return { guestName: null, guestId: null, eventId: null, token: null };
  }
}

function saveToStorage(state: GuestAuthState): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

interface GuestAuthProviderProps {
  children: ReactNode;
}

export function GuestAuthProvider({ children }: GuestAuthProviderProps): React.ReactElement {
  const [state, setState] = React.useState<GuestAuthState>(() => loadFromStorage());

  const signIn = useCallback(
    (name: string, eventId: string, guestId?: string, token?: string) => {
      const next: GuestAuthState = {
        guestName: name,
        guestId: guestId ?? null,
        eventId,
        token: token ?? null,
      };
      setState(next);
      saveToStorage(next);
    },
    [],
  );

  const signOut = useCallback(() => {
    const empty: GuestAuthState = { guestName: null, guestId: null, eventId: null, token: null };
    setState(empty);
    saveToStorage(empty);
  }, []);

  const value = useMemo<GuestAuthContextValue>(
    () => ({ ...state, signIn, signOut }),
    [state, signIn, signOut],
  );

  return <GuestAuthContext.Provider value={value}>{children}</GuestAuthContext.Provider>;
}

export function useGuestAuth(): GuestAuthContextValue {
  const ctx = useContext(GuestAuthContext);
  if (!ctx) {
    throw new Error("useGuestAuth must be used within a GuestAuthProvider");
  }
  return ctx;
}

export function useSignIn(): GuestAuthContextValue["signIn"] {
  return useGuestAuth().signIn;
}

export function useGuestSignIn(): GuestAuthContextValue["signIn"] {
  return useGuestAuth().signIn;
}
