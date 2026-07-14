import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { HomePreview } from "../../components/preview/PreviewRenderers";
import { RichTextEditor } from "../../components/ui/RichTextEditor";
import { Button } from "../../components/ui/Button";

type ContentConfig = {
  welcome?: string;
  story?: string;
  schedule?: string;
};

function parseConfig(json: unknown): ContentConfig {
  if (!json || typeof json !== "object") return {};
  return (json as Record<string, unknown>) as ContentConfig;
}

export default function HomeEditor() {
  const { event, eventId } = useEventContext();
  const queryClient = useQueryClient();

  const existing = parseConfig(event.draft_content ?? event.content);
  const [welcome, setWelcome] = useState(existing.welcome ?? "");
  const [story, setStory] = useState(existing.story ?? "");
  const [schedule, setSchedule] = useState(existing.schedule ?? "");
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const config: ContentConfig = { welcome, story, schedule };
      const { error } = await supabase
        .from("user_events")
        .update({
          draft_content: config,
          updated_at: new Date().toISOString(),
        })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      setSavedMsg("Saved successfully!");
      setTimeout(() => setSavedMsg(null), 3000);
    },
  });

  const previewEvent = {
    ...event,
    content: { welcome, story, schedule },
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-dash-text">Home Editor</h1>
          <p className="text-sm text-dash-muted">
            Customize the content sections on your home page.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {savedMsg && <span className="text-sm text-green-600">{savedMsg}</span>}
          <Button
            loading={saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
          >
            Save Changes
          </Button>
        </div>
      </div>

      {saveMutation.isError && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-dash-danger">
          {saveMutation.error?.message}
        </p>
      )}

      <SplitEditor
        editor={
          <div className="flex flex-col gap-6">
            {/* Welcome section */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-dash-text">
                Welcome Section
              </label>
              <RichTextEditor
                value={welcome}
                onChange={setWelcome}
                placeholder="Write a welcome message for your guests..."
              />
            </div>

            {/* Story section */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-dash-text">
                Our Story Section
              </label>
              <RichTextEditor
                value={story}
                onChange={setStory}
                placeholder="Share your love story..."
              />
            </div>

            {/* Schedule section */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-dash-text">
                Schedule Overview Section
              </label>
              <RichTextEditor
                value={schedule}
                onChange={setSchedule}
                placeholder="Give a brief overview of the day's schedule..."
              />
            </div>
          </div>
        }
        preview={<HomePreview event={previewEvent} />}
      />
    </div>
  );
}
