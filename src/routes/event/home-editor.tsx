import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import type { UserEvent, Json } from "../../lib/supabase";
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

function parseContent(json: Json | null | undefined): HomeContent {
  if (!json || typeof json !== "object") return { welcome: "", story: "", details: "" };
  const obj = json as Record<string, unknown>;
  return {
    welcome: (obj.welcome as string) ?? "",
    story: (obj.story as string) ?? "",
    details: (obj.details as string) ?? "",
  };
}

export function HomeEditor() {
  const { event, eventId } = useOutletContext<{ event: UserEvent; eventId: string }>();
  const queryClient = useQueryClient();

  const [content, setContent] = useState<HomeContent>(parseContent(event.draft_content));

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
      queryClient.invalidateQueries({ queryKey: ["user-event", eventId] });
    },
  });

  const editor = (
    <div className="space-y-5">
      <h2 className="text-lg font-semibold text-dash-text">Home Page</h2>
      <p className="text-sm text-dash-muted">
        Edit the three content sections that appear on your home page.
      </p>

      <FormField label="Welcome Message">
        <RichTextEditor
          value={content.welcome}
          onChange={(html) => setContent((prev) => ({ ...prev, welcome: html }))}
          placeholder="Welcome to our wedding website..."
        />
      </FormField>

      <FormField label="Our Story">
        <RichTextEditor
          value={content.story}
          onChange={(html) => setContent((prev) => ({ ...prev, story: html }))}
          placeholder="Tell your love story..."
        />
      </FormField>

      <FormField label="Event Details">
        <RichTextEditor
          value={content.details}
          onChange={(html) => setContent((prev) => ({ ...prev, details: html }))}
          placeholder="Add event details, directions, accommodation info..."
        />
      </FormField>

      <div className="flex items-center gap-3 pt-2">
        <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
          Save Changes
        </Button>
        {saveMutation.isError && (
          <span className="text-sm text-dash-danger">
            {saveMutation.error instanceof Error ? saveMutation.error.message : "Save failed"}
          </span>
        )}
        {saveMutation.isSuccess && (
          <span className="text-sm text-green-600">Saved!</span>
        )}
      </div>
    </div>
  );

  const preview = (
    <div className="p-4">
      <HomePreview
        eventName={event.draft_name || event.name}
        eventDate={event.draft_event_date || event.event_date}
        eventTime={event.draft_event_time || event.event_time}
        venue={event.draft_venue || event.venue}
        address={event.draft_address || event.address}
        welcomeMessage={content.welcome}
        coverImage={event.draft_cover_image || event.cover_image}
      />
    </div>
  );

  return (
    <div className="h-[calc(100vh-140px)]">
      <SplitEditor editor={editor} preview={preview} editorRatio={0.5} />
    </div>
  );
}
