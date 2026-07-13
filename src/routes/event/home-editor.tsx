import React from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventContent } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { RichTextEditor } from "../../components/ui/RichTextEditor";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { HomePreview } from "../../components/preview/PreviewRenderers";

export default function HomeEditor() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();
  const content = event.draft_content || event.content || {};
  const [title, setTitle] = React.useState(content.title || "");
  const [subtitle, setSubtitle] = React.useState(content.subtitle || "");
  const [body, setBody] = React.useState(content.body || "");

  const saveMutation = useMutation({
    mutationFn: async () => {
      const eventContent: EventContent = { title, subtitle, body };
      const { error } = await supabase.from("user_events").update({ draft_content: eventContent }).eq("id", event.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["event", event.id] }),
    onError: (err: any) => alert("Failed to save: " + (err.message || "Unknown error")),
  });

  const previewEvent = { ...event, draft_content: { title, subtitle, body } };

  return (
    <div>
      <h2 className="text-xl font-semibold text-dash-text mb-6">Home Page</h2>
      <SplitEditor preview={<HomePreview event={previewEvent} />}>
        <div className="space-y-4">
          <div><label className="block text-sm font-medium text-dash-text mb-1">Title</label><RichTextEditor value={title} onChange={setTitle} placeholder="Welcome heading" minHeight={80} /></div>
          <div><label className="block text-sm font-medium text-dash-text mb-1">Subtitle</label><RichTextEditor value={subtitle} onChange={setSubtitle} placeholder="Subtitle text" minHeight={80} /></div>
          <div><label className="block text-sm font-medium text-dash-text mb-1">Body</label><RichTextEditor value={body} onChange={setBody} placeholder="Main content" minHeight={200} /></div>
          <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>Save Changes</Button>
        </div>
      </SplitEditor>
    </div>
  );
}
