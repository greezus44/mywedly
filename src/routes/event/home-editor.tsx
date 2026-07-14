import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type Json } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { HomePreview } from "../../components/preview/PreviewRenderers";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, FormField } from "../../components/ui";
import { RichTextEditor } from "../../components/ui/RichTextEditor";

interface HomeContent {
  heroTitle?: string;
  heroSubtitle?: string;
  aboutSection?: string;
  detailsSection?: string;
  storySection?: string;
}

export function HomeEditor() {
  const { event, eventId } = useEventContext();
  const queryClient = useQueryClient();

  const [content, setContent] = useState<HomeContent>(
    (event.draft_content as HomeContent) ?? {}
  );

  useEffect(() => {
    setContent((event.draft_content as HomeContent) ?? {});
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
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-dash-text">Home Editor</h2>
        <Button
          onClick={() => saveMutation.mutate()}
          loading={saveMutation.isPending}
        >
          Save Changes
        </Button>
      </div>

      {saveMutation.isError && (
        <p className="text-sm text-red-600">
          {saveMutation.error instanceof Error
            ? saveMutation.error.message
            : "Failed to save"}
        </p>
      )}
      {saveMutation.isSuccess && (
        <p className="text-sm text-green-600">Saved successfully!</p>
      )}

      <SplitEditor
        editorRatio={0.5}
        editor={
          <div className="space-y-6">
            <div className="border-b border-dash-border pb-4">
              <h3 className="mb-3 text-sm font-semibold text-dash-text">
                Hero Section
              </h3>
              <div className="space-y-3">
                <Input
                  label="Hero Title"
                  value={content.heroTitle ?? ""}
                  onChange={(e) =>
                    setContent({ ...content, heroTitle: e.target.value })
                  }
                  placeholder="Our Wedding"
                />
                <Textarea
                  label="Hero Subtitle"
                  value={content.heroSubtitle ?? ""}
                  onChange={(e) =>
                    setContent({ ...content, heroSubtitle: e.target.value })
                  }
                  placeholder="Join us as we celebrate our love"
                  rows={2}
                />
              </div>
            </div>

            <div className="border-b border-dash-border pb-4">
              <h3 className="mb-3 text-sm font-semibold text-dash-text">
                About Section
              </h3>
              <FormField>
                <RichTextEditor
                  value={content.aboutSection ?? ""}
                  onChange={(html) =>
                    setContent({ ...content, aboutSection: html })
                  }
                  placeholder="Write about your event..."
                />
              </FormField>
            </div>

            <div className="border-b border-dash-border pb-4">
              <h3 className="mb-3 text-sm font-semibold text-dash-text">
                Details Section
              </h3>
              <FormField>
                <RichTextEditor
                  value={content.detailsSection ?? ""}
                  onChange={(html) =>
                    setContent({ ...content, detailsSection: html })
                  }
                  placeholder="Event details, venue info, etc..."
                />
              </FormField>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold text-dash-text">
                Our Story Section
              </h3>
              <FormField>
                <RichTextEditor
                  value={content.storySection ?? ""}
                  onChange={(html) =>
                    setContent({ ...content, storySection: html })
                  }
                  placeholder="Share your love story..."
                />
              </FormField>
            </div>
          </div>
        }
        preview={
          <HomePreview
            name={event.draft_name || event.name}
            eventDate={event.draft_event_date}
            venue={event.draft_venue}
            content={content as unknown as Json}
          />
        }
      />
    </div>
  );
}
