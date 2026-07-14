import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type Json } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { HomePreview } from "../../components/preview/PreviewRenderers";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Input";
import { Card, ColorInput } from "../../components/ui";
import { RichTextEditor } from "../../components/ui/RichTextEditor";
import { HEADING_FONT_OPTIONS } from "../../lib/theme";

interface ContentSection {
  heading?: string;
  headingFont?: string;
  headingColor?: string;
  body?: string;
}

interface EventContent {
  sections?: ContentSection[];
}

export function HomeEditor() {
  const { event, eventId } = useEventContext();
  const queryClient = useQueryClient();

  const initial = (event.draft_content ?? event.content) as EventContent | null;
  const [sections, setSections] = useState<ContentSection[]>(initial?.sections ?? []);

  useEffect(() => {
    const cnt = (event.draft_content ?? event.content) as EventContent | null;
    setSections(cnt?.sections ?? []);
  }, [event]);

  const liveContent: EventContent = { sections };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("user_events")
        .update({
          draft_content: liveContent as unknown as Json,
        })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
    },
  });

  const updateSection = (index: number, patch: Partial<ContentSection>) => {
    setSections((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  };

  const addSection = () => {
    setSections((prev) => [...prev, { heading: "", body: "" }]);
  };

  const removeSection = (index: number) => {
    setSections((prev) => prev.filter((_, i) => i !== index));
  };

  const moveSection = (index: number, dir: -1 | 1) => {
    setSections((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-dash-text">Home Editor</h2>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={addSection}>
            Add Section
          </Button>
          <Button
            onClick={() => saveMutation.mutate()}
            loading={saveMutation.isPending}
          >
            Save
          </Button>
        </div>
      </div>

      {saveMutation.isError && (
        <p className="text-sm text-dash-danger">
          {saveMutation.error instanceof Error ? saveMutation.error.message : "Save failed"}
        </p>
      )}
      {saveMutation.isSuccess && (
        <p className="text-sm text-green-600">Saved successfully!</p>
      )}

      <SplitEditor
        editor={
          <div className="space-y-6">
            {sections.length === 0 && (
              <Card className="p-8 text-center">
                <p className="text-sm text-dash-muted mb-4">No sections yet.</p>
                <Button variant="secondary" onClick={addSection}>Add a section</Button>
              </Card>
            )}

            {sections.map((section, i) => (
              <Card key={i} className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-dash-text">Section {i + 1}</h3>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveSection(i, -1)}
                      disabled={i === 0}
                      className="text-dash-muted hover:text-dash-text disabled:opacity-30 px-2 py-1 text-sm"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveSection(i, 1)}
                      disabled={i === sections.length - 1}
                      className="text-dash-muted hover:text-dash-text disabled:opacity-30 px-2 py-1 text-sm"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => removeSection(i)}
                      className="text-dash-danger hover:text-dash-danger-hover px-2 py-1 text-sm"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <Input
                  label="Section heading"
                  value={section.heading ?? ""}
                  onChange={(e) => updateSection(i, { heading: e.target.value })}
                  placeholder="e.g. Our Story"
                />

                <div className="grid grid-cols-2 gap-3">
                  <Select
                    label="Heading font"
                    value={section.headingFont ?? ""}
                    onChange={(e) => updateSection(i, { headingFont: e.target.value })}
                  >
                    <option value="">Default</option>
                    {HEADING_FONT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </Select>
                  <div>
                    <span className="block text-sm font-medium text-dash-text mb-1.5">Heading colour</span>
                    <ColorInput
                      value={section.headingColor ?? "#000000"}
                      onChange={(v) => updateSection(i, { headingColor: v })}
                    />
                  </div>
                </div>

                <RichTextEditor
                  label="Body content"
                  value={section.body ?? ""}
                  onChange={(html) => updateSection(i, { body: html })}
                  placeholder="Write your section content here..."
                />
              </Card>
            ))}
          </div>
        }
        preview={
          <div className="rounded-lg border border-dash-border bg-dash-surface p-4 overflow-hidden">
            <HomePreview
              event={event}
              theme={event.draft_theme ?? event.theme}
              content={liveContent}
            />
          </div>
        }
      />
    </div>
  );
}
