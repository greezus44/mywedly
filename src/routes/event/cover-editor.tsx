import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Json } from "../../lib/supabase";
import { useOutletContext } from "./event-layout";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { CoverPreview } from "../../components/preview/PreviewRenderers";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { Button } from "../../components/ui/Button";
import { Input, LoadingSpinner, ErrorState } from "../../components/ui";

interface CoverConfig {
  subtitle?: string;
}

export default function CoverEditor() {
  const { event, eventId } = useOutletContext();
  const queryClient = useQueryClient();

  const [coverImage, setCoverImage] = useState<string | null>(
    event.draft_cover_image ?? event.cover_image
  );
  const [subtitle, setSubtitle] = useState<string>(
    (event.draft_cover_config as CoverConfig)?.subtitle ??
      (event.cover_config as CoverConfig)?.subtitle ??
      ""
  );
  const [savedEvent, setSavedEvent] = useState(event);

  useEffect(() => {
    setSavedEvent(event);
  }, [event]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const config: CoverConfig = { subtitle };
      const { data, error } = await supabase
        .from("user_events")
        .update({
          draft_cover_image: coverImage,
          draft_cover_config: config as unknown as Json,
        })
        .eq("id", eventId)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["user_event", eventId] });
      if (data) setSavedEvent(data as typeof event);
    },
  });

  const previewEvent = {
    ...savedEvent,
    draft_cover_image: coverImage,
    draft_cover_config: { subtitle } as unknown as Json,
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-dash-text">Cover Editor</h2>
        <Button
          onClick={() => saveMutation.mutate()}
          loading={saveMutation.isPending}
        >
          Save Changes
        </Button>
      </div>

      {saveMutation.isError && (
        <p className="mb-2 text-sm text-dash-danger">
          {saveMutation.error instanceof Error
            ? saveMutation.error.message
            : "Failed to save"}
        </p>
      )}
      {saveMutation.isSuccess && (
        <p className="mb-2 text-sm text-green-600">Changes saved successfully!</p>
      )}

      <div className="flex-1 overflow-hidden rounded-lg border border-dash-border">
        <SplitEditor
          editor={
            <div className="flex flex-col gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-dash-text">
                  Cover Image
                </label>
                <ImageUpload
                  value={coverImage}
                  onChange={setCoverImage}
                  eventId={eventId}
                  aspect="16/9"
                />
              </div>
              <Input
                label="Subtitle"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="e.g. Join us for our special day"
              />
              <p className="text-sm text-dash-muted">
                The cover image and subtitle appear at the top of your invitation
                website. This is the first thing guests see.
              </p>
            </div>
          }
          preview={<CoverPreview event={previewEvent} draft />}
          editorRatio={0.4}
        />
      </div>
    </div>
  );
}
