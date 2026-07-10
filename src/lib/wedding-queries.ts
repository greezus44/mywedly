import { supabase } from "@/integrations/supabase/client";

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 64);
}

export type Wedding = {
  id: string;
  slug: string;
  couple_name_one: string;
  couple_name_two: string;
  wedding_date: string | null;
  location: string | null;
  hero_image_url: string | null;
  story: string | null;
  hashtag: string | null;
  theme: string;
  is_published: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  content?: Record<string, unknown> | null;
};

export async function listMyWeddings(): Promise<Wedding[]> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];
  const { data, error } = await supabase
    .from("weddings")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Wedding[];
}

export async function getWeddingBySlug(slug: string): Promise<Wedding | null> {
  const { data, error } = await supabase
    .from("weddings")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return (data as Wedding | null) ?? null;
}
