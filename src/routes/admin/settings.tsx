import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Wedding, type SharingConfig } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Toggle, Label } from "../../components/ui/Input";
import { Card } from "../../components/ui/index";
import { ImageUpload, FormField } from "../../components/ui/ImageUpload";
import { Save, Upload, Globe } from "lucide-react";

export function SettingsPage() {
  const [details, setDetails] = useState({ couple_name_one: "", couple_name_two: "", wedding_date: "", location: "", slug: "", hashtag: "" });
  const [sharing, setSharing] = useState<SharingConfig>({ enabled: false, share_url: null, og_title: "", og_description: "", og_image_url: null, twitter_card: "summary_large_image", allow_qr_bypass: false });
  const [isPublished, setIsPublished] = useState(false);
  const qc = useQueryClient();

  const { data: wedding } = useQuery({
    queryKey: ["wedding"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { data } = await supabase.from("weddings").select("*").eq("created_by", user.user.id).maybeSingle();
      if (data) {
        const w = data as Wedding;
        setDetails({ couple_name_one: w.couple_name_one || "", couple_name_two: w.couple_name_two || "", wedding_date: w.wedding_date || "", location: w.location || "", slug: w.slug || "", hashtag: w.hashtag || "" });
        setSharing(w.sharing_config || { enabled: false, share_url: null, og_title: "", og_description: "", og_image_url: null, twitter_card: "summary_large_image", allow_qr_bypass: false });
        setIsPublished(w.is_published);
      }
      return data as Wedding | null;
    },
  });

  const saveDetails = useMutation({
    mutationFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { error } = await supabase.from("weddings").update({
        couple_name_one: details.couple_name_one,
        couple_name_two: details.couple_name_two,
        wedding_date: details.wedding_date || null,
        location: details.location || null,
        hashtag: details.hashtag || null,
      }).eq("created_by", user.user.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wedding"] }),
  });

  const saveSharing = useMutation({
    mutationFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { error } = await supabase.from("weddings").update({ sharing_config: sharing }).eq("created_by", user.user.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wedding"] }),
  });

  const togglePublish = useMutation({
    mutationFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { error } = await supabase.from("weddings").update({ is_published: !isPublished }).eq("created_by", user.user.id);
      if (error) throw error;
    },
    onSuccess: () => { setIsPublished(!isPublished); qc.invalidateQueries({ queryKey: ["wedding"] }); },
  });

  const websiteUrl = wedding ? `${window.location.origin}/w/${wedding.slug}` : "";

  return (
    <AdminLayout>
      <h2 className="mb-6 text-xl font-semibold text-gray-900">Settings</h2>

      <div className="space-y-6">
        <Card className="space-y-4">
          <h3 className="text-base font-semibold text-gray-900">Publish Status</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700">{isPublished ? "Website is published and live" : "Website is not published"}</p>
              <p className="text-xs text-gray-400">Toggle to publish or unpublish your wedding website</p>
            </div>
            <Button variant={isPublished ? "danger" : "primary"} onClick={() => togglePublish.mutate()} disabled={togglePublish.isPending}>
              {isPublished ? "Unpublish" : "Publish"}
            </Button>
          </div>
        </Card>

        <Card className="space-y-4">
          <h3 className="text-base font-semibold text-gray-900">Wedding Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Couple Name One"><Input value={details.couple_name_one} onChange={(e) => setDetails({ ...details, couple_name_one: e.target.value })} /></FormField>
            <FormField label="Couple Name Two"><Input value={details.couple_name_two} onChange={(e) => setDetails({ ...details, couple_name_two: e.target.value })} /></FormField>
          </div>
          <FormField label="Wedding Date"><Input type="date" value={details.wedding_date ? details.wedding_date.split("T")[0] : ""} onChange={(e) => setDetails({ ...details, wedding_date: e.target.value })} /></FormField>
          <FormField label="Location"><Input value={details.location} onChange={(e) => setDetails({ ...details, location: e.target.value })} /></FormField>
          <FormField label="Hashtag"><Input value={details.hashtag} onChange={(e) => setDetails({ ...details, hashtag: e.target.value })} /></FormField>
          <Button onClick={() => saveDetails.mutate()} disabled={saveDetails.isPending}><Save className="mr-2 h-4 w-4" /> {saveDetails.isPending ? "Saving..." : "Save Details"}</Button>
        </Card>

        <Card className="space-y-4">
          <h3 className="text-base font-semibold text-gray-900">Website URL</h3>
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
            <Globe className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-700">{websiteUrl}</span>
          </div>
        </Card>

        <Card className="space-y-4">
          <h3 className="text-base font-semibold text-gray-900">Sharing & Open Graph</h3>
          <Toggle checked={sharing.enabled} onChange={(v) => setSharing({ ...sharing, enabled: v })} label="Enable sharing" />
          <FormField label="OG Title"><Input value={sharing.og_title} onChange={(e) => setSharing({ ...sharing, og_title: e.target.value })} placeholder="Title for social media preview" /></FormField>
          <FormField label="OG Description"><Textarea value={sharing.og_description} onChange={(e) => setSharing({ ...sharing, og_description: e.target.value })} placeholder="Description for social media preview" /></FormField>
          <FormField label="OG Image"><ImageUpload value={sharing.og_image_url} onChange={(url) => setSharing({ ...sharing, og_image_url: url ?? null })} label="Social media preview image" /></FormField>
          <Toggle checked={sharing.allow_qr_bypass} onChange={(v) => setSharing({ ...sharing, allow_qr_bypass: v })} label="Allow QR code to bypass sign-in" />
          <Button onClick={() => saveSharing.mutate()} disabled={saveSharing.isPending}><Save className="mr-2 h-4 w-4" /> {saveSharing.isPending ? "Saving..." : "Save Sharing"}</Button>
        </Card>
      </div>
    </AdminLayout>
  );
}
