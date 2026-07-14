import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Json } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { HomePreview } from "../../components/preview/PreviewRenderers";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { RichTextEditor } from "../../components/ui/RichTextEditor";

interface HomeContent {
  greeting?: string;
  title?: string;
  intro?: string;
  story?: string;
  details?: string;
}

export function HomeEditor() {
  const { event, eventId } = useEventContext();
  const queryClient = useQueryClient();

  const initial = (event.draft_content ?? event.content) as HomeContent | null;

  const [content, setContent] = useState<HomeContent>({
    greeting: initial?.greeting ?? "",
    title: initial?.title ?? "",
    intro: initial?.intro ?? "",
    story: initial?.story ?? "",
    details: initial?.details ?? "",
  });

  useEffect(() => {
    setContent({
      greeting: initial?.greeting ?? "",
      title: initial?.title ?? "",
      intro: initial?.intro ?? "",
      story: initial?.story ?? "",
      details: initial?.details ?? "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event.updated_at]);

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

  return (
    <SplitEditor
      editor={
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-dash-text">Home Page Editor</h2>
          <p className="text-sm text-dash-muted">
            Customize the content shown on your event home page.
          </p>

          <Input
            label="Greeting"
            type="text"
            value={content.greeting ?? ""}
            onChange={(e) => setContent((p) => ({ ...p, greeting: e.target.value }))}
            placeholder="Welcome to our wedding"
          />

          <Input
            label="Title"
            type="text"
            value={content.title ?? ""}
            onChange={(e) => setContent((p) => ({ ...p, title: e.target.value }))}
            placeholder="Our Special Day"
          />

          <div>
            <label className="mb-1.5 block text-sm font-medium text-dash-text">
              Intro
            </label>
            <RichTextEditor
              value={content.intro ?? ""}
              onChange={(html) => setContent((p) => ({ ...p, intro: html }))}
              placeholder="Write a brief introduction..."
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-dash-text">
              Our Story
            </label>
            <RichTextEditor
              value={content.story ?? ""}
              onChange={(html) => setContent((p) => ({ ...p, story: html }))}
              placeholder="Tell your love story..."
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-dash-text">
              Event Details
            </label>
            <RichTextEditor
              value={content.details ?? ""}
              onChange={(html) => setContent((p) => ({ ...p, details: html }))}
              placeholder="Add event details..."
            />
          </div>

          <Button
            onClick={() => saveMutation.mutate()}
            loading={saveMutation.isPending}
            className="w-full"
          >
            Save Changes
          </Button>
          {saveMutation.isError && (
            <p className="text-sm text-dash-danger">
              {saveMutation.error instanceof Error ? saveMutation.error.message : "Save failed"}
            </p>
          )}
          {saveMutation.isSuccess && (
            <p className="text-sm text-green-600">Saved successfully!</p>
          )}
        </div>
      }
      preview={
        <div className="event-themed min-h-[500px]">
          <HomePreview
            content={content as unknown as Json}
            eventName={event.draft_name || event.name}
            eventDate={event.draft_event_date}
            venue={event.draft_venue}
          />
        </div>
      }
    />
  );
}
