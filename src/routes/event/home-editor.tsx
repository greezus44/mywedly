import { useState, useEffect, useCallback } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventContent } from "../../lib/supabase";
import { debounce } from "../../lib/utils";
import { Button } from "../../components/ui/Button";
import { Card, FormField, Toast } from "../../components/ui";
import { Input, Textarea } from "../../components/ui/Input";
import { DatePicker } from "../../components/ui/DatePicker";
import { TimePicker } from "../../components/ui/TimePicker";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { HomePreview } from "../../components/preview/PreviewRenderers";
import { Save } from "lucide-react";

export default function HomeEditorPage() {
  const { eventId } = useParams();
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<string | null>(null);

  const initialContent: EventContent =
    (event.draft_content || event.content || {}) as EventContent;

  const [content, setContent] = useState<EventContent>({
    story: initialContent.story || "",
    story_image: initialContent.story_image || "",
    invitation_title: initialContent.invitation_title || "You're Invited",
    invitation_subtitle: initialContent.invitation_subtitle || "",
    invitation_body: initialContent.invitation_body || "",
    rsvp_button_text: initialContent.rsvp_button_text || "RSVP",
  });

  const [name, setName] = useState(event.draft_name || event.name || "");
  const [eventDate, setEventDate] = useState<string | null>(event.draft_event_date || event.event_date);
  const [eventTime, setEventTime] = useState<string | null>(event.draft_event_time || event.event_time);
  const [venue, setVenue] = useState(event.draft_venue || event.venue || "");
  const [address, setAddress] = useState(event.draft_address || event.address || "");

  const contentMutation = useMutation({
    mutationFn: async (newContent: EventContent) => {
      if (!eventId) return;
      const { error } = await supabase
        .from("user_events")
        .update({ draft_content: newContent, updated_at: new Date().toISOString() })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
    },
  });

  const detailsMutation = useMutation({
    mutationFn: async (details: {
      draft_name: string;
      draft_event_date: string | null;
      draft_event_time: string | null;
      draft_venue: string;
      draft_address: string;
    }) => {
      if (!eventId) return;
      const { error } = await supabase
        .from("user_events")
        .update({ ...details, updated_at: new Date().toISOString() })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      setToast("Content saved");
    },
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedContentSave = useCallback(
    debounce((newContent: EventContent) => contentMutation.mutate(newContent), 600),
    [contentMutation]
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedDetailsSave = useCallback(
    debounce(
      (details: {
        draft_name: string;
        draft_event_date: string | null;
        draft_event_time: string | null;
        draft_venue: string;
        draft_address: string;
      }) => detailsMutation.mutate(details),
      600
    ),
    [detailsMutation]
  );

  useEffect(() => {
    debouncedContentSave(content);
  }, [content, debouncedContentSave]);

  useEffect(() => {
    debouncedDetailsSave({ draft_name: name, draft_event_date: eventDate, draft_event_time: eventTime, draft_venue: venue, draft_address: address });
  }, [name, eventDate, eventTime, venue, address, debouncedDetailsSave]);

  const updateContent = <K extends keyof EventContent>(key: K, value: EventContent[K]) => {
    setContent((prev) => ({ ...prev, [key]: value }));
  };

  const previewEvent: UserEvent = {
    ...event,
    draft_content: content,
    draft_name: name,
    draft_event_date: eventDate,
    draft_event_time: eventTime,
    draft_venue: venue,
    draft_address: address,
  };

  return (
    <>
      <SplitEditor preview={<HomePreview event={previewEvent} />}>
        <div className="max-w-xl mx-auto space-y-6">
          <div>
            <h2 className="font-heading text-2xl text-[var(--color-text)] mb-1">Home & Content</h2>
            <p className="text-sm text-[var(--color-text-muted)]">
              Edit the main content of your event invitation.
            </p>
          </div>

          {/* Event Details */}
          <Card className="p-5 space-y-5">
            <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
              Event Details
            </h3>

            <FormField label="Event Name">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Our Wedding"
              />
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
              <Input
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="The Grand Ballroom"
              />
            </FormField>

            <FormField label="Address">
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Main Street, City"
              />
            </FormField>
          </Card>

          {/* Story Section */}
          <Card className="p-5 space-y-5">
            <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
              Our Story
            </h3>

            <FormField label="Story">
              <Textarea
                value={content.story || ""}
                onChange={(e) => updateContent("story", e.target.value)}
                placeholder="Tell your guests about your journey…"
                rows={5}
              />
            </FormField>

            <FormField label="Story Image">
              <ImageUpload
                value={content.story_image || ""}
                onChange={(url) => updateContent("story_image", url)}
                eventId={eventId}
                label="Story image"
                aspectRatio="4/3"
              />
            </FormField>
          </Card>

          {/* Invitation Section */}
          <Card className="p-5 space-y-5">
            <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
              Invitation
            </h3>

            <FormField label="Invitation Title">
              <Input
                value={content.invitation_title || ""}
                onChange={(e) => updateContent("invitation_title", e.target.value)}
                placeholder="You're Invited"
              />
            </FormField>

            <FormField label="Invitation Subtitle">
              <Input
                value={content.invitation_subtitle || ""}
                onChange={(e) => updateContent("invitation_subtitle", e.target.value)}
                placeholder="We would be honoured by your presence"
              />
            </FormField>

            <FormField label="Invitation Body">
              <Textarea
                value={content.invitation_body || ""}
                onChange={(e) => updateContent("invitation_body", e.target.value)}
                placeholder="As we celebrate this special occasion…"
                rows={4}
              />
            </FormField>

            <FormField label="RSVP Button Text">
              <Input
                value={content.rsvp_button_text || ""}
                onChange={(e) => updateContent("rsvp_button_text", e.target.value)}
                placeholder="RSVP"
              />
            </FormField>
          </Card>

          <div className="flex justify-end">
            <Button
              onClick={() => {
                contentMutation.mutate(content);
                detailsMutation.mutate({ draft_name: name, draft_event_date: eventDate, draft_event_time: eventTime, draft_venue: venue, draft_address: address });
              }}
              loading={contentMutation.isPending || detailsMutation.isPending}
            >
              <Save className="w-4 h-4" /> Save Changes
            </Button>
          </div>
        </div>
      </SplitEditor>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </>
  );
}
