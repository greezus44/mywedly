import React, { useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input, Select, Card, FormField, Modal } from "../../components/ui";
import { DatePicker } from "../../components/ui/DatePicker";
import { TimePicker } from "../../components/ui/TimePicker";
import { DateTimePicker } from "../../components/ui/DateTimePicker";
import { EVENT_TYPES } from "../../lib/supabase";
import { Trash2 } from "lucide-react";

export default function SettingsEditor() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showDelete, setShowDelete] = useState(false);
  const [name, setName] = useState(event.draft_name || event.name);
  const [eventType, setEventType] = useState(event.draft_event_type || event.event_type);
  const [date, setDate] = useState(event.draft_event_date || event.event_date);
  const [time, setTime] = useState(event.draft_event_time || event.event_time);
  const [venue, setVenue] = useState(event.draft_venue || event.venue || "");
  const [address, setAddress] = useState(event.draft_address || event.address || "");

  const rsvpDeadlineStr = event.draft_rsvp_deadline || event.rsvp_deadline;
  const [rsvpDate, setRsvpDate] = useState<string | null>(rsvpDeadlineStr ? rsvpDeadlineStr.slice(0, 10) : null);
  const [rsvpTime, setRsvpTime] = useState<string | null>(rsvpDeadlineStr ? rsvpDeadlineStr.slice(11, 16) : null);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const rsvpDeadline = rsvpDate ? `${rsvpDate}T${rsvpTime || "23:59"}:00` : null;
      const { error } = await supabase.from("user_events").update({
        draft_name: name,
        draft_event_type: eventType,
        draft_event_date: date,
        draft_event_time: time,
        draft_venue: venue,
        draft_address: address,
        draft_rsvp_deadline: rsvpDeadline,
      }).eq("id", event.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["event", event.id] }),
    onError: (err: any) => alert("Failed to save: " + (err.message || "Unknown error")),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("user_events").delete().eq("id", event.id);
      if (error) throw error;
    },
    onSuccess: () => navigate("/dashboard"),
    onError: (err: any) => alert("Failed to delete event: " + (err.message || "Unknown error")),
  });

  return (
    <div>
      <h2 className="text-xl font-semibold text-dash-text mb-6">Settings</h2>
      <div className="max-w-2xl space-y-6">
        <Card className="p-4 space-y-4">
          <FormField label="Event Name"><Input value={name} onChange={(e) => setName(e.target.value)} /></FormField>
          <FormField label="Event Type">
            <Select value={eventType} onChange={(e) => setEventType(e.target.value)}>
              {EVENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </Select>
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Date"><DatePicker value={date} onChange={(d) => setDate(d)} /></FormField>
            <FormField label="Time"><TimePicker value={time} onChange={(t) => setTime(t)} /></FormField>
          </div>
          <FormField label="Venue"><Input value={venue} onChange={(e) => setVenue(e.target.value)} /></FormField>
          <FormField label="Address"><Input value={address} onChange={(e) => setAddress(e.target.value)} /></FormField>
          <DateTimePicker date={rsvpDate} time={rsvpTime} onChange={(d, t) => { setRsvpDate(d); setRsvpTime(t); }} label="RSVP Deadline" showTime={true} previewPrefix="RSVP closes" />
          <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>Save Changes</Button>
        </Card>
        <Card className="p-4 border-red-200">
          <h3 className="font-medium text-red-600 mb-2">Danger Zone</h3>
          <Button variant="danger" onClick={() => setShowDelete(true)}><Trash2 className="w-4 h-4" /> Delete Event</Button>
        </Card>
      </div>
      <Modal open={showDelete} onClose={() => setShowDelete(false)} title="Delete Event">
        <p className="text-sm text-dash-text mb-4">Are you sure you want to delete "{event.name}"? This action cannot be undone.</p>
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" onClick={() => setShowDelete(false)}>Cancel</Button>
          <Button variant="danger" onClick={() => deleteMutation.mutate()} loading={deleteMutation.isPending}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}
