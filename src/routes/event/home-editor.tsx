import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useOutletContext } from "react-router-dom";
import { supabase, type UserEvent } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { RichTextEditor } from "../../components/ui/RichTextEditor";
import { TypographyControls } from "../../components/ui/TypographyControls";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { HomePreview, type EventContent, type HomeLogo, type HomeSection } from "../../components/preview/PreviewRenderers";
import type { TypographyStyle } from "../../lib/typography";

interface EventContextValue { event: UserEvent; eventId: string; }

const LOGO_SIZES: { label: string; value: number }[] = [
  { label: "Small", value: 80 },
  { label: "Medium", value: 140 },
  { label: "Large", value: 200 },
];

function initContent(raw: unknown): EventContent {
  const obj = (raw ?? {}) as Record<string, unknown>;
  const draftSections = (obj.sections as HomeSection[] | undefined);
  return {
    logo: (obj.logo as HomeLogo | undefined),
    sections: draftSections ?? [],
  };
}

export function HomeEditor() {
  const { event, eventId } = useOutletContext<EventContextValue>();
  const queryClient = useQueryClient();

  // FIX #1: initialise from draft_content (the working copy), NOT content (published)
  const [content, setContent] = useState<EventContent>(() => initContent(event.draft_content ?? event.content));

  const update = useCallback((patch: Partial<EventContent>) => {
    setContent((prev) => ({ ...prev, ...patch }));
  }, []);

  const setLogo = useCallback((patch: Partial<HomeLogo>) => {
    setContent((prev) => ({ ...prev, logo: { ...(prev.logo ?? {}), ...patch } as HomeLogo }));
  }, []);

  const setSection = useCallback((index: number, patch: Partial<HomeSection>) => {
    setContent((prev) => {
      const sections = [...(prev.sections ?? [])];
      sections[index] = { ...sections[index], ...patch };
      return { ...prev, sections };
    });
  }, []);

  const addSection = useCallback(() => {
    setContent((prev) => ({
      ...prev,
      sections: [...(prev.sections ?? []), { heading: {}, body: "" }],
    }));
  }, []);

  const removeSection = useCallback((index: number) => {
    setContent((prev) => {
      const sections = [...(prev.sections ?? [])];
      sections.splice(index, 1);
      return { ...prev, sections };
    });
  }, []);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("user_events")
        .update({ draft_content: content as unknown as Record<string, unknown> })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
    },
  });

  const editor = (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-dash-text">Home Page</h2>
        <Button size="sm" onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
          Save
        </Button>
      </div>

      {saveMutation.isError && (
        <p className="text-sm text-dash-danger">
          {saveMutation.error instanceof Error ? saveMutation.error.message : "Save failed"}
        </p>
      )}
      {saveMutation.isSuccess && (
        <p className="text-sm text-green-600">Saved successfully</p>
      )}

      {/* Logo Section */}
      <div className="rounded-lg border border-dash-border p-4">
        <h3 className="mb-3 text-sm font-semibold text-dash-text">Logo / Image</h3>
        <ImageUpload
          value={content.logo?.url ?? null}
          onChange={(url) => setLogo({ url: url ?? undefined })}
          label="Upload Logo"
        />
        {content.logo?.url && (
          <>
            <div className="mt-3">
              <label className="mb-1 block text-xs font-medium text-dash-muted">Size</label>
              <div className="flex gap-2">
                {LOGO_SIZES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setLogo({ size: s.value })}
                    className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                      (content.logo?.size ?? 140) === s.value
                        ? "bg-dash-primary text-dash-primary-fg"
                        : "bg-dash-bg text-dash-muted hover:text-dash-text"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-dash-muted">Margin Top (px)</label>
                <input
                  type="number"
                  value={content.logo?.marginTop ?? 0}
                  onChange={(e) => setLogo({ marginTop: Number(e.target.value) })}
                  className="w-full rounded border border-dash-border bg-dash-surface px-2 py-1 text-sm text-dash-text focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-dash-muted">Margin Bottom (px)</label>
                <input
                  type="number"
                  value={content.logo?.marginBottom ?? 16}
                  onChange={(e) => setLogo({ marginBottom: Number(e.target.value) })}
                  className="w-full rounded border border-dash-border bg-dash-surface px-2 py-1 text-sm text-dash-text focus:outline-none"
                />
              </div>
            </div>
            <button
              onClick={() => update({ logo: undefined })}
              className="mt-2 text-xs text-dash-danger hover:underline"
            >
              Remove Logo
            </button>
          </>
        )}
      </div>

      {/* Content Sections */}
      {(content.sections ?? []).map((section, i) => (
        <div key={i} className="rounded-lg border border-dash-border p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-dash-text">Section {i + 1}</h3>
            <button onClick={() => removeSection(i)} className="text-xs text-dash-danger hover:underline">Remove</button>
          </div>
          <div className="mb-3">
            <label className="mb-1 block text-xs font-medium text-dash-muted">Heading</label>
            {/* FIX #1: heading stored as TypographyStyle, text field is the actual content */}
            <TypographyControls
              label="Heading Style"
              value={(section.heading as TypographyStyle) ?? {}}
              onChange={(v) => setSection(i, { heading: v })}
              showText
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-dash-muted">Body Text</label>
            {/* FIX #2: RichTextEditor produces HTML with inline styles for font/color/alignment */}
            <RichTextEditor
              value={section.body ?? ""}
              onChange={(html) => setSection(i, { body: html })}
            />
          </div>
        </div>
      ))}

      <Button variant="secondary" size="sm" onClick={addSection}>+ Add Section</Button>
    </div>
  );

  // FIX #1: preview receives live `content` state — no stale event data, no default fallbacks
  const preview = (
    <div className="event-themed h-full overflow-y-auto">
      <HomePreview content={content} />
    </div>
  );

  return <SplitEditor editor={editor} preview={preview} />;
}
