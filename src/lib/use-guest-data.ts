import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Wedding, Guest, GuestSession } from "@/lib/supabase";
import { getGuestSession } from "@/lib/guest-auth";

export function useGuestData() {
  const [session, setSession] = useState<GuestSession | null>(null);
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [guest, setGuest] = useState<Guest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const s = getGuestSession();
    setSession(s);
    if (!s) { setLoading(false); return; }
    Promise.all([
      supabase.from("weddings").select("*").eq("id", s.weddingId).maybeSingle(),
      supabase.from("guests").select("*").eq("id", s.guestId).maybeSingle(),
    ]).then(([weddingRes, guestRes]) => {
      if (weddingRes.data) setWedding(weddingRes.data as Wedding);
      if (guestRes.data) setGuest(guestRes.data as Guest);
      setLoading(false);
    });
  }, []);

  return { session, wedding, guest, loading, slug: session?.weddingSlug };
}
