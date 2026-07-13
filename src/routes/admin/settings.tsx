import { useEffect, useState } from "react";
import {
  Save, Eye, ExternalLink, Heart, Calendar, MapPin, Image as ImageIcon,
  FileText, Hash, Loader2,
} from "lucide-react";
import { supabase, type Wedding } from "@/lib/supabase";
import { useHostWedding } from "@/lib/use-host-wedding";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Label, Toggle } from "@/components/ui/Input";
import { Card, SectionTitle, Toast, Badge } from "@/components/ui";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { cn, formatDate } from "@/lib/utils";

type SettingsForm = {
  couple_name_one: string;
  couple_name_two: string;
  wedding_date: string;
  location: string;
  hero_image_url: string;
  story: string;
  hashtag: string;
  is_published: boolean;
};

export function AdminSettings() {
  const { wedding, loading, setWedding } = useHostWedding();

  const [form, setForm] = useState<SettingsForm>({
    couple_name_one: "",
    couple_name_two: "",
    wedding_date: "",
    location: "",
    hero_image_url: "",
    story: "",
    hashtag: "",
    is_published: false,
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ─── Initialize form from wedding ───
  useEffect(() => {
    if (wedding) {
      setForm({
        couple_name_one: wedding.couple_name_one ?? "",
        couple_name_two: wedding.couple_name_two ?? "",
        wedding_date: wedding.wedding_date ?? "",
        location: wedding.location ?? "",
        hero_image_url: wedding.hero_image_url ?? "",
        story: wedding.story ?? "",
        hashtag: wedding.hashtag ?? "",
        is_published: wedding.is_published ?? false,
      });
    }
  }, [wedding?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Save ───
  const save = async () => {
    if (!wedding) return;
    setSaving(true);
    const payload = {
      couple_name_one: form.couple_name_one.trim() || "First",
      couple_name_two: form.couple_name_two.trim() || "Second",
      wedding_date: form.wedding_date || null,
      location: form.location.trim() || null,
      hero_image_url: form.hero_image_url || null,
      story: form.story.trim() || null,
      hashtag: form.hashtag.trim() || null,
      is_published: form.is_published,
    };
    const { data, error } = await supabase
      .from("weddings")
      .update(payload)
      .eq("id", wedding.id)
      .select()
      .single();
    setSaving(false);
    if (error) { showToast(`Save failed: ${error.message}`, "error"); return; }
    if (data) setWedding(data as Wedding);
    showToast("Settings saved");
  };

  // ─── Render ───
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-sepia">
        <div className="animate-pulse">Loading settings…</div>
      </div>
    );
  }

  if (!wedding) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <h3 className="font-serif text-lg text-onyx mb-1">No wedding found</h3>
        <p className="text-sm text-sepia/70">Create a wedding to manage settings.</p>
      </div>
    );
  }

  const publicUrl = `${window.location.origin}/w/${wedding.slug}`;

  return (
    <div className="max-w-2xl">
      <SectionTitle
        title="Settings"
        subtitle="Manage your wedding details and publication status."
        action={
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        }
      />

      <div className="space-y-6">
        {/* ─── Couple names ─── */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Heart className="w-4 h-4 text-sepia" />
            <h3 className="font-serif text-lg text-onyx">The Couple</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Partner One</Label>
              <Input
                value={form.couple_name_one}
                onChange={(e) => setForm((f) => ({ ...f, couple_name_one: e.target.value }))}
                placeholder="First name"
              />
            </div>
            <div>
              <Label>Partner Two</Label>
              <Input
                value={form.couple_name_two}
                onChange={(e) => setForm((f) => ({ ...f, couple_name_two: e.target.value }))}
                placeholder="Second name"
              />
            </div>
          </div>
        </Card>

        {/* ─── Wedding details ─── */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-sepia" />
            <h3 className="font-serif text-lg text-onyx">Wedding Details</h3>
          </div>
          <div className="space-y-4">
            <div>
              <Label>Wedding Date</Label>
              <Input
                type="date"
                value={form.wedding_date}
                onChange={(e) => setForm((f) => ({ ...f, wedding_date: e.target.value }))}
              />
              {form.wedding_date && (
                <p className="text-xs text-sepia/60 mt-1.5">{formatDate(form.wedding_date)}</p>
              )}
            </div>
            <div>
              <Label>Location</Label>
              <Input
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                placeholder="e.g. Tuscany, Italy"
              />
            </div>
          </div>
        </Card>

        {/* ─── Hero image ─── */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <ImageIcon className="w-4 h-4 text-sepia" />
            <h3 className="font-serif text-lg text-onyx">Hero Image</h3>
          </div>
          <ImageUpload
            weddingId={wedding.id}
            value={form.hero_image_url || null}
            onChange={(url) => setForm((f) => ({ ...f, hero_image_url: url ?? "" }))}
            label="Cover Photo"
          />
        </Card>

        {/* ─── Story ─── */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-4 h-4 text-sepia" />
            <h3 className="font-serif text-lg text-onyx">Our Story</h3>
          </div>
          <Textarea
            rows={5}
            value={form.story}
            onChange={(e) => setForm((f) => ({ ...f, story: e.target.value }))}
            placeholder="Share the story of how you met and fell in love…"
          />
        </Card>

        {/* ─── Hashtag ─── */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Hash className="w-4 h-4 text-sepia" />
            <h3 className="font-serif text-lg text-onyx">Wedding Hashtag</h3>
          </div>
          <Input
            value={form.hashtag}
            onChange={(e) => setForm((f) => ({ ...f, hashtag: e.target.value }))}
            placeholder="#JaneAndJohn2026"
          />
        </Card>

        {/* ─── Publication ─── */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Eye className="w-4 h-4 text-sepia" />
            <h3 className="font-serif text-lg text-onyx">Publication</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-mist/50">
              <div>
                <p className="text-sm font-medium text-onyx">Website Published</p>
                <p className="text-xs text-sepia/60 mt-0.5">
                  When published, your site is visible to guests at the public URL.
                </p>
              </div>
              <Toggle
                checked={form.is_published}
                onChange={(v) => setForm((f) => ({ ...f, is_published: v }))}
                label={form.is_published ? "Live" : "Hidden"}
              />
            </div>

            <div>
              <Label>Public URL</Label>
              <div className="flex items-center gap-2">
                <div className={cn(
                  "flex-1 px-3 py-2 rounded-lg border border-sand bg-white text-sm text-sepia truncate",
                  !form.is_published && "opacity-60"
                )}>
                  {publicUrl}
                </div>
                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "p-2 rounded-lg border border-sand text-sepia hover:bg-mist transition-colors flex-shrink-0",
                    !form.is_published && "pointer-events-none opacity-50"
                  )}
                  title="Open public site"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
              <div className="flex items-center gap-2 mt-2">
                {form.is_published ? (
                  <Badge variant="success">Live</Badge>
                ) : (
                  <Badge variant="warning">Hidden</Badge>
                )}
                <span className="text-xs text-sepia/60">
                  {form.is_published
                    ? "Your site is live and accessible to guests."
                    : "Your site is hidden — only visible to you."}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* ─── Sticky save bar ─── */}
        <div className="flex justify-end pt-2">
          <Button onClick={save} disabled={saving} size="lg">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving…" : "Save All Changes"}
          </Button>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default AdminSettings;
