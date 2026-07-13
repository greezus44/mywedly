import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { supabase, type UserEvent, type EventContent } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Card, Toast, type ToastType } from "../../components/ui";
import { RichTextEditor } from "../../components/ui/RichTextEditor";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { HomePreview } from "../../components/preview/PreviewRenderers";

export default function HomeEditorPage() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const content: EventContent = event.draft_content ?? event.content ?? {};
  const [richTitle, setRichTitle] = useState<string>(content.rich_title ?? "");
  const [richSubtitle, setRichSubtitle] = useState<string>(
    content.rich_subtitle ?? "",
  );
  const [richBody, setRichBody] = useState<string>(content.rich_body ?? "");

  const updateMutation = useMutation({
    mutationFn: async (updates: Record<string, unknown>) => {
      const { error } = await supabase
        .from("user_events")
        .update(updates)
        .eq("id", event.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", event.id] });
      setToast({ message: "Saved!", type: "success" });
    },
    onError: (err: Error) => {
      setToast({ message: err.message, type: "error" });
    },
  });

  const handleSave = () => {
    const newContent: EventContent = {
      ...content,
      rich_title: richTitle,
      rich_subtitle: richSubtitle,
      rich_body: richBody,
    };
    updateMutation.mutate({ draft_content: newContent });
  };

  const previewEvent: UserEvent = {
    ...event,
    draft_content: {
      ...content,
      rich_title: richTitle,
      rich_subtitle: richSubtitle,
      rich_body: richBody,
    },
  };

  return (
    <div className="h-full overflow-y-auto p-4">
      <SplitEditor preview={<HomePreview event={previewEvent} />}>
        <div className="space-y-6 p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-xl font-bold text-gray-900">
              Home Page
            </h2>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </div>

          <Card className="space-y-2 p-4">
            <label className="text-sm font-medium text-gray-700">
              Title
            </label>
            <p className="text-xs text-gray-400">
              The main heading displayed on your home page.
            </p>
            <RichTextEditor
              value={richTitle}
              onChange={setRichTitle}
              placeholder="Enter your event title..."
              minHeight={80}
            />
          </Card>

          <Card className="space-y-2 p-4">
            <label className="text-sm font-medium text-gray-700">
              Subtitle
            </label>
            <p className="text-xs text-gray-400">
              A subtitle or tagline shown below the title.
            </p>
            <RichTextEditor
              value={richSubtitle}
              onChange={setRichSubtitle}
              placeholder="Enter a subtitle..."
              minHeight={80}
            />
          </Card>

          <Card className="space-y-2 p-4">
            <label className="text-sm font-medium text-gray-700">
              Body
            </label>
            <p className="text-xs text-gray-400">
              The main content of your home page — your story, invitation, or
              any rich text you'd like to share.
            </p>
            <RichTextEditor
              value={richBody}
              onChange={setRichBody}
              placeholder="Write your invitation or story..."
              minHeight={200}
            />
          </Card>
        </div>
      </SplitEditor>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
