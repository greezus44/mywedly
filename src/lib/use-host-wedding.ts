import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Wedding } from "@/lib/supabase";
import { useHostSession } from "@/lib/auth";

export function useHostWedding() {
  const { session, loading: sessionLoading } = useHostSession();
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionLoading) return;
    if (!session?.user) { setLoading(false); return; }
    supabase.from("weddings").select("*").eq("created_by", session.user.id).maybeSingle().then(({ data, error }) => {
      if (!error && data) setWedding(data as Wedding);
      setLoading(false);
    });
  }, [session, sessionLoading]);

  const createWedding = async () => {
    if (!session?.user) return null;
    const slug = `wedding-${Date.now().toString(36)}`;
    const { data, error } = await supabase.from("weddings").insert({
      slug, couple_name_one: "First", couple_name_two: "Second", created_by: session.user.id, content: {},
    }).select().single();
    if (!error && data) { setWedding(data as Wedding); return data as Wedding; }
    return null;
  };

  return { wedding, loading, createWedding, setWedding };
}
