import { useState, useEffect, useMemo, useCallback } from "react";
import { useOutletContext, useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase, UserEvent, LoginConfig, LogoConfig } from "../../lib/supabase";
import { DEFAULT_LOGIN_CONFIG, DEFAULT_LOGO_CONFIG, FONT_OPTIONS, FONT_WEIGHTS } from "../../lib/theme";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { LoginPreview } from "../../components/preview/PreviewRenderers";
import { Button } from "../../components/ui/Button";
import { Input, Select } from "../../components/ui/Input";
import { FormField, ColorInput, RangeInput, Toggle, ImageUpload, Toast, ErrorState } from "../../components/ui/index";
import { debounce } from "../../lib/utils";

type Ctx = { event: UserEvent | null };

export default function LoginEditor() {
  const { event } = useOutletContext<Ctx>();
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [config, setConfig] = useState<LoginConfig>(event?.draft_login_config || event?.login_config || DEFAULT_LOGIN_CONFIG);
  const [logoConfig, setLogoConfig] = useState<LogoConfig>(event?.draft_logo_config || event?.logo_config || DEFAULT_LOGO_CONFIG);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [previewKey, setPreviewKey] = useState("0");

  useEffect(() => {
    if (event) {
      setConfig(event.draft_login_config || event.login_config || DEFAULT_LOGIN_CONFIG);
      setLogoConfig(event.draft_logo_config || event.logo_config || DEFAULT_LOGO_CONFIG);
    }
  }, [event?.id]);

  const debouncedPreviewUpdate = useMemo(() => debounce(() => setPreviewKey(k => String(Number(k) + 1)), 150), []);
  const updateConfig = useCallback((patch: Partial<LoginConfig>) => { setConfig(prev => ({ ...prev, ...patch })); debouncedPreviewUpdate(); }, [debouncedPreviewUpdate]);
  const updateLogo = useCallback((patch: Partial<LogoConfig>) => { setLogoConfig(prev => ({ ...prev, ...patch })); debouncedPreviewUpdate(); }, [debouncedPreviewUpdate]);

  const handleSave = useCallback(async () => {
    if (!event || !eventId) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("user_events").update({ draft_login_config: config, draft_logo_config: logoConfig }).eq("id", eventId);
      if (error) throw error;
      queryClient.setQueryData(["event", eventId], (old: UserEvent | null) => old ? { ...old, draft_login_config: config, draft_logo_config: logoConfig } : old);
      setToast("Sign In page saved!"); setTimeout(() => setToast(null), 3000);
    } catch (err: any) { setToast("Failed: " + err.message); setTimeout(() => setToast(null), 3000); }
    finally { setSaving(false); }
  }, [event, eventId, config, logoConfig, queryClient]);

  if (!event) return <ErrorState message="Could not load event data" onRetry={() => navigate("/dashboard")} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold text-gray-900">Sign In Page</h1><p className="text-sm text-gray-500">Guests enter their name here</p></div>
        <Button onClick={handleSave} loading={saving}>Save Changes</Button>
      </div>
      <SplitEditor title="Sign In Settings" previewKey={previewKey} preview={<LoginPreview loginConfig={config} logo={logoConfig} />} children={
        <div className="space-y-5">
          <div className="space-y-3"><h3 className="text-sm font-semibold text-gray-900">Branding</h3>
            <Toggle checked={config.showLogo} onChange={(v) => updateConfig({ showLogo: v })} label="Show Logo" />
            {config.showLogo && <>
              <FormField label="Logo Image"><ImageUpload value={logoConfig.image} onChange={(v) => updateLogo({ image: v })} /></FormField>
              {!logoConfig.image && <FormField label="Logo Text"><Input value={logoConfig.text} onChange={(e) => updateLogo({ text: e.target.value })} /></FormField>}
              <FormField label="Logo Size"><RangeInput value={logoConfig.fontSize} min={12} max={72} onChange={(v) => updateLogo({ fontSize: v })} /></FormField>
            </>}
          </div>
          <div className="space-y-3 border-t border-gray-200 pt-4"><h3 className="text-sm font-semibold text-gray-900">Text</h3>
            <FormField label="Page Title"><Input value={config.title} onChange={(e) => updateConfig({ title: e.target.value })} /></FormField>
            <FormField label="Subtitle"><Input value={config.subtitle} onChange={(e) => updateConfig({ subtitle: e.target.value })} /></FormField>
            <FormField label="Welcome Message"><Input value={config.welcomeMessage} onChange={(e) => updateConfig({ welcomeMessage: e.target.value })} /></FormField>
            <FormField label="Input Placeholder"><Input value={config.inputPlaceholder} onChange={(e) => updateConfig({ inputPlaceholder: e.target.value })} /></FormField>
            <FormField label="Button Text"><Input value={config.buttonText} onChange={(e) => updateConfig({ buttonText: e.target.value })} /></FormField>
          </div>
          <div className="space-y-3 border-t border-gray-200 pt-4"><h3 className="text-sm font-semibold text-gray-900">Theme</h3>
            <FormField label="Background Image"><ImageUpload value={config.bgImage} onChange={(v) => updateConfig({ bgImage: v })} /></FormField>
            {config.bgImage && <FormField label="Overlay Opacity"><RangeInput value={config.overlayOpacity} min={0} max={1} step={0.05} onChange={(v) => updateConfig({ overlayOpacity: v })} /></FormField>}
            <FormField label="Background Colour"><ColorInput value={config.bgColor} onChange={(v) => updateConfig({ bgColor: v })} /></FormField>
            <FormField label="Card Background"><ColorInput value={config.cardBgColor} onChange={(v) => updateConfig({ cardBgColor: v })} /></FormField>
            <FormField label="Text Colour"><ColorInput value={config.textColor} onChange={(v) => updateConfig({ textColor: v })} /></FormField>
            <FormField label="Input Background"><ColorInput value={config.inputBgColor} onChange={(v) => updateConfig({ inputBgColor: v })} /></FormField>
            <FormField label="Button Colour"><ColorInput value={config.buttonColor} onChange={(v) => updateConfig({ buttonColor: v })} /></FormField>
            <FormField label="Border Colour"><ColorInput value={config.borderColor} onChange={(v) => updateConfig({ borderColor: v })} /></FormField>
          </div>
          <div className="space-y-3 border-t border-gray-200 pt-4"><h3 className="text-sm font-semibold text-gray-900">Typography</h3>
            <FormField label="Heading Font"><Select value={config.headingFont} onChange={(e) => updateConfig({ headingFont: e.target.value })}>{FONT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}</Select></FormField>
            <FormField label="Body Font"><Select value={config.font} onChange={(e) => updateConfig({ font: e.target.value })}>{FONT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}</Select></FormField>
            <FormField label="Heading Font Size"><RangeInput value={config.headingFontSize} min={18} max={48} onChange={(v) => updateConfig({ headingFontSize: v })} /></FormField>
            <FormField label="Heading Weight"><Select value={config.headingWeight} onChange={(e) => updateConfig({ headingWeight: e.target.value })}>{FONT_WEIGHTS.map(w => <option key={w.value} value={w.value}>{w.label}</option>)}</Select></FormField>
          </div>
        </div>
      } />
      {toast && <Toast message={toast} type={toast.includes("Failed") ? "error" : "success"} onClose={() => setToast(null)} />}
    </div>
  );
}
