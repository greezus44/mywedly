import { useState, useEffect, useMemo, useCallback } from "react";
import { useOutletContext, useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase, UserEvent, EventContent, ThemeConfig } from "../../lib/supabase";
import { DEFAULT_CONTENT, DEFAULT_THEME } from "../../lib/theme";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { HomePreview } from "../../components/preview/PreviewRenderers";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";
import { FormField, ImageUpload, Toast, ErrorState } from "../../components/ui/index";
import { DatePicker } from "../../components/ui/DatePicker";
import { TimePicker } from "../../components/ui/TimePicker";
import { debounce } from "../../lib/utils";

type Ctx = { event: UserEvent | null };

export default function HomeEditor() {
  const { event } = useOutletContext<Ctx>();
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [content, setContent] = useState<EventContent>(event?.draft_content || event?.content || DEFAULT_CONTENT);
  const [theme, setTheme] = useState<ThemeConfig>(event?.draft_theme || event?.theme || DEFAULT_THEME);
  const [eventDate, setEventDate] = useState<string | null>(event?.draft_event_date || event?.event_date || null);
  const [eventTime, setEventTime] = useState<string | null>(event?.draft_event_time || event?.event_time || null);
  const [venue, setVenue] = useState(event?.draft_venue || event?.venue || "");
  const [address, setAddress] = useState(event?.draft_address || event?.address || "");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [previewKey, setPreviewKey] = useState("0");

  useEffect(() => {
    if (event) {
      setContent(event.draft_content || event.content || DEFAULT_CONTENT);
      setTheme(event.draft_theme || event.theme || DEFAULT_THEME);
      setEventDate(event.draft_event_date || event.event_date || null);
      setEventTime(event.draft_event_time || event.event_time || null);
      setVenue(event.draft_venue || event.venue || "");
      setAddress(event.draft_address || event.address || "");
    }
  }, [event?.id]);

  const debouncedPreviewUpdate = useMemo(() => debounce(() => setPreviewKey(k => String(Number(k) + 1)), 150), []);
  const updateContent = useCallback((patch: Partial<EventContent>) => { setContent(prev => ({ ...prev, ...patch })); debouncedPreviewUpdate(); }, [debouncedPreviewUpdate]);

  const handleSave = useCallback(async () => {
    if (!event || !eventId) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("user_events").update({
        draft_content: content, draft_event_date: eventDate, draft_event_time: eventTime, draft_venue: venue, draft_address: address,
      }).eq("id", eventId);
      if (error) throw error;
      queryClient.setQueryData(["event", eventId], (old: UserEvent | null) => old ? { ...old, draft_content: content, draft_event_date: eventDate, draft_event_time: eventTime, draft_venue: venue, draft_address: address } : old);
      setToast("Home page saved!"); setTimeout(() => setToast(null), 3000);
    } catch (err: any) { setToast("Failed: " + err.message); setTimeout(() => setToast(null), 3000); }
    finally { setSaving(false); }
  }, [event, eventId, content, eventDate, eventTime, venue, address, queryClient]);

  if (!event) return <ErrorState message="Could not load event data" onRetry={() => navigate("/dashboard")} />;
  const previewEvent = { ...event, draft_content: content, draft_theme: theme, draft_event_date: eventDate, draft_event_time: eventTime, draft_venue: venue, draft_address: address };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold text-gray-900">Home Page</h1><p className="text-sm text-gray-500">Event details and story</p></div>
        <Button onClick={handleSave} loading={saving}>Save Changes</Button>
      </div>
      <SplitEditor title="Home Page Content" previewKey={previewKey} preview={<HomePreview event={previewEvent} theme={theme} content={content} />} children={
        <div className="space-y-5">
          <div className="space-y-3"><h3 className="text-sm font-semibold text-gray-900">Event Details</h3>
            <DatePicker value={eventDate} onChange={setEventDate} label="Event Date" />
            <TimePicker value={eventTime} onChange={setEventTime} label="Event Time" />
            <FormField label="Venue"><Input value={venue} onChange={(e) => { setVenue(e.target.value); debouncedPreviewUpdate(); }} /></FormField>
            <FormField label="Address"><Textarea value={address} onChange={(e) => { setAddress(e.target.value); debouncedPreviewUpdate(); }} /></FormField>
          </div>
          <div className="space-y-3 border-t border-gray-200 pt-4"><h3 className="text-sm font-semibold text-gray-900">Our Story</h3>
            <FormField label="Story"><Textarea value={content.story} onChange={(e) => updateContent({ story: e.target.value })} placeholder="Tell your story..." className="min-h-[120px]" /></FormField>
            <FormField label="Story Image"><ImageUpload value={content.story_image} onChange={(v) => updateContent({ story_image: v })} /></FormField>
          </div>
        </div>
      } />
      {toast && <Toast message={toast} type={toast.includes("Failed") ? "error" : "success"} onClose={() => setToast(null)} />}
    </div>
  );
}
