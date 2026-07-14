import React, { useState, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import type { UserEvent, EventGuest, GuestGroup, SubEvent, GuestInvitationOverride } from "../../lib/supabase";
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
import {
  GuestForm,
  guestToForm,
  emptyGuestForm,
  RsvpBadge,
  type GuestFormData,
} from "./guest-form";
import { cn } from "../../lib/utils";

export function GuestsPage() {
  const { event, eventId } = useOutletContext<{ event: UserEvent; eventId: string }>();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterGroup, setFilterGroup] = useState<string>("");
  const [formData, setFormData] = useState<GuestFormData>(emptyGuestForm());

  const {
    data: guests,
    isLoading,
    isError,
    refetch,
  } = useQuery({
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

  const { data: overrides } = useQuery({
    queryKey: ["guest-invitation-overrides-all", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guest_invitation_overrides")
        .select("*")
        .in("sub_event_id", (subEvents ?? []).map((se) => se.id));
      if (error) throw error;
      return data as GuestInvitationOverride[];
    },
    enabled: !!subEvents && subEvents.length > 0,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("event_guests").insert({
        event_id: eventId,
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        group_id: formData.group_id,
        group_name: formData.group_name || null,
        side: formData.side || null,
        rsvp_status: formData.rsvp_status,
        plus_ones: formData.plus_ones,
        dietary: formData.dietary || null,
        message: formData.message || null,
        table_number: formData.table_number || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-guests", eventId] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingId) throw new Error("No guest selected");
      const { error } = await supabase
        .from("event_guests")
        .update({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          group_id: formData.group_id,
          group_name: formData.group_name || null,
          side: formData.side || null,
          rsvp_status: formData.rsvp_status,
          plus_ones: formData.plus_ones,
          dietary: formData.dietary || null,
          message: formData.message || null,
          table_number: formData.table_number || null,
        })
        .eq("id", editingId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-guests", eventId] });
      closeModal();
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

  const toggleOverrideMutation = useMutation({
    mutationFn: async ({ guestId, subEventId, isInvited }: { guestId: string; subEventId: string; isInvited: boolean }) => {
      const existing = (overrides ?? []).find(
        (o) => o.guest_id === guestId && o.sub_event_id === subEventId
      );
      if (existing) {
        const { error } = await supabase
          .from("guest_invitation_overrides")
          .update({ is_invited: isInvited })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("guest_invitation_overrides").insert({
          guest_id: guestId,
          sub_event_id: subEventId,
          is_invited: isInvited,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest-invitation-overrides-all", eventId] });
    },
  });

  const openCreate = () => {
    setEditingId(null);
    setFormData(emptyGuestForm());
    setModalOpen(true);
  };

  const openEdit = (guest: EventGuest) => {
    setEditingId(guest.id);
    setFormData(guestToForm(guest));
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
  };

  const handleSave = () => {
    if (editingId) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };

  const filteredGuests = useMemo(() => {
    if (!guests) return [];
    return guests.filter((g) => {
      const matchSearch =
        !search ||
        g.name.toLowerCase().includes(search.toLowerCase()) ||
        g.email.toLowerCase().includes(search.toLowerCase());
      const matchGroup = !filterGroup || g.group_id === filterGroup;
      return matchSearch && matchGroup;
    });
  }, [guests, search, filterGroup]);

  const isGuestInvitedToSubEvent = (guestId: string, subEventId: string): boolean => {
    const override = (overrides ?? []).find(
      (o) => o.guest_id === guestId && o.sub_event_id === subEventId
    );
    return override?.is_invited ?? false;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState message="Failed to load guests" onRetry={() => refetch()} />;
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-dash-text">Guests</h2>
          <p className="mt-1 text-sm text-dash-muted">
            Manage your guest list, track RSVPs, and assign event invitations.
          </p>
        </div>
        <Button onClick={openCreate}>Add Guest</Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="flex-1"
        />
        <div className="sm:w-48">
          <select
            value={filterGroup}
            onChange={(e) => setFilterGroup(e.target.value)}
            className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text focus:outline-none focus:ring-2 focus:ring-dash-primary/30"
          >
            <option value="">All Groups</option>
            {(groups ?? []).map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Guest list */}
      {filteredGuests.length > 0 ? (
        <div className="space-y-3">
          {filteredGuests.map((guest) => (
            <Card key={guest.id} className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-base font-semibold text-dash-text">{guest.name}</h3>
                    <RsvpBadge status={guest.rsvp_status} />
                    {guest.group_name && (
                      <Badge variant="default">{guest.group_name}</Badge>
                    )}
                    {guest.side && (
                      <Badge variant="default" className="capitalize">{guest.side}</Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-dash-muted">
                    <span>✉️ {guest.email}</span>
                    {guest.phone && <span>📞 {guest.phone}</span>}
                    {guest.plus_ones !== null && guest.plus_ones > 0 && (
                      <span>👥 +{guest.plus_ones}</span>
                    )}
                    {guest.table_number && <span>🪑 Table {guest.table_number}</span>}
                  </div>

                  {/* Invited events as clickable chips */}
                  {subEvents && subEvents.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {subEvents.map((se) => {
                        const invited = isGuestInvitedToSubEvent(guest.id, se.id);
                        return (
                          <button
                            key={se.id}
                            type="button"
                            onClick={() =>
                              toggleOverrideMutation.mutate({
                                guestId: guest.id,
                                subEventId: se.id,
                                isInvited: !invited,
                              })
                            }
                            className={cn(
                              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                              invited
                                ? "border-dash-primary bg-dash-primary/10 text-dash-primary"
                                : "border-dash-border bg-dash-surface text-dash-muted hover:bg-dash-bg"
                            )}
                          >
                            {invited ? "✓" : "+"} {se.name}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-4">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(guest)}>
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMutation.mutate(guest.id)}
                    loading={deleteMutation.isPending}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title={search || filterGroup ? "No guests found" : "No guests yet"}
          description={search || filterGroup ? "Try adjusting your filters." : "Add guests to start building your guest list."}
          action={!search && !filterGroup ? <Button onClick={openCreate}>Add Guest</Button> : undefined}
        />
      )}

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingId ? "Edit Guest" : "Add Guest"}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {editingId ? "Save" : "Add"}
            </Button>
          </>
        }
      >
        <GuestForm
          initial={formData}
          groups={groups ?? []}
          onChange={setFormData}
        />
        {(createMutation.isError || updateMutation.isError) && (
          <p className="text-sm text-dash-danger mt-3">
            {createMutation.error?.message || updateMutation.error?.message || "Save failed"}
          </p>
        )}
      </Modal>
    </div>
  );
}
