import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Wedding, type SharingConfig } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Label, Toggle } from "../../components/ui/Input";
import { Card, Badge, Toast } from "../../components/ui/index";
import { ImageUpload, FormField } from "../../components/ui/ImageUpload";
import { Save, Upload, Globe, Share2 } from "lucide-react";

export function SettingsPage() {
  const queryClient = useQueryClient();
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [details, setDetails] = useState({ couple_name_one: "", couple_name_two: "", wedding_date: "", location: "", hashtag: "", slug: "", rsvp_deadline: "" });
  const [sharing, setSharing] = useState<SharingConfig>({ enabled: true, share_url: null, og_title: "", og_description: "", og_image_url: null, twitter_card: "summary_large_image", allow_qr_bypass: false });
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const { data: user } = useQuery({
    queryKey: ["auth-user"],
    queryFn: async () => { const { data: { user } } = await supabase.auth.getUser(); return user; },
  });

  const { data: wed, isLoading, error } = useQuery({
    queryKey: ["wedding", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("weddings").select("*").eq("created_by", user!.id).maybeSingle();
      if (error) throw error;
      return data as Wedding | null;
    },
  });

  useEffect(() => {
    if (wed) {
      setWedding(wed);
      setDetails({
        couple_name_one: wed.couple_name_one || "", couple_name_two: wed.couple_name_two || "",
        wedding_date: wed.wedding_date || "", location: wed.location || "", hashtag: wed.hashtag || "",
        slug: wed.slug || "", rsvp_deadline: wed.rsvp_deadline || "",
      });
      if (wed.sharing_config) setSharing(wed.sharing_config);
    }
  }, [wed]);

  const saveDetailsMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("weddings").update({
        couple_name_one: details.couple_name_one, couple_name_two: details.couple_name_two,
        wedding_date: details.wedding_date || null, location: details.location || null,
        hashtag: details.hashtag || null, rsvp_deadline: details.rsvp_deadline || null,
      }).eq("id", wedding!.id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["wedding", user?.id] }); setToast({ message: "Details saved", type: "success" }); },
    onError: (e) => setToast({ message: e.message, type: "error" }),
  });

  const saveSharingMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("weddings").update({ sharing_config: sharing }).eq("id", wedding!.id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["wedding", user?.id] }); setToast({ message: "Sharing settings saved", type: "success" }); },
    onError: (e) => setToast({ message: e.message, type: "error" }),
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("weddings").update({ is_published: !wedding!.is_published }).eq("id", wedding!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wedding", user?.id] });
      setToast({ message: wedding!.is_published ? "Unpublished" : "Published!", type: "success" });
    },
    onError: (e) => setToast({ message: e.message, type: "error" }),
  });

  if (isLoading) return <AdminLayout><div className="py-20 text-center text-gray-500">Loading…</div></AdminLayout>;
  if (error) return <AdminLayout><div className="py-20 text-center text-red-600">{error.message}</div></AdminLayout>;
  if (!wedding) return <AdminLayout><div className="py-20 text-center text-gray-500">No wedding found.</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Settings</h2>
          <p className="text-sm text-gray-500">Manage your wedding details and sharing settings.</p>
        </div>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Publish Status</h3>
              <p className="mt-1 text-sm text-gray-500">{wedding.is_published ? "Your invitation is live and accessible to guests." : "Your invitation is in draft mode."}</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={wedding.is_published ? "success" : "warning"}>{wedding.is_published ? "Published" : "Draft"}</Badge>
              <Button variant={wedding.is_published ? "outline" : "primary"} onClick={() => publishMutation.mutate()} disabled={publishMutation.isPending}>
                {wedding.is_published ? "Unpublish" : "Publish"}
              </Button>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 text-sm font-semibold text-gray-900">Wedding Details</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Partner One Name">
                <Input value={details.couple_name_one} onChange={(e) => setDetails((d) => ({ ...d, couple_name_one: e.target.value }))} placeholder="First Partner" />
              </FormField>
              <FormField label="Partner Two Name">
                <Input value={details.couple_name_two} onChange={(e) => setDetails((d) => ({ ...d, couple_name_two: e.target.value }))} placeholder="Second Partner" />
              </FormField>
            </div>
            <FormField label="Wedding Date & Time">
              <Input type="datetime-local" value={details.wedding_date} onChange={(e) => setDetails((d) => ({ ...d, wedding_date: e.target.value }))} />
            </FormField>
            <FormField label="RSVP Deadline">
              <Input type="datetime-local" value={details.rsvp_deadline} onChange={(e) => setDetails((d) => ({ ...d, rsvp_deadline: e.target.value }))} />
            </FormField>
            <FormField label="Location">
              <Input value={details.location} onChange={(e) => setDetails((d) => ({ ...d, location: e.target.value }))} placeholder="Wedding venue" />
            </FormField>
            <FormField label="Hashtag">
              <Input value={details.hashtag} onChange={(e) => setDetails((d) => ({ ...d, hashtag: e.target.value }))} placeholder="#ourwedding" />
            </FormField>
            <FormField label="URL Slug" hint="This is the URL path for your invitation.">
              <Input value={details.slug} disabled className="bg-gray-50" />
            </FormField>
            <Button onClick={() => saveDetailsMutation.mutate()} disabled={saveDetailsMutation.isPending}>
              <Save className="mr-1.5 h-4 w-4" /> Save Details
            </Button>
          </div>
        </Card>

        <Card>
          <div className="mb-4 flex items-center gap-2">
            <Share2 className="h-5 w-5 text-gray-700" />
            <h3 className="text-sm font-semibold text-gray-900">Sharing & Open Graph</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
              <div>
                <Label>Enable Sharing</Label>
                <p className="mt-1 text-xs text-gray-500">Allow guests to share your invitation link.</p>
              </div>
              <Toggle checked={sharing.enabled} onChange={(v) => setSharing((s) => ({ ...s, enabled: v }))} />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
              <div>
                <Label>Allow QR Bypass</Label>
                <p className="mt-1 text-xs text-gray-500">Allow QR code scans to skip the sign-in page.</p>
              </div>
              <Toggle checked={sharing.allow_qr_bypass} onChange={(v) => setSharing((s) => ({ ...s, allow_qr_bypass: v }))} />
            </div>
            <FormField label="OG Title" hint="Title shown when sharing on social media">
              <Input value={sharing.og_title} onChange={(e) => setSharing((s) => ({ ...s, og_title: e.target.value }))} placeholder="Our Wedding Invitation" />
            </FormField>
            <FormField label="OG Description" hint="Description shown when sharing on social media">
              <Textarea value={sharing.og_description} onChange={(e) => setSharing((s) => ({ ...s, og_description: e.target.value }))} placeholder="We invite you to celebrate with us…" />
            </FormField>
            <FormField label="OG Image" hint="Image shown when sharing on social media">
              <ImageUpload value={sharing.og_image_url ?? null} onChange={(url) => setSharing((s) => ({ ...s, og_image_url: url ?? null }))} />
            </FormField>
            <Button onClick={() => saveSharingMutation.mutate()} disabled={saveSharingMutation.isPending}>
              <Save className="mr-1.5 h-4 w-4" /> Save Sharing Settings
            </Button>
          </div>
        </Card>
      </div>
      {toast && <Toast message={toast.message} type={toast.type} />}
    </AdminLayout>
  );
}
