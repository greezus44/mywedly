import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Wedding, type CoverConfig } from "../../lib/supabase";
import { DEFAULT_COVER_CONFIG } from "../../lib/theme";
import { AdminLayout } from "./admin-layout";
import { SplitEditor, type DeviceType } from "../../components/preview/SplitEditor";
import { CoverPreview } from "../../components/preview/PreviewRenderers";
import { LogoControls } from "../../components/ui/LogoControls";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Select, Toggle, ColorInput, RangeInput, Label } from "../../components/ui/Input";
import { Card } from "../../components/ui/index";
import { ImageUpload, VideoUpload, FormField } from "../../components/ui/ImageUpload";
import { FONT_OPTIONS } from "../../lib/theme";
import { Save, Upload } from "lucide-react";

type Tab = "logo" | "branding" | "colours" | "typography" | "layout" | "background";

export function CoverEditorPage() {
  const [tab, setTab] = useState<Tab>("logo");
  const [device, setDevice] = useState<DeviceType>("desktop");
  const [config, setConfig] = useState<CoverConfig>(DEFAULT_COVER_CONFIG);
  const qc = useQueryClient();

  const { data: wedding } = useQuery({
    queryKey: ["wedding"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { data } = await supabase.from("weddings").select("*").eq("created_by", user.user.id).maybeSingle();
      if (data) {
        const c = (data as Wedding).draft_cover_config || (data as Wedding).cover_config || DEFAULT_COVER_CONFIG;
        setConfig(c);
      }
      return data as Wedding | null;
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { error } = await supabase.from("weddings").update({ draft_cover_config: config }).eq("created_by", user.user.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wedding"] }),
  });

  const update = (patch: Partial<CoverConfig>) => setConfig({ ...config, ...patch });

  const tabs: { id: Tab; label: string }[] = [
    { id: "logo", label: "Logo" }, { id: "branding", label: "Branding" }, { id: "colours", label: "Colours" },
    { id: "typography", label: "Typography" }, { id: "layout", label: "Layout" }, { id: "background", label: "Background" },
  ];

  return (
    <AdminLayout>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Cover Page Editor</h2>
        <Button onClick={() => save.mutate()} disabled={save.isPending}>
          <Save className="mr-2 h-4 w-4" /> {save.isPending ? "Saving..." : "Save Draft"}
        </Button>
      </div>

      <div className="mb-4 flex gap-2 border-b border-gray-200 overflow-x-auto">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition ${tab === t.id ? "border-indigo-500 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
            {t.label}
          </button>
        ))}
      </div>

      <SplitEditor device={device} onDeviceChange={setDevice} preview={(d) => <CoverPreview wedding={wedding || null} device={d} />}>
        <Card className="space-y-4">
          {tab === "logo" && <LogoControls logo={config.branding.logo} onChange={(logo) => update({ branding: { ...config.branding, logo } })} device={device} />}

          {tab === "branding" && (
            <div className="space-y-4">
              <FormField label="Couple Name One"><Input value={config.branding.couple_name_one} onChange={(e) => update({ branding: { ...config.branding, couple_name_one: e.target.value } })} /></FormField>
              <FormField label="Couple Name Two"><Input value={config.branding.couple_name_two} onChange={(e) => update({ branding: { ...config.branding, couple_name_two: e.target.value } })} /></FormField>
              <FormField label="Date Display"><Input value={config.branding.date} onChange={(e) => update({ branding: { ...config.branding, date: e.target.value } })} /></FormField>
              <FormField label="Enter Button Text"><Input value={config.enter_button_text} onChange={(e) => update({ enter_button_text: e.target.value })} /></FormField>
              <Toggle checked={config.show_date} onChange={(v) => update({ show_date: v })} label="Show date" />
              <Toggle checked={config.show_countdown} onChange={(v) => update({ show_countdown: v })} label="Show countdown" />
            </div>
          )}

          {tab === "colours" && (
            <div className="space-y-4">
              <ColorInput label="Heading Colour" value={config.typography.heading_color} onChange={(v) => update({ typography: { ...config.typography, heading_color: v } })} />
              <ColorInput label="Body Colour" value={config.typography.body_color} onChange={(v) => update({ typography: { ...config.typography, body_color: v } })} />
              <ColorInput label="Button Background" value={config.button.bg_color} onChange={(v) => update({ button: { ...config.button, bg_color: v } })} />
              <ColorInput label="Button Text" value={config.button.text_color} onChange={(v) => update({ button: { ...config.button, text_color: v } })} />
              <ColorInput label="Overlay Colour" value={config.overlay.color} onChange={(v) => update({ overlay: { ...config.overlay, color: v } })} />
              <RangeInput label="Overlay Opacity" value={config.overlay.opacity} min={0} max={1} step={0.05} onChange={(v) => update({ overlay: { ...config.overlay, opacity: v } })} />
            </div>
          )}

          {tab === "typography" && (
            <div className="space-y-4">
              <FormField label="Heading Font"><Select value={config.typography.heading_font} onChange={(e) => update({ typography: { ...config.typography, heading_font: e.target.value } })}>{FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}</Select></FormField>
              <FormField label="Body Font"><Select value={config.typography.body_font} onChange={(e) => update({ typography: { ...config.typography, body_font: e.target.value } })}>{FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}</Select></FormField>
              <Input label="Heading Size" value={config.typography.heading_size} onChange={(e) => update({ typography: { ...config.typography, heading_size: e.target.value } })} />
              <Input label="Body Size" value={config.typography.body_size} onChange={(e) => update({ typography: { ...config.typography, body_size: e.target.value } })} />
              <Input label="Heading Weight" value={config.typography.heading_weight} onChange={(e) => update({ typography: { ...config.typography, heading_weight: e.target.value } })} />
              <Input label="Letter Spacing" value={config.typography.letter_spacing} onChange={(e) => update({ typography: { ...config.typography, letter_spacing: e.target.value } })} />
            </div>
          )}

          {tab === "layout" && (
            <div className="space-y-4">
              <FormField label="Content Alignment"><Select value={config.layout.content_alignment} onChange={(e) => update({ layout: { ...config.layout, content_alignment: e.target.value as "left" | "center" | "right" } })}><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></Select></FormField>
              <FormField label="Vertical Position"><Select value={config.layout.vertical_position} onChange={(e) => update({ layout: { ...config.layout, vertical_position: e.target.value as "top" | "center" | "bottom" } })}><option value="top">Top</option><option value="center">Center</option><option value="bottom">Bottom</option></Select></FormField>
              <Input label="Max Width" value={config.layout.max_width} onChange={(e) => update({ layout: { ...config.layout, max_width: e.target.value } })} />
              <Input label="Padding" value={config.layout.padding} onChange={(e) => update({ layout: { ...config.layout, padding: e.target.value } })} />
              <Input label="Corner Radius" value={config.corner_radius} onChange={(e) => update({ corner_radius: e.target.value })} />
              <Input label="Button Border Radius" value={config.button.border_radius} onChange={(e) => update({ button: { ...config.button, border_radius: e.target.value } })} />
              <Input label="Button Padding X" value={config.button.padding_x} onChange={(e) => update({ button: { ...config.button, padding_x: e.target.value } })} />
              <Input label="Button Padding Y" value={config.button.padding_y} onChange={(e) => update({ button: { ...config.button, padding_y: e.target.value } })} />
            </div>
          )}

          {tab === "background" && (
            <div className="space-y-4">
              <FormField label="Background Type"><Select value={config.background.type} onChange={(e) => update({ background: { ...config.background, type: e.target.value as "image" | "video" | "slideshow" | "color" } })}><option value="image">Image</option><option value="video">Video</option><option value="slideshow">Slideshow</option><option value="color">Solid Colour</option></Select></FormField>
              {config.background.type === "image" && <ImageUpload value={config.background.image_url} onChange={(url) => update({ background: { ...config.background, image_url: url } })} label="Background Image" />}
              {config.background.type === "video" && <VideoUpload value={config.background.video_url} onChange={(url) => update({ background: { ...config.background, video_url: url } })} label="Background Video" />}
              {config.background.type === "color" && <ColorInput label="Background Colour" value={config.background.color} onChange={(v) => update({ background: { ...config.background, color: v } })} />}
              <Input label="Blur" value={config.blur} onChange={(e) => update({ blur: e.target.value })} />
              <RangeInput label="Brightness" value={config.brightness} min={0} max={2} step={0.05} onChange={(v) => update({ brightness: v })} />
              <Toggle checked={config.overlay.enabled} onChange={(v) => update({ overlay: { ...config.overlay, enabled: v } })} label="Enable Overlay" />
            </div>
          )}
        </Card>
      </SplitEditor>
    </AdminLayout>
  );
}
