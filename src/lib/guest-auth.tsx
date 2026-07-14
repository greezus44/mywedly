import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase, type EventGuest } from "./supabase";

const STORAGE_KEY = "mywedly-guest-auth";

export interface GuestAuthState {
  guestId: string | null;
  eventId: string | null;
  token: string | null;
  guestName: string | null;
}

interface GuestAuthContextValue extends GuestAuthState {
  setAuth: (auth: Omit<GuestAuthState, "guestName"> & { guestName?: string | null }) => void;
  clearAuth: () => void;
  isAuthenticated: boolean;
}

const GuestAuthContext = createContext<GuestAuthContextValue | null>(null);

function loadFromStorage(): GuestAuthState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { guestId: null, eventId: null, token: null, guestName: null };
    const parsed = JSON.parse(raw) as GuestAuthState;
    return {
      guestId: parsed.guestId ?? null,
      eventId: parsed.eventId ?? null,
      token: parsed.token ?? null,
      guestName: parsed.guestName ?? null,
    };
  } catch {
    return { guestId: null, eventId: null, token: null, guestName: null };
  }
}

function saveToStorage(state: GuestAuthState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage errors
  }
}

interface GuestAuthProviderProps {
  children: ReactNode;
}

export function GuestAuthProvider({ children }: GuestAuthProviderProps) {
  const [state, setState] = useState<GuestAuthState>(() => loadFromStorage());

  useEffect(() => {
    saveToStorage(state);
  }, [state]);

  const setAuth = useCallback<GuestAuthContextValue["setAuth"]>((auth) => {
    setState({
      guestId: auth.guestId,
      eventId: auth.eventId,
      token: auth.token,
      guestName: auth.guestName ?? null,
    });
  }, []);

  const clearAuth = useCallback(() => {
    setState({ guestId: null, eventId: null, token: null, guestName: null });
  }, []);

  const value = useMemo<GuestAuthContextValue>(
    () => ({
      ...state,
      setAuth,
      clearAuth,
      isAuthenticated: !!state.guestId && !!state.token,
    }),
    [state, setAuth, clearAuth]
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

/**
 * Hook returning a signIn function that records the signed-in guest in the
 * GuestAuth context and persists it to localStorage. Call this after you have
 * successfully looked up the guest (e.g. via event_guests.ilike(username)).
 *
 * Signature: signIn(guestName, eventId, guestId, token?)
 */
export function useSignIn() {
  const { setAuth } = useGuestAuth();
  return useCallback(
    (
      guestName: string,
      eventId: string,
      guestId: string,
      token?: string
    ): void => {
      setAuth({ guestName, eventId, guestId, token: token ?? null });
    },
    [setAuth]
  );
}

/**
 * Hook returning a signIn function that looks up a guest by username for a
 * given event and, if found, stores the guest auth state (guestId, eventId,
 * token, guestName) via useGuestAuth. Returns a signIn callback plus a
 * `notFound` flag the caller can use to surface an error.
 */
export function useGuestSignIn() {
  const { setAuth } = useGuestAuth();
  return useCallback(
    async (
      username: string,
      eventId: string
    ): Promise<{ guest: EventGuest | null; error: string | null }> => {
      const trimmed = username.trim();
      if (!trimmed) return { guest: null, error: "Please enter a username." };
      const { data, error } = await supabase
        .from("event_guests")
        .select("*")
        .ilike("username", trimmed)
        .eq("event_id", eventId)
        .maybeSingle();
      if (error) return { guest: null, error: error.message };
      if (!data) return { guest: null, error: "Username not found" };
      const guest = data as EventGuest;
      setAuth({
        guestId: guest.id,
        eventId,
        token: guest.token,
        guestName: guest.name,
      });
      return { guest, error: null };
    },
    [setAuth]
  );
}
