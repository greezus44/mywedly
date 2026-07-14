import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Card, RangeInput } from "../../components/ui";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { RichTextEditor } from "../../components/ui/RichTextEditor";
import { TypographyControls } from "../../components/ui/TypographyControls";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { HomePreview, type EventContent, type HomeSection, type HomeLogo } from "../../components/preview/PreviewRenderers";
import type { TypographyStyle } from "../../lib/typography";

interface EventContextValue { event: UserEvent; eventId: string; }

export function HomeEditor() {
  const { event, eventId } = useOutletContext<EventContextValue>();
  const queryClient = useQueryClient();

  const [content, setContent] = useState<EventContent>(() => (event.draft_content ?? event.content ?? {}) as EventContent);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setContent((event.draft_content ?? event.content ?? {}) as EventContent);
  }, [event]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("user_events")
        .update({ draft_content: content })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const updateLogo = (patch: Partial<HomeLogo>) =>
    setContent((p) => ({ ...p, logo: { ...p.logo, ...patch } }));

  const updateSection = (index: number, patch: Partial<HomeSection>) =>
    setContent((p) => ({
      ...p,
      sections: (p.sections ?? []).map((s, i) => (i === index ? { ...s, ...patch } : s)),
    }));

  const addSection = () =>
    setContent((p) => ({ ...p, sections: [...(p.sections ?? []), { heading: { text: "" } as TypographyStyle, body: "" }] }));

  const removeSection = (index: number) =>
    setContent((p) => ({ ...p, sections: (p.sections ?? []).filter((_, i) => i !== index) }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-dash-text">Home Page</h2>
        <div className="flex items-center gap-3">
          {saved && <span className="text-sm text-green-600">Saved!</span>}
          <Button size="sm" onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>Save</Button>
        </div>
      </div>

      <SplitEditor
        editor={
          <div className="space-y-6">
            {/* Home Page Logo Section */}
            <Card>
              <h3 className="mb-4 text-sm font-semibold text-dash-text">Home Page Logo</h3>
              <ImageUpload
                label="Logo Image"
                value={content.logo?.url ?? null}
                onChange={(url) => updateLogo({ url })}
                userId={event.creator_id}
              />
              <div className="mt-4">
                <RangeInput
                  label="Logo Size (px)"
                  value={content.logo?.size ?? 140}
                  min={40}
                  max={400}
                  onChange={(v) => updateLogo({ size: v })}
                />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <RangeInput
                  label="Margin Top (px)"
                  value={content.logo?.marginTop ?? 0}
                  min={0}
                  max={100}
                  onChange={(v) => updateLogo({ marginTop: v })}
                />
                <RangeInput
                  label="Margin Bottom (px)"
                  value={content.logo?.marginBottom ?? 24}
                  min={0}
                  max={100}
                  onChange={(v) => updateLogo({ marginBottom: v })}
                />
              </div>
            </Card>

            {/* Sections */}
            {(content.sections ?? []).map((section, i) => (
              <Card key={i}>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-dash-text">Section {i + 1}</h3>
                  <button
                    type="button"
                    onClick={() => removeSection(i)}
                    className="text-xs text-dash-danger hover:underline"
                  >
                    Remove
                  </button>
                </div>
                <div className="space-y-4">
                  <TypographyControls
                    label="Heading"
                    value={(section.heading as TypographyStyle) ?? { text: "" }}
                    onChange={(v) => updateSection(i, { heading: v })}
                    showText
                  />
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-dash-text">Body Content</label>
                    <RichTextEditor
                      value={section.body ?? ""}
                      onChange={(html) => updateSection(i, { body: html })}
                      placeholder="Add section content..."
                    />
                  </div>
                </div>
              </Card>
            ))}

            <Button variant="secondary" onClick={addSection}>+ Add Section</Button>
          </div>
        }
        preview={
          <HomePreview content={content} eventName={event.draft_name ?? undefined} />
        }
      />
    </div>
  );
}
