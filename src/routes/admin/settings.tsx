import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Wedding, type SharingConfig } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Label, Toggle } from "../../components/ui/Input";
import { ImageUpload, FormField } from "../../components/ui/ImageUpload";
import { Card, Badge } from "../../components/ui/index";
import { Save, Upload, Globe, Share2, Heart } from "lucide-react";

export function SettingsPage() {
  const queryClient = useQueryClient();
  const [weddingData, setWeddingData] = useState<Partial<Wedding>>({});
  const [sharing, setSharing] = useState<SharingConfig>({
    enabled: false,
    share_url: null,
    og_title: "",
    og_description: "",
    og_image_url: null,
    twitter_card: "summary_large_image",
    allow_qr_bypass: false,
  });
  const [toast, setToast] = useState<string | null>(null);

  const { data: user } = useQuery({
    queryKey: ["auth-user"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user;
    },
  });

  const { data: wedding } = useQuery({
    queryKey: ["wedding", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("weddings").select("*").eq("created_by", user.id).maybeSingle();
      return data as Wedding | null;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (wedding) {
      setWeddingData({
        couple_name_one: wedding.couple_name_one,
        couple_name_two: wedding.couple_name_two,
        wedding_date: wedding.wedding_date,
        location: wedding.location,
        hashtag: wedding.hashtag,
        slug: wedding.slug,
        rsvp_deadline: wedding.rsvp_deadline,
      });
      if (wedding.sharing_config) {
        setSharing(wedding.sharing_config);
      }
    }
  }, [wedding]);

  const saveDetailsMutation = useMutation({
    mutationFn: async () => {
      if (!wedding) throw new Error("No wedding");
      const { error } = await supabase.from("weddings").update({
        couple_name_one: weddingData.couple_name_one,
        couple_name_two: weddingData.couple_name_two,
        wedding_date: weddingData.wedding_date,
        location: weddingData.location,
        hashtag: weddingData.hashtag,
        rsvp_deadline: weddingData.rsvp_deadline,
      }).eq("id", wedding.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wedding", user?.id] });
      setToast("Wedding details saved");
      setTimeout(() => setToast(null), 2000);
    },
  });

  const saveSharingMutation = useMutation({
    mutationFn: async () => {
      if (!wedding) throw new Error("No wedding");
      const { error } = await supabase.from("weddings").update({ sharing_config: sharing }).eq("id", wedding.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wedding", user?.id] });
      setToast("Sharing settings saved");
      setTimeout(() => setToast(null), 2000);
    },
  });

  const togglePublishMutation = useMutation({
    mutationFn: async () => {
      if (!wedding) throw new Error("No wedding");
      const newPublished = !wedding.is_published;
      const update: Record<string, unknown> = { is_published: newPublished };
      if (newPublished) {
        update.content = wedding.draft_content || wedding.content;
        update.theme_config = wedding.draft_theme_config || wedding.theme_config;
        update.cover_config = wedding.draft_cover_config || wedding.cover_config;
        update.login_config = wedding.draft_login_config || wedding.login_config;
      }
      const { error } = await supabase.from("weddings").update(update).eq("id", wedding.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wedding", user?.id] });
      setToast(wedding?.is_published ? "Unpublished" : "Published!");
      setTimeout(() => setToast(null), 2000);
    },
  });

  if (!wedding) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <div className="text-gray-500">Loading settings...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your wedding details, publishing status, and sharing configuration.</p>
        </div>

        {/* Publish Status */}
        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-gray-100 p-2">
                <Globe className="h-5 w-5 text-gray-900" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Publish Status</p>
                <p className="text-sm text-gray-500">
                  Your invitation is currently{" "}
                  <Badge variant={wedding.is_published ? "success" : "warning"}>
                    {wedding.is_published ? "Live" : "Draft"}
                  </Badge>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Toggle
                checked={wedding.is_published}
                onChange={() => togglePublishMutation.mutate()}
                label={wedding.is_published ? "Published" : "Draft"}
              />
            </div>
          </div>
          <p className="mt-3 text-xs text-gray-500">
            Publishing copies all draft content, theme, and cover settings to your live invitation.
          </p>
        </Card>

        {/* Wedding Details */}
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <Heart className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">Wedding Details</h2>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Partner One Name"
                value={weddingData.couple_name_one || ""}
                onChange={(e) => setWeddingData((p) => ({ ...p, couple_name_one: e.target.value }))}
                placeholder="Ahmad"
              />
              <Input
                label="Partner Two Name"
                value={weddingData.couple_name_two || ""}
                onChange={(e) => setWeddingData((p) => ({ ...p, couple_name_two: e.target.value }))}
                placeholder="Aishah"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Wedding Date"
                type="datetime-local"
                value={weddingData.wedding_date ? new Date(weddingData.wedding_date).toISOString().slice(0, 16) : ""}
                onChange={(e) => setWeddingData((p) => ({ ...p, wedding_date: e.target.value ? new Date(e.target.value).toISOString() : null }))}
              />
              <Input
                label="RSVP Deadline"
                type="datetime-local"
                value={weddingData.rsvp_deadline ? new Date(weddingData.rsvp_deadline).toISOString().slice(0, 16) : ""}
                onChange={(e) => setWeddingData((p) => ({ ...p, rsvp_deadline: e.target.value ? new Date(e.target.value).toISOString() : null }))}
              />
            </div>
            <Input
              label="Location"
              value={weddingData.location || ""}
              onChange={(e) => setWeddingData((p) => ({ ...p, location: e.target.value }))}
              placeholder="Kuala Lumpur, Malaysia"
            />
            <Input
              label="Hashtag"
              value={weddingData.hashtag || ""}
              onChange={(e) => setWeddingData((p) => ({ ...p, hashtag: e.target.value }))}
              placeholder="#AhmadAndAishah"
            />
            <Input
              label="URL Slug"
              value={weddingData.slug || ""}
              onChange={(e) => setWeddingData((p) => ({ ...p, slug: e.target.value }))}
              placeholder="ahmad-aishah"
            />
            <Button onClick={() => saveDetailsMutation.mutate()} disabled={saveDetailsMutation.isPending}>
              <Save className="mr-1.5 h-4 w-4" /> Save Details
            </Button>
          </div>
        </Card>

        {/* Sharing / OG Config */}
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <Share2 className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">Sharing & Open Graph</h2>
          </div>
          <div className="space-y-4">
            <div className="rounded-lg border border-gray-200 p-4">
              <Toggle
                checked={sharing.enabled}
                onChange={(v) => setSharing((p) => ({ ...p, enabled: v }))}
                label="Enable social sharing"
              />
            </div>
            <div className="rounded-lg border border-gray-200 p-4">
              <Toggle
                checked={sharing.allow_qr_bypass}
                onChange={(v) => setSharing((p) => ({ ...p, allow_qr_bypass: v }))}
                label="Allow QR code bypass (skip login)"
              />
            </div>
            <Input
              label="Share URL"
              value={sharing.share_url || ""}
              onChange={(e) => setSharing((p) => ({ ...p, share_url: e.target.value || null }))}
              placeholder="https://yoursite.com/w/ahmad-aishah"
            />
            <Input
              label="OG Title"
              value={sharing.og_title || ""}
              onChange={(e) => setSharing((p) => ({ ...p, og_title: e.target.value }))}
              placeholder="Ahmad & Aishah's Wedding"
            />
            <Textarea
              label="OG Description"
              value={sharing.og_description || ""}
              onChange={(e) => setSharing((p) => ({ ...p, og_description: e.target.value }))}
              placeholder="Join us to celebrate our special day..."
              rows={3}
            />
            <FormField label="OG Image">
              <ImageUpload
                value={sharing.og_image_url ?? null}
                onChange={(url) => setSharing((p) => ({ ...p, og_image_url: url ?? null }))}
              />
            </FormField>
            <Button onClick={() => saveSharingMutation.mutate()} disabled={saveSharingMutation.isPending}>
              <Save className="mr-1.5 h-4 w-4" /> Save Sharing Settings
            </Button>
          </div>
        </Card>

        {toast && (
          <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-gray-900 px-4 py-2 text-sm text-white shadow-lg">
            {toast}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
