import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { generateQrUrl } from "../../lib/qr";

export function SharingPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const qc = useQueryClient();
  const [shareTitle, setShareTitle] = useState("");
  const [shareDescription, setShareDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: event } = useQuery({
    queryKey: ["event", eventId],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_events").select("*").eq("id", eventId!).single();
      if (error) throw error;
      return data as UserEvent;
    },
    enabled: !!eventId,
  });

  useEffect(() => {
    if (event) {
      const sharingConfig = (event.draft_sharing_config ?? event.sharing_config ?? {}) as Record<string, unknown>;
      setShareTitle((sharingConfig.title as string) || event.draft_name || event.name || "");
      setShareDescription((sharingConfig.description as string) || "");
    }
  }, [event]);

  const shareUrl = event ? `${window.location.origin}/e/${event.draft_slug ?? event.slug ?? event.id}` : "";
  const qrUrl = shareUrl ? generateQrUrl(shareUrl) : "";

  const save = async () => {
    if (!event) return;
    setSaving(true);
    const sharingConfig = {
      ...((event.draft_sharing_config ?? event.sharing_config ?? {}) as Record<string, unknown>),
      title: shareTitle,
      description: shareDescription,
    };
    const { error } = await supabase
      .from("user_events")
      .update({ draft_sharing_config: sharingConfig })
      .eq("id", event.id);
    setSaving(false);
    if (!error) qc.invalidateQueries({ queryKey: ["event", eventId] });
  };

  const copyLink = () => {
    if (shareUrl) navigator.clipboard.writeText(shareUrl);
  };

  if (!event) return <div>Loading…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-1">Sharing</h2>
        <p className="text-sm text-gray-500">Share your event link and configure social previews.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Share URL</label>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={shareUrl}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
            />
            <Button variant="outline" size="sm" onClick={copyLink}>Copy</Button>
          </div>
        </div>

        {qrUrl && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">QR Code</label>
            <img src={qrUrl} alt="QR code" className="w-40 h-40 border border-gray-200 rounded-lg" />
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-medium text-gray-700">Social Sharing</h3>
        <Input
          label="Share Title"
          value={shareTitle}
          onChange={(e) => setShareTitle(e.target.value)}
          placeholder="Title shown when sharing on social media"
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Share Description</label>
          <textarea
            value={shareDescription}
            onChange={(e) => setShareDescription(e.target.value)}
            placeholder="Description shown when sharing on social media"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--event-primary,#8B7355)]"
          />
        </div>

        <Button onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  );
}
