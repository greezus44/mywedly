import { useEffect, useState } from "react";
import { supabase, type Wedding } from "@/lib/supabase";

export function useWedding(slug: string) {
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    supabase
      .from("weddings")
      .select("*")
      .eq("slug", slug)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) setError(error.message);
        else if (!data) setError("Wedding not found");
        else setWedding(data as Wedding);
        setLoading(false);
      });
    return () => { active = false; };
  }, [slug]);

  return { wedding, loading, error };
}
