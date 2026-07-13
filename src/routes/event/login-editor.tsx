import { useState, useEffect, useRef } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type LoginConfig } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Card, FormField, ColorInput, Toast } from "../../components/ui";
import { Input, Textarea } from "../../components/ui/Input";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { LoginPreview } from "../../components/preview/PreviewRenderers";
import { RotateCcw } from "lucide-react";

const DEFAULT_LOGIN_CONFIG: LoginConfig = {
  bgImage: "",
  bgColor: "#f5f5f5",
  textColor: "#1a1a1a",
  buttonColor: "#1a1a1a",
  buttonText: "Continue",
  heading: "Welcome",
  subheading: "Please enter your name to continue",
  inputPlaceholder: "Your full name",
};

function LoginEditorPage() {
  const { eventId } = useParams();
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();
  const [config, setConfig] = useState<LoginConfig>(
    () => (event.draft_login_config || event.login_config || DEFAULT_LOGIN_CONFIG) as LoginConfig
  );
  const [toast, setToast] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstRun = useRef(true);

  useEffect(() => {
    const stored = (event.draft_login_config || event.login_config || DEFAULT_LOGIN_CONFIG) as LoginConfig;
    setConfig(stored);
  }, [event]);

  const saveMutation = useMutation({
    mutationFn: async (data: LoginConfig) => {
      const { error } = await supabase
        .from("user_events")
        .update({ draft_login_config: data, updated_at: new Date().toISOString() })
        .eq("id", eventId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      setSaveState("saved");
      setToast("Login page saved");
      setTimeout(() => setSaveState("idle"), 2000);
    },
    onError: (err: Error) => {
      setToast(`Failed to save: ${err.message}`);
      setSaveState("idle");
    },
  });

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSaveState("saving");
    debounceRef.current = setTimeout(() => {
      saveMutation.mutate(config);
    }, 800);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

  const update = (partial: Partial<LoginConfig>) => setConfig((prev) => ({ ...prev, ...partial }));
  const reset = () => setConfig(DEFAULT_LOGIN_CONFIG);

  return (
    <>
      <SplitEditor preview={<LoginPreview event={event} />}>
        <div className="space-y-6 max-w-xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading text-2xl text-[var(--color-text)]">Login Page</h2>
              <p className="text-sm text-[var(--color-text-muted)] mt-1">
                {saveState === "saving" ? "Saving..." : saveState === "saved" ? "Saved" : "Guests enter their name here"}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={reset}>
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </Button>
          </div>

          <Card className="p-5 space-y-5">
            <FormField label="Background Image">
              <ImageUpload
                value={config.bgImage || ""}
                onChange={(url) => update({ bgImage: url })}
                eventId={eventId}
                aspectRatio="16/9"
              />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Background Color">
                <ColorInput
                  value={config.bgColor || "#f5f5f5"}
                  onChange={(v) => update({ bgColor: v })}
                />
              </FormField>
              <FormField label="Text Color">
                <ColorInput
                  value={config.textColor || "#1a1a1a"}
                  onChange={(v) => update({ textColor: v })}
                />
              </FormField>
            </div>

            <FormField label="Button Color">
              <ColorInput
                value={config.buttonColor || "#1a1a1a"}
                onChange={(v) => update({ buttonColor: v })}
              />
            </FormField>
          </Card>

          <Card className="p-5 space-y-5">
            <FormField label="Heading">
              <Input
                value={config.heading || ""}
                onChange={(e) => update({ heading: e.target.value })}
                placeholder="Welcome"
              />
            </FormField>

            <FormField label="Subheading">
              <Textarea
                value={config.subheading || ""}
                onChange={(e) => update({ subheading: e.target.value })}
                placeholder="Please enter your name to continue"
                rows={2}
              />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Input Placeholder">
                <Input
                  value={config.inputPlaceholder || ""}
                  onChange={(e) => update({ inputPlaceholder: e.target.value })}
                  placeholder="Your full name"
                />
              </FormField>
              <FormField label="Button Text">
                <Input
                  value={config.buttonText || ""}
                  onChange={(e) => update({ buttonText: e.target.value })}
                  placeholder="Continue"
                />
              </FormField>
            </div>
          </Card>
        </div>
      </SplitEditor>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </>
  );
}

export default LoginEditorPage;
