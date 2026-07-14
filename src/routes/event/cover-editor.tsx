import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type Json } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { CoverPreview } from "../../components/preview/PreviewRenderers";
import { ImageUpload } from "../../components/ui/ImageUpload";

interface CoverConfig {
  subtitle?: string;
}

function jsonToCoverConfig(json: Json | null | undefined): CoverConfig {
  if (!json || typeof json !== "object") return {};
  return json as CoverConfig;
}

export default function CoverEditor() {
  const { event, eventId } = useOutletContext<{ event: UserEvent; eventId: string }>();
  const queryClient = useQueryClient();

  const [coverImage, setCoverImage] = useState<string | null>(
    event.draft_cover_image ?? event.cover_image ?? null
  );
  const [subtitle, setSubtitle] = useState<string>(
    jsonToCoverConfig(event.draft_cover_config ?? event.cover_config).subtitle ?? ""
  );

  useEffect(() => {
    setCoverImage(event.draft_cover_image ?? event.cover_image ?? null);
    setSubtitle(jsonToCoverConfig(event.draft_cover_config ?? event.cover_config).subtitle ?? "");
  }, [event]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const config: CoverConfig = { subtitle };
      const { error } = await supabase
        .from("user_events")
        .update({
          draft_cover_image: coverImage,
          draft_cover_config: config as unknown as Json,
        })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
    },
  });

  const previewEvent: Partial<UserEvent> = {
    ...event,
    draft_cover_image: coverImage,
    draft_cover_config: { subtitle } as unknown as Json,
  };

  return (
    <div className="flex h-[calc(100vh-180px)] flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Cover Editor</h2>
          <p className="text-sm text-muted">
            Customize the cover image and subtitle for your website.
          </p>
        </div>
        <Button
          onClick={() => saveMutation.mutate()}
          loading={saveMutation.isPending}
        >
          Save Changes
        </Button>
      </div>

      {saveMutation.isError && (
        <p className="text-sm text-danger">
          {saveMutation.error instanceof Error
            ? saveMutation.error.message
            : "Failed to save"}
        </p>
      )}
      {saveMutation.isSuccess && (
        <p className="text-sm text-success">Saved successfully!</p>
      )}

      <SplitEditor
        editor={
          <div className="flex flex-col gap-4 p-4">
            <ImageUpload
              label="Cover Image"
              value={coverImage}
              onChange={setCoverImage}
              eventId={eventId}
              aspect="wide"
            />
            <Input
              label="Subtitle"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="e.g. We're getting married!"
            />
          </div>
        }
        preview={<CoverPreview event={previewEvent} />}
      />
    </div>
  );
}
