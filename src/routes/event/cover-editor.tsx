import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input, RangeInput, ColorInput, Card } from "../../components/ui";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { RichTextEditor } from "../../components/ui/RichTextEditor";
import { TypographyControls } from "../../components/ui/TypographyControls";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { CoverPreview, type CoverConfig, type LogoConfig } from "../../components/preview/PreviewRenderers";
import type { TypographyStyle } from "../../lib/typography";

interface EventContextValue { event: UserEvent; eventId: string; }

export function CoverEditor() {
  const { event, eventId } = useOutletContext<EventContextValue>();
  const queryClient = useQueryClient();

  const [config, setConfig] = useState<CoverConfig>(() => (event.draft_cover_config ?? event.cover_config ?? {}) as CoverConfig);
  const [logo, setLogo] = useState<LogoConfig>(() => (event.draft_logo_config ?? event.logo_config ?? {}) as LogoConfig);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setConfig((event.draft_cover_config ?? event.cover_config ?? {}) as CoverConfig);
    setLogo((event.draft_logo_config ?? event.logo_config ?? {}) as LogoConfig);
  }, [event]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("user_events")
        .update({ draft_cover_config: config, draft_logo_config: logo })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const update = (patch: Partial<CoverConfig>) => setConfig((p) => ({ ...p, ...patch }));
  const updateBg = (patch: Partial<NonNullable<CoverConfig["background"]>>) =>
    setConfig((p) => ({ ...p, background: { ...p.background, ...patch } }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-dash-text">Cover Page</h2>
        <div className="flex items-center gap-3">
          {saved && <span className="text-sm text-green-600">Saved!</span>}
          <Button size="sm" onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>Save</Button>
        </div>
      </div>

      <SplitEditor
        editor={
          <div className="space-y-6">
            <Card>
              <h3 className="mb-4 text-sm font-semibold text-dash-text">Background</h3>
              <div className="space-y-4">
                <ImageUpload
                  label="Background Image"
                  value={config.background?.image ?? null}
                  onChange={(url) => updateBg({ image: url })}
                  userId={event.creator_id}
                />
                <ColorInput
                  label="Background Color (fallback)"
                  value={config.background?.color ?? "#fffbeb"}
                  onChange={(v) => updateBg({ color: v })}
                />
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-dash-text">Background Fit</label>
                  <select
                    value={config.background?.fit ?? "cover"}
                    onChange={(e) => updateBg({ fit: e.target.value })}
                    className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-dash-text focus:outline-none"
                  >
                    <option value="cover">Cover</option>
                    <option value="contain">Contain</option>
                    <option value="fill">Fill</option>
                  </select>
                </div>
                <RangeInput
                  label="Overlay Opacity (%)"
                  value={config.overlayOpacity ?? 30}
                  min={0}
                  max={90}
                  onChange={(v) => update({ overlayOpacity: v })}
                />
              </div>
            </Card>

            <Card>
              <h3 className="mb-4 text-sm font-semibold text-dash-text">Logo</h3>
              <ImageUpload
                label="Logo Image"
                value={logo.url ?? null}
                onChange={(url) => setLogo((p) => ({ ...p, url }))}
                userId={event.creator_id}
              />
              <div className="mt-4">
                <RangeInput
                  label="Logo Size (px)"
                  value={logo.size ?? 120}
                  min={40}
                  max={300}
                  onChange={(v) => setLogo((p) => ({ ...p, size: v }))}
                />
              </div>
            </Card>

            <Card>
              <h3 className="mb-4 text-sm font-semibold text-dash-text">Eyebrow Text</h3>
              <TypographyControls
                value={(config.eyebrow as TypographyStyle) ?? { text: "" }}
                onChange={(v) => update({ eyebrow: v })}
                showText
              />
            </Card>

            <Card>
              <h3 className="mb-4 text-sm font-semibold text-dash-text">Heading</h3>
              <TypographyControls
                value={(config.heading as TypographyStyle) ?? { text: event.draft_name ?? "" }}
                onChange={(v) => update({ heading: v })}
                showText
              />
            </Card>

            <Card>
              <h3 className="mb-4 text-sm font-semibold text-dash-text">Subheading</h3>
              <TypographyControls
                value={(config.subheading as TypographyStyle) ?? { text: "" }}
                onChange={(v) => update({ subheading: v })}
                showText
              />
            </Card>

            <Card>
              <h3 className="mb-4 text-sm font-semibold text-dash-text">Body Content</h3>
              <RichTextEditor
                value={config.bodyHtml ?? ""}
                onChange={(html) => update({ bodyHtml: html })}
                placeholder="Add additional content..."
              />
            </Card>

            <Card>
              <Input
                label="Button Text"
                value={config.ctaText ?? ""}
                onChange={(e) => update({ ctaText: e.target.value })}
                placeholder="Enter"
              />
            </Card>
          </div>
        }
        preview={
          <CoverPreview config={config} eventName={event.draft_name ?? undefined} logo={logo} />
        }
      />
    </div>
  );
}
