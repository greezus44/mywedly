import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { HomePreview, type EventContent, type HomeLogo, type HomeSection } from "../../components/preview/PreviewRenderers";
import { TypographyControls } from "../../components/ui/TypographyControls";
import { RichTextEditor } from "../../components/ui/RichTextEditor";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { RangeInput, Button, Card } from "../../components/ui";

interface EventContextValue { event: UserEvent; eventId: string; }

export function HomeEditor() {
  const { event, eventId } = useOutletContext<EventContextValue>();
  const queryClient = useQueryClient();
  const userId = event.creator_id;

  const [content, setContent] = useState<EventContent>(() => {
    const raw = (event.draft_content ?? event.content ?? {}) as EventContent;
    if (raw.sections) return raw;
    if (raw.heading !== undefined || raw.body !== undefined) return { ...raw, sections: [{ heading: raw.heading, body: raw.body }] };
    return { sections: [], logo: raw.logo };
  });
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const updateLogo = (patch: Partial<HomeLogo>) => setContent((p) => ({ ...p, logo: { ...p.logo, ...patch } }));
  const updateSection = (i: number, patch: Partial<HomeSection>) => setContent((p) => ({ ...p, sections: p.sections?.map((s, idx) => idx === i ? { ...s, ...patch } : s) }));
  const addSection = () => setContent((p) => ({ ...p, sections: [...(p.sections ?? []), { heading: {}, body: "" }] }));
  const removeSection = (i: number) => setContent((p) => ({ ...p, sections: p.sections?.filter((_, idx) => idx !== i) }));

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("user_events").update({ draft_content: content as unknown as Record<string, unknown> }).eq("id", eventId);
      if (error) throw error;
    },
    onMutate: () => { setSaving(true); setSavedMsg(null); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["event", eventId] }); setSaving(false); setSavedMsg("Saved!"); setTimeout(() => setSavedMsg(null), 2000); },
    onError: (e) => { setSaving(false); setSavedMsg(e instanceof Error ? e.message : "Failed to save"); },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-dash-text">Home Page</h2>
        <div className="flex items-center gap-3">
          {savedMsg && <span className="text-sm text-dash-muted">{savedMsg}</span>}
          <Button size="sm" onClick={() => saveMutation.mutate()} loading={saving}>Save</Button>
        </div>
      </div>
      <SplitEditor
        editor={
          <div className="space-y-4">
            <Card>
              <h3 className="mb-3 text-sm font-semibold text-dash-text">Home Page Logo</h3>
              <ImageUpload value={content.logo?.url ?? ""} onChange={(url) => updateLogo({ url })} userId={userId} label="Logo Image" />
              <div className="mt-3 grid grid-cols-3 gap-3">
                <RangeInput label="Size" value={content.logo?.size ?? 140} min={40} max={300} onChange={(v) => updateLogo({ size: v })} unit="px" />
                <RangeInput label="Top Margin" value={content.logo?.marginTop ?? 0} min={0} max={80} onChange={(v) => updateLogo({ marginTop: v })} unit="px" />
                <RangeInput label="Bottom Margin" value={content.logo?.marginBottom ?? 0} min={0} max={80} onChange={(v) => updateLogo({ marginBottom: v })} unit="px" />
              </div>
            </Card>
            {(content.sections ?? []).map((section, i) => (
              <Card key={i}>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-dash-text">Section {i + 1}</h3>
                  <button onClick={() => removeSection(i)} className="text-xs text-dash-danger hover:underline">Remove</button>
                </div>
                <div className="space-y-3">
                  <TypographyControls label="Section Heading" value={section.heading ?? {}} onChange={(v) => updateSection(i, { heading: v })} showText />
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-dash-text">Section Body</label>
                    <RichTextEditor value={section.body ?? ""} onChange={(html) => updateSection(i, { body: html })} />
                  </div>
                </div>
              </Card>
            ))}
            <Button variant="secondary" size="sm" onClick={addSection}>+ Add Section</Button>
          </div>
        }
        preview={<HomePreview content={content} />}
      />
    </div>
  );
}
