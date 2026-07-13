import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Wedding } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { Button } from "../../components/ui/Button";
import { Input, Toggle } from "../../components/ui/Input";
import { Card, Badge, Toast } from "../../components/ui/index";
import { FormField } from "../../components/ui/ImageUpload";
import { Save, Globe, Heart } from "lucide-react";

export function SettingsPage() {
  const queryClient = useQueryClient();
  const [isPublished, setIsPublished] = useState(false);
  const [slug, setSlug] = useState("");
  const [weddingDate, setWeddingDate] = useState("");
  const [location, setLocation] = useState("");
  const [hashtag, setHashtag] = useState("");
  const [rsvpDeadline, setRsvpDeadline] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const { data: wedding, isLoading, error } = useQuery<Wedding>({
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
      setIsPublished(wedding.is_published);
      setSlug(wedding.slug);
      setWeddingDate(wedding.wedding_date || "");
      setLocation(wedding.location || "");
      setHashtag(wedding.hashtag || "");
      setRsvpDeadline(wedding.rsvp_deadline || "");
      setContactPhone(wedding.contact_phone || "");
    }
  }, [wedding]);

  const updateSettingsMutation = useMutation({
    mutationFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { error } = await supabase.from("weddings").update({
        slug, wedding_date: weddingDate || null, location: location || null,
        hashtag: hashtag || null, rsvp_deadline: rsvpDeadline || null, contact_phone: contactPhone || null,
      }).eq("created_by", user.user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wedding"] });
      setToast({ message: "Settings saved", type: "success" });
    },
    onError: () => setToast({ message: "Failed to save settings", type: "error" }),
  });

  const togglePublishMutation = useMutation({
    mutationFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { error } = await supabase.from("weddings").update({ is_published: !isPublished }).eq("created_by", user.user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      setIsPublished(!isPublished);
      queryClient.invalidateQueries({ queryKey: ["wedding"] });
      setToast({ message: isPublished ? "Website unpublished" : "Website published!", type: "success" });
    },
    onError: () => setToast({ message: "Failed to toggle publish", type: "error" }),
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full p-8">
          <p className="font-ui text-sm text-gray-500">Loading settings...</p>
        </div>
      </AdminLayout>
    );
  }

  if (error || !wedding) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full p-8">
          <p className="font-ui text-sm text-red-500">Unable to load wedding data.</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 overflow-y-auto max-w-3xl">
        <h1 className="font-ui text-xl font-bold text-gray-900 mb-6">Settings</h1>

        <Card className="p-5 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-50 rounded-lg">
                {isPublished ? <Globe size={20} className="text-indigo-600" /> : <Heart size={20} className="text-gray-400" />}
              </div>
              <div>
                <h3 className="font-ui text-sm font-semibold text-gray-900">Publish Website</h3>
                <p className="font-ui text-xs text-gray-500 mt-0.5">
                  {isPublished ? "Your website is live and accessible to guests." : "Your website is not yet published."}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isPublished && <Badge variant="success">Published</Badge>}
              <Toggle checked={isPublished} onChange={() => togglePublishMutation.mutate()} />
            </div>
          </div>
        </Card>

        <Card className="p-5 mb-4">
          <h3 className="font-ui text-sm font-semibold text-gray-900 mb-4">Wedding Details</h3>
          <div className="space-y-4">
            <FormField label="URL Slug" hint="The unique URL for your wedding website">
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="my-wedding" />
            </FormField>
            <FormField label="Wedding Date">
              <Input type="datetime-local" value={weddingDate ? weddingDate.slice(0, 16) : ""} onChange={(e) => setWeddingDate(e.target.value)} />
            </FormField>
            <FormField label="Location">
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Kuala Lumpur, Malaysia" />
            </FormField>
            <FormField label="Hashtag">
              <Input value={hashtag} onChange={(e) => setHashtag(e.target.value)} placeholder="#OurWedding" />
            </FormField>
            <FormField label="RSVP Deadline">
              <Input type="datetime-local" value={rsvpDeadline ? rsvpDeadline.slice(0, 16) : ""} onChange={(e) => setRsvpDeadline(e.target.value)} />
            </FormField>
            <FormField label="Contact Phone">
              <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+60 12 345 6789" />
            </FormField>
          </div>
        </Card>

        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="md" onClick={() => updateSettingsMutation.mutate()} disabled={updateSettingsMutation.isPending}>
            <Save size={14} className="mr-1.5" /> Save Settings
          </Button>
        </div>
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </AdminLayout>
  );
}
