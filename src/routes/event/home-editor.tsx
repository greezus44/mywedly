import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Json } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { HomePreview } from "../../components/preview/PreviewRenderers";
import { RichTextEditor } from "../../components/ui/RichTextEditor";
import { Button } from "../../components/ui/Button";
import { EventThemeProvider } from "../../lib/theme-context";

interface HomeContent {
  welcomeHeading?: string;
  welcomeBody?: string;
  storyHeading?: string;
  storyBody?: string;
  rsvpHeading?: string;
  rsvpBody?: string;
}

export default function HomeEditor() {
  const { event, eventId } = useEventContext();
  const queryClient = useQueryClient();

  const currentContent = (event.content ?? {}) as HomeContent;
  const [welcomeHeading, setWelcomeHeading] = useState(currentContent.welcomeHeading ?? "Welcome");
  const [welcomeBody, setWelcomeBody] = useState(
    currentContent.welcomeBody ?? "We can't wait to share our special day with you."
  );
  const [storyHeading, setStoryHeading] = useState(currentContent.storyHeading ?? "Our Story");
  const [storyBody, setStoryBody] = useState(currentContent.storyBody ?? "");
  const [rsvpHeading, setRsvpHeading] = useState(currentContent.rsvpHeading ?? "RSVP");
  const [rsvpBody, setRsvpBody] = useState(currentContent.rsvpBody ?? "Will you be joining us?");

  const draftEvent: typeof event = {
    ...event,
    content: {
      ...currentContent,
      welcomeHeading,
      welcomeBody,
      storyHeading,
      storyBody,
      rsvpHeading,
      rsvpBody,
    } as Json,
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const newContent: HomeContent = {
        ...currentContent,
        welcomeHeading,
        welcomeBody,
        storyHeading,
        storyBody,
        rsvpHeading,
        rsvpBody,
      };
      const { error } = await supabase
        .from("user_events")
        .update({ content: newContent as Json })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-dash-text">Home Editor</h2>
          <p className="text-sm text-dash-muted">Edit the content sections of your home page.</p>
        </div>
        <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
          Save Changes
        </Button>
      </div>

      {saveMutation.isError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          Error saving: {saveMutation.error?.message}
        </div>
      )}
      {saveMutation.isSuccess && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">
          Home content saved successfully!
        </div>
      )}

      <SplitEditor
        editor={
          <div className="space-y-6">
            {/* Welcome Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-dash-text border-b border-dash-border pb-1">
                Welcome Section
              </h3>
              <div>
                <label className="block text-sm font-medium text-dash-text mb-1">Heading</label>
                <input
                  type="text"
                  value={welcomeHeading}
                  onChange={(e) => setWelcomeHeading(e.target.value)}
                  className="w-full rounded-md border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text focus:outline-none focus:ring-2 focus:ring-dash-primary/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dash-text mb-1">Body Text</label>
                <RichTextEditor
                  value={welcomeBody}
                  onChange={setWelcomeBody}
                  placeholder="Welcome message..."
                />
              </div>
            </div>

            {/* Story Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-dash-text border-b border-dash-border pb-1">
                Story Section
              </h3>
              <div>
                <label className="block text-sm font-medium text-dash-text mb-1">Heading</label>
                <input
                  type="text"
                  value={storyHeading}
                  onChange={(e) => setStoryHeading(e.target.value)}
                  className="w-full rounded-md border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text focus:outline-none focus:ring-2 focus:ring-dash-primary/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dash-text mb-1">Body Text</label>
                <RichTextEditor
                  value={storyBody}
                  onChange={setStoryBody}
                  placeholder="Tell your story..."
                />
              </div>
            </div>

            {/* RSVP Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-dash-text border-b border-dash-border pb-1">
                RSVP Section
              </h3>
              <div>
                <label className="block text-sm font-medium text-dash-text mb-1">Heading</label>
                <input
                  type="text"
                  value={rsvpHeading}
                  onChange={(e) => setRsvpHeading(e.target.value)}
                  className="w-full rounded-md border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text focus:outline-none focus:ring-2 focus:ring-dash-primary/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dash-text mb-1">Body Text</label>
                <RichTextEditor
                  value={rsvpBody}
                  onChange={setRsvpBody}
                  placeholder="RSVP message..."
                />
              </div>
            </div>
          </div>
        }
        preview={
          <EventThemeProvider theme={event.theme}>
            <HomePreview event={draftEvent} />
          </EventThemeProvider>
        }
      />
    </div>
  );
}
