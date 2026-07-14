import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type Json } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { RangeInput } from "../../components/ui";
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
  const [content, setContent] = useState<EventContent>(() => ((event.draft_content ?? event.content) as EventContent) ?? { sections: [] });

  useEffect(() => { setContent(((event.draft_content ?? event.content) as EventContent) ?? { sections: [] }); }, [event.draft_content, event.content]);

  const updateLogo = (patch: Partial<HomeLogo>) => setContent((p) => ({ ...p, logo: { ...(p.logo ?? {}), ...patch } }));
  const updateSection = (i: number, patch: Partial<HomeSection>) => setContent((p) => {
    const sections = [...(p.sections ?? [])];
    sections[i] = { ...sections[i], ...patch };
    return { ...p, sections };
  });
  const addSection = () => setContent((p) => ({ ...p, sections: [...(p.sections ?? []), { heading: { text: "New Section" }, body: "" }] }));
  const removeSection = (i: number) => setContent((p) => ({ ...p, sections: (p.sections ?? []).filter((_, idx) => idx !== i) }));

  const saveMutation = useMutation({
    mutationFn: async () => {
      const existing = ((event.draft_content ?? event.content) as Record<string, unknown> | null) ?? {};
      const updated = { ...existing, ...content };
      const { error } = await supabase.from("user_events").update({ draft_content: updated as unknown as Json }).eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["event", eventId] }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-dash-text">Home</h2>
        <Button size="sm" onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>Save</Button>
      </div>
      {saveMutation.isError && <p className="text-sm text-dash-danger">{saveMutation.error instanceof Error ? saveMutation.error.message : "Save failed"}</p>}
      {saveMutation.isSuccess && <p className="text-sm text-green-600">Saved</p>}

      <SplitEditor
        editor={
          <div className="space-y-6">
            <div className="space-y-3 rounded-lg border border-dash-border bg-dash-surface p-4">
              <h3 className="text-sm font-semibold text-dash-text">Home Page Logo</h3>
              <ImageUpload userId={event.creator_id} value={content.logo?.url ?? null} onChange={(url) => updateLogo({ url })} label="Logo Image" />
              <RangeInput label="Logo Size" value={content.logo?.size ?? 140} onChange={(v) => updateLogo({ size: v })} min={40} max={400} />
              <RangeInput label="Top Margin" value={content.logo?.marginTop ?? 0} onChange={(v) => updateLogo({ marginTop: v })} min={0} max={120} />
              <RangeInput label="Bottom Margin" value={content.logo?.marginBottom ?? 8} onChange={(v) => updateLogo({ marginBottom: v })} min={0} max={80} />
            </div>
            {(content.sections ?? []).map((section, i) => (
              <div key={i} className="space-y-3 rounded-lg border border-dash-border bg-dash-surface p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-dash-text">Section {i + 1}</h3>
                  <button onClick={() => removeSection(i)} className="text-xs text-dash-danger hover:underline">Remove</button>
                </div>
                <TypographyControls label="Heading" value={(section.heading as TypographyStyle) ?? {}} onChange={(v) => updateSection(i, { heading: v })} showText />
                <div>
                  <label className="mb-1 block text-xs font-medium text-dash-muted">Body Content</label>
                  <RichTextEditor value={section.body ?? ""} onChange={(html) => updateSection(i, { body: html })} />
                </div>
              </div>
            ))}
            <Button variant="secondary" onClick={addSection}>+ Add Section</Button>
          </div>
        }
        preview={<HomePreview content={content} theme={event.draft_theme ?? event.theme} />}
      />
    </div>
  );
}
