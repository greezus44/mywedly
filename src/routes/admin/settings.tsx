import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Save,
  Upload,
  Heart,
  Calendar,
  MapPin,
  Phone,
  Hash,
  Globe,
  Clock,
} from "lucide-react";
import { supabase, type Wedding } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Toggle } from "../../components/ui/Input";
import { FormField } from "../../components/ui/ImageUpload";
import { Card, Badge, Toast } from "../../components/ui/index";
import { formatDate, cn } from "../../lib/utils";
import { useLang } from "../../lib/lang-context";

interface SettingsFormData {
  couple_name_one: string;
  couple_name_two: string;
  full_name_one: string;
  full_name_two: string;
  wedding_date: string;
  location: string;
  hashtag: string;
  rsvp_deadline: string;
  contact_phone: string;
  is_published: boolean;
}

export function SettingsPage() {
  const queryClient = useQueryClient();
  const { lang } = useLang();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [formData, setFormData] = useState<SettingsFormData>({
    couple_name_one: "",
    couple_name_two: "",
    full_name_one: "",
    full_name_two: "",
    wedding_date: "",
    location: "",
    hashtag: "",
    rsvp_deadline: "",
    contact_phone: "",
    is_published: false,
  });
  const [initialized, setInitialized] = useState(false);

  const { data: wedding, isLoading } = useQuery({
    queryKey: ["wedding"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("weddings")
        .select("*")
        .eq("created_by", user.user.id)
        .single();
      if (error) throw error;
      return data as Wedding;
    },
  });

  useEffect(() => {
    if (wedding && !initialized) {
      setFormData({
        couple_name_one: wedding.couple_name_one || "",
        couple_name_two: wedding.couple_name_two || "",
        full_name_one: wedding.full_name_one || "",
        full_name_two: wedding.full_name_two || "",
        wedding_date: wedding.wedding_date ? wedding.wedding_date.slice(0, 16) : "",
        location: wedding.location || "",
        hashtag: wedding.hashtag || "",
        rsvp_deadline: wedding.rsvp_deadline ? wedding.rsvp_deadline.slice(0, 16) : "",
        contact_phone: wedding.contact_phone || "",
        is_published: wedding.is_published,
      });
      setInitialized(true);
    }
  }, [wedding, initialized]);

  const saveMutation = useMutation({
    mutationFn: async (data: SettingsFormData) => {
      if (!wedding) throw new Error("No wedding");
      const payload = {
        couple_name_one: data.couple_name_one,
        couple_name_two: data.couple_name_two,
        full_name_one: data.full_name_one || null,
        full_name_two: data.full_name_two || null,
        wedding_date: data.wedding_date || null,
        location: data.location || null,
        hashtag: data.hashtag || null,
        rsvp_deadline: data.rsvp_deadline || null,
        contact_phone: data.contact_phone || null,
        updated_at: new Date().toISOString(),
      };
      const { data: result, error } = await supabase
        .from("weddings")
        .update(payload)
        .eq("id", wedding.id)
        .select("*")
        .single();
      if (error) throw error;
      return result as Wedding;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["wedding"], data);
      setToast({ message: "Settings saved!", type: "success" });
    },
    onError: () => setToast({ message: "Failed to save settings", type: "error" }),
  });

  const publishMutation = useMutation({
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
      setFormData((prev) => ({ ...prev, is_published: data.is_published }));
      setToast({
        message: data.is_published ? "Website published! 🎉" : "Website unpublished",
        type: "success",
      });
    },
    onError: () => setToast({ message: "Failed to update publish status", type: "error" }),
  });

  const updateField = useCallback(
    (field: keyof SettingsFormData, value: string | boolean) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  if (isLoading || !wedding) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <p className="font-ui text-sm text-[var(--color-text-muted)]">Loading settings...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-6 md:p-8">
          {/* Header */}
          <div className="mb-8">
            <p className="font-ui text-xs uppercase tracking-wider-luxe text-[var(--color-primary)] mb-2">
              Settings
            </p>
            <h1 className="font-heading text-3xl text-[var(--color-text)]">Wedding Details</h1>
            <p className="font-ui text-sm text-[var(--color-text-muted)] mt-1">
              Manage your wedding information and website visibility.
            </p>
          </div>

          {/* Publish Status Card */}
          <Card className="p-6 mb-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    "p-3 rounded-lg",
                    formData.is_published
                      ? "bg-[var(--color-success)]/15 text-[var(--color-success)]"
                      : "bg-[var(--color-warning)]/15 text-[var(--color-warning)]"
                  )}
                >
                  <Globe size={24} />
                </div>
                <div>
                  <h3 className="font-heading text-lg text-[var(--color-text)] mb-1">
                    Website Status
                  </h3>
                  <p className="font-ui text-sm text-[var(--color-text-muted)] mb-2">
                    {formData.is_published
                      ? "Your wedding website is live and accessible to guests."
                      : "Your wedding website is currently unpublished and hidden from guests."}
                  </p>
                  {wedding.slug && (
                    <p className="font-ui text-xs text-[var(--color-text-muted)]">
                      URL: /{wedding.slug}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex-shrink-0">
                {formData.is_published ? (
                  <Badge variant="success">Published</Badge>
                ) : (
                  <Badge variant="warning">Draft</Badge>
                )}
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-[var(--color-border)]/10">
              <Button
                variant={formData.is_published ? "danger" : "primary"}
                size="sm"
                onClick={() => publishMutation.mutate(!formData.is_published)}
                disabled={publishMutation.isPending}
              >
                <Upload size={14} className="mr-1.5" />
                {publishMutation.isPending
                  ? "Updating..."
                  : formData.is_published
                  ? "Unpublish Website"
                  : "Publish Website"}
              </Button>
            </div>
          </Card>

          {/* Couple Details */}
          <Card className="p-6 mb-6">
            <h3 className="font-heading text-lg text-[var(--color-text)] mb-4 flex items-center gap-2">
              <Heart size={18} className="text-[var(--color-primary)]" /> Couple Details
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Partner One — Short Name" hint="Used on cover, e.g. Aisyah">
                <Input
                  value={formData.couple_name_one}
                  onChange={(e) => updateField("couple_name_one", e.target.value)}
                  placeholder="Aisyah"
                />
              </FormField>
              <FormField label="Partner Two — Short Name" hint="Used on cover, e.g. Ahmad">
                <Input
                  value={formData.couple_name_two}
                  onChange={(e) => updateField("couple_name_two", e.target.value)}
                  placeholder="Ahmad"
                />
              </FormField>
              <FormField label="Partner One — Full Name" hint="Full legal name">
                <Input
                  value={formData.full_name_one}
                  onChange={(e) => updateField("full_name_one", e.target.value)}
                  placeholder="Aisyah binti Abdullah"
                />
              </FormField>
              <FormField label="Partner Two — Full Name" hint="Full legal name">
                <Input
                  value={formData.full_name_two}
                  onChange={(e) => updateField("full_name_two", e.target.value)}
                  placeholder="Ahmad bin Yusof"
                />
              </FormField>
            </div>
          </Card>

          {/* Wedding Details */}
          <Card className="p-6 mb-6">
            <h3 className="font-heading text-lg text-[var(--color-text)] mb-4 flex items-center gap-2">
              <Calendar size={18} className="text-[var(--color-primary)]" /> Wedding Details
            </h3>

            <div className="space-y-4">
              <FormField label="Wedding Date & Time" hint="When the wedding takes place">
                <div className="relative">
                  <Calendar
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none"
                  />
                  <Input
                    type="datetime-local"
                    value={formData.wedding_date}
                    onChange={(e) => updateField("wedding_date", e.target.value)}
                    className="pl-10"
                  />
                </div>
                {formData.wedding_date && (
                  <p className="font-ui text-xs text-[var(--color-primary)] mt-2">
                    {formatDate(formData.wedding_date, lang)}
                  </p>
                )}
              </FormField>

              <FormField label="Location" hint="City or venue location">
                <div className="relative">
                  <MapPin
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none"
                  />
                  <Input
                    value={formData.location}
                    onChange={(e) => updateField("location", e.target.value)}
                    placeholder="Kuala Lumpur, Malaysia"
                    className="pl-10"
                  />
                </div>
              </FormField>

              <FormField label="Hashtag" hint="Wedding hashtag for social media">
                <div className="relative">
                  <Hash
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none"
                  />
                  <Input
                    value={formData.hashtag}
                    onChange={(e) => updateField("hashtag", e.target.value)}
                    placeholder="AisyahAndAhmad2025"
                    className="pl-10"
                  />
                </div>
              </FormField>

              <FormField label="RSVP Deadline" hint="Last date for guests to RSVP">
                <div className="relative">
                  <Clock
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none"
                  />
                  <Input
                    type="datetime-local"
                    value={formData.rsvp_deadline}
                    onChange={(e) => updateField("rsvp_deadline", e.target.value)}
                    className="pl-10"
                  />
                </div>
              </FormField>

              <FormField label="Contact Phone" hint="Phone number for guest inquiries">
                <div className="relative">
                  <Phone
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none"
                  />
                  <Input
                    value={formData.contact_phone}
                    onChange={(e) => updateField("contact_phone", e.target.value)}
                    placeholder="+60 12-345 6789"
                    className="pl-10"
                  />
                </div>
              </FormField>
            </div>
          </Card>

          {/* Save Button */}
          <div className="flex items-center justify-end gap-3 mb-8">
            {saveMutation.isPending && (
              <span className="font-ui text-xs text-[var(--color-text-muted)] flex items-center gap-1.5">
                <Save size={12} className="animate-pulse" /> Saving...
              </span>
            )}
            <Button
              variant="primary"
              size="md"
              onClick={handleSave}
              disabled={saveMutation.isPending}
            >
              <Save size={14} className="mr-1.5" />
              {saveMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>

          {/* Danger Zone */}
          <Card className="p-6 border-[var(--color-error)]/20">
            <h3 className="font-heading text-lg text-[var(--color-error)] mb-2">Danger Zone</h3>
            <p className="font-ui text-sm text-[var(--color-text-muted)] mb-4">
              Unpublishing will hide your website from all guests. Your data will be preserved.
            </p>
            <Button
              variant="danger"
              size="sm"
              onClick={() => publishMutation.mutate(false)}
              disabled={!formData.is_published || publishMutation.isPending}
            >
              Unpublish Website
            </Button>
          </Card>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </AdminLayout>
  );
}
