import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Wedding, type CoverConfig, type LogoConfig } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { SplitEditor, type DeviceType } from "../../components/preview/SplitEditor";
import { CoverPreview } from "../../components/preview/PreviewRenderers";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Label, Select, Toggle, ColorInput, RangeInput } from "../../components/ui/Input";
import { Card, Toast } from "../../components/ui/index";
import { ImageUpload, VideoUpload, FormField } from "../../components/ui/ImageUpload";
import { LogoControls } from "../../components/ui/LogoControls";
import { DEFAULT_COVER_CONFIG, DEFAULT_LOGO_CONFIG, FONT_OPTIONS } from "../../lib/theme";
import { cn } from "../../lib/utils";
import { Save, Upload, Eye } from "lucide-react";

export function CoverEditorPage() {
  const queryClient = useQueryClient();
  const [device, setDevice] = useState<DeviceType>("desktop");
  const [toast, setToast] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>("logo");

  const { data: wedding, isLoading } = useQuery({
    queryKey: ["wedding"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { data, error } = await supabase.from("weddings").select("*").eq("created_by", user.user.id).single();
      if (error) throw error;
      return data as Wedding;
    },
  });

  const coverConfig: CoverConfig = (wedding?.draft_cover_config && "colors" in wedding.draft_cover_config ? wedding.draft_cover_config : wedding?.cover_config && "colors" in wedding.cover_config ? wedding.cover_config : DEFAULT_COVER_CONFIG) as CoverConfig;

  const [config, setConfig] = useState<CoverConfig>(coverConfig);

  // Sync config when wedding loads
  if (wedding && config === coverConfig && JSON.stringify(coverConfig) !== JSON.stringify(coverConfig)) {
    setConfig(coverConfig);
  }

  const saveDraft = useMutation({
    mutationFn: async (newConfig: CoverConfig) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { error } = await supabase.from("weddings").update({ draft_cover_config: newConfig }).eq("created_by", user.user.id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["wedding"] }); setToast("Draft saved"); },
  });

  const publish = useMutation({
    mutationFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { error } = await supabase.from("weddings").update({ cover_config: config, draft_cover_config: config }).eq("created_by", user.user.id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["wedding"] }); setToast("Published successfully"); },
  });

  const update = (patch: Partial<CoverConfig>) => {
    const newConfig = { ...config, ...patch };
    setConfig(newConfig);
    saveDraft.mutate(newConfig);
  };

  const updateLogo = (logo: LogoConfig) => {
    update({ branding: { ...config.branding, logo, logoUrl: logo.url, logoVisible: logo.visible, logoPosition: logo.position === "center" ? "center" : logo.position.includes("left") ? "left" : logo.position.includes("right") ? "right" : "center", logoSize: logo.width } });
  };

  if (isLoading) return <AdminLayout><div className="flex items-center justify-center h-full"><div className="animate-pulse text-gray-400">Loading...</div></div></AdminLayout>;
  if (!wedding) return <AdminLayout><div className="p-6 text-gray-500">Wedding not found</div></AdminLayout>;

  const cc = config.colors || {};
  const ct = config.typography || {};
  const cl = config.layout || {};
  const cb = config.background || {};
  const logo = config.branding?.logo || DEFAULT_LOGO_CONFIG;

  const sections = [
    { key: "logo", label: "Logo" },
    { key: "branding", label: "Branding" },
    { key: "colors", label: "Colours" },
    { key: "typography", label: "Typography" },
    { key: "layout", label: "Layout" },
    { key: "background", label: "Background" },
  ];

  return (
    <AdminLayout>
      <SplitEditor title="Cover Page Editor" device={device} preview={<CoverPreview wedding={{ ...wedding, draft_cover_config: config } as Wedding} device={device} />}>
        <div className="space-y-6">
          {/* Section tabs */}
          <div className="flex gap-1 flex-wrap border-b border-gray-100 pb-3">
            {sections.map((s) => (
              <button key={s.key} onClick={() => setActiveSection(s.key)} className={cn("px-3 py-1.5 text-xs font-ui font-medium rounded-lg transition-all", activeSection === s.key ? "bg-indigo-50 text-indigo-600" : "text-gray-500 hover:text-gray-700")}>{s.label}</button>
            ))}
          </div>

          {activeSection === "logo" && (
            <LogoControls logo={logo} onChange={updateLogo} device={device} onDeviceChange={setDevice} />
          )}

          {activeSection === "branding" && (
            <div className="space-y-4">
              <FormField label="Divider Style">
                <Select value={config.branding?.divider || "line"} onChange={(e) => update({ branding: { ...config.branding, divider: e.target.value as any } })} className="!bg-white !border-gray-200 !text-gray-700">
                  <option value="none">None</option>
                  <option value="line">Line</option>
                  <option value="floral">Floral</option>
                  <option value="ornate">Ornate</option>
                </Select>
              </FormField>
            </div>
          )}

          {activeSection === "colors" && (
            <div className="space-y-4">
              <FormField label="Primary Colour"><ColorInput value={cc.primary || "#b8973a"} onChange={(v) => update({ colors: { ...cc, primary: v } })} /></FormField>
              <FormField label="Secondary Colour"><ColorInput value={cc.secondary || "#d4b85c"} onChange={(v) => update({ colors: { ...cc, secondary: v } })} /></FormField>
              <FormField label="Accent Colour"><ColorInput value={cc.accent || "#c9a0a0"} onChange={(v) => update({ colors: { ...cc, accent: v } })} /></FormField>
              <FormField label="Background Colour"><ColorInput value={cc.background || "#1a1a1a"} onChange={(v) => update({ colors: { ...cc, background: v } })} /></FormField>
              <FormField label="Text Colour"><ColorInput value={cc.text || "#ffffff"} onChange={(v) => update({ colors: { ...cc, text: v } })} /></FormField>
              <FormField label="Button Colour"><ColorInput value={cc.buttonColor || "#b8973a"} onChange={(v) => update({ colors: { ...cc, buttonColor: v } })} /></FormField>
              <FormField label="Button Text Colour"><ColorInput value={cc.buttonTextColor || "#ffffff"} onChange={(v) => update({ colors: { ...cc, buttonTextColor: v } })} /></FormField>
              <FormField label="Overlay Colour"><ColorInput value={cc.overlayColor || "#000000"} onChange={(v) => update({ colors: { ...cc, overlayColor: v } })} /></FormField>
              <FormField label="Overlay Opacity"><RangeInput value={(cc.overlayOpacity ?? 0.4) * 100} onChange={(v) => update({ colors: { ...cc, overlayOpacity: v / 100 } })} min={0} max={100} step={5} unit="%" /></FormField>
            </div>
          )}

          {activeSection === "typography" && (
            <div className="space-y-4">
              <FormField label="Heading Font">
                <Select value={ct.headingFont || "Playfair Display"} onChange={(e) => update({ typography: { ...ct, headingFont: e.target.value } })} className="!bg-white !border-gray-200 !text-gray-700">
                  {FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                </Select>
              </FormField>
              <FormField label="Body Font">
                <Select value={ct.bodyFont || "Cormorant Garamond"} onChange={(e) => update({ typography: { ...ct, bodyFont: e.target.value } })} className="!bg-white !border-gray-200 !text-gray-700">
                  {FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                </Select>
              </FormField>
              <FormField label="Heading Size"><Input value={ct.headingSize || "3rem"} onChange={(e) => update({ typography: { ...ct, headingSize: e.target.value } })} /></FormField>
              <FormField label="Body Size"><Input value={ct.bodySize || "1rem"} onChange={(e) => update({ typography: { ...ct, bodySize: e.target.value } })} /></FormField>
              <FormField label="Letter Spacing"><Input value={ct.letterSpacing || "0.15em"} onChange={(e) => update({ typography: { ...ct, letterSpacing: e.target.value } })} /></FormField>
            </div>
          )}

          {activeSection === "layout" && (
            <div className="space-y-4">
              <FormField label="Content Alignment">
                <Select value={cl.contentAlignment || "center"} onChange={(e) => update({ layout: { ...cl, contentAlignment: e.target.value as any } })} className="!bg-white !border-gray-200 !text-gray-700">
                  <option value="left">Left</option><option value="center">Center</option><option value="right">Right</option>
                </Select>
              </FormField>
              <FormField label="Vertical Position">
                <Select value={cl.verticalPosition || "center"} onChange={(e) => update({ layout: { ...cl, verticalPosition: e.target.value as any } })} className="!bg-white !border-gray-200 !text-gray-700">
                  <option value="top">Top</option><option value="center">Center</option><option value="bottom">Bottom</option>
                </Select>
              </FormField>
              <FormField label="Button Style">
                <Select value={cl.buttonStyle || "outline"} onChange={(e) => update({ layout: { ...cl, buttonStyle: e.target.value as any } })} className="!bg-white !border-gray-200 !text-gray-700">
                  <option value="outline">Outline</option><option value="solid">Solid</option><option value="underline">Underline</option>
                </Select>
              </FormField>
              <FormField label="Border Radius"><Input value={cl.borderRadius || "8px"} onChange={(e) => update({ layout: { ...cl, borderRadius: e.target.value } })} /></FormField>
              <FormField label="Spacing"><Input value={cl.spacing || "1.5rem"} onChange={(e) => update({ layout: { ...cl, spacing: e.target.value } })} /></FormField>
            </div>
          )}

          {activeSection === "background" && (
            <div className="space-y-4">
              <FormField label="Background Type">
                <Select value={cb.type || "image"} onChange={(e) => update({ background: { ...cb, type: e.target.value as any } })} className="!bg-white !border-gray-200 !text-gray-700">
                  <option value="image">Image</option><option value="video">Video</option><option value="slideshow">Slideshow</option><option value="color">Colour</option>
                </Select>
              </FormField>
              {cb.type === "image" && <ImageUpload label="Background Image" value={cb.imageUrl || null} onChange={(url) => update({ background: { ...cb, imageUrl: url } })} />}
              {cb.type === "video" && <VideoUpload label="Background Video URL" value={cb.videoUrl || null} onChange={(url) => update({ background: { ...cb, videoUrl: url } })} />}
              {cb.type === "slideshow" && (
                <div className="space-y-2">
                  {(cb.slideshowUrls || []).map((url, i) => (
                    <div key={i} className="flex gap-2">
                      <input type="text" value={url} onChange={(e) => { const urls = [...(cb.slideshowUrls || [])]; urls[i] = e.target.value; update({ background: { ...cb, slideshowUrls: urls } }); }} className="flex-1 px-3 py-2 border border-gray-200 rounded-lg font-ui text-sm text-gray-700" placeholder="Image URL" />
                      <button onClick={() => update({ background: { ...cb, slideshowUrls: (cb.slideshowUrls || []).filter((_, idx) => idx !== i) } })} className="px-3 py-2 text-xs text-red-500 hover:bg-red-50 rounded-lg">Remove</button>
                    </div>
                  ))}
                  <button onClick={() => update({ background: { ...cb, slideshowUrls: [...(cb.slideshowUrls || []), ""] } })} className="text-xs font-ui text-indigo-600 hover:text-indigo-700">+ Add Image</button>
                </div>
              )}
              <FormField label="Blur Intensity"><RangeInput value={cb.blur || 0} onChange={(v) => update({ background: { ...cb, blur: v } })} min={0} max={20} step={1} unit="px" /></FormField>
              <FormField label="Brightness"><RangeInput value={cb.brightness || 100} onChange={(v) => update({ background: { ...cb, brightness: v } })} min={0} max={200} step={5} unit="%" /></FormField>
              <FormField label="Overlay Gradient"><Input value={cb.overlayGradient || ""} onChange={(e) => update({ background: { ...cb, overlayGradient: e.target.value } })} placeholder="e.g. linear-gradient(...)" /></FormField>
            </div>
          )}

          {/* Publish button */}
          <div className="pt-4 border-t border-gray-100">
            <Button variant="primary" size="md" className="w-full" onClick={() => publish.mutate()} disabled={publish.isPending}>
              <Save size={14} className="mr-2" /> Publish Cover Page
            </Button>
          </div>
        </div>
      </SplitEditor>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </AdminLayout>
  );
}
