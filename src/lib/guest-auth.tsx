import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { supabase } from "./supabase";

interface GuestAuthState { token: string | null; guestId: string | null; eventId: string | null; guestName: string | null; }
interface GuestAuthContextValue extends GuestAuthState {
  signIn: (name: string, eventId: string) => Promise<{ success: boolean; error?: string }>;
  signInWithToken: (token: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => void;
}

const GuestAuthContext = createContext<GuestAuthContextValue | undefined>(undefined);
const STORAGE_KEY = "event_guest_auth";

export function GuestAuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GuestAuthState>({ token: null, guestId: null, eventId: null, guestName: null });

  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) { try { setState(JSON.parse(stored)); } catch { sessionStorage.removeItem(STORAGE_KEY); } }
  }, []);

  const persist = (s: GuestAuthState) => {
    setState(s);
    if (s.token) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    else sessionStorage.removeItem(STORAGE_KEY);
  };

  const signIn = useCallback(async (name: string, eventId: string) => {
    const { data, error } = await supabase.from("event_guests").select("id, token, name").eq("event_id", eventId).ilike("name", name.trim()).limit(1).maybeSingle();
    if (error) return { success: false, error: error.message };
    if (!data) return { success: false, error: "Name not found in guest list" };
    persist({ token: data.token, guestId: data.id, eventId, guestName: data.name });
    return { success: true };
  }, []);

  const signInWithToken = useCallback(async (token: string) => {
    const { data, error } = await supabase.from("event_guests").select("id, event_id, name, token").eq("token", token).limit(1).maybeSingle();
    if (error) return { success: false, error: error.message };
    if (!data) return { success: false, error: "Invalid invitation token" };
    persist({ token: data.token, guestId: data.id, eventId: data.event_id, guestName: data.name });
    return { success: true };
  }, []);

  const signOut = useCallback(() => persist({ token: null, guestId: null, eventId: null, guestName: null }), []);

  return <GuestAuthContext.Provider value={{ ...state, signIn, signInWithToken, signOut }}>{children}</GuestAuthContext.Provider>;
}

export function useGuestAuth() {
  const ctx = useContext(GuestAuthContext);
  if (!ctx) throw new Error("useGuestAuth must be used within GuestAuthProvider");
  return ctx;
}
