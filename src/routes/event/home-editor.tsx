import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useOutletContext } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase, type UserEvent, type EventContent } from "../../lib/supabase";
import { Button, Toast } from "../../components/ui";
import { RichTextEditor } from "../../components/ui/RichTextEditor";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { HomePreview } from "../../components/preview/PreviewRenderers";

export default function HomeEditorPage() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const [content, setContent] = useState<EventContent>(
    event.draft_content || {
      rich_title: null,
      rich_subtitle: null,
      rich_body: null,
    }
  );

  useEffect(() => {
    setContent(
      event.draft_content || {
        rich_title: null,
        rich_subtitle: null,
        rich_body: null,
      }
    );
  }, [event]);

  const previewEvent: UserEvent = {
    ...event,
    draft_content: content,
  };

  const updateContent = (patch: Partial<EventContent>) => {
    setContent((prev) => ({ ...prev, ...patch }));
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("user_events")
        .update({ draft_content: content })
        .eq("id", event.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", event.id] });
      setToast({ message: "Home page saved", type: "success" });
    },
    onError: (err: Error) => {
      setToast({ message: err.message, type: "error" });
    },
  });

  return (
    <div className="h-full p-4">
      <SplitEditor preview={<HomePreview event={previewEvent} />}>
        <div className="flex flex-col gap-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
            Home Page Editor
          </h2>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">Title</label>
            <p className="text-xs text-gray-400">
              Rich text — appears as the main heading on your home page
            </p>
            <RichTextEditor
              value={content.rich_title || ""}
              onChange={(html) => updateContent({ rich_title: html })}
              placeholder="Enter your title…"
              minHeight={80}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">Subtitle</label>
            <p className="text-xs text-gray-400">
              Rich text — appears below the title
            </p>
            <RichTextEditor
              value={content.rich_subtitle || ""}
              onChange={(html) => updateContent({ rich_subtitle: html })}
              placeholder="Enter your subtitle…"
              minHeight={80}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">Body</label>
            <p className="text-xs text-gray-400">
              Rich text — the main content of your home page
            </p>
            <RichTextEditor
              value={content.rich_body || ""}
              onChange={(html) => updateContent({ rich_body: html })}
              placeholder="Tell your guests about the event…"
              minHeight={150}
            />
          </div>

          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
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
