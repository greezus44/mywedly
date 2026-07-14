import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Json } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { HomePreview, type EventContent, type EventContentSection } from "../../components/preview/PreviewRenderers";
import { TypographyControls } from "../../components/ui/TypographyControls";
import { RichTextEditor } from "../../components/ui/RichTextEditor";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { Button } from "../../components/ui/Button";
import { Input, Select } from "../../components/ui/Input";
import type { TypographyStyle } from "../../lib/typography";

const LOGO_SIZES = [
  { label: "Small (80px)", value: 80 },
  { label: "Medium (140px)", value: 140 },
  { label: "Large (200px)", value: 200 },
];

function makeId(): string {
  return `section-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export function HomeEditor() {
  const { event, eventId } = useEventContext();
  const queryClient = useQueryClient();

  const initialContent = (event.draft_content ?? {}) as EventContent;
  const [logo, setLogo] = useState(
    initialContent.logo ?? { url: "", size: 140, marginTop: 0, marginBottom: 24 }
  );
  const [sections, setSections] = useState<EventContentSection[]>(
    initialContent.sections ?? []
  );

  const content: EventContent = { logo, sections };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("events")
        .update({ draft_content: content as unknown as Json })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
    },
  });

  function updateSection(idx: number, patch: Partial<EventContentSection>) {
    setSections((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  }

  function addSection() {
    setSections((prev) => [
      ...prev,
      { id: makeId(), heading: { text: "", fontFamily: "Georgia, serif", fontSize: 24, fontWeight: 700, align: "center" } as TypographyStyle, body: "" },
    ]);
  }

  function removeSection(idx: number) {
    setSections((prev) => prev.filter((_, i) => i !== idx));
  }

  function moveSection(idx: number, dir: -1 | 1) {
    setSections((prev) => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  }

  const editor = (
    <div className="space-y-6 p-4">
      {/* Home Page Logo Section */}
      <div className="rounded-lg border border-dash-border bg-dash-surface p-4">
        <h2 className="mb-3 text-lg font-semibold text-dash-text">Home Page Logo</h2>
        <ImageUpload
          userId={event.creator_id}
          value={logo.url ?? ""}
          onChange={(url) => setLogo({ ...logo, url })}
          label="Logo image"
          aspectRatio="auto"
        />
        {logo.url && (
          <div className="mt-3 space-y-3">
            <Select
              label="Logo size"
              value={String(logo.size ?? 140)}
              onChange={(e) => setLogo({ ...logo, size: Number(e.target.value) })}
            >
              {LOGO_SIZES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </Select>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Top spacing (px)"
                type="number"
                value={logo.marginTop ?? 0}
                onChange={(e) => setLogo({ ...logo, marginTop: Number(e.target.value) })}
              />
              <Input
                label="Bottom spacing (px)"
                type="number"
                value={logo.marginBottom ?? 24}
                onChange={(e) => setLogo({ ...logo, marginBottom: Number(e.target.value) })}
              />
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setLogo({ url: "", size: 140, marginTop: 0, marginBottom: 24 })}
            >
              Remove Logo
            </Button>
          </div>
        )}
      </div>

      {/* Sections */}
      {sections.map((section, idx) => (
        <div key={section.id ?? idx} className="rounded-lg border border-dash-border bg-dash-surface p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-dash-text">Section {idx + 1}</h3>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={() => moveSection(idx, -1)} disabled={idx === 0}>
                ↑
              </Button>
              <Button variant="ghost" size="sm" onClick={() => moveSection(idx, 1)} disabled={idx === sections.length - 1}>
                ↓
              </Button>
              <Button variant="ghost" size="sm" onClick={() => removeSection(idx)}>
                ✕
              </Button>
            </div>
          </div>
          <div className="space-y-3">
            <TypographyControls
              label="Heading"
              value={(section.heading ?? {}) as TypographyStyle}
              onChange={(v) => updateSection(idx, { heading: v })}
              showText
            />
            <div>
              <span className="mb-1.5 block text-sm font-medium text-dash-text">Body</span>
              <RichTextEditor
                value={section.body ?? ""}
                onChange={(html) => updateSection(idx, { body: html })}
                placeholder="Write your section content…"
              />
            </div>
          </div>
        </div>
      ))}

      <Button variant="secondary" onClick={addSection} className="w-full">
        + Add Section
      </Button>

      <Button
        onClick={() => saveMutation.mutate()}
        loading={saveMutation.isPending}
        disabled={saveMutation.isPending}
        className="w-full"
      >
        Save Changes
      </Button>
      {saveMutation.isSuccess && (
        <p className="text-sm text-green-600">Saved successfully!</p>
      )}
      {saveMutation.isError && (
        <p className="text-sm text-dash-danger">
          {saveMutation.error instanceof Error ? saveMutation.error.message : "Save failed."}
        </p>
      )}
    </div>
  );

  const preview = (
    <div className="bg-dash-bg p-4">
      <div className="overflow-hidden rounded-lg border border-dash-border shadow-sm">
        <HomePreview
          event={event}
          theme={event.draft_theme}
          content={content}
        />
      </div>
    </div>
  );

  return (
    <div className="h-[calc(100vh-10rem)]">
      <SplitEditor editor={editor} preview={preview} />
    </div>
  );
}
