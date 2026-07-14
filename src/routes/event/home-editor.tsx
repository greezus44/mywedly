import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Json } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { RichTextEditor } from "../../components/ui/RichTextEditor";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { HomePreview } from "../../components/preview/PreviewRenderers";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { uploadImage } from "../../lib/upload";

interface HomeContent {
  introHtml?: string;
  storyHtml?: string;
  detailsHtml?: string;
}

export function HomeEditor() {
  const { event, eventId } = useEventContext();
  const queryClient = useQueryClient();

  const existing = (event.draft_content ?? event.content ?? {}) as HomeContent;

  const [introHtml, setIntroHtml] = useState(existing.introHtml ?? "");
  const [storyHtml, setStoryHtml] = useState(existing.storyHtml ?? "");
  const [detailsHtml, setDetailsHtml] = useState(existing.detailsHtml ?? "");
  const [saved, setSaved] = useState(false);

  const liveContent: HomeContent = {
    introHtml,
    storyHtml,
    detailsHtml,
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("user_events")
        .update({ draft_content: liveContent as unknown as Json })
        .eq("id", eventId)
        .select("*")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const handleImageUpload = async (file: File): Promise<string | null> => {
    return uploadImage(file, "home", eventId).then((r) => r?.url ?? null);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-dash-text">Home Editor</h1>
          <p className="mt-1 text-sm text-dash-muted">
            Customise the home page content sections
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saved && <span className="text-sm text-green-600">✓ Saved</span>}
          <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
            Save Changes
          </Button>
        </div>
      </div>

      <div className="h-[calc(100vh-220px)] min-h-[500px]">
        <SplitEditor
          editor={
            <div className="space-y-6">
              {/* Intro Section */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-dash-text">Intro Section</h3>
                <RichTextEditor
                  value={introHtml}
                  onChange={setIntroHtml}
                  placeholder="Write a warm welcome message for your guests…"
                />
              </div>

              {/* Story Section */}
              <div className="space-y-2 border-t border-dash-border pt-4">
                <h3 className="text-sm font-semibold text-dash-text">Our Story Section</h3>
                <RichTextEditor
                  value={storyHtml}
                  onChange={setStoryHtml}
                  placeholder="Share your love story…"
                />
              </div>

              {/* Details Section */}
              <div className="space-y-2 border-t border-dash-border pt-4">
                <h3 className="text-sm font-semibold text-dash-text">Event Details Section</h3>
                <RichTextEditor
                  value={detailsHtml}
                  onChange={setDetailsHtml}
                  placeholder="Add venue, dress code, and other details…"
                />
              </div>

              {/* Cover Image */}
              <div className="space-y-2 border-t border-dash-border pt-4">
                <h3 className="text-sm font-semibold text-dash-text">Home Cover Image</h3>
                <ImageUpload
                  value={event.draft_cover_image ?? event.cover_image}
                  onChange={async (url) => {
                    const { error } = await supabase
                      .from("user_events")
                      .update({ draft_cover_image: url })
                      .eq("id", eventId);
                    if (error) console.error(error);
                    queryClient.invalidateQueries({ queryKey: ["event", eventId] });
                  }}
                  onUpload={handleImageUpload}
                />
              </div>
            </div>
          }
          preview={
            <HomePreview
              event={event}
              theme={event.draft_theme ?? event.theme}
              coverImage={event.draft_cover_image ?? event.cover_image}
            />
          }
        />
      </div>
    </div>
  );
}
