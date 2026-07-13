import { useState, useMemo, type ReactNode } from "react";
import {
  Save, Eye, Image as ImageIcon, Music, Clock,
  AlignLeft, AlignCenter, AlignRight, Upload, Send, FileEdit,
  ChevronDown,
} from "lucide-react";
import { supabase, type Wedding, type CoverContent } from "@/lib/supabase";
import { useHostWedding } from "@/lib/use-host-wedding";
import { getDraftTheme } from "@/lib/theme";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Label, Select, Toggle } from "@/components/ui/Input";
import { Card, SectionTitle, Toast } from "@/components/ui";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { SplitEditor } from "@/components/preview/SplitEditor";
import { CoverPreview } from "@/components/preview/PreviewRenderers";
import { cn } from "@/lib/utils";

// ─── Accordion section ───
function AccordionSection({
  title,
  icon: Icon,
  defaultOpen = false,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between w-full px-5 py-4 text-left hover:bg-mist/50 transition-colors"
      >
        <span className="flex items-center gap-2.5">
          <Icon className="w-4 h-4 text-sepia" />
          <span className="text-sm font-medium text-onyx">{title}</span>
        </span>
        <ChevronDown
          className={cn("w-4 h-4 text-sepia/60 transition-transform", open && "rotate-180")}
        />
      </button>
      {open && <div className="px-5 pb-5 pt-1 space-y-4">{children}</div>}
    </Card>
  );
}

// ─── Text alignment button group ───
function TextAlignButtons({
  value,
  onChange,
}: {
  value: "left" | "center" | "right";
  onChange: (v: "left" | "center" | "right") => void;
}) {
  const opts: { key: "left" | "center" | "right"; icon: React.ComponentType<{ className?: string }>; label: string }[] = [
    { key: "left", icon: AlignLeft, label: "Left" },
    { key: "center", icon: AlignCenter, label: "Center" },
    { key: "right", icon: AlignRight, label: "Right" },
  ];
  return (
    <div className="inline-flex items-center gap-1 bg-mist rounded-lg p-1">
      {opts.map((o) => (
        <button
          key={o.key}
          type="button"
          title={o.label}
          onClick={() => onChange(o.key)}
          className={cn(
            "flex items-center justify-center w-9 h-8 rounded-md transition-colors",
            value === o.key ? "bg-card text-onyx shadow-sm" : "text-sepia hover:text-onyx"
          )}
        >
          <o.icon className="w-4 h-4" />
        </button>
      ))}
    </div>
  );
}

