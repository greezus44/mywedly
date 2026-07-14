import { useState, useEffect } from "react";
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
  src?: string | null;
  size?: number;
  align?: "left" | "center" | "right";
}

interface CoverConfig {
  overlay?: number;
  layout?: string;
}

export function CoverEditor() {
  const { event, eventId } = useEventContext();
  const queryClient = useQueryClient();

  const logoConfig = (event.draft_logo_config as LogoConfig | null) ?? {};
  const coverConfig = (event.draft_cover_config as CoverConfig | null) ?? {};

  const [logoSrc, setLogoSrc] = useState<string | null>(logoConfig.src ?? null);
  const [logoSize, setLogoSize] = useState<number>(logoConfig.size ?? 120);
  const [logoAlign, setLogoAlign] = useState<"left" | "center" | "right">(logoConfig.align ?? "center");
  const [coverImage, setCoverImage] = useState<string | null>(event.draft_cover_image ?? null);
  const [overlay, setOverlay] = useState<number>(coverConfig.overlay ?? 0.3);
  const [savedMsg, setSavedMsg] = useState(false);

  useEffect(() => {
    const lc = (event.draft_logo_config as LogoConfig | null) ?? {};
    setLogoSrc(lc.src ?? null);
    setLogoSize(lc.size ?? 120);
    setLogoAlign(lc.align ?? "center");
    setCoverImage(event.draft_cover_image ?? null);
    const cc = (event.draft_cover_config as CoverConfig | null) ?? {};
    setOverlay(cc.overlay ?? 0.3);
  }, [event]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("user_events")
        .update({
          draft_logo_config: { src: logoSrc, size: logoSize, align: logoAlign } as unknown as Json,
          draft_cover_image: coverImage,
          draft_cover_config: { overlay, layout: "standard" } as unknown as Json,
        })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 2000);
    },
  });

  const previewEvent = {
    ...event,
    draft_cover_image: coverImage,
    draft_cover_config: { overlay, layout: "standard" },
    cover_image: coverImage,
    cover_config: { overlay, layout: "standard" },
  };

  const alignOptions: { value: "left" | "center" | "right"; label: string }[] = [
    { value: "left", label: "Left" },
    { value: "center", label: "Center" },
    { value: "right", label: "Right" },
  ];

  return (
    <SplitEditor
      editor={
        <div className="space-y-6">
          <div>
            <h2 className="mb-4 text-lg font-semibold text-dash-text">Cover Editor</h2>

            <div className="space-y-4">
              <FormField label="Cover Image">
                <ImageUpload
                  bucket="event-assets"
                  path={`events/${eventId}/cover`}
                  value={coverImage}
                  onChange={setCoverImage}
                />
              </FormField>

              <FormField label="Overlay Darkness">
                <RangeInput
                  value={overlay}
                  min={0}
                  max={0.8}
                  step={0.05}
                  onChange={setOverlay}
                />
                <p className="text-xs text-dash-muted">
                  Controls how dark the overlay is over the cover image (0 = none, 0.8 = very dark)
                </p>
              </FormField>
            </div>
          </div>

          <div className="border-t border-dash-border pt-6">
            <h3 className="mb-4 text-lg font-semibold text-dash-text">Logo</h3>

            <div className="space-y-4">
              <FormField label="Logo Image">
                <ImageUpload
                  bucket="event-assets"
                  path={`events/${eventId}/logo`}
                  value={logoSrc}
                  onChange={setLogoSrc}
                  maxWidth={500}
                  maxHeight={500}
                />
              </FormField>

              <FormField label={`Logo Size: ${logoSize}px`}>
                <RangeInput
                  value={logoSize}
                  min={40}
                  max={300}
                  step={5}
                  onChange={setLogoSize}
                />
              </FormField>

              <FormField label="Logo Alignment">
                <div className="flex gap-2">
                  {alignOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setLogoAlign(opt.value)}
                      className={cn(
                        "rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
                        logoAlign === opt.value
                          ? "border-dash-primary bg-dash-primary text-dash-primary-fg"
                          : "border-dash-border text-dash-text hover:bg-dash-bg",
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </FormField>
            </div>
          </div>

          <div className="flex items-center gap-3 border-t border-dash-border pt-4">
            <Button
              onClick={() => saveMutation.mutate()}
              loading={saveMutation.isPending}
            >
              Save Changes
            </Button>
            {savedMsg && <span className="text-sm text-green-600">Saved!</span>}
            {saveMutation.isError && (
              <span className="text-sm text-dash-danger">
                {saveMutation.error instanceof Error ? saveMutation.error.message : "Save failed"}
              </span>
            )}
          </div>
        </div>
      }
      preview={
        <div className="p-4">
          <div className="mb-4">
            {logoSrc && (
              <div
                className={cn(
                  "mb-4",
                  logoAlign === "left" && "text-left",
                  logoAlign === "center" && "text-center",
                  logoAlign === "right" && "text-right",
                )}
              >
                <img
                  src={logoSrc}
                  alt="Logo"
                  style={{ width: `${logoSize}px`, height: "auto", display: "inline-block" }}
                />
              </div>
            )}
          </div>
          <CoverPreview event={previewEvent} />
        </div>
      }
    />
  );
}
