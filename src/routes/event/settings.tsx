import { useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2 } from "lucide-react";
import { supabase, type UserEvent, EVENT_TYPES } from "../../lib/supabase";
import { slugify, isValidSlug } from "../../lib/theme";
import { Button } from "../../components/ui/Button";
import { Input, Select } from "../../components/ui/Input";
import {
  Card,
  Modal,
  FormField,
  Toast,
  type ToastType,
} from "../../components/ui";
import { DatePicker, TimePicker, DateTimePicker } from "../../components/ui";

export default function SettingsPage() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [showDelete, setShowDelete] = useState(false);

  const [name, setName] = useState(event.draft_name ?? event.name ?? "");
  const [eventType, setEventType] = useState(
    event.draft_event_type ?? event.event_type ?? EVENT_TYPES[0],
  );
  const [eventDate, setEventDate] = useState<string | null>(
    event.draft_event_date ?? event.event_date,
  );
  const [eventTime, setEventTime] = useState<string | null>(
    event.draft_event_time ?? event.event_time,
  );
  const [venue, setVenue] = useState(event.draft_venue ?? event.venue ?? "");
  const [address, setAddress] = useState(event.draft_address ?? event.address ?? "");
  const [slug, setSlug] = useState(event.draft_slug ?? event.slug ?? "");

  // RSVP deadline: stored as ISO string, split into date + time for the picker
  const deadlineIso = event.draft_rsvp_deadline ?? event.rsvp_deadline;
  const [rsvpDate, setRsvpDate] = useState<string | null>(
    deadlineIso ? deadlineIso.slice(0, 10) : null,
  );
  const [rsvpTime, setRsvpTime] = useState<string | null>(
    deadlineIso && deadlineIso.length >= 16 ? deadlineIso.slice(11, 16) : null,
  );

  const slugValid = !slug || isValidSlug(slug);

  const updateMutation = useMutation({
    mutationFn: async (updates: Record<string, unknown>) => {
      const { error } = await supabase
        .from("user_events")
        .update(updates)
        .eq("id", event.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", event.id] });
      setToast({ message: "Settings saved!", type: "success" });
    },
    onError: (err: Error) => {
      setToast({ message: err.message, type: "error" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("user_events")
        .delete()
        .eq("id", event.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      navigate("/dashboard");
    },
    onError: (err: Error) => {
      setToast({ message: err.message, type: "error" });
    },
  });

  const handleSave = () => {
    if (!slugValid) {
      setToast({
        message: "Invalid slug. Use only lowercase letters, numbers, and hyphens.",
        type: "error",
      });
      return;
    }

    // Combine RSVP deadline date + time into ISO string
    let rsvpDeadline: string | null = null;
    if (rsvpDate) {
      rsvpDeadline = `${rsvpDate}T${rsvpTime || "00:00"}:00`;
    }

    updateMutation.mutate({
      draft_name: name,
      draft_event_type: eventType,
      draft_event_date: eventDate,
      draft_event_time: eventTime,
      draft_venue: venue,
      draft_address: address,
      draft_slug: slug,
      draft_rsvp_deadline: rsvpDeadline,
    });
  };

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="mx-auto max-w-2xl space-y-6 p-4">
        <div>
          <h2 className="font-heading text-xl font-bold text-gray-900">
            Settings
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Edit your event details and configuration.
          </p>
        </div>

        {/* Event details */}
        <Card className="space-y-4 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
            Event Details
          </h3>
          <FormField label="Event name">
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </FormField>
          <FormField label="Event type">
            <Select value={eventType} onChange={(e) => setEventType(e.target.value)}>
              {EVENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </FormField>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DatePicker
              label="Event date"
              value={eventDate}
              onChange={setEventDate}
            />
            <TimePicker
              label="Event time"
              value={eventTime}
              onChange={setEventTime}
            />
          </div>
          <FormField label="Venue">
            <Input value={venue} onChange={(e) => setVenue(e.target.value)} />
          </FormField>
          <FormField label="Address">
            <Input value={address} onChange={(e) => setAddress(e.target.value)} />
          </FormField>
        </Card>

        {/* URL slug */}
        <Card className="space-y-4 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
            URL
          </h3>
          <FormField
            label="Custom slug"
            hint="This will be used in your event link: /e/your-slug"
          >
            <Input
              value={slug}
              onChange={(e) => setSlug(slugify(e.target.value))}
              placeholder="my-event"
            />
          </FormField>
          {!slugValid && (
            <p className="text-xs text-red-600">
              Slug can only contain lowercase letters, numbers, and hyphens.
            </p>
          )}
        </Card>

        {/* RSVP deadline */}
        <Card className="space-y-4 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
            RSVP Deadline
          </h3>
          <DateTimePicker
            date={rsvpDate}
            time={rsvpTime}
            onChange={(d, t) => {
              setRsvpDate(d);
              setRsvpTime(t);
            }}
            label="RSVP closes"
            showTime={true}
            previewPrefix="RSVP closes"
          />
          <p className="text-xs text-gray-400">
            Guests won't be able to RSVP after this date and time.
          </p>
        </Card>

        {/* Save button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Saving...
              </>
            ) : (
              "Save Settings"
            )}
          </Button>
        </div>

        {/* Danger zone */}
        <Card className="space-y-4 border-red-200 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-red-600">
            Danger Zone
          </h3>
          <p className="text-sm text-gray-600">
            Permanently delete this event and all associated data. This cannot be
            undone.
          </p>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setShowDelete(true)}
          >
            <Trash2 className="h-4 w-4" /> Delete Event
          </Button>
        </Card>
      </div>

      {/* Delete confirmation modal */}
      <Modal open={showDelete} onClose={() => setShowDelete(false)}>
        <div className="p-6">
          <h2 className="font-heading text-xl font-bold text-gray-900">
            Delete Event
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Are you sure you want to delete "{event.draft_name ?? event.name}"?
            This action cannot be undone and all guest data, RSVPs, and event
            content will be permanently removed.
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => setShowDelete(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Deleting...
                </>
              ) : (
                "Delete Permanently"
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
