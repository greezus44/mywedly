import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { supabase, type UserEvent, type LoginConfig } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Card, FormField, ColorInput, Skeleton, ErrorState, Toast } from "../../components/ui";
import { Input } from "../../components/ui/Input";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { LoginPreview } from "../../components/preview/PreviewRenderers";

function LoginEditorPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const queryClient = useQueryClient();
  const [config, setConfig] = useState<LoginConfig>({});
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const { data: event, isLoading, isError, refetch } = useQuery<UserEvent>({
    queryKey: ["event", eventId],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_events").select("*").eq("id", eventId!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
  });

  useEffect(() => {
    if (event) {
      setConfig(event.draft_login_config || event.login_config || {});
    }
  }, [event]);

  const updateMutation = useMutation({
    mutationFn: async (newConfig: LoginConfig) => {
      const { data, error } = await supabase
        .from("user_events")
        .update({ draft_login_config: newConfig, updated_at: new Date().toISOString() })
        .eq("id", eventId!)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["event", eventId], data);
      setToast({ message: "Login page saved", type: "success" });
    },
    onError: () => {
      setToast({ message: "Failed to save login page", type: "error" });
    },
  });

  const updateField = useCallback(
    <K extends keyof LoginConfig>(field: K, value: LoginConfig[K]) => {
      setConfig((prev) => {
        const next = { ...prev, [field]: value };
        updateMutation.mutate(next);
        return next;
      });
    },
    [updateMutation],
  );

  if (isLoading) {
    return (
      <div className="p-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid lg:grid-cols-2 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (isError || !event) {
    return <ErrorState message="Failed to load event" onRetry={refetch} />;
  }

  const previewEvent: UserEvent = { ...event, draft_login_config: config };

  return (
    <div>
      <div className="px-6 lg:px-8 py-6 border-b border-onyx/10">
        <h1 className="font-heading text-3xl text-onyx">Login Editor</h1>
        <p className="mt-1 text-sm text-onyx/50">Customize the page where guests enter their name</p>
      </div>

      <SplitEditor preview={<LoginPreview event={previewEvent} />}>
        <div className="space-y-6">
          {updateMutation.isPending && (
            <div className="flex items-center gap-2 text-xs text-onyx/50 uppercase tracking-wider">
              <Save className="w-3.5 h-3.5 animate-pulse" /> Saving...
            </div>
          )}

          <Card className="p-5">
            <h2 className="font-heading text-xl text-onyx mb-4">Background</h2>
            <div className="space-y-4">
              <FormField label="Background Image">
                <ImageUpload
                  value={config.bgImage || ""}
                  onChange={(url) => updateField("bgImage", url)}
                  eventId={eventId}
                  label="Login Background"
                />
              </FormField>
              <FormField label="Background Color" hint="Used when no image is set">
                <ColorInput value={config.bgColor || "#f5f0e8"} onChange={(v) => updateField("bgColor", v)} />
              </FormField>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="font-heading text-xl text-onyx mb-4">Text</h2>
            <div className="space-y-4">
              <FormField label="Text Color">
                <ColorInput value={config.textColor || "#1a1a1a"} onChange={(v) => updateField("textColor", v)} />
              </FormField>
              <FormField label="Heading">
                <Input
                  value={config.heading || ""}
                  onChange={(e) => updateField("heading", e.target.value)}
                  placeholder="Welcome"
                />
              </FormField>
              <FormField label="Subheading">
                <Input
                  value={config.subheading || ""}
                  onChange={(e) => updateField("subheading", e.target.value)}
                  placeholder="Please enter your name to continue"
                />
              </FormField>
              <FormField label="Input Placeholder">
                <Input
                  value={config.inputPlaceholder || ""}
                  onChange={(e) => updateField("inputPlaceholder", e.target.value)}
                  placeholder="Your full name"
                />
              </FormField>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="font-heading text-xl text-onyx mb-4">Button</h2>
            <div className="space-y-4">
              <FormField label="Button Color">
                <ColorInput value={config.buttonColor || "#1a1a1a"} onChange={(v) => updateField("buttonColor", v)} />
              </FormField>
              <FormField label="Button Text">
                <Input
                  value={config.buttonText || ""}
                  onChange={(e) => updateField("buttonText", e.target.value)}
                  placeholder="Continue"
                />
              </FormField>
            </div>
          </Card>
        </div>
      </SplitEditor>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default LoginEditorPage;
