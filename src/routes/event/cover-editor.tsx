import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Json } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { CoverPreview } from "../../components/preview/PreviewRenderers";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { Input } from "../../components/ui";
import { Button } from "../../components/ui/Button";
import { EventThemeProvider } from "../../lib/theme-context";

interface CoverConfig {
  backgroundImage?: string;
  backgroundColor?: string;
  subtitle?: string;
  title?: unknown;
  date?: unknown;
}

export default function CoverEditor() {
  const { event, eventId } = useEventContext();
  const queryClient = useQueryClient();

  const currentConfig = (event.cover_config ?? {}) as CoverConfig;
  const [bgImage, setBgImage] = useState(currentConfig.backgroundImage ?? "");
  [currentConfig.backgroundColor ?? "var(--event-bg)"];
  const [subtitle, setSubtitle] = useState(
    typeof currentConfig.subtitle === "string"
      ? currentConfig.subtitle
      : "We invite you to celebrate with us"
  );

  const draftEvent: typeof event = {
    ...event,
    cover_config: {
      ...currentConfig,
      backgroundImage: bgImage,
      subtitle,
    } as Json,
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const newConfig: CoverConfig = {
        ...currentConfig,
        backgroundImage: bgImage,
        subtitle,
      };
      const { error } = await supabase
        .from("user_events")
        .update({ cover_config: newConfig as Json })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-dash-text">Cover Editor</h2>
          <p className="text-sm text-dash-muted">Customize the cover page of your website.</p>
        </div>
        <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
          Save Changes
        </Button>
      </div>

      {saveMutation.isError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          Error saving: {saveMutation.error?.message}
        </div>
      )}
      {saveMutation.isSuccess && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">
          Cover saved successfully!
        </div>
      )}

      <SplitEditor
        editor={
          <div className="space-y-4">
            <ImageUpload
              label="Background Image"
              value={bgImage}
              onChange={setBgImage}
              path={`events/${eventId}/cover`}
            />
            <Input
              label="Subtitle"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="We invite you to celebrate with us"
            />
            <p className="text-xs text-dash-muted">
              The title and date are automatically pulled from your event settings.
            </p>
          </div>
        }
        preview={
          <EventThemeProvider theme={event.theme}>
            <CoverPreview event={draftEvent} />
          </EventThemeProvider>
        }
      />
    </div>
  );
}
