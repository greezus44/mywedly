import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type EventGuest, type GuestGroup, type SubEvent, type GuestInvitationOverride } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import {
  Card,
  Modal,
  LoadingSpinner,
  ErrorState,
  EmptyState,
  Badge,
} from "../../components/ui";
import { GuestForm, RsvpBadge, guestToForm, type GuestFormValues } from "./guest-form";
import { generateUsername } from "../../lib/utils";

async function fetchGuests(eventId: string): Promise<EventGuest[]> {
  const { data, error } = await supabase
    .from("event_guests")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as EventGuest[];
}

async function fetchGroups(eventId: string): Promise<GuestGroup[]> {
  const { data, error } = await supabase
    .from("guest_groups")
    .select("*")
    .eq("event_id", eventId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as GuestGroup[];
}

async function fetchSubEvents(parentEventId: string): Promise<SubEvent[]> {
  const { data, error } = await supabase
    .from("sub_events")
    .select("*")
    .eq("parent_event_id", parentEventId)
    .order("display_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as SubEvent[];
}

async function fetchOverrides(guestId: string): Promise<GuestInvitationOverride[]> {
  const { data, error } = await supabase
    .from("guest_invitation_overrides")
    .select("*")
    .eq("guest_id", guestId);
  if (error) throw error;
  return (data ?? []) as GuestInvitationOverride[];
}

export function GuestsPage() {
  const { eventId } = useEventContext();
  const queryClient = useQueryClient();

  const { data: guests, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["event-guests", eventId],
    queryFn: () => fetchGuests(eventId),
  });

  const { data: groups } = useQuery({
    queryKey: ["guest-groups", eventId],
    queryFn: () => fetchGroups(eventId),
  });

  const { data: subEvents } = useQuery({
    queryKey: ["sub-events", eventId],
    queryFn: () => fetchSubEvents(eventId),
  });

  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("all");
  const [showEdit, setShowEdit] = useState(false);
  const [editing, setEditing] = useState<EventGuest | null>(null);
  const [formValues, setFormValues] = useState<GuestFormValues>(guestToForm(null));
  const [saveError, setSaveError] = useState<string | null>(null);
  const [managingInvites, setManagingInvites] = useState<EventGuest | null>(null);
  const [guestOverrides, setGuestOverrides] = useState<GuestInvitationOverride[]>([]);

  const filteredGuests = useMemo(() => {
    if (!guests) return [];
    let result = guests;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (g) =>
          g.name?.toLowerCase().includes(q) ||
          g.email?.toLowerCase().includes(q) ||
          g.username?.toLowerCase().includes(q),
      );
    }
    if (groupFilter !== "all") {
      if (groupFilter === "none") {
        result = result.filter((g) => !g.group_id);
      } else {
        result = result.filter((g) => g.group_id === groupFilter);
      }
    }
    return result;
  }, [guests, search, groupFilter]);

  const openCreate = () => {
    setEditing(null);
    setFormValues(guestToForm(null));
    setSaveError(null);
    setShowEdit(true);
  };

  const openEdit = (guest: EventGuest) => {
    setEditing(guest);
    setFormValues(guestToForm(guest));
    setSaveError(null);
    setShowEdit(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!formValues.name.trim()) throw new Error("Name is required");
      const payload = {
        event_id: eventId,
        name: formValues.name.trim(),
        username: formValues.username,
        email: formValues.email,
        phone: formValues.phone,
        group_id: formValues.group_id,
        side: formValues.side,
        table_number: formValues.table_number,
        rsvp_status: formValues.rsvp_status,
        plus_ones: formValues.plus_ones,
        dietary: formValues.dietary,
        message: formValues.message,
      };
      if (editing) {
        const { error } = await supabase
          .from("event_guests")
          .update(payload)
          .eq("id", editing.id);
        if (error) throw error;
      } else {
        const username = payload.username || generateUsername(payload.name);
        const { error } = await supabase
          .from("event_guests")
          .insert({ ...payload, username });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-guests", eventId] });
      setShowEdit(false);
      setFormValues(guestToForm(null));
      setEditing(null);
    },
    onError: (err: Error) => {
      setSaveError(err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("event_guests")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-guests", eventId] });
    },
  });

  // Toggle invitation override for a guest + sub-event
  const toggleInviteMutation = useMutation({
    mutationFn: async ({ guestId, subEventId, invited }: { guestId: string; subEventId: string; invited: boolean }) => {
      const existing = guestOverrides.find(
        (o) => o.guest_id === guestId && o.sub_event_id === subEventId,
      );
      if (existing) {
        const { error } = await supabase
          .from("guest_invitation_overrides")
          .update({ is_invited: invited })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("guest_invitation_overrides")
          .insert({ sub_event_id: subEventId, guest_id: guestId, is_invited: invited });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      if (managingInvites) {
        fetchOverrides(managingInvites.id).then(setGuestOverrides);
      }
      queryClient.invalidateQueries({ queryKey: ["invitation-data"] });
    },
  });

  const openManageInvites = async (guest: EventGuest) => {
    setManagingInvites(guest);
    const overrides = await fetchOverrides(guest.id);
    setGuestOverrides(overrides);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : "Failed to load guests"}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-dash-text">Guests</h1>
          <p className="mt-1 text-sm text-dash-muted">
            {guests?.length ?? 0} guest{(guests?.length ?? 0) !== 1 ? "s" : ""} total
          </p>
        </div>
        <Button onClick={openCreate}>Add Guest</Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            label="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or username…"
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-dash-text">Group</label>
            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text"
            >
              <option value="all">All Groups</option>
              <option value="none">No Group</option>
              {groups?.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Guest List */}
      {!guests || guests.length === 0 ? (
        <EmptyState
          icon={<span className="text-4xl">👥</span>}
          title="No guests yet"
          description="Add guests to invite them to your event."
          action={<Button onClick={openCreate}>Add Guest</Button>}
        />
      ) : filteredGuests.length === 0 ? (
        <EmptyState
          icon={<span className="text-4xl">🔍</span>}
          title="No matching guests"
          description="Try adjusting your search or filter."
        />
      ) : (
        <div className="space-y-3">
          {filteredGuests.map((guest) => {
            const groupName = groups?.find((g) => g.id === guest.group_id)?.name;
            return (
              <Card key={guest.id} className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-dash-text">{guest.name}</h3>
                    <RsvpBadge status={guest.rsvp_status} />
                    {groupName && <Badge color="default">{groupName}</Badge>}
                    {guest.side && <Badge color="default">{guest.side}</Badge>}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-4 text-sm text-dash-muted">
                    {guest.email && <span>✉ {guest.email}</span>}
                    {guest.username && <span>@{guest.username}</span>}
                    {guest.phone && <span>📞 {guest.phone}</span>}
                    {guest.table_number && <span>🪑 Table {guest.table_number}</span>}
                    {guest.plus_ones !== null && guest.plus_ones > 0 && (
                      <span>+{guest.plus_ones}</span>
                    )}
                  </div>

                  {/* Invited events as clickable chips */}
                  {subEvents && subEvents.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {subEvents.map((sub) => {
                        const override = guestOverrides.find(
                          (o) => o.sub_event_id === sub.id && o.guest_id === guest.id,
                        );
                        // For display, we check group assignment or override
                        const isInvited = override
                          ? override.is_invited
                          : !guest.group_id ||
                            !!groups?.find((g) => g.id === guest.group_id);
                        return (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={() => openManageInvites(guest)}
                            className={cn(
                              "rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
                              isInvited
                                ? "border-dash-primary/30 bg-dash-primary/10 text-dash-primary"
                                : "border-dash-border bg-dash-surface text-dash-muted",
                            )}
                          >
                            {isInvited ? "✓ " : ""}
                            {sub.name}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(guest)}>
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm(`Delete guest "${guest.name}"?`)) {
                        deleteMutation.mutate(guest.id);
                      }
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Modal */}
      <Modal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        title={editing ? "Edit Guest" : "Add Guest"}
        className="max-w-xl"
      >
        <div className="space-y-4">
          <GuestForm
            values={formValues}
            onChange={setFormValues}
            groups={groups ?? []}
          />
          {saveError && <p className="text-sm text-dash-danger">{saveError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowEdit(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              loading={saveMutation.isPending}
              disabled={!formValues.name.trim()}
            >
              {editing ? "Save" : "Add"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Manage Invitations Modal */}
      <Modal
        open={!!managingInvites}
        onClose={() => setManagingInvites(null)}
        title={`Invitations: ${managingInvites?.name ?? ""}`}
      >
        <div className="space-y-3">
          <p className="text-sm text-dash-muted">
            Toggle which events this guest is invited to. Overrides take precedence over group assignments.
          </p>
          {subEvents?.map((sub) => {
            const override = guestOverrides.find(
              (o) => o.sub_event_id === sub.id && o.guest_id === managingInvites?.id,
            );
            const isInvited = override ? override.is_invited : false;
            return (
              <div
                key={sub.id}
                className="flex items-center justify-between rounded-lg border border-dash-border bg-dash-bg p-3"
              >
                <div>
                  <span className="font-medium text-dash-text">{sub.name}</span>
                  {override && (
                    <span className="ml-2 text-xs text-dash-muted">(overridden)</span>
                  )}
                </div>
                <Button
                  variant={isInvited ? "secondary" : "primary"}
                  size="sm"
                  loading={toggleInviteMutation.isPending}
                  onClick={() =>
                    managingInvites &&
                    toggleInviteMutation.mutate({
                      guestId: managingInvites.id,
                      subEventId: sub.id,
                      invited: !isInvited,
                    })
                  }
                >
                  {isInvited ? "Uninvite" : "Invite"}
                </Button>
              </div>
            );
          })}
          {(!subEvents || subEvents.length === 0) && (
            <p className="text-sm text-dash-muted">No events created yet.</p>
          )}
        </div>
      </Modal>
    </div>
  );
}

function cn(...inputs: (string | undefined | null | false)[]): string {
  return inputs.filter(Boolean).join(" ");
}
