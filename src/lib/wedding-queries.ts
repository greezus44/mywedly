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

export type WeddingTheme = {
  accent?: string;    // css color, applied to --sepia
  bg?: string;        // css color, applied to --parchment
  serif?: string;     // css font family (string)
  sans?: string;
};

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
  theme: WeddingTheme;
  is_published: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  content?: Record<string, any> | null;
  guest_password?: string | null;
  password_mode?: "shared" | "per_guest" | "none";
  signin_helper?: string | null;
};

export type CustomPage = {
  id: string;
  wedding_id: string;
  slug: string;
  title: string;
  body: string;
  cover_image_url: string | null;
  inline_image_url: string | null;
  sort_order: number;
  is_published: boolean;
};

export async function listMyWeddings(): Promise<Wedding[]> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];
  const { data, error } = await supabase
    .from("weddings")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Wedding[];
}

export async function getWeddingBySlug(slug: string): Promise<Wedding | null> {
  const { data, error } = await supabase
    .from("weddings")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as Wedding | null) ?? null;
}

export async function listPublishedCustomPages(weddingId: string): Promise<CustomPage[]> {
  const { data, error } = await supabase
    .from("custom_pages")
    .select("*")
    .eq("wedding_id", weddingId)
    .eq("is_published", true)
    .order("sort_order");
  if (error) throw error;
  return (data ?? []) as CustomPage[];
}

export async function getCustomPage(weddingId: string, slug: string): Promise<CustomPage | null> {
  const { data, error } = await supabase
    .from("custom_pages")
    .select("*")
    .eq("wedding_id", weddingId)
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return (data as CustomPage | null) ?? null;
}
