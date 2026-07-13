import { useState, useEffect, useMemo } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, UserEvent, EventContent } from "../../lib/supabase";
import { DEFAULT_CONTENT } from "../../lib/theme";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { HomePreview } from "../../components/preview/PreviewRenderers";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";
import { FormField, Toast } from "../../components/ui/index";
import { DatePicker } from "../../components/ui/DatePicker";
import { TimePicker } from "../../components/ui/TimePicker";
import { debounce } from "../../lib/utils";
import { Loader2 } from "lucide-react";

export default function HomeEditor() {
  const { event } = useOutletContext<{ event: UserEvent | null }>();
  const { eventId } = useParams<{ eventId: string }>();
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [content, setContent] = useState<EventContent>({ ...DEFAULT_CONTENT, ...(event?.draft_content || {}) });
  const [date, setDate] = useState<string | null>(event?.draft_event_date || null);
  const [time, setTime] = useState<string | null>(event?.draft_event_time || null);
  const [venue, setVenue] = useState<string>(event?.draft_venue || "");
  const [address, setAddress] = useState<string>(event?.draft_address || "");

  useEffect(() => {
    if (event) {
      setContent({ ...DEFAULT_CONTENT, ...(event.draft_content || {}) });
      setDate(event.draft_event_date || null);
      setTime(event.draft_event_time || null);
      setVenue(event.draft_venue || "");
      setAddress(event.draft_address || "");
    }
  }, [event]);

  const previewKey = useMemo(() => JSON.stringify({ content, date, time, venue, address }), [content, date, time, venue, address]);

  const debouncedSave = useMemo(
    () =>
      debounce(async (data: { content: EventContent; date: string | null; time: string | null; venue: string; address: string }) => {
        if (!eventId) return;
        setSaving(true);
        const { error } = await supabase
          .from("user_events")
          .update({
            draft_content: data.content,
            draft_event_date: data.date,
            draft_event_time: data.time,
            draft_venue: data.venue || null,
            draft_address: data.address || null,
          })
          .eq("id", eventId);
        setSaving(false);
        if (error) {
          setToast("Failed to save");
          setTimeout(() => setToast(null), 3000);
        }
        queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      }, 800),
    [eventId, queryClient]
  );

  useEffect(() => {
    if (!event) return;
    debouncedSave({ content, date, time, venue, address });
  }, [content, date, time, venue, address, event, debouncedSave]);

  const saveMutation = useMutation<void, Error>({
    mutationFn: async () => {
      if (!eventId) return;
      const { error } = await supabase
        .from("user_events")
        .update({
          draft_content: content,
          draft_event_date: date,
          draft_event_time: time,
          draft_venue: venue || null,
          draft_address: address || null,
        })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      setToast("Saved");
      setTimeout(() => setToast(null), 3000);
    },
    onError: () => {
      setToast("Failed to save");
      setTimeout(() => setToast(null), 3000);
    },
  });

  if (!event) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  const previewEvent = { ...event, draft_event_date: date, draft_event_time: time, draft_venue: venue, draft_address: address };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Home Page</h1>
          <p className="text-sm text-gray-500 mt-0.5">Story, invitation, and event details</p>
        </div>
        <div className="flex items-center gap-3">
          {saving && (
            <span className="flex items-center gap-1.5 text-xs text-gray-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
            </span>
          )}
          <Button size="sm" onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
            Save
          </Button>
        </div>
      </div>

      <SplitEditor title="Home Page Content" preview={<HomePreview event={previewEvent} theme={event.draft_theme} content={content} />} previewKey={previewKey}>
        <div className="space-y-5">
          <div className="pt-2 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Event Details</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <DatePicker value={date} onChange={setDate} label="Event Date" />
                <TimePicker value={time} onChange={setTime} label="Event Time" />
              </div>
              <FormField label="Venue">
                <Input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="e.g. Grand Ballroom" />
              </FormField>
              <FormField label="Address">
                <Textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Full venue address" rows={2} />
              </FormField>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Our Story</h3>
            <div className="space-y-4">
              <FormField label="Story">
                <Textarea value={content.story} onChange={(e) => setContent({ ...content, story: e.target.value })} rows={5} placeholder="Share your story..." />
              </FormField>
              <FormField label="Story Image">
                <ImageUpload value={content.story_image} onChange={(url) => setContent({ ...content, story_image: url })} eventId={eventId} />
              </FormField>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Invitation</h3>
            <div className="space-y-4">
              <FormField label="Invitation Title">
                <Input value={content.invitation_title} onChange={(e) => setContent({ ...content, invitation_title: e.target.value })} placeholder="e.g. Our Wedding" />
              </FormField>
              <FormField label="Invitation Subtitle">
                <Input value={content.invitation_subtitle} onChange={(e) => setContent({ ...content, invitation_subtitle: e.target.value })} placeholder="e.g. We invite you to celebrate" />
              </FormField>
              <FormField label="Invitation Body">
                <Textarea value={content.invitation_body} onChange={(e) => setContent({ ...content, invitation_body: e.target.value })} rows={4} placeholder="Main invitation message" />
              </FormField>
              <FormField label="Invitation Text">
                <Textarea value={content.invitation_text} onChange={(e) => setContent({ ...content, invitation_text: e.target.value })} rows={2} placeholder="Additional text" />
              </FormField>
              <FormField label="RSVP Button Text">
                <Input value={content.rsvp_button_text} onChange={(e) => setContent({ ...content, rsvp_button_text: e.target.value })} placeholder="RSVP Now" />
              </FormField>
            </div>
          </div>
        </div>
      </SplitEditor>

      {toast && <Toast message={toast} type={toast.includes("Failed") ? "error" : "success"} onClose={() => setToast(null)} />}
    </div>
  );
}
