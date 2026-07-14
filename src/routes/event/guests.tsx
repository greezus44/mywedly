import React, { useState, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventGuest, type GuestGroup, type SubEvent, type GuestInvitationOverride } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card, Modal, EmptyState, LoadingSpinner, ErrorState, Badge } from "../../components/ui";
import { GuestForm, RsvpBadge, guestToForm, formToGuest, type GuestFormData } from "./guest-form";
import { generateUsername } from "../../lib/utils";
import { cn } from "../../lib/utils";

export function GuestsPage() {
  const { event, eventId } = useOutletContext<{ event: UserEvent; eventId: string }>();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [editingGuest, setEditingGuest] = useState<EventGuest | null>(null);
  const [form, setForm] = useState<GuestFormData>(getEmptyForm());
  const [invitedEventIds, setInvitedEventIds] = useState<Set<string>>(new Set());

  function getEmptyForm(): GuestFormData {
    return {
      name: "",
      email: "",
      phone: "",
      username: "",
      group_id: "",
      group_name: "",
      side: "",
      plus_ones: 0,
      dietary: "",
      message: "",
      table_number: "",
      rsvp_status: "pending",
    };
  }

  // Fetch guests
  const { data: guests, isLoading, isError } = useQuery({
    queryKey: ["event-guests", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_guests")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as EventGuest[];
    },
  });

  // Fetch groups
  const { data: groups } = useQuery({
    queryKey: ["guest-groups", eventId],
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

  // Fetch sub-events
  const { data: subEvents } = useQuery({
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

  // Fetch overrides for all guests
  const { data: overrides } = useQuery({
    queryKey: ["guest-invitation-overrides", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guest_invitation_overrides")
        .select("*")
        .eq("sub_event_id", `in.(${(subEvents ?? []).map((s) => s.id).join(",")})`);
      if (error) throw error;
      return data as GuestInvitationOverride[];
    },
    enabled: !!subEvents && subEvents.length > 0,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const guestData = formToGuest(form);
      const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
      const { error } = await supabase.from("event_guests").insert({
        ...guestData,
        event_id: eventId,
        token,
        username: guestData.username || generateUsername(form.name),
      });
      if (error) throw error;

      // Save invitation overrides
      await saveOverrides(null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-guests", eventId] });
      queryClient.invalidateQueries({ queryKey: ["guest-invitation-overrides", eventId] });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingGuest) return;
      const guestData = formToGuest(form);
      const { error } = await supabase
        .from("event_guests")
        .update(guestData)
        .eq("id", editingGuest.id);
      if (error) throw error;

      // Save invitation overrides
      await saveOverrides(editingGuest.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-guests", eventId] });
      queryClient.invalidateQueries({ queryKey: ["guest-invitation-overrides", eventId] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("event_guests").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-guests", eventId] });
    },
  });

  async function saveOverrides(guestId: string | null) {
    const id = guestId ?? editingGuest?.id;
    if (!id || !subEvents) return;

    // Delete existing overrides for this guest
    const { error: delError } = await supabase
      .from("guest_invitation_overrides")
      .delete()
      .eq("guest_id", id);
    if (delError) throw delError;

    // Insert new overrides for uninvited events
    const uninvited = subEvents.filter((se) => !invitedEventIds.has(se.id));
    if (uninvited.length > 0) {
      const inserts = uninvited.map((se) => ({
        sub_event_id: se.id,
        guest_id: id,
        is_invited: false,
      }));
      const { error: insError } = await supabase
        .from("guest_invitation_overrides")
        .insert(inserts);
      if (insError) throw insError;
    }
  }

  function resetForm() {
    setShowForm(false);
    setEditingGuest(null);
    setForm(getEmptyForm());
    setInvitedEventIds(new Set());
  }

  function openEdit(guest: EventGuest) {
    setEditingGuest(guest);
    setForm(guestToForm(guest));
    // Load existing overrides for this guest
    const guestOverrides = (overrides ?? []).filter((o) => o.guest_id === guest.id);
    const overriddenUninvited = new Set(
      guestOverrides.filter((o) => !o.is_invited).map((o) => o.sub_event_id),
    );
    const invited = new Set(
      (subEvents ?? []).filter((se) => !overriddenUninvited.has(se.id)).map((se) => se.id),
    );
    setInvitedEventIds(invited);
    setShowForm(true);
  }

  function handleToggleInvitedEvent(subEventId: string) {
    const next = new Set(invitedEventIds);
    if (next.has(subEventId)) {
      next.delete(subEventId);
    } else {
      next.add(subEventId);
    }
    setInvitedEventIds(next);
  }

  function handleSave() {
    if (editingGuest) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  }

  // Filter guests
  const filtered = useMemo(() => {
    let result = guests ?? [];
    if (groupFilter !== "all") {
      result = result.filter((g) => g.group_id === groupFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (g) =>
          g.name.toLowerCase().includes(q) ||
          (g.email ?? "").toLowerCase().includes(q),
      );
    }
    return result;
  }, [guests, groupFilter, search]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-20">
        <ErrorState message="Failed to load guests" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-dash-text">Guests</h2>
          <p className="text-sm text-dash-muted mt-1">
            Manage your guest list and track RSVPs.
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          Add Guest
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="flex-1"
        />
        <select
          value={groupFilter}
          onChange={(e) => setGroupFilter(e.target.value)}
          className="rounded-md border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text focus:outline-none focus:ring-2 focus:ring-dash-primary"
        >
          <option value="all">All Groups</option>
          {groups?.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </div>

      {/* Guest List */}
      {filtered.length > 0 ? (
        <div className="space-y-2">
          {filtered.map((guest) => {
            const guestGroup = groups?.find((g) => g.id === guest.group_id);
            return (
              <Card key={guest.id} className="flex items-center justify-between gap-4 py-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-dash-text">{guest.name}</h3>
                    <RsvpBadge status={guest.rsvp_status} />
                    {guestGroup && <Badge variant="primary">{guestGroup.name}</Badge>}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-dash-muted">
                    {guest.email && <span>{guest.email}</span>}
                    {guest.phone && <span>{guest.phone}</span>}
                    {guest.plus_ones > 0 && <span>+{guest.plus_ones} guests</span>}
                    {guest.table_number && <span>Table: {guest.table_number}</span>}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button variant="secondary" size="sm" onClick={() => openEdit(guest)}>
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => deleteMutation.mutate(guest.id)}
                    loading={deleteMutation.isPending}
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <EmptyState
            title={search || groupFilter !== "all" ? "No matching guests" : "No guests yet"}
            description={
              search || groupFilter !== "all"
                ? "Try adjusting your search or filter."
                : "Add guests to your event to start managing your guest list."
            }
            icon={<span className="text-4xl">💌</span>}
            action={
              !search && groupFilter === "all" ? (
                <Button onClick={() => setShowForm(true)}>Add Guest</Button>
              ) : undefined
            }
          />
        </Card>
      )}

      {/* Form Modal */}
      <Modal
        open={showForm}
        onClose={resetForm}
        title={editingGuest ? "Edit Guest" : "Add Guest"}
        size="lg"
      >
        <div className="space-y-4">
          <GuestForm
            form={form}
            onChange={setForm}
            groups={groups}
            subEvents={subEvents}
            invitedEventIds={invitedEventIds}
            onToggleInvitedEvent={handleToggleInvitedEvent}
          />
          {(createMutation.isError || updateMutation.isError) && (
            <p className="text-sm text-dash-danger">
              {createMutation.error instanceof Error
                ? createMutation.error.message
                : updateMutation.error instanceof Error
                  ? updateMutation.error.message
                  : "Failed to save guest"}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={resetForm}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              loading={createMutation.isPending || updateMutation.isPending}
              disabled={!form.name.trim()}
            >
              {editingGuest ? "Save" : "Add"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
