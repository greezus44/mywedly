import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type EventGuest, type GuestGroup, type SubEvent } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Card, Input, Select, Modal, Badge, EmptyState, LoadingSpinner, ErrorState } from "../../components/ui";
import { guestToForm, emptyGuestForm, RsvpBadge, type GuestFormFields } from "./guest-form";
import { generateUsername, cn } from "../../lib/utils";

export function GuestsPage() {
  const { eventId } = useEventContext();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<GuestFormFields>(emptyGuestForm());
  const [searchQuery, setSearchQuery] = useState("");
  const [groupFilter, setGroupFilter] = useState("all");

  const { data: guests, isLoading, isError, refetch } = useQuery({
    queryKey: ["event-guests", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_guests")
        .select("*")
        .eq("event_id", eventId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as EventGuest[];
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
      return (data ?? []) as GuestGroup[];
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
      return (data ?? []) as SubEvent[];
    },
    enabled: !!eventId,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const username = form.username || generateUsername(form.name);
      const { error } = await supabase.from("event_guests").insert({
        event_id: eventId,
        name: form.name,
        username,
        email: form.email || null,
        phone: form.phone || null,
        group_name: form.group_name || null,
        side: form.side || null,
        group_id: form.group_id || null,
        rsvp_status: form.rsvp_status,
        plus_ones: form.plus_ones,
        dietary: form.dietary || null,
        message: form.message || null,
        table_number: form.table_number || null,
        token: crypto.randomUUID(),
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
    mutationFn: async () => {
      const { error } = await supabase
        .from("event_guests")
        .update({
          name: form.name,
          username: form.username || generateUsername(form.name),
          email: form.email || null,
          phone: form.phone || null,
          group_name: form.group_name || null,
          side: form.side || null,
          group_id: form.group_id || null,
          rsvp_status: form.rsvp_status,
          plus_ones: form.plus_ones,
          dietary: form.dietary || null,
          message: form.message || null,
          table_number: form.table_number || null,
        })
        .eq("id", editingId!);
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
      const { error } = await supabase.from("event_guests").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-guests", eventId] });
    },
  });

  const filteredGuests = useMemo(() => {
    return (guests ?? []).filter((guest) => {
      if (searchQuery && !guest.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (groupFilter !== "all" && guest.group_id !== groupFilter) return false;
      return true;
    });
  }, [guests, searchQuery, groupFilter]);

  const openEdit = (guest: EventGuest) => {
    setEditingId(guest.id);
    setForm(guestToForm(guest));
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (editingId) updateMutation.mutate();
    else createMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size={32} />
      </div>
    );
  }

  if (isError) {
    return <ErrorState message="Failed to load guests." onRetry={() => refetch()} />;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dash-text">Guests</h2>
          <p className="mt-1 text-sm text-dash-muted">
            Manage your guest list, track RSVPs, and assign guests to groups.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingId(null);
            setForm(emptyGuestForm());
            setShowForm(true);
          }}
        >
          Add Guest
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name..."
          />
          <Select
            label="Filter by Group"
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
          >
            <option value="all">All Groups</option>
            {groups?.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {filteredGuests.length === 0 ? (
        <EmptyState
          title={guests?.length === 0 ? "No guests yet" : "No guests match your filters"}
          description={
            guests?.length === 0
              ? "Add guests to your invitation website to get started."
              : "Try adjusting your search or filter."
          }
          icon={<div className="text-4xl">👥</div>}
          action={
            guests?.length === 0 ? (
              <Button onClick={() => setShowForm(true)}>Add First Guest</Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-2">
          {filteredGuests.map((guest) => {
            const group = groups?.find((g) => g.id === guest.group_id);
            return (
              <Card key={guest.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-dash-text">{guest.name}</span>
                      <RsvpBadge status={guest.rsvp_status} />
                      {group && <Badge variant="default">{group.name}</Badge>}
                      {guest.side && <Badge variant="default">{guest.side}</Badge>}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-3 text-xs text-dash-muted">
                      {guest.username && <span>@{guest.username}</span>}
                      {guest.email && <span>✉️ {guest.email}</span>}
                      {guest.phone && <span>📞 {guest.phone}</span>}
                      {guest.plus_ones > 0 && <span>+{guest.plus_ones} guests</span>}
                      {guest.table_number && <span>Table {guest.table_number}</span>}
                    </div>
                    {/* Invited events as chips */}
                    {subEvents && subEvents.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {subEvents.map((se) => (
                          <span
                            key={se.id}
                            className={cn(
                              "rounded-full border px-2 py-0.5 text-xs",
                              "border-dash-border bg-dash-bg text-dash-muted",
                            )}
                          >
                            {se.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(guest)}>
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm(`Remove ${guest.name} from the guest list?`)) {
                          deleteMutation.mutate(guest.id);
                        }
                      }}
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

      {/* Form Modal */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editingId ? "Edit Guest" : "Add Guest"}
        className="max-w-2xl"
      >
        <div className="space-y-4">
          <Input
            label="Full Name"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Jane Doe"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Username"
              value={form.username}
              onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
              placeholder="jane.doe"
            />
            <Select
              label="Group"
              value={form.group_id}
              onChange={(e) => setForm((prev) => ({ ...prev, group_id: e.target.value }))}
            >
              <option value="">No group</option>
              {groups?.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="jane@example.com"
            />
            <Input
              label="Phone"
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
              placeholder="+1 555 000 0000"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Side"
              value={form.side}
              onChange={(e) => setForm((prev) => ({ ...prev, side: e.target.value }))}
              placeholder="Bride / Groom / Both"
            />
            <Input
              label="Table Number"
              value={form.table_number}
              onChange={(e) => setForm((prev) => ({ ...prev, table_number: e.target.value }))}
              placeholder="Table 1"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="RSVP Status"
              value={form.rsvp_status}
              onChange={(e) => setForm((prev) => ({ ...prev, rsvp_status: e.target.value }))}
            >
              <option value="pending">Pending</option>
              <option value="attending">Attending</option>
              <option value="not_attending">Not Attending</option>
              <option value="no_response">No Response</option>
            </Select>
            <Input
              label="Plus Ones"
              type="number"
              min={0}
              value={form.plus_ones}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, plus_ones: Number(e.target.value) }))
              }
            />
          </div>
          <Input
            label="Dietary Requirements"
            value={form.dietary}
            onChange={(e) => setForm((prev) => ({ ...prev, dietary: e.target.value }))}
            placeholder="Vegetarian, gluten-free, etc."
          />
          {(createMutation.isError || updateMutation.isError) && (
            <p className="text-sm text-dash-danger">
              Error: {((createMutation.error || updateMutation.error) as Error)?.message}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowForm(false)}>
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
