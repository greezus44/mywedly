import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type Json } from "../../lib/supabase";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { CoverPreview } from "../../components/preview/PreviewRenderers";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { Input, Button, Card } from "../../components/ui";

interface CoverConfig {
  subtitle?: string;
}

export default function CoverEditor() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();

  const [coverImage, setCoverImage] = useState<string | null>(event.draft_cover_image ?? null);
  const [coverConfig, setCoverConfig] = useState<CoverConfig>(() => {
    const cfg = event.draft_cover_config ?? event.cover_config;
    return (cfg as CoverConfig) ?? {};
  });
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  useEffect(() => {
    setCoverImage(event.draft_cover_image ?? null);
    const cfg = event.draft_cover_config ?? event.cover_config;
    setCoverConfig((cfg as CoverConfig) ?? {});
  }, [event]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("user_events")
        .update({
          draft_cover_image: coverImage,
          draft_cover_config: coverConfig as unknown as Json,
        })
        .eq("id", event.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_events", event.id] });
      setSavedMsg("Saved successfully");
      setTimeout(() => setSavedMsg(null), 3000);
    },
  });

  const previewEvent = {
    ...event,
    draft_cover_image: coverImage,
    draft_cover_config: coverConfig as unknown as Json,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dash-text">Cover Page</h2>
          <p className="text-sm text-dash-muted">Set the cover image and subtitle for your website.</p>
        </div>
        <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
          Save Changes
        </Button>
      </div>
      {saveMutation.isError && (
        <p className="text-sm text-dash-danger">
          {saveMutation.error instanceof Error ? saveMutation.error.message : "Failed to save"}
        </p>
      )}
      {savedMsg && <p className="text-sm text-green-600">{savedMsg}</p>}

      <SplitEditor
        editor={
          <Card className="space-y-4">
            <ImageUpload
              label="Cover Image"
              value={coverImage}
              onChange={setCoverImage}
              eventId={event.id}
              aspect="wide"
            />
            <Input
              label="Subtitle"
              value={coverConfig.subtitle ?? ""}
              onChange={(e) =>
                setCoverConfig({ ...coverConfig, subtitle: e.target.value })
              }
              placeholder="e.g. Join us for our special day"
            />
          </Card>
        }
        preview={<CoverPreview event={previewEvent} />}
      />
    </div>
  );
}
