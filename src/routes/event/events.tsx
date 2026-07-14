import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  supabase,
  type UserEvent,
  type SubEvent,
  type GuestGroup,
  type EventGuest,
  type SubEventGroupAssignment,
  type GuestInvitationOverride,
} from "../../lib/supabase";
import { Input, Textarea, Select } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { DatePicker } from "../../components/ui/DatePicker";
import { TimePicker } from "../../components/ui/TimePicker";
import {
  Card, Modal, EmptyState, LoadingSpinner, ErrorState, Badge, Toggle,
} from "../../components/ui";
import { formatDate, to12Hour } from "../../lib/utils";
import { InvitationManager } from "./invitation-manager";

interface SubEventForm {
  name: string; date: string; start_time: string; end_time: string;
  venue: string; address: string; description: string; dress_code: string;
  rsvp_enabled: boolean; display_order: number;
}

const emptyForm: SubEventForm = {
  name: "", date: "", start_time: "", end_time: "", venue: "", address: "",
  description: "", dress_code: "", rsvp_enabled: true, display_order: 0,
};

export default function EventsPage() {
  const { event, eventId } = useOutletContext<{ event: UserEvent; eventId: string }>();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<SubEvent | null>(null);
  const [form, setForm] = useState<SubEventForm>(emptyForm);
  const [expandedSub, setExpandedSub] = useState<string | null>(null);

  const { data: subEvents, isLoading, isError, error } = useQuery({
    queryKey: ["sub-events", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sub_events")
        .select("*")
        .eq("parent_event_id", eventId)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as SubEvent[];
    },
  });

  const { data: groups } = useQuery({
    queryKey: ["guest-groups", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guest_groups").select("*").eq("event_id", eventId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as GuestGroup[];
    },
  });

  const { data: guests } = useQuery({
    queryKey: ["event-guests", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_guests").select("*").eq("event_id", eventId)
        .order("name", { ascending: true });
      if (error) throw error;
      return data as EventGuest[];
    },
  });

  const { data: assignments } = useQuery({
    queryKey: ["sub-event-group-assignments", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sub_event_group_assignments")
        .select("*, sub_events!inner(parent_event_id)")
        .eq("sub_events.parent_event_id", eventId);
      if (error) throw error;
      return data as (SubEventGroupAssignment & { sub_events: { parent_event_id: string } })[];
    },
  });

  const { data: overrides } = useQuery({
    queryKey: ["guest-invitation-overrides", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guest_invitation_overrides")
        .select("*, sub_events!inner(parent_event_id)")
        .eq("sub_events.parent_event_id", eventId);
      if (error) throw error;
      return data as (GuestInvitationOverride & { sub_events: { parent_event_id: string } })[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("sub_events").insert({
        parent_event_id: eventId, wedding_id: eventId,
        name: form.name, date: form.date || null,
        start_time: form.start_time || null, end_time: form.end_time || null,
        venue: form.venue || null, address: form.address || null,
        description: form.description || null, dress_code: form.dress_code || null,
        rsvp_enabled: form.rsvp_enabled,
        display_order: form.display_order || (subEvents?.length ?? 0),
        order_index: form.display_order || (subEvents?.length ?? 0),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-events", eventId] });
      setShowModal(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("sub_events").update({
        name: form.name, date: form.date || null,
        start_time: form.start_time || null, end_time: form.end_time || null,
        venue: form.venue || null, address: form.address || null,
        description: form.description || null, dress_code: form.dress_code || null,
        rsvp_enabled: form.rsvp_enabled, display_order: form.display_order,
      }).eq("id", editing!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-events", eventId] });
      setShowModal(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sub_events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sub-events", eventId] }),
  });

  const toggleGroupAssignment = useMutation({
    mutationFn: async ({ subEventId, groupId }: { subEventId: string; groupId: string }) => {
      const existing = assignments?.find((a) => a.sub_event_id === subEventId && a.group_id === groupId);
      if (existing) {
        const { error } = await supabase.from("sub_event_group_assignments").delete().eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("sub_event_group_assignments")
          .insert({ sub_event_id: subEventId, group_id: groupId });
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sub-event-group-assignments", eventId] }),
  });

  const toggleGuestOverride = useMutation({
    mutationFn: async ({ subEventId, guestId, isInvited }: { subEventId: string; guestId: string; isInvited: boolean }) => {
      const existing = overrides?.find((o) => o.sub_event_id === subEventId && o.guest_id === guestId);
      if (existing) {
        const { error } = await supabase.from("guest_invitation_overrides")
          .update({ is_invited: isInvited }).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("guest_invitation_overrides")
          .insert({ sub_event_id: subEventId, guest_id: guestId, is_invited: isInvited });
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["guest-invitation-overrides", eventId] }),
  });

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm, display_order: subEvents?.length ?? 0 });
    setShowModal(true);
  }

  function openEdit(sub: SubEvent) {
    setEditing(sub);
    setForm({
      name: sub.name, date: sub.date ?? "", start_time: sub.start_time ?? "",
      end_time: sub.end_time ?? "", venue: sub.venue ?? "", address: sub.address ?? "",
      description: sub.description ?? "", dress_code: sub.dress_code ?? "",
      rsvp_enabled: sub.rsvp_enabled, display_order: sub.display_order,
    });
    setShowModal(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) updateMutation.mutate();
    else createMutation.mutate();
  }

  const saving = createMutation.isPending || updateMutation.isPending;
  const saveError = editing ? updateMutation.error : createMutation.error;

  function isGroupAssigned(subEventId: string, groupId: string): boolean {
    return !!assignments?.some((a) => a.sub_event_id === subEventId && a.group_id === groupId);
  }
  function getGuestOverride(subEventId: string, guestId: string): boolean | null {
    const o = overrides?.find((o) => o.sub_event_id === subEventId && o.guest_id === guestId);
    return o ? o.is_invited : null;
  }

  if (isLoading) return <div className="flex items-center justify-center py-20"><LoadingSpinner size="lg" /></div>;
  if (isError) return <div className="py-20"><ErrorState message={error?.message} /></div>;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-dash-text">Events</h2>
          <p className="mt-1 text-sm text-dash-muted">
            Manage individual events within {event.name} and control guest invitations.
          </p>
        </div>
        <Button onClick={openCreate}>Add Event</Button>
      </div>

      {subEvents && subEvents.length === 0 ? (
        <EmptyState title="No events yet"
          description="Add events like Ceremony, Reception, or Dinner to organize your celebration."
          action={<Button onClick={openCreate}>Add Event</Button>} />
      ) : (
        <div className="space-y-3">
          {subEvents?.map((sub) => (
            <Card key={sub.id} className="overflow-hidden">
              <div className="flex items-start justify-between p-4">
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <h3 className="text-base font-semibold text-dash-text">{sub.name}</h3>
                    {sub.rsvp_enabled && <Badge variant="success">RSVP</Badge>}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-dash-muted">
                    {sub.date && <span>{formatDate(sub.date)}</span>}
                    {sub.start_time && <span>{to12Hour(sub.start_time)}</span>}
                    {sub.venue && <span>📍 {sub.venue}</span>}
                  </div>
                  {sub.description && <p className="mt-2 text-sm text-dash-text">{sub.description}</p>}
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost"
                    onClick={() => setExpandedSub(expandedSub === sub.id ? null : sub.id)}>
                    {expandedSub === sub.id ? "Hide" : "Invitations"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => openEdit(sub)}>Edit</Button>
                  <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(sub.id)}>Delete</Button>
                </div>
              </div>
              {expandedSub === sub.id && (
                <div className="border-t border-dash-border bg-dash-bg/50 p-4">
                  <InvitationManager
                    subEventId={sub.id}
                    groups={groups ?? []}
                    guests={guests ?? []}
                    isGroupAssigned={isGroupAssigned}
                    getGuestOverride={getGuestOverride}
                    onToggleGroup={(groupId) =>
                      toggleGroupAssignment.mutate({ subEventId: sub.id, groupId })}
                    onToggleGuestOverride={(guestId, isInvited) =>
                      toggleGuestOverride.mutate({ subEventId: sub.id, guestId, isInvited })}
                  />
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)}
        title={editing ? "Edit Event" : "Add Event"} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Event Name" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Ceremony, Reception, Dinner" required autoFocus />
          <Textarea label="Description" value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Additional details about this event..." />
          <div className="grid grid-cols-2 gap-3">
            <DatePicker label="Date" value={form.date}
              onChange={(v) => setForm({ ...form, date: v })} />
            <Input label="Display Order" type="number" value={form.display_order} min={0}
              onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <TimePicker label="Start Time" value={form.start_time}
              onChange={(v) => setForm({ ...form, start_time: v })} />
            <TimePicker label="End Time" value={form.end_time}
              onChange={(v) => setForm({ ...form, end_time: v })} />
          </div>
          <Input label="Venue" value={form.venue}
            onChange={(e) => setForm({ ...form, venue: e.target.value })}
            placeholder="e.g. The Grand Ballroom" />
          <Input label="Address" value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="123 Main Street, City" />
          <Input label="Dress Code" value={form.dress_code}
            onChange={(e) => setForm({ ...form, dress_code: e.target.value })}
            placeholder="e.g. Black tie, Casual" />
          <Toggle checked={form.rsvp_enabled}
            onChange={(v) => setForm({ ...form, rsvp_enabled: v })}
            label="Enable RSVP for this event" />
          {saveError && (
            <p className="text-sm text-red-600">
              {saveError instanceof Error ? saveError.message : "Save failed."}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>{editing ? "Update" : "Add"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
