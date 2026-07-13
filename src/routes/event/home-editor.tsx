import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type Json } from "../../lib/supabase";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { HomePreview } from "../../components/preview/PreviewRenderers";
import { RichTextEditor } from "../../components/ui/RichTextEditor";
import { Button, Card } from "../../components/ui";

interface HomeContent {
  welcome?: string;
  story?: string;
  details?: string;
}

export default function HomeEditor() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();

  const [content, setContent] = useState<HomeContent>(() => {
    const c = event.draft_content ?? event.content;
    return (c as HomeContent) ?? {};
  });
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  useEffect(() => {
    const c = event.draft_content ?? event.content;
    setContent((c as HomeContent) ?? {});
  }, [event]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("user_events")
        .update({
          draft_content: content as unknown as Json,
        })
        .eq("id", event.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_events", event.id] });
      setSavedMsg("Saved successfully");
      setTimeout(() => setSavedMsg(null), 3000);
    },
  });

  const previewEvent = {
    ...event,
    draft_content: content as unknown as Json,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dash-text">Home Page</h2>
          <p className="text-sm text-dash-muted">Edit the content sections of your home page.</p>
        </div>
        <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
          Save Changes
        </Button>
      </div>
      {saveMutation.isError && (
        <p className="text-sm text-dash-danger">
          {saveMutation.error instanceof Error ? saveMutation.error.message : "Failed to save"}
        </p>
      )}
      {savedMsg && <p className="text-sm text-green-600">{savedMsg}</p>}

      <SplitEditor
        editor={
          <div className="space-y-4">
            <Card>
              <h3 className="mb-3 text-sm font-semibold text-dash-text">Welcome Message</h3>
              <RichTextEditor
                value={content.welcome ?? ""}
                onChange={(html) => setContent({ ...content, welcome: html })}
                placeholder="Write a welcome message for your guests…"
              />
            </Card>
            <Card>
              <h3 className="mb-3 text-sm font-semibold text-dash-text">Our Story</h3>
              <RichTextEditor
                value={content.story ?? ""}
                onChange={(html) => setContent({ ...content, story: html })}
                placeholder="Tell your love story…"
              />
            </Card>
            <Card>
              <h3 className="mb-3 text-sm font-semibold text-dash-text">Event Details</h3>
              <RichTextEditor
                value={content.details ?? ""}
                onChange={(html) => setContent({ ...content, details: html })}
                placeholder="Add any additional details about the event…"
              />
            </Card>
          </div>
        }
        preview={<HomePreview event={previewEvent} />}
      />
    </div>
  );
}
