import React, { useEffect, useState, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { RichTextEditor } from "../../components/ui/RichTextEditor";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { HomePreview } from "../../components/preview/PreviewRenderers";
import { LoadingSpinner } from "../../components/ui";

type HomeContent = { section1?: string; section2?: string; section3?: string };

const SECTION_LABELS = [
  { key: "section1" as const, label: "Welcome Message", placeholder: "Introduce your event and welcome guests..." },
  { key: "section2" as const, label: "Details Section", placeholder: "Add additional details about your event..." },
  { key: "section3" as const, label: "Closing Message", placeholder: "A closing note or call-to-action..." },
];

export default function HomeEditor() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();
  const [content, setContent] = useState<HomeContent>({ section1: "", section2: "", section3: "" });
  const [saved, setSaved] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const c = (event.draft_content ?? event.content ?? {}) as HomeContent;
    setContent({ section1: c.section1 ?? "", section2: c.section2 ?? "", section3: c.section3 ?? "" });
  }, [event.id]);

  const saveMutation = useMutation({
    mutationFn: async (payload: HomeContent) => {
      const { error } = await supabase
        .from("user_events")
        .update({ draft_content: payload })
        .eq("id", event.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", event.id] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      saveMutation.mutate(content);
    }, 1200);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  const previewEvent: Partial<UserEvent> = {
    ...event,
    name: event.draft_name || event.name,
    event_date: event.draft_event_date || event.event_date,
    content,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-dash-text">Welcome Page Editor</h2>
        {saved && <span className="text-sm text-green-600">✓ Saved</span>}
        {saveMutation.isPending && <LoadingSpinner className="h-4 w-4" />}
      </div>
      <SplitEditor
        editor={
          <div className="space-y-4">
            {SECTION_LABELS.map((section) => (
              <div key={section.key}>
                <label className="block text-sm font-medium text-dash-text mb-1.5">{section.label}</label>
                <RichTextEditor
                  value={content[section.key] ?? ""}
                  onChange={(html) => setContent((c) => ({ ...c, [section.key]: html }))}
                  placeholder={section.placeholder}
                />
              </div>
            ))}
          </div>
        }
        preview={<HomePreview event={previewEvent} />}
      />
    </div>
  );
}
