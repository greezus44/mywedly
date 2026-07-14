import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Json } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { HomePreview } from "../../components/preview/PreviewRenderers";
import { RichTextEditor } from "../../components/ui/RichTextEditor";
import { Button } from "../../components/ui/Button";
import { FormField } from "../../components/ui";

interface HomeContent {
  welcome?: string;
  story?: string;
  details?: string;
}

const DEFAULT_CONTENT: HomeContent = {
  welcome: "Welcome to our wedding",
  story: "",
  details: "",
};

export function HomeEditor() {
  const { event, eventId } = useEventContext();
  const queryClient = useQueryClient();

  const existing = (event.draft_content as HomeContent | null) ?? {};
  const merged: HomeContent = { ...DEFAULT_CONTENT, ...existing };

  const [welcome, setWelcome] = useState(merged.welcome ?? "");
  const [story, setStory] = useState(merged.story ?? "");
  const [details, setDetails] = useState(merged.details ?? "");
  const [savedMsg, setSavedMsg] = useState(false);

  useEffect(() => {
    const c = (event.draft_content as HomeContent | null) ?? {};
    const m: HomeContent = { ...DEFAULT_CONTENT, ...c };
    setWelcome(m.welcome ?? "");
    setStory(m.story ?? "");
    setDetails(m.details ?? "");
  }, [event]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const content: HomeContent = { welcome, story, details };
      const { error } = await supabase
        .from("user_events")
        .update({ draft_content: content as unknown as Json })
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
    ...event,
    home_welcome: welcome,
    home_title: event.draft_name || event.name,
  };

  return (
    <SplitEditor
      editor={
        <div className="space-y-6">
          <div>
            <h2 className="mb-4 text-lg font-semibold text-dash-text">Home Page Editor</h2>
            <p className="mb-4 text-sm text-dash-muted">
              Customize the content sections on your home page.
            </p>
          </div>

          <FormField label="Welcome Heading">
            <RichTextEditor
              value={welcome}
              onChange={setWelcome}
              placeholder="Welcome to our wedding..."
            />
          </FormField>

          <FormField label="Our Story">
            <RichTextEditor
              value={story}
              onChange={setStory}
              placeholder="Tell your love story..."
            />
          </FormField>

          <FormField label="Event Details">
            <RichTextEditor
              value={details}
              onChange={setDetails}
              placeholder="Add venue, dress code, parking info, etc..."
            />
          </FormField>

          <div className="flex items-center gap-3 border-t border-dash-border pt-4">
            <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
              Save Changes
            </Button>
            {savedMsg && <span className="text-sm text-green-600">Saved!</span>}
            {saveMutation.isError && (
              <span className="text-sm text-dash-danger">
                {saveMutation.error instanceof Error ? saveMutation.error.message : "Save failed"}
              </span>
            )}
          </div>
        </div>
      }
      preview={
        <div className="p-4">
          <HomePreview event={previewEvent} />
        </div>
      }
    />
  );
}
