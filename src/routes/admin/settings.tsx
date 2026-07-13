import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Wedding, type SharingConfig } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Toggle, Label } from "../../components/ui/Input";
import { Card, Badge } from "../../components/ui/index";
import { ImageUpload, FormField } from "../../components/ui/ImageUpload";
import { Save, Check, Globe, Link2 } from "lucide-react";

export function SettingsPage() {
  const [coupleOne, setCoupleOne] = useState("");
  const [coupleTwo, setCoupleTwo] = useState("");
  const [weddingDate, setWeddingDate] = useState("");
  const [location, setLocation] = useState("");
  const [slug, setSlug] = useState("");
  const [isPublished, setIsPublished] = useState(false);
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
  const qc = useQueryClient();

  const { data: wedding } = useQuery({
    queryKey: ["wedding"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { data } = await supabase.from("weddings").select("*").eq("created_by", user.user.id).maybeSingle();
      if (data) {
        const w = data as Wedding;
        setCoupleOne(w.couple_name_one || "");
        setCoupleTwo(w.couple_name_two || "");
        setWeddingDate(w.wedding_date || "");
        setLocation(w.location || "");
        setSlug(w.slug || "");
        setIsPublished(w.is_published);
        if (w.sharing_config) setSharing(w.sharing_config);
      }
      return data as Wedding | null;
    },
  });

  const saveDetails = useMutation({
    mutationFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { error } = await supabase.from("weddings").update({
        couple_name_one: coupleOne,
        couple_name_two: coupleTwo,
        wedding_date: weddingDate || null,
        location: location || null,
        slug,
      }).eq("created_by", user.user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wedding"] });
      setToast("Details saved");
      setTimeout(() => setToast(null), 2000);
    },
  });

  const togglePublish = useMutation({
    mutationFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const newPublished = !isPublished;
      const patch: Record<string, unknown> = { is_published: newPublished };
      if (newPublished && wedding) {
        // Copy draft to published
        if (wedding.draft_content) patch.content = wedding.draft_content;
        if (wedding.draft_theme_config) patch.theme_config = wedding.draft_theme_config;
        if (wedding.draft_cover_config) patch.cover_config = wedding.draft_cover_config;
        if (wedding.draft_login_config) patch.login_config = wedding.draft_login_config;
      }
      const { error } = await supabase.from("weddings").update(patch).eq("created_by", user.user.id);
      if (error) throw error;
      setIsPublished(newPublished);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wedding"] });
      setToast(isPublished ? "Unpublished" : "Published");
      setTimeout(() => setToast(null), 2000);
    },
  });

  const saveSharing = useMutation({
    mutationFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { error } = await supabase.from("weddings").update({ sharing_config: sharing }).eq("created_by", user.user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wedding"] });
      setToast("Sharing settings saved");
      setTimeout(() => setToast(null), 2000);
    },
  });

  const websiteUrl = wedding ? `${window.location.origin}/w/${wedding.slug}` : "";

  return (
    <AdminLayout>
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Settings</h2>
        <p className="mt-1 text-sm text-gray-500">Manage your wedding details and publishing settings.</p>
      </div>

      <div className="space-y-6">
        {/* Publish Status */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Publish Status</h3>
              <p className="mt-1 text-sm text-gray-500">Toggle to publish your wedding website.</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={isPublished ? "success" : "default"}>
                {isPublished ? "Published" : "Draft"}
              </Badge>
              <Toggle checked={isPublished} onChange={() => togglePublish.mutate()} label={isPublished ? "Live" : "Hidden"} />
            </div>
          </div>
        </Card>

        {/* Website URL */}
        {wedding && (
          <Card>
            <h3 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
              <Globe className="h-4 w-4 text-indigo-600" /> Website URL
            </h3>
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                {websiteUrl}
              </div>
              <Button
                variant="outline"
                onClick={() => { navigator.clipboard.writeText(websiteUrl); setToast("Copied"); setTimeout(() => setToast(null), 2000); }}
              >
                <Link2 className="h-4 w-4" />
              </Button>
              <a href={websiteUrl} target="_blank" rel="noreferrer">
                <Button variant="outline">Visit</Button>
              </a>
            </div>
          </Card>
        )}

        {/* Wedding Details */}
        <Card className="space-y-4">
          <h3 className="font-semibold text-gray-900">Wedding Details</h3>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Couple Name One">
              <Input value={coupleOne} onChange={(e) => setCoupleOne(e.target.value)} placeholder="First person" />
            </FormField>
            <FormField label="Couple Name Two">
              <Input value={coupleTwo} onChange={(e) => setCoupleTwo(e.target.value)} placeholder="Second person" />
            </FormField>
          </div>
          <FormField label="Wedding Date">
            <Input type="date" value={weddingDate ? weddingDate.split("T")[0] : ""} onChange={(e) => setWeddingDate(e.target.value)} />
          </FormField>
          <FormField label="Location">
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Venue / city" />
          </FormField>
          <FormField label="URL Slug" hint="This is the path used in your website URL">
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="my-wedding" />
          </FormField>
          <Button onClick={() => saveDetails.mutate()} disabled={saveDetails.isPending}>
            <Save className="mr-2 h-4 w-4" /> {saveDetails.isPending ? "Saving..." : "Save Details"}
          </Button>
        </Card>

        {/* Sharing / OG Config */}
        <Card className="space-y-4">
          <h3 className="font-semibold text-gray-900">Sharing & Open Graph</h3>
          <div className="flex items-center justify-between">
            <Label>Enable sharing</Label>
            <Toggle checked={sharing.enabled} onChange={(v) => setSharing({ ...sharing, enabled: v })} label={sharing.enabled ? "On" : "Off"} />
          </div>
          <div className="flex items-center justify-between">
            <Label>Allow QR bypass</Label>
            <Toggle checked={sharing.allow_qr_bypass} onChange={(v) => setSharing({ ...sharing, allow_qr_bypass: v })} label={sharing.allow_qr_bypass ? "On" : "Off"} />
          </div>
          <FormField label="OG Title">
            <Input value={sharing.og_title} onChange={(e) => setSharing({ ...sharing, og_title: e.target.value })} placeholder="Title for social media preview" />
          </FormField>
          <FormField label="OG Description">
            <Textarea value={sharing.og_description} onChange={(e) => setSharing({ ...sharing, og_description: e.target.value })} placeholder="Description for social media preview" />
          </FormField>
          <FormField label="OG Image">
            <ImageUpload
              value={sharing.og_image_url ?? null}
              onChange={(url) => setSharing({ ...sharing, og_image_url: url ?? null })}
              label="Social media preview image"
            />
          </FormField>
          <FormField label="Twitter Card Type">
            <Input value={sharing.twitter_card} onChange={(e) => setSharing({ ...sharing, twitter_card: e.target.value })} placeholder="summary_large_image" />
          </FormField>
          <Button onClick={() => saveSharing.mutate()} disabled={saveSharing.isPending}>
            <Save className="mr-2 h-4 w-4" /> {saveSharing.isPending ? "Saving..." : "Save Sharing"}
          </Button>
        </Card>
      </div>

      {toast && (
        <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </AdminLayout>
  );
}
