import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type EventGuest } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Card, Input, Badge, LoadingSpinner, ErrorState, EmptyState, Modal } from "../../components/ui";
import { GuestForm, guestToForm, RsvpBadge, type GuestFormValues } from "./guest-form";
import type { EventContextValue } from "./event-layout";

export function GuestsPage() {
  const { eventId } = useOutletContext<EventContextValue>();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingGuest, setEditingGuest] = useState<EventGuest | null>(null);
  const [search, setSearch] = useState("");
  const [filterGroup, setFilterGroup] = useState<string>("");

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
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (values: GuestFormValues) => {
      const payload = {
        event_id: eventId,
        name: values.name,
        username: values.username || null,
        email: values.email || null,
        phone: values.phone || null,
        group_name: values.group_name || null,
        side: values.side || null,
        group_id: values.group_id || null,
        plus_ones: values.plus_ones ?? 0,
        dietary: values.dietary || null,
        message: values.message || null,
        table_number: values.table_number || null,
        rsvp_status: values.rsvp_status || "pending",
      };
      if (editingGuest) {
        const { error } = await supabase
          .from("event_guests")
          .update(payload)
          .eq("id", editingGuest.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("event_guests")
          .insert({ ...payload, token: crypto.randomUUID() });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests", eventId] });
      setShowForm(false);
      setEditingGuest(null);
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
    },
  });

  function handleEdit(guest: EventGuest) {
    setEditingGuest(guest);
    setShowForm(true);
  }

  function handleAdd() {
    setEditingGuest(null);
    setShowForm(true);
  }

  const filtered = guests?.filter((g) => {
    const matchesSearch = !search ||
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      (g.username ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (g.email ?? "").toLowerCase().includes(search.toLowerCase());
    const matchesGroup = !filterGroup || g.group_id === filterGroup;
    return matchesSearch && matchesGroup;
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState message={error?.message ?? "Failed to load guests"} onRetry={refetch} />
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-dash-text">Guests</h2>
          <p className="text-sm text-dash-muted">
            {guests?.length ?? 0} total guest{(guests?.length ?? 0) !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={handleAdd}>Add Guest</Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="Search guests..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <select
          value={filterGroup}
          onChange={(e) => setFilterGroup(e.target.value)}
          className="rounded-md border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text"
        >
          <option value="">All Groups</option>
          {groups?.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
      </div>

      {/* Guest List */}
      {!filtered || filtered.length === 0 ? (
        <EmptyState
          title={search || filterGroup ? "No matching guests" : "No guests yet"}
          description={search || filterGroup ? "Try adjusting your search or filter." : "Add guests to your event to track RSVPs."}
          icon={<span className="text-4xl">👥</span>}
          action={!search && !filterGroup ? <Button onClick={handleAdd}>Add First Guest</Button> : undefined}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((guest) => (
            <Card key={guest.id} className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-dash-text">{guest.name}</h3>
                    <div className="flex flex-wrap gap-2 text-xs text-dash-muted">
                      {guest.username && <span>@{guest.username}</span>}
                      {guest.email && <span>✉️ {guest.email}</span>}
                      {guest.phone && <span>📞 {guest.phone}</span>}
                      {guest.table_number && <span>🪑 Table {guest.table_number}</span>}
                      {guest.plus_ones > 0 && <span>+{guest.plus_ones}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <RsvpBadge status={guest.rsvp_status} />
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(guest)}>
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    loading={deleteMutation.isPending}
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

      {/* Guest Form Modal */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editingGuest ? "Edit Guest" : "Add Guest"}
        size="lg"
      >
        <GuestForm
          eventId={eventId}
          initial={editingGuest ? guestToForm(editingGuest) : undefined}
          onSubmit={(values) => saveMutation.mutate(values)}
          onCancel={() => setShowForm(false)}
          loading={saveMutation.isPending}
          error={saveMutation.isError ? (saveMutation.error?.message ?? "Failed to save") : null}
        />
      </Modal>
    </div>
  );
}

export default GuestsPage;
