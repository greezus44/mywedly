import { useState, useEffect, useMemo } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, UserEvent, LogoConfig } from "../../lib/supabase";
import { DEFAULT_LOGO_CONFIG } from "../../lib/theme";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { FormField, ColorInput, RangeInput, Toggle, Toast, Card } from "../../components/ui/index";
import { LogoRenderer } from "../../components/preview/PreviewRenderers";
import { debounce } from "../../lib/utils";
import { Loader2 } from "lucide-react";

export default function Branding() {
  const { event } = useOutletContext<{ event: UserEvent | null }>();
  const { eventId } = useParams<{ eventId: string }>();
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [logo, setLogo] = useState<LogoConfig>({ ...DEFAULT_LOGO_CONFIG, ...(event?.draft_logo_config || {}) });

  useEffect(() => {
    if (event) {
      setLogo({ ...DEFAULT_LOGO_CONFIG, ...(event.draft_logo_config || {}) });
    }
  }, [event]);

  const previewKey = useMemo(() => JSON.stringify(logo), [logo]);

  const debouncedSave = useMemo(
    () =>
      debounce(async (logoConfig: LogoConfig) => {
        if (!eventId) return;
        setSaving(true);
        const { error } = await supabase
          .from("user_events")
          .update({ draft_logo_config: logoConfig })
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
    debouncedSave(logo);
  }, [logo, event, debouncedSave]);

  const saveMutation = useMutation<void, Error>({
    mutationFn: async () => {
      if (!eventId) return;
      const { error } = await supabase
        .from("user_events")
        .update({ draft_logo_config: logo })
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
          <h1 className="text-xl font-bold tracking-tight">Branding</h1>
          <p className="text-sm text-gray-500 mt-0.5">Logo and brand identity for your event</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Logo Settings</h2>
          <div className="space-y-5">
            <Toggle checked={logo.enabled} onChange={(v) => setLogo({ ...logo, enabled: v })} label="Enable logo" />

            {logo.enabled && (
              <>
                <FormField label="Logo Image">
                  <ImageUpload value={logo.image} onChange={(url) => setLogo({ ...logo, image: url })} eventId={eventId} aspectRatio="square" />
                </FormField>

                {!logo.image && (
                  <>
                    <FormField label="Logo Text" hint="Used when no image is uploaded">
                      <Input value={logo.text} onChange={(e) => setLogo({ ...logo, text: e.target.value })} placeholder="e.g. S&J" />
                    </FormField>
                    <FormField label="Font Size">
                      <RangeInput value={logo.fontSize} min={12} max={64} onChange={(v) => setLogo({ ...logo, fontSize: v })} />
                    </FormField>
                    <FormField label="Color">
                      <ColorInput value={logo.color} onChange={(v) => setLogo({ ...logo, color: v })} />
                    </FormField>
                  </>
                )}
              </>
            )}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Preview</h2>
          <div className="bg-gray-50 rounded-lg p-8 flex items-center justify-center min-h-[200px]" key={previewKey}>
            {logo.enabled ? (
              <LogoRenderer config={logo} />
            ) : (
              <p className="text-sm text-gray-400">Logo is disabled</p>
            )}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              The logo appears on the cover page and sign-in page when enabled. Upload an image for a custom logo, or use text as a monogram.
            </p>
          </div>
        </Card>
      </div>

      {toast && <Toast message={toast} type={toast.includes("Failed") ? "error" : "success"} onClose={() => setToast(null)} />}
    </div>
  );
}
