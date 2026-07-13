import React, { useEffect, useState, useRef } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { Input, Select } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Card, FormField, Modal, LoadingSpinner } from "../../components/ui";

const EVENT_TYPES = [
  { value: "wedding", label: "Wedding" },
  { value: "conference", label: "Conference" },
  { value: "birthday", label: "Birthday" },
  { value: "festival", label: "Festival" },
  { value: "corporate", label: "Corporate Event" },
  { value: "charity", label: "Charity Event" },
  { value: "graduation", label: "Graduation" },
  { value: "reunion", label: "Family Reunion" },
  { value: "other", label: "Other" },
];

export default function Settings() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [eventType, setEventType] = useState("other");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [venue, setVenue] = useState("");
  const [address, setAddress] = useState("");
  const [saved, setSaved] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setName(event.draft_name ?? event.name ?? "");
    setEventType(event.draft_event_type ?? event.event_type ?? "other");
    setEventDate(event.draft_event_date ?? event.event_date ?? "");
    setEventTime(event.draft_event_time ?? event.event_time ?? "");
    setVenue(event.draft_venue ?? event.venue ?? "");
    setAddress(event.draft_address ?? event.address ?? "");
  }, [event.id]);

  const saveMutation = useMutation({
    mutationFn: async (payload: Record<string, any>) => {
      const { error } = await supabase
        .from("user_events")
        .update(payload)
        .eq("id", event.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", event.id] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      saveMutation.mutate({
        draft_name: name,
        draft_event_type: eventType,
        draft_event_date: eventDate || null,
        draft_event_time: eventTime || null,
        draft_venue: venue,
        draft_address: address,
      });
    }, 800);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, eventType, eventDate, eventTime, venue, address]);

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("user_events").delete().eq("id", event.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-events"] });
      navigate("/dashboard");
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-dash-text">Website Settings</h2>
        {saved && <span className="text-sm text-green-600">✓ Saved</span>}
        {saveMutation.isPending && <LoadingSpinner className="h-4 w-4" />}
      </div>

      <Card className="p-5 space-y-4">
        <Input label="Website Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Event name" />
        <Select label="Event Type" value={eventType} onChange={(e) => setEventType(e.target.value)}>
          {EVENT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </Select>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Event Date" type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
          <Input label="Event Time" type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)} />
        </div>
        <Input label="Venue" value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="Venue name" />
        <FormField label="Address">
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Full venue address"
            rows={2}
            className="w-full rounded-lg border border-dash-border bg-dash-surface px-3.5 py-2.5 text-sm text-dash-text placeholder:text-dash-muted/50 focus:border-dash-primary focus:outline-none focus:ring-1 focus:ring-dash-primary transition-colors resize-y"
          />
        </FormField>
      </Card>

      <Card className="p-5 border-red-200">
        <h3 className="text-sm font-semibold text-red-600 mb-2">Danger Zone</h3>
        <p className="text-sm text-dash-muted mb-4">
          Deleting this website will permanently remove all associated data, including guests, RSVPs, and pages.
        </p>
        <Button variant="danger" onClick={() => setShowDelete(true)}>Delete Website</Button>
      </Card>

      <Modal open={showDelete} onClose={() => setShowDelete(false)} title="Delete Website">
        <div className="space-y-4">
          <p className="text-sm text-dash-text">
            This action cannot be undone. Type <span className="font-mono font-semibold">{event.name}</span> to confirm.
          </p>
          <Input
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder={event.name}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowDelete(false)}>Cancel</Button>
            <Button
              variant="danger"
              loading={deleteMutation.isPending}
              disabled={deleteConfirm !== event.name}
              onClick={() => deleteMutation.mutate()}
            >
              Delete Permanently
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
