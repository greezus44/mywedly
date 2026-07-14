import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type Json } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { SplitEditor } from "../../components/preview/SplitEditor";
import {
  CoverPreview,
  type CoverConfig,
  type LogoConfig,
} from "../../components/preview/PreviewRenderers";
import { TypographyControls } from "../../components/ui/TypographyControls";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { RangeInput, Card } from "../../components/ui";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { uploadImage } from "../../lib/upload";
import type { TypographyStyle } from "../../lib/typography";

function asTypography(value: unknown): TypographyStyle {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as TypographyStyle;
  }
  return {};
}

export function CoverEditor() {
  const { event, eventId } = useEventContext();
  const queryClient = useQueryClient();

  const initial = (event.draft_cover_config ?? event.cover_config) as CoverConfig | null;
  const initialLogo = (event.draft_logo_config ?? event.logo_config) as LogoConfig | null;

  const [eyebrow, setEyebrow] = useState<TypographyStyle>(asTypography(initial?.eyebrow));
  const [heading, setHeading] = useState<TypographyStyle>(asTypography(initial?.heading));
  const [subheading, setSubheading] = useState<TypographyStyle>(asTypography(initial?.subheading));
  const [ctaLabel, setCtaLabel] = useState(initial?.ctaLabel ?? "");
  const [overlay, setOverlay] = useState(initial?.overlay ?? 0.3);
  const [logoConfig, setLogoConfig] = useState<LogoConfig>(initialLogo ?? {});
  const [coverImage, setCoverImage] = useState<string | null>(event.draft_cover_image ?? event.cover_image);

  useEffect(() => {
    const cfg = (event.draft_cover_config ?? event.cover_config) as CoverConfig | null;
    setEyebrow(asTypography(cfg?.eyebrow));
    setHeading(asTypography(cfg?.heading));
    setSubheading(asTypography(cfg?.subheading));
    setCtaLabel(cfg?.ctaLabel ?? "");
    setOverlay(cfg?.overlay ?? 0.3);
    setLogoConfig((event.draft_logo_config ?? event.logo_config) as LogoConfig ?? {});
    setCoverImage(event.draft_cover_image ?? event.cover_image);
  }, [event]);

  const liveCoverConfig: CoverConfig = {
    eyebrow,
    heading,
    subheading,
    ctaLabel,
    overlay,
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("user_events")
        .update({
          draft_cover_config: liveCoverConfig as unknown as Json,
          draft_logo_config: logoConfig as unknown as Json,
          draft_cover_image: coverImage,
        })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
    },
  });

  const handleLogoUpload = async (file: File) => {
    const result = await uploadImage(file, `${eventId}/logo-${Date.now()}`);
    if ("error" in result) {
      alert(result.error);
      return;
    }
    setLogoConfig((prev) => ({ ...prev, imageUrl: result.url }));
  };

  const handleCoverUpload = async (file: File) => {
    const result = await uploadImage(file, `${eventId}/cover-${Date.now()}`);
    if ("error" in result) {
      alert(result.error);
      return;
    }
    setCoverImage(result.url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-dash-text">Cover Editor</h2>
        <Button
          onClick={() => saveMutation.mutate()}
          loading={saveMutation.isPending}
        >
          Save
        </Button>
      </div>

      {saveMutation.isError && (
        <p className="text-sm text-dash-danger">
          {saveMutation.error instanceof Error ? saveMutation.error.message : "Save failed"}
        </p>
      )}
      {saveMutation.isSuccess && (
        <p className="text-sm text-green-600">Saved successfully!</p>
      )}

      <SplitEditor
        editor={
          <div className="space-y-6">
            <Card className="p-4 space-y-4">
              <h3 className="text-sm font-semibold text-dash-text">Title</h3>
              <TypographyControls
                label="Heading"
                value={heading}
                onChange={setHeading}
              />
            </Card>

            <Card className="p-4 space-y-4">
              <TypographyControls
                label="Subtitle"
                value={subheading}
                onChange={setSubheading}
              />
            </Card>

            <Card className="p-4 space-y-4">
              <TypographyControls
                label="Eyebrow"
                value={eyebrow}
                onChange={setEyebrow}
              />
            </Card>

            <Card className="p-4 space-y-3">
              <h3 className="text-sm font-semibold text-dash-text">Call to Action</h3>
              <Input
                label="Button label"
                value={ctaLabel}
                onChange={(e) => setCtaLabel(e.target.value)}
                placeholder="e.g. RSVP Now"
              />
              <RangeInput
                label="Overlay opacity"
                value={Math.round(overlay * 100)}
                onChange={(v) => setOverlay(v / 100)}
                min={0}
                max={80}
                step={5}
              />
            </Card>

            <Card className="p-4 space-y-3">
              <h3 className="text-sm font-semibold text-dash-text">Cover Image</h3>
              <ImageUpload
                value={coverImage}
                onUpload={handleCoverUpload}
                onRemove={() => setCoverImage(null)}
                label="Upload cover image"
              />
            </Card>

            <Card className="p-4 space-y-3">
              <h3 className="text-sm font-semibold text-dash-text">Logo</h3>
              <ImageUpload
                value={logoConfig.imageUrl ?? null}
                onUpload={handleLogoUpload}
                onRemove={() => setLogoConfig((prev) => ({ ...prev, imageUrl: null }))}
                label="Upload logo"
              />
              <RangeInput
                label="Logo size (px)"
                value={logoConfig.size ?? 80}
                onChange={(v) => setLogoConfig((prev) => ({ ...prev, size: v }))}
                min={32}
                max={200}
                step={4}
              />
            </Card>
          </div>
        }
        preview={
          <div className="rounded-lg border border-dash-border bg-dash-surface p-4 overflow-hidden">
            <CoverPreview
              event={event}
              theme={event.draft_theme ?? event.theme}
              coverConfig={liveCoverConfig}
              logoConfig={logoConfig}
              coverImage={coverImage}
            />
          </div>
        }
      />
    </div>
  );
}
