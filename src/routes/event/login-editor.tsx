import { useState, useEffect, useMemo } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, UserEvent, LoginConfig } from "../../lib/supabase";
import { DEFAULT_LOGIN_CONFIG, FONT_OPTIONS, FONT_WEIGHTS } from "../../lib/theme";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { LoginPreview } from "../../components/preview/PreviewRenderers";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { Button } from "../../components/ui/Button";
import { Input, Select } from "../../components/ui/Input";
import { FormField, ColorInput, RangeInput, Toggle, Toast } from "../../components/ui/index";
import { debounce } from "../../lib/utils";
import { Loader2 } from "lucide-react";

export default function LoginEditor() {
  const { event } = useOutletContext<{ event: UserEvent | null }>();
  const { eventId } = useParams<{ eventId: string }>();
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [config, setConfig] = useState<LoginConfig>({ ...DEFAULT_LOGIN_CONFIG, ...(event?.draft_login_config || {}) });

  useEffect(() => {
    if (event) {
      setConfig({ ...DEFAULT_LOGIN_CONFIG, ...(event.draft_login_config || {}) });
    }
  }, [event]);

  const previewKey = useMemo(() => JSON.stringify(config), [config]);

  const debouncedSave = useMemo(
    () =>
      debounce(async (loginConfig: LoginConfig) => {
        if (!eventId) return;
        setSaving(true);
        const { error } = await supabase
          .from("user_events")
          .update({ draft_login_config: loginConfig })
          .eq("id", eventId);
        setSaving(false);
        if (error) {
          setToast("Failed to save");
          setTimeout(() => setToast(null), 3000);
        }
        queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      }, 800),
    [eventId, queryClient]
  );

  useEffect(() => {
    if (!event) return;
    debouncedSave(config);
  }, [config, event, debouncedSave]);

  const saveMutation = useMutation<void, Error>({
    mutationFn: async () => {
      if (!eventId) return;
      const { error } = await supabase
        .from("user_events")
        .update({ draft_login_config: config })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      setToast("Saved");
      setTimeout(() => setToast(null), 3000);
    },
    onError: () => {
      setToast("Failed to save");
      setTimeout(() => setToast(null), 3000);
    },
  });

  if (!event) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Sign In Page</h1>
          <p className="text-sm text-gray-500 mt-0.5">Guests enter their name to access the event</p>
        </div>
        <div className="flex items-center gap-3">
          {saving && (
            <span className="flex items-center gap-1.5 text-xs text-gray-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
            </span>
          )}
          <Button size="sm" onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
            Save
          </Button>
        </div>
      </div>

      <SplitEditor title="Sign In Settings" preview={<LoginPreview loginConfig={config} logo={event.draft_logo_config} />} previewKey={previewKey}>
        <div className="space-y-5">
          <FormField label="Title">
            <Input value={config.title} onChange={(e) => setConfig({ ...config, title: e.target.value })} />
          </FormField>

          <FormField label="Subtitle">
            <Input value={config.subtitle} onChange={(e) => setConfig({ ...config, subtitle: e.target.value })} />
          </FormField>

          <FormField label="Welcome Message">
            <Input value={config.welcomeMessage} onChange={(e) => setConfig({ ...config, welcomeMessage: e.target.value })} />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Input Placeholder">
              <Input value={config.inputPlaceholder} onChange={(e) => setConfig({ ...config, inputPlaceholder: e.target.value })} />
            </FormField>
            <FormField label="Button Text">
              <Input value={config.buttonText} onChange={(e) => setConfig({ ...config, buttonText: e.target.value })} />
            </FormField>
          </div>

          <div className="pt-2 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Background</h3>
            <div className="space-y-4">
              <FormField label="Background Image">
                <ImageUpload value={config.bgImage} onChange={(url) => setConfig({ ...config, bgImage: url })} eventId={eventId} />
              </FormField>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Background Color">
                  <ColorInput value={config.bgColor} onChange={(v) => setConfig({ ...config, bgColor: v })} />
                </FormField>
                <FormField label="Overlay Opacity">
                  <RangeInput value={config.overlayOpacity} min={0} max={1} step={0.05} onChange={(v) => setConfig({ ...config, overlayOpacity: v })} />
                </FormField>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Card</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Card Background">
                  <ColorInput value={config.cardBgColor} onChange={(v) => setConfig({ ...config, cardBgColor: v })} />
                </FormField>
                <FormField label="Text Color">
                  <ColorInput value={config.textColor} onChange={(v) => setConfig({ ...config, textColor: v })} />
                </FormField>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Input Background">
                  <ColorInput value={config.inputBgColor} onChange={(v) => setConfig({ ...config, inputBgColor: v })} />
                </FormField>
                <FormField label="Border Color">
                  <ColorInput value={config.borderColor} onChange={(v) => setConfig({ ...config, borderColor: v })} />
                </FormField>
              </div>
              <FormField label="Button Color">
                <ColorInput value={config.buttonColor} onChange={(v) => setConfig({ ...config, buttonColor: v })} />
              </FormField>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Typography</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Heading Font">
                  <Select value={config.headingFont} onChange={(e) => setConfig({ ...config, headingFont: e.target.value })}>
                    {FONT_OPTIONS.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </Select>
                </FormField>
                <FormField label="Heading Weight">
                  <Select value={config.headingWeight} onChange={(e) => setConfig({ ...config, headingWeight: e.target.value })}>
                    {FONT_WEIGHTS.map((w) => (
                      <option key={w.value} value={w.value}>{w.label}</option>
                    ))}
                  </Select>
                </FormField>
              </div>
              <FormField label="Heading Font Size">
                <RangeInput value={config.headingFontSize} min={16} max={48} onChange={(v) => setConfig({ ...config, headingFontSize: v })} />
              </FormField>
              <FormField label="Body Font">
                <Select value={config.font} onChange={(e) => setConfig({ ...config, font: e.target.value })}>
                  {FONT_OPTIONS.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </Select>
              </FormField>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100">
            <Toggle checked={config.showLogo} onChange={(v) => setConfig({ ...config, showLogo: v })} label="Show logo on sign in page" />
          </div>
        </div>
      </SplitEditor>

      {toast && <Toast message={toast} type={toast.includes("Failed") ? "error" : "success"} onClose={() => setToast(null)} />}
    </div>
  );
}
