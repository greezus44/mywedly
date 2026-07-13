import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Wedding } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Label, Toggle } from "../../components/ui/Input";
import { Card, Badge, Toast } from "../../components/ui/index";
import { ImageUpload, FormField } from "../../components/ui/ImageUpload";
import { formatDate } from "../../lib/utils";
import { Save, Globe, Eye, AlertCircle, CheckCircle2, Calendar } from "lucide-react";

export function SettingsPage() {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<{
    slug: string;
    couple_name_one: string;
    couple_name_two: string;
    full_name_one: string | null;
    full_name_two: string | null;
    wedding_date: string | null;
    location: string | null;
    hashtag: string | null;
    hero_image_url: string | null;
    story: string | null;
    signin_helper: string | null;
    rsvp_deadline: string | null;
    contact_phone: string | null;
    cover_monogram_url: string | null;
  } | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const { data: wedding, isLoading, error } = useQuery({
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
      setSettings({
        slug: wedding.slug,
        couple_name_one: wedding.couple_name_one,
        couple_name_two: wedding.couple_name_two,
        full_name_one: wedding.full_name_one || null,
        full_name_two: wedding.full_name_two || null,
        wedding_date: wedding.wedding_date,
        location: wedding.location,
        hashtag: wedding.hashtag,
        hero_image_url: wedding.hero_image_url,
        story: wedding.story,
        signin_helper: wedding.signin_helper,
        rsvp_deadline: wedding.rsvp_deadline,
        contact_phone: wedding.contact_phone,
        cover_monogram_url: wedding.cover_monogram_url,
      });
    }
  }, [wedding]);

  const saveMutation = useMutation({
    mutationFn: async (data: typeof settings) => {
      if (!data) return;
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("weddings")
        .update({
          slug: data.slug,
          couple_name_one: data.couple_name_one,
          couple_name_two: data.couple_name_two,
          full_name_one: data.full_name_one,
          full_name_two: data.full_name_two,
          wedding_date: data.wedding_date,
          location: data.location,
          hashtag: data.hashtag,
          hero_image_url: data.hero_image_url,
          story: data.story,
          signin_helper: data.signin_helper,
          rsvp_deadline: data.rsvp_deadline,
          contact_phone: data.contact_phone,
          cover_monogram_url: data.cover_monogram_url,
          updated_at: new Date().toISOString(),
        })
        .eq("created_by", user.user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wedding"] });
      setToast({ message: "Settings saved", type: "success" });
    },
    onError: (err) => setToast({ message: err.message || "Failed to save settings", type: "error" }),
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      if (!wedding) return;
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const draftContent = wedding.draft_content || wedding.content;
      const draftTheme = wedding.draft_theme_config || wedding.theme_config;
      const { error } = await supabase
        .from("weddings")
        .update({
          is_published: !wedding.is_published,
          content: draftContent,
          theme_config: draftTheme,
          updated_at: new Date().toISOString(),
        })
        .eq("created_by", user.user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wedding"] });
      setToast({
        message: wedding?.is_published ? "Website unpublished" : "Website published! Draft is now live.",
        type: "success",
      });
    },
    onError: (err) => setToast({ message: err.message || "Failed to toggle publish", type: "error" }),
  });

  const update = (key: string, value: unknown) => setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full p-8">
          <div className="font-ui text-sm text-gray-400">Loading settings...</div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !wedding || !settings) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full p-8">
          <p className="font-ui text-sm text-red-500">Unable to load wedding data</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-6 md:p-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="font-heading text-2xl text-[var(--color-text)]">Settings</h1>
            <p className="font-ui text-sm text-[var(--color-text-muted)]">Manage your wedding website configuration</p>
          </div>

          {/* Publish Card */}
          <Card className="p-6 mb-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-[var(--color-primary)]/10 rounded-lg">
                  <Globe size={20} className="text-[var(--color-primary)]" />
                </div>
                <div>
                  <h3 className="font-heading text-lg text-[var(--color-text)] mb-1">Publish Website</h3>
                  <p className="font-ui text-sm text-[var(--color-text-muted)] mb-2">
                    {wedding.is_published
                      ? "Your website is live. Guests can view it at the published URL."
                      : "Your website is in draft mode. Only you can see it."}
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge variant={wedding.is_published ? "success" : "warning"}>
                      {wedding.is_published ? "Published" : "Draft"}
                    </Badge>
                    <span className="font-ui text-xs text-[var(--color-text-muted)]">
                      /{wedding.slug}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Toggle
                  checked={wedding.is_published}
                  onChange={() => publishMutation.mutate()}
                  label={wedding.is_published ? "Live" : "Draft"}
                />
                <Button
                  variant={wedding.is_published ? "danger" : "primary"}
                  size="sm"
                  onClick={() => publishMutation.mutate()}
                  disabled={publishMutation.isPending}
                >
                  {publishMutation.isPending
                    ? "Updating..."
                    : wedding.is_published
                    ? "Unpublish"
                    : "Publish Now"}
                </Button>
              </div>
            </div>
            {!wedding.is_published && (
              <div className="mt-4 p-3 bg-[var(--color-warning)]/10 rounded-lg flex items-start gap-2">
                <AlertCircle size={16} className="text-[var(--color-warning)] mt-0.5 flex-shrink-0" />
                <p className="font-ui text-xs text-[var(--color-text)]">
                  Publishing will copy your draft content and theme to the live site. Make sure everything looks good in the preview first.
                </p>
              </div>
            )}
            {wedding.is_published && (
              <div className="mt-4 p-3 bg-[var(--color-success)]/10 rounded-lg flex items-start gap-2">
                <CheckCircle2 size={16} className="text-[var(--color-success)] mt-0.5 flex-shrink-0" />
                <p className="font-ui text-xs text-[var(--color-text)]">
                  Website is live at /{wedding.slug}. Any draft changes need to be re-published to appear.
                </p>
              </div>
            )}
          </Card>

          {/* Wedding Details */}
          <Card className="p-6 mb-6">
            <h3 className="font-heading text-lg text-[var(--color-text)] mb-4">Wedding Details</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Partner One (Short Name)">
                  <Input value={settings.couple_name_one} onChange={(e) => update("couple_name_one", e.target.value)} placeholder="Jane" />
                </FormField>
                <FormField label="Partner Two (Short Name)">
                  <Input value={settings.couple_name_two} onChange={(e) => update("couple_name_two", e.target.value)} placeholder="John" />
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Partner One (Full Name)">
                  <Input value={settings.full_name_one || ""} onChange={(e) => update("full_name_one", e.target.value || null)} placeholder="Jane Elizabeth Doe" />
                </FormField>
                <FormField label="Partner Two (Full Name)">
                  <Input value={settings.full_name_two || ""} onChange={(e) => update("full_name_two", e.target.value || null)} placeholder="John Michael Smith" />
                </FormField>
              </div>

              <FormField label="Wedding Date & Time">
                <Input
                  type="datetime-local"
                  value={settings.wedding_date ? new Date(settings.wedding_date).toISOString().slice(0, 16) : ""}
                  onChange={(e) => update("wedding_date", e.target.value ? new Date(e.target.value).toISOString() : null)}
                />
              </FormField>

              <FormField label="Location">
                <Input value={settings.location || ""} onChange={(e) => update("location", e.target.value || null)} placeholder="Grand Ballroom, Kuala Lumpur" />
              </FormField>

              <FormField label="Hashtag">
                <Input value={settings.hashtag || ""} onChange={(e) => update("hashtag", e.target.value || null)} placeholder="#JaneAndJohn2025" />
              </FormField>

              <FormField label="Story">
                <Textarea value={settings.story || ""} onChange={(e) => update("story", e.target.value || null)} placeholder="Our love story..." rows={4} />
              </FormField>

              <FormField label="Hero Image">
                <ImageUpload value={settings.hero_image_url || null} onChange={(v) => update("hero_image_url", v)} />
              </FormField>

              <FormField label="Cover Monogram">
                <ImageUpload value={settings.cover_monogram_url || null} onChange={(v) => update("cover_monogram_url", v)} />
              </FormField>
            </div>
          </Card>

          {/* Guest Settings */}
          <Card className="p-6 mb-6">
            <h3 className="font-heading text-lg text-[var(--color-text)] mb-4">Guest Settings</h3>
            <div className="space-y-4">
              <FormField label="Sign-in Helper Text" hint="Shown on the guest login page">
                <Textarea
                  value={settings.signin_helper || ""}
                  onChange={(e) => update("signin_helper", e.target.value || null)}
                  placeholder="Enter your invite code or username to access the wedding site"
                  rows={2}
                />
              </FormField>

              <FormField label="RSVP Deadline">
                <Input
                  type="datetime-local"
                  value={settings.rsvp_deadline ? new Date(settings.rsvp_deadline).toISOString().slice(0, 16) : ""}
                  onChange={(e) => update("rsvp_deadline", e.target.value ? new Date(e.target.value).toISOString() : null)}
                />
              </FormField>

              <FormField label="Contact Phone">
                <Input value={settings.contact_phone || ""} onChange={(e) => update("contact_phone", e.target.value || null)} placeholder="+60 12 345 6789" />
              </FormField>
            </div>
          </Card>

          {/* URL Settings */}
          <Card className="p-6 mb-6">
            <h3 className="font-heading text-lg text-[var(--color-text)] mb-4">Website URL</h3>
            <FormField label="URL Slug" hint="The URL path for your wedding site">
              <div className="flex items-center gap-2">
                <span className="font-ui text-sm text-[var(--color-text-muted)]">/</span>
                <Input value={settings.slug} onChange={(e) => update("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} placeholder="jane-and-john" />
              </div>
            </FormField>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              variant="primary"
              size="md"
              onClick={() => saveMutation.mutate(settings)}
              disabled={saveMutation.isPending}
            >
              <Save size={16} className="mr-2" />
              {saveMutation.isPending ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </div>
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </AdminLayout>
  );
}
