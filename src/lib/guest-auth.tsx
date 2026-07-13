import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
interface GuestAuthState { guestName: string | null; eventId: string | null; signIn: (name: string, eventId: string) => void; signOut: () => void; isAuthenticated: boolean; }
const GuestAuthContext = createContext<GuestAuthState | null>(null);
const STORAGE_KEY = "guest-auth";
export function GuestAuthProvider({ children }: { children: ReactNode }) {
  const [guestName, setGuestName] = useState<string | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);
  useEffect(() => { try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) { const p = JSON.parse(raw); setGuestName(p.guestName); setEventId(p.eventId); } } catch { /* ignore */ } }, []);
  const signIn = (name: string, evId: string) => { setGuestName(name); setEventId(evId); localStorage.setItem(STORAGE_KEY, JSON.stringify({ guestName: name, eventId: evId })); };
  const signOut = () => { setGuestName(null); setEventId(null); localStorage.removeItem(STORAGE_KEY); };
  return <GuestAuthContext.Provider value={{ guestName, eventId, signIn, signOut, isAuthenticated: !!guestName }}>{children}</GuestAuthContext.Provider>;
}
export function useGuestAuth(): GuestAuthState { const ctx = useContext(GuestAuthContext); if (!ctx) throw new Error("useGuestAuth must be used within GuestAuthProvider"); return ctx; }
