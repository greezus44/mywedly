import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type Json } from "../../lib/supabase";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { HomePreview } from "../../components/preview/PreviewRenderers";
import { EventThemeProvider } from "../../lib/theme-context";
import { simplifiedToFullTheme, fullToSimplifiedTheme, type ThemeConfig } from "../../lib/theme";
import { Button } from "../../components/ui/Button";
import { RichTextEditor } from "../../components/ui/RichTextEditor";

interface HomeContent {
  welcomeTitle?: string;
  welcomeBody?: string;
  storyTitle?: string;
  storyBody?: string;
  detailsTitle?: string;
  detailsBody?: string;
}

const DEFAULT_CONTENT: HomeContent = {
  welcomeTitle: "Welcome",
  welcomeBody: "<p>We're so glad you're here. Explore the details of our special day below.</p>",
  storyTitle: "Our Story",
  storyBody: "<p>Read about how we met and fell in love.</p>",
  detailsTitle: "When & Where",
  detailsBody: "<p>Find all the details about our venue and schedule here.</p>",
};

export default function HomeEditor() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();

  const [content, setContent] = useState<HomeContent>(
    (event.draft_content ?? event.content ?? DEFAULT_CONTENT) as HomeContent,
  );

  useEffect(() => {
    setContent(
      (event.draft_content ?? event.content ?? DEFAULT_CONTENT) as HomeContent,
    );
  }, [event]);

  const themeConfig = (event.draft_theme ?? event.theme ?? {}) as unknown as ThemeConfig;
  const fullTheme = Object.keys(themeConfig).length
    ? themeConfig
    : simplifiedToFullTheme(fullToSimplifiedTheme({} as ThemeConfig));

  const previewEvent: Partial<UserEvent> = {
    ...event,
    content: content as unknown as Json,
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("user_events")
        .update({ draft_content: content as unknown as Json })
        .eq("id", event.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", event.id] });
    },
  });

  const update = (patch: Partial<HomeContent>) => setContent({ ...content, ...patch });

  return (
    <SplitEditor
      editorRatio={0.45}
      editor={
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-dash-text">Home Editor</h2>
            <Button
              size="sm"
              onClick={() => saveMutation.mutate()}
              loading={saveMutation.isPending}
            >
              Save Changes
            </Button>
          </div>

          {saveMutation.isSuccess && (
            <p className="text-sm text-green-600">Saved successfully!</p>
          )}
          {saveMutation.isError && (
            <p className="text-sm text-dash-danger">
              {saveMutation.error instanceof Error
                ? saveMutation.error.message
                : "Failed to save"}
            </p>
          )}

          {/* Section 1: Welcome */}
          <div className="space-y-3 rounded-lg border border-dash-border p-4">
            <h3 className="text-sm font-semibold text-dash-text">Welcome Section</h3>
            <input
              type="text"
              placeholder="Section title"
              value={content.welcomeTitle ?? ""}
              onChange={(e) => update({ welcomeTitle: e.target.value })}
              className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text focus:outline-none focus:ring-2 focus:ring-dash-primary/40"
            />
            <RichTextEditor
              value={content.welcomeBody ?? ""}
              onChange={(html: string) => update({ welcomeBody: html })}
              placeholder="Welcome message..."
            />
          </div>

          {/* Section 2: Story */}
          <div className="space-y-3 rounded-lg border border-dash-border p-4">
            <h3 className="text-sm font-semibold text-dash-text">Our Story Section</h3>
            <input
              type="text"
              placeholder="Section title"
              value={content.storyTitle ?? ""}
              onChange={(e) => update({ storyTitle: e.target.value })}
              className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text focus:outline-none focus:ring-2 focus:ring-dash-primary/40"
            />
            <RichTextEditor
              value={content.storyBody ?? ""}
              onChange={(html: string) => update({ storyBody: html })}
              placeholder="Tell your story..."
            />
          </div>

          {/* Section 3: Details */}
          <div className="space-y-3 rounded-lg border border-dash-border p-4">
            <h3 className="text-sm font-semibold text-dash-text">Details Section</h3>
            <input
              type="text"
              placeholder="Section title"
              value={content.detailsTitle ?? ""}
              onChange={(e) => update({ detailsTitle: e.target.value })}
              className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text focus:outline-none focus:ring-2 focus:ring-dash-primary/40"
            />
            <RichTextEditor
              value={content.detailsBody ?? ""}
              onChange={(html: string) => update({ detailsBody: html })}
              placeholder="Event details..."
            />
          </div>
        </div>
      }
      preview={
        <EventThemeProvider initialTheme={fullTheme}>
          <HomePreview event={previewEvent} />
        </EventThemeProvider>
      }
    />
  );
}
