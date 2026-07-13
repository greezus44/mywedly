import React from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type CoverConfig } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input, FormField, Card } from "../../components/ui";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { DatePicker } from "../../components/ui/DatePicker";
import { TimePicker } from "../../components/ui/TimePicker";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { CoverPreview } from "../../components/preview/PreviewRenderers";

export default function CoverEditor() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();
  const cfg = event.draft_cover_config || event.cover_config || {};
  const saveMutation = useMutation({
    mutationFn: async (newCfg: CoverConfig) => { const { error } = await supabase.from("user_events").update({ draft_cover_config: newCfg }).eq("id", event.id); if (error) throw error; },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["event", event.id] }),
    onError: (err: any) => alert("Failed to save: " + (err.message || "Unknown error")),
  });
  const [local, setLocal] = React.useState<CoverConfig>(cfg);
  React.useEffect(() => setLocal(cfg), [JSON.stringify(cfg)]);
  const update = (patch: Partial<CoverConfig>) => setLocal((prev) => ({ ...prev, ...patch }));
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-dash-text">Cover Page</h2>
        <Button onClick={() => saveMutation.mutate(local)} loading={saveMutation.isPending}>Save Changes</Button>
      </div>
      <SplitEditor preview={<CoverPreview event={{ ...event, draft_cover_config: local } as UserEvent} />}>
        <Card className="p-4 space-y-4">
          <FormField label="Title"><Input value={local.title || ""} onChange={(e: React.ChangeEvent<HTMLInputElement>) => update({ title: e.target.value })} placeholder="Event title" /></FormField>
          <FormField label="Subtitle"><Input value={local.subtitle || ""} onChange={(e: React.ChangeEvent<HTMLInputElement>) => update({ subtitle: e.target.value })} placeholder="Subtitle" /></FormField>
          <FormField label="Cover Image"><ImageUpload value={local.cover_image || null} onChange={(url) => update({ cover_image: url })} eventId={event.id} /></FormField>
          <FormField label="Logo Image"><ImageUpload value={local.logo_image || null} onChange={(url) => update({ logo_image: url })} eventId={event.id} aspectRatio="1/1" /></FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Date"><DatePicker value={local.date || null} onChange={(d) => update({ date: d })} /></FormField>
            <FormField label="Time"><TimePicker value={local.time || null} onChange={(t) => update({ time: t })} /></FormField>
          </div>
          <FormField label="Venue"><Input value={local.venue || ""} onChange={(e: React.ChangeEvent<HTMLInputElement>) => update({ venue: e.target.value })} placeholder="Venue name" /></FormField>
        </Card>
      </SplitEditor>
    </div>
  );
}
