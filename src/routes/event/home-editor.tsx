import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase, type UserEvent, type Json } from "../../lib/supabase";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { HomePreview } from "../../components/preview/PreviewRenderers";
import { Button } from "../../components/ui/Button";
import { RichTextEditor } from "../../components/ui/RichTextEditor";

interface HomeContent {
  homeTitle: string;
  homeBody: string;
  homeExtra: string;
}

const DEFAULT_CONTENT: HomeContent = {
  homeTitle: "",
  homeBody: "",
  homeExtra: "",
};

function parseContent(json: Json | null | undefined): HomeContent {
  if (!json || typeof json !== "object" || Array.isArray(json)) return DEFAULT_CONTENT;
  const obj = json as Record<string, unknown>;
  return {
    homeTitle: typeof obj.homeTitle === "string" ? obj.homeTitle : "",
    homeBody: typeof obj.homeBody === "string" ? obj.homeBody : "",
    homeExtra: typeof obj.homeExtra === "string" ? obj.homeExtra : "",
  };
}

export function HomeEditor() {
  const { event, eventId } = useOutletContext<{ event: UserEvent; eventId: string }>();
  const queryClient = useQueryClient();
  const [content, setContent] = useState<HomeContent>(() => {
    const parsed = parseContent(event.draft_content);
    return {
      homeTitle: parsed.homeTitle,
      homeBody: parsed.homeBody,
      homeExtra: parsed.homeExtra,
    };
  });
  const [savedMsg, setSavedMsg] = useState(false);

  useEffect(() => {
    const parsed = parseContent(event.draft_content);
    setContent({
      homeTitle: parsed.homeTitle,
      homeBody: parsed.homeBody,
      homeExtra: parsed.homeExtra,
    });
  }, [event.draft_content]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      // Merge with existing content to preserve other fields (cover, login, rsvp)
      const existing = parseContent(event.draft_content);
      const merged = {
        ...existing,
        homeTitle: content.homeTitle,
        homeBody: content.homeBody,
        homeExtra: content.homeExtra,
      };
      const { error } = await supabase
        .from("user_events")
        .update({ draft_content: merged as unknown as Json })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 2000);
    },
  });

  const previewEvent = {
    name: event.draft_name,
    event_type: event.draft_event_type,
    event_date: event.draft_event_date,
    event_time: event.draft_event_time,
    venue: event.draft_venue,
    address: event.draft_address,
    content: {
      homeTitle: content.homeTitle,
      homeBody: content.homeBody,
    } as unknown as Json,
  };

  return (
    <SplitEditor
      editor={
        <div className="p-5 space-y-5">
          <h2 className="text-lg font-semibold text-dash-text">Home Editor</h2>
          <p className="text-sm text-dash-muted">
            Customize the content sections on your home page.
          </p>

          {/* Section 1: Welcome Title */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-dash-text">
              Welcome Title
            </label>
            <RichTextEditor
              value={content.homeTitle}
              onChange={(html) => setContent({ ...content, homeTitle: html })}
              placeholder="Enter your welcome title..."
            />
          </div>

          {/* Section 2: Welcome Body */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-dash-text">
              Welcome Message
            </label>
            <RichTextEditor
              value={content.homeBody}
              onChange={(html) => setContent({ ...content, homeBody: html })}
              placeholder="Enter your welcome message..."
            />
          </div>

          {/* Section 3: Extra Content */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-dash-text">
              Additional Content
            </label>
            <RichTextEditor
              value={content.homeExtra}
              onChange={(html) => setContent({ ...content, homeExtra: html })}
              placeholder="Add any additional content (story, details, etc.)..."
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
              Save Changes
            </Button>
            {saveMutation.isError && (
              <span className="text-sm text-dash-danger">
                {saveMutation.error instanceof Error ? saveMutation.error.message : "Save failed"}
              </span>
            )}
            {savedMsg && <span className="text-sm text-green-600">Saved!</span>}
          </div>
        </div>
      }
      preview={<HomePreview event={previewEvent} />}
    />
  );
}
