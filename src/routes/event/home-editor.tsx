import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { supabase, type UserEvent, type EventContent } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Card, FormField, Skeleton, ErrorState, Toast } from "../../components/ui";
import { Input, Textarea } from "../../components/ui/Input";
import { DatePicker } from "../../components/ui/DatePicker";
import { TimePicker } from "../../components/ui/TimePicker";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { HomePreview } from "../../components/preview/PreviewRenderers";

function HomeEditorPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const queryClient = useQueryClient();
  const [content, setContent] = useState<EventContent>({});
  const [draftName, setDraftName] = useState("");
  const [draftDate, setDraftDate] = useState<string | null>(null);
  const [draftTime, setDraftTime] = useState<string | null>(null);
  const [draftVenue, setDraftVenue] = useState("");
  const [draftAddress, setDraftAddress] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const { data: event, isLoading, isError, refetch } = useQuery<UserEvent>({
    queryKey: ["event", eventId],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_events").select("*").eq("id", eventId!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
  });

  useEffect(() => {
    if (event) {
      setContent(event.draft_content || event.content || {});
      setDraftName(event.draft_name || event.name || "");
      setDraftDate(event.draft_event_date || event.event_date || null);
      setDraftTime(event.draft_event_time || event.event_time || null);
      setDraftVenue(event.draft_venue || event.venue || "");
      setDraftAddress(event.draft_address || event.address || "");
    }
  }, [event]);

  const contentMutation = useMutation({
    mutationFn: async (newContent: EventContent) => {
      const { data, error } = await supabase
        .from("user_events")
        .update({ draft_content: newContent, updated_at: new Date().toISOString() })
        .eq("id", eventId!)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["event", eventId], data);
      setToast({ message: "Content saved", type: "success" });
    },
    onError: () => setToast({ message: "Failed to save content", type: "error" }),
  });

  const eventFieldMutation = useMutation({
    mutationFn: async (updates: Partial<UserEvent>) => {
      const { data, error } = await supabase
        .from("user_events")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", eventId!)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["event", eventId], data);
      setToast({ message: "Saved", type: "success" });
    },
    onError: () => setToast({ message: "Failed to save", type: "error" }),
  });

  const updateContentField = useCallback(
    <K extends keyof EventContent>(field: K, value: EventContent[K]) => {
      setContent((prev) => {
        const next = { ...prev, [field]: value };
        contentMutation.mutate(next);
        return next;
      });
    },
    [contentMutation],
  );

  const updateEventField = useCallback(
    (field: string, value: string | null) => {
      eventFieldMutation.mutate({ [field]: value } as Partial<UserEvent>);
    },
    [eventFieldMutation],
  );

  if (isLoading) {
    return (
      <div className="p-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid lg:grid-cols-2 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (isError || !event) {
    return <ErrorState message="Failed to load event" onRetry={refetch} />;
  }

  const previewEvent: UserEvent = {
    ...event,
    draft_content: content,
    draft_name: draftName,
    draft_event_date: draftDate,
    draft_event_time: draftTime,
    draft_venue: draftVenue,
    draft_address: draftAddress,
  };

  const saving = contentMutation.isPending || eventFieldMutation.isPending;

  return (
    <div>
      <div className="px-6 lg:px-8 py-6 border-b border-onyx/10">
        <h1 className="font-heading text-3xl text-onyx">Home &amp; Content</h1>
        <p className="mt-1 text-sm text-onyx/50">Edit the main event details and story content</p>
      </div>

      <SplitEditor preview={<HomePreview event={previewEvent} />}>
        <div className="space-y-6">
          {saving && (
            <div className="flex items-center gap-2 text-xs text-onyx/50 uppercase tracking-wider">
              <Save className="w-3.5 h-3.5 animate-pulse" /> Saving...
            </div>
          )}

          <Card className="p-5">
            <h2 className="font-heading text-xl text-onyx mb-4">Event Details</h2>
            <div className="space-y-4">
              <FormField label="Event Name">
                <Input
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  onBlur={() => updateEventField("draft_name", draftName)}
                  placeholder="Our Wedding"
                />
              </FormField>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Date">
                  <DatePicker
                    value={draftDate}
                    onChange={(v) => {
                      setDraftDate(v);
                      updateEventField("draft_event_date", v);
                    }}
                  />
                </FormField>
                <FormField label="Time">
                  <TimePicker
                    value={draftTime}
                    onChange={(v) => {
                      setDraftTime(v);
                      updateEventField("draft_event_time", v);
                    }}
                  />
                </FormField>
              </div>
              <FormField label="Venue">
                <Input
                  value={draftVenue}
                  onChange={(e) => setDraftVenue(e.target.value)}
                  onBlur={() => updateEventField("draft_venue", draftVenue)}
                  placeholder="The Grand Ballroom"
                />
              </FormField>
              <FormField label="Address">
                <Input
                  value={draftAddress}
                  onChange={(e) => setDraftAddress(e.target.value)}
                  onBlur={() => updateEventField("draft_address", draftAddress)}
                  placeholder="123 Main Street, City"
                />
              </FormField>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="font-heading text-xl text-onyx mb-4">Our Story</h2>
            <div className="space-y-4">
              <FormField label="Story Image">
                <ImageUpload
                  value={content.story_image || ""}
                  onChange={(url) => updateContentField("story_image", url)}
                  eventId={eventId}
                  label="Story Image"
                  aspectRatio="4/3"
                />
              </FormField>
              <FormField label="Story Text">
                <Textarea
                  value={content.story || ""}
                  onChange={(e) => updateContentField("story", e.target.value)}
                  placeholder="Share the story of your journey together..."
                  rows={5}
                />
              </FormField>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="font-heading text-xl text-onyx mb-4">Invitation</h2>
            <div className="space-y-4">
              <FormField label="Invitation Title">
                <Input
                  value={content.invitation_title || ""}
                  onChange={(e) => updateContentField("invitation_title", e.target.value)}
                  placeholder="You're Invited"
                />
              </FormField>
              <FormField label="Invitation Subtitle">
                <Input
                  value={content.invitation_subtitle || ""}
                  onChange={(e) => updateContentField("invitation_subtitle", e.target.value)}
                  placeholder="We would be honoured by your presence"
                />
              </FormField>
              <FormField label="Invitation Body">
                <Textarea
                  value={content.invitation_body || ""}
                  onChange={(e) => updateContentField("invitation_body", e.target.value)}
                  placeholder="As we celebrate this special occasion..."
                  rows={4}
                />
              </FormField>
              <FormField label="RSVP Button Text">
                <Input
                  value={content.rsvp_button_text || ""}
                  onChange={(e) => updateContentField("rsvp_button_text", e.target.value)}
                  placeholder="RSVP"
                />
              </FormField>
            </div>
          </Card>
        </div>
      </SplitEditor>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default HomeEditorPage;
