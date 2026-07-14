import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type Json } from "../../lib/supabase";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { HomePreview } from "../../components/preview/PreviewRenderers";
import { RichTextEditor } from "../../components/ui/RichTextEditor";
import { Button } from "../../components/ui/Button";

interface ContentConfig {
  story?: string;
  schedule?: string;
  venue?: string;
}

export default function HomeEditor() {
  const { event, eventId } = useOutletContext<{ event: UserEvent; eventId: string }>();
  const queryClient = useQueryClient();

  const config = (event.draft_content ?? event.content ?? {}) as ContentConfig;

  const [story, setStory] = useState(config.story ?? "");
  const [schedule, setSchedule] = useState(config.schedule ?? "");
  const [venue, setVenue] = useState(config.venue ?? "");
  const [saved, setSaved] = useState(false);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const newConfig: ContentConfig = { story, schedule, venue };
      const { error } = await supabase
        .from("user_events")
        .update({ draft_content: newConfig as unknown as Json })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const previewEvent: Partial<UserEvent> = {
    ...event,
    content: { story, schedule, venue },
  };

  return (
    <div className="mx-auto max-w-7xl p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-dash-text">Home Editor</h2>
        <div className="flex items-center gap-2">
          {saved && <span className="text-sm text-green-600">Saved!</span>}
          <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
            Save Changes
          </Button>
        </div>
      </div>

      <div className="h-[calc(100vh-200px)]">
        <SplitEditor
          editor={
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-dash-text">
                  Our Story
                </label>
                <RichTextEditor
                  value={story}
                  onChange={setStory}
                  placeholder="Tell your story..."
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-dash-text">
                  Schedule Info
                </label>
                <RichTextEditor
                  value={schedule}
                  onChange={setSchedule}
                  placeholder="Add schedule details..."
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-dash-text">
                  Venue Info
                </label>
                <RichTextEditor
                  value={venue}
                  onChange={setVenue}
                  placeholder="Add venue details..."
                />
              </div>
              {saveMutation.isError && (
                <p className="text-sm text-red-600">
                  {saveMutation.error instanceof Error ? saveMutation.error.message : "Save failed."}
                </p>
              )}
            </div>
          }
          preview={<HomePreview event={previewEvent} />}
        />
      </div>
    </div>
  );
}
