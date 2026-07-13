import { useState, useEffect, useRef, useCallback } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventContent } from "../../lib/supabase";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { HomePreview } from "../../components/preview/PreviewRenderers";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { DatePicker } from "../../components/ui/DatePicker";
import { TimePicker } from "../../components/ui/TimePicker";
import { FormField, Toast } from "../../components/ui";
import { Input, Textarea } from "../../components/ui/Input";
import { Loader2 } from "lucide-react";
import { debounce } from "../../lib/utils";

export default function HomeEditor() {
  const { event } = useOutletContext<{ event: UserEvent | null }>();
  const { eventId } = useParams<{ eventId: string }>();
  const [content, setContent] = useState<EventContent>({});
  const [eventDate, setEventDate] = useState<string | null>(null);
  const [eventTime, setEventTime] = useState<string | null>(null);
  const [venue, setVenue] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [saving, setSaving] = useState(false);
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

  const saveMutation = useMutation<void, Error, {
    content: EventContent;
    eventDate: string | null;
    eventTime: string | null;
    venue: string;
    address: string;
  }>({
    mutationFn: async (vars) => {
      setSaving(true);
      const { error } = await supabase
        .from("events")
        .update({
          draft_content: vars.content,
          draft_event_date: vars.eventDate,
          draft_event_time: vars.eventTime,
          draft_venue: vars.venue,
          draft_address: vars.address,
        })
        .eq("id", eventId!);
      if (error) throw error;
    },
    onSuccess: () => setToast({ message: "Saved", type: "success" }),
    onError: () => setToast({ message: "Failed to save", type: "error" }),
    onSettled: () => setSaving(false),
  });

  const debouncedSave = useRef(
    debounce((vars: {
      content: EventContent;
      eventDate: string | null;
      eventTime: string | null;
      venue: string;
      address: string;
    }) => {
      saveMutation.mutate(vars);
    }, 800)
  ).current;

  const save = useCallback(
    (next: {
      content: EventContent;
      eventDate: string | null;
      eventTime: string | null;
      venue: string;
      address: string;
    }) => {
      debouncedSave(next);
    },
    [debouncedSave]
  );

  const updateContent = (patch: Partial<EventContent>) => {
    const next = { ...content, ...patch };
    setContent(next);
    save({ content: next, eventDate, eventTime, venue, address });
  };
  const updateDate = (v: string | null) => {
    setEventDate(v);
    save({ content, eventDate: v, eventTime, venue, address });
  };
  const updateTime = (v: string | null) => {
    setEventTime(v);
    save({ content, eventDate, eventTime: v, venue, address });
  };
  const updateVenue = (v: string) => {
    setVenue(v);
    save({ content, eventDate, eventTime, venue: v, address });
  };
  const updateAddress = (v: string) => {
    setAddress(v);
    save({ content, eventDate, eventTime, venue, address: v });
  };

  if (!event) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
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
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Home Editor</h1>
          <p className="text-sm text-slate-500">Edit your event content and details.</p>
        </div>
        {saving && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin" /> Saving...
          </div>
        )}
      </div>
      <SplitEditor preview={<HomePreview event={previewEvent} />}>
        <div className="space-y-5">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Event Details</h3>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Date">
                <DatePicker value={eventDate} onChange={updateDate} />
              </FormField>
              <FormField label="Time">
                <TimePicker value={eventTime} onChange={updateTime} />
              </FormField>
            </div>
            <div className="mt-3">
              <FormField label="Venue">
                <Input value={venue} onChange={(e) => updateVenue(e.target.value)} placeholder="Venue name" />
              </FormField>
            </div>
            <div className="mt-3">
              <FormField label="Address">
                <Input value={address} onChange={(e) => updateAddress(e.target.value)} placeholder="Full address" />
              </FormField>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Invitation</h3>
            <FormField label="Invitation Title">
              <Input value={content.invitation_title || ""} onChange={(e) => updateContent({ invitation_title: e.target.value })} placeholder="You're Invited" />
            </FormField>
            <div className="mt-3">
              <FormField label="Invitation Subtitle">
                <Input value={content.invitation_subtitle || ""} onChange={(e) => updateContent({ invitation_subtitle: e.target.value })} placeholder="Subtitle" />
              </FormField>
            </div>
            <div className="mt-3">
              <FormField label="Invitation Body">
                <Textarea value={content.invitation_body || ""} onChange={(e) => updateContent({ invitation_body: e.target.value })} placeholder="Invitation message" />
              </FormField>
            </div>
            <div className="mt-3">
              <FormField label="RSVP Button Text">
                <Input value={content.rsvp_button_text || ""} onChange={(e) => updateContent({ rsvp_button_text: e.target.value })} placeholder="RSVP" />
              </FormField>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Story</h3>
            <FormField label="Story Image">
              <ImageUpload value={content.story_image || ""} onChange={(v) => updateContent({ story_image: v })} eventId={eventId} />
            </FormField>
            <div className="mt-3">
              <FormField label="Story">
                <Textarea value={content.story || ""} onChange={(e) => updateContent({ story: e.target.value })} placeholder="Tell your story..." />
              </FormField>
            </div>
          </div>
        </div>
      </SplitEditor>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
