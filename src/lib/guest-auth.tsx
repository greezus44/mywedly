import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "./supabase";

interface GuestAuthState {
  guestId: string | null;
  eventId: string | null;
  name: string | null;
  email: string | null;
  isAuthenticated: boolean;
}

interface GuestAuthContextValue extends GuestAuthState {
  signIn: (eventId: string, guestId: string, name?: string, email?: string) => void;
  signOut: () => void;
}

const STORAGE_KEY = "mywedly-guest-auth";

const GuestAuthContext = createContext<GuestAuthContextValue>({
  guestId: null,
  eventId: null,
  name: null,
  email: null,
  isAuthenticated: false,
  signIn: () => {},
  signOut: () => {},
});

function loadState(): GuestAuthState {
  if (typeof window === "undefined") return { guestId: null, eventId: null, name: null, email: null, isAuthenticated: false };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { guestId: null, eventId: null, name: null, email: null, isAuthenticated: false };
    const parsed = JSON.parse(raw) as GuestAuthState;
    return {
      guestId: parsed.guestId ?? null,
      eventId: parsed.eventId ?? null,
      name: parsed.name ?? null,
      email: parsed.email ?? null,
      isAuthenticated: Boolean(parsed.guestId && parsed.eventId),
    };
  } catch {
    return { guestId: null, eventId: null, name: null, email: null, isAuthenticated: false };
  }
}

function saveState(state: GuestAuthState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

interface GuestAuthProviderProps {
  children: ReactNode;
}

export function GuestAuthProvider({ children }: GuestAuthProviderProps) {
  const [state, setState] = useState<GuestAuthState>(loadState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const signIn = useCallback(
    (eventId: string, guestId: string, name?: string, email?: string) => {
      setState({
        guestId,
        eventId,
        name: name ?? null,
        email: email ?? null,
        isAuthenticated: true,
      });
    },
    []
  );

  const signOut = useCallback(() => {
    setState({ guestId: null, eventId: null, name: null, email: null, isAuthenticated: false });
  }, []);

  const value = useMemo<GuestAuthContextValue>(
    () => ({ ...state, signIn, signOut }),
    [state, signIn, signOut]
  );

  return <GuestAuthContext.Provider value={value}>{children}</GuestAuthContext.Provider>;
}

export function useGuestAuth(): GuestAuthContextValue {
  return useContext(GuestAuthContext);
}

export function useSignIn() {
  const { signIn } = useGuestAuth();
  return signIn;
}

export async function useGuestSignIn(eventId: string, identifier: string): Promise<boolean> {
  const { signIn } = useGuestAuth();
  const { data, error } = await supabase
    .from("event_guests")
    .select("*")
    .eq("event_id", eventId)
    .or(`email.eq.${identifier},phone.eq.${identifier},name.eq.${identifier}`)
    .single();

  if (error || !data) return false;

  signIn(eventId, data.id, data.name, data.email);
  return true;
}
