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
  signIn: (
    name: string,
    eventId: string,
    guestId?: string,
    token?: string
  ) => void;
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

export function useGuestAuth(): GuestAuthContextValue {
  return useContext(GuestAuthContext);
}

interface GuestAuthProviderProps {
  children: ReactNode;
}

function readStored(): GuestAuthState {
  if (typeof window === "undefined") {
    return { guestName: null, guestId: null, eventId: null, token: null };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { guestName: null, guestId: null, eventId: null, token: null };
    const parsed = JSON.parse(raw) as GuestAuthState;
    return parsed;
  } catch {
    return { guestName: null, guestId: null, eventId: null, token: null };
  }
}

export function GuestAuthProvider({ children }: GuestAuthProviderProps) {
  const [state, setState] = useState<GuestAuthState>(readStored);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [state]);

  const signIn = useCallback(
    (
      name: string,
      eventId: string,
      guestId?: string,
      token?: string
    ) => {
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
    setState({ guestName: null, guestId: null, eventId: null, token: null });
  }, []);

  const value = useMemo<GuestAuthContextValue>(
    () => ({ ...state, signIn, signOut }),
    [state, signIn, signOut]
  );

  return (
    <GuestAuthContext.Provider value={value}>
      {children}
    </GuestAuthContext.Provider>
  );
}

export function useSignIn() {
  const { signIn } = useGuestAuth();
  return signIn;
}

export function useGuestSignIn() {
  const { signIn } = useGuestAuth();
  return signIn;
}
