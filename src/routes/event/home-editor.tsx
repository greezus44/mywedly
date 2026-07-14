import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Json } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { HomePreview } from "../../components/preview/PreviewRenderers";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui";
import { RichTextEditor } from "../../components/ui/RichTextEditor";

interface HomeContent {
  intro?: string;
  body?: string;
  outro?: string;
}

export function HomeEditor() {
  const { event, eventId } = useEventContext();
  const queryClient = useQueryClient();

  const [content, setContent] = useState<HomeContent>(
    (event.draft_content ?? {}) as HomeContent,
  );

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("user_events")
        .update({
          draft_content: content as unknown as Json,
          updated_at: new Date().toISOString(),
        })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
    },
  });

  const editor = (
    <div className="space-y-6">
      <Card>
        <h3 className="text-sm font-medium text-dash-text mb-4">Introduction</h3>
        <RichTextEditor
          value={content.intro ?? ""}
          onChange={(html) => setContent((prev) => ({ ...prev, intro: html }))}
          placeholder="Write a warm welcome message for your guests..."
        />
      </Card>

      <Card>
        <h3 className="text-sm font-medium text-dash-text mb-4">Main Content</h3>
        <RichTextEditor
          value={content.body ?? ""}
          onChange={(html) => setContent((prev) => ({ ...prev, body: html }))}
          placeholder="Share the details of your celebration..."
        />
      </Card>

      <Card>
        <h3 className="text-sm font-medium text-dash-text mb-4">Closing Message</h3>
        <RichTextEditor
          value={content.outro ?? ""}
          onChange={(html) => setContent((prev) => ({ ...prev, outro: html }))}
          placeholder="Add a closing note or additional information..."
        />
      </Card>

      <div className="space-y-2">
        {saveMutation.isError && (
          <p className="text-sm text-dash-danger">
            Error: {(saveMutation.error as Error)?.message}
          </p>
        )}
        {saveMutation.isSuccess && (
          <p className="text-sm text-green-600">Changes saved successfully!</p>
        )}
        <Button
          onClick={() => saveMutation.mutate()}
          loading={saveMutation.isPending}
          className="w-full"
        >
          Save Changes
        </Button>
      </div>
    </div>
  );

  const preview = <HomePreview event={event} />;

  return (
    <div className="h-[calc(100vh-8rem)]">
      <SplitEditor editor={editor} preview={preview} previewClassName="overflow-hidden" />
    </div>
  );
}
