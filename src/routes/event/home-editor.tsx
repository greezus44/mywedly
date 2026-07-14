import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type Json } from "../../lib/supabase";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { HomePreview } from "../../components/preview/PreviewRenderers";
import { Input } from "../../components/ui";
import { RichTextEditor } from "../../components/ui/RichTextEditor";
import { Button } from "../../components/ui/Button";
import { EventThemeProvider } from "../../lib/theme-context";
import { jsonToTheme } from "../../lib/theme";
import type { EventOutletContext } from "./event-layout";

interface ContentConfig {
  welcomeText?: string;
  storyTitle?: string;
  storyBody?: string;
  rsvpTitle?: string;
  rsvpBody?: string;
  rsvpButtonText?: string;
  scheduleText?: string;
}

function parseConfig(json: Json | null | undefined): ContentConfig {
  if (!json || typeof json !== "object") return {};
  return json as ContentConfig;
}

export default function HomeEditor() {
  const { event, eventId } = useOutletContext<EventOutletContext>();
  const queryClient = useQueryClient();

  const existing = parseConfig(event.draft_content ?? event.content);
  const [config, setConfig] = useState<ContentConfig>({
    welcomeText: existing.welcomeText ?? "",
    storyTitle: existing.storyTitle ?? "Our Story",
    storyBody: existing.storyBody ?? "<p>Share the story of how you met and fell in love.</p>",
    rsvpTitle: existing.rsvpTitle ?? "RSVP",
    rsvpBody: existing.rsvpBody ?? "<p>Let us know if you can make it!</p>",
    rsvpButtonText: existing.rsvpButtonText ?? "Respond Now",
    scheduleText: existing.scheduleText ?? "",
  });
  const [saved, setSaved] = useState(false);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("user_events")
        .update({
          draft_content: config as unknown as Json,
        })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const previewEvent = {
    ...event,
    content: config as unknown as Json,
  };

  const theme = jsonToTheme(event.draft_theme ?? event.theme);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-dash-border bg-dash-surface px-4 py-3">
        <h2 className="text-lg font-semibold text-dash-text">Home Editor</h2>
        <div className="flex items-center gap-2">
          {saved && <span className="text-sm text-green-600">Saved!</span>}
          <Button
            onClick={() => saveMutation.mutate()}
            loading={saveMutation.isPending}
          >
            Save Changes
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <SplitEditor
          editorRatio={0.4}
          editor={
            <div className="space-y-6 p-4">
              {/* Welcome */}
              <div>
                <h3 className="mb-3 text-sm font-semibold text-dash-text">
                  Welcome Section
                </h3>
                <Input
                  label="Welcome Text"
                  value={config.welcomeText ?? ""}
                  onChange={(e) =>
                    setConfig({ ...config, welcomeText: e.target.value })
                  }
                  placeholder="We invite you to celebrate our special day."
                />
              </div>

              {/* Story */}
              <div>
                <h3 className="mb-3 text-sm font-semibold text-dash-text">
                  Story Section
                </h3>
                <div className="space-y-3">
                  <Input
                    label="Story Title"
                    value={config.storyTitle ?? ""}
                    onChange={(e) =>
                      setConfig({ ...config, storyTitle: e.target.value })
                    }
                    placeholder="Our Story"
                  />
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-dash-text">
                      Story Body
                    </label>
                    <RichTextEditor
                      value={config.storyBody ?? ""}
                      onChange={(html) =>
                        setConfig({ ...config, storyBody: html })
                      }
                      placeholder="Share your story..."
                    />
                  </div>
                </div>
              </div>

              {/* RSVP */}
              <div>
                <h3 className="mb-3 text-sm font-semibold text-dash-text">
                  RSVP Section
                </h3>
                <div className="space-y-3">
                  <Input
                    label="RSVP Title"
                    value={config.rsvpTitle ?? ""}
                    onChange={(e) =>
                      setConfig({ ...config, rsvpTitle: e.target.value })
                    }
                    placeholder="RSVP"
                  />
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-dash-text">
                      RSVP Body
                    </label>
                    <RichTextEditor
                      value={config.rsvpBody ?? ""}
                      onChange={(html) =>
                        setConfig({ ...config, rsvpBody: html })
                      }
                      placeholder="Let us know if you can make it!"
                    />
                  </div>
                  <Input
                    label="RSVP Button Text"
                    value={config.rsvpButtonText ?? ""}
                    onChange={(e) =>
                      setConfig({ ...config, rsvpButtonText: e.target.value })
                    }
                    placeholder="Respond Now"
                  />
                </div>
              </div>
            </div>
          }
          preview={
            <div className="p-4">
              <EventThemeProvider initialTheme={theme}>
                <HomePreview event={previewEvent} />
              </EventThemeProvider>
            </div>
          }
        />
      </div>
    </div>
  );
}
