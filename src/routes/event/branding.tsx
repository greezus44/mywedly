import { useState, useEffect, useCallback } from "react";
import { useOutletContext, useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase, UserEvent, LogoConfig } from "../../lib/supabase";
import { DEFAULT_LOGO_CONFIG } from "../../lib/theme";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { FormField, RangeInput, Toggle, ImageUpload, Toast, ErrorState, Card } from "../../components/ui/index";

type Ctx = { event: UserEvent | null };

export default function BrandingEditor() {
  const { event } = useOutletContext<Ctx>();
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [logoConfig, setLogoConfig] = useState<LogoConfig>(event?.draft_logo_config || event?.logo_config || DEFAULT_LOGO_CONFIG);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => { if (event) setLogoConfig(event.draft_logo_config || event.logo_config || DEFAULT_LOGO_CONFIG); }, [event?.id]);

  const update = useCallback((patch: Partial<LogoConfig>) => setLogoConfig(prev => ({ ...prev, ...patch })), []);

  const handleSave = useCallback(async () => {
    if (!event || !eventId) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("user_events").update({ draft_logo_config: logoConfig }).eq("id", eventId);
      if (error) throw error;
      queryClient.setQueryData(["event", eventId], (old: UserEvent | null) => old ? { ...old, draft_logo_config: logoConfig } : old);
      setToast("Branding saved!"); setTimeout(() => setToast(null), 3000);
    } catch (err: any) { setToast("Failed: " + err.message); setTimeout(() => setToast(null), 3000); }
    finally { setSaving(false); }
  }, [event, eventId, logoConfig, queryClient]);

  if (!event) return <ErrorState message="Could not load event data" onRetry={() => navigate("/dashboard")} />;

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold text-gray-900">Branding</h1><p className="text-sm text-gray-500">Logo and brand identity</p></div>
        <Button onClick={handleSave} loading={saving}>Save Changes</Button>
      </div>
      <Card className="p-6 space-y-5">
        <div><h3 className="text-sm font-semibold text-gray-900 mb-3">Logo</h3>
          <div className="space-y-4">
            <Toggle checked={logoConfig.enabled} onChange={(v) => update({ enabled: v })} label="Show Logo" />
            {logoConfig.enabled && <>
              <FormField label="Logo Image"><ImageUpload value={logoConfig.image} onChange={(v) => update({ image: v })} /></FormField>
              {!logoConfig.image && <FormField label="Logo Text"><Input value={logoConfig.text} onChange={(e) => update({ text: e.target.value })} placeholder="e.g. E" /></FormField>}
              <FormField label="Logo Size"><RangeInput value={logoConfig.fontSize} min={12} max={72} onChange={(v) => update({ fontSize: v })} /></FormField>
              {!logoConfig.image && <FormField label="Logo Colour">
                <div className="flex items-center gap-2">
                  <input type="color" value={logoConfig.color} onChange={(e) => update({ color: e.target.value })} className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5" />
                  <input type="text" value={logoConfig.color} onChange={(e) => update({ color: e.target.value })} className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm font-mono uppercase" />
                </div>
              </FormField>}
            </>}
          </div>
        </div>
      </Card>
      {toast && <Toast message={toast} type={toast.includes("Failed") ? "error" : "success"} onClose={() => setToast(null)} />}
    </div>
  );
}
