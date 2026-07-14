import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type Json } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, ColorInput, RangeInput } from "../../components/ui";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { RichTextEditor } from "../../components/ui/RichTextEditor";
import { TypographyControls } from "../../components/ui/TypographyControls";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { CoverPreview, type CoverConfig } from "../../components/preview/PreviewRenderers";
import type { TypographyStyle } from "../../lib/typography";

interface EventContextValue { event: UserEvent; eventId: string; }

const defaultConfig: CoverConfig = { background: { image: null, color: "", position: "center", fit: "cover" }, overlayOpacity: 30, ctaText: "Enter" };

export function CoverEditor() {
  const { event, eventId } = useOutletContext<EventContextValue>();
  const queryClient = useQueryClient();
  const [config, setConfig] = useState<CoverConfig>(() => ((event.draft_cover_config ?? event.cover_config) as CoverConfig) ?? defaultConfig);

  useEffect(() => { setConfig(((event.draft_cover_config ?? event.cover_config) as CoverConfig) ?? defaultConfig); }, [event.draft_cover_config, event.cover_config]);

  const update = (patch: Partial<CoverConfig>) => setConfig((p) => ({ ...p, ...patch }));
  const updateBg = (patch: Partial<NonNullable<CoverConfig["background"]>>) => setConfig((p) => ({ ...p, background: { ...(p.background ?? {}), ...patch } }));

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("user_events").update({ draft_cover_config: config as unknown as Json, draft_cover_image: config.background?.image ?? null }).eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["event", eventId] }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-dash-text">Cover</h2>
        <Button size="sm" onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>Save</Button>
      </div>
      {saveMutation.isError && <p className="text-sm text-dash-danger">{saveMutation.error instanceof Error ? saveMutation.error.message : "Save failed"}</p>}
      {saveMutation.isSuccess && <p className="text-sm text-green-600">Saved</p>}
      <SplitEditor
        editor={
          <div className="space-y-4 rounded-lg border border-dash-border bg-dash-surface p-4">
            <ImageUpload userId={event.creator_id} value={config.background?.image ?? null} onChange={(url) => updateBg({ image: url })} label="Background Image" />
            <ColorInput value={config.background?.color ?? ""} onChange={(v) => updateBg({ color: v })} />
            <div>
              <label className="mb-1 block text-xs font-medium text-dash-muted">Background Fit</label>
              <select value={config.background?.fit ?? "cover"} onChange={(e) => updateBg({ fit: e.target.value })} className="w-full rounded-lg border border-dash-border bg-dash-bg px-3 py-2 text-sm text-dash-text">
                <option value="cover">Cover</option><option value="contain">Contain</option><option value="fill">Fill</option>
              </select>
            </div>
            <RangeInput label="Overlay Opacity" value={config.overlayOpacity ?? 30} onChange={(v) => update({ overlayOpacity: v })} min={0} max={100} />
            <TypographyControls label="Eyebrow" value={(config.eyebrow as TypographyStyle) ?? {}} onChange={(v) => update({ eyebrow: v })} showText />
            <TypographyControls label="Heading" value={(config.heading as TypographyStyle) ?? {}} onChange={(v) => update({ heading: v })} showText />
            <TypographyControls label="Subheading" value={(config.subheading as TypographyStyle) ?? {}} onChange={(v) => update({ subheading: v })} showText />
            <div>
              <label className="mb-1 block text-xs font-medium text-dash-muted">Body Content</label>
              <RichTextEditor value={config.bodyHtml ?? ""} onChange={(html) => update({ bodyHtml: html })} />
            </div>
            <Input label="Button Text" value={config.ctaText ?? ""} onChange={(e) => update({ ctaText: e.target.value })} placeholder="Enter" />
          </div>
        }
        preview={<CoverPreview config={config} theme={event.draft_theme ?? event.theme} eventName={event.draft_name ?? event.name ?? undefined} />}
      />
    </div>
  );
}
