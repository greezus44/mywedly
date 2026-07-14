import React, { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Json } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { CoverPreview } from "../../components/preview/PreviewRenderers";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { Button } from "../../components/ui/Button";
import { RangeInput, FormField } from "../../components/ui";
import { cn } from "../../lib/utils";

interface LogoConfig {
  url: string | null;
  size: number;
  align: "left" | "center" | "right";
}

interface CoverConfig {
  overlay: string;
  align: "left" | "center" | "right";
  position: string;
}

function parseLogoConfig(raw: Json | null | undefined): LogoConfig {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { url: null, size: 120, align: "center" };
  }
  const obj = raw as Record<string, unknown>;
  return {
    url: typeof obj.url === "string" ? obj.url : null,
    size: typeof obj.size === "number" ? obj.size : 120,
    align: (typeof obj.align === "string" ? obj.align : "center") as LogoConfig["align"],
  };
}

function parseCoverConfig(raw: Json | null | undefined): CoverConfig {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { overlay: "rgba(0,0,0,0.35)", align: "center", position: "center" };
  }
  const obj = raw as Record<string, unknown>;
  return {
    overlay: typeof obj.overlay === "string" ? obj.overlay : "rgba(0,0,0,0.35)",
    align: (typeof obj.align === "string" ? obj.align : "center") as CoverConfig["align"],
    position: typeof obj.position === "string" ? obj.position : "center",
  };
}

export const CoverEditor: React.FC = () => {
  const { event, eventId } = useEventContext();
  const queryClient = useQueryClient();

  const [logoConfig, setLogoConfig] = useState<LogoConfig>(() => parseLogoConfig(event.draft_logo_config));
  const [coverImage, setCoverImage] = useState<string | null>(event.draft_cover_image);
  const [coverConfig, setCoverConfig] = useState<CoverConfig>(() => parseCoverConfig(event.draft_cover_config));
  const [saved, setSaved] = useState(false);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("user_events")
        .update({
          draft_logo_config: logoConfig as unknown as Json,
          draft_cover_image: coverImage,
          draft_cover_config: coverConfig as unknown as Json,
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

  const handleSave = () => {
    saveMutation.mutate();
  };

  const alignButtons = [
    { value: "left" as const, label: "Left" },
    { value: "center" as const, label: "Center" },
    { value: "right" as const, label: "Right" },
  ];

  const previewContent = useMemo(
    () => (
      <div className="p-4">
        {logoConfig.url && (
          <div
            className="mb-4"
            style={{ textAlign: logoConfig.align }}
          >
            <img
              src={logoConfig.url}
              alt="Logo"
              style={{ width: `${logoConfig.size}px`, height: "auto", display: "inline-block" }}
            />
          </div>
        )}
        <CoverPreview
          coverImage={coverImage}
          coverConfig={coverConfig}
          eventName={event.draft_name}
          eventType={event.draft_event_type}
          eventDate={event.draft_event_date}
          eventTime={event.draft_event_time}
          venue={event.draft_venue}
        />
      </div>
    ),
    [logoConfig, coverImage, coverConfig, event],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dash-text">Cover Editor</h2>
          <p className="text-sm text-dash-muted">Customize your cover image and logo.</p>
        </div>
        <Button onClick={handleSave} loading={saveMutation.isPending} disabled={saveMutation.isPending}>
          {saved ? "Saved!" : "Save Changes"}
        </Button>
      </div>

      {saveMutation.isError && (
        <p className="text-sm text-dash-danger">
          Error: {saveMutation.error instanceof Error ? saveMutation.error.message : "Save failed"}
        </p>
      )}

      <SplitEditor
        editor={
          <div className="space-y-6">
            {/* Logo Section */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-dash-text">Logo</h3>
              <ImageUpload
                value={logoConfig.url}
                onChange={(url) => setLogoConfig((prev) => ({ ...prev, url }))}
                folder="logo"
                eventId={eventId}
                label="Upload logo"
                aspectRatio="square"
              />
              {logoConfig.url && (
                <div className="mt-4 space-y-4">
                  <RangeInput
                    label="Logo size"
                    value={logoConfig.size}
                    min={40}
                    max={300}
                    step={10}
                    onChange={(size) => setLogoConfig((prev) => ({ ...prev, size }))}
                    format={(v) => `${v}px`}
                  />
                  <FormField label="Logo alignment">
                    <div className="flex gap-2">
                      {alignButtons.map((btn) => (
                        <button
                          key={btn.value}
                          type="button"
                          onClick={() => setLogoConfig((prev) => ({ ...prev, align: btn.value }))}
                          className={cn(
                            "rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
                            logoConfig.align === btn.value
                              ? "border-dash-primary bg-dash-primary text-dash-primary-fg"
                              : "border-dash-border bg-dash-surface text-dash-text hover:bg-dash-bg",
                          )}
                        >
                          {btn.label}
                        </button>
                      ))}
                    </div>
                  </FormField>
                </div>
              )}
            </div>

            <hr className="border-dash-border" />

            {/* Cover Image Section */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-dash-text">Cover Image</h3>
              <ImageUpload
                value={coverImage}
                onChange={setCoverImage}
                folder="cover"
                eventId={eventId}
                label="Upload cover image"
                aspectRatio="wide"
              />
            </div>

            <hr className="border-dash-border" />

            {/* Cover Config */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-dash-text">Cover Settings</h3>
              <div className="space-y-4">
                <FormField label="Overlay color">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={coverConfig.overlay.startsWith("rgba") || coverConfig.overlay.startsWith("rgb") ? "#000000" : coverConfig.overlay}
                      onChange={(e) => setCoverConfig((prev) => ({ ...prev, overlay: e.target.value }))}
                      className="h-10 w-12 cursor-pointer rounded border border-dash-border bg-dash-surface p-1"
                    />
                    <input
                      type="text"
                      value={coverConfig.overlay}
                      onChange={(e) => setCoverConfig((prev) => ({ ...prev, overlay: e.target.value }))}
                      className="h-10 flex-1 rounded-md border border-dash-border bg-dash-surface px-3 text-sm text-dash-text"
                    />
                  </div>
                </FormField>
                <FormField label="Text alignment">
                  <div className="flex gap-2">
                    {alignButtons.map((btn) => (
                      <button
                        key={btn.value}
                        type="button"
                        onClick={() => setCoverConfig((prev) => ({ ...prev, align: btn.value }))}
                        className={cn(
                          "rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
                          coverConfig.align === btn.value
                            ? "border-dash-primary bg-dash-primary text-dash-primary-fg"
                            : "border-dash-border bg-dash-surface text-dash-text hover:bg-dash-bg",
                        )}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </FormField>
                <FormField label="Image position">
                  <select
                    value={coverConfig.position}
                    onChange={(e) => setCoverConfig((prev) => ({ ...prev, position: e.target.value }))}
                    className="h-10 w-full rounded-md border border-dash-border bg-dash-surface px-3 text-sm text-dash-text"
                  >
                    <option value="center">Center</option>
                    <option value="top">Top</option>
                    <option value="bottom">Bottom</option>
                    <option value="left">Left</option>
                    <option value="right">Right</option>
                  </select>
                </FormField>
              </div>
            </div>
          </div>
        }
        preview={previewContent}
        editorRatio={0.45}
      />
    </div>
  );
};
