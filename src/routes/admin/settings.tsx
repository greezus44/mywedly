import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Wedding, type SharingConfig } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Toggle } from "../../components/ui/Input";
import { Card, Badge, Toast } from "../../components/ui/index";
import { FormField } from "../../components/ui/ImageUpload";
import { Save, Settings, Globe, Heart } from "lucide-react";

export function SettingsPage() {
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<string | null>(null);

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

  const [isPublished, setIsPublished] = useState(false);
  const [weddingDate, setWeddingDate] = useState("");
  const [location, setLocation] = useState("");
  const [hashtag, setHashtag] = useState("");
  const [story, setStory] = useState("");
  const [rsvpDeadline, setRsvpDeadline] = useState("");
  const [signinHelper, setSigninHelper] = useState("");
  const [sharingConfig, setSharingConfig] = useState<SharingConfig>({});

  useEffect(() => {
    if (wedding) {
      setIsPublished(wedding.is_published);
      setWeddingDate(wedding.wedding_date ? wedding.wedding_date.slice(0, 10) : "");
      setLocation(wedding.location || "");
      setHashtag(wedding.hashtag || "");
      setStory(wedding.story || "");
      setRsvpDeadline(wedding.rsvp_deadline ? wedding.rsvp_deadline.slice(0, 10) : "");
      setSigninHelper(wedding.signin_helper || "");
      setSharingConfig(wedding.sharing_config || {});
    }
  }, [wedding]);

  const updateWedding = useMutation({
    mutationFn: async (patch: Record<string, unknown>) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { error } = await supabase.from("weddings").update(patch).eq("created_by", user.user.id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["wedding"] }); setToast("Settings saved"); },
  });

  const togglePublish = useMutation({
    mutationFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { error } = await supabase.from("weddings").update({ is_published: !isPublished }).eq("created_by", user.user.id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["wedding"] }); setToast(isPublished ? "Wedding unpublished" : "Wedding published!"); },
  });

  const saveGeneral = () => {
    updateWedding.mutate({
      wedding_date: weddingDate || null,
      location: location || null,
      hashtag: hashtag || null,
      story: story || null,
      rsvp_deadline: rsvpDeadline || null,
      signin_helper: signinHelper || null,
    });
  };

  const saveSharing = () => {
    updateWedding.mutate({ sharing_config: sharingConfig });
  };

  if (isLoading) return <AdminLayout><div className="flex items-center justify-center h-full"><div className="animate-pulse text-gray-400">Loading...</div></div></AdminLayout>;
  if (!wedding) return <AdminLayout><div className="p-6 text-gray-500">Wedding not found</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center gap-2">
            <Settings size={18} className="text-indigo-600" />
            <h1 className="font-ui text-xl font-bold text-gray-900">Settings</h1>
          </div>

          {/* Publish toggle */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-ui text-sm font-semibold text-gray-900 mb-1">Publish Status</h3>
                <p className="font-ui text-xs text-gray-500">When published, your wedding website is live and accessible to guests.</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={isPublished ? "success" : "warning"}>{isPublished ? "Published" : "Draft"}</Badge>
                <Toggle checked={isPublished} onChange={() => togglePublish.mutate()} />
              </div>
            </div>
          </Card>

          {/* General settings */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Heart size={16} className="text-indigo-600" />
              <h3 className="font-ui text-sm font-semibold text-gray-900">Wedding Details</h3>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Wedding Date">
                  <Input type="date" value={weddingDate} onChange={(e) => setWeddingDate(e.target.value)} className="!bg-white !border-gray-200 !text-gray-700" />
                </FormField>
                <FormField label="RSVP Deadline">
                  <Input type="date" value={rsvpDeadline} onChange={(e) => setRsvpDeadline(e.target.value)} className="!bg-white !border-gray-200 !text-gray-700" />
                </FormField>
              </div>
              <FormField label="Location">
                <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Wedding location" className="!bg-white !border-gray-200 !text-gray-700" />
              </FormField>
              <FormField label="Hashtag">
                <Input value={hashtag} onChange={(e) => setHashtag(e.target.value)} placeholder="#OurWedding" className="!bg-white !border-gray-200 !text-gray-700" />
              </FormField>
              <FormField label="Story">
                <Textarea value={story} onChange={(e) => setStory(e.target.value)} placeholder="Your love story..." className="!bg-white !border-gray-200 !text-gray-700" />
              </FormField>
              <FormField label="Sign-in Helper Text" hint="Helper text shown on the guest sign-in page">
                <Input value={signinHelper} onChange={(e) => setSigninHelper(e.target.value)} placeholder="e.g. Use the username from your invitation" className="!bg-white !border-gray-200 !text-gray-700" />
              </FormField>
              <Button variant="primary" size="md" onClick={saveGeneral} disabled={updateWedding.isPending}>
                <Save size={14} className="mr-1" /> Save Details
              </Button>
            </div>
          </Card>

          {/* Sharing settings */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Globe size={16} className="text-indigo-600" />
              <h3 className="font-ui text-sm font-semibold text-gray-900">Sharing & SEO</h3>
            </div>
            <div className="space-y-4">
              <FormField label="OG Title" hint="Title shown when sharing on social media">
                <Input value={sharingConfig.ogTitle || ""} onChange={(e) => setSharingConfig((prev) => ({ ...prev, ogTitle: e.target.value }))} placeholder="Our Wedding" className="!bg-white !border-gray-200 !text-gray-700" />
              </FormField>
              <FormField label="OG Description">
                <Textarea value={sharingConfig.ogDescription || ""} onChange={(e) => setSharingConfig((prev) => ({ ...prev, ogDescription: e.target.value }))} placeholder="Description for social media sharing" className="!bg-white !border-gray-200 !text-gray-700" />
              </FormField>
              <FormField label="OG Image URL">
                <Input value={sharingConfig.ogImageUrl || ""} onChange={(e) => setSharingConfig((prev) => ({ ...prev, ogImageUrl: e.target.value || null }))} placeholder="https://..." className="!bg-white !border-gray-200 !text-gray-700" />
              </FormField>
              <FormField label="Custom Domain">
                <Input value={sharingConfig.customDomain || ""} onChange={(e) => setSharingConfig((prev) => ({ ...prev, customDomain: e.target.value || null }))} placeholder="www.ourwedding.com" className="!bg-white !border-gray-200 !text-gray-700" />
              </FormField>
              <FormField label="Invitation Message" hint="Default message when sharing">
                <Textarea value={sharingConfig.invitationMessage || ""} onChange={(e) => setSharingConfig((prev) => ({ ...prev, invitationMessage: e.target.value }))} placeholder="You're invited to our wedding!" className="!bg-white !border-gray-200 !text-gray-700" />
              </FormField>
              <div className="flex items-center gap-3">
                <Toggle checked={sharingConfig.enableGuestQr ?? false} onChange={(v) => setSharingConfig((prev) => ({ ...prev, enableGuestQr: v }))} />
                <span className="font-ui text-sm text-gray-700">Enable guest QR codes</span>
              </div>
              <div className="flex items-center gap-3">
                <Toggle checked={sharingConfig.qrBypassLogin ?? false} onChange={(v) => setSharingConfig((prev) => ({ ...prev, qrBypassLogin: v }))} />
                <span className="font-ui text-sm text-gray-700">QR codes bypass login</span>
              </div>
              <Button variant="primary" size="md" onClick={saveSharing} disabled={updateWedding.isPending}>
                <Save size={14} className="mr-1" /> Save Sharing Settings
              </Button>
            </div>
          </Card>

          {/* Website URL */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Globe size={16} className="text-indigo-600" />
              <h3 className="font-ui text-sm font-semibold text-gray-900">Website URL</h3>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="font-mono text-sm text-gray-700">{window.location.origin}/w/{wedding.slug}</p>
            </div>
          </Card>
        </div>
      </div>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </AdminLayout>
  );
}
