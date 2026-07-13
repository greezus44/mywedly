import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Image as ImageIcon, Save, AlertCircle } from "lucide-react";
import { supabase, type UserEvent, type CoverConfig } from "../../lib/supabase";
import { cn } from "../../lib/utils";
import { Button } from "../../components/ui/Button";
import { Card, FormField, Toggle, ColorInput, RangeInput, Skeleton, ErrorState, Toast } from "../../components/ui";
import { Input } from "../../components/ui/Input";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { CoverPreview } from "../../components/preview/PreviewRenderers";

function CoverEditorPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const queryClient = useQueryClient();
  const [config, setConfig] = useState<CoverConfig>({});
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
      setConfig(event.draft_cover_config || event.cover_config || {});
    }
  }, [event]);

  const updateMutation = useMutation({
    mutationFn: async (newConfig: CoverConfig) => {
      const { data, error } = await supabase
        .from("user_events")
        .update({ draft_cover_config: newConfig, updated_at: new Date().toISOString() })
        .eq("id", eventId!)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["event", eventId], data);
      setToast({ message: "Cover saved", type: "success" });
    },
    onError: () => {
      setToast({ message: "Failed to save cover", type: "error" });
    },
  });

  const updateField = useCallback(
    <K extends keyof CoverConfig>(field: K, value: CoverConfig[K]) => {
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

  const previewEvent: UserEvent = { ...event, draft_cover_config: config };

  return (
    <div>
      <div className="px-6 lg:px-8 py-6 border-b border-onyx/10">
        <h1 className="font-heading text-3xl text-onyx">Cover Editor</h1>
        <p className="mt-1 text-sm text-onyx/50">Customize the entry page guests see first</p>
      </div>

      <SplitEditor preview={<CoverPreview event={previewEvent} />}>
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
                  label="Cover Background"
                />
              </FormField>
              <FormField label="Background Color" hint="Used when no image is set">
                <ColorInput value={config.bgColor || "#1a1a1a"} onChange={(v) => updateField("bgColor", v)} />
              </FormField>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="font-heading text-xl text-onyx mb-4">Overlay</h2>
            <div className="space-y-4">
              <FormField label="Overlay Color">
                <ColorInput value={config.overlayColor || "#000000"} onChange={(v) => updateField("overlayColor", v)} />
              </FormField>
              <FormField label="Overlay Opacity">
                <RangeInput
                  value={config.overlayOpacity ?? 0.4}
                  onChange={(v) => updateField("overlayOpacity", v)}
                  min={0}
                  max={1}
                  step={0.1}
                />
              </FormField>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="font-heading text-xl text-onyx mb-4">Text &amp; Button</h2>
            <div className="space-y-4">
              <FormField label="Text Color">
                <ColorInput value={config.textColor || "#ffffff"} onChange={(v) => updateField("textColor", v)} />
              </FormField>
              <FormField label="Button Color">
                <ColorInput value={config.buttonColor || "#1a1a1a"} onChange={(v) => updateField("buttonColor", v)} />
              </FormField>
              <FormField label="Button Text">
                <Input
                  value={config.buttonText || ""}
                  onChange={(e) => updateField("buttonText", e.target.value)}
                  placeholder="Enter"
                />
              </FormField>
              <FormField label="Custom Intro Text" hint="Appears above the event name in italic script">
                <Input
                  value={config.customText || ""}
                  onChange={(e) => updateField("customText", e.target.value)}
                  placeholder="Together with their families"
                />
              </FormField>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="font-heading text-xl text-onyx mb-4">Display Options</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-onyx/70">Show Date</p>
                  <p className="text-xs text-onyx/40">Display the event date on the cover</p>
                </div>
                <Toggle checked={config.showDate ?? true} onChange={(v) => updateField("showDate", v)} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-onyx/70">Show Countdown</p>
                  <p className="text-xs text-onyx/40">Display a live countdown timer</p>
                </div>
                <Toggle checked={config.showCountdown ?? false} onChange={(v) => updateField("showCountdown", v)} />
              </div>
            </div>
          </Card>
        </div>
      </SplitEditor>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default CoverEditorPage;
