import { useState, useEffect } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase, type Json } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { HomePreview } from "../../components/preview/PreviewRenderers";
import { RichTextEditor } from "../../components/ui/RichTextEditor";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { LoadingSpinner } from "../../components/ui";

interface HomeContent {
  introHeading?: string;
  introBody?: string;
  storyHeading?: string;
  storyBody?: string;
  detailsHeading?: string;
  detailsBody?: string;
}

export default function HomeEditor() {
  const { event, eventId } = useEventContext();
  const queryClient = useQueryClient();

  const [content, setContent] = useState<HomeContent>(() => {
    const raw = (event.draft_content ?? event.content ?? {}) as HomeContent;
    return {
      introHeading: raw.introHeading ?? "Welcome to our celebration",
      introBody: raw.introBody ?? "",
      storyHeading: raw.storyHeading ?? "Our Story",
      storyBody: raw.storyBody ?? "",
      detailsHeading: raw.detailsHeading ?? "Event Details",
      detailsBody: raw.detailsBody ?? "",
    };
  });

  useEffect(() => {
    const raw = (event.draft_content ?? event.content ?? {}) as HomeContent;
    setContent({
      introHeading: raw.introHeading ?? "Welcome to our celebration",
      introBody: raw.introBody ?? "",
      storyHeading: raw.storyHeading ?? "Our Story",
      storyBody: raw.storyBody ?? "",
      detailsHeading: raw.detailsHeading ?? "Event Details",
      detailsBody: raw.detailsBody ?? "",
    });
  }, [event]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("user_events")
        .update({
          draft_content: content as unknown as Json,
        })
        .eq("id", eventId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_events", eventId] });
    },
  });

  const previewEvent = {
    ...event,
    content: content as unknown as Json,
  };

  return (
    <SplitEditor
      editor={
        <div className="space-y-6">
          <div>
            <h2 className="mb-1 text-lg font-semibold text-dash-text">Home Editor</h2>
            <p className="text-sm text-dash-muted">
              Edit the content sections displayed on your home page.
            </p>
          </div>

          {/* Intro Section */}
          <div className="space-y-3 rounded-lg border border-dash-border p-4">
            <h3 className="text-sm font-semibold text-dash-text">Introduction</h3>
            <Input
              label="Heading"
              value={content.introHeading ?? ""}
              onChange={(e) =>
                setContent((c) => ({ ...c, introHeading: e.target.value }))
              }
              placeholder="Welcome to our celebration"
            />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-dash-text">
                Body
              </label>
              <RichTextEditor
                value={content.introBody ?? ""}
                onChange={(html) =>
                  setContent((c) => ({ ...c, introBody: html }))
                }
                placeholder="Write your welcome message..."
              />
            </div>
          </div>

          {/* Story Section */}
          <div className="space-y-3 rounded-lg border border-dash-border p-4">
            <h3 className="text-sm font-semibold text-dash-text">Our Story</h3>
            <Input
              label="Heading"
              value={content.storyHeading ?? ""}
              onChange={(e) =>
                setContent((c) => ({ ...c, storyHeading: e.target.value }))
              }
              placeholder="Our Story"
            />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-dash-text">
                Body
              </label>
              <RichTextEditor
                value={content.storyBody ?? ""}
                onChange={(html) =>
                  setContent((c) => ({ ...c, storyBody: html }))
                }
                placeholder="Share your story..."
              />
            </div>
          </div>

          {/* Details Section */}
          <div className="space-y-3 rounded-lg border border-dash-border p-4">
            <h3 className="text-sm font-semibold text-dash-text">Event Details</h3>
            <Input
              label="Heading"
              value={content.detailsHeading ?? ""}
              onChange={(e) =>
                setContent((c) => ({ ...c, detailsHeading: e.target.value }))
              }
              placeholder="Event Details"
            />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-dash-text">
                Body
              </label>
              <RichTextEditor
                value={content.detailsBody ?? ""}
                onChange={(html) =>
                  setContent((c) => ({ ...c, detailsBody: html }))
                }
                placeholder="Add any additional details..."
              />
            </div>
          </div>

          {saveMutation.isError && (
            <p className="text-sm text-dash-danger">
              {saveMutation.error instanceof Error
                ? saveMutation.error.message
                : "Failed to save"}
            </p>
          )}
          {saveMutation.isSuccess && (
            <p className="text-sm text-green-600">Changes saved successfully!</p>
          )}

          <Button
            onClick={() => saveMutation.mutate()}
            loading={saveMutation.isPending}
            className="w-full"
          >
            {saveMutation.isPending ? <LoadingSpinner size="sm" /> : "Save Changes"}
          </Button>
        </div>
      }
      preview={
        <div className="p-4">
          <HomePreview event={previewEvent} className="rounded-lg" />
        </div>
      }
    />
  );
}
