import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { supabase, type UserEvent, type EventContent } from "../../lib/supabase";
import { useToast } from "../../components/ui";
import { RichTextEditor } from "../../components/ui/RichTextEditor";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { HomePreview } from "../../components/preview/PreviewRenderers";

export default function HomeEditorPage() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [content, setContent] = useState<EventContent>(event.draft_content ?? event.content ?? {});

  useEffect(() => {
    setContent(event.draft_content ?? event.content ?? {});
  }, [event]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("user_events")
        .update({ draft_content: content })
        .eq("id", event.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", event.id] });
      toast("Home content saved", "success");
    },
    onError: (err: Error) => toast(err.message, "error"),
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      saveMutation.mutate();
    }, 2000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  const previewEvent = {
    ...event,
    draft_content: content,
  } as UserEvent;

  return (
    <SplitEditor preview={<HomePreview event={previewEvent} />}>
      <h3 className="text-sm font-semibold text-gray-900">Home content</h3>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Title</label>
        <RichTextEditor
          value={content.rich_title || ""}
          onChange={(html) => setContent((c) => ({ ...c, rich_title: html }))}
          placeholder="Your event title..."
          minHeight={100}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Subtitle</label>
        <RichTextEditor
          value={content.rich_subtitle || ""}
          onChange={(html) => setContent((c) => ({ ...c, rich_subtitle: html }))}
          placeholder="Your event subtitle..."
          minHeight={80}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Body</label>
        <RichTextEditor
          value={content.rich_body || ""}
          onChange={(html) => setContent((c) => ({ ...c, rich_body: html }))}
          placeholder="Your event description, story, or details..."
          minHeight={160}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">RSVP button text</label>
        <input
          type="text"
          value={content.rsvp_button_text || ""}
          onChange={(e) => setContent((c) => ({ ...c, rsvp_button_text: e.target.value }))}
          placeholder="RSVP"
          className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
        />
      </div>

      {saveMutation.isPending && (
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Loader2 className="h-3 w-3 animate-spin" />
          Saving...
        </div>
      )}
    </SplitEditor>
  );
}
