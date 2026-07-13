import { useState, useCallback } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Globe, Plus, Check, ExternalLink, AlertCircle } from "lucide-react";
import { supabase, Wedding } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card, Badge, FormField, Toast, ErrorState } from "../../components/ui/index";

type OutletContext = { wedding: Wedding | null };

export default function DomainsPage() {
  const { wedding } = useOutletContext<OutletContext>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [customDomain, setCustomDomain] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const currentDomain = `${wedding?.id?.slice(0, 8) || "wedding"}.wedding-app.com`;

  const handleAddDomain = useCallback(async () => {
    if (!wedding || !customDomain.trim()) return;
    setSaving(true);
    try {
      // Mock save - store in sharing_config customUrl
      const sharingConfig = wedding.draft_sharing_config || wedding.sharing_config;
      const updatedConfig = { ...sharingConfig, customUrl: customDomain.trim() };
      const { error } = await supabase.from("weddings").update({ draft_sharing_config: updatedConfig }).eq("id", wedding.id);
      if (error) throw error;
      queryClient.setQueryData(["wedding"], (old: Wedding | null) => old ? { ...old, draft_sharing_config: updatedConfig } : old);
      setToast({ msg: "Custom domain saved! DNS configuration may take up to 24 hours.", type: "success" });
      setTimeout(() => setToast(null), 4000);
      setCustomDomain("");
    } catch (err: any) {
      setToast({ msg: "Failed: " + err.message, type: "error" });
      setTimeout(() => setToast(null), 4000);
    } finally {
      setSaving(false);
    }
  }, [wedding, customDomain, queryClient]);

  if (!wedding) return <ErrorState message="Could not load wedding data" onRetry={() => navigate("/admin")} />;

  const existingDomain = wedding.draft_sharing_config?.customUrl || wedding.sharing_config?.customUrl;

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Custom Domains</h1>
        <p className="text-sm text-gray-500">Use your own domain for your wedding website</p>
      </div>

      {/* Current Domain */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600"><Globe className="w-5 h-5" /></div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Current Domain</h3>
            <p className="text-xs text-gray-500">Your website is live at this address</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
          <ExternalLink className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-900 flex-1">{existingDomain || currentDomain}</span>
          <Badge color={existingDomain ? "green" : "gray"}>{existingDomain ? "Custom" : "Default"}</Badge>
        </div>
      </Card>

      {/* Add Custom Domain */}
      <Card className="p-6 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Add Custom Domain</h3>
          <p className="text-xs text-gray-500">Enter your domain name to connect it</p>
        </div>
        <FormField label="Domain Name" hint="e.g. www.johnandjane.com">
          <Input value={customDomain} onChange={(e) => setCustomDomain(e.target.value)} placeholder="www.yourdomain.com" />
        </FormField>
        <Button onClick={handleAddDomain} loading={saving} disabled={!customDomain.trim()}>
          <Plus className="w-4 h-4" /> Add Domain
        </Button>
      </Card>

      {/* DNS Instructions */}
      {existingDomain && (
        <Card className="p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">DNS Configuration Required</h3>
              <p className="text-xs text-gray-500 mb-3">Add the following DNS records to your domain provider:</p>
              <div className="space-y-2">
                <div className="p-3 bg-gray-50 rounded-lg font-mono text-xs text-gray-700">
                  <p><span className="text-gray-400">Type:</span> CNAME</p>
                  <p><span className="text-gray-400">Name:</span> www</p>
                  <p><span className="text-gray-400">Value:</span> {currentDomain}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg font-mono text-xs text-gray-700">
                  <p><span className="text-gray-400">Type:</span> A</p>
                  <p><span className="text-gray-400">Name:</span> @</p>
                  <p><span className="text-gray-400">Value:</span> 76.76.21.21</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
