import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type Json } from "../../lib/supabase";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { CoverPreview } from "../../components/preview/PreviewRenderers";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { Input } from "../../components/ui/Input";
import { Toggle } from "../../components/ui";
import { Button } from "../../components/ui/Button";

interface CoverConfig {
  headline?: string;
  subheadline?: string;
  showDate?: boolean;
  showVenue?: boolean;
  showCountdown?: boolean;
}

export default function CoverEditor() {
  const { event, eventId } = useOutletContext<{ event: UserEvent; eventId: string }>();
  const queryClient = useQueryClient();

  const config = (event.draft_cover_config ?? event.cover_config ?? {}) as CoverConfig;

  const [coverImage, setCoverImage] = useState<string | null>(
    event.draft_cover_image ?? event.cover_image
  );
  const [headline, setHeadline] = useState(config.headline ?? "");
  const [subheadline, setSubheadline] = useState(config.subheadline ?? "");
  const [showDate, setShowDate] = useState(config.showDate ?? true);
  const [showVenue, setShowVenue] = useState(config.showVenue ?? true);
  const [showCountdown, setShowCountdown] = useState(config.showCountdown ?? true);
  const [saved, setSaved] = useState(false);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const newConfig: CoverConfig = {
        headline,
        subheadline,
        showDate,
        showVenue,
        showCountdown,
      };
      const { error } = await supabase
        .from("user_events")
        .update({
          draft_cover_image: coverImage,
          draft_cover_config: newConfig as unknown as Json,
        })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const previewEvent: Partial<UserEvent> = {
    ...event,
    cover_image: coverImage,
    cover_config: { headline, subheadline, showDate, showVenue, showCountdown },
  };

  return (
    <div className="mx-auto max-w-7xl p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-dash-text">Cover Editor</h2>
        <div className="flex items-center gap-2">
          {saved && <span className="text-sm text-green-600">Saved!</span>}
          <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
            Save Changes
          </Button>
        </div>
      </div>

      <div className="h-[calc(100vh-200px)]">
        <SplitEditor
          editor={
            <div className="space-y-4">
              <ImageUpload
                label="Cover Image"
                value={coverImage}
                onChange={setCoverImage}
                eventId={eventId}
                aspect="aspect-video"
              />
              <Input
                label="Headline"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder={event.name || "Your event name"}
              />
              <Input
                label="Subtitle"
                value={subheadline}
                onChange={(e) => setSubheadline(e.target.value)}
                placeholder="e.g. We're getting married!"
              />
              <div className="space-y-2">
                <Toggle checked={showDate} onChange={setShowDate} label="Show date" />
                <Toggle checked={showVenue} onChange={setShowVenue} label="Show venue" />
                <Toggle checked={showCountdown} onChange={setShowCountdown} label="Show countdown" />
              </div>
              {saveMutation.isError && (
                <p className="text-sm text-red-600">
                  {saveMutation.error instanceof Error ? saveMutation.error.message : "Save failed."}
                </p>
              )}
            </div>
          }
          preview={<CoverPreview event={previewEvent} />}
        />
      </div>
    </div>
  );
}
