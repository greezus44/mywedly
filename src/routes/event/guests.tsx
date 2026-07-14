import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type EventGuest, type GuestGroup, type SubEvent } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Input, Modal, Card, Badge, EmptyState, LoadingSpinner, ErrorState } from "../../components/ui";
import {
  GuestForm,
  guestToForm,
  emptyGuestForm,
  RsvpBadge,
  type GuestFormFields,
} from "./guest-form";
import { resolveGuestInvitations, getInvitedSubEventIds } from "../../lib/invitations";
import { cn } from "../../lib/utils";

export function GuestsPage() {
  const { eventId } = useEventContext();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<GuestFormFields>(emptyGuestForm());
  const [search, setSearch] = useState("");

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
        .eq("event_id", eventId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as EventGuest[];
    },
    enabled: !!eventId,
  });

  const { data: groups } = useQuery({
    queryKey: ["guest-groups", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guest_groups")
        .select("*")
        .eq("event_id", eventId!);
      if (error) throw error;
      return data as GuestGroup[];
    },
    enabled: !!eventId,
  });

  const { data: subEvents } = useQuery({
    queryKey: ["sub-events", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sub_events")
        .select("*")
        .eq("parent_event_id", eventId!);
      if (error) throw error;
      return data as SubEvent[];
    },
    enabled: !!eventId,
  });

  // Invitation overrides per guest
  const { data: overrides } = useQuery({
    queryKey: ["guest-invitation-overrides", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guest_invitation_overrides")
        .select("*")
        .in(
          "sub_event_id",
          (subEvents ?? []).map((se) => se.id)
        );
      if (error) throw error;
      return data as { id: string; sub_event_id: string; guest_id: string; is_invited: boolean }[];
    },
    enabled: !!eventId && (subEvents?.length ?? 0) > 0,
  });

  const createMutation = useMutation({
    mutationFn: async (formData: GuestFormFields) => {
      const { error } = await supabase
        .from("event_guests")
        .insert({
          event_id: eventId,
          name: formData.name,
          username: formData.username || null,
          email: formData.email || null,
          phone: formData.phone || null,
          side: formData.side || null,
          group_id: formData.group_id || null,
          group_name: formData.group_name || null,
          table_number: formData.table_number || null,
          dietary: formData.dietary || null,
          message: formData.message || null,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-guests", eventId] });
      setShowForm(false);
      setForm(emptyGuestForm());
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: GuestFormFields }) => {
      const { error } = await supabase
        .from("event_guests")
        .update({
          name: formData.name,
          username: formData.username || null,
          email: formData.email || null,
          phone: formData.phone || null,
          side: formData.side || null,
          group_id: formData.group_id || null,
          group_name: formData.group_name || null,
          table_number: formData.table_number || null,
          dietary: formData.dietary || null,
          message: formData.message || null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-guests", eventId] });
      setShowForm(false);
      setEditingId(null);
      setForm(emptyGuestForm());
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

  const handleSubmit = () => {
    if (!form.name.trim()) return;
    if (editingId) {
      updateMutation.mutate({ id: editingId, formData: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleEdit = (guest: EventGuest) => {
    setEditingId(guest.id);
    setForm(guestToForm(guest));
    setShowForm(true);
  };

  // Get invited sub-event IDs for a guest from overrides
  const getInvitedSubEvents = (guestId: string): SubEvent[] => {
    if (!subEvents || !overrides) return [];
    const invitedIds = overrides
      .filter((o) => o.guest_id === guestId && o.is_invited)
      .map((o) => o.sub_event_id);
    return subEvents.filter((se) => invitedIds.includes(se.id));
  };

  // Filtered guests by search
  const filteredGuests = useMemo(() => {
    if (!search.trim()) return guests ?? [];
    const q = search.toLowerCase();
    return (guests ?? []).filter(
      (g) =>
        (g.name ?? "").toLowerCase().includes(q) ||
        (g.email ?? "").toLowerCase().includes(q) ||
        (g.username ?? "").toLowerCase().includes(q)
    );
  }, [guests, search]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (isError) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-dash-text">Guests</h2>
        <Button
          onClick={() => {
            setForm(emptyGuestForm());
            setEditingId(null);
            setShowForm(true);
          }}
        >
          Add Guest
        </Button>
      </div>

      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search guests..."
        className="max-w-sm"
      />

      {guests && guests.length === 0 ? (
        <EmptyState
          title="No guests yet"
          description="Add guests to your invitation website."
          action={
            <Button
              onClick={() => {
                setForm(emptyGuestForm());
                setEditingId(null);
                setShowForm(true);
              }}
            >
              Add Guest
            </Button>
          }
        />
      ) : filteredGuests.length === 0 ? (
        <EmptyState title="No matching guests" description="Try a different search." />
      ) : (
        <div className="space-y-3">
          {filteredGuests.map((guest) => {
            const invitedSubEvents = getInvitedSubEvents(guest.id);
            const groupName = groups?.find((g) => g.id === guest.group_id)?.name;
            return (
              <Card key={guest.id}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-dash-text">
                        {guest.name}
                      </h3>
                      <RsvpBadge status={guest.rsvp_status} />
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-dash-muted">
                      {guest.email && <span>{guest.email}</span>}
                      {guest.phone && <span>{guest.phone}</span>}
                      {guest.username && <span>Username: {guest.username}</span>}
                      {groupName && <span>Group: {groupName}</span>}
                      {guest.table_number && <span>Table: {guest.table_number}</span>}
                    </div>
                    {invitedSubEvents.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {invitedSubEvents.map((se) => (
                          <Badge key={se.id} color="primary">
                            {se.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleEdit(guest)}
                    >
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
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingId(null);
        }}
        title={editingId ? "Edit Guest" : "Add Guest"}
        size="lg"
      >
        <div className="space-y-4">
          <GuestForm
            form={form}
            setForm={setForm}
            groups={groups ?? []}
          />
          {(createMutation.isError || updateMutation.isError) && (
            <p className="text-sm text-red-600">Failed to save</p>
          )}
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              loading={createMutation.isPending || updateMutation.isPending}
              disabled={!form.name.trim()}
            >
              {editingId ? "Update" : "Add"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
