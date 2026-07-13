import React from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventContent } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Card, FormField } from "../../components/ui";
import { RichTextEditor } from "../../components/ui/RichTextEditor";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { HomePreview } from "../../components/preview/PreviewRenderers";

export default function HomeEditor() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();
  const content = event.draft_content || event.content || {};
  const saveMutation = useMutation({
    mutationFn: async (newContent: EventContent) => { const { error } = await supabase.from("user_events").update({ draft_content: newContent }).eq("id", event.id); if (error) throw error; },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["event", event.id] }),
    onError: (err: any) => alert("Failed to save: " + (err.message || "Unknown error")),
  });
  const [local, setLocal] = React.useState<EventContent>(content);
  React.useEffect(() => setLocal(content), [JSON.stringify(content)]);
  const update = (patch: Partial<EventContent>) => setLocal((prev) => ({ ...prev, ...patch }));
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-dash-text">Home Page</h2>
        <Button onClick={() => saveMutation.mutate(local)} loading={saveMutation.isPending}>Save Changes</Button>
      </div>
      <SplitEditor preview={<HomePreview event={{ ...event, draft_content: local } as UserEvent} />}>
        <Card className="p-4 space-y-4">
          <FormField label="Title Section"><RichTextEditor value={local.title || ""} onChange={(html) => update({ title: html })} placeholder="Enter title..." minHeight={80} /></FormField>
          <FormField label="Subtitle Section"><RichTextEditor value={local.subtitle || ""} onChange={(html) => update({ subtitle: html })} placeholder="Enter subtitle..." minHeight={80} /></FormField>
          <FormField label="Body Section"><RichTextEditor value={local.body || ""} onChange={(html) => update({ body: html })} placeholder="Enter body content..." minHeight={200} /></FormField>
        </Card>
      </SplitEditor>
    </div>
  );
}
