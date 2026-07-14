import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Json } from "../../lib/supabase";
import { useOutletContext } from "./event-layout";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { HomePreview } from "../../components/preview/PreviewRenderers";
import { RichTextEditor } from "../../components/ui/RichTextEditor";
import { Button } from "../../components/ui/Button";

interface HomeContent {
  intro?: string;
  story?: string;
  details?: string;
}

const DEFAULT_CONTENT: HomeContent = {
  intro: "",
  story: "",
  details: "",
};

export default function HomeEditor() {
  const { event, eventId } = useOutletContext();
  const queryClient = useQueryClient();

  const existingContent = (event.draft_content ?? event.content) as HomeContent;

  const [content, setContent] = useState<HomeContent>({
    intro: existingContent?.intro ?? "",
    story: existingContent?.story ?? "",
    details: existingContent?.details ?? "",
  });
  const [savedEvent, setSavedEvent] = useState(event);

  useEffect(() => {
    setSavedEvent(event);
  }, [event]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("user_events")
        .update({
          draft_content: content as unknown as Json,
        })
        .eq("id", eventId)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["user_event", eventId] });
      if (data) setSavedEvent(data as typeof event);
    },
  });

  const previewEvent = {
    ...savedEvent,
    draft_content: content as unknown as Json,
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-dash-text">Home Editor</h2>
        <Button
          onClick={() => saveMutation.mutate()}
          loading={saveMutation.isPending}
        >
          Save Changes
        </Button>
      </div>

      {saveMutation.isError && (
        <p className="mb-2 text-sm text-dash-danger">
          {saveMutation.error instanceof Error
            ? saveMutation.error.message
            : "Failed to save"}
        </p>
      )}
      {saveMutation.isSuccess && (
        <p className="mb-2 text-sm text-green-600">Changes saved successfully!</p>
      )}

      <div className="flex-1 overflow-hidden rounded-lg border border-dash-border">
        <SplitEditor
          editor={
            <div className="flex flex-col gap-6">
              <div>
                <label className="mb-1 block text-sm font-medium text-dash-text">
                  Introduction
                </label>
                <RichTextEditor
                  value={content.intro ?? ""}
                  onChange={(html) => setContent((c) => ({ ...c, intro: html }))}
                  placeholder="Welcome message for your guests..."
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-dash-text">
                  Our Story
                </label>
                <RichTextEditor
                  value={content.story ?? ""}
                  onChange={(html) => setContent((c) => ({ ...c, story: html }))}
                  placeholder="Share your story..."
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-dash-text">
                  Additional Details
                </label>
                <RichTextEditor
                  value={content.details ?? ""}
                  onChange={(html) => setContent((c) => ({ ...c, details: html }))}
                  placeholder="Any extra information for guests..."
                />
              </div>
            </div>
          }
          preview={<HomePreview event={previewEvent} draft />}
          editorRatio={0.5}
        />
      </div>
    </div>
  );
}
