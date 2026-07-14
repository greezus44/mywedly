import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Json } from "../../lib/supabase";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { HomePreview, type EventContent } from "../../components/preview/PreviewRenderers";
import { TypographyControls } from "../../components/ui/TypographyControls";
import { RichTextEditor } from "../../components/ui/RichTextEditor";
import { Button } from "../../components/ui/Button";
import { Card, Select, LoadingSpinner } from "../../components/ui";
import { HEADING_FONT_OPTIONS } from "../../lib/theme";
import type { TypographyStyle } from "../../lib/typography";
import type { EventContextValue } from "./event-layout";

const DEFAULT_CONTENT: EventContent = {
  home: {
    heading: { text: "Welcome", fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 700, align: "center", color: "#78350f" },
    body: "",
  },
};

export function HomeEditor() {
  const { event, eventId } = useOutletContext<EventContextValue>();
  const queryClient = useQueryClient();

  const [content, setContent] = useState<EventContent>(DEFAULT_CONTENT);
  const [headingFont, setHeadingFont] = useState<string>("'Playfair Display', serif");
  const [headingColor, setHeadingColor] = useState<string>("#78350f");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!loaded) {
      const draft = (event.draft_content ?? event.content) as EventContent | null;
      if (draft) {
        setContent({ ...DEFAULT_CONTENT, ...draft });
        const home = draft.home as { heading?: TypographyStyle; body?: string } | undefined;
        if (home?.heading?.fontFamily) setHeadingFont(home.heading.fontFamily);
        if (home?.heading?.color) setHeadingColor(home.heading.color);
      }
      setLoaded(true);
    }
  }, [event, loaded]);

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

  function updateHeading(v: TypographyStyle) {
    setContent((prev) => ({
      ...prev,
      home: { ...prev.home, heading: v },
    }));
    if (v.fontFamily) setHeadingFont(v.fontFamily);
    if (v.color) setHeadingColor(v.color);
  }

  function updateBody(body: string) {
    setContent((prev) => ({
      ...prev,
      home: { ...prev.home, body },
    }));
  }

  if (!loaded) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-dash-text">Home Page Editor</h2>
        <Button
          onClick={() => saveMutation.mutate()}
          loading={saveMutation.isPending}
          disabled={saveMutation.isPending}
        >
          Save Changes
        </Button>
      </div>

      {saveMutation.isError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-dash-danger">
          {saveMutation.error?.message ?? "Failed to save"}
        </div>
      )}
      {saveMutation.isSuccess && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Saved successfully!
        </div>
      )}

      <div className="h-[calc(100vh-280px)] min-h-[500px]">
        <SplitEditor
          editorRatio={0.5}
          editor={
            <div className="space-y-6">
              <Card className="p-4">
                <TypographyControls
                  label="Home Heading"
                  value={(content.home?.heading ?? {}) as TypographyStyle}
                  onChange={updateHeading}
                />
              </Card>

              <Card className="p-4">
                <h3 className="mb-3 text-sm font-semibold text-dash-text">Home Body Content</h3>
                <RichTextEditor
                  value={content.home?.body ?? ""}
                  onChange={updateBody}
                  placeholder="Write your welcome message here..."
                />
              </Card>

              <Card className="p-4 space-y-3">
                <h3 className="text-sm font-semibold text-dash-text">Heading Style</h3>
                <Select
                  label="Heading Font Family"
                  value={headingFont}
                  onChange={(e) => {
                    setHeadingFont(e.target.value);
                    updateHeading({ ...(content.home?.heading ?? {}), fontFamily: e.target.value } as TypographyStyle);
                  }}
                >
                  {HEADING_FONT_OPTIONS.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </Select>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-dash-text">Heading Colour</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={headingColor}
                      onChange={(e) => {
                        setHeadingColor(e.target.value);
                        updateHeading({ ...(content.home?.heading ?? {}), color: e.target.value } as TypographyStyle);
                      }}
                      className="h-9 w-12 cursor-pointer rounded border border-dash-border bg-dash-surface"
                    />
                    <input
                      type="text"
                      value={headingColor}
                      onChange={(e) => {
                        setHeadingColor(e.target.value);
                        updateHeading({ ...(content.home?.heading ?? {}), color: e.target.value } as TypographyStyle);
                      }}
                      className="w-full rounded-md border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text"
                    />
                  </div>
                </div>
              </Card>
            </div>
          }
          preview={
            <div className="p-4">
              <HomePreview
                event={event}
                theme={event.draft_theme ?? event.theme}
                content={content}
              />
            </div>
          }
        />
      </div>
    </div>
  );
}

export default HomeEditor;
