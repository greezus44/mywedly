import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2 } from "lucide-react";
import { supabase, type UserEvent, EVENT_TYPES } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input, Select } from "../../components/ui/Input";
import { Card, FormField, Modal, useToast } from "../../components/ui";
import { slugify, isValidSlug } from "../../lib/theme";
import { toDatetimeLocal, fromDatetimeLocal } from "../../lib/utils";

export default function SettingsPage() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: event.draft_name ?? event.name ?? "",
    event_type: event.draft_event_type ?? event.event_type ?? EVENT_TYPES[0],
    event_date: event.draft_event_date ?? event.event_date ?? "",
    event_time: event.draft_event_time ?? event.event_time ?? "",
    venue: event.draft_venue ?? event.venue ?? "",
    address: event.draft_address ?? event.address ?? "",
    slug: event.draft_slug ?? event.slug ?? "",
    rsvp_deadline: toDatetimeLocal(event.draft_rsvp_deadline ?? event.rsvp_deadline),
  });
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    setForm({
      name: event.draft_name ?? event.name ?? "",
      event_type: event.draft_event_type ?? event.event_type ?? EVENT_TYPES[0],
      event_date: event.draft_event_date ?? event.event_date ?? "",
      event_time: event.draft_event_time ?? event.event_time ?? "",
      venue: event.draft_venue ?? event.venue ?? "",
      address: event.draft_address ?? event.address ?? "",
      slug: event.draft_slug ?? event.slug ?? "",
      rsvp_deadline: toDatetimeLocal(event.draft_rsvp_deadline ?? event.rsvp_deadline),
    });
  }, [event]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (form.slug && !isValidSlug(form.slug)) throw new Error("Invalid slug format");
      const { error } = await supabase
        .from("user_events")
        .update({
          draft_name: form.name || null,
          draft_event_type: form.event_type,
          draft_event_date: form.event_date || null,
          draft_event_time: form.event_time || null,
          draft_venue: form.venue || null,
          draft_address: form.address || null,
          draft_slug: form.slug || null,
          draft_rsvp_deadline: form.rsvp_deadline ? fromDatetimeLocal(form.rsvp_deadline) : null,
        })
        .eq("id", event.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", event.id] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast("Settings saved", "success");
    },
    onError: (err: Error) => toast(err.message, "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("user_events").delete().eq("id", event.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast("Event deleted", "success");
      navigate("/dashboard");
    },
    onError: (err: Error) => toast(err.message, "error"),
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
        <p className="text-sm text-gray-500">Edit your event details.</p>
      </div>

      <Card className="p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate();
          }}
          className="flex flex-col gap-4"
        >
          <FormField label="Event name">
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Event name"
            />
          </FormField>
          <FormField label="Event type">
            <Select
              value={form.event_type}
              onChange={(e) => setForm((f) => ({ ...f, event_type: e.target.value }))}
            >
              {EVENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Date">
              <Input
                type="date"
                value={form.event_date}
                onChange={(e) => setForm((f) => ({ ...f, event_date: e.target.value }))}
              />
            </FormField>
            <FormField label="Time">
              <Input
                type="time"
                value={form.event_time}
                onChange={(e) => setForm((f) => ({ ...f, event_time: e.target.value }))}
              />
            </FormField>
          </div>
          <FormField label="Venue">
            <Input
              value={form.venue}
              onChange={(e) => setForm((f) => ({ ...f, venue: e.target.value }))}
              placeholder="Venue name"
            />
          </FormField>
          <FormField label="Address">
            <Input
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              placeholder="Address"
            />
          </FormField>
          <FormField
            label="Slug"
            hint="Lowercase letters, numbers, and hyphens (2-50 chars)"
            error={form.slug && !isValidSlug(form.slug) ? "Invalid slug format" : undefined}
          >
            <Input
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))}
              placeholder="my-event"
            />
          </FormField>
          <FormField label="RSVP deadline">
            <Input
              type="datetime-local"
              value={form.rsvp_deadline}
              onChange={(e) => setForm((f) => ({ ...f, rsvp_deadline: e.target.value }))}
            />
          </FormField>
          <div className="flex justify-end">
            <Button type="submit" loading={saveMutation.isPending}>
              Save settings
            </Button>
          </div>
        </form>
      </Card>

      <Card className="border-red-200 p-4">
        <h3 className="text-sm font-semibold text-red-600">Danger zone</h3>
        <p className="mt-1 text-sm text-gray-500">Permanently delete this event and all its data.</p>
        <div className="mt-3">
          <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="h-4 w-4" />
            Delete event
          </Button>
        </div>
      </Card>

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete event">
        <p className="text-sm text-gray-600">
          Are you sure you want to delete <strong>{event.draft_name || event.name}</strong>? This action
          cannot be undone and all guest data, RSVPs, and messages will be lost.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => setDeleteOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" loading={deleteMutation.isPending} onClick={() => deleteMutation.mutate()}>
            Delete permanently
          </Button>
        </div>
      </Modal>
    </div>
  );
}
