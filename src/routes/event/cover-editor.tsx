import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Json, type UserEvent } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { CoverPreview, type CoverConfig, type LogoConfig } from "../../components/preview/PreviewRenderers";
import { TypographyControls } from "../../components/ui/TypographyControls";
import { Button } from "../../components/ui/Button";
import { Card, Input, RangeInput } from "../../components/ui";
import { ImageUpload } from "../../components/ui/ImageUpload";
import type { TypographyStyle } from "../../lib/typography";

export function CoverEditor() {
  const { event, eventId } = useEventContext();
  const queryClient = useQueryClient();

  const [coverConfig, setCoverConfig] = useState<CoverConfig>(
    (event.draft_cover_config ?? {}) as CoverConfig,
  );
  const [logoConfig, setLogoConfig] = useState<LogoConfig>(
    (event.draft_logo_config ?? {}) as LogoConfig,
  );
  const [coverImage, setCoverImage] = useState<string | null>(
    event.draft_cover_image ?? null,
  );

  // Ensure typography fields are TypographyStyle objects
  useEffect(() => {
    setCoverConfig((prev) => ({
      ...prev,
      eyebrow:
        typeof prev.eyebrow === "string"
          ? { text: prev.eyebrow }
          : (prev.eyebrow ?? { text: "" }),
      heading:
        typeof prev.heading === "string"
          ? { text: prev.heading }
          : (prev.heading ?? { text: "" }),
      subheading:
        typeof prev.subheading === "string"
          ? { text: prev.subheading }
          : (prev.subheading ?? { text: "" }),
    }));
  }, []);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("user_events")
        .update({
          draft_cover_config: coverConfig as unknown as Json,
          draft_logo_config: logoConfig as unknown as Json,
          draft_cover_image: coverImage,
          updated_at: new Date().toISOString(),
        })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
    },
  });

  // Helper to update a typography field
  const updateField = (
    field: "eyebrow" | "heading" | "subheading",
    value: TypographyStyle,
  ) => {
    setCoverConfig((prev) => ({ ...prev, [field]: value }));
  };

  // The editor panel
  const editor = (
    <div className="space-y-6">
      {/* Logo section */}
      <Card>
        <h3 className="text-sm font-medium text-dash-text mb-4">Logo</h3>
        <ImageUpload
          label="Logo Image"
          value={logoConfig.url ?? null}
          onChange={(url) => setLogoConfig((prev) => ({ ...prev, url }))}
          bucket="event-assets"
          pathPrefix={`events/${eventId}/logo`}
        />
        <div className="mt-4 space-y-4">
          <RangeInput
            label="Logo Size"
            value={logoConfig.size ?? 80}
            onChange={(v) => setLogoConfig((prev) => ({ ...prev, size: v }))}
            min={32}
            max={200}
            step={4}
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-dash-text">
              Logo Alignment
            </label>
            <div className="flex gap-1">
              {[
                { label: "Left", value: "left" },
                { label: "Centre", value: "center" },
                { label: "Right", value: "right" },
              ].map((a) => (
                <button
                  key={a.value}
                  type="button"
                  onClick={() => setLogoConfig((prev) => ({ ...prev, align: a.value }))}
                  className={`flex-1 rounded-md border px-2 py-1.5 text-xs transition-colors ${
                    (logoConfig.align ?? "center") === a.value
                      ? "border-dash-primary bg-dash-primary/10 text-dash-primary"
                      : "border-dash-border text-dash-muted hover:bg-dash-bg"
                  }`}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Cover Image section */}
      <Card>
        <h3 className="text-sm font-medium text-dash-text mb-4">Background</h3>
        <ImageUpload
          label="Cover Image"
          value={coverImage}
          onChange={(url) => setCoverImage(url)}
          bucket="event-assets"
          pathPrefix={`events/${eventId}/cover`}
        />
        <div className="mt-4">
          <RangeInput
            label="Overlay Opacity"
            value={coverConfig.overlayOpacity ?? 0.4}
            onChange={(v) =>
              setCoverConfig((prev) => ({ ...prev, overlayOpacity: v }))
            }
            min={0}
            max={0.9}
            step={0.05}
          />
        </div>
      </Card>

      {/* Typography: Title */}
      <Card>
        <h3 className="text-sm font-medium text-dash-text mb-4">Title</h3>
        <TypographyControls
          label="Title"
          value={(coverConfig.heading as TypographyStyle) ?? { text: "" }}
          onChange={(v) => updateField("heading", v)}
        />
      </Card>

      {/* Typography: Subtitle */}
      <Card>
        <h3 className="text-sm font-medium text-dash-text mb-4">Subtitle</h3>
        <TypographyControls
          label="Subtitle"
          value={(coverConfig.subheading as TypographyStyle) ?? { text: "" }}
          onChange={(v) => updateField("subheading", v)}
        />
      </Card>

      {/* Typography: Eyebrow / Body */}
      <Card>
        <h3 className="text-sm font-medium text-dash-text mb-4">Eyebrow / Body</h3>
        <TypographyControls
          label="Eyebrow Text"
          value={(coverConfig.eyebrow as TypographyStyle) ?? { text: "" }}
          onChange={(v) => updateField("eyebrow", v)}
        />
      </Card>

      {/* CTA text */}
      <Card>
        <h3 className="text-sm font-medium text-dash-text mb-4">Button</h3>
        <Input
          label="Button Text"
          value={coverConfig.ctaText ?? ""}
          onChange={(e) =>
            setCoverConfig((prev) => ({ ...prev, ctaText: e.target.value }))
          }
          placeholder="View Invitation"
        />
      </Card>

      {/* Save button + feedback */}
      <div className="space-y-2">
        {saveMutation.isError && (
          <p className="text-sm text-dash-danger">
            Error: {(saveMutation.error as Error)?.message}
          </p>
        )}
        {saveMutation.isSuccess && (
          <p className="text-sm text-green-600">Changes saved successfully!</p>
        )}
        <Button
          onClick={() => saveMutation.mutate()}
          loading={saveMutation.isPending}
          className="w-full"
        >
          Save Changes
        </Button>
      </div>
    </div>
  );

  // The preview panel — passes LIVE state to CoverPreview
  const preview = (
    <CoverPreview
      event={event}
      coverConfig={coverConfig}
      logoConfig={logoConfig}
      coverImage={coverImage}
    />
  );

  return (
    <div className="h-[calc(100vh-8rem)]">
      <SplitEditor
        editor={editor}
        preview={preview}
        previewClassName="overflow-hidden"
      />
    </div>
  );
}
