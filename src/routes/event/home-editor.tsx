import { useState, useEffect, useRef } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventContent } from "../../lib/supabase";
import { Card, FormField, Toast } from "../../components/ui";
import { Input, Textarea } from "../../components/ui/Input";
import { DatePicker } from "../../components/ui/DatePicker";
import { TimePicker } from "../../components/ui/TimePicker";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { HomePreview } from "../../components/preview/PreviewRenderers";

const DEFAULT_CONTENT: EventContent = {
  story: "",
  story_image: "",
  invitation_title: "You're Invited",
  invitation_subtitle: "",
  invitation_body: "",
  invitation_text: "",
  rsvp_button_text: "RSVP",
};

function HomeEditorPage() {
  const { eventId } = useParams();
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();
  const [content, setContent] = useState<EventContent>(
    () => (event.draft_content || event.content || DEFAULT_CONTENT) as EventContent
  );
  const [name, setName] = useState(event.draft_name || event.name || "");
  const [eventType, setEventType] = useState(event.draft_event_type || event.event_type || "");
  const [eventDate, setEventDate] = useState<string | null>(event.draft_event_date || event.event_date || null);
  const [eventTime, setEventTime] = useState<string | null>(event.draft_event_time || event.event_time || null);
  const [venue, setVenue] = useState(event.draft_venue || event.venue || "");
  const [address, setAddress] = useState(event.draft_address || event.address || "");
  const [toast, setToast] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstRun = useRef(true);

  useEffect(() => {
    setContent((event.draft_content || event.content || DEFAULT_CONTENT) as EventContent);
    setName(event.draft_name || event.name || "");
    setEventType(event.draft_event_type || event.event_type || "");
    setEventDate(event.draft_event_date || event.event_date || null);
    setEventTime(event.draft_event_time || event.event_time || null);
    setVenue(event.draft_venue || event.venue || "");
    setAddress(event.draft_address || event.address || "");
  }, [event]);

  const saveMutation = useMutation({
    mutationFn: async (payload: {
      content: EventContent;
      name: string;
      eventType: string;
      eventDate: string | null;
      eventTime: string | null;
      venue: string;
      address: string;
    }) => {
      const { error } = await supabase
        .from("user_events")
        .update({
          draft_content: payload.content,
          draft_name: payload.name,
          draft_event_type: payload.eventType,
          draft_event_date: payload.eventDate,
          draft_event_time: payload.eventTime,
          draft_venue: payload.venue,
          draft_address: payload.address,
          updated_at: new Date().toISOString(),
        })
        .eq("id", eventId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      setSaveState("saved");
      setToast("Content saved");
      setTimeout(() => setSaveState("idle"), 2000);
    },
    onError: (err: Error) => {
      setToast(`Failed to save: ${err.message}`);
      setSaveState("idle");
    },
  });

  // Debounced auto-save for all fields
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSaveState("saving");
    debounceRef.current = setTimeout(() => {
      saveMutation.mutate({ content, name, eventType, eventDate, eventTime, venue, address });
    }, 800);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, name, eventType, eventDate, eventTime, venue, address]);

  const updateContent = (partial: Partial<EventContent>) =>
    setContent((prev) => ({ ...prev, ...partial }));

  // Build a live-updated event object for preview
  const previewEvent: UserEvent = {
    ...event,
    draft_content: content,
    draft_name: name,
    draft_event_type: eventType,
    draft_event_date: eventDate,
    draft_event_time: eventTime,
    draft_venue: venue,
    draft_address: address,
  };

  return (
    <>
      <SplitEditor preview={<HomePreview event={previewEvent} />}>
        <div className="space-y-6 max-w-xl mx-auto">
          <div>
            <h2 className="font-heading text-2xl text-[var(--color-text)]">Home Page Content</h2>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">
              {saveState === "saving" ? "Saving..." : saveState === "saved" ? "Saved" : "Edit your event details and story"}
            </p>
          </div>

          <Card className="p-5 space-y-5">
            <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">Event Details</h3>

            <FormField label="Event Name">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Our Wedding" />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Event Date">
                <DatePicker value={eventDate} onChange={setEventDate} />
              </FormField>
              <FormField label="Event Time">
                <TimePicker value={eventTime} onChange={setEventTime} />
              </FormField>
            </div>

            <FormField label="Venue">
              <Input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="The Grand Ballroom" />
            </FormField>

            <FormField label="Address">
              <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Main Street, City" />
            </FormField>
          </Card>

          <Card className="p-5 space-y-5">
            <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">Our Story</h3>

            <FormField label="Story Image">
              <ImageUpload
                value={content.story_image || ""}
                onChange={(url) => updateContent({ story_image: url })}
                eventId={eventId}
                aspectRatio="4/3"
              />
            </FormField>

            <FormField label="Story Text">
              <Textarea
                value={content.story || ""}
                onChange={(e) => updateContent({ story: e.target.value })}
                placeholder="Our journey began with a simple hello..."
                rows={4}
              />
            </FormField>
          </Card>

          <Card className="p-5 space-y-5">
            <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">Invitation</h3>

            <FormField label="Invitation Title">
              <Input
                value={content.invitation_title || ""}
                onChange={(e) => updateContent({ invitation_title: e.target.value })}
                placeholder="You're Invited"
              />
            </FormField>

            <FormField label="Invitation Subtitle">
              <Input
                value={content.invitation_subtitle || ""}
                onChange={(e) => updateContent({ invitation_subtitle: e.target.value })}
                placeholder="We would be honoured by your presence"
              />
            </FormField>

            <FormField label="Invitation Body">
              <Textarea
                value={content.invitation_body || ""}
                onChange={(e) => updateContent({ invitation_body: e.target.value })}
                placeholder="As we celebrate this sacred union..."
                rows={4}
              />
            </FormField>

            <FormField label="RSVP Button Text">
              <Input
                value={content.rsvp_button_text || ""}
                onChange={(e) => updateContent({ rsvp_button_text: e.target.value })}
                placeholder="RSVP"
              />
            </FormField>
          </Card>
        </div>
      </SplitEditor>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </>
  );
}

export default HomeEditorPage;