// ─── Main component ───
export function AdminCoverEditor() {
  const { wedding, loading, setWedding } = useHostWedding();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [saving, setSaving] = useState(false);

  // Initialize form state from draft_content (fallback to content)
  const initialContent = useMemo<CoverContent>(
    () =>
      ((wedding?.draft_content && Object.keys(wedding.draft_content).length > 0
        ? wedding.draft_content
        : wedding?.content) ?? {}) as CoverContent,
    [wedding]
  );

  const [form, setForm] = useState<CoverContent>(initialContent);

  // Re-sync form when wedding changes (e.g. after save/publish)
  const weddingContentKey = JSON.stringify(initialContent);
  const [lastSyncedKey, setLastSyncedKey] = useState(weddingContentKey);
  if (weddingContentKey !== lastSyncedKey) {
    setLastSyncedKey(weddingContentKey);
    setForm(initialContent);
  }

  const update = <K extends keyof CoverContent>(key: K, value: CoverContent[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  // Synthetic wedding object merging form state into draft_content for live preview
  const previewWedding = useMemo<Wedding>(
    () =>
      wedding
        ? { ...wedding, draft_content: { ...(wedding.draft_content ?? {}), ...form } }
        : ({} as Wedding),
    [wedding, form]
  );

  const theme = useMemo(() => getDraftTheme(wedding), [wedding]);

  // ─── Save Draft ───
  const saveDraft = async () => {
    if (!wedding) return;
    setSaving(true);
    try {
      const newContent = { ...form };
      const { error } = await supabase
        .from("weddings")
        .update({ draft_content: newContent })
        .eq("id", wedding.id);
      if (error) throw error;
      setWedding({ ...wedding, draft_content: newContent });
      setToast({ message: "Draft saved", type: "success" });
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : "Failed to save draft", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  // ─── Publish ───
  const publish = async () => {
    if (!wedding) return;
    setSaving(true);
    try {
      const newContent = { ...form };
      const { error } = await supabase
        .from("weddings")
        .update({ content: newContent, draft_content: {} })
        .eq("id", wedding.id);
      if (error) throw error;
      setWedding({ ...wedding, content: newContent, draft_content: {} });
      setToast({ message: "Cover published", type: "success" });
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : "Failed to publish", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !wedding) {
    return <div className="flex items-center justify-center py-24 text-sepia">Loading…</div>;
  }

  // ─── Editor form ───
  const editor = (
    <div className="space-y-4">
      {/* 1. Branding */}
      <AccordionSection title="Branding" icon={ImageIcon} defaultOpen>
        <div>
          <Label>Logo</Label>
          <ImageUpload
            weddingId={wedding.id}
            value={form.cover_logo_url ?? null}
            onChange={(url) => update("cover_logo_url", url ?? undefined)}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Logo Position</Label>
            <Select
              value={form.cover_logo_position ?? "center"}
              onChange={(e) => update("cover_logo_position", e.target.value as CoverContent["cover_logo_position"])}
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </Select>
          </div>
          <div>
            <Label>Logo Size</Label>
            <Input
              value={form.cover_logo_size ?? ""}
              onChange={(e) => update("cover_logo_size", e.target.value)}
              placeholder="80px"
            />
          </div>
        </div>
        <div className="flex items-center justify-between pt-1">
          <Label className="mb-0">Show Logo</Label>
          <Toggle
            checked={form.cover_logo_visible !== false}
            onChange={(v) => update("cover_logo_visible", v)}
          />
        </div>
      </AccordionSection>

      {/* 2. Hero Content */}
      <AccordionSection title="Hero Content" icon={FileEdit} defaultOpen>
        <div>
          <Label>Main Heading</Label>
          <Input
            value={form.cover_main_heading ?? ""}
            onChange={(e) => update("cover_main_heading", e.target.value)}
            placeholder="e.g. We're getting married"
          />
        </div>
        <div>
          <Label>Heading / Couple Names</Label>
          <Input
            value={form.cover_heading ?? ""}
            onChange={(e) => update("cover_heading", e.target.value)}
            placeholder={`${wedding.couple_name_one} & ${wedding.couple_name_two}`}
          />
        </div>
        <div>
          <Label>Subtitle</Label>
          <Input
            value={form.cover_subtitle ?? ""}
            onChange={(e) => update("cover_subtitle", e.target.value)}
            placeholder="A celebration of love"
          />
        </div>
        <div>
          <Label>Welcome Message</Label>
          <Textarea
            rows={3}
            value={form.cover_welcome ?? ""}
            onChange={(e) => update("cover_welcome", e.target.value)}
            placeholder="Welcome to our wedding website…"
          />
        </div>
        <div>
          <Label>Enter Button Text</Label>
          <Input
            value={form.cover_button_text ?? ""}
            onChange={(e) => update("cover_button_text", e.target.value)}
            placeholder="Enter Website"
          />
        </div>
      </AccordionSection>

      {/* 3. Background */}
      <AccordionSection title="Background" icon={Upload}>
        <div>
          <Label>Background Image</Label>
          <ImageUpload
            weddingId={wedding.id}
            value={form.cover_background_url ?? null}
            onChange={(url) => update("cover_background_url", url ?? undefined)}
          />
        </div>
        <div>
          <Label>Background Video URL</Label>
          <Input
            value={form.cover_background_video_url ?? ""}
            onChange={(e) => update("cover_background_video_url", e.target.value)}
            placeholder="https://…/video.mp4"
          />
        </div>
        <div>
          <Label>Overlay Opacity — {((form.cover_overlay_opacity ?? 0.3) * 100).toFixed(0)}%</Label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={form.cover_overlay_opacity ?? 0.3}
            onChange={(e) => update("cover_overlay_opacity", parseFloat(e.target.value))}
            className="w-full accent-onyx"
          />
        </div>
        <div className="flex items-center justify-between pt-1">
          <Label className="mb-0">Text Alignment</Label>
          <TextAlignButtons
            value={form.cover_text_align ?? "center"}
            onChange={(v) => update("cover_text_align", v)}
          />
        </div>
      </AccordionSection>

      {/* 4. Extras */}
      <AccordionSection title="Extras" icon={Music}>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm text-sepia">
            <Clock className="w-4 h-4" /> Countdown Timer
          </span>
          <Toggle
            checked={form.cover_countdown_enabled !== false}
            onChange={(v) => update("cover_countdown_enabled", v)}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm text-sepia">
            <Music className="w-4 h-4" /> Background Music
          </span>
          <Toggle
            checked={form.cover_music_enabled === true}
            onChange={(v) => update("cover_music_enabled", v)}
          />
        </div>
        {form.cover_music_enabled && (
          <div>
            <Label>Music URL</Label>
            <Input
              value={form.cover_music_url ?? ""}
              onChange={(e) => update("cover_music_url", e.target.value)}
              placeholder="https://…/song.mp3"
            />
          </div>
        )}
      </AccordionSection>
    </div>
  );

  // ─── Preview ───
  const preview = <CoverPreview wedding={previewWedding} theme={theme} />;

  // ─── Actions ───
  const actions = (
    <>
      <Button variant="outline" size="sm" onClick={saveDraft} disabled={saving}>
        <Save className="w-4 h-4" /> Save Draft
      </Button>
      <Button variant="primary" size="sm" onClick={publish} disabled={saving}>
        <Send className="w-4 h-4" /> Publish
      </Button>
    </>
  );

  return (
    <div>
      <SectionTitle
        title="Cover Page Editor"
        subtitle="Design the first impression of your wedding website. Changes preview instantly."
        action={<span className="hidden sm:flex items-center gap-1.5 text-xs text-sepia/70"><Eye className="w-4 h-4" /> Live Preview</span>}
      />
      <SplitEditor editor={editor} preview={preview} actions={actions} />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
