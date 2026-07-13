import { useState, useEffect, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type LoginConfig } from "../../lib/supabase";
import { Card, FormField, ColorInput, RangeInput } from "../../components/ui";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { LoginPreview } from "../../components/preview/PreviewRenderers";
import { Toast } from "../../components/ui";

interface OutletContext { event: UserEvent; }

export default function LoginEditorPage() {
  const { event } = useOutletContext<OutletContext>();
  const queryClient = useQueryClient();
  const [config, setConfig] = useState<LoginConfig>(
    (event.draft_login_config || event.login_config || {}) as LoginConfig
  );
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setConfig((event.draft_login_config || event.login_config || {}) as LoginConfig);
  }, [event.draft_login_config, event.login_config]);

  const saveMutation = useMutation({
    mutationFn: async (newConfig: LoginConfig) => {
      const { error } = await supabase
        .from("user_events")
        .update({ draft_login_config: newConfig, updated_at: new Date().toISOString() })
        .eq("id", event.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", event.id] });
      setToast({ msg: "Login page saved", type: "success" });
    },
    onError: (err: Error) => {
      setToast({ msg: `Save failed: ${err.message}`, type: "error" });
    },
  });

  const updateConfig = (partial: Partial<LoginConfig>) => {
    const newConfig = { ...config, ...partial };
    setConfig(newConfig);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      saveMutation.mutate(newConfig);
    }, 600);
  };

  const previewEvent: UserEvent = { ...event, draft_login_config: config };

  return (
    <>
      <SplitEditor preview={<LoginPreview event={previewEvent} />}>
        <div className="space-y-6">
          <div>
            <h2 className="font-heading text-2xl text-gray-900">Login Page</h2>
            <p className="text-sm text-gray-500 mt-1">Customize the sign-in page guests use to access the invitation.</p>
          </div>

          <Card className="p-5 space-y-5">
            <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500">Background</h3>
            <FormField label="Background Image">
              <ImageUpload
                value={config.bgImage || ""}
                onChange={(url) => updateConfig({ bgImage: url })}
                eventId={event.id}
                label="Background Image (optional)"
              />
            </FormField>
            <FormField label="Background Color" hint="Used when no image is set">
              <ColorInput
                value={config.bgColor || "#faf3e0"}
                onChange={(v) => updateConfig({ bgColor: v })}
              />
            </FormField>
            <FormField label="Overlay Color">
              <ColorInput
                value={config.overlayColor || "#000000"}
                onChange={(v) => updateConfig({ overlayColor: v })}
              />
            </FormField>
            <RangeInput
              label="Overlay Opacity"
              value={config.overlayOpacity ?? 0.3}
              min={0}
              max={1}
              step={0.1}
              onChange={(v) => updateConfig({ overlayOpacity: v })}
            />
          </Card>

          <Card className="p-5 space-y-5">
            <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500">Logo</h3>
            <ImageUpload
              value={config.logo || ""}
              onChange={(url) => updateConfig({ logo: url })}
              eventId={event.id}
              label="Sign In Page Logo (optional)"
              aspectRatio="4/3"
            />
            <RangeInput
              label="Logo Width (px)"
              value={config.logoWidth ?? 100}
              min={40}
              max={300}
              step={1}
              onChange={(v) => updateConfig({ logoWidth: v })}
            />
          </Card>

          <Card className="p-5 space-y-5">
            <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500">Text</h3>
            <FormField label="Text Color">
              <ColorInput
                value={config.textColor || "#1a1a1a"}
                onChange={(v) => updateConfig({ textColor: v })}
              />
            </FormField>
            <FormField label="Heading">
              <input
                type="text"
                value={config.heading || ""}
                onChange={(e) => updateConfig({ heading: e.target.value })}
                placeholder="Welcome"
                className="w-full px-4 py-2.5 text-sm bg-white border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 transition-colors rounded-md"
              />
            </FormField>
            <FormField label="Subheading">
              <input
                type="text"
                value={config.subheading || ""}
                onChange={(e) => updateConfig({ subheading: e.target.value })}
                placeholder="Please enter your name to continue"
                className="w-full px-4 py-2.5 text-sm bg-white border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 transition-colors rounded-md"
              />
            </FormField>
            <FormField label="Input Placeholder">
              <input
                type="text"
                value={config.inputPlaceholder || ""}
                onChange={(e) => updateConfig({ inputPlaceholder: e.target.value })}
                placeholder="Your full name"
                className="w-full px-4 py-2.5 text-sm bg-white border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 transition-colors rounded-md"
              />
            </FormField>
          </Card>

          <Card className="p-5 space-y-5">
            <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500">Button</h3>
            <FormField label="Button Color">
              <ColorInput
                value={config.buttonColor || "#1a1a1a"}
                onChange={(v) => updateConfig({ buttonColor: v })}
              />
            </FormField>
            <FormField label="Button Text">
              <input
                type="text"
                value={config.buttonText || ""}
                onChange={(e) => updateConfig({ buttonText: e.target.value })}
                placeholder="Continue"
                className="w-full px-4 py-2.5 text-sm bg-white border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 transition-colors rounded-md"
              />
            </FormField>
          </Card>
        </div>
      </SplitEditor>
      {toast && (
        <Toast
          message={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
