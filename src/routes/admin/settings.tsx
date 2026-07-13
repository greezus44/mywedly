import { useState, useEffect } from "react";
import { Save, Eye, ExternalLink, Heart, Calendar, MapPin, Hash } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Wedding } from "@/lib/supabase";
import { useHostWedding } from "@/lib/use-host-wedding";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Label, Toggle } from "@/components/ui/Input";
import { Card, SectionTitle, Toast } from "@/components/ui";
import { ImageUpload } from "@/components/ui/ImageUpload";

type SettingsForm = {
  couple_name_one: string;
  couple_name_two: string;
  wedding_date: string;
  location: string;
  hero_image_url: string | null;
  story: string;
  hashtag: string;
  is_published: boolean;
};

function toForm(wedding: Wedding): SettingsForm {
  return {
    couple_name_one: wedding.couple_name_one ?? "",
    couple_name_two: wedding.couple_name_two ?? "",
    wedding_date: wedding.wedding_date ?? "",
    location: wedding.location ?? "",
    hero_image_url: wedding.hero_image_url,
    story: wedding.story ?? "",
    hashtag: wedding.hashtag ?? "",
    is_published: wedding.is_published,
  };
}

export function AdminSettings() {
  const { wedding, loading, setWedding } = useHostWedding();

  const [form, setForm] = useState<SettingsForm>(() =>
    wedding ? toForm(wedding) : {
      couple_name_one: "",
      couple_name_two: "",
      wedding_date: "",
      location: "",
      hero_image_url: null,
      story: "",
      hashtag: "",
      is_published: false,
    },
  );
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Re-init form when wedding loads/changes
  const loadedKey = wedding?.id;
  const [initKey, setInitKey] = useState<string | undefined>(undefined);
  useEffect(() => {
    if (loadedKey && initKey !== loadedKey && wedding) {
      setInitKey(loadedKey);
      setForm(toForm(wedding));
    }
  }, [loadedKey, initKey, wedding]);

  if (loading) {
    return <div className="flex items-center justify-center py-24 text-sepia">Loading settings…</div>;
  }

  if (!wedding) {
    return <div className="text-center py-24 text-sepia">No wedding found.</div>;
  }

  const publicUrl = `${window.location.origin}/w/${wedding.slug}`;

  const save = async () => {
    setSaving(true);
    const updates = {
      couple_name_one: form.couple_name_one,
      couple_name_two: form.couple_name_two,
      wedding_date: form.wedding_date || null,
      location: form.location || null,
      hero_image_url: form.hero_image_url,
      story: form.story || null,
      hashtag: form.hashtag || null,
      is_published: form.is_published,
    };
    const { data, error } = await supabase
      .from("weddings")
      .update(updates)
      .eq("id", wedding.id)
      .select()
      .maybeSingle();

    setSaving(false);
    if (error) {
      setToast({ message: "Failed to save settings", type: "error" });
    } else if (data) {
      setWedding(data as Wedding);
      setToast({ message: "Settings saved", type: "success" });
    }
  };

  return (
    <div>
      <SectionTitle
        title="Settings"
        subtitle="Manage your wedding details and publication status."
        action={
          <Button size="sm" onClick={save} disabled={saving}>
            <Save className="w-4 h-4" /> {saving ? "Saving…" : "Save Changes"}
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ─── Couple Names ─── */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Heart className="w-4 h-4 text-sepia" />
            <h3 className="text-sm font-medium text-onyx">Couple</h3>
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

        {/* ─── Wedding Date & Location ─── */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-sepia" />
            <h3 className="text-sm font-medium text-onyx">Date & Location</h3>
          </div>
          <div className="space-y-4">
            <div>
              <Label>Wedding Date</Label>
              <Input
                type="date"
                value={form.wedding_date}
                onChange={(e) => setForm((f) => ({ ...f, wedding_date: e.target.value }))}
              />
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

        {/* ─── Hero Image ─── */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Eye className="w-4 h-4 text-sepia" />
            <h3 className="text-sm font-medium text-onyx">Hero Image</h3>
          </div>
          <ImageUpload
            weddingId={wedding.id}
            value={form.hero_image_url}
            onChange={(url) => setForm((f) => ({ ...f, hero_image_url: url }))}
            label="Main background image"
          />
        </Card>

        {/* ─── Story & Hashtag ─── */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Hash className="w-4 h-4 text-sepia" />
            <h3 className="text-sm font-medium text-onyx">Story & Hashtag</h3>
          </div>
          <div className="space-y-4">
            <div>
              <Label>Our Story</Label>
              <Textarea
                value={form.story}
                onChange={(e) => setForm((f) => ({ ...f, story: e.target.value }))}
                placeholder="Tell your guests how you met, the proposal story, or anything else you'd like to share…"
                rows={5}
              />
            </div>
            <div>
              <Label>Wedding Hashtag</Label>
              <Input
                value={form.hashtag}
                onChange={(e) => setForm((f) => ({ ...f, hashtag: e.target.value }))}
                placeholder="#JaneAndJohn2025"
              />
            </div>
          </div>
        </Card>
      </div>

      {/* ─── Publication ─── */}
      <Card className="p-6 mt-6">
        <div className="flex items-center gap-2 mb-4">
          <ExternalLink className="w-4 h-4 text-sepia" />
          <h3 className="text-sm font-medium text-onyx">Publication</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-mist/30">
            <div>
              <p className="text-sm font-medium text-onyx">
                {form.is_published ? "Website is live" : "Website is private"}
              </p>
              <p className="text-xs text-sepia/60 mt-0.5">
                {form.is_published
                  ? "Guests can view your wedding website."
                  : "Only you can see the website. Toggle this to make it public."}
              </p>
            </div>
            <Toggle
              checked={form.is_published}
              onChange={(v) => setForm((f) => ({ ...f, is_published: v }))}
              label={form.is_published ? "Published" : "Private"}
            />
          </div>

          <div>
            <Label>Public URL</Label>
            <div className="flex items-center gap-2">
              <Input
                value={publicUrl}
                readOnly
                className="font-mono text-xs"
              />
              <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" type="button">
                  <ExternalLink className="w-4 h-4" /> Visit
                </Button>
              </a>
            </div>
            <p className="text-xs text-sepia/50 mt-1.5">
              Share this link with your guests so they can RSVP and view your wedding details.
            </p>
          </div>
        </div>
      </Card>

      {/* ─── Save bar ─── */}
      <div className="flex justify-end mt-6">
        <Button onClick={save} disabled={saving}>
          <Save className="w-4 h-4" /> {saving ? "Saving…" : "Save Changes"}
        </Button>
      </div>

      {/* ─── Toast ─── */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
