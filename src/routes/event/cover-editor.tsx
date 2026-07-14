import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type Json } from "../../lib/supabase";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { CoverPreview, type CoverConfig, type LogoConfig } from "../../components/preview/PreviewRenderers";
import { TypographyControls } from "../../components/ui/TypographyControls";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { Button } from "../../components/ui/Button";
import { Card, RangeInput, ColorInput, LoadingSpinner } from "../../components/ui";
import type { TypographyStyle } from "../../lib/typography";
import type { EventContextValue } from "./event-layout";

const DEFAULT_COVER: CoverConfig = {
  eyebrow: { text: "", fontFamily: "'Cormorant Garamond', serif", fontSize: 14, fontWeight: 500, align: "center", color: "#ffffff" },
  heading: { text: "", fontFamily: "'Playfair Display', serif", fontSize: 48, fontWeight: 700, align: "center", color: "#ffffff" },
  subheading: { text: "", fontFamily: "'EB Garamond', serif", fontSize: 18, fontWeight: 400, align: "center", color: "#ffffff" },
  overlay: 0.5,
  overlayColor: "rgba(0,0,0,0.4)",
};

const DEFAULT_LOGO: LogoConfig = {
  image: null,
  width: 80,
  height: 80,
  borderRadius: "50%",
  position: "center",
  background: "transparent",
};

export function CoverEditor() {
  const { event, eventId } = useOutletContext<EventContextValue>();
  const queryClient = useQueryClient();
  const userId = event.creator_id;

  const [coverConfig, setCoverConfig] = useState<CoverConfig>(DEFAULT_COVER);
  const [logoConfig, setLogoConfig] = useState<LogoConfig>(DEFAULT_LOGO);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!loaded) {
      const draftCover = (event.draft_cover_config ?? event.cover_config) as CoverConfig | null;
      const draftLogo = (event.draft_logo_config ?? event.logo_config) as LogoConfig | null;
      const draftImage = event.draft_cover_image ?? event.cover_image;
      if (draftCover) setCoverConfig({ ...DEFAULT_COVER, ...draftCover });
      if (draftLogo) setLogoConfig({ ...DEFAULT_LOGO, ...draftLogo });
      setCoverImage(draftImage);
      setLoaded(true);
    }
  }, [event, loaded]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("user_events")
        .update({
          draft_cover_config: coverConfig as unknown as Json,
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

  function updateCover<K extends keyof CoverConfig>(key: K, val: CoverConfig[K]) {
    setCoverConfig((prev) => ({ ...prev, [key]: val }));
  }

  function updateLogo<K extends keyof LogoConfig>(key: K, val: LogoConfig[K]) {
    setLogoConfig((prev) => ({ ...prev, [key]: val }));
  }

  if (!loaded) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-dash-text">Cover Editor</h2>
        <Button
          onClick={() => saveMutation.mutate()}
          loading={saveMutation.isPending}
          disabled={saveMutation.isPending}
        >
          Save Changes
        </Button>
      </div>

      {saveMutation.isError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-dash-danger">
          {saveMutation.error?.message ?? "Failed to save"}
        </div>
      )}
      {saveMutation.isSuccess && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Saved successfully!
        </div>
      )}

      <div className="h-[calc(100vh-280px)] min-h-[500px]">
        <SplitEditor
          editorRatio={0.45}
          editor={
            <div className="space-y-6">
              <Card className="p-4">
                <h3 className="mb-3 text-sm font-semibold text-dash-text">Cover Image</h3>
                <ImageUpload
                  value={coverImage}
                  onChange={setCoverImage}
                  userId={userId}
                  label="Background Image"
                  aspectRatio="16/9"
                />
                <div className="mt-3">
                  <RangeInput
                    label="Overlay Opacity"
                    value={Math.round((coverConfig.overlay ?? 0.5) * 100)}
                    onChange={(v) => updateCover("overlay", v / 100)}
                    min={0}
                    max={100}
                    step={5}
                  />
                </div>
                <div className="mt-3">
                  <ColorInput
                    label="Overlay Colour"
                    value={coverConfig.overlayColor ?? "rgba(0,0,0,0.4)"}
                    onChange={(v) => updateCover("overlayColor", v)}
                  />
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="mb-3 text-sm font-semibold text-dash-text">Logo</h3>
                <ImageUpload
                  value={logoConfig.image ?? null}
                  onChange={(v) => updateLogo("image", v)}
                  userId={userId}
                  label="Logo Image"
                  aspectRatio="1/1"
                />
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-dash-text">Width (px)</label>
                    <input
                      type="number"
                      value={logoConfig.width ?? 80}
                      onChange={(e) => updateLogo("width", Number(e.target.value))}
                      className="w-full rounded-md border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-dash-text">Height (px)</label>
                    <input
                      type="number"
                      value={logoConfig.height ?? 80}
                      onChange={(e) => updateLogo("height", Number(e.target.value))}
                      className="w-full rounded-md border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text"
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="mb-1.5 block text-sm font-medium text-dash-text">Border Radius</label>
                  <select
                    value={logoConfig.borderRadius ?? "50%"}
                    onChange={(e) => updateLogo("borderRadius", e.target.value)}
                    className="w-full rounded-md border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text"
                  >
                    <option value="0">None</option>
                    <option value="25%">Rounded</option>
                    <option value="50%">Circle</option>
                  </select>
                </div>
              </Card>

              <Card className="p-4">
                <TypographyControls
                  label="Eyebrow"
                  value={(coverConfig.eyebrow ?? {}) as TypographyStyle}
                  onChange={(v) => updateCover("eyebrow", v)}
                />
              </Card>

              <Card className="p-4">
                <TypographyControls
                  label="Title"
                  value={(coverConfig.heading ?? {}) as TypographyStyle}
                  onChange={(v) => updateCover("heading", v)}
                />
              </Card>

              <Card className="p-4">
                <TypographyControls
                  label="Subtitle"
                  value={(coverConfig.subheading ?? {}) as TypographyStyle}
                  onChange={(v) => updateCover("subheading", v)}
                />
              </Card>
            </div>
          }
          preview={
            <div className="p-4">
              <CoverPreview
                event={event}
                theme={event.draft_theme ?? event.theme}
                coverConfig={coverConfig}
                logoConfig={logoConfig}
                coverImage={coverImage}
              />
            </div>
          }
        />
      </div>
    </div>
  );
}

export default CoverEditor;
