import { useState, useEffect, useRef, useCallback } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { supabase, type UserEvent, type EventContent } from "../../lib/supabase";
import { debounce } from "../../lib/utils";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { HomePreview } from "../../components/preview/PreviewRenderers";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { DatePicker } from "../../components/ui/DatePicker";
import { TimePicker } from "../../components/ui/TimePicker";
import { FormField, Toast, Skeleton } from "../../components/ui";
import { Input, Textarea } from "../../components/ui/Input";

export default function HomeEditorPage() {
  const { event } = useOutletContext<{ event: UserEvent | null }>();
  const { eventId } = useParams<{ eventId: string }>();

  const [content, setContent] = useState<EventContent>({});
  const [eventDate, setEventDate] = useState<string | null>(null);
  const [eventTime, setEventTime] = useState<string | null>(null);
  const [venue, setVenue] = useState("");
  const [address, setAddress] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [saving, setSaving] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (!event) return;
    setContent(event.draft_content || event.content || {});
    setEventDate(event.draft_event_date || event.event_date || null);
    setEventTime(event.draft_event_time || event.event_time || null);
    setVenue(event.draft_venue || event.venue || "");
    setAddress(event.draft_address || event.address || "");
    initialized.current = true;
  }, [event]);

  const save = useCallback(async (c: EventContent, d: string | null, t: string | null, v: string, a: string) => {
    if (!eventId) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("events")
        .update({
          draft_content: c,
          draft_event_date: d,
          draft_event_time: t,
          draft_venue: v,
          draft_address: a,
        })
        .eq("id", eventId);
      if (error) throw error;
      setToast({ message: "Saved", type: "success" });
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : "Save failed", type: "error" });
    } finally {
      setSaving(false);
    }
  }, [eventId]);

  const debouncedSave = useRef(debounce(save, 800)).current;

  const doSave = useCallback(() => {
    debouncedSave(content, eventDate, eventTime, venue, address);
  }, [debouncedSave, content, eventDate, eventTime, venue, address]);

  const updateContent = (patch: Partial<EventContent>) => {
    setContent((prev) => {
      const next = { ...prev, ...patch };
      if (initialized.current) debouncedSave(next, eventDate, eventTime, venue, address);
      return next;
    });
  };

  const updateDate = (d: string | null) => {
    setEventDate(d);
    if (initialized.current) debouncedSave(content, d, eventTime, venue, address);
  };

  const updateTime = (t: string | null) => {
    setEventTime(t);
    if (initialized.current) debouncedSave(content, eventDate, t, venue, address);
  };

  const updateVenue = (v: string) => {
    setVenue(v);
    if (initialized.current) debouncedSave(content, eventDate, eventTime, v, address);
  };

  const updateAddress = (a: string) => {
    setAddress(a);
    if (initialized.current) debouncedSave(content, eventDate, eventTime, venue, a);
  };

  if (!event) {
    return (
      <div className="p-6">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const previewEvent: UserEvent = {
    ...event,
    draft_content: content,
    draft_event_date: eventDate,
    draft_event_time: eventTime,
    draft_venue: venue,
    draft_address: address,
  };

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Home Editor</h1>
          <p className="text-sm text-slate-500">Edit your event home page content</p>
        </div>
        {saving && <span className="text-sm text-slate-500">Saving...</span>}
      </div>
      <SplitEditor preview={<HomePreview event={previewEvent} />}>
        <div className="space-y-5">
          <h2 className="text-sm font-semibold text-slate-900">Event Details</h2>
          <DatePicker label="Event Date" value={eventDate} onChange={updateDate} />
          <TimePicker label="Event Time" value={eventTime} onChange={updateTime} />
          <FormField label="Venue">
            <Input value={venue} onChange={(e) => updateVenue(e.target.value)} placeholder="Venue name" />
          </FormField>
          <FormField label="Address">
            <Textarea value={address} onChange={(e) => updateAddress(e.target.value)} placeholder="Full address" />
          </FormField>

          <div className="pt-4 border-t border-slate-100">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">Story</h2>
            <FormField label="Story">
              <Textarea value={content.story || ""} onChange={(e) => updateContent({ story: e.target.value })} placeholder="Tell your story..." />
            </FormField>
            <div className="mt-4">
              <FormField label="Story Image">
                <ImageUpload value={content.story_image || ""} onChange={(v) => updateContent({ story_image: v })} eventId={eventId} aspectRatio="16/9" />
              </FormField>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">Invitation</h2>
            <FormField label="Invitation Title">
              <Input value={content.invitation_title || ""} onChange={(e) => updateContent({ invitation_title: e.target.value })} placeholder="You're Invited" />
            </FormField>
            <div className="mt-4">
              <FormField label="Invitation Subtitle">
                <Input value={content.invitation_subtitle || ""} onChange={(e) => updateContent({ invitation_subtitle: e.target.value })} placeholder="We would be honoured by your presence" />
              </FormField>
            </div>
            <div className="mt-4">
              <FormField label="Invitation Body">
                <Textarea value={content.invitation_body || ""} onChange={(e) => updateContent({ invitation_body: e.target.value })} placeholder="Invitation message..." />
              </FormField>
            </div>
            <div className="mt-4">
              <FormField label="RSVP Button Text">
                <Input value={content.rsvp_button_text || ""} onChange={(e) => updateContent({ rsvp_button_text: e.target.value })} placeholder="RSVP" />
              </FormField>
            </div>
          </div>
        </div>
      </SplitEditor>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
