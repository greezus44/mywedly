import { useParams, useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventContent } from "../../lib/supabase";
import { Card, Toast } from "../../components/ui";
import { RichTextEditor } from "../../components/ui/RichTextEditor";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { HomePreview } from "../../components/preview/PreviewRenderers";
import { useState } from "react";
import { Loader2 } from "lucide-react";

type Ctx = { event: UserEvent };
export default function HomeEditorPage() {
  const { event } = useOutletContext<Ctx>();
  const { eventId } = useParams();
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<string | null>(null);
  const content: EventContent = event.draft_content || { rich_title: "", rich_subtitle: "", rich_body: "" };

  const update = (patch: Partial<EventContent>) => { const next = { ...content, ...patch }; saveMutation.mutate({ draft_content: next }); };
  const saveMutation = useMutation({
    mutationFn: async (patch: Record<string, unknown>) => { const { error } = await supabase.from("user_events").update(patch).eq("id", eventId); if (error) throw error; },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["event", eventId] }),
    onError: (e: Error) => setToast(`Save failed: ${e.message}`),
  });

  return (
    <div className="p-6">
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h2 className="font-heading text-2xl text-gray-900">Home Page</h2>
          <Card className="space-y-2">
            <label className="block text-xs font-medium uppercase tracking-wider text-gray-500 mb-1.5">Title</label>
            <RichTextEditor value={content.rich_title || ""} onChange={(html) => update({ rich_title: html })} placeholder="Our Wedding" minHeight={80} />
          </Card>
          <Card className="space-y-2">
            <label className="block text-xs font-medium uppercase tracking-wider text-gray-500 mb-1.5">Subtitle</label>
            <RichTextEditor value={content.rich_subtitle || ""} onChange={(html) => update({ rich_subtitle: html })} placeholder="We invite you to celebrate with us" minHeight={80} />
          </Card>
          <Card className="space-y-2">
            <label className="block text-xs font-medium uppercase tracking-wider text-gray-500 mb-1.5">Body</label>
            <RichTextEditor value={content.rich_body || ""} onChange={(html) => update({ rich_body: html })} placeholder="Write your story..." minHeight={200} />
          </Card>
        </div>
        <div className="lg:sticky lg:top-32 self-start">
          <SplitEditor preview={<HomePreview event={event} />}>
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-wider text-gray-400">Home Preview</p>
              <div className="border border-gray-200 rounded-lg overflow-hidden"><HomePreview event={event} /></div>
            </div>
          </SplitEditor>
        </div>
      </div>
      {saveMutation.isPending && <div className="fixed bottom-4 right-4 bg-white border border-gray-200 shadow-lg rounded-lg px-4 py-2 text-sm text-gray-600 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Saving...</div>}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
