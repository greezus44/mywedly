import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Wedding } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Label, Toggle } from "../../components/ui/Input";
import { FormField } from "../../components/ui/ImageUpload";
import { Card, Badge, EmptyState, Toast } from "../../components/ui/index";
import { formatDate, cn } from "../../lib/utils";
import { Save, Send, RefreshCw, Globe, Globe2, Calendar, MapPin, Hash, Clock } from "lucide-react";

export function SettingsPage() {
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [form, setForm] = useState({
    couple_name_one: "",
    couple_name_two: "",
    wedding_date: "",
    location: "",
    hashtag: "",
    rsvp_deadline: "",
    is_published: false,
  });

  const weddingQuery = useQuery({
    queryKey: ["wedding"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { data, error } = await supabase.from("weddings").select("*").eq("created_by", user.user.id).single();
      if (error) throw error;
      return data as Wedding;
    },
  });

  const wedding = weddingQuery.data;

  useEffect(() => {
    if (wedding) {
      setForm({
        couple_name_one: wedding.couple_name_one || "",
        couple_name_two: wedding.couple_name_two || "",
        wedding_date: wedding.wedding_date ? wedding.wedding_date.slice(0, 16) : "",
        location: wedding.location || "",
        hashtag: wedding.hashtag || "",
        rsvp_deadline: wedding.rsvp_deadline ? wedding.rsvp_deadline.slice(0, 16) : "",
        is_published: wedding.is_published,
      });
    }
  }, [wedding]);

  const updateMutation = useMutation({
    mutationFn: async (values: typeof form) => {
      if (!wedding) throw new Error("No wedding");
      const { data, error } = await supabase
        .from("weddings")
        .update({
          couple_name_one: values.couple_name_one,
          couple_name_two: values.couple_name_two,
          wedding_date: values.wedding_date || null,
          location: values.location || null,
          hashtag: values.hashtag || null,
          rsvp_deadline: values.rsvp_deadline || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", wedding.id)
        .select("*")
        .single();
      if (error) throw error;
      return data as Wedding;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["wedding"], data);
      setToast({ message: "Settings saved", type: "success" });
    },
    onError: () => setToast({ message: "Failed to save settings", type: "error" }),
  });

  const togglePublishMutation = useMutation({
    mutationFn: async (publish: boolean) => {
      if (!wedding) throw new Error("No wedding");
      const { data, error } = await supabase
        .from("weddings")
        .update({ is_published: publish, updated_at: new Date().toISOString() })
        .eq("id", wedding.id)
        .select("*")
        .single();
      if (error) throw error;
      return data as Wedding;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["wedding"], data);
      setForm((prev) => ({ ...prev, is_published: data.is_published }));
      setToast({ message: data.is_published ? "Wedding published" : "Wedding unpublished", type: "success" });
    },
    onError: () => setToast({ message: "Failed to toggle publish", type: "error" }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(form);
  };

  const update = (key: keyof typeof form, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  if (weddingQuery.isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full p-20">
          <RefreshCw size={24} className="animate-spin text-[var(--color-primary)]" />
        </div>
      </AdminLayout>
    );
  }

  if (weddingQuery.isError || !wedding) {
    return (
      <AdminLayout>
        <div className="p-8">
          <EmptyState title="Unable to load settings" description="Please try again later." />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-[var(--color-bg)]">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <div>
              <h1 className="font-heading text-2xl text-[var(--color-text)] mb-1">Settings</h1>
              <p className="font-ui text-sm text-[var(--color-text-muted)]">Manage your wedding details</p>
            </div>
            {wedding.is_published ? (
              <Badge variant="success"><Globe size={12} className="mr-1" /> Published</Badge>
            ) : (
              <Badge variant="warning"><Globe2 size={12} className="mr-1" /> Draft</Badge>
            )}
          </div>

          {/* Publish Card */}
          <Card className="p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-heading text-lg text-[var(--color-text)] mb-1">Publish Status</h3>
                <p className="font-ui text-sm text-[var(--color-text-muted)]">
                  {wedding.is_published
                    ? "Your wedding site is live and visible to guests."
                    : "Your wedding site is in draft mode and not visible to guests."}
                </p>
              </div>
              <Toggle
                checked={form.is_published}
                onChange={(v) => togglePublishMutation.mutate(v)}
              />
            </div>
          </Card>

          {/* Wedding Details Form */}
          <Card className="p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <h3 className="font-heading text-lg text-[var(--color-text)] mb-4">Wedding Details</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Partner One Name">
                  <Input
                    value={form.couple_name_one}
                    onChange={(e) => update("couple_name_one", e.target.value)}
                    placeholder="Aisha"
                    required
                  />
                </FormField>
                <FormField label="Partner Two Name">
                  <Input
                    value={form.couple_name_two}
                    onChange={(e) => update("couple_name_two", e.target.value)}
                    placeholder="Ahmad"
                    required
                  />
                </FormField>
              </div>

              <FormField label="Wedding Date & Time">
                <Input
                  type="datetime-local"
                  value={form.wedding_date}
                  onChange={(e) => update("wedding_date", e.target.value)}
                />
              </FormField>

              <FormField label="Location">
                <Input
                  value={form.location}
                  onChange={(e) => update("location", e.target.value)}
                  placeholder="Kuala Lumpur, Malaysia"
                />
              </FormField>

              <FormField label="Hashtag">
                <Input
                  value={form.hashtag}
                  onChange={(e) => update("hashtag", e.target.value)}
                  placeholder="#AishaAndAhmad2025"
                />
              </FormField>

              <FormField label="RSVP Deadline">
                <Input
                  type="datetime-local"
                  value={form.rsvp_deadline}
                  onChange={(e) => update("rsvp_deadline", e.target.value)}
                />
              </FormField>

              <div className="pt-4 border-t border-[var(--color-border)]/15">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  disabled={updateMutation.isPending}
                >
                  <Save size={14} className="mr-2" />
                  {updateMutation.isPending ? "Saving..." : "Save Settings"}
                </Button>
              </div>
            </form>
          </Card>

          {/* Site URL Card */}
          <Card className="p-6 mt-6">
            <div className="flex items-center gap-2 mb-3">
              <Globe size={18} className="text-[var(--color-primary)]" />
              <h3 className="font-heading text-lg text-[var(--color-text)]">Site URL</h3>
            </div>
            <p className="font-ui text-sm text-[var(--color-text-muted)] mb-3">
              Your wedding invitation is accessible at:
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-4 py-3 bg-[var(--color-bg)] rounded-lg font-ui text-sm text-[var(--color-primary)] border border-[var(--color-border)]/20">
                /{wedding.slug}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/${wedding.slug}`);
                  setToast({ message: "URL copied", type: "success" });
                }}
              >
                Copy
              </Button>
            </div>
          </Card>

          {/* Summary */}
          <Card className="p-6 mt-6">
            <h3 className="font-heading text-lg text-[var(--color-text)] mb-4">Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-[var(--color-text-muted)]" />
                <div>
                  <p className="font-ui text-xs uppercase tracking-wider text-[var(--color-text-muted)]">Date</p>
                  <p className="font-body text-sm text-[var(--color-text)]">{wedding.wedding_date ? formatDate(wedding.wedding_date) : "Not set"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-[var(--color-text-muted)]" />
                <div>
                  <p className="font-ui text-xs uppercase tracking-wider text-[var(--color-text-muted)]">Location</p>
                  <p className="font-body text-sm text-[var(--color-text)]">{wedding.location || "Not set"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Hash size={16} className="text-[var(--color-text-muted)]" />
                <div>
                  <p className="font-ui text-xs uppercase tracking-wider text-[var(--color-text-muted)]">Hashtag</p>
                  <p className="font-body text-sm text-[var(--color-text)]">{wedding.hashtag || "Not set"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-[var(--color-text-muted)]" />
                <div>
                  <p className="font-ui text-xs uppercase tracking-wider text-[var(--color-text-muted)]">RSVP Deadline</p>
                  <p className="font-body text-sm text-[var(--color-text)]">{wedding.rsvp_deadline ? formatDate(wedding.rsvp_deadline) : "Not set"}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </AdminLayout>
  );
}
