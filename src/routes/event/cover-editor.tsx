import { useState, useEffect, useMemo, useCallback } from "react";
import { useOutletContext, useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase, UserEvent, CoverConfig, LogoConfig } from "../../lib/supabase";
import { DEFAULT_COVER_CONFIG, DEFAULT_LOGO_CONFIG, FONT_OPTIONS } from "../../lib/theme";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { CoverPreview } from "../../components/preview/PreviewRenderers";
import { Button } from "../../components/ui/Button";
import { Input, Select } from "../../components/ui/Input";
import { FormField, ColorInput, RangeInput, Toggle, ImageUpload, Toast, ErrorState } from "../../components/ui/index";
import { debounce } from "../../lib/utils";

type Ctx = { event: UserEvent | null };

export default function CoverEditor() {
  const { event } = useOutletContext<Ctx>();
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [config, setConfig] = useState<CoverConfig>(event?.draft_cover_config || event?.cover_config || DEFAULT_COVER_CONFIG);
  const [logoConfig, setLogoConfig] = useState<LogoConfig>(event?.draft_logo_config || event?.logo_config || DEFAULT_LOGO_CONFIG);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [previewKey, setPreviewKey] = useState("0");

  useEffect(() => {
    if (event) {
      setConfig(event.draft_cover_config || event.cover_config || DEFAULT_COVER_CONFIG);
      setLogoConfig(event.draft_logo_config || event.logo_config || DEFAULT_LOGO_CONFIG);
    }
  }, [event?.id]);

  const debouncedPreviewUpdate = useMemo(() => debounce(() => setPreviewKey(k => String(Number(k) + 1)), 150), []);
  const updateConfig = useCallback((patch: Partial<CoverConfig>) => { setConfig(prev => ({ ...prev, ...patch })); debouncedPreviewUpdate(); }, [debouncedPreviewUpdate]);
  const updateLogo = useCallback((patch: Partial<LogoConfig>) => { setLogoConfig(prev => ({ ...prev, ...patch })); debouncedPreviewUpdate(); }, [debouncedPreviewUpdate]);

  const handleSave = useCallback(async () => {
    if (!event || !eventId) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("user_events").update({ draft_cover_config: config, draft_logo_config: logoConfig }).eq("id", eventId);
      if (error) throw error;
      queryClient.setQueryData(["event", eventId], (old: UserEvent | null) => old ? { ...old, draft_cover_config: config, draft_logo_config: logoConfig } : old);
      setToast("Cover page saved!"); setTimeout(() => setToast(null), 3000);
    } catch (err: any) { setToast("Failed: " + err.message); setTimeout(() => setToast(null), 3000); }
    finally { setSaving(false); }
  }, [event, eventId, config, logoConfig, queryClient]);

  if (!event) return <ErrorState message="Could not load event data" onRetry={() => navigate("/dashboard")} />;
  const previewEvent = { ...event, draft_cover_config: config, draft_logo_config: logoConfig };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold text-gray-900">Cover Page</h1><p className="text-sm text-gray-500">The first thing guests see</p></div>
        <Button onClick={handleSave} loading={saving}>Save Changes</Button>
      </div>
      <SplitEditor title="Cover Settings" previewKey={previewKey} preview={<CoverPreview event={previewEvent} coverConfig={config} />} children={
        <div className="space-y-5">
          <div className="space-y-3"><h3 className="text-sm font-semibold text-gray-900">Background</h3>
            <FormField label="Background Image"><ImageUpload value={config.bgImage} onChange={(v) => updateConfig({ bgImage: v })} /></FormField>
            {config.bgImage && <>
              <FormField label="Overlay Colour"><ColorInput value={config.overlayColor} onChange={(v) => updateConfig({ overlayColor: v })} /></FormField>
              <FormField label="Overlay Opacity"><RangeInput value={config.overlayOpacity} min={0} max={1} step={0.05} onChange={(v) => updateConfig({ overlayOpacity: v })} /></FormField>
            </>}
            {!config.bgImage && <FormField label="Background Colour"><ColorInput value={config.bgColor} onChange={(v) => updateConfig({ bgColor: v })} /></FormField>}
          </div>
          <div className="space-y-3 border-t border-gray-200 pt-4"><h3 className="text-sm font-semibold text-gray-900">Branding</h3>
            <FormField label="Heading Font"><Select value={config.font} onChange={(e) => updateConfig({ font: e.target.value })}>{FONT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}</Select></FormField>
            <FormField label="Script Font"><Select value={config.scriptFont} onChange={(e) => updateConfig({ scriptFont: e.target.value })}>{FONT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}</Select></FormField>
            <FormField label="Custom Text"><Input value={config.customText} onChange={(e) => updateConfig({ customText: e.target.value })} placeholder="e.g. Bismillah" /></FormField>
            <div className="flex items-center gap-6"><Toggle checked={config.showDate} onChange={(v) => updateConfig({ showDate: v })} label="Show Date" /><Toggle checked={config.showCountdown} onChange={(v) => updateConfig({ showCountdown: v })} label="Show Countdown" /></div>
          </div>
          <div className="space-y-3 border-t border-gray-200 pt-4"><h3 className="text-sm font-semibold text-gray-900">Button</h3>
            <FormField label="Button Text"><Input value={config.buttonText} onChange={(e) => updateConfig({ buttonText: e.target.value })} /></FormField>
            <FormField label="Button Colour"><ColorInput value={config.buttonColor} onChange={(v) => updateConfig({ buttonColor: v })} /></FormField>
          </div>
          <div className="space-y-3 border-t border-gray-200 pt-4"><h3 className="text-sm font-semibold text-gray-900">Theme</h3>
            <FormField label="Text Colour"><ColorInput value={config.textColor} onChange={(v) => updateConfig({ textColor: v })} /></FormField>
          </div>
          <div className="space-y-3 border-t border-gray-200 pt-4"><h3 className="text-sm font-semibold text-gray-900">Logo</h3>
            <Toggle checked={logoConfig.enabled} onChange={(v) => updateLogo({ enabled: v })} label="Show Logo" />
            {logoConfig.enabled && <>
              <FormField label="Logo Image"><ImageUpload value={logoConfig.image} onChange={(v) => updateLogo({ image: v })} /></FormField>
              {!logoConfig.image && <FormField label="Logo Text"><Input value={logoConfig.text} onChange={(e) => updateLogo({ text: e.target.value })} /></FormField>}
              <FormField label="Logo Size"><RangeInput value={logoConfig.fontSize} min={12} max={72} onChange={(v) => updateLogo({ fontSize: v })} /></FormField>
            </>}
          </div>
        </div>
      } />
      {toast && <Toast message={toast} type={toast.includes("Failed") ? "error" : "success"} onClose={() => setToast(null)} />}
    </div>
  );
}
