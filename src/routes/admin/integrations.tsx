import { useState, useCallback } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  BarChart3, Facebook, Mail, MessageSquare, Calendar,
  Image as ImageIcon, Zap, Settings,
} from "lucide-react";
import { supabase, Wedding, WeddingContent } from "../../lib/supabase";
import { Card, Badge, FormField, Toggle, Toast, ErrorState } from "../../components/ui/index";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";

type OutletContext = { wedding: Wedding | null };

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  enabled: boolean;
  configKey?: string;
}

export default function IntegrationsPage() {
  const { wedding } = useOutletContext<OutletContext>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [integrations, setIntegrations] = useState<Integration[]>([
    { id: "ga", name: "Google Analytics", description: "Track website visitors and page views", icon: <BarChart3 className="w-5 h-5" />, color: "bg-orange-50 text-orange-600", enabled: false, configKey: "google_analytics_id" },
    { id: "fb", name: "Facebook Pixel", description: "Track conversions and retarget guests", icon: <Facebook className="w-5 h-5" />, color: "bg-blue-50 text-blue-600", enabled: false, configKey: "facebook_pixel_id" },
    { id: "mailchimp", name: "Mailchimp", description: "Sync guest emails to your mailing list", icon: <Mail className="w-5 h-5" />, color: "bg-yellow-50 text-yellow-600", enabled: false },
    { id: "whatsapp", name: "WhatsApp Business", description: "Send RSVP reminders via WhatsApp", icon: <MessageSquare className="w-5 h-5" />, color: "bg-green-50 text-green-600", enabled: false },
    { id: "calendar", name: "Google Calendar", description: "Add wedding events to guest calendars", icon: <Calendar className="w-5 h-5" />, color: "bg-red-50 text-red-600", enabled: false },
    { id: "cloudinary", name: "Cloudinary", description: "Optimize and host gallery images", icon: <ImageIcon className="w-5 h-5" />, color: "bg-purple-50 text-purple-600", enabled: false },
    { id: "zapier", name: "Zapier", description: "Connect with 5,000+ apps and automate workflows", icon: <Zap className="w-5 h-5" />, color: "bg-orange-50 text-orange-600", enabled: false },
  ]);
  const [configValues, setConfigValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const toggleIntegration = useCallback((id: string) => {
    setIntegrations((prev) => prev.map((i) => i.id === id ? { ...i, enabled: !i.enabled } : i));
  }, []);

  const updateConfigValue = useCallback((key: string, value: string) => {
    setConfigValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    if (!wedding) return;
    setSaving(true);
    try {
      const content = wedding.draft_content || wedding.content || {} as WeddingContent;
      const updatedContent = { ...content, integrations: { enabled: integrations, config: configValues } } as any;
      const { error } = await supabase.from("weddings").update({ draft_content: updatedContent }).eq("id", wedding.id);
      if (error) throw error;
      queryClient.setQueryData(["wedding"], (old: Wedding | null) => old ? { ...old, draft_content: updatedContent } : old);
      setToast({ msg: "Integrations saved!", type: "success" });
      setTimeout(() => setToast(null), 3000);
    } catch (err: any) {
      setToast({ msg: "Failed: " + err.message, type: "error" });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setSaving(false);
    }
  }, [wedding, integrations, configValues, queryClient]);

  if (!wedding) return <ErrorState message="Could not load wedding data" onRetry={() => navigate("/admin")} />;

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Integrations</h1>
          <p className="text-sm text-gray-500">Connect third-party services to your wedding website</p>
        </div>
        <Button onClick={handleSave} loading={saving}>Save Changes</Button>
      </div>

      <div className="space-y-3">
        {integrations.map((integration) => (
          <Card key={integration.id} className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${integration.color}`}>
                  {integration.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-gray-900">{integration.name}</h3>
                    {integration.enabled && <Badge color="green">Connected</Badge>}
                  </div>
                  <p className="text-xs text-gray-500">{integration.description}</p>
                  {integration.enabled && integration.configKey && (
                    <div className="mt-3">
                      <FormField label={`${integration.name} ID`}>
                        <Input
                          value={configValues[integration.configKey] || ""}
                          onChange={(e) => updateConfigValue(integration.configKey!, e.target.value)}
                          placeholder={`Enter your ${integration.name} ID`}
                        />
                      </FormField>
                    </div>
                  )}
                </div>
              </div>
              <Toggle checked={integration.enabled} onChange={() => toggleIntegration(integration.id)} />
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-5 bg-gray-50">
        <div className="flex items-start gap-3">
          <Settings className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Need more integrations?</h3>
            <p className="text-xs text-gray-500">Contact support to request new integrations or use Zapier to connect with 5,000+ apps.</p>
          </div>
        </div>
      </Card>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
