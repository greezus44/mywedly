import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type Json } from "../../lib/supabase";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { CoverPreview } from "../../components/preview/PreviewRenderers";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { Input } from "../../components/ui";
import { Button } from "../../components/ui/Button";

interface CoverConfig {
  subtitle?: string;
  [key: string]: any;
}

export default function CoverEditor() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();

  const [coverImage, setCoverImage] = useState<string | null>(event.draft_cover_image ?? event.cover_image ?? null);
  const [coverConfig, setCoverConfig] = useState<CoverConfig>(
    (event.draft_cover_config ?? event.cover_config ?? {}) as CoverConfig
  );

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("user_events")
        .update({
          draft_cover_image: coverImage,
          draft_cover_config: coverConfig as Json,
        })
        .eq("id", event.id)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_events", event.id] });
    },
    onError: () => {
      // Error is surfaced via saveMutation.isError
    },
  });

  const previewEvent: Partial<UserEvent> = {
    ...event,
    cover_image: coverImage,
    cover_config: coverConfig as Json,
    name: event.draft_name ?? event.name,
    event_date: event.draft_event_date ?? event.event_date,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dash-text">Cover Editor</h2>
          <p className="mt-1 text-sm text-dash-muted">Customize the cover image and subtitle for your website.</p>
        </div>
        <Button
          loading={saveMutation.isPending}
          onClick={() => saveMutation.mutate()}
        >
          Save Changes
        </Button>
      </div>

      {saveMutation.isError && (
        <div className="rounded-md border border-dash-danger/30 bg-red-50 px-4 py-3 text-sm text-dash-danger">
          Failed to save. Please try again.
        </div>
      )}
      {saveMutation.isSuccess && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Changes saved successfully.
        </div>
      )}

      <SplitEditor
        editor={
          <div className="space-y-6">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-dash-text">Cover Image</label>
              <ImageUpload
                value={coverImage}
                onChange={setCoverImage}
                eventId={event.id}
                aspect="aspect-video"
              />
            </div>
            <Input
              label="Subtitle"
              value={coverConfig.subtitle || ""}
              onChange={(e) => setCoverConfig({ ...coverConfig, subtitle: e.target.value })}
              placeholder="e.g. Join us as we celebrate our special day"
            />
          </div>
        }
        preview={<CoverPreview event={previewEvent} />}
      />
    </div>
  );
}
