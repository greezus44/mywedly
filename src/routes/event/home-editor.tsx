import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type Json } from "../../lib/supabase";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { HomePreview } from "../../components/preview/PreviewRenderers";
import { RichTextEditor } from "../../components/ui/RichTextEditor";
import { FormField } from "../../components/ui";
import { Button } from "../../components/ui/Button";

interface HomeContent {
  section1?: string;
  section2?: string;
  section3?: string;
  [key: string]: any;
}

export default function HomeEditor() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();

  const currentContent = (event.draft_content ?? event.content ?? {}) as HomeContent;

  const [content, setContent] = useState<HomeContent>({
    section1: currentContent.section1 || "",
    section2: currentContent.section2 || "",
    section3: currentContent.section3 || "",
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("user_events")
        .update({ draft_content: content as Json })
        .eq("id", event.id)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_events", event.id] });
    },
    onError: () => {},
  });

  const previewEvent: Partial<UserEvent> = {
    ...event,
    content: content as Json,
    name: event.draft_name ?? event.name,
    event_date: event.draft_event_date ?? event.event_date,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dash-text">Home Page Editor</h2>
          <p className="mt-1 text-sm text-dash-muted">Customize the welcome message and content sections.</p>
        </div>
        <Button loading={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
          Save Changes
        </Button>
      </div>

      {saveMutation.isError && (
        <div className="rounded-md border border-dash-danger/30 bg-red-50 px-4 py-3 text-sm text-dash-danger">
          Failed to save. Please try again.
        </div>
      )}
      {saveMutation.isSuccess && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Changes saved successfully.
        </div>
      )}

      <SplitEditor
        editor={
          <div className="space-y-6">
            <FormField label="Section 1" hint="Welcome message or introduction.">
              <RichTextEditor
                value={content.section1 || ""}
                onChange={(html) => setContent({ ...content, section1: html })}
                placeholder="Write your welcome message..."
              />
            </FormField>
            <FormField label="Section 2" hint="Additional content, story, or details.">
              <RichTextEditor
                value={content.section2 || ""}
                onChange={(html) => setContent({ ...content, section2: html })}
                placeholder="Write additional content..."
              />
            </FormField>
            <FormField label="Section 3" hint="Closing message or additional info.">
              <RichTextEditor
                value={content.section3 || ""}
                onChange={(html) => setContent({ ...content, section3: html })}
                placeholder="Write closing content..."
              />
            </FormField>
          </div>
        }
        preview={<HomePreview event={previewEvent} />}
      />
    </div>
  );
}
