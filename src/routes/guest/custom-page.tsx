import React from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { BlockRenderer, type Block } from "./block-renderer";

export default function GuestCustomPage() {
  const { slug, pageSlug } = useParams<{ slug: string; pageSlug: string }>();

  const { data: event } = useQuery({
    queryKey: ["event_by_slug", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_events").select("*").eq("slug", slug!).single();
      if (error) throw error;
      return data as UserEvent;
    },
    enabled: !!slug,
  });

  if (!event) return <div className="min-h-screen flex items-center justify-center">Loading…</div>;

  const content = (event.content ?? {}) as Record<string, unknown>;
  const pages = (content.pages ?? []) as unknown as Block[][];
  const page = pages.find((_, i) => {
    const p = pages[i] as unknown as { slug?: string };
    return p?.slug === pageSlug;
  });

  if (!page) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <p className="text-[var(--event-text-muted)]">Page not found.</p>
      </div>
    );
  }

  const blocks = (page as unknown as { blocks?: unknown }).blocks as unknown as Block[];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {Array.isArray(blocks) && blocks.map((block, i) => <BlockRenderer key={i} block={block} />)}
    </div>
  );
}
