import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { RichTextEditor } from "../../components/ui/RichTextEditor";
import { Button } from "../../components/ui/Button";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { jsonToTheme } from "../../lib/theme";
import { formatDate, formatTime } from "../../lib/utils";

export function HomeEditor() {
  const { eventId } = useParams<{ eventId: string }>();
  const qc = useQueryClient();
  const [bodyHtml, setBodyHtml] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
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
      const content = (event.draft_content ?? event.content ?? {}) as Record<string, unknown>;
      setBodyHtml((content.body as string) || "");
      const logoConfig = (event.draft_logo_config ?? event.logo_config ?? {}) as Record<string, unknown>;
      setLogoUrl((logoConfig.imageUrl as string) || "");
    }
  }, [event]);

  const save = async () => {
    if (!event) return;
    setSaving(true);
    const content = { ...((event.draft_content ?? event.content ?? {}) as Record<string, unknown>), body: bodyHtml };
    const logoConfig = { ...((event.draft_logo_config ?? event.logo_config ?? {}) as Record<string, unknown>), imageUrl: logoUrl };
    const { error } = await supabase
      .from("user_events")
      .update({ draft_content: content, draft_logo_config: logoConfig })
      .eq("id", event.id);
    setSaving(false);
    if (!error) qc.invalidateQueries({ queryKey: ["event", eventId] });
  };

  if (!event) return <div>Loading…</div>;

  const theme = jsonToTheme((event.draft_theme ?? event.theme) as Record<string, unknown> | null);

  const preview = (
    <div style={{ backgroundColor: theme.background, color: theme.text, fontFamily: theme.bodyFont, minHeight: "100%", padding: "1rem" }}>
      {logoUrl && (
        <div className="text-center mb-3">
          <img src={logoUrl} alt="Logo" className="mx-auto max-h-20 object-contain" />
        </div>
      )}
      {bodyHtml ? (
        <div dangerouslySetInnerHTML={{ __html: bodyHtml }} />
      ) : (
        <p className="text-center text-gray-400 text-sm">Start typing to see a live preview…</p>
      )}
      <div className="text-center py-4 mt-3" style={{ backgroundColor: theme.background, borderRadius: "8px" }}>
        <h2 className="text-lg font-semibold" style={{ fontFamily: theme.headingFont }}>
          {event.event_date && formatDate(event.event_date)}
        </h2>
        {event.event_time && <p className="text-sm" style={{ color: theme.textMuted }}>{formatTime(event.event_time)}</p>}
        {event.venue && <p className="text-sm" style={{ color: theme.textMuted }}>{event.venue}</p>}
        <button
          className="mt-3 px-6 py-2.5 rounded-lg text-sm font-medium"
          style={{ backgroundColor: theme.primary, color: "#fff", borderRadius: theme.buttonRadius }}
        >
          RSVP Now
        </button>
      </div>
    </div>
  );

  return (
    <SplitEditor
      title="Home Page Editor"
      editor={
        <div className="space-y-4 pr-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Logo Image</label>
            <ImageUpload value={logoUrl} onChange={setLogoUrl} label="" bucket="event-assets" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Body Content</label>
            <RichTextEditor value={bodyHtml} onChange={setBodyHtml} placeholder="Write your welcome message…" />
          </div>
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      }
      preview={preview}
    />
  );
}
