import { useState, useEffect, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventContent } from "../../lib/supabase";
import { Card, FormField } from "../../components/ui";
import { Input, Textarea } from "../../components/ui/Input";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { HomePreview } from "../../components/preview/PreviewRenderers";
import { Toast } from "../../components/ui";

interface OutletContext { event: UserEvent; }

export default function HomeEditorPage() {
  const { event } = useOutletContext<OutletContext>();
  const queryClient = useQueryClient();
  const [content, setContent] = useState<EventContent>(
    (event.draft_content || event.content || {}) as EventContent
  );
  const [details, setDetails] = useState({
    name: event.draft_name || event.name || "",
    event_date: event.draft_event_date || event.event_date || "",
    event_time: event.draft_event_time || event.event_time || "",
    venue: event.draft_venue || event.venue || "",
    address: event.draft_address || event.address || "",
  });
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setContent((event.draft_content || event.content || {}) as EventContent);
    setDetails({
      name: event.draft_name || event.name || "",
      event_date: event.draft_event_date || event.event_date || "",
      event_time: event.draft_event_time || event.event_time || "",
      venue: event.draft_venue || event.venue || "",
      address: event.draft_address || event.address || "",
    });
  }, [event]);

  const saveMutation = useMutation({
    mutationFn: async (payload: { content: EventContent; details: typeof details }) => {
      const { error } = await supabase
        .from("user_events")
        .update({
          draft_content: payload.content,
          draft_name: payload.details.name,
          draft_event_date: payload.details.event_date || null,
          draft_event_time: payload.details.event_time || null,
          draft_venue: payload.details.venue,
          draft_address: payload.details.address,
          updated_at: new Date().toISOString(),
        })
        .eq("id", event.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", event.id] });
      setToast({ msg: "Content saved", type: "success" });
    },
    onError: (err: Error) => {
      setToast({ msg: `Save failed: ${err.message}`, type: "error" });
    },
  });

  const updateContent = (partial: Partial<EventContent>) => {
    const newContent = { ...content, ...partial };
    setContent(newContent);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      saveMutation.mutate({ content: newContent, details });
    }, 600);
  };

  const updateDetails = (partial: Partial<typeof details>) => {
    const newDetails = { ...details, ...partial };
    setDetails(newDetails);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      saveMutation.mutate({ content, details: newDetails });
    }, 600);
  };

  const previewEvent: UserEvent = {
    ...event,
    draft_content: content,
    draft_name: details.name,
    draft_event_date: details.event_date,
    draft_event_time: details.event_time,
    draft_venue: details.venue,
    draft_address: details.address,
  };

  return (
    <>
      <SplitEditor preview={<HomePreview event={previewEvent} />}>
        <div className="space-y-6">
          <div>
            <h2 className="font-heading text-2xl text-gray-900">Home Page Content</h2>
            <p className="text-sm text-gray-500 mt-1">Edit the story, invitation text, and event details.</p>
          </div>

          <Card className="p-5 space-y-5">
            <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500">Event Details</h3>
            <FormField label="Event Name">
              <Input
                value={details.name}
                onChange={(e) => updateDetails({ name: e.target.value })}
                placeholder="John & Jane's Wedding"
              />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Event Date">
                <Input
                  type="date"
                  value={details.event_date}
                  onChange={(e) => updateDetails({ event_date: e.target.value })}
                />
              </FormField>
              <FormField label="Event Time">
                <Input
                  type="time"
                  value={details.event_time}
                  onChange={(e) => updateDetails({ event_time: e.target.value })}
                />
              </FormField>
            </div>
            <FormField label="Venue">
              <Input
                value={details.venue}
                onChange={(e) => updateDetails({ venue: e.target.value })}
                placeholder="The Grand Ballroom"
              />
            </FormField>
            <FormField label="Address">
              <Input
                value={details.address}
                onChange={(e) => updateDetails({ address: e.target.value })}
                placeholder="123 Main St, City, State"
              />
            </FormField>
          </Card>

          <Card className="p-5 space-y-5">
            <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500">Our Story</h3>
            <FormField label="Story Text">
              <Textarea
                value={content.story || ""}
                onChange={(e) => updateContent({ story: e.target.value })}
                placeholder="Our journey began with a simple hello..."
                className="min-h-[120px]"
              />
            </FormField>
            <FormField label="Story Image">
              <ImageUpload
                value={content.story_image || ""}
                onChange={(url) => updateContent({ story_image: url })}
                eventId={event.id}
                label="Story Image (optional)"
              />
            </FormField>
          </Card>

          <Card className="p-5 space-y-5">
            <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500">Invitation</h3>
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
                className="min-h-[120px]"
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
      {toast && (
        <Toast
          message={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
