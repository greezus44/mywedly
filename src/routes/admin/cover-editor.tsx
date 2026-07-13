import { useState, useMemo } from "react";
import {
  Save, Eye, Image as ImageIcon, Music,
  AlignLeft, AlignCenter, AlignRight, Send,
  ChevronDown,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Wedding, CoverContent } from "@/lib/supabase";
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
  title, icon: Icon, defaultOpen = false, children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-5 py-4 text-left hover:bg-mist/50 transition-colors"
      >
        <span className="flex items-center gap-2.5">
          <Icon className="w-4 h-4 text-sepia" />
          <span className="text-sm font-medium text-onyx">{title}</span>
        </span>
        <ChevronDown
          className={cn("w-4 h-4 text-sepia transition-transform", open && "rotate-180")}
        />
      </button>
      {open && (
        <div className="px-5 pb-5 pt-1 space-y-4 border-t border-sand/50">
          {children}
        </div>
      )}
    </Card>
  );
}

// ─── Main component ───
export function AdminCoverEditor() {
  const { wedding, loading, setWedding } = useHostWedding();
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // ─── Initialize form state from draft_content (fallback to content) ───
  const initialContent = useMemo<CoverContent>(() => {
    if (!wedding) return {} as CoverContent;
    const draft = (wedding.draft_content ?? {}) as CoverContent;
    const published = (wedding.content ?? {}) as CoverContent;
    // If draft has keys, prefer draft; otherwise fall back to published
    const draftKeys = Object.keys(draft);
    if (draftKeys.length > 0) return { ...published, ...draft };
    return published;
  }, [wedding]);

  const [coverMainHeading, setCoverMainHeading] = useState(initialContent.cover_main_heading ?? "");
  const [coverHeading, setCoverHeading] = useState(initialContent.cover_heading ?? "");
  const [coverSubtitle, setCoverSubtitle] = useState(initialContent.cover_subtitle ?? "");
  const [coverWelcome, setCoverWelcome] = useState(initialContent.cover_welcome ?? "");
  const [coverButtonText, setCoverButtonText] = useState(initialContent.cover_button_text ?? "");
  const [coverBackgroundUrl, setCoverBackgroundUrl] = useState(initialContent.cover_background_url ?? "");
  const [coverBackgroundVideoUrl, setCoverBackgroundVideoUrl] = useState(initialContent.cover_background_video_url ?? "");
  const [coverOverlayOpacity, setCoverOverlayOpacity] = useState(initialContent.cover_overlay_opacity ?? 0.3);
  const [coverTextAlign, setCoverTextAlign] = useState<"left" | "center" | "right">(initialContent.cover_text_align ?? "center");
  const [coverLogoUrl, setCoverLogoUrl] = useState(initialContent.cover_logo_url ?? "");
  const [coverLogoPosition, setCoverLogoPosition] = useState<"left" | "center" | "right">(initialContent.cover_logo_position ?? "center");
  const [coverLogoSize, setCoverLogoSize] = useState(initialContent.cover_logo_size ?? "80px");
  const [coverLogoVisible, setCoverLogoVisible] = useState(initialContent.cover_logo_visible !== false);
  const [coverCountdownEnabled, setCoverCountdownEnabled] = useState(initialContent.cover_countdown_enabled !== false);
  const [coverMusicEnabled, setCoverMusicEnabled] = useState(initialContent.cover_music_enabled ?? false);
  const [coverMusicUrl, setCoverMusicUrl] = useState(initialContent.cover_music_url ?? "");

  // ─── Build the new content object from form state ───
  const newContent: CoverContent = useMemo(() => ({
    cover_main_heading: coverMainHeading,
    cover_heading: coverHeading,
    cover_subtitle: coverSubtitle,
    cover_welcome: coverWelcome,
    cover_button_text: coverButtonText,
    cover_background_url: coverBackgroundUrl,
    cover_background_video_url: coverBackgroundVideoUrl,
    cover_overlay_opacity: coverOverlayOpacity,
    cover_text_align: coverTextAlign,
    cover_logo_url: coverLogoUrl,
    cover_logo_position: coverLogoPosition,
    cover_logo_size: coverLogoSize,
    cover_logo_visible: coverLogoVisible,
    cover_countdown_enabled: coverCountdownEnabled,
    cover_music_enabled: coverMusicEnabled,
    cover_music_url: coverMusicUrl,
  }), [
    coverMainHeading, coverHeading, coverSubtitle, coverWelcome, coverButtonText,
    coverBackgroundUrl, coverBackgroundVideoUrl, coverOverlayOpacity, coverTextAlign,
    coverLogoUrl, coverLogoPosition, coverLogoSize, coverLogoVisible,
    coverCountdownEnabled, coverMusicEnabled, coverMusicUrl,
  ]);

  // ─── Synthetic wedding for live preview: merge form state into draft_content ───
  const previewWedding = useMemo<Wedding>(() => {
    if (!wedding) return {} as Wedding;
    return {
      ...wedding,
      draft_content: { ...(wedding.content ?? {}), ...newContent },
    };
  }, [wedding, newContent]);

  const theme = useMemo(() => getDraftTheme(wedding), [wedding]);

  // ─── Save Draft ───
  const handleSaveDraft = async () => {
    if (!wedding) return;
    setSaving(true);
    const { error } = await supabase
      .from("weddings")
      .update({ draft_content: newContent })
      .eq("id", wedding.id);
    setSaving(false);
    if (error) {
      setToast({ message: "Failed to save draft", type: "error" });
    } else {
      setWedding({ ...wedding, draft_content: newContent });
      setToast({ message: "Draft saved", type: "success" });
    }
  };

  // ─── Publish: copy draft to content, clear draft ───
  const handlePublish = async () => {
    if (!wedding) return;
    setPublishing(true);
    const { error } = await supabase
      .from("weddings")
      .update({ content: newContent, draft_content: {} })
      .eq("id", wedding.id);
    setPublishing(false);
    if (error) {
      setToast({ message: "Failed to publish", type: "error" });
    } else {
      setWedding({ ...wedding, content: newContent, draft_content: {} });
      setToast({ message: "Cover published!", type: "success" });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-sepia">Loading…</div>;
  }
  if (!wedding) {
    return <div className="text-center py-20 text-sepia">No wedding found.</div>;
  }

  // ─── Editor form (left panel) ───
  const editor = (
    <div className="space-y-4">
      {/* 1. Branding */}
      <AccordionSection title="Branding" icon={ImageIcon} defaultOpen>
        <div>
          <Label>Logo</Label>
          <ImageUpload
            weddingId={wedding.id}
            value={coverLogoUrl || null}
            onChange={(url) => setCoverLogoUrl(url ?? "")}
          />
        </div>
        <div>
          <Label>Logo Position</Label>
          <Select value={coverLogoPosition} onChange={(e) => setCoverLogoPosition(e.target.value as "left" | "center" | "right")}>
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </Select>
        </div>
        <div>
          <Label>Logo Size</Label>
          <Input
            value={coverLogoSize}
            onChange={(e) => setCoverLogoSize(e.target.value)}
            placeholder="80px"
          />
        </div>
        <div>
          <Label>Show Logo</Label>
          <Toggle checked={coverLogoVisible} onChange={setCoverLogoVisible} label={coverLogoVisible ? "Visible" : "Hidden"} />
        </div>
      </AccordionSection>

      {/* 2. Hero Content */}
      <AccordionSection title="Hero Content" icon={Eye} defaultOpen>
        <div>
          <Label>Main Heading (small label above title)</Label>
          <Input
            value={coverMainHeading}
            onChange={(e) => setCoverMainHeading(e.target.value)}
            placeholder="e.g. Together with their families"
          />
        </div>
        <div>
          <Label>Heading / Couple Names</Label>
          <Input
            value={coverHeading}
            onChange={(e) => setCoverHeading(e.target.value)}
            placeholder="e.g. Jane & John"
          />
        </div>
        <div>
          <Label>Subtitle</Label>
          <Input
            value={coverSubtitle}
            onChange={(e) => setCoverSubtitle(e.target.value)}
            placeholder="e.g. We're getting married"
          />
        </div>
        <div>
          <Label>Welcome Message</Label>
          <Textarea
            value={coverWelcome}
            onChange={(e) => setCoverWelcome(e.target.value)}
            rows={3}
            placeholder="A warm welcome message for your guests…"
          />
        </div>
        <div>
          <Label>Button Text</Label>
          <Input
            value={coverButtonText}
            onChange={(e) => setCoverButtonText(e.target.value)}
            placeholder="Enter Website"
          />
        </div>
      </AccordionSection>

      {/* 3. Background */}
      <AccordionSection title="Background" icon={ImageIcon}>
        <div>
          <Label>Background Image</Label>
          <ImageUpload
            weddingId={wedding.id}
            value={coverBackgroundUrl || null}
            onChange={(url) => setCoverBackgroundUrl(url ?? "")}
          />
        </div>
        <div>
          <Label>Background Video URL</Label>
          <Input
            value={coverBackgroundVideoUrl}
            onChange={(e) => setCoverBackgroundVideoUrl(e.target.value)}
            placeholder="https://… (mp4, webm)"
          />
        </div>
        <div>
          <Label>Overlay Opacity: {coverOverlayOpacity.toFixed(2)}</Label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={coverOverlayOpacity}
            onChange={(e) => setCoverOverlayOpacity(parseFloat(e.target.value))}
            className="w-full accent-onyx"
          />
        </div>
        <div>
          <Label>Text Alignment</Label>
          <div className="inline-flex items-center gap-1 bg-mist rounded-lg p-1">
            {([
              { val: "left", icon: AlignLeft, label: "Left" },
              { val: "center", icon: AlignCenter, label: "Center" },
              { val: "right", icon: AlignRight, label: "Right" },
            ] as const).map(({ val, icon: I, label }) => (
              <button
                key={val}
                type="button"
                title={label}
                onClick={() => setCoverTextAlign(val)}
                className={cn(
                  "flex items-center justify-center w-9 h-8 rounded-md transition-colors",
                  coverTextAlign === val ? "bg-card text-onyx shadow-sm" : "text-sepia hover:text-onyx"
                )}
              >
                <I className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>
      </AccordionSection>

      {/* 4. Extras */}
      <AccordionSection title="Extras" icon={Music}>
        <div>
          <Label>Countdown</Label>
          <Toggle
            checked={coverCountdownEnabled}
            onChange={setCoverCountdownEnabled}
            label={coverCountdownEnabled ? "Enabled" : "Disabled"}
          />
        </div>
        <div>
          <Label>Background Music</Label>
          <Toggle
            checked={coverMusicEnabled}
            onChange={setCoverMusicEnabled}
            label={coverMusicEnabled ? "Enabled" : "Disabled"}
          />
        </div>
        {coverMusicEnabled && (
          <div>
            <Label>Music URL</Label>
            <Input
              value={coverMusicUrl}
              onChange={(e) => setCoverMusicUrl(e.target.value)}
              placeholder="https://… (mp3)"
            />
          </div>
        )}
      </AccordionSection>
    </div>
  );

  // ─── Preview (right panel) ───
  const preview = <CoverPreview wedding={previewWedding} theme={theme} />;

  // ─── Actions ───
  const actions = (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={handleSaveDraft} disabled={saving}>
        <Save className="w-3.5 h-3.5" />
        {saving ? "Saving…" : "Save Draft"}
      </Button>
      <Button variant="primary" size="sm" onClick={handlePublish} disabled={publishing}>
        <Send className="w-3.5 h-3.5" />
        {publishing ? "Publishing…" : "Publish"}
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Cover Page Editor"
        subtitle="Design the first page guests see. Changes preview in real-time."
        action={
          <div className="flex items-center gap-2">
            <a
              href={`/w/${wedding.slug}?preview=true`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sepia text-sm hover:text-onyx transition-colors px-3 py-1.5 rounded-lg hover:bg-mist"
            >
              <Eye className="w-4 h-4" /> Open Preview
            </a>
          </div>
        }
      />

      <SplitEditor
        editor={editor}
        preview={preview}
        actions={actions}
        previewLabel="Cover Preview"
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

export default AdminCoverEditor;
