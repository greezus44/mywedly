import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Json } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { RangeInput } from "../../components/ui";
import { TypographyControls } from "../../components/ui/TypographyControls";
import { SplitEditor } from "../../components/preview/SplitEditor";
import {
  CoverPreview,
  type CoverConfig,
  type LogoConfig,
} from "../../components/preview/PreviewRenderers";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { uploadImage } from "../../lib/upload";
import type { TypographyStyle } from "../../lib/typography";

function asTypography(value: unknown, fallbackText: string): TypographyStyle {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const v = value as TypographyStyle;
    return {
      text: v.text ?? fallbackText,
      fontFamily: v.fontFamily,
      fontSize: v.fontSize,
      fontWeight: v.fontWeight,
      color: v.color,
      align: v.align,
      italic: v.italic,
      underline: v.underline,
      letterSpacing: v.letterSpacing,
      lineHeight: v.lineHeight,
    };
  }
  if (typeof value === "string") {
    return { text: value };
  }
  return { text: fallbackText };
}

export function CoverEditor() {
  const { event, eventId } = useEventContext();
  const queryClient = useQueryClient();

  const initialConfig = (event.draft_cover_config ?? event.cover_config ?? {}) as CoverConfig;
  const initialLogo = (event.draft_logo_config ?? event.logo_config ?? {}) as LogoConfig;
  const initialImage = event.draft_cover_image ?? event.cover_image ?? null;

  const [heading, setHeading] = useState<TypographyStyle>(
    asTypography(initialConfig.heading, event.name || "Event Title"),
  );
  const [subheading, setSubheading] = useState<TypographyStyle>(
    asTypography(initialConfig.subheading, ""),
  );
  const [eyebrow, setEyebrow] = useState<TypographyStyle>(
    asTypography(initialConfig.eyebrow, ""),
  );
  const [ctaText, setCtaText] = useState(initialConfig.ctaText ?? "");
  const [overlayOpacity, setOverlayOpacity] = useState(initialConfig.overlayOpacity ?? 0.4);
  const [coverImage, setCoverImage] = useState<string | null>(initialImage);
  const [logoUrl, setLogoUrl] = useState<string | null>(initialLogo.url ?? null);
  const [logoSize, setLogoSize] = useState(initialLogo.size ?? 80);
  const [saved, setSaved] = useState(false);

  const liveCoverConfig: CoverConfig = {
    eyebrow,
    heading,
    subheading,
    ctaText,
    overlayOpacity,
  };

  const liveLogoConfig: LogoConfig = {
    url: logoUrl,
    size: logoSize,
    align: "center",
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        draft_cover_config: liveCoverConfig as unknown as Json,
        draft_logo_config: liveLogoConfig as unknown as Json,
        draft_cover_image: coverImage,
      };
      const { data, error } = await supabase
        .from("user_events")
        .update(payload)
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

  const handleSave = () => {
    saveMutation.mutate();
  };

  const handleImageUpload = async (file: File): Promise<string | null> => {
    return uploadImage(file, "cover", eventId).then((r) => r?.url ?? null);
  };

  const handleLogoUpload = async (file: File): Promise<string | null> => {
    return uploadImage(file, "logo", eventId).then((r) => r?.url ?? null);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-dash-text">Cover Editor</h1>
          <p className="mt-1 text-sm text-dash-muted">
            Customise the cover page of your invitation website
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="text-sm text-green-600">✓ Saved</span>
          )}
          <Button onClick={handleSave} loading={saveMutation.isPending}>
            Save Changes
          </Button>
        </div>
      </div>

      <div className="h-[calc(100vh-220px)] min-h-[500px]">
        <SplitEditor
          editor={
            <div className="space-y-6">
              {/* Cover Image */}
              <ImageUpload
                label="Cover Background Image"
                value={coverImage}
                onChange={setCoverImage}
                onUpload={handleImageUpload}
              />

              <div>
                <label className="mb-1.5 block text-sm font-medium text-dash-text">
                  Overlay Opacity
                </label>
                <RangeInput
                  value={Math.round(overlayOpacity * 100)}
                  onChange={(v) => setOverlayOpacity(v / 100)}
                  min={0}
                  max={100}
                  step={5}
                />
              </div>

              {/* Typography Controls */}
              <div className="space-y-4 border-t border-dash-border pt-4">
                <TypographyControls
                  label="Eyebrow (Body)"
                  value={eyebrow}
                  onChange={setEyebrow}
                />
              </div>

              <div className="space-y-4 border-t border-dash-border pt-4">
                <TypographyControls
                  label="Title (Heading)"
                  value={heading}
                  onChange={setHeading}
                />
              </div>

              <div className="space-y-4 border-t border-dash-border pt-4">
                <TypographyControls
                  label="Subtitle (Subheading)"
                  value={subheading}
                  onChange={setSubheading}
                />
              </div>

              <div className="border-t border-dash-border pt-4">
                <Input
                  label="CTA Button Text"
                  value={ctaText}
                  onChange={(e) => setCtaText(e.target.value)}
                  placeholder="e.g. RSVP Now"
                />
              </div>

              {/* Logo */}
              <div className="space-y-4 border-t border-dash-border pt-4">
                <h3 className="text-sm font-semibold text-dash-text">Logo</h3>
                <ImageUpload
                  label="Logo Image"
                  value={logoUrl}
                  onChange={setLogoUrl}
                  onUpload={handleLogoUpload}
                />
                <RangeInput
                  label="Logo Size (px)"
                  value={logoSize}
                  onChange={setLogoSize}
                  min={24}
                  max={200}
                  step={4}
                />
              </div>
            </div>
          }
          preview={
            <CoverPreview
              event={event}
              theme={event.draft_theme ?? event.theme}
              coverConfig={liveCoverConfig}
              logoConfig={liveLogoConfig}
              coverImage={coverImage}
            />
          }
        />
      </div>
    </div>
  );
}
