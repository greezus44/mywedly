import { supabase } from "./supabase";
import type { GuestSession } from "./supabase";

const KEY = "guest_session";

export function saveGuestSession(s: GuestSession) {
  sessionStorage.setItem(KEY, JSON.stringify(s));
}

export function getGuestSession(): GuestSession | null {
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as GuestSession;
  } catch {
    return null;
  }
}

export function clearGuestSession() {
  sessionStorage.removeItem(KEY);
}

export async function guestSignin(weddingId: string, username: string, weddingSlug: string) {
  const { data, error } = await supabase.rpc("guest_signin", {
    p_wedding_id: weddingId,
    p_username: username,
  });
  if (error) return { error: error.message, session: null };
  if (!data || data.length === 0) return { error: "Guest not found. Please check your username.", session: null };
  const row = data[0];
  const session: GuestSession = {
    guestId: row.guest_id,
    weddingId: row.wedding_id,
    fullName: row.out_full_name,
    weddingSlug,
  };
  saveGuestSession(session);
  return { error: null, session };
}

export function isGuestAuthenticated(): boolean {
  return getGuestSession() !== null;
}
