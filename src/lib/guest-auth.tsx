import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

const STORAGE_KEY = "mywedly-guest-auth";

interface GuestAuthData {
  guestName: string;
  guestId: string | null;
  eventId: string;
  token: string | null;
}

interface GuestAuthContextValue {
  guestName: string | null;
  guestId: string | null;
  eventId: string | null;
  token: string | null;
  isAuthenticated: boolean;
  signIn: (
    name: string,
    eventId: string,
    guestId?: string,
    token?: string
  ) => void;
  signOut: () => void;
}

const GuestAuthContext = createContext<GuestAuthContextValue | undefined>(
  undefined
);

function loadFromStorage(): GuestAuthData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as GuestAuthData;
  } catch {
    return null;
  }
}

function saveToStorage(data: GuestAuthData | null) {
  try {
    if (data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    /* ignore */
  }
}

export function GuestAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [authData, setAuthData] = useState<GuestAuthData | null>(() =>
    loadFromStorage()
  );

  useEffect(() => {
    saveToStorage(authData);
  }, [authData]);

  const signIn = useCallback(
    (name: string, eventId: string, guestId?: string, token?: string) => {
      setAuthData({
        guestName: name,
        guestId: guestId ?? null,
        eventId,
        token: token ?? null,
      });
    },
    []
  );

  const signOut = useCallback(() => {
    setAuthData(null);
  }, []);

  const value: GuestAuthContextValue = {
    guestName: authData?.guestName ?? null,
    guestId: authData?.guestId ?? null,
    eventId: authData?.eventId ?? null,
    token: authData?.token ?? null,
    isAuthenticated: !!authData?.guestName,
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
  const ctx = useContext(GuestAuthContext);
  if (!ctx) {
    throw new Error("useGuestAuth must be used within a GuestAuthProvider");
  }
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
