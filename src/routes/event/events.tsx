import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type SubEvent, type GuestGroup, type EventGuest } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input, Select } from "../../components/ui/Input";
import { Card, Modal, EmptyState, LoadingSpinner, ErrorState, Badge, Toggle } from "../../components/ui";
import { DatePicker, TimePicker } from "../../components/ui";
import { formatDate, formatTime12, cn } from "../../lib/utils";

interface SubEventForm {
  name: string;
  date: string | null;
  start_time: string | null;
  end_time: string | null;
  venue: string;
  address: string;
  description: string;
  dress_code: string;
  rsvp_enabled: boolean;
}

const EMPTY_FORM: SubEventForm = {
  name: "",
  date: null,
  start_time: null,
  end_time: null,
  venue: "",
  address: "",
  description: "",
  dress_code: "",
  rsvp_enabled: true,
};

export default function Events() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<SubEvent | null>(null);
  const [form, setForm] = useState<SubEventForm>(EMPTY_FORM);
  const [managingSubEvent, setManagingSubEvent] = useState<SubEvent | null>(null);

  const { data: subEvents, isLoading, isError, refetch } = useQuery({
    queryKey: ["sub-events", event.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sub_events")
        .select("*")
        .eq("parent_event_id", event.id)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as SubEvent[];
    },
  });

  const { data: groups } = useQuery({
    queryKey: ["groups", event.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guest_groups")
        .select("*")
        .eq("event_id", event.id)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as GuestGroup[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("sub_events").insert({
        parent_event_id: event.id,
        wedding_id: event.id,
        name: form.name,
        date: form.date,
        start_time: form.start_time,
        end_time: form.end_time,
        venue: form.venue || null,
        address: form.address || null,
        description: form.description || null,
        dress_code: form.dress_code || null,
        rsvp_enabled: form.rsvp_enabled,
        order_index: subEvents?.length ?? 0,
        display_order: subEvents?.length ?? 0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-events", event.id] });
      setShowModal(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editing) return;
      const { error } = await supabase
        .from("sub_events")
        .update({
          name: form.name,
          date: form.date,
          start_time: form.start_time,
          end_time: form.end_time,
          venue: form.venue || null,
          address: form.address || null,
          description: form.description || null,
          dress_code: form.dress_code || null,
          rsvp_enabled: form.rsvp_enabled,
        })
        .eq("id", editing.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-events", event.id] });
      setShowModal(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sub_events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-events", event.id] });
    },
  });

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (se: SubEvent) => {
    setEditing(se);
    setForm({
      name: se.name,
      date: se.date,
      start_time: se.start_time,
      end_time: se.end_time,
      venue: se.venue ?? "",
      address: se.address ?? "",
      description: se.description ?? "",
      dress_code: se.dress_code ?? "",
      rsvp_enabled: se.rsvp_enabled,
    });
    setShowModal(true);
  };

  const update = (patch: Partial<SubEventForm>) => setForm({ ...form, ...patch });

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-dash-text">Events</h2>
          <p className="mt-1 text-sm text-dash-muted">Manage individual events within your celebration.</p>
        </div>
        <Button onClick={openCreate}>+ Add Event</Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><LoadingSpinner /></div>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !subEvents || subEvents.length === 0 ? (
        <EmptyState
          title="No events yet"
          description="Add events like Ceremony, Reception, Dinner, etc."
          action={<Button onClick={openCreate}>+ Add Event</Button>}
        />
      ) : (
        <div className="space-y-3">
          {subEvents.map((se) => (
            <Card key={se.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-dash-text">{se.name}</h3>
                    {se.rsvp_enabled && <Badge variant="success">RSVP</Badge>}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-3 text-sm text-dash-muted">
                    {se.date && <span>📅 {formatDate(se.date)}</span>}
                    {se.start_time && <span>🕐 {formatTime12(se.start_time)}</span>}
                    {se.venue && <span>📍 {se.venue}</span>}
                  </div>
                  {se.description && (
                    <p className="mt-2 text-sm text-dash-muted">{se.description}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => setManagingSubEvent(se)}>
                    Invitations
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => openEdit(se)}>Edit</Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteMutation.mutate(se.id)}
                    loading={deleteMutation.isPending}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? "Edit Event" : "Add Event"}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button
              onClick={() => (editing ? updateMutation.mutate() : createMutation.mutate())}
              loading={createMutation.isPending || updateMutation.isPending}
              disabled={!form.name.trim()}
            >
              {editing ? "Save" : "Add"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Event Name"
            value={form.name}
            onChange={(e) => update({ name: e.target.value })}
            placeholder="e.g. Ceremony"
          />
          <DatePicker
            label="Date"
            value={form.date}
            onChange={(v) => update({ date: v })}
          />
          <div className="grid grid-cols-2 gap-3">
            <TimePicker
              label="Start Time"
              value={form.start_time}
              onChange={(v) => update({ start_time: v })}
            />
            <TimePicker
              label="End Time"
              value={form.end_time}
              onChange={(v) => update({ end_time: v })}
            />
          </div>
          <Input
            label="Venue"
            value={form.venue}
            onChange={(e) => update({ venue: e.target.value })}
            placeholder="e.g. Main Hall"
          />
          <Input
            label="Address"
            value={form.address}
            onChange={(e) => update({ address: e.target.value })}
            placeholder="e.g. 123 Main Street"
          />
          <Input
            label="Dress Code"
            value={form.dress_code}
            onChange={(e) => update({ dress_code: e.target.value })}
            placeholder="e.g. Black Tie"
          />
          <div>
            <label className="block text-sm font-medium text-dash-text mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => update({ description: e.target.value })}
              placeholder="Optional description"
              className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text focus:outline-none focus:ring-2 focus:ring-dash-primary/40 min-h-[80px] resize-y"
            />
          </div>
          <Toggle
            checked={form.rsvp_enabled}
            onChange={(v) => update({ rsvp_enabled: v })}
            label="RSVP enabled for this event"
          />
        </div>
      </Modal>

      {/* Invitation Manager */}
      {managingSubEvent && (
        <InvitationManager
          event={event}
          subEvent={managingSubEvent}
          groups={groups ?? []}
          onClose={() => setManagingSubEvent(null)}
        />
      )}
    </div>
  );
}

// --- Invitation Manager ---

function InvitationManager({
  event,
  subEvent,
  groups,
  onClose,
}: {
  event: UserEvent;
  subEvent: SubEvent;
  groups: GuestGroup[];
  onClose: () => void;
}) {
  const queryClient = useQueryClient();

  const { data: assignments } = useQuery({
    queryKey: ["sub-event-assignments", subEvent.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sub_event_group_assignments")
        .select("group_id")
        .eq("sub_event_id", subEvent.id);
      if (error) throw error;
      return (data ?? []) as { group_id: string }[];
    },
  });

  const { data: guests } = useQuery({
    queryKey: ["guests", event.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_guests")
        .select("id, name, group_id")
        .eq("event_id", event.id)
        .order("name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as EventGuest[];
    },
  });

  const { data: overrides } = useQuery({
    queryKey: ["guest-overrides", subEvent.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guest_invitation_overrides")
        .select("*")
        .eq("sub_event_id", subEvent.id);
      if (error) throw error;
      return (data ?? []) as { guest_id: string; is_invited: boolean }[];
    },
  });

  const assignedGroupIds = new Set(assignments?.map((a) => a.group_id) ?? []);
  const overrideMap = new Map(overrides?.map((o) => [o.guest_id, o.is_invited]) ?? new Map());

  const toggleGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      if (assignedGroupIds.has(groupId)) {
        const { error } = await supabase
          .from("sub_event_group_assignments")
          .delete()
          .eq("sub_event_id", subEvent.id)
          .eq("group_id", groupId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("sub_event_group_assignments")
          .insert({ sub_event_id: subEvent.id, group_id: groupId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-event-assignments", subEvent.id] });
    },
  });

  const toggleGuestOverrideMutation = useMutation({
    mutationFn: async (guestId: string) => {
      const isInvited = overrideMap.get(guestId) ?? null;
      if (isInvited !== null) {
        const { error } = await supabase
          .from("guest_invitation_overrides")
          .delete()
          .eq("sub_event_id", subEvent.id)
          .eq("guest_id", guestId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("guest_invitation_overrides")
          .insert({ sub_event_id: subEvent.id, guest_id: guestId, is_invited: true });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest-overrides", subEvent.id] });
    },
  });

  const isGuestInvited = (g: EventGuest): boolean => {
    const override = overrideMap.get(g.id);
    if (override !== undefined) return override;
    return g.group_id ? assignedGroupIds.has(g.group_id) : false;
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={`Invitations — ${subEvent.name}`}
      size="lg"
      footer={<Button variant="ghost" onClick={onClose}>Done</Button>}
    >
      <div className="space-y-6">
        {/* Group Assignments */}
        <div>
          <h4 className="mb-2 text-sm font-semibold text-dash-text">Assign by Group</h4>
          {groups.length === 0 ? (
            <p className="text-sm text-dash-muted">No groups available. Create groups first.</p>
          ) : (
            <div className="space-y-2">
              {groups.map((group) => (
                <div key={group.id} className="flex items-center justify-between rounded-lg border border-dash-border p-3">
                  <span className="text-sm text-dash-text">{group.name}</span>
                  <Toggle
                    checked={assignedGroupIds.has(group.id)}
                    onChange={() => toggleGroupMutation.mutate(group.id)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Manual Overrides */}
        <div>
          <h4 className="mb-2 text-sm font-semibold text-dash-text">Manual Overrides</h4>
          <p className="mb-3 text-xs text-dash-muted">
            Toggle individual guests on/off. Overrides group assignments.
          </p>
          {!guests || guests.length === 0 ? (
            <p className="text-sm text-dash-muted">No guests available.</p>
          ) : (
            <div className="max-h-60 space-y-1 overflow-y-auto scrollbar-thin">
              {guests.map((g) => {
                const invited = isGuestInvited(g);
                const hasOverride = overrideMap.has(g.id);
                return (
                  <div key={g.id} className="flex items-center justify-between rounded-lg border border-dash-border p-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-dash-text">{g.name}</span>
                      {hasOverride && <Badge variant="info">override</Badge>}
                    </div>
                    <Toggle
                      checked={invited}
                      onChange={() => toggleGuestOverrideMutation.mutate(g.id)}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
