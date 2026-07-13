import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, Globe, Eye, EyeOff, Heart, Calendar, MapPin, Hash, Clock } from "lucide-react";
import { supabase, type Wedding } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { Button } from "../../components/ui/Button";
import { Input, Label, Toggle } from "../../components/ui/Input";
import { Card, Badge, Toast } from "../../components/ui/index";
import { FormField } from "../../components/ui/ImageUpload";

export function SettingsPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    couple_name_one: "",
    couple_name_two: "",
    wedding_date: "",
    location: "",
    hashtag: "",
    rsvp_deadline: "",
    is_published: false,
  });
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

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

  useEffect(() => {
    if (wedding) {
      setForm({
        couple_name_one: wedding.couple_name_one || "",
        couple_name_two: wedding.couple_name_two || "",
        wedding_date: wedding.wedding_date ? new Date(wedding.wedding_date).toISOString().slice(0, 16) : "",
        location: wedding.location || "",
        hashtag: wedding.hashtag || "",
        rsvp_deadline: wedding.rsvp_deadline ? new Date(wedding.rsvp_deadline).toISOString().slice(0, 16) : "",
        is_published: wedding.is_published,
      });
    }
  }, [wedding]);

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<Wedding>) => {
      if (!wedding) throw new Error("No wedding");
      const { error } = await supabase.from("weddings").update(updates).eq("id", wedding.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wedding"] });
      setToast({ message: "Settings saved", type: "success" });
    },
    onError: () => setToast({ message: "Failed to save settings", type: "error" }),
  });

  const publishMutation = useMutation({
    mutationFn: async (publish: boolean) => {
      if (!wedding) throw new Error("No wedding");
      const { error } = await supabase.from("weddings").update({ is_published: publish }).eq("id", wedding.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wedding"] });
      setForm((prev) => ({ ...prev, is_published: !prev.is_published }));
      setToast({ message: form.is_published ? "Wedding unpublished" : "Wedding published", type: "success" });
    },
    onError: () => setToast({ message: "Failed to update publish status", type: "error" }),
  });

  const handleSave = () => {
    updateMutation.mutate({
      couple_name_one: form.couple_name_one,
      couple_name_two: form.couple_name_two,
      wedding_date: form.wedding_date || null,
      location: form.location || null,
      hashtag: form.hashtag || null,
      rsvp_deadline: form.rsvp_deadline || null,
    });
  };

  const update = (key: keyof typeof form, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex-1 flex items-center justify-center">
          <p className="font-ui text-sm text-[var(--color-text-muted)]">Loading...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!wedding) {
    return (
      <AdminLayout>
        <div className="flex-1 flex items-center justify-center">
          <p className="font-ui text-sm text-[var(--color-text-muted)]">Wedding not found</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 md:px-6 py-8">
          <div className="mb-8">
            <h1 className="font-heading text-3xl text-[var(--color-text)] mb-1">Settings</h1>
            <p className="font-ui text-sm text-[var(--color-text-muted)]">Manage your wedding details and publication status</p>
          </div>

          <Card className="p-6 mb-6">
            <div className="flex items-center gap-2 mb-6">
              <Heart size={18} className="text-[var(--color-primary)]" />
              <h2 className="font-heading text-xl text-[var(--color-text)]">Couple Details</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Partner One Name">
                <Input value={form.couple_name_one} onChange={(e) => update("couple_name_one", e.target.value)} placeholder="Aisha" />
              </FormField>
              <FormField label="Partner Two Name">
                <Input value={form.couple_name_two} onChange={(e) => update("couple_name_two", e.target.value)} placeholder="Adam" />
              </FormField>
            </div>
          </Card>

          <Card className="p-6 mb-6">
            <div className="flex items-center gap-2 mb-6">
              <Calendar size={18} className="text-[var(--color-primary)]" />
              <h2 className="font-heading text-xl text-[var(--color-text)]">Event Details</h2>
            </div>

            <div className="space-y-4">
              <FormField label="Wedding Date & Time">
                <Input type="datetime-local" value={form.wedding_date} onChange={(e) => update("wedding_date", e.target.value)} />
              </FormField>

              <FormField label="Location">
                <Input value={form.location} onChange={(e) => update("location", e.target.value)} placeholder="Kuala Lumpur, Malaysia" />
              </FormField>

              <FormField label="Hashtag">
                <Input value={form.hashtag} onChange={(e) => update("hashtag", e.target.value)} placeholder="#AishaAndAdam2024" />
              </FormField>

              <FormField label="RSVP Deadline">
                <Input type="datetime-local" value={form.rsvp_deadline} onChange={(e) => update("rsvp_deadline", e.target.value)} />
              </FormField>
            </div>

            <div className="mt-6 pt-6 border-t border-[var(--color-border)]/15">
              <Button
                variant="primary"
                size="md"
                onClick={handleSave}
                disabled={updateMutation.isPending}
              >
                <Save size={14} className="mr-2" />
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </Card>

          <Card className="p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Globe size={18} className="text-[var(--color-primary)]" />
                <h2 className="font-heading text-xl text-[var(--color-text)]">Publication</h2>
              </div>
              <Badge variant={form.is_published ? "success" : "default"}>
                {form.is_published ? "Published" : "Draft"}
              </Badge>
            </div>

            <div className="flex items-center justify-between py-4 px-4 bg-[var(--color-bg)]/50 rounded-lg">
              <div>
                <p className="font-ui text-sm font-medium text-[var(--color-text)] mb-1">
                  {form.is_published ? "Your wedding is live" : "Your wedding is not published"}
                </p>
                <p className="font-ui text-xs text-[var(--color-text-muted)]">
                  {form.is_published
                    ? `Guests can view your invitation at /${wedding.slug}`
                    : "Publish your wedding to make it visible to guests"}
                </p>
              </div>
              <Toggle
                checked={form.is_published}
                onChange={(v) => publishMutation.mutate(v)}
              />
            </div>

            <div className="mt-4 flex gap-3">
              {form.is_published ? (
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => publishMutation.mutate(false)}
                  disabled={publishMutation.isPending}
                >
                  <EyeOff size={14} className="mr-2" />
                  {publishMutation.isPending ? "Updating..." : "Unpublish"}
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => publishMutation.mutate(true)}
                  disabled={publishMutation.isPending}
                >
                  <Globe size={14} className="mr-2" />
                  {publishMutation.isPending ? "Publishing..." : "Publish Wedding"}
                </Button>
              )}
              <a href={`/${wedding.slug}`} target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="md">
                  <Eye size={14} className="mr-2" />
                  Preview Site
                </Button>
              </a>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Hash size={18} className="text-[var(--color-primary)]" />
              <h2 className="font-heading text-xl text-[var(--color-text)]">Wedding URL</h2>
            </div>
            <div className="flex items-center gap-2 p-3 bg-[var(--color-bg)]/50 rounded-lg">
              <span className="font-ui text-sm text-[var(--color-text-muted)]">/</span>
              <span className="font-ui text-sm text-[var(--color-text)] font-medium">{wedding.slug}</span>
            </div>
            <p className="font-ui text-xs text-[var(--color-text-muted)] mt-2">
              This is the URL your guests will use to access your invitation
            </p>
          </Card>
        </div>
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </AdminLayout>
  );
}
