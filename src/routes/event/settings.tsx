import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Loader2, Trash2, AlertCircle } from "lucide-react";
import { supabase, type UserEvent, EVENT_TYPES } from "../../lib/supabase";
import { slugify, isValidSlug } from "../../lib/theme";
import {
  Button,
  Card,
  Modal,
  FormField,
  Input,
  Select,
  Toast,
} from "../../components/ui";
import { DatePicker, TimePicker, DateTimePicker } from "../../components/ui";

export default function SettingsPage() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [showDelete, setShowDelete] = useState(false);

  // Form state
  const [name, setName] = useState(event.draft_name || "");
  const [eventType, setEventType] = useState(event.draft_event_type || EVENT_TYPES[0]);
  const [eventDate, setEventDate] = useState<string | null>(event.draft_event_date || null);
  const [eventTime, setEventTime] = useState<string | null>(event.draft_event_time || null);
  const [venue, setVenue] = useState(event.draft_venue || "");
  const [address, setAddress] = useState(event.draft_address || "");
  const [slug, setSlug] = useState(event.draft_slug || event.slug || "");
  const [slugError, setSlugError] = useState<string | null>(null);

  // RSVP deadline: stored as ISO, split into date + time for picker
  const rawDeadline = event.draft_rsvp_deadline || null;
  const [rsvpDate, setRsvpDate] = useState<string | null>(
    rawDeadline ? rawDeadline.substring(0, 10) : null
  );
  const [rsvpTime, setRsvpTime] = useState<string | null>(
    rawDeadline && rawDeadline.length >= 16 ? rawDeadline.substring(11, 16) : null
  );

  useEffect(() => {
    setName(event.draft_name || "");
    setEventType(event.draft_event_type || EVENT_TYPES[0]);
    setEventDate(event.draft_event_date || null);
    setEventTime(event.draft_event_time || null);
    setVenue(event.draft_venue || "");
    setAddress(event.draft_address || "");
    setSlug(event.draft_slug || event.slug || "");
    const dl = event.draft_rsvp_deadline;
    setRsvpDate(dl ? dl.substring(0, 10) : null);
    setRsvpTime(dl && dl.length >= 16 ? dl.substring(11, 16) : null);
  }, [event]);

  const handleSlugChange = (value: string) => {
    setSlug(value);
    if (value && !isValidSlug(value)) {
      setSlugError("Slug can only contain lowercase letters, numbers, and hyphens.");
    } else {
      setSlugError(null);
    }
  };

  const handleSlugBlur = () => {
    if (slug && !isValidSlug(slug)) {
      const autoSlug = slugify(slug);
      if (autoSlug && isValidSlug(autoSlug)) {
        setSlug(autoSlug);
        setSlugError(null);
      }
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      // Combine RSVP date + time into ISO for storage
      let rsvpDeadlineIso: string | null = null;
      if (rsvpDate) {
        rsvpDeadlineIso = `${rsvpDate}T${rsvpTime || "00:00"}:00`;
      }

      const { error } = await supabase
        .from("user_events")
        .update({
          draft_name: name,
          draft_event_type: eventType,
          draft_event_date: eventDate,
          draft_event_time: eventTime,
          draft_venue: venue,
          draft_address: address,
          draft_slug: slug || null,
          draft_rsvp_deadline: rsvpDeadlineIso,
        })
        .eq("id", event.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", event.id] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setToast({ message: "Settings saved", type: "success" });
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
    if (slug && !isValidSlug(slug)) {
      setToast({ message: "Please fix the slug before saving.", type: "error" });
      return;
    }
    saveMutation.mutate();
  };

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Edit your event's details and configuration
        </p>
      </div>

      <Card className="mb-6 p-5">
        <div className="flex flex-col gap-4">
          <FormField label="Event Name">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Event name"
            />
          </FormField>

          <FormField label="Event Type">
            <Select
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
            >
              {EVENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </Select>
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <DatePicker
              value={eventDate}
              onChange={(d) => setEventDate(d || null)}
              label="Event Date"
            />
            <TimePicker
              value={eventTime}
              onChange={(t) => setEventTime(t || null)}
              label="Event Time"
            />
          </div>

          <FormField label="Venue">
            <Input
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="Venue name"
            />
          </FormField>

          <FormField label="Address">
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Full address"
            />
          </FormField>

          <hr className="border-gray-100" />

          <FormField
            label="Event Slug"
            hint="Used in the public URL: /e/your-slug"
          >
            <Input
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              onBlur={handleSlugBlur}
              placeholder="my-event"
            />
          </FormField>
          {slugError && <p className="text-xs text-red-600">{slugError}</p>}

          <hr className="border-gray-100" />

          <DateTimePicker
            date={rsvpDate}
            time={rsvpTime}
            onChange={(d, t) => {
              setRsvpDate(d || null);
              setRsvpTime(t || null);
            }}
            label="RSVP Deadline"
            showTime={true}
            previewPrefix="RSVP closes"
          />

          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="mt-2"
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Save Settings"
            )}
          </Button>
        </div>
      </Card>

      {/* Danger zone */}
      <Card className="border-red-200 p-5">
        <h3 className="text-sm font-semibold text-red-700">Danger Zone</h3>
        <p className="mt-1 text-xs text-gray-500">
          Deleting an event is permanent and cannot be undone.
        </p>
        <Button
          variant="danger"
          size="sm"
          className="mt-3"
          onClick={() => setShowDelete(true)}
        >
          <Trash2 className="h-4 w-4" />
          Delete Event
        </Button>
      </Card>

      {/* Delete confirmation modal */}
      <Modal
        open={showDelete}
        onClose={() => setShowDelete(false)}
        title="Delete Event"
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3 rounded-md bg-red-50 p-4">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
            <div>
              <p className="text-sm font-medium text-red-900">
                Are you absolutely sure?
              </p>
              <p className="mt-1 text-sm text-red-700">
                This will permanently delete "{event.draft_name || event.name || "this event"}"
                and all associated data. This action cannot be undone.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowDelete(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting…
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
