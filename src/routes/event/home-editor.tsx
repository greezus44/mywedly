import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type Json } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { HomePreview } from "../../components/preview/PreviewRenderers";
import { RichTextEditor } from "../../components/ui/RichTextEditor";

interface HomeContent {
  section1?: string;
  section2?: string;
  section3?: string;
}

function jsonToContent(json: Json | null | undefined): HomeContent {
  if (!json || typeof json !== "object") return {};
  return json as HomeContent;
}

export default function HomeEditor() {
  const { event, eventId } = useOutletContext<{ event: UserEvent; eventId: string }>();
  const queryClient = useQueryClient();

  const content = jsonToContent(event.draft_content ?? event.content);
  const [section1, setSection1] = useState<string>(content.section1 ?? "");
  const [section2, setSection2] = useState<string>(content.section2 ?? "");
  const [section3, setSection3] = useState<string>(content.section3 ?? "");

  useEffect(() => {
    const c = jsonToContent(event.draft_content ?? event.content);
    setSection1(c.section1 ?? "");
    setSection2(c.section2 ?? "");
    setSection3(c.section3 ?? "");
  }, [event]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const newContent: HomeContent = { section1, section2, section3 };
      const { error } = await supabase
        .from("user_events")
        .update({ draft_content: newContent as unknown as Json })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
    },
  });

  const previewEvent: Partial<UserEvent> = {
    ...event,
    draft_content: { section1, section2, section3 } as unknown as Json,
  };

  return (
    <div className="flex h-[calc(100vh-180px)] flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Home Editor</h2>
          <p className="text-sm text-muted">
            Edit the content sections for your home page.
          </p>
        </div>
        <Button
          onClick={() => saveMutation.mutate()}
          loading={saveMutation.isPending}
        >
          Save Changes
        </Button>
      </div>

      {saveMutation.isError && (
        <p className="text-sm text-danger">
          {saveMutation.error instanceof Error
            ? saveMutation.error.message
            : "Failed to save"}
        </p>
      )}
      {saveMutation.isSuccess && (
        <p className="text-sm text-success">Saved successfully!</p>
      )}

      <SplitEditor
        editor={
          <div className="flex flex-col gap-4 p-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">
                Our Story
              </label>
              <RichTextEditor
                value={section1}
                onChange={setSection1}
                placeholder="Tell your story..."
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">
                Event Details
              </label>
              <RichTextEditor
                value={section2}
                onChange={setSection2}
                placeholder="Share details about your event..."
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">
                Travel & Accommodation
              </label>
              <RichTextEditor
                value={section3}
                onChange={setSection3}
                placeholder="Share travel and accommodation info..."
              />
            </div>
          </div>
        }
        preview={<HomePreview event={previewEvent} />}
      />
    </div>
  );
}
