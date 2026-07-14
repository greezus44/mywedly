import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type Json } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui";
import { RichTextEditor } from "../../components/ui/RichTextEditor";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { HomePreview } from "../../components/preview/PreviewRenderers";
import type { EventOutletContext } from "./event-layout";

interface HomeContent {
  intro?: string;
  story?: string;
  details?: string;
}

function getHomeContent(event: UserEvent): HomeContent {
  const draft = event.draft_content as Record<string, unknown> | null;
  const published = event.content as Record<string, unknown> | null;
  const cfg = (draft ?? published ?? {}) as Record<string, unknown>;
  return {
    intro: (cfg.intro as string) || "",
    story: (cfg.story as string) || "",
    details: (cfg.details as string) || "",
  };
}

export default function HomeEditor(): React.ReactElement {
  const { event, eventId } = useOutletContext<EventOutletContext>();
  const queryClient = useQueryClient();

  const [content, setContent] = useState<HomeContent>(() => getHomeContent(event));

  useEffect(() => {
    setContent(getHomeContent(event));
  }, [event]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("user_events")
        .update({ draft_content: content as unknown as Json })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-event", eventId] });
    },
  });

  const previewEvent: UserEvent = {
    ...event,
    content: { ...content },
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dash-text">Home Page</h2>
          <p className="mt-1 text-sm text-dash-muted">
            Edit the content sections of your home page
          </p>
        </div>
        <Button
          onClick={() => saveMutation.mutate()}
          loading={saveMutation.isPending}
          disabled={saveMutation.isPending}
        >
          Save Changes
        </Button>
      </div>

      {saveMutation.isError && (
        <div className="mb-4 rounded-md border border-dash-danger/20 bg-dash-danger/5 px-4 py-3">
          <p className="text-sm text-dash-danger">
            {saveMutation.error instanceof Error ? saveMutation.error.message : "Failed to save"}
          </p>
        </div>
      )}
      {saveMutation.isSuccess && (
        <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3">
          <p className="text-sm text-green-700">Changes saved successfully</p>
        </div>
      )}

      <SplitEditor
        editor={
          <div className="space-y-6 p-5">
            <Card>
              <h3 className="text-sm font-semibold text-dash-text mb-1">Introduction</h3>
              <p className="text-xs text-dash-muted mb-3">
                The main welcome message at the top of your home page
              </p>
              <RichTextEditor
                value={content.intro ?? ""}
                onChange={(html) => setContent({ ...content, intro: html })}
                placeholder="Write your welcome message..."
              />
            </Card>

            <Card>
              <h3 className="text-sm font-semibold text-dash-text mb-1">Our Story</h3>
              <p className="text-xs text-dash-muted mb-3">
                Share the story of how you met or your journey together
              </p>
              <RichTextEditor
                value={content.story ?? ""}
                onChange={(html) => setContent({ ...content, story: html })}
                placeholder="Tell your story..."
              />
            </Card>

            <Card>
              <h3 className="text-sm font-semibold text-dash-text mb-1">Event Details</h3>
              <p className="text-xs text-dash-muted mb-3">
                Additional information about your event
              </p>
              <RichTextEditor
                value={content.details ?? ""}
                onChange={(html) => setContent({ ...content, details: html })}
                placeholder="Add event details..."
              />
            </Card>
          </div>
        }
        preview={
          <div className="event-themed bg-event-bg">
            <HomePreview event={previewEvent} />
          </div>
        }
      />
    </div>
  );
}
