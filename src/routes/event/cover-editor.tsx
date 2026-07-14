import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Json } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Card, ColorInput, RangeInput, Toggle, FormField } from "../../components/ui";
import { TypographyControls } from "../../components/ui/TypographyControls";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { CoverPreview } from "../../components/preview/PreviewRenderers";
import type { TypographyStyle } from "../../lib/typography";

interface CoverConfig {
  layout?: "centered" | "split" | "minimal";
  heading?: TypographyStyle;
  subheading?: TypographyStyle;
  dateText?: TypographyStyle;
  venueText?: TypographyStyle;
  showCountdown?: boolean;
  overlayColor?: string;
  overlayOpacity?: number;
}

function asConfig(json: Json | null | undefined): CoverConfig {
  if (!json || typeof json !== "object" || Array.isArray(json)) return {};
  return json as CoverConfig;
}

export function CoverEditor() {
  const { event, eventId } = useEventContext();
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);

  const [coverImage, setCoverImage] = useState<string | null>(event.draft_cover_image ?? null);
  const [config, setConfig] = useState<CoverConfig>(asConfig(event.draft_cover_config));
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) setUserId(session?.user?.id ?? null);
    });
    return () => { mounted = false; };
  }, []);

  // Sync when event changes (e.g. after refetch)
  useEffect(() => {
    setCoverImage(event.draft_cover_image ?? null);
    setConfig(asConfig(event.draft_cover_config));
  }, [event.draft_cover_image, event.draft_cover_config]);

  const saveMutation = useMutation({
    mutationFn: async () => {
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
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const update = (patch: Partial<CoverConfig>) => {
    setConfig((prev) => ({ ...prev, ...patch }));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dash-text">Cover Editor</h2>
          <p className="text-sm text-dash-muted">Customize the cover page of your event site.</p>
        </div>
        <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
          {saved ? "Saved!" : "Save"}
        </Button>
      </div>

      <SplitEditor
        editor={
          <div className="space-y-4">
            <Card>
              <h3 className="mb-3 text-sm font-semibold text-dash-text">Cover Image</h3>
              {userId && (
                <ImageUpload
                  value={coverImage}
                  onChange={setCoverImage}
                  userId={userId}
                  aspectRatio="wide"
                  label="Background Image"
                />
              )}
            </Card>

            <Card>
              <h3 className="mb-3 text-sm font-semibold text-dash-text">Overlay</h3>
              <div className="space-y-3">
                <ColorInput
                  label="Overlay Colour"
                  value={config.overlayColor || "#000000"}
                  onChange={(overlayColor) => update({ overlayColor })}
                />
                <RangeInput
                  label="Overlay Opacity"
                  value={(config.overlayOpacity ?? 0.3) * 100}
                  onChange={(v) => update({ overlayOpacity: v / 100 })}
                  min={0}
                  max={100}
                  step={5}
                />
                <Toggle
                  checked={config.showCountdown ?? true}
                  onChange={(showCountdown) => update({ showCountdown })}
                  label="Show countdown"
                />
              </div>
            </Card>

            <Card>
              <h3 className="mb-3 text-sm font-semibold text-dash-text">Heading</h3>
              <TypographyControls
                value={config.heading || {}}
                onChange={(heading) => update({ heading })}
                showText
              />
            </Card>

            <Card>
              <h3 className="mb-3 text-sm font-semibold text-dash-text">Subheading</h3>
              <TypographyControls
                value={config.subheading || {}}
                onChange={(subheading) => update({ subheading })}
                showText
              />
            </Card>

            <Card>
              <h3 className="mb-3 text-sm font-semibold text-dash-text">Date Text</h3>
              <TypographyControls
                value={config.dateText || {}}
                onChange={(dateText) => update({ dateText })}
              />
            </Card>

            <Card>
              <h3 className="mb-3 text-sm font-semibold text-dash-text">Venue Text</h3>
              <TypographyControls
                value={config.venueText || {}}
                onChange={(venueText) => update({ venueText })}
              />
            </Card>
          </div>
        }
        preview={
          <div className="rounded-lg border border-dash-border p-4">
            <CoverPreview
              coverImage={coverImage}
              coverConfig={config as unknown as Json}
              eventName={event.draft_name || event.name}
              eventDate={event.draft_event_date || event.event_date}
              eventTime={event.draft_event_time || event.event_time}
              venue={event.draft_venue || event.venue}
            />
          </div>
        }
      />

      {saveMutation.isError && (
        <p className="text-sm text-dash-danger">
          {saveMutation.error instanceof Error ? saveMutation.error.message : "Failed to save."}
        </p>
      )}
    </div>
  );
}
