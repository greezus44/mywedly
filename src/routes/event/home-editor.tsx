import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Json } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { HomePreview, type EventContent } from "../../components/preview/PreviewRenderers";
import { EventThemeProvider } from "../../lib/theme-context";
import { TypographyControls } from "../../components/ui/TypographyControls";
import { RichTextEditor } from "../../components/ui/RichTextEditor";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { Button } from "../../components/ui/Button";
import { Input, RangeInput, FormField, LoadingSpinner } from "../../components/ui";
import { extractPathFromUrl, removeImage } from "../../lib/upload";
import type { TypographyStyle } from "../../lib/typography";

interface HomeSection {
  heading: TypographyStyle;
  body: string;
}

interface HomeContent {
  logo: {
    url: string | null;
    size: "Small" | "Medium" | "Large";
    marginTop: number;
    marginBottom: number;
  } | null;
  sections: HomeSection[];
}

const LOGO_SIZES: Record<"Small" | "Medium" | "Large", number> = {
  Small: 80,
  Medium: 140,
  Large: 200,
};

const DEFAULT_SECTION: HomeSection = {
  heading: { text: "", fontFamily: "Georgia, serif", fontSize: 28, fontWeight: 700, color: "#78350f", align: "center" },
  body: "",
};

function parseContent(raw: Json | null | undefined): HomeContent {
  const obj = (raw ?? {}) as Partial<HomeContent>;
  return {
    logo: (obj.logo as HomeContent["logo"]) ?? null,
    sections: Array.isArray(obj.sections) ? (obj.sections as HomeSection[]) : [],
  };
}

export function HomeEditor() {
  const { event, eventId } = useEventContext();
  const queryClient = useQueryClient();

  const [content, setContent] = useState<HomeContent>(() => parseContent(event.draft_content ?? event.content));
  const [userId, setUserId] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (mounted) setUserId(user?.id ?? null);
    });
    return () => { mounted = false; };
  }, []);

  function update<K extends keyof HomeContent>(key: K, val: HomeContent[K]) {
    setContent((prev) => ({ ...prev, [key]: val }));
  }

  function updateLogo<K extends keyof NonNullable<HomeContent["logo"]>>(key: K, val: NonNullable<HomeContent["logo"]>[K]) {
    setContent((prev) => ({
      ...prev,
      logo: { enabled: true, ...(prev.logo ?? { url: null, size: "Medium" as const, marginTop: 0, marginBottom: 32 }), [key]: val },
    }));
  }

  function updateSection(idx: number, patch: Partial<HomeSection>) {
    setContent((prev) => ({
      ...prev,
      sections: prev.sections.map((s, i) => (i === idx ? { ...s, ...patch } : s)),
    }));
  }

  function addSection() {
    setContent((prev) => ({ ...prev, sections: [...prev.sections, { ...DEFAULT_SECTION }] }));
  }

  function removeSection(idx: number) {
    setContent((prev) => ({ ...prev, sections: prev.sections.filter((_, i) => i !== idx) }));
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("user_events")
        .update({ draft_content: content as unknown as Json })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 2000);
    },
  });

  const handleLogoRemove = async () => {
    if (content.logo?.url) {
      const path = extractPathFromUrl(content.logo.url);
      if (path) await removeImage(path);
    }
    update("logo", null);
  };

  // Build EventContent for preview
  const previewContent = {
    logo: content.logo
      ? { enabled: true, src: content.logo.url ?? undefined, width: LOGO_SIZES[content.logo.size], alt: "Logo" }
      : undefined,
    sections: content.sections.map((s) => ({
      id: String(Math.random()),
      title: s.heading,
      body: s.body,
    })),
  } as unknown as EventContent;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dash-text">Home Editor</h2>
          <p className="text-sm text-dash-muted">Build the home page your guests land on.</p>
        </div>
        <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
          {savedMsg ? "Saved!" : "Save Changes"}
        </Button>
      </div>

      {saveMutation.isError && (
        <p className="text-sm text-dash-danger">
          {saveMutation.error instanceof Error ? saveMutation.error.message : "Failed to save"}
        </p>
      )}

      <SplitEditor
        editorRatio={5}
        editor={
          <div className="space-y-6">
            {/* Home Page Logo Section */}
            <div className="rounded-lg border border-dash-border p-4">
              <h3 className="mb-3 text-sm font-semibold text-dash-text">Home Page Logo</h3>
              <ImageUpload
                userId={userId ?? ""}
                value={content.logo?.url ?? undefined}
                onChange={(url) => updateLogo("url", url)}
                onRemove={handleLogoRemove}
                label="Logo Image"
                aspectRatio="square"
              />
              {content.logo?.url && (
                <div className="mt-4 space-y-3">
                  <FormField label="Logo Size">
                    <div className="flex gap-2">
                      {(["Small", "Medium", "Large"] as const).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => updateLogo("size", s)}
                          className={`flex-1 rounded-md border px-2 py-1.5 text-xs font-medium transition-colors ${
                            content.logo?.size === s
                              ? "border-dash-primary bg-dash-primary text-dash-primary-fg"
                              : "border-dash-border bg-dash-surface text-dash-text hover:bg-dash-bg"
                          }`}
                        >
                          {s} ({LOGO_SIZES[s]}px)
                        </button>
                      ))}
                    </div>
                  </FormField>
                  <RangeInput
                    label="Margin Top"
                    min={0}
                    max={80}
                    step={4}
                    unit="px"
                    value={content.logo?.marginTop ?? 0}
                    onChange={(e) => updateLogo("marginTop", parseInt(e.target.value, 10))}
                  />
                  <RangeInput
                    label="Margin Bottom"
                    min={0}
                    max={80}
                    step={4}
                    unit="px"
                    value={content.logo?.marginBottom ?? 32}
                    onChange={(e) => updateLogo("marginBottom", parseInt(e.target.value, 10))}
                  />
                  <Button variant="danger" size="sm" onClick={handleLogoRemove}>
                    Remove Logo
                  </Button>
                </div>
              )}
            </div>

            {/* Sections */}
            {content.sections.map((section, idx) => (
              <div key={idx} className="rounded-lg border border-dash-border p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-dash-text">Section {idx + 1}</h3>
                  <Button variant="ghost" size="sm" onClick={() => removeSection(idx)}>Remove</Button>
                </div>
                <div className="space-y-4">
                  <TypographyControls
                    label="Heading"
                    value={section.heading}
                    onChange={(v) => updateSection(idx, { heading: v })}
                    showText
                  />
                  <FormField label="Body">
                    <RichTextEditor
                      value={section.body}
                      onChange={(html) => updateSection(idx, { body: html })}
                      placeholder="Write your section content…"
                    />
                  </FormField>
                </div>
              </div>
            ))}

            <Button variant="secondary" onClick={addSection} className="w-full">
              + Add Section
            </Button>
          </div>
        }
        preview={
          <EventThemeProvider theme={event.draft_theme ?? event.theme}>
            <HomePreview content={previewContent} />
          </EventThemeProvider>
        }
        previewHeader={<span className="text-sm font-medium text-dash-text">Live Preview</span>}
      />
    </div>
  );
}
