import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

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

function readState(): GuestAuthState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { guestName: null, eventId: null };
    const parsed = JSON.parse(raw) as GuestAuthState;
    return {
      guestName: parsed.guestName ?? null,
      eventId: parsed.eventId ?? null,
    };
  } catch {
    return { guestName: null, eventId: null };
  }
}

function writeState(state: GuestAuthState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage errors (private mode, etc.)
  }
}

interface GuestAuthProviderProps {
  children: ReactNode;
}

/**
 * Provides guest authentication state persisted to localStorage.
 * A guest "signs in" by providing their name + the event they're attending.
 */
export function GuestAuthProvider({ children }: GuestAuthProviderProps) {
  const [state, setState] = useState<GuestAuthState>(() => readState());

  // Keep localStorage in sync with state.
  useEffect(() => {
    writeState(state);
  }, [state]);

  // Sync across tabs.
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setState(readState());
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const signIn = useCallback((name: string, eventId: string) => {
    setState({ guestName: name, eventId });
  }, []);

  const signOut = useCallback(() => {
    setState({ guestName: null, eventId: null });
  }, []);

  const value = useMemo<GuestAuthContextValue>(
    () => ({
      guestName: state.guestName,
      eventId: state.eventId,
      signIn,
      signOut,
    }),
    [state.guestName, state.eventId, signIn, signOut],
  );

  return (
    <GuestAuthContext.Provider value={value}>
      {children}
    </GuestAuthContext.Provider>
  );
}

/**
 * Access the guest auth context.
 */
export function useGuestAuth(): GuestAuthContextValue {
  const ctx = useContext(GuestAuthContext);
  if (!ctx) {
    return {
      guestName: null,
      eventId: null,
      signIn: () => {},
      signOut: () => {},
    };
  }
  return ctx;
}
