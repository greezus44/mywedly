import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type EventGuest, type GuestGroup, type SubEvent, type GuestInvitationOverride } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card, Modal, LoadingSpinner, ErrorState, EmptyState, Badge } from "../../components/ui";
import { GuestForm, RsvpBadge, guestToForm, EMPTY_GUEST_FORM, type GuestFormValues } from "./guest-form";
import { cn, generateUsername } from "../../lib/utils";

export const GuestsPage: React.FC = () => {
  const { eventId } = useEventContext();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<GuestFormValues>(EMPTY_GUEST_FORM);
  const [search, setSearch] = useState("");
  const [filterGroup, setFilterGroup] = useState<string>("");

  const { data: guests, isLoading, isError, refetch } = useQuery({
    queryKey: ["event-guests", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_guests")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as EventGuest[];
    },
  });

  const { data: groups } = useQuery({
    queryKey: ["guest-groups", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guest_groups")
        .select("*")
        .eq("event_id", eventId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as GuestGroup[];
    },
  });

  const { data: subEvents } = useQuery({
    queryKey: ["sub-events", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sub_events")
        .select("*")
        .eq("parent_event_id", eventId)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as SubEvent[];
    },
  });

  const { data: overrides } = useQuery({
    queryKey: ["guest-invitation-overrides-all", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guest_invitation_overrides")
        .select("*");
      if (error) throw error;
      return (data ?? []) as GuestInvitationOverride[];
    },
  });

  const groupMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const g of groups ?? []) {
      map.set(g.id, g.name);
    }
    return map;
  }, [groups]);

  const filteredGuests = useMemo(() => {
    let list = guests ?? [];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((g) =>
        g.name.toLowerCase().includes(q) ||
        (g.email ?? "").toLowerCase().includes(q) ||
        (g.username ?? "").toLowerCase().includes(q)
      );
    }
    if (filterGroup) {
      list = list.filter((g) => g.group_id === filterGroup);
    }
    return list;
  }, [guests, search, filterGroup]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        event_id: eventId,
        name: form.name,
        username: form.username || generateUsername(form.name),
        email: form.email,
        phone: form.phone,
        group_name: form.group_id ? (groupMap.get(form.group_id) ?? null) : form.group_name,
        side: form.side,
        group_id: form.group_id,
        rsvp_status: form.rsvp_status,
        plus_ones: form.plus_ones,
        dietary: form.dietary,
        message: form.message,
        table_number: form.table_number,
      };
      if (editingId) {
        const { error } = await supabase
          .from("event_guests")
          .update(payload)
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("event_guests")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-guests", eventId] });
      setModalOpen(false);
      setForm(EMPTY_GUEST_FORM);
      setEditingId(null);
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

  const toggleOverride = useMutation({
    mutationFn: async ({ guestId, subEventId, isInvited }: { guestId: string; subEventId: string; isInvited: boolean }) => {
      const existing = (overrides ?? []).find(
        (o) => o.guest_id === guestId && o.sub_event_id === subEventId,
      );
      if (existing) {
        const { error } = await supabase
          .from("guest_invitation_overrides")
          .update({ is_invited: isInvited })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("guest_invitation_overrides")
          .insert({ guest_id: guestId, sub_event_id: subEventId, is_invited: isInvited });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest-invitation-overrides-all", eventId] });
    },
  });

  const openCreate = () => {
    setForm(EMPTY_GUEST_FORM);
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = (guest: EventGuest) => {
    setForm(guestToForm(guest));
    setEditingId(guest.id);
    setModalOpen(true);
  };

  const isGuestInvitedToSubEvent = (guestId: string, subEventId: string): boolean => {
    const override = (overrides ?? []).find(
      (o) => o.guest_id === guestId && o.sub_event_id === subEventId,
    );
    if (override) return override.is_invited;
    // Default: invited unless explicitly excluded
    return true;
  };

  if (isLoading) {
    return <LoadingSpinner size="md" label="Loading guests..." />;
  }

  if (isError) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dash-text">Guests</h2>
          <p className="text-sm text-dash-muted">Manage your guest list and track RSVPs.</p>
        </div>
        <Button onClick={openCreate}>Add Guest</Button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or username..."
          className="flex-1"
        />
        <select
          value={filterGroup}
          onChange={(e) => setFilterGroup(e.target.value)}
          className="h-10 rounded-md border border-dash-border bg-dash-surface px-3 text-sm text-dash-text"
        >
          <option value="">All groups</option>
          {(groups ?? []).map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
      </div>

      {(!guests || guests.length === 0) && (
        <EmptyState
          title="No guests yet"
          description="Add guests to your invitation website."
          action={<Button onClick={openCreate}>Add Guest</Button>}
        />
      )}

      {guests && guests.length > 0 && filteredGuests.length === 0 && (
        <EmptyState
          title="No matching guests"
          description="Try adjusting your search or filter."
        />
      )}

      {filteredGuests.length > 0 && (
        <div className="space-y-3">
          {filteredGuests.map((guest) => (
            <Card key={guest.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-dash-text">{guest.name}</h3>
                    <RsvpBadge status={guest.rsvp_status} />
                    {guest.group_id && groupMap.get(guest.group_id) && (
                      <Badge variant="primary">{groupMap.get(guest.group_id)}</Badge>
                    )}
                    {guest.side && (
                      <Badge>{guest.side}</Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-dash-muted">
                    {guest.username && <span>@{guest.username}</span>}
                    {guest.email && <span>{guest.email}</span>}
                    {guest.phone && <span>{guest.phone}</span>}
                    {guest.plus_ones > 0 && <span>+{guest.plus_ones} guest{guest.plus_ones !== 1 ? "s" : ""}</span>}
                    {guest.table_number != null && <span>Table {guest.table_number}</span>}
                  </div>
                  {/* Invited Events as clickable chips */}
                  {subEvents && subEvents.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {subEvents.map((sub) => {
                        const invited = isGuestInvitedToSubEvent(guest.id, sub.id);
                        return (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={() =>
                              toggleOverride.mutate({
                                guestId: guest.id,
                                subEventId: sub.id,
                                isInvited: !invited,
                              })
                            }
                            className={cn(
                              "rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
                              invited
                                ? "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                                : "border-dash-border bg-dash-bg text-dash-muted hover:bg-dash-surface",
                            )}
                            title={invited ? "Click to un-invite" : "Click to invite"}
                          >
                            {sub.name}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(guest)}>Edit</Button>
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
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit Guest" : "Add Guest"}
        size="lg"
      >
        <div className="space-y-4">
          <GuestForm
            values={form}
            onChange={setForm}
            groups={groups?.map((g) => ({ id: g.id, name: g.name }))}
          />
          {saveMutation.isError && (
            <p className="text-sm text-dash-danger">
              {saveMutation.error instanceof Error ? saveMutation.error.message : "Save failed"}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button
              onClick={() => saveMutation.mutate()}
              loading={saveMutation.isPending}
              disabled={saveMutation.isPending || !form.name.trim()}
            >
              {editingId ? "Update" : "Add"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
