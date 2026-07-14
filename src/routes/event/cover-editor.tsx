import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { ImageUpload } from "../../components/ui/ImageUpload";

export function CoverEditor() {
  const { eventId } = useParams<{ eventId: string }>();
  const qc = useQueryClient();
  const [coverImage, setCoverImage] = useState("");
  const [subtitle, setSubtitle] = useState("");
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
      setCoverImage(event.draft_cover_image ?? event.cover_image ?? "");
      const coverConfig = (event.draft_cover_config ?? event.cover_config ?? {}) as Record<string, unknown>;
      setSubtitle((coverConfig.subtitle as string) || "");
    }
  }, [event]);

  const save = async () => {
    if (!event) return;
    setSaving(true);
    const coverConfig = {
      ...((event.draft_cover_config ?? event.cover_config ?? {}) as Record<string, unknown>),
      subtitle,
    };
    const { error } = await supabase
      .from("user_events")
      .update({ draft_cover_image: coverImage, draft_cover_config: coverConfig })
      .eq("id", event.id);
    setSaving(false);
    if (!error) qc.invalidateQueries({ queryKey: ["event", eventId] });
  };

  if (!event) return <div>Loading…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-1">Cover Page</h2>
        <p className="text-sm text-gray-500">The cover is the first thing guests see before logging in.</p>
      </div>

      <div className="space-y-4 bg-white p-5 border border-gray-200 rounded-xl">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image</label>
          <ImageUpload value={coverImage} onChange={setCoverImage} bucket="event-assets" />
        </div>

        <Input
          label="Subtitle"
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          placeholder="e.g. Join us to celebrate our wedding"
        />

        <Button onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <p className="text-sm font-medium text-gray-700 px-4 py-3 border-b border-gray-100">Preview</p>
        <div className="relative h-64">
          {coverImage ? (
            <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
              No cover image
            </div>
          )}
          {subtitle && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <p className="text-white text-lg font-medium text-center px-4">{subtitle}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
