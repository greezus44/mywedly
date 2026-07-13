import React, { useEffect, useState, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { Input, Textarea } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { CoverPreview } from "../../components/preview/PreviewRenderers";
import { LoadingSpinner } from "../../components/ui";

type CoverConfig = { subtitle?: string };

export default function CoverEditor() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();
  const [subtitle, setSubtitle] = useState("");
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const cfg = (event.draft_cover_config ?? event.cover_config ?? {}) as CoverConfig;
    setSubtitle(cfg.subtitle ?? "");
    setCoverImage(event.draft_cover_image ?? event.cover_image ?? null);
  }, [event.id]);

  const saveMutation = useMutation({
    mutationFn: async (payload: { draft_cover_image: string | null; draft_cover_config: CoverConfig }) => {
      const { error } = await supabase
        .from("user_events")
        .update({
          draft_cover_image: payload.draft_cover_image,
          draft_cover_config: payload.draft_cover_config,
        })
        .eq("id", event.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", event.id] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  // Auto-save with debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      saveMutation.mutate({ draft_cover_image: coverImage, draft_cover_config: { subtitle } });
    }, 800);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtitle, coverImage]);

  const previewEvent: Partial<UserEvent> = {
    ...event,
    name: event.draft_name || event.name,
    event_date: event.draft_event_date || event.event_date,
    cover_image: coverImage,
    cover_config: { subtitle },
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-dash-text">Cover Editor</h2>
        {saved && <span className="text-sm text-green-600">✓ Saved</span>}
        {saveMutation.isPending && <LoadingSpinner className="h-4 w-4" />}
      </div>
      <SplitEditor
        editor={
          <div className="space-y-4">
            <ImageUpload
              label="Cover Image"
              value={coverImage}
              onChange={setCoverImage}
              eventId={event.id}
              aspect="aspect-video"
            />
            <Textarea
              label="Subtitle"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="A short tagline or message for your cover"
              rows={2}
            />
          </div>
        }
        preview={<CoverPreview event={previewEvent} />}
      />
    </div>
  );
}
