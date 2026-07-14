import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Json } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { CoverPreview, type CoverConfig, type LogoConfig } from "../../components/preview/PreviewRenderers";
import { TypographyControls } from "../../components/ui/TypographyControls";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { Button } from "../../components/ui/Button";
import { Input, Select } from "../../components/ui/Input";
import { ColorInput, RangeInput } from "../../components/ui";
import type { TypographyStyle } from "../../lib/typography";

export function CoverEditor() {
  const { event, eventId } = useEventContext();
  const queryClient = useQueryClient();

  const initialConfig = (event.draft_cover_config ?? {}) as CoverConfig;
  const initialLogo = (event.draft_logo_config ?? {}) as LogoConfig;

  const [coverImage, setCoverImage] = useState(event.draft_cover_image ?? "");
  const [heading, setHeading] = useState<TypographyStyle>(
    (initialConfig.heading ?? {}) as TypographyStyle
  );
  const [subheading, setSubheading] = useState<TypographyStyle>(
    (initialConfig.subheading ?? {}) as TypographyStyle
  );
  const [overlayColor, setOverlayColor] = useState(initialConfig.overlayColor ?? "rgba(0,0,0,0.35)");
  const [overlayOpacity, setOverlayOpacity] = useState(initialConfig.overlayOpacity ?? 35);
  const [layout, setLayout] = useState<CoverConfig["layout"]>(initialConfig.layout ?? "centered");
  const [showDate, setShowDate] = useState(initialConfig.showDate ?? true);
  const [showVenue, setShowVenue] = useState(initialConfig.showVenue ?? true);
  const [logo, setLogo] = useState<LogoConfig>(initialLogo);

  const coverConfig: CoverConfig = {
    layout,
    overlayColor,
    overlayOpacity: overlayOpacity / 100,
    showDate,
    showVenue,
    heading,
    subheading,
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("events")
        .update({
          draft_cover_config: coverConfig as unknown as Json,
          draft_cover_image: coverImage,
          draft_logo_config: logo as unknown as Json,
        })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
    },
  });

  const editor = (
    <div className="space-y-6 p-4">
      <div>
        <h2 className="mb-3 text-lg font-semibold text-dash-text">Cover Image</h2>
        <ImageUpload
          userId={event.creator_id}
          value={coverImage}
          onChange={setCoverImage}
          label="Background image"
          aspectRatio="wide"
        />
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-dash-text">Logo</h2>
        <ImageUpload
          userId={event.creator_id}
          value={logo.url ?? ""}
          onChange={(url) => setLogo({ ...logo, url })}
          label="Cover logo"
          aspectRatio="auto"
        />
        {logo.url && (
          <div className="mt-3 space-y-3">
            <Select
              label="Logo size"
              value={String(logo.size ?? 120)}
              onChange={(e) => setLogo({ ...logo, size: Number(e.target.value) })}
            >
              <option value="80">Small (80px)</option>
              <option value="120">Medium (120px)</option>
              <option value="160">Large (160px)</option>
              <option value="200">Extra Large (200px)</option>
            </Select>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Top spacing (px)"
                type="number"
                value={logo.marginTop ?? 0}
                onChange={(e) => setLogo({ ...logo, marginTop: Number(e.target.value) })}
              />
              <Input
                label="Bottom spacing (px)"
                type="number"
                value={logo.marginBottom ?? 16}
                onChange={(e) => setLogo({ ...logo, marginBottom: Number(e.target.value) })}
              />
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setLogo({})}
            >
              Remove Logo
            </Button>
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-dash-text">Layout</h2>
        <Select
          label="Cover layout"
          value={layout}
          onChange={(e) => setLayout(e.target.value as CoverConfig["layout"])}
        >
          <option value="centered">Centered</option>
          <option value="split">Split</option>
          <option value="minimal">Minimal</option>
        </Select>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-dash-text">Overlay</h2>
        <ColorInput label="Overlay colour" value={overlayColor} onChange={setOverlayColor} />
        <RangeInput
          label="Overlay opacity"
          value={overlayOpacity}
          onChange={setOverlayOpacity}
          min={0}
          max={100}
          step={5}
          unit="%"
          className="mt-3"
        />
      </div>

      <TypographyControls
        label="Title"
        value={heading}
        onChange={setHeading}
        showText
      />

      <TypographyControls
        label="Subtitle"
        value={subheading}
        onChange={setSubheading}
        showText
      />

      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-sm text-dash-text">
          <input
            type="checkbox"
            checked={showDate}
            onChange={(e) => setShowDate(e.target.checked)}
            className="rounded"
          />
          Show date
        </label>
        <label className="flex items-center gap-2 text-sm text-dash-text">
          <input
            type="checkbox"
            checked={showVenue}
            onChange={(e) => setShowVenue(e.target.checked)}
            className="rounded"
          />
          Show venue
        </label>
      </div>

      <Button
        onClick={() => saveMutation.mutate()}
        loading={saveMutation.isPending}
        disabled={saveMutation.isPending}
        className="w-full"
      >
        Save Changes
      </Button>
      {saveMutation.isSuccess && (
        <p className="text-sm text-green-600">Saved successfully!</p>
      )}
      {saveMutation.isError && (
        <p className="text-sm text-dash-danger">
          {saveMutation.error instanceof Error ? saveMutation.error.message : "Save failed."}
        </p>
      )}
    </div>
  );

  const preview = (
    <div className="bg-dash-bg p-4">
      <div className="overflow-hidden rounded-lg border border-dash-border shadow-sm">
        <CoverPreview
          coverImage={coverImage}
          coverConfig={coverConfig as unknown as Json}
          name={event.draft_name || event.name}
          theme={event.draft_theme}
          logoConfig={logo as unknown as Json}
        />
      </div>
    </div>
  );

  return (
    <div className="h-[calc(100vh-10rem)]">
      <SplitEditor editor={editor} preview={preview} />
    </div>
  );
}
