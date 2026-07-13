import { useState, useEffect, useCallback } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type LoginConfig } from "../../lib/supabase";
import { debounce } from "../../lib/utils";
import { Button } from "../../components/ui/Button";
import { Card, FormField, ColorInput, Toast } from "../../components/ui";
import { Input } from "../../components/ui/Input";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { LoginPreview } from "../../components/preview/PreviewRenderers";
import { Save } from "lucide-react";

export default function LoginEditorPage() {
  const { eventId } = useParams();
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<string | null>(null);

  const initialConfig: LoginConfig =
    (event.draft_login_config || event.login_config || {}) as LoginConfig;

  const [config, setConfig] = useState<LoginConfig>({
    bgImage: initialConfig.bgImage || "",
    bgColor: initialConfig.bgColor || "#f5f5f5",
    overlayColor: initialConfig.overlayColor || "#000000",
    overlayOpacity: initialConfig.overlayOpacity ?? 0.3,
    textColor: initialConfig.textColor || "#1a1a1a",
    buttonColor: initialConfig.buttonColor || "#1a1a1a",
    buttonText: initialConfig.buttonText || "Continue",
    heading: initialConfig.heading || "Welcome",
    subheading: initialConfig.subheading || "Please enter your name to continue",
    inputPlaceholder: initialConfig.inputPlaceholder || "Your full name",
  });

  const updateMutation = useMutation({
    mutationFn: async (newConfig: LoginConfig) => {
      if (!eventId) return;
      const { error } = await supabase
        .from("user_events")
        .update({ draft_login_config: newConfig, updated_at: new Date().toISOString() })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      setToast("Login page saved");
    },
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSave = useCallback(
    debounce((newConfig: LoginConfig) => updateMutation.mutate(newConfig), 600),
    [updateMutation]
  );

  useEffect(() => {
    debouncedSave(config);
  }, [config, debouncedSave]);

  const update = <K extends keyof LoginConfig>(key: K, value: LoginConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const previewEvent: UserEvent = {
    ...event,
    draft_login_config: config,
  };

  return (
    <>
      <SplitEditor preview={<LoginPreview event={previewEvent} />}>
        <div className="max-w-xl mx-auto space-y-6">
          <div>
            <h2 className="font-heading text-2xl text-[var(--color-text)] mb-1">Login Page</h2>
            <p className="text-sm text-[var(--color-text-muted)]">
              The page guests see to identify themselves before accessing the invitation.
            </p>
          </div>

          <Card className="p-5 space-y-5">
            <FormField label="Background Image">
              <ImageUpload
                value={config.bgImage || ""}
                onChange={(url) => update("bgImage", url)}
                eventId={eventId}
                label="Login background"
              />
            </FormField>

            <FormField label="Background Color" hint="Used when no image is set">
              <ColorInput
                value={config.bgColor || "#f5f5f5"}
                onChange={(v) => update("bgColor", v)}
              />
            </FormField>

            <FormField label="Overlay Color">
              <ColorInput
                value={config.overlayColor || "#000000"}
                onChange={(v) => update("overlayColor", v)}
              />
            </FormField>

            <FormField label="Text Color">
              <ColorInput
                value={config.textColor || "#1a1a1a"}
                onChange={(v) => update("textColor", v)}
              />
            </FormField>

            <FormField label="Button Color">
              <ColorInput
                value={config.buttonColor || "#1a1a1a"}
                onChange={(v) => update("buttonColor", v)}
              />
            </FormField>

            <FormField label="Button Text">
              <Input
                value={config.buttonText || ""}
                onChange={(e) => update("buttonText", e.target.value)}
                placeholder="Continue"
              />
            </FormField>

            <FormField label="Heading">
              <Input
                value={config.heading || ""}
                onChange={(e) => update("heading", e.target.value)}
                placeholder="Welcome"
              />
            </FormField>

            <FormField label="Subheading">
              <Input
                value={config.subheading || ""}
                onChange={(e) => update("subheading", e.target.value)}
                placeholder="Please enter your name to continue"
              />
            </FormField>

            <FormField label="Input Placeholder">
              <Input
                value={config.inputPlaceholder || ""}
                onChange={(e) => update("inputPlaceholder", e.target.value)}
                placeholder="Your full name"
              />
            </FormField>
          </Card>

          <div className="flex justify-end">
            <Button
              onClick={() => updateMutation.mutate(config)}
              loading={updateMutation.isPending}
            >
              <Save className="w-4 h-4" /> Save Changes
            </Button>
          </div>
        </div>
      </SplitEditor>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </>
  );
}
