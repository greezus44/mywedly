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
  token: string | null;
}

interface GuestAuthContextValue extends GuestAuthState {
  signIn: (name: string, eventId: string, guestId?: string, token?: string) => void;
  signOut: () => void;
}

const GuestAuthContext = createContext<GuestAuthContextValue>({
  guestName: null,
  guestId: null,
  eventId: null,
  token: null,
  signIn: () => {},
  signOut: () => {},
});

function loadState(): GuestAuthState {
  if (typeof window === "undefined") {
    return { guestName: null, guestId: null, eventId: null, token: null };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { guestName: null, guestId: null, eventId: null, token: null };
    const parsed = JSON.parse(raw) as GuestAuthState;
    return parsed;
  } catch {
    return { guestName: null, guestId: null, eventId: null, token: null };
  }
}

function saveState(state: GuestAuthState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

function clearState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

interface GuestAuthProviderProps {
  children: ReactNode;
}

export function GuestAuthProvider({ children }: GuestAuthProviderProps) {
  const [state, setState] = useState<GuestAuthState>(() => loadState());

  useEffect(() => {
    saveState(state);
  }, [state]);

  const signIn = useCallback(
    (name: string, eventId: string, guestId?: string, token?: string) => {
      setState({
        guestName: name,
        guestId: guestId ?? null,
        eventId,
        token: token ?? null,
      });
    },
    []
  );

  const signOut = useCallback(() => {
    clearState();
    setState({ guestName: null, guestId: null, eventId: null, token: null });
  }, []);

  const value = useMemo<GuestAuthContextValue>(
    () => ({
      guestName: state.guestName,
      guestId: state.guestId,
      eventId: state.eventId,
      token: state.token,
      signIn,
      signOut,
    }),
    [state, signIn, signOut]
  );

  return (
    <GuestAuthContext.Provider value={value}>
      {children}
    </GuestAuthContext.Provider>
  );
}

export function useGuestAuth(): GuestAuthContextValue {
  return useContext(GuestAuthContext);
}

export function useSignIn() {
  const { signIn } = useGuestAuth();
  return signIn;
}

export function useGuestSignIn() {
  const { signIn } = useGuestAuth();
  return signIn;
}
