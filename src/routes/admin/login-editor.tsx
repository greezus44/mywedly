import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Wedding, type LoginConfig } from "../../lib/supabase";
import { DEFAULT_LOGIN_CONFIG, FONT_OPTIONS } from "../../lib/theme";
import { AdminLayout } from "./admin-layout";
import { SplitEditor, type DeviceType } from "../../components/preview/SplitEditor";
import { LoginPreview } from "../../components/preview/PreviewRenderers";
import { LogoControls } from "../../components/ui/LogoControls";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Select, Toggle, ColorInput, RangeInput, Label } from "../../components/ui/Input";
import { Card } from "../../components/ui/index";
import { ImageUpload, VideoUpload, FormField } from "../../components/ui/ImageUpload";
import { Save, RotateCcw, Type, Palette, Layout, Image as ImageIcon, Languages, FormInput, Sparkles } from "lucide-react";

type Tab = "branding" | "text" | "language" | "background" | "theme" | "typography" | "form" | "layout";

export function LoginEditorPage() {
  const [tab, setTab] = useState<Tab>("branding");
  const [device, setDevice] = useState<DeviceType>("desktop");
  const [config, setConfig] = useState<LoginConfig>(DEFAULT_LOGIN_CONFIG);
  const qc = useQueryClient();

  const { data: wedding } = useQuery({
    queryKey: ["wedding"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { data } = await supabase.from("weddings").select("*").eq("created_by", user.user.id).maybeSingle();
      if (data) { const c = (data as Wedding).draft_login_config || (data as Wedding).login_config || DEFAULT_LOGIN_CONFIG; setConfig(c); }
      return data as Wedding | null;
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { error } = await supabase.from("weddings").update({ draft_login_config: config }).eq("created_by", user.user.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wedding"] }),
  });

  const update = (patch: Partial<LoginConfig>) => setConfig({ ...config, ...patch });
  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "branding", label: "Branding", icon: <Sparkles className="h-4 w-4" /> },
    { id: "text", label: "Text Content", icon: <Type className="h-4 w-4" /> },
    { id: "language", label: "Language", icon: <Languages className="h-4 w-4" /> },
    { id: "background", label: "Background", icon: <ImageIcon className="h-4 w-4" /> },
    { id: "theme", label: "Theme", icon: <Palette className="h-4 w-4" /> },
    { id: "typography", label: "Typography", icon: <Type className="h-4 w-4" /> },
    { id: "form", label: "Form", icon: <FormInput className="h-4 w-4" /> },
    { id: "layout", label: "Layout", icon: <Layout className="h-4 w-4" /> },
  ];

  return (
    <AdminLayout>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Sign-In Page Editor</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setConfig(DEFAULT_LOGIN_CONFIG)}><RotateCcw className="mr-2 h-4 w-4" /> Reset</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}><Save className="mr-2 h-4 w-4" /> {save.isPending ? "Saving..." : "Save Draft"}</Button>
        </div>
      </div>
      <div className="mb-4 flex gap-2 border-b border-gray-200 overflow-x-auto">
        {tabs.map((t) => (<button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition ${tab === t.id ? "border-gray-900 text-gray-900" : "border-transparent text-gray-500 hover:text-gray-700"}`}>{t.icon} {t.label}</button>))}
      </div>
      <SplitEditor device={device} onDeviceChange={setDevice} preview={(d) => <LoginPreview wedding={wedding || null} device={d} />}>
        <Card className="space-y-4">
          {tab === "branding" && (<div className="space-y-4"><h3 className="text-sm font-semibold text-gray-900">Logo</h3><LogoControls logo={config.branding.logo} onChange={(logo) => update({ branding: { logo } })} device={device} /></div>)}
          {tab === "text" && (
            <div className="space-y-4">
              <FormField label="Page Title"><Input value={config.text.title} onChange={(e) => update({ text: { ...config.text, title: e.target.value } })} /></FormField>
              <FormField label="Subtitle"><Input value={config.text.subtitle} onChange={(e) => update({ text: { ...config.text, subtitle: e.target.value } })} /></FormField>
              <FormField label="Welcome Message"><Textarea value={config.text.welcome_message} onChange={(e) => update({ text: { ...config.text, welcome_message: e.target.value } })} /></FormField>
              <FormField label="Username Placeholder"><Input value={config.text.username_placeholder} onChange={(e) => update({ text: { ...config.text, username_placeholder: e.target.value } })} /></FormField>
              <FormField label="Sign-In Button Text"><Input value={config.text.button_text} onChange={(e) => update({ text: { ...config.text, button_text: e.target.value } })} /></FormField>
              <FormField label="Helper Text"><Input value={config.text.helper_text} onChange={(e) => update({ text: { ...config.text, helper_text: e.target.value } })} /></FormField>
              <FormField label="Footer Message"><Input value={config.text.footer_message} onChange={(e) => update({ text: { ...config.text, footer_message: e.target.value } })} /></FormField>
            </div>
          )}
          {tab === "language" && (
            <div className="space-y-4">
              <Toggle checked={config.language.enabled} onChange={(v) => update({ language: { ...config.language, enabled: v } })} label="Enable language selector" />
              <FormField label="Default Language"><Select value={config.language.default_lang} onChange={(e) => update({ language: { ...config.language, default_lang: e.target.value as "en" | "ms" } })}><option value="en">English</option><option value="ms">Bahasa Melayu</option></Select></FormField>
              <FormField label="English Label"><Input value={config.language.labels.en} onChange={(e) => update({ language: { ...config.language, labels: { ...config.language.labels, en: e.target.value } } })} /></FormField>
              <FormField label="Bahasa Melayu Label"><Input value={config.language.labels.ms} onChange={(e) => update({ language: { ...config.language, labels: { ...config.language.labels, ms: e.target.value } } })} /></FormField>
              <FormField label="Language Order"><Select value={config.language.order.join(",")} onChange={(e) => update({ language: { ...config.language, order: e.target.value.split(",") as ("en" | "ms")[] } })}><option value="en,ms">English first</option><option value="ms,en">Bahasa Melayu first</option></Select></FormField>
              <div className="border-t pt-4">
                <h4 className="mb-3 text-sm font-semibold text-gray-900">Language Selector Style</h4>
                <FormField label="Selector Style"><Select value={config.language_selector.style} onChange={(e) => update({ language_selector: { ...config.language_selector, style: e.target.value as "segmented" | "dropdown" } })}><option value="segmented">Segmented Control</option><option value="dropdown">Dropdown</option></Select></FormField>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <Input label="Button Radius" value={config.language_selector.button_radius} onChange={(e) => update({ language_selector: { ...config.language_selector, button_radius: e.target.value } })} />
                  <Input label="Font Size" value={config.language_selector.font_size} onChange={(e) => update({ language_selector: { ...config.language_selector, font_size: e.target.value } })} />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <Input label="Padding X" value={config.language_selector.button_padding_x} onChange={(e) => update({ language_selector: { ...config.language_selector, button_padding_x: e.target.value } })} />
                  <Input label="Padding Y" value={config.language_selector.button_padding_y} onChange={(e) => update({ language_selector: { ...config.language_selector, button_padding_y: e.target.value } })} />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <ColorInput label="Active BG" value={config.language_selector.active_bg} onChange={(v) => update({ language_selector: { ...config.language_selector, active_bg: v } })} />
                  <ColorInput label="Active Text" value={config.language_selector.active_text} onChange={(v) => update({ language_selector: { ...config.language_selector, active_text: v } })} />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <ColorInput label="Inactive Text" value={config.language_selector.inactive_text} onChange={(v) => update({ language_selector: { ...config.language_selector, inactive_text: v } })} />
                  <ColorInput label="Border" value={config.language_selector.border_color} onChange={(v) => update({ language_selector: { ...config.language_selector, border_color: v } })} />
                </div>
                <div className="mt-3"><Input label="Font Weight" value={config.language_selector.font_weight} onChange={(e) => update({ language_selector: { ...config.language_selector, font_weight: e.target.value } })} /></div>
              </div>
            </div>
          )}
          {tab === "background" && (
            <div className="space-y-4">
              <FormField label="Background Type"><Select value={config.background.type} onChange={(e) => update({ background: { ...config.background, type: e.target.value as "image" | "video" | "color" } })}><option value="image">Image</option><option value="video">Video</option><option value="color">Solid Colour</option></Select></FormField>
              {config.background.type === "image" && <ImageUpload value={config.background.image_url} onChange={(url) => update({ background: { ...config.background, image_url: url } })} label="Background Image" />}
              {config.background.type === "video" && <VideoUpload value={config.background.video_url} onChange={(url) => update({ background: { ...config.background, video_url: url } })} label="Background Video" />}
              {config.background.type === "color" && <ColorInput label="Background Colour" value={config.background.color} onChange={(v) => update({ background: { ...config.background, color: v } })} />}
              <Toggle checked={config.overlay.enabled} onChange={(v) => update({ overlay: { ...config.overlay, enabled: v } })} label="Enable Overlay" />
              <ColorInput label="Overlay Colour" value={config.overlay.color} onChange={(v) => update({ overlay: { ...config.overlay, color: v } })} />
              <RangeInput label="Overlay Opacity" value={config.overlay.opacity} min={0} max={1} step={0.05} onChange={(v) => update({ overlay: { ...config.overlay, opacity: v } })} />
              <Input label="Blur" value={config.blur} onChange={(e) => update({ blur: e.target.value })} />
              <RangeInput label="Brightness" value={config.brightness} min={0} max={2} step={0.05} onChange={(v) => update({ brightness: v })} />
            </div>
          )}
          {tab === "theme" && (
            <div className="space-y-4">
              <ColorInput label="Primary Colour" value={config.theme.primary} onChange={(v) => update({ theme: { ...config.theme, primary: v } })} />
              <ColorInput label="Secondary Colour" value={config.theme.secondary} onChange={(v) => update({ theme: { ...config.theme, secondary: v } })} />
              <ColorInput label="Accent Colour" value={config.theme.accent} onChange={(v) => update({ theme: { ...config.theme, accent: v } })} />
              <ColorInput label="Text Colour" value={config.theme.text} onChange={(v) => update({ theme: { ...config.theme, text: v } })} />
              <ColorInput label="Button Colour" value={config.theme.button_bg} onChange={(v) => update({ theme: { ...config.theme, button_bg: v } })} />
              <ColorInput label="Button Text Colour" value={config.theme.button_text} onChange={(v) => update({ theme: { ...config.theme, button_text: v } })} />
              <ColorInput label="Input Field Colour" value={config.theme.input_bg} onChange={(v) => update({ theme: { ...config.theme, input_bg: v } })} />
              <ColorInput label="Border Colour" value={config.theme.border} onChange={(v) => update({ theme: { ...config.theme, border: v } })} />
            </div>
          )}
          {tab === "typography" && (
            <div className="space-y-4">
              <FormField label="Heading Font"><Select value={config.typography.heading_font} onChange={(e) => update({ typography: { ...config.typography, heading_font: e.target.value } })}>{FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}</Select></FormField>
              <FormField label="Body Font"><Select value={config.typography.body_font} onChange={(e) => update({ typography: { ...config.typography, body_font: e.target.value } })}>{FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}</Select></FormField>
              <Input label="Heading Size" value={config.typography.heading_size} onChange={(e) => update({ typography: { ...config.typography, heading_size: e.target.value } })} />
              <Input label="Body Size" value={config.typography.body_size} onChange={(e) => update({ typography: { ...config.typography, body_size: e.target.value } })} />
              <Input label="Heading Weight" value={config.typography.heading_weight} onChange={(e) => update({ typography: { ...config.typography, heading_weight: e.target.value } })} />
              <Input label="Body Weight" value={config.typography.body_weight} onChange={(e) => update({ typography: { ...config.typography, body_weight: e.target.value } })} />
              <Input label="Letter Spacing" value={config.typography.letter_spacing} onChange={(e) => update({ typography: { ...config.typography, letter_spacing: e.target.value } })} />
            </div>
          )}
          {tab === "form" && (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-900">Username Input</h4>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Width" value={config.form.input.width} onChange={(e) => update({ form: { ...config.form, input: { ...config.form.input, width: e.target.value } } })} />
                <Input label="Height" value={config.form.input.height} onChange={(e) => update({ form: { ...config.form, input: { ...config.form.input, height: e.target.value } } })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Border Radius" value={config.form.input.border_radius} onChange={(e) => update({ form: { ...config.form, input: { ...config.form.input, border_radius: e.target.value } } })} />
                <Input label="Font Size" value={config.form.input.font_size} onChange={(e) => update({ form: { ...config.form, input: { ...config.form.input, font_size: e.target.value } } })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <ColorInput label="Border Colour" value={config.form.input.border_color} onChange={(v) => update({ form: { ...config.form, input: { ...config.form.input, border_color: v } } })} />
                <ColorInput label="Background" value={config.form.input.background} onChange={(v) => update({ form: { ...config.form, input: { ...config.form.input, background: v } } })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <ColorInput label="Placeholder Colour" value={config.form.input.placeholder_color} onChange={(v) => update({ form: { ...config.form, input: { ...config.form.input, placeholder_color: v } } })} />
                <ColorInput label="Text Colour" value={config.form.input.text_color} onChange={(v) => update({ form: { ...config.form, input: { ...config.form.input, text_color: v } } })} />
              </div>
              <ColorInput label="Focus Border Colour" value={config.form.input.focus_border_color} onChange={(v) => update({ form: { ...config.form, input: { ...config.form.input, focus_border_color: v } } })} />
              <Input label="Shadow" value={config.form.input.shadow} onChange={(e) => update({ form: { ...config.form, input: { ...config.form.input, shadow: e.target.value } } })} />
              <Input label="Padding" value={config.form.input.padding} onChange={(e) => update({ form: { ...config.form, input: { ...config.form.input, padding: e.target.value } } })} />
              <Toggle checked={config.form.username_field.show_label} onChange={(v) => update({ form: { ...config.form, username_field: { ...config.form.username_field, show_label: v } } })} label="Show field label" />
              <FormField label="Label Text"><Input value={config.form.username_field.label_text} onChange={(e) => update({ form: { ...config.form, username_field: { ...config.form.username_field, label_text: e.target.value } } })} /></FormField>
              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold text-gray-900">Sign-In Button</h4>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <Input label="Width" value={config.form.button.width} onChange={(e) => update({ form: { ...config.form, button: { ...config.form.button, width: e.target.value } } })} />
                  <Input label="Height" value={config.form.button.height} onChange={(e) => update({ form: { ...config.form, button: { ...config.form.button, height: e.target.value } } })} />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <Input label="Border Radius" value={config.form.button.border_radius} onChange={(e) => update({ form: { ...config.form, button: { ...config.form.button, border_radius: e.target.value } } })} />
                  <Input label="Font Size" value={config.form.button.font_size} onChange={(e) => update({ form: { ...config.form, button: { ...config.form.button, font_size: e.target.value } } })} />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <ColorInput label="BG Colour" value={config.form.button.bg_color} onChange={(v) => update({ form: { ...config.form, button: { ...config.form.button, bg_color: v } } })} />
                  <ColorInput label="Text Colour" value={config.form.button.text_color} onChange={(v) => update({ form: { ...config.form, button: { ...config.form.button, text_color: v } } })} />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <ColorInput label="Hover BG" value={config.form.button.hover_bg_color} onChange={(v) => update({ form: { ...config.form, button: { ...config.form.button, hover_bg_color: v } } })} />
                  <Input label="Font Weight" value={config.form.button.font_weight} onChange={(e) => update({ form: { ...config.form, button: { ...config.form.button, font_weight: e.target.value } } })} />
                </div>
                <div className="mt-3"><Input label="Shadow" value={config.form.button.shadow} onChange={(e) => update({ form: { ...config.form, button: { ...config.form.button, shadow: e.target.value } } })} /></div>
                <div className="mt-3"><FormField label="Loading Text"><Input value={config.form.button.loading_text} onChange={(e) => update({ form: { ...config.form, button: { ...config.form.button, loading_text: e.target.value } } })} /></FormField></div>
              </div>
            </div>
          )}
          {tab === "layout" && (
            <div className="space-y-4">
              <FormField label="Content Alignment"><Select value={config.layout.content_alignment} onChange={(e) => update({ layout: { ...config.layout, content_alignment: e.target.value as "left" | "center" | "right" } })}><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></Select></FormField>
              <FormField label="Vertical Position"><Select value={config.layout.vertical_position} onChange={(e) => update({ layout: { ...config.layout, vertical_position: e.target.value as "top" | "center" | "bottom" } })}><option value="top">Top</option><option value="center">Center</option><option value="bottom">Bottom</option></Select></FormField>
              <Input label="Max Width" value={config.layout.max_width} onChange={(e) => update({ layout: { ...config.layout, max_width: e.target.value } })} />
              <Input label="Spacing Between Elements" value={config.layout.spacing} onChange={(e) => update({ layout: { ...config.layout, spacing: e.target.value } })} />
              <Input label="Padding" value={config.layout.padding} onChange={(e) => update({ layout: { ...config.layout, padding: e.target.value } })} />
              <Input label="Margin" value={config.layout.margin} onChange={(e) => update({ layout: { ...config.layout, margin: e.target.value } })} />
            </div>
          )}
        </Card>
      </SplitEditor>
    </AdminLayout>
  );
}
