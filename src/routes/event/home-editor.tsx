import { useState, useEffect, useCallback, useRef } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventContent } from "../../lib/supabase";
import { debounce } from "../../lib/utils";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { HomePreview } from "../../components/preview/PreviewRenderers";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { Input, Textarea } from "../../components/ui/Input";
import { FormField, Toast, Skeleton } from "../../components/ui";
import { DatePicker } from "../../components/ui/DatePicker";
import { TimePicker } from "../../components/ui/TimePicker";

export default function HomeEditor() {
  const { event } = useOutletContext<{ event: UserEvent | null }>();
  const { eventId } = useParams<{ eventId: string }>();
  const [content, setContent] = useState<EventContent>({});
  const [eventDate, setEventDate] = useState<string | null>(null);
  const [eventTime, setEventTime] = useState<string | null>(null);
  const [venue, setVenue] = useState("");
  const [address, setAddress] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (event && !initialized.current) {
      setContent(event.draft_content || event.content || {});
      setEventDate(event.draft_event_date || event.event_date || null);
      setEventTime(event.draft_event_time || event.event_time || null);
      setVenue(event.draft_venue || event.venue || "");
      setAddress(event.draft_address || event.address || "");
      initialized.current = true;
    }
  }, [event]);

  const saveMutation = useMutation<void, Error>({
    mutationFn: async () => {
      if (!eventId) throw new Error("No event ID");
      const { error } = await supabase
        .from("events")
        .update({
          draft_content: content,
          draft_event_date: eventDate,
          draft_event_time: eventTime,
          draft_venue: venue,
          draft_address: address,
        })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => setToast({ message: "Saved", type: "success" }),
    onError: () => setToast({ message: "Failed to save", type: "error" }),
  });

  const debouncedSave = useRef(debounce(() => saveMutation.mutate(), 600)).current;

  const triggerSave = useCallback(() => {
    if (!initialized.current) return;
    debouncedSave();
  }, [debouncedSave]);

  const updateContent = (patch: Partial<EventContent>) => {
    setContent((prev) => ({ ...prev, ...patch }));
    triggerSave();
  };

  const updateDate = (v: string | null) => { setEventDate(v); triggerSave(); };
  const updateTime = (v: string | null) => { setEventTime(v); triggerSave(); };
  const updateVenue = (v: string) => { setVenue(v); triggerSave(); };
  const updateAddress = (v: string) => { setAddress(v); triggerSave(); };

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
      <h1 className="text-xl font-semibold text-slate-900 mb-4">Home Page Editor</h1>
      <SplitEditor preview={<HomePreview event={previewEvent} />}>
        <div className="space-y-5">
          <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">Event Details</h2>
          <FormField label="Event Date">
            <DatePicker value={eventDate} onChange={updateDate} />
          </FormField>
          <FormField label="Event Time">
            <TimePicker value={eventTime} onChange={updateTime} />
          </FormField>
          <FormField label="Venue">
            <Input value={venue} onChange={(e) => updateVenue(e.target.value)} placeholder="Grand Ballroom" />
          </FormField>
          <FormField label="Address">
            <Textarea value={address} onChange={(e) => updateAddress(e.target.value)} placeholder="123 Main St, City" />
          </FormField>

          <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide pt-4 border-t border-slate-100">Story</h2>
          <FormField label="Story">
            <Textarea value={content.story || ""} onChange={(e) => updateContent({ story: e.target.value })} placeholder="Tell your story..." />
          </FormField>
          <FormField label="Story Image">
            <ImageUpload value={content.story_image || ""} onChange={(v) => updateContent({ story_image: v })} eventId={eventId} aspectRatio="16/9" />
          </FormField>

          <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide pt-4 border-t border-slate-100">Invitation</h2>
          <FormField label="Invitation Title">
            <Input value={content.invitation_title || ""} onChange={(e) => updateContent({ invitation_title: e.target.value })} placeholder="You're Invited" />
          </FormField>
          <FormField label="Invitation Subtitle">
            <Input value={content.invitation_subtitle || ""} onChange={(e) => updateContent({ invitation_subtitle: e.target.value })} placeholder="We would be honoured" />
          </FormField>
          <FormField label="Invitation Body">
            <Textarea value={content.invitation_body || ""} onChange={(e) => updateContent({ invitation_body: e.target.value })} placeholder="Join us for..." />
          </FormField>
          <FormField label="Invitation Text">
            <Textarea value={content.invitation_text || ""} onChange={(e) => updateContent({ invitation_text: e.target.value })} placeholder="Your presence is..." />
          </FormField>
          <FormField label="RSVP Button Text">
            <Input value={content.rsvp_button_text || ""} onChange={(e) => updateContent({ rsvp_button_text: e.target.value })} placeholder="RSVP" />
          </FormField>
        </div>
      </SplitEditor>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
