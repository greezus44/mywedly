import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "mywedly-guest-auth";

interface GuestAuthState {
  guestName: string | null;
  guestId: string | null;
  eventId: string | null;
}

interface GuestAuthContextValue extends GuestAuthState {
  signIn: (name: string, eventId: string, guestId?: string) => void;
  signOut: () => void;
}

const GuestAuthContext = createContext<GuestAuthContextValue>({
  guestName: null,
  guestId: null,
  eventId: null,
  signIn: () => {},
  signOut: () => {},
});

export function useGuestAuth(): GuestAuthContextValue {
  return useContext(GuestAuthContext);
}

interface GuestAuthProviderProps {
  children: ReactNode;
}

export function GuestAuthProvider({ children }: GuestAuthProviderProps) {
  const [state, setState] = useState<GuestAuthState>(() => {
    if (typeof window === "undefined") {
      return { guestName: null, guestId: null, eventId: null };
    }
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
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
  });

  useEffect(() => {
    try {
      if (state.guestName && state.eventId) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // ignore storage errors
    }
  }, [state]);

  const signIn = useCallback((name: string, eventId: string, guestId?: string) => {
    setState({ guestName: name, eventId, guestId: guestId ?? null });
  }, []);

  const signOut = useCallback(() => {
    setState({ guestName: null, guestId: null, eventId: null });
  }, []);

  const value = useMemo<GuestAuthContextValue>(
    () => ({
      guestName: state.guestName,
      guestId: state.guestId,
      eventId: state.eventId,
      signIn,
      signOut,
    }),
    [state, signIn, signOut]
  );

  return <GuestAuthContext.Provider value={value}>{children}</GuestAuthContext.Provider>;
}
