import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Json } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { HomePreview } from "../../components/preview/PreviewRenderers";
import { Button } from "../../components/ui/Button";
import { RichTextEditor } from "../../components/ui/RichTextEditor";
import { FormField } from "../../components/ui";

interface HomeContent {
  welcome: string;
  story: string;
  details: string;
}

function parseContent(raw: Json | null | undefined): HomeContent {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { welcome: "", story: "", details: "" };
  }
  const obj = raw as Record<string, unknown>;
  return {
    welcome: typeof obj.welcome === "string" ? obj.welcome : "",
    story: typeof obj.story === "string" ? obj.story : "",
    details: typeof obj.details === "string" ? obj.details : "",
  };
}

export const HomeEditor: React.FC = () => {
  const { event, eventId } = useEventContext();
  const queryClient = useQueryClient();

  const [content, setContent] = useState<HomeContent>(() => parseContent(event.draft_content));
  const [saved, setSaved] = useState(false);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("user_events")
        .update({
          draft_content: content as unknown as Json,
        })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const handleSave = () => {
    saveMutation.mutate();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dash-text">Home Editor</h2>
          <p className="text-sm text-dash-muted">Customize the home page content sections.</p>
        </div>
        <Button onClick={handleSave} loading={saveMutation.isPending} disabled={saveMutation.isPending}>
          {saved ? "Saved!" : "Save Changes"}
        </Button>
      </div>

      {saveMutation.isError && (
        <p className="text-sm text-dash-danger">
          Error: {saveMutation.error instanceof Error ? saveMutation.error.message : "Save failed"}
        </p>
      )}

      <SplitEditor
        editor={
          <div className="space-y-6">
            <FormField label="Welcome Message">
              <RichTextEditor
                value={content.welcome}
                onChange={(html) => setContent((prev) => ({ ...prev, welcome: html }))}
                placeholder="Write a welcome message for your guests..."
              />
            </FormField>

            <FormField label="Our Story">
              <RichTextEditor
                value={content.story}
                onChange={(html) => setContent((prev) => ({ ...prev, story: html }))}
                placeholder="Share your love story..."
              />
            </FormField>

            <FormField label="Event Details">
              <RichTextEditor
                value={content.details}
                onChange={(html) => setContent((prev) => ({ ...prev, details: html }))}
                placeholder="Add additional details about the event..."
              />
            </FormField>
          </div>
        }
        preview={
          <div className="p-4">
            <HomePreview
              eventName={event.draft_name}
              eventType={event.draft_event_type}
              eventDate={event.draft_event_date}
              eventTime={event.draft_event_time}
              venue={event.draft_venue}
              address={event.draft_address}
              coverImage={event.draft_cover_image}
              welcomeMessage={content.welcome}
            />
          </div>
        }
        editorRatio={0.5}
      />
    </div>
  );
};
