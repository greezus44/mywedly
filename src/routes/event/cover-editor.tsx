import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type Json } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, ColorInput, RangeInput } from "../../components/ui";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { RichTextEditor } from "../../components/ui/RichTextEditor";
import { TypographyControls } from "../../components/ui/TypographyControls";
import { ButtonColourEditor } from "../../components/ui/ButtonColourEditor";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { CoverPreview, type CoverConfig } from "../../components/preview/PreviewRenderers";
import type { TypographyStyle } from "../../lib/typography";

interface EventContextValue { event: UserEvent; eventId: string; }

const defaultConfig: CoverConfig = { background: { image: null, color: "", position: "center", fit: "cover" }, overlayOpacity: 30, ctaText: "Enter", logo: null };

export function CoverEditor() {
  const { event, eventId } = useOutletContext<EventContextValue>();
  const queryClient = useQueryClient();
  const [config, setConfig] = useState<CoverConfig>(() => ((event.draft_cover_config ?? event.cover_config) as CoverConfig) ?? defaultConfig);

  useEffect(() => { setConfig(((event.draft_cover_config ?? event.cover_config) as CoverConfig) ?? defaultConfig); }, [event.draft_cover_config, event.cover_config]);

  const update = (patch: Partial<CoverConfig>) => setConfig((p) => ({ ...p, ...patch }));
  const updateBg = (patch: Partial<NonNullable<CoverConfig["background"]>>) => setConfig((p) => ({ ...p, background: { ...(p.background ?? {}), ...patch } }));

  const updateLogo = (patch: Partial<NonNullable<CoverConfig["logo"]>>) => setConfig((p) => ({ ...p, logo: { ...(p.logo ?? {}), ...patch } }));

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
          <>
          <div className="space-y-4 rounded-lg border border-dash-border bg-dash-surface p-4">
            <h3 className="text-sm font-semibold text-dash-text">Cover Page Logo</h3>
            <ImageUpload userId={event.creator_id} value={config.logo?.url ?? null} onChange={(url) => updateLogo({ url })} label="Logo Image" />
            <RangeInput label="Logo Size (height px)" value={config.logo?.size ?? 120} onChange={(v) => updateLogo({ size: v })} min={40} max={300} />
            <RangeInput label="Max Width (px)" value={config.logo?.maxWidth ?? 300} onChange={(v) => updateLogo({ maxWidth: v })} min={50} max={600} />
            <RangeInput label="Max Height (px)" value={config.logo?.maxHeight ?? 200} onChange={(v) => updateLogo({ maxHeight: v })} min={50} max={400} />
            <RangeInput label="Top Spacing (px)" value={config.logo?.marginTop ?? 0} onChange={(v) => updateLogo({ marginTop: v })} min={0} max={120} />
            <RangeInput label="Bottom Spacing (px)" value={config.logo?.marginBottom ?? 32} onChange={(v) => updateLogo({ marginBottom: v })} min={0} max={80} />
          </div>
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
            <Input label="Eyebrow (Bahasa Melayu)" value={config.eyebrowBm ?? ""} onChange={(e) => update({ eyebrowBm: e.target.value })} placeholder="Auto-translate if empty" />
            <TypographyControls label="Heading" value={(config.heading as TypographyStyle) ?? {}} onChange={(v) => update({ heading: v })} showText multiline />
            <Input label="Heading (Bahasa Melayu)" value={config.headingBm ?? ""} onChange={(e) => update({ headingBm: e.target.value })} placeholder="Auto-translate if empty" />
            <TypographyControls label="Subheading" value={(config.subheading as TypographyStyle) ?? {}} onChange={(v) => update({ subheading: v })} showText multiline />
            <Input label="Subheading (Bahasa Melayu)" value={config.subheadingBm ?? ""} onChange={(e) => update({ subheadingBm: e.target.value })} placeholder="Auto-translate if empty" />
            <div>
              <label className="mb-1 block text-xs font-medium text-dash-muted">Body Content</label>
              <RichTextEditor value={config.bodyHtml ?? ""} onChange={(html) => update({ bodyHtml: html })} />
            </div>
            <Input label="Button Text" value={config.ctaText ?? ""} onChange={(e) => update({ ctaText: e.target.value })} placeholder="Enter" />
            <Input label="Button Text (Bahasa Melayu)" value={config.ctaTextBm ?? ""} onChange={(e) => update({ ctaTextBm: e.target.value })} placeholder="Auto-translate if empty" />
            <ButtonColourEditor label="Button Colours" value={config.buttonColors ?? {}} onChange={(v) => update({ buttonColors: v })} />
          </div>
          </>
        }
        preview={<CoverPreview config={config} theme={event.draft_theme ?? event.theme} eventName={event.draft_name ?? event.name ?? undefined} />}
      />
    </div>
  );
}
