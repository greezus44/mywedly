import React, { useState, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  supabase,
  type UserEvent,
  type SubEvent,
  type GuestGroup,
  type EventGuest,
  type GuestGroupMember,
  type SubEventGroupAssignment,
  type GuestInvitationOverride,
} from "../../lib/supabase";
import { Input, Textarea, Select } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import {
  Card,
  Badge,
  Modal,
  EmptyState,
  Toggle,
  FormField,
  LoadingSpinner,
  ErrorState,
} from "../../components/ui";
import { DatePicker } from "../../components/ui/DatePicker";
import { TimePicker } from "../../components/ui/TimePicker";
import { cn, formatDate, formatTime12 } from "../../lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SubEventForm {
  name: string;
  date: string | null;
  start_time: string | null;
  end_time: string | null;
  venue: string;
  address: string;
  description: string;
  dress_code: string;
  rsvp_deadline: string | null;
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
  rsvp_deadline: null,
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function Events() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<SubEvent | null>(null);
  const [form, setForm] = useState<SubEventForm>(EMPTY_FORM);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const subEventsKey = ["sub_events", event.id];

  const { data: subEvents, isLoading, error, refetch } = useQuery({
    queryKey: subEventsKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sub_events")
        .select("*")
        .eq("parent_event_id", event.id)
        .order("display_order", { ascending: true })
        .order("order_index", { ascending: true });
      if (error) throw error;
      return data as SubEvent[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        parent_event_id: event.id,
        name: form.name.trim(),
        date: form.date,
        start_time: form.start_time,
        end_time: form.end_time,
        venue: form.venue.trim(),
        address: form.address.trim(),
        description: form.description.trim() || null,
        dress_code: form.dress_code.trim() || null,
        rsvp_deadline: form.rsvp_deadline,
        display_order: editing?.display_order ?? (subEvents?.length ?? 0),
        order_index: editing?.order_index ?? (subEvents?.length ?? 0),
      };
      if (editing) {
        const { error } = await supabase.from("sub_events").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("sub_events").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subEventsKey });
      setShowModal(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sub_events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: subEventsKey }),
  });

  function openNew() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  }

  function openEdit(se: SubEvent) {
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
      rsvp_deadline: se.rsvp_deadline,
    });
    setShowModal(true);
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }
  if (error) return <ErrorState message="Failed to load events." onRetry={() => refetch()} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-dash-text">Events</h2>
        <Button onClick={openNew}>+ Add Event</Button>
      </div>

      {!subEvents || subEvents.length === 0 ? (
        <EmptyState
          title="No events yet"
          description="Add individual events like Ceremony, Reception, or Mehndi to organize your celebration schedule."
          action={<Button onClick={openNew}>+ Add Event</Button>}
        />
      ) : (
        <div className="space-y-3">
          {subEvents.map((se) => (
            <SubEventCard
              key={se.id}
              subEvent={se}
              eventId={event.id}
              expanded={expandedId === se.id}
              onToggleExpand={() => setExpandedId(expandedId === se.id ? null : se.id)}
              onEdit={() => openEdit(se)}
              onDelete={() => deleteMutation.mutate(se.id)}
            />
          ))}
        </div>
      )}

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? "Edit Event" : "Add Event"}
        size="xl"
      >
        <div className="space-y-4">
          <FormField label="Event Name">
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., Ceremony"
              autoFocus
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField label="Date">
              <DatePicker value={form.date} onChange={(v) => setForm({ ...form, date: v })} />
            </FormField>
            <FormField label="Start Time">
              <TimePicker
                value={form.start_time}
                onChange={(v) => setForm({ ...form, start_time: v })}
              />
            </FormField>
            <FormField label="End Time">
              <TimePicker
                value={form.end_time}
                onChange={(v) => setForm({ ...form, end_time: v })}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Venue">
              <Input
                value={form.venue}
                onChange={(e) => setForm({ ...form, venue: e.target.value })}
                placeholder="e.g., Grand Ballroom"
              />
            </FormField>
            <FormField label="Address">
              <Input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Street address"
              />
            </FormField>
          </div>

          <FormField label="Description">
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Details about this event..."
              rows={3}
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Dress Code">
              <Input
                value={form.dress_code}
                onChange={(e) => setForm({ ...form, dress_code: e.target.value })}
                placeholder="e.g., Black Tie"
              />
            </FormField>
            <FormField label="RSVP Deadline">
              <DatePicker
                value={form.rsvp_deadline}
                onChange={(v) => setForm({ ...form, rsvp_deadline: v })}
              />
            </FormField>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button
              loading={saveMutation.isPending}
              disabled={!form.name.trim()}
              onClick={() => saveMutation.mutate()}
            >
              {editing ? "Save Changes" : "Add Event"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SubEventCard
// ---------------------------------------------------------------------------

function SubEventCard({
  subEvent,
  eventId,
  expanded,
  onToggleExpand,
  onEdit,
  onDelete,
}: {
  subEvent: SubEvent;
  eventId: string;
  expanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-semibold text-dash-text">{subEvent.name}</h3>
              {subEvent.date && <Badge variant="info">{formatDate(subEvent.date)}</Badge>}
              {subEvent.start_time && (
                <Badge variant="default">{formatTime12(subEvent.start_time)}</Badge>
              )}
              {subEvent.end_time && (
                <span className="text-xs text-dash-muted">– {formatTime12(subEvent.end_time)}</span>
              )}
            </div>
            {subEvent.venue && (
              <p className="mt-1 text-sm text-dash-muted">
                {subEvent.venue}
                {subEvent.address ? ` • ${subEvent.address}` : ""}
              </p>
            )}
            {subEvent.description && (
              <p className="mt-1.5 text-sm text-dash-text/80 line-clamp-2">{subEvent.description}</p>
            )}
            {subEvent.dress_code && (
              <p className="mt-1 text-xs text-dash-muted">Dress code: {subEvent.dress_code}</p>
            )}
          </div>
          <div className="flex gap-1 shrink-0">
            <Button size="sm" variant="ghost" onClick={onToggleExpand}>
              {expanded ? "Hide Invitations" : "Invitations"}
            </Button>
            <Button size="sm" variant="ghost" onClick={onEdit}>
              Edit
            </Button>
            <Button size="sm" variant="ghost" className="text-red-600" onClick={onDelete}>
              Delete
            </Button>
          </div>
        </div>
      </div>
      {expanded && (
        <div className="border-t border-dash-border bg-dash-bg/50 p-4">
          <InvitationManager subEvent={subEvent} eventId={eventId} />
        </div>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// InvitationManager
// ---------------------------------------------------------------------------

function InvitationManager({ subEvent, eventId }: { subEvent: SubEvent; eventId: string }) {
  const queryClient = useQueryClient();
  const [showGuestPicker, setShowGuestPicker] = useState(false);

  const assignmentsKey = ["sub_event_group_assignments", subEvent.id];
  const overridesKey = ["guest_invitation_overrides", subEvent.id];

  // Guest groups for this event
  const { data: groups } = useQuery({
    queryKey: ["guest_groups", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guest_groups")
        .select("*")
        .eq("event_id", eventId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as GuestGroup[];
    },
  });

  // All guests for this event
  const { data: guests } = useQuery({
    queryKey: ["event_guests", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_guests")
        .select("*")
        .eq("event_id", eventId)
        .order("name", { ascending: true });
      if (error) throw error;
      return data as EventGuest[];
    },
  });

  // Group memberships
  const { data: memberships } = useQuery({
    queryKey: ["guest_group_members", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guest_group_members")
        .select("guest_id, group_id")
        .in(
          "group_id",
          (groups ?? []).map((g) => g.id),
        );
      if (error) throw error;
      return data as GuestGroupMember[];
    },
    enabled: !!(groups && groups.length > 0),
  });

  // Assigned group IDs for this sub-event
  const { data: assignments } = useQuery({
    queryKey: assignmentsKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sub_event_group_assignments")
        .select("*")
        .eq("sub_event_id", subEvent.id);
      if (error) throw error;
      return data as SubEventGroupAssignment[];
    },
  });

  // Manual overrides for this sub-event
  const { data: overrides } = useQuery({
    queryKey: overridesKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guest_invitation_overrides")
        .select("*")
        .eq("sub_event_id", subEvent.id);
      if (error) throw error;
      return data as GuestInvitationOverride[];
    },
  });

  const assignedGroupIds = useMemo(
    () => new Set((assignments ?? []).map((a) => a.group_id)),
    [assignments],
  );

  const overrideMap = useMemo(() => {
    const m = new Map<string, boolean>();
    (overrides ?? []).forEach((o) => m.set(o.guest_id, o.is_invited));
    return m;
  }, [overrides]);

  // Guests per group
  const guestsByGroup = useMemo(() => {
    const m = new Map<string, string[]>();
    (memberships ?? []).forEach((mem) => {
      const arr = m.get(mem.group_id) ?? [];
      arr.push(mem.guest_id);
      m.set(mem.group_id, arr);
    });
    return m;
  }, [memberships]);

  // Guests in assigned groups (unique)
  const groupGuestIds = useMemo(() => {
    const ids = new Set<string>();
    assignedGroupIds.forEach((gid) => {
      (guestsByGroup.get(gid) ?? []).forEach((id) => ids.add(id));
    });
    return ids;
  }, [assignedGroupIds, guestsByGroup]);

  // Manual additions: override is_invited=true AND not in any assigned group
  const manualAdditions = useMemo(() => {
    return (overrides ?? [])
      .filter((o) => o.is_invited && !groupGuestIds.has(o.guest_id))
      .map((o) => guests?.find((g) => g.id === o.guest_id))
      .filter((g): g is EventGuest => !!g);
  }, [overrides, groupGuestIds, guests]);

  // Manual removals: override is_invited=false AND in an assigned group
  const manualRemovals = useMemo(() => {
    return (overrides ?? [])
      .filter((o) => !o.is_invited && groupGuestIds.has(o.guest_id))
      .map((o) => guests?.find((g) => g.id === o.guest_id))
      .filter((g): g is EventGuest => !!g);
  }, [overrides, groupGuestIds, guests]);

  // Total invited = group guests - removals + additions
  const totalInvited = groupGuestIds.size - manualRemovals.length + manualAdditions.length;
  const viaGroups = groupGuestIds.size - manualRemovals.length;

  // Guests available for manual add (not already in an assigned group, not already manually added)
  const availableGuests = useMemo(() => {
    const alreadyAdded = new Set(manualAdditions.map((g) => g.id));
    return (guests ?? []).filter((g) => !groupGuestIds.has(g.id) && !alreadyAdded.has(g.id));
  }, [guests, groupGuestIds, manualAdditions]);

  // ---- Mutations ----

  const toggleGroupMutation = useMutation({
    mutationFn: async ({ groupId, assign }: { groupId: string; assign: boolean }) => {
      if (assign) {
        const { error } = await supabase
          .from("sub_event_group_assignments")
          .insert({ sub_event_id: subEvent.id, group_id: groupId });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("sub_event_group_assignments")
          .delete()
          .eq("sub_event_id", subEvent.id)
          .eq("group_id", groupId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assignmentsKey });
      queryClient.invalidateQueries({ queryKey: overridesKey });
    },
  });

  const addOverrideMutation = useMutation({
    mutationFn: async ({ guestId, isInvited }: { guestId: string; isInvited: boolean }) => {
      // Upsert: delete existing then insert (simplest cross-version approach)
      await supabase
        .from("guest_invitation_overrides")
        .delete()
        .eq("sub_event_id", subEvent.id)
        .eq("guest_id", guestId);
      const { error } = await supabase
        .from("guest_invitation_overrides")
        .insert({ sub_event_id: subEvent.id, guest_id: guestId, is_invited: isInvited });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: overridesKey });
      setShowGuestPicker(false);
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async (guestId: string) => {
      const { error } = await supabase
        .from("guest_invitation_overrides")
        .delete()
        .eq("sub_event_id", subEvent.id)
        .eq("guest_id", guestId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: overridesKey }),
  });

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Badge variant="info">Total: {totalInvited} invited</Badge>
        <span className="text-dash-muted">|</span>
        <span className="text-dash-muted">{viaGroups} via groups</span>
        <span className="text-dash-muted">|</span>
        <span className="text-dash-muted">{manualAdditions.length} manual additions</span>
        <span className="text-dash-muted">|</span>
        <span className="text-dash-muted">{manualRemovals.length} manual removals</span>
      </div>

      {/* Assigned Guest Groups */}
      <div>
        <h4 className="text-sm font-semibold text-dash-text mb-2">Assigned Guest Groups</h4>
        {!groups || groups.length === 0 ? (
          <p className="text-xs text-dash-muted">No guest groups created yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {groups.map((group) => {
              const assigned = assignedGroupIds.has(group.id);
              const count = guestsByGroup.get(group.id)?.length ?? 0;
              return (
                <button
                  key={group.id}
                  type="button"
                  onClick={() =>
                    toggleGroupMutation.mutate({ groupId: group.id, assign: !assigned })
                  }
                  disabled={toggleGroupMutation.isPending}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                    assigned
                      ? "border-dash-primary bg-dash-primary text-dash-primary-fg"
                      : "border-dash-border bg-dash-surface text-dash-text hover:bg-dash-bg",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-4 w-4 items-center justify-center rounded-full border-2 text-[10px]",
                      assigned ? "border-dash-primary-fg" : "border-dash-border",
                    )}
                  >
                    {assigned && "✓"}
                  </span>
                  {group.name}
                  <span className="text-xs opacity-70">({count})</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Manual Additions */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-dash-text">Manual Additions</h4>
          <Button size="sm" variant="secondary" onClick={() => setShowGuestPicker(true)}>
            + Add Guest
          </Button>
        </div>
        {manualAdditions.length === 0 ? (
          <p className="text-xs text-dash-muted">No manually added guests.</p>
        ) : (
          <div className="space-y-1">
            {manualAdditions.map((g) => (
              <div
                key={g.id}
                className="flex items-center justify-between rounded-lg border border-dash-border bg-dash-surface px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-dash-text">{g.name}</p>
                  <p className="text-xs text-dash-muted">{g.email || g.phone || g.username}</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-600"
                  onClick={() => addOverrideMutation.mutate({ guestId: g.id, isInvited: false })}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Manual Removals */}
      {manualRemovals.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-dash-text mb-2">Manual Removals</h4>
          <div className="space-y-1">
            {manualRemovals.map((g) => (
              <div
                key={g.id}
                className="flex items-center justify-between rounded-lg border border-dash-border bg-dash-surface px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-dash-text line-through opacity-60">
                    {g.name}
                  </p>
                  <p className="text-xs text-dash-muted">{g.email || g.phone || g.username}</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => restoreMutation.mutate(g.id)}
                  loading={restoreMutation.isPending}
                >
                  Restore
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Guest Picker Modal */}
      <Modal
        open={showGuestPicker}
        onClose={() => setShowGuestPicker(false)}
        title="Add Guest to Event"
        size="md"
      >
        <div className="space-y-3">
          <p className="text-sm text-dash-muted">
            Select a guest to invite. Only guests not already in an assigned group are shown.
          </p>
          {availableGuests.length === 0 ? (
            <p className="text-sm text-dash-muted py-4 text-center">
              No available guests to add.
            </p>
          ) : (
            <div className="max-h-64 space-y-1 overflow-y-auto">
              {availableGuests.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() =>
                    addOverrideMutation.mutate({ guestId: g.id, isInvited: true })
                  }
                  disabled={addOverrideMutation.isPending}
                  className="flex w-full items-center justify-between rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-left hover:border-dash-primary hover:bg-dash-bg transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-dash-text">{g.name}</p>
                    <p className="text-xs text-dash-muted truncate">
                      {g.email || g.phone || g.username}
                    </p>
                  </div>
                  <span className="text-sm text-dash-primary shrink-0">+ Invite</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
