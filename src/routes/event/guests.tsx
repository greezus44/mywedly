import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type EventGuest, type EventRsvp } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Card, Input, EmptyState, LoadingSpinner, ErrorState, Modal } from "../../components/ui";
import { GuestForm, RsvpBadge, type GuestFormValues } from "./guest-form";

export function GuestsPage() {
  const { eventId } = useEventContext();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<EventGuest | null>(null);
  const [search, setSearch] = useState("");

  const { data: guests, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["guests", eventId],
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

  const { data: rsvps } = useQuery({
    queryKey: ["guest-rsvps", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_rsvps")
        .select("guest_id, status")
        .eq("event_id", eventId);
      if (error) throw error;
      return data as Pick<EventRsvp, "guest_id" | "status">[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (values: GuestFormValues) => {
      const payload = {
        event_id: eventId,
        name: values.name,
        email: values.email,
        phone: values.phone,
        username: values.username,
        plus_one_allowed: values.plus_one_allowed,
        plus_one_count: values.plus_one_count,
        notes: values.notes,
      };
      if (editing) {
        const { error } = await supabase
          .from("event_guests")
          .update(payload)
          .eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("event_guests")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests", eventId] });
      queryClient.invalidateQueries({ queryKey: ["analytics-guests", eventId] });
      queryClient.invalidateQueries({ queryKey: ["rsvp-guests", eventId] });
      queryClient.invalidateQueries({ queryKey: ["group-guests", eventId] });
      setShowModal(false);
      setEditing(null);
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
      queryClient.invalidateQueries({ queryKey: ["guests", eventId] });
      queryClient.invalidateQueries({ queryKey: ["analytics-guests", eventId] });
      queryClient.invalidateQueries({ queryKey: ["rsvp-guests", eventId] });
    },
  });

  const openCreate = () => {
    setEditing(null);
    setShowModal(true);
  };

  const openEdit = (guest: EventGuest) => {
    setEditing(guest);
    setShowModal(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner />
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        title="Failed to load guests"
        message={error instanceof Error ? error.message : "An error occurred."}
        onRetry={() => refetch()}
      />
    );
  }

  const rsvpByGuestId = new Map((rsvps ?? []).map((r) => [r.guest_id, r.status]));
  const filteredGuests = (guests ?? []).filter((g) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      g.name.toLowerCase().includes(q) ||
      g.username.toLowerCase().includes(q) ||
      (g.email?.toLowerCase().includes(q) ?? false)
    );
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dash-text">Guests</h2>
          <p className="text-sm text-dash-muted">Manage your guest list.</p>
        </div>
        <Button onClick={openCreate}>Add Guest</Button>
      </div>

      <Input
        placeholder="Search by name, username, or email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {!filteredGuests || filteredGuests.length === 0 ? (
        <EmptyState
          title={search ? "No matching guests" : "No guests yet"}
          message={search ? "Try a different search term." : "Add guests to your event to get started."}
          action={!search ? <Button onClick={openCreate}>Add Guest</Button> : undefined}
        />
      ) : (
        <Card>
          <div className="divide-y divide-dash-border">
            {filteredGuests.map((guest) => (
              <div key={guest.id} className="flex items-center justify-between py-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-dash-text">{guest.name}</p>
                    <RsvpBadge status={rsvpByGuestId.get(guest.id) ?? "no_response"} />
                  </div>
                  <p className="text-xs text-dash-muted">@{guest.username}</p>
                  {guest.email && <p className="text-xs text-dash-muted">{guest.email}</p>}
                  {guest.plus_one_allowed && (
                    <p className="text-xs text-dash-muted">
                      Plus one allowed ({guest.plus_one_count})
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(guest)}
                    className="rounded-md p-1.5 text-dash-muted transition-colors hover:bg-dash-bg hover:text-dash-text"
                    title="Edit"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteMutation.mutate(guest.id)}
                    className="rounded-md p-1.5 text-dash-muted transition-colors hover:bg-dash-bg hover:text-dash-danger"
                    title="Delete"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? "Edit Guest" : "Add Guest"}>
        <GuestForm
          guest={editing}
          onSubmit={(values) => saveMutation.mutate(values)}
          onCancel={() => setShowModal(false)}
          isPending={saveMutation.isPending}
        />
        {saveMutation.isError && (
          <p className="mt-3 text-sm text-dash-danger">
            {saveMutation.error instanceof Error ? saveMutation.error.message : "Failed to save guest."}
          </p>
        )}
      </Modal>
    </div>
  );
}
