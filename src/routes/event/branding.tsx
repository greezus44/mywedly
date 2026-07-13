import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, Image as ImageIcon } from "lucide-react";
import { supabase, type UserEvent, type LogoConfig } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Card, FormField, Toggle, ColorInput, RangeInput, Skeleton, ErrorState, Toast } from "../../components/ui";
import { Input } from "../../components/ui/Input";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { CoverPreview } from "../../components/preview/PreviewRenderers";

function BrandingPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const queryClient = useQueryClient();
  const [config, setConfig] = useState<LogoConfig>({ enabled: false });
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
      setConfig(event.draft_logo_config || event.logo_config || { enabled: false });
    }
  }, [event]);

  const updateMutation = useMutation({
    mutationFn: async (newConfig: LogoConfig) => {
      const { data, error } = await supabase
        .from("user_events")
        .update({ draft_logo_config: newConfig, updated_at: new Date().toISOString() })
        .eq("id", eventId!)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["event", eventId], data);
      setToast({ message: "Branding saved", type: "success" });
    },
    onError: () => setToast({ message: "Failed to save branding", type: "error" }),
  });

  const updateField = useCallback(
    <K extends keyof LogoConfig>(field: K, value: LogoConfig[K]) => {
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

  const previewEvent: UserEvent = { ...event, draft_logo_config: config };

  return (
    <div>
      <div className="px-6 lg:px-8 py-6 border-b border-onyx/10">
        <h1 className="font-heading text-3xl text-onyx">Branding</h1>
        <p className="mt-1 text-sm text-onyx/50">Add a logo or brand mark to your event pages</p>
      </div>

      <SplitEditor preview={<CoverPreview event={previewEvent} />}>
        <div className="space-y-6">
          {updateMutation.isPending && (
            <div className="flex items-center gap-2 text-xs text-onyx/50 uppercase tracking-wider">
              <Save className="w-3.5 h-3.5 animate-pulse" /> Saving...
            </div>
          )}

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-heading text-xl text-onyx">Logo Enabled</h2>
                <p className="text-sm text-onyx/40 mt-1">Toggle to show or hide the logo across pages</p>
              </div>
              <Toggle
                checked={config.enabled}
                onChange={(v) => updateField("enabled", v)}
              />
            </div>
          </Card>

          {config.enabled && (
            <>
              <Card className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <ImageIcon className="w-5 h-5 text-onyx/50" />
                  <h2 className="font-heading text-xl text-onyx">Logo Image</h2>
                </div>
                <FormField label="Upload Logo">
                  <ImageUpload
                    value={config.image || ""}
                    onChange={(url) => updateField("image", url)}
                    eventId={eventId}
                    label="Logo"
                    aspectRatio="3/1"
                  />
                </FormField>
              </Card>

              <Card className="p-5">
                <h2 className="font-heading text-xl text-onyx mb-4">Text &amp; Style</h2>
                <div className="space-y-4">
                  <FormField label="Logo Text" hint="Displayed alongside or instead of the image">
                    <Input
                      value={config.text || ""}
                      onChange={(e) => updateField("text", e.target.value)}
                      placeholder="Brand Name"
                    />
                  </FormField>
                  <FormField label="Font Size">
                    <RangeInput
                      value={config.fontSize ?? 24}
                      onChange={(v) => updateField("fontSize", v)}
                      min={12}
                      max={48}
                      step={1}
                    />
                  </FormField>
                  <FormField label="Color">
                    <ColorInput
                      value={config.color || "#1a1a1a"}
                      onChange={(v) => updateField("color", v)}
                    />
                  </FormField>
                </div>
              </Card>
            </>
          )}

          {!config.enabled && (
            <Card className="p-8">
              <div className="text-center">
                <p className="text-sm text-onyx/40">
                  Enable the logo toggle to upload a brand image and customize its appearance.
                </p>
              </div>
            </Card>
          )}
        </div>
      </SplitEditor>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default BrandingPage;
