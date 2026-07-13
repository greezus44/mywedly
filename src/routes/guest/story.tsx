import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { WebsiteContent } from "@/lib/supabase";
import { useGuestData } from "@/lib/use-guest-data";
import { formatDate } from "@/lib/utils";

export function GuestStory() {
  const { wedding, loading } = useGuestData();
  const [content, setContent] = useState<WebsiteContent | null>(null);
  const [contentLoading, setContentLoading] = useState(true);

  useEffect(() => {
    if (!wedding) return;
    supabase
      .from("website_content")
      .select("*")
      .eq("wedding_id", wedding.id)
      .eq("section", "story")
      .maybeSingle()
      .then(({ data }) => {
        setContent(data as WebsiteContent | null);
        setContentLoading(false);
      });
  }, [wedding]);

  if (loading || contentLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-sepia">
        Loading…
      </div>
    );
  }

  if (!wedding) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-sepia">
        Wedding not found.
      </div>
    );
  }

  const title = content?.title || "Our Story";
  const body = content?.body || wedding.story || "";
  const image = content?.image_url || null;

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      {/* Header */}
      <header className="text-center mb-12">
        <div className="flex items-center justify-center gap-3 text-sepia mb-4">
          <span className="h-px w-12 bg-sand" />
          <Heart className="w-5 h-5" />
          <span className="h-px w-12 bg-sand" />
        </div>
        <h1 className="text-4xl md:text-5xl font-script text-onyx mb-3">
          {wedding.couple_name_one} & {wedding.couple_name_two}
        </h1>
        {wedding.wedding_date && (
          <p className="text-sepia text-sm tracking-widest uppercase">
            {formatDate(wedding.wedding_date)}
          </p>
        )}
      </header>

      {/* Story card */}
      <article className="bg-card border border-sand rounded-lg p-8 md:p-12">
        <h2 className="font-serif text-2xl md:text-3xl text-onyx text-center mb-8">
          {title}
        </h2>

        {image && (
          <div className="mb-8 rounded-lg overflow-hidden border border-sand">
            <img
              src={image}
              alt={title}
              className="w-full h-auto object-cover max-h-[420px]"
            />
          </div>
        )}

        {body ? (
          <div className="prose prose-sepia max-w-none">
            <p className="text-ink leading-relaxed whitespace-pre-line text-lg font-serif">
              {body}
            </p>
          </div>
        ) : (
          <p className="text-sepia italic text-center">
            Their story is still being written…
          </p>
        )}
      </article>

      {/* Decorative footer */}
      <div className="flex items-center justify-center gap-3 text-sepia mt-10">
        <span className="h-px w-10 bg-sand" />
        <Heart className="w-4 h-4" />
        <span className="h-px w-10 bg-sand" />
      </div>
    </div>
  );
}

export default GuestStory;
