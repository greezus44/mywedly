import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Json } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { CoverPreview, type CoverConfig, type LogoConfig } from "../../components/preview/PreviewRenderers";
import { EventThemeProvider } from "../../lib/theme-context";
import { TypographyControls } from "../../components/ui/TypographyControls";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { Button } from "../../components/ui/Button";
import { Input, ColorInput, RangeInput, Toggle, LoadingSpinner, FormField } from "../../components/ui";
import { extractPathFromUrl, removeImage } from "../../lib/upload";
import type { TypographyStyle } from "../../lib/typography";

const DEFAULT_TITLE: TypographyStyle = { text: "", fontFamily: "Georgia, serif", fontSize: 48, fontWeight: 700, color: "#ffffff", align: "center" };
const DEFAULT_SUBTITLE: TypographyStyle = { text: "", fontFamily: "Georgia, serif", fontSize: 20, fontWeight: 400, color: "#ffffff", align: "center" };

export function CoverEditor() {
  const { event, eventId } = useEventContext();
  const queryClient = useQueryClient();

  const [coverImage, setCoverImage] = useState<string | null>(event.draft_cover_image ?? event.cover_image ?? null);
  const [config, setConfig] = useState<CoverConfig>(
    (event.draft_cover_config as CoverConfig | null) ?? (event.cover_config as CoverConfig | null) ?? {}
  );
  const [logoConfig, setLogoConfig] = useState<LogoConfig>(
    (event.draft_logo_config as LogoConfig | null) ?? (event.logo_config as LogoConfig | null) ?? {}
  );
  const [userId, setUserId] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (mounted) setUserId(user?.id ?? null);
    });
    return () => { mounted = false; };
  }, []);

  function updateConfig<K extends keyof CoverConfig>(key: K, val: CoverConfig[K]) {
    setConfig((prev) => ({ ...prev, [key]: val }));
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("user_events")
        .update({
          draft_cover_image: coverImage,
          draft_cover_config: config as unknown as Json,
          draft_logo_config: logoConfig as unknown as Json,
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

  const handleImageChange = (url: string) => {
    setCoverImage(url);
  };

  const handleImageRemove = async () => {
    if (coverImage) {
      const path = extractPathFromUrl(coverImage);
      if (path) await removeImage(path);
    }
    setCoverImage(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dash-text">Cover Editor</h2>
          <p className="text-sm text-dash-muted">Design the first thing your guests see.</p>
        </div>
        <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
          {savedMsg ? "Saved!" : "Save Changes"}
        </Button>
      </div>

      {saveMutation.isError && (
        <p className="text-sm text-dash-danger">
          {saveMutation.error instanceof Error ? saveMutation.error.message : "Failed to save"}
        </p>
      )}

      <SplitEditor
        editorRatio={5}
        editor={
          <div className="space-y-6">
            {/* Cover Image */}
            <FormField label="Cover Image">
              <ImageUpload
                userId={userId ?? ""}
                value={coverImage ?? undefined}
                onChange={(url) => handleImageChange(url)}
                onRemove={handleImageRemove}
                aspectRatio="cover"
              />
            </FormField>

            {/* Layout */}
            <FormField label="Layout">
              <select
                value={config.layout ?? "full"}
                onChange={(e) => updateConfig("layout", e.target.value as CoverConfig["layout"])}
                className="h-10 w-full rounded-md border border-dash-border bg-dash-surface px-3 text-sm text-dash-text"
              >
                <option value="full">Full Screen</option>
                <option value="split">Split</option>
                <option value="minimal">Minimal</option>
              </select>
            </FormField>

            <RangeInput
              label="Overlay Opacity"
              min={0}
              max={0.9}
              step={0.05}
              value={config.overlay ?? 0.4}
              onChange={(e) => updateConfig("overlay", parseFloat(e.target.value))}
            />

            <div className="space-y-2">
              <Toggle label="Show Date" checked={config.showDate ?? true} onChange={(v) => updateConfig("showDate", v)} />
              <Toggle label="Show Venue" checked={config.showVenue ?? true} onChange={(v) => updateConfig("showVenue", v)} />
              <Toggle label="Show Countdown" checked={config.showCountdown ?? false} onChange={(v) => updateConfig("showCountdown", v)} />
            </div>

            <div className="border-t border-dash-border pt-4">
              <h3 className="mb-3 text-sm font-semibold text-dash-text">Title Typography</h3>
              <TypographyControls
                value={(config.title as TypographyStyle) ?? DEFAULT_TITLE}
                onChange={(v) => updateConfig("title", v as unknown as Json)}
                showText
              />
            </div>

            <div className="border-t border-dash-border pt-4">
              <h3 className="mb-3 text-sm font-semibold text-dash-text">Subtitle Typography</h3>
              <TypographyControls
                value={(config.subtitle as TypographyStyle) ?? DEFAULT_SUBTITLE}
                onChange={(v) => updateConfig("subtitle", v as unknown as Json)}
                showText
              />
            </div>
          </div>
        }
        preview={
          <EventThemeProvider theme={event.draft_theme ?? event.theme}>
            <CoverPreview
              coverImage={coverImage}
              config={config}
              eventName={event.draft_name || event.name || "Our Wedding"}
              eventDate={event.draft_event_date ?? event.event_date}
              eventTime={event.draft_event_time ?? event.event_time}
              venue={event.draft_venue ?? event.venue}
            />
          </EventThemeProvider>
        }
        previewHeader={<span className="text-sm font-medium text-dash-text">Live Preview</span>}
      />
    </div>
  );
}
