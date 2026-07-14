import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Json } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { HomePreview } from "../../components/preview/PreviewRenderers";
import { RichTextEditor } from "../../components/ui/RichTextEditor";
import { Button } from "../../components/ui/Button";
import { Input, Card } from "../../components/ui";

interface HomeContent {
  welcome?: string;
  intro?: string;
  sections?: Array<{ title: string; body: string }>;
}

export function HomeEditor() {
  const { event, eventId } = useEventContext();
  const queryClient = useQueryClient();
  const [content, setContent] = useState<HomeContent>({});

  useEffect(() => {
    setContent(
      (event.draft_content ?? event.content ?? {}) as HomeContent
    );
  }, [event]);

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

  const sections = content.sections ?? [];

  const updateSection = (index: number, field: "title" | "body", value: string) => {
    const updated = [...sections];
    updated[index] = { ...updated[index], [field]: value };
    setContent({ ...content, sections: updated });
  };

  const addSection = () => {
    setContent({
      ...content,
      sections: [...sections, { title: "", body: "" }],
    });
  };

  const removeSection = (index: number) => {
    setContent({
      ...content,
      sections: sections.filter((_, i) => i !== index),
    });
  };

  const editor = (
    <div className="p-4 space-y-5">
      <h3 className="text-sm font-semibold text-dash-text">Home Page Content</h3>

      <Input
        label="Welcome heading"
        type="text"
        value={content.welcome ?? ""}
        onChange={(e) => setContent({ ...content, welcome: e.target.value })}
        placeholder="Welcome to our wedding"
      />

      <div>
        <label className="block text-sm font-medium text-dash-text mb-1">
          Intro text
        </label>
        <RichTextEditor
          value={content.intro ?? ""}
          onChange={(html) => setContent({ ...content, intro: html })}
          placeholder="We invite you to celebrate with us on our special day."
        />
      </div>

      <div className="border-t border-dash-border pt-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-dash-text">Sections</h4>
          <Button variant="secondary" size="sm" onClick={addSection}>
            Add section
          </Button>
        </div>
        <div className="space-y-4">
          {sections.map((section, i) => (
            <div key={i} className="rounded-md border border-dash-border p-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-dash-muted">
                  Section {i + 1}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSection(i)}
                >
                  Remove
                </Button>
              </div>
              <Input
                label="Section title"
                type="text"
                value={section.title}
                onChange={(e) => updateSection(i, "title", e.target.value)}
                placeholder={`Section ${i + 1}`}
              />
              <div>
                <label className="block text-sm font-medium text-dash-text mb-1">
                  Section body
                </label>
                <RichTextEditor
                  value={section.body}
                  onChange={(html) => updateSection(i, "body", html)}
                  placeholder="Write something..."
                />
              </div>
            </div>
          ))}
          {sections.length === 0 && (
            <p className="text-sm text-dash-muted text-center py-4">
              No sections yet. Click "Add section" to create one.
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-dash-border">
        {saveMutation.isError && (
          <p className="text-sm text-dash-danger">
            {saveMutation.error instanceof Error ? saveMutation.error.message : "Save failed"}
          </p>
        )}
        {saveMutation.isSuccess && (
          <p className="text-sm text-green-600">Saved!</p>
        )}
        <Button
          onClick={() => saveMutation.mutate()}
          loading={saveMutation.isPending}
          className="ml-auto"
        >
          Save changes
        </Button>
      </div>
    </div>
  );

  const preview = (
    <div className="p-4">
      <Card className="overflow-hidden">
        <HomePreview config={content as unknown as Json} />
      </Card>
    </div>
  );

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-dash-text">Home Editor</h2>
        <p className="text-sm text-dash-muted">
          Customize the home page content of your invitation website
        </p>
      </div>
      <div className="h-[calc(100vh-220px)] min-h-[500px]">
        <SplitEditor editor={editor} preview={preview} />
      </div>
    </div>
  );
}
