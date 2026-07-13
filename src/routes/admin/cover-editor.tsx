import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Wedding, type CoverConfig } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { CoverPreview } from "../../components/preview/PreviewRenderers";
import { Button } from "../../components/ui/Button";
import { Input, Select, Toggle, ColorInput, RangeInput } from "../../components/ui/Input";
import { Card, Toast } from "../../components/ui/index";
import { ImageUpload, VideoUpload, FormField } from "../../components/ui/ImageUpload";
import { DEFAULT_COVER_CONFIG, FONT_OPTIONS } from "../../lib/theme";
import { Save, Send } from "lucide-react";

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="p-5 mb-4">
      <h3 className="font-ui text-sm font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="space-y-4">{children}</div>
    </Card>
  );
}

export function CoverEditorPage() {
  const queryClient = useQueryClient();
  const [config, setConfig] = useState<CoverConfig>(DEFAULT_COVER_CONFIG);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const { data: wedding, isLoading, error } = useQuery<Wedding>({
    queryKey: ["wedding"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { data, error } = await supabase.from("weddings").select("*").eq("created_by", user.user.id).single();
      if (error) throw error;
      return data as Wedding;
    },
  });

  useEffect(() => {
    if (wedding) {
      const draft = wedding.draft_cover_config;
      if (draft && "colors" in draft) setConfig(draft as CoverConfig);
      else if (wedding.cover_config && "colors" in wedding.cover_config) setConfig(wedding.cover_config as CoverConfig);
    }
  }, [wedding]);

  const update = (section: keyof CoverConfig, patch: Record<string, unknown>) => {
    setConfig((prev) => ({ ...prev, [section]: { ...(prev[section] as Record<string, unknown>), ...patch } }));
  };

  const saveDraftMutation = useMutation({
    mutationFn: async (cfg: CoverConfig) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { error } = await supabase.from("weddings").update({ draft_cover_config: cfg }).eq("created_by", user.user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wedding"] });
      setToast({ message: "Draft saved", type: "success" });
    },
    onError: () => setToast({ message: "Failed to save draft", type: "error" }),
  });

  const publishMutation = useMutation({
    mutationFn: async (cfg: CoverConfig) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { error } = await supabase.from("weddings").update({ draft_cover_config: cfg, cover_config: cfg }).eq("created_by", user.user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wedding"] });
      setToast({ message: "Cover published!", type: "success" });
    },
    onError: () => setToast({ message: "Failed to publish", type: "error" }),
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full p-8">
          <p className="font-ui text-sm text-gray-500">Loading cover editor...</p>
        </div>
      </AdminLayout>
    );
  }

  if (error || !wedding) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full p-8">
          <p className="font-ui text-sm text-red-500">Unable to load wedding data.</p>
        </div>
      </AdminLayout>
    );
  }

  const previewWedding = { ...wedding, draft_cover_config: config } as Wedding;
  const branding = config.branding || {};
  const colors = config.colors || {};
  const typography = config.typography || {};
  const layout = config.layout || {};
  const background = config.background || {};

  return (
    <AdminLayout>
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200">
          <h1 className="font-ui text-base font-semibold text-gray-900">Cover Page Editor</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => saveDraftMutation.mutate(config)} disabled={saveDraftMutation.isPending}>
              <Save size={14} className="mr-1.5" /> Save Draft
            </Button>
            <button
              onClick={() => publishMutation.mutate(config)}
              disabled={publishMutation.isPending}
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-indigo-600 text-white font-ui text-xs font-medium uppercase tracking-wider rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              <Send size={14} /> Publish
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <SplitEditor title="Cover Page" preview={<CoverPreview wedding={previewWedding} />}>
            <SectionCard title="Branding">
              <FormField label="Logo">
                <ImageUpload value={branding.logoUrl || null} onChange={(url) => update("branding", { logoUrl: url })} />
              </FormField>
              <FormField label="Logo Size">
                <RangeInput value={parseInt(branding.logoSize || "64")} min={32} max={200} onChange={(v) => update("branding", { logoSize: `${v}px` })} label="Logo size" />
              </FormField>
              <FormField label="Logo Position">
                <Select value={branding.logoPosition || "center"} onChange={(e) => update("branding", { logoPosition: e.target.value as "left" | "center" | "right" })}>
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </Select>
              </FormField>
              <FormField label="Show Logo">
                <Toggle checked={branding.logoVisible ?? true} onChange={(v) => update("branding", { logoVisible: v })} />
              </FormField>
              <FormField label="Divider Style">
                <Select value={branding.divider || "line"} onChange={(e) => update("branding", { divider: e.target.value as "none" | "line" | "floral" | "ornate" })}>
                  <option value="none">None</option>
                  <option value="line">Line</option>
                  <option value="floral">Floral</option>
                  <option value="ornate">Ornate</option>
                </Select>
              </FormField>
            </SectionCard>

            <SectionCard title="Colours">
              <FormField label="Primary Colour"><ColorInput value={colors.primary || "#b8973a"} onChange={(v) => update("colors", { primary: v })} /></FormField>
              <FormField label="Secondary Colour"><ColorInput value={colors.secondary || "#d4b85c"} onChange={(v) => update("colors", { secondary: v })} /></FormField>
              <FormField label="Accent Colour"><ColorInput value={colors.accent || "#c9a0a0"} onChange={(v) => update("colors", { accent: v })} /></FormField>
              <FormField label="Background Colour"><ColorInput value={colors.background || "#1a1a1a"} onChange={(v) => update("colors", { background: v })} /></FormField>
              <FormField label="Text Colour"><ColorInput value={colors.text || "#ffffff"} onChange={(v) => update("colors", { text: v })} /></FormField>
              <FormField label="Button Colour"><ColorInput value={colors.buttonColor || "#b8973a"} onChange={(v) => update("colors", { buttonColor: v })} /></FormField>
              <FormField label="Button Text Colour"><ColorInput value={colors.buttonTextColor || "#ffffff"} onChange={(v) => update("colors", { buttonTextColor: v })} /></FormField>
              <FormField label="Overlay Colour"><ColorInput value={colors.overlayColor || "#000000"} onChange={(v) => update("colors", { overlayColor: v })} /></FormField>
              <FormField label="Overlay Opacity">
                <RangeInput value={colors.overlayOpacity ?? 0.4} min={0} max={1} step={0.05} onChange={(v) => update("colors", { overlayOpacity: v })} label="Overlay opacity" />
              </FormField>
            </SectionCard>

            <SectionCard title="Typography">
              <FormField label="Heading Font">
                <Select value={typography.headingFont || "Playfair Display"} onChange={(e) => update("typography", { headingFont: e.target.value })}>
                  {FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                </Select>
              </FormField>
              <FormField label="Body Font">
                <Select value={typography.bodyFont || "Cormorant Garamond"} onChange={(e) => update("typography", { bodyFont: e.target.value })}>
                  {FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                </Select>
              </FormField>
              <FormField label="Heading Size">
                <Input value={typography.headingSize || "3rem"} onChange={(e) => update("typography", { headingSize: e.target.value })} placeholder="3rem" />
              </FormField>
              <FormField label="Body Size">
                <Input value={typography.bodySize || "1rem"} onChange={(e) => update("typography", { bodySize: e.target.value })} placeholder="1rem" />
              </FormField>
              <FormField label="Heading Weight">
                <Select value={typography.headingWeight || "400"} onChange={(e) => update("typography", { headingWeight: e.target.value })}>
                  <option value="300">Light (300)</option>
                  <option value="400">Regular (400)</option>
                  <option value="500">Medium (500)</option>
                  <option value="600">Semibold (600)</option>
                  <option value="700">Bold (700)</option>
                </Select>
              </FormField>
              <FormField label="Body Weight">
                <Select value={typography.bodyWeight || "400"} onChange={(e) => update("typography", { bodyWeight: e.target.value })}>
                  <option value="300">Light (300)</option>
                  <option value="400">Regular (400)</option>
                  <option value="500">Medium (500)</option>
                  <option value="600">Semibold (600)</option>
                </Select>
              </FormField>
              <FormField label="Letter Spacing">
                <Input value={typography.letterSpacing || "0.15em"} onChange={(e) => update("typography", { letterSpacing: e.target.value })} placeholder="0.15em" />
              </FormField>
            </SectionCard>

            <SectionCard title="Layout">
              <FormField label="Content Alignment">
                <Select value={layout.contentAlignment || "center"} onChange={(e) => update("layout", { contentAlignment: e.target.value as "left" | "center" | "right" })}>
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </Select>
              </FormField>
              <FormField label="Vertical Position">
                <Select value={layout.verticalPosition || "center"} onChange={(e) => update("layout", { verticalPosition: e.target.value as "top" | "center" | "bottom" })}>
                  <option value="top">Top</option>
                  <option value="center">Center</option>
                  <option value="bottom">Bottom</option>
                </Select>
              </FormField>
              <FormField label="Button Style">
                <Select value={layout.buttonStyle || "outline"} onChange={(e) => update("layout", { buttonStyle: e.target.value as "outline" | "solid" | "underline" })}>
                  <option value="outline">Outline</option>
                  <option value="solid">Solid</option>
                  <option value="underline">Underline</option>
                </Select>
              </FormField>
              <FormField label="Border Radius">
                <Input value={layout.borderRadius || "8px"} onChange={(e) => update("layout", { borderRadius: e.target.value })} placeholder="8px" />
              </FormField>
              <FormField label="Spacing">
                <Input value={layout.spacing || "1.5rem"} onChange={(e) => update("layout", { spacing: e.target.value })} placeholder="1.5rem" />
              </FormField>
            </SectionCard>

            <SectionCard title="Background">
              <FormField label="Background Type">
                <Select value={background.type || "image"} onChange={(e) => update("background", { type: e.target.value as "image" | "video" | "slideshow" | "color" })}>
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                  <option value="slideshow">Slideshow</option>
                  <option value="color">Colour</option>
                </Select>
              </FormField>
              {(background.type === "image" || !background.type) && (
                <FormField label="Background Image">
                  <ImageUpload value={background.imageUrl || null} onChange={(url) => update("background", { imageUrl: url })} />
                </FormField>
              )}
              {background.type === "video" && (
                <FormField label="Video URL">
                  <VideoUpload value={background.videoUrl || null} onChange={(url) => update("background", { videoUrl: url })} />
                </FormField>
              )}
              {background.type === "slideshow" && (
                <FormField label="Slideshow URLs" hint="Comma-separated image URLs">
                  <Input
                    value={(background.slideshowUrls || []).join(", ")}
                    onChange={(e) => update("background", { slideshowUrls: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
                    placeholder="https://..., https://..."
                  />
                </FormField>
              )}
              <FormField label="Blur">
                <RangeInput value={background.blur ?? 0} min={0} max={20} onChange={(v) => update("background", { blur: v })} label="Background blur" />
              </FormField>
              <FormField label="Brightness">
                <RangeInput value={background.brightness ?? 100} min={0} max={200} onChange={(v) => update("background", { brightness: v })} label="Background brightness" />
              </FormField>
              <FormField label="Overlay Gradient" hint="CSS gradient, e.g. linear-gradient(...)">
                <Input value={background.overlayGradient || ""} onChange={(e) => update("background", { overlayGradient: e.target.value })} placeholder="linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)" />
              </FormField>
            </SectionCard>
          </SplitEditor>
        </div>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    </AdminLayout>
  );
}
