import { useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { CoverPreview, type CoverConfig, type LogoConfig } from "../../components/preview/PreviewRenderers";
import { TypographyControls } from "../../components/ui/TypographyControls";
import { RichTextEditor } from "../../components/ui/RichTextEditor";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { ColorInput, RangeInput, Button } from "../../components/ui";
import { useEventTheme } from "../../lib/theme-context";
import type { TypographyStyle } from "../../lib/typography";

interface EventContextValue { event: UserEvent; eventId: string; }

export function CoverEditor() {
  const { event, eventId } = useOutletContext<EventContextValue>();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { theme } = useEventTheme();
  const userId = event.creator_id;

  const [config, setConfig] = useState<CoverConfig>(() => (event.draft_cover_config ?? event.cover_config ?? {}) as CoverConfig);
  const [logoConfig, setLogoConfig] = useState<LogoConfig>(() => (event.draft_logo_config ?? event.logo_config ?? {}) as LogoConfig);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const updateConfig = (patch: Partial<CoverConfig>) => setConfig((p) => ({ ...p, ...patch }));
  const updateBg = (patch: Partial<NonNullable<CoverConfig["background"]>>) => setConfig((p) => ({ ...p, background: { ...p.background, ...patch } }));
  const updateLogo = (patch: Partial<LogoConfig>) => setLogoConfig((p) => ({ ...p, ...patch }));

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("user_events")
        .update({ draft_cover_config: config as unknown as Record<string, unknown>, draft_logo_config: logoConfig as unknown as Record<string, unknown> })
        .eq("id", eventId);
      if (error) throw error;
    },
    onMutate: () => { setSaving(true); setSavedMsg(null); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      setSaving(false);
      setSavedMsg("Saved!");
      setTimeout(() => setSavedMsg(null), 2000);
    },
    onError: (e) => { setSaving(false); setSavedMsg(e instanceof Error ? e.message : "Failed to save"); },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-dash-text">Cover Page</h2>
        <div className="flex items-center gap-3">
          {savedMsg && <span className="text-sm text-dash-muted">{savedMsg}</span>}
          <Button size="sm" onClick={() => saveMutation.mutate()} loading={saving}>Save</Button>
        </div>
      </div>
      <SplitEditor
        editor={
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-dash-text">Background Image</label>
              <ImageUpload value={config.background?.image ?? ""} onChange={(url) => updateBg({ image: url })} userId={userId} />
            </div>
            {!config.background?.image && (
              <ColorInput label="Background Color" value={config.background?.color ?? theme.colors.bg} onChange={(v) => updateBg({ color: v })} />
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-dash-text">Background Fit</label>
                <select value={config.background?.fit ?? "cover"} onChange={(e) => updateBg({ fit: e.target.value })} className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text focus:border-dash-primary focus:outline-none">
                  <option value="cover">Cover</option>
                  <option value="contain">Contain</option>
                  <option value="fill">Fill</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-dash-text">Background Position</label>
                <select value={config.background?.position ?? "center"} onChange={(e) => updateBg({ position: e.target.value })} className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text focus:border-dash-primary focus:outline-none">
                  <option value="center">Center</option>
                  <option value="top">Top</option>
                  <option value="bottom">Bottom</option>
                </select>
              </div>
            </div>
            <RangeInput label="Overlay Opacity" value={typeof config.overlayOpacity === "number" ? config.overlayOpacity : 30} min={0} max={80} onChange={(v) => updateConfig({ overlayOpacity: v })} unit="%" />
            <TypographyControls label="Eyebrow Text" value={config.eyebrow ?? {}} onChange={(v) => updateConfig({ eyebrow: v })} showText />
            <TypographyControls label="Heading" value={config.heading ?? {}} onChange={(v) => updateConfig({ heading: v })} showText />
            <TypographyControls label="Subheading" value={config.subheading ?? {}} onChange={(v) => updateConfig({ subheading: v })} showText />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-dash-text">Body Content</label>
              <RichTextEditor value={config.bodyHtml ?? ""} onChange={(html) => updateConfig({ bodyHtml: html })} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-dash-text">CTA Button Text</label>
              <input value={config.ctaText ?? ""} onChange={(e) => updateConfig({ ctaText: e.target.value })} placeholder="Enter" className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text focus:border-dash-primary focus:outline-none" />
            </div>
            <div className="border-t border-dash-border pt-4">
              <h3 className="mb-3 text-sm font-semibold text-dash-text">Logo</h3>
              <ImageUpload value={logoConfig.url ?? ""} onChange={(url) => updateLogo({ url })} userId={userId} label="Logo Image" />
              <div className="mt-3 grid grid-cols-2 gap-3">
                <RangeInput label="Logo Size" value={logoConfig.size ?? 120} min={40} max={300} onChange={(v) => updateLogo({ size: v })} unit="px" />
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-dash-text">Logo Alignment</label>
                  <select value={logoConfig.align ?? "center"} onChange={(e) => updateLogo({ align: e.target.value })} className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text focus:border-dash-primary focus:outline-none">
                    <option value="center">Center</option>
                    <option value="left">Left</option>
                    <option value="right">Right</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        }
        preview={
          <CoverPreview config={config} eventName={event.draft_name ?? event.name ?? undefined} logo={logoConfig} />
        }
      />
    </div>
  );
}
