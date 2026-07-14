import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Json } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Card, Input, RangeInput } from "../../components/ui";
import { TypographyControls } from "../../components/ui/TypographyControls";
import { RichTextEditor } from "../../components/ui/RichTextEditor";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { HomePreview } from "../../components/preview/PreviewRenderers";
import type { TypographyStyle } from "../../lib/typography";

interface LogoConfig {
  url: string | null;
  size: "Small" | "Medium" | "Large";
  marginTop: number;
  marginBottom: number;
}

interface HomeSection {
  id: string;
  heading: TypographyStyle;
  body: string;
}

interface HomeContent {
  logo: LogoConfig;
  sections: HomeSection[];
}

const LOGO_SIZES: Record<LogoConfig["size"], number> = {
  Small: 80,
  Medium: 140,
  Large: 200,
};

const DEFAULT_LOGO: LogoConfig = {
  url: null,
  size: "Medium",
  marginTop: 0,
  marginBottom: 16,
};

const DEFAULT_CONTENT: HomeContent = {
  logo: { ...DEFAULT_LOGO },
  sections: [
    {
      id: `section-${Date.now()}`,
      heading: { text: "Welcome", fontSize: 32, align: "center" },
      body: "",
    },
  ],
};

function asContent(json: Json | null | undefined): HomeContent {
  if (!json || typeof json !== "object" || Array.isArray(json)) return { ...DEFAULT_CONTENT, logo: { ...DEFAULT_LOGO }, sections: [{ ...DEFAULT_CONTENT.sections[0], id: `section-${Date.now()}` }] };
  const obj = json as Record<string, unknown>;
  const logo = (obj.logo as Record<string, unknown> | undefined) ?? {};
  const sections = Array.isArray(obj.sections) ? (obj.sections as HomeSection[]) : [];
  return {
    logo: {
      url: (logo.url as string | null) ?? null,
      size: (logo.size as LogoConfig["size"]) ?? "Medium",
      marginTop: typeof logo.marginTop === "number" ? logo.marginTop : 0,
      marginBottom: typeof logo.marginBottom === "number" ? logo.marginBottom : 16,
    },
    sections: sections.length > 0 ? sections : [{ ...DEFAULT_CONTENT.sections[0], id: `section-${Date.now()}` }],
  };
}

export function HomeEditor() {
  const { event, eventId } = useEventContext();
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [content, setContent] = useState<HomeContent>(asContent(event.draft_content));
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) setUserId(session?.user?.id ?? null);
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    setContent(asContent(event.draft_content));
  }, [event.draft_content]);

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
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const updateLogo = (patch: Partial<LogoConfig>) => {
    setContent((prev) => ({ ...prev, logo: { ...prev.logo, ...patch } }));
  };

  const updateSection = (id: string, patch: Partial<HomeSection>) => {
    setContent((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }));
  };

  const addSection = () => {
    setContent((prev) => ({
      ...prev,
      sections: [
        ...prev.sections,
        { id: `section-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, heading: { text: "New Section", fontSize: 24, align: "center" }, body: "" },
      ],
    }));
  };

  const removeSection = (id: string) => {
    setContent((prev) => ({
      ...prev,
      sections: prev.sections.filter((s) => s.id !== id),
    }));
  };

  // Build preview content matching HomePreview's expected shape
  const previewContent = {
    logo: {
      src: content.logo.url,
      width: LOGO_SIZES[content.logo.size],
      height: LOGO_SIZES[content.logo.size],
      position: content.logo.url ? "top-center" : "hidden",
    },
    homeTitle: content.sections[0]?.heading,
    homeBody: content.sections[0]?.body,
    sections: content.sections.slice(1).map((s) => ({ id: s.id, title: s.heading.text, body: s.body })),
  } as unknown as Json;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dash-text">Home Editor</h2>
          <p className="text-sm text-dash-muted">Customize the home page of your event site.</p>
        </div>
        <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
          {saved ? "Saved!" : "Save"}
        </Button>
      </div>

      <SplitEditor
        editor={
          <div className="space-y-4">
            {/* Home Page Logo section */}
            <Card>
              <h3 className="mb-3 text-sm font-semibold text-dash-text">Home Page Logo</h3>
              {userId ? (
                <ImageUpload
                  value={content.logo.url}
                  onChange={(url) => updateLogo({ url })}
                  userId={userId}
                  label="Logo Image"
                  aspectRatio="square"
                  placeholder="Upload a logo"
                />
              ) : (
                <p className="text-sm text-dash-muted">Sign in to upload a logo.</p>
              )}

              {content.logo.url && (
                <>
                  <div className="mt-4 space-y-3">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-dash-text">Logo Size</label>
                      <div className="flex gap-1">
                        {(["Small", "Medium", "Large"] as const).map((size) => (
                          <button
                            key={size}
                            type="button"
                            onClick={() => updateLogo({ size })}
                            className={
                              "flex-1 rounded-md border px-3 py-1.5 text-sm transition-colors " +
                              (content.logo.size === size
                                ? "border-dash-primary bg-dash-primary/10 text-dash-primary"
                                : "border-dash-border text-dash-text hover:bg-dash-bg")
                            }
                          >
                            {size} ({LOGO_SIZES[size]}px)
                          </button>
                        ))}
                      </div>
                    </div>
                    <RangeInput
                      label="Margin Top (px)"
                      value={content.logo.marginTop}
                      onChange={(marginTop) => updateLogo({ marginTop })}
                      min={0}
                      max={64}
                      step={1}
                    />
                    <RangeInput
                      label="Margin Bottom (px)"
                      value={content.logo.marginBottom}
                      onChange={(marginBottom) => updateLogo({ marginBottom })}
                      min={0}
                      max={64}
                      step={1}
                    />
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => updateLogo({ url: null })}
                    >
                      Remove Logo
                    </Button>
                  </div>
                </>
              )}
            </Card>

            {/* Sections */}
            {content.sections.map((section, idx) => (
              <Card key={section.id}>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-dash-text">Section {idx + 1}</h3>
                  {content.sections.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSection(section.id)}
                      className="text-sm text-dash-danger hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  <TypographyControls
                    label="Heading"
                    value={section.heading}
                    onChange={(heading) => updateSection(section.id, { heading })}
                    showText
                  />
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-dash-text">Body</label>
                    <RichTextEditor
                      value={section.body}
                      onChange={(body) => updateSection(section.id, { body })}
                      placeholder="Write section content..."
                    />
                  </div>
                </div>
              </Card>
            ))}

            <Button type="button" variant="secondary" onClick={addSection}>
              + Add Section
            </Button>
          </div>
        }
        preview={
          <div className="rounded-lg border border-dash-border p-4">
            <HomePreview content={previewContent} logoConfig={previewContent as Json} />
          </div>
        }
      />

      {saveMutation.isError && (
        <p className="text-sm text-dash-danger">
          {saveMutation.error instanceof Error ? saveMutation.error.message : "Failed to save."}
        </p>
      )}
    </div>
  );
}
