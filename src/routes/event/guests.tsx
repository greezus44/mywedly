import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type EventGuest, type GuestGroup } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Input, Card, Modal, EmptyState, LoadingSpinner, ErrorState, Badge } from "../../components/ui";
import { GuestForm, RsvpBadge } from "./guest-form";
import { generateUsername } from "../../lib/utils";

export function GuestsPage() {
  const { eventId } = useEventContext();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingGuest, setEditingGuest] = useState<EventGuest | null>(null);
  const [search, setSearch] = useState("");

  const { data: guests, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["guests", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_guests")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as EventGuest[];
    },
    enabled: !!eventId,
  });

  const { data: groups } = useQuery({
    queryKey: ["groups", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guest_groups")
        .select("*")
        .eq("event_id", eventId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as GuestGroup[];
    },
    enabled: !!eventId,
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
    },
  });

  const filteredGuests = (guests ?? []).filter((g) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      g.name?.toLowerCase().includes(q) ||
      g.email?.toLowerCase().includes(q) ||
      g.username?.toLowerCase().includes(q) ||
      g.group_name?.toLowerCase().includes(q)
    );
  });

  const openAdd = () => {
    setEditingGuest(null);
    setShowModal(true);
  };

  const openEdit = (guest: EventGuest) => {
    setEditingGuest(guest);
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
        message={error instanceof Error ? error.message : "An unexpected error occurred."}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dash-text">Guests</h2>
          <p className="text-sm text-dash-muted">Manage your guest list and track RSVPs.</p>
        </div>
        <Button onClick={openAdd}>Add Guest</Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-dash-muted">Total Guests</p>
          <p className="mt-1 text-3xl font-bold text-dash-text">{guests?.length ?? 0}</p>
        </Card>
        <Card>
          <p className="text-sm text-dash-muted">Attending</p>
          <p className="mt-1 text-3xl font-bold text-green-600">
            {guests?.filter((g) => g.rsvp_status === "attending").length ?? 0}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-dash-muted">Declined</p>
          <p className="mt-1 text-3xl font-bold text-red-600">
            {guests?.filter((g) => g.rsvp_status === "declined").length ?? 0}
          </p>
        </Card>
      </div>

      {/* Search */}
      <Input
        placeholder="Search guests by name, email, username…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Guest List */}
      {!filteredGuests || filteredGuests.length === 0 ? (
        <EmptyState
          title={search ? "No guests found" : "No guests yet"}
          description={search ? "Try a different search term." : "Add guests to your event to get started."}
          action={!search ? <Button onClick={openAdd}>Add Guest</Button> : undefined}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-dash-border text-dash-muted">
              <tr>
                <th className="pb-2 pr-4 font-medium">Name</th>
                <th className="pb-2 pr-4 font-medium">Username</th>
                <th className="pb-2 pr-4 font-medium">Group</th>
                <th className="pb-2 pr-4 font-medium">RSVP</th>
                <th className="pb-2 pr-4 font-medium">Plus Ones</th>
                <th className="pb-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredGuests.map((guest) => (
                <tr key={guest.id} className="border-b border-dash-border/50">
                  <td className="py-3 pr-4">
                    <div className="font-medium text-dash-text">{guest.name}</div>
                    {guest.email && <div className="text-xs text-dash-muted">{guest.email}</div>}
                  </td>
                  <td className="py-3 pr-4 text-dash-muted">{guest.username ?? "—"}</td>
                  <td className="py-3 pr-4">
                    {guest.group_name ? <Badge variant="default">{guest.group_name}</Badge> : "—"}
                  </td>
                  <td className="py-3 pr-4"><RsvpBadge status={guest.rsvp_status} /></td>
                  <td className="py-3 pr-4 text-dash-muted">{guest.plus_ones}</td>
                  <td className="py-3">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(guest)}>Edit</Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMutation.mutate(guest.id)}
                        loading={deleteMutation.isPending}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingGuest ? "Edit Guest" : "Add Guest"}
        size="lg"
      >
        <GuestForm
          eventId={eventId}
          guest={editingGuest}
          groups={groups}
          onSaved={() => setShowModal(false)}
          onCancel={() => setShowModal(false)}
        />
      </Modal>
    </div>
  );
}
