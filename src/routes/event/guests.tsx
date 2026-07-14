import { useState, useMemo, type FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type EventGuest, type GuestGroup, type SubEvent } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Input, Select, Textarea, FormField, Card, Modal, LoadingSpinner, ErrorState, EmptyState, Badge } from "../../components/ui";
import { cn } from "../../lib/utils";
import { generateUsername } from "../../lib/utils";
import { guestToForm, emptyGuestForm, RsvpBadge, GUEST_SIDES, type GuestFormValues } from "./guest-form";

export function GuestsPage() {
  const { eventId } = useEventContext();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<GuestFormValues>(emptyGuestForm());
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [invitedSubEvents, setInvitedSubEvents] = useState<Set<string>>(new Set());

  const { data: guests, isLoading, isError, error } = useQuery({
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
    queryKey: ["guest-groups-for-guests", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guest_groups")
        .select("*")
        .eq("event_id", eventId!)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as GuestGroup[];
    },
    enabled: !!eventId,
  });

  const { data: subEvents } = useQuery({
    queryKey: ["sub-events-for-guests", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sub_events")
        .select("*")
        .eq("parent_event_id", eventId!)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as SubEvent[];
    },
    enabled: !!eventId,
  });

  const createMutation = useMutation({
    mutationFn: async (data: GuestFormValues) => {
      const { error } = await supabase
        .from("event_guests")
        .insert({
          event_id: eventId,
          name: data.name,
          username: data.username || generateUsername(data.name),
          email: data.email,
          phone: data.phone,
          group_name: data.group_name,
          side: data.side,
          group_id: data.group_id,
          plus_ones: data.plus_ones,
          dietary: data.dietary,
          message: data.message,
          table_number: data.table_number,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-guests", eventId] });
      setShowForm(false);
      setForm(emptyGuestForm());
      setInvitedSubEvents(new Set());
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: GuestFormValues }) => {
      const { error } = await supabase
        .from("event_guests")
        .update({
          name: data.name,
          username: data.username,
          email: data.email,
          phone: data.phone,
          group_name: data.group_name,
          side: data.side,
          group_id: data.group_id,
          plus_ones: data.plus_ones,
          dietary: data.dietary,
          message: data.message,
          table_number: data.table_number,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-guests", eventId] });
      setShowForm(false);
      setEditingId(null);
      setForm(emptyGuestForm());
      setInvitedSubEvents(new Set());
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

  const groupMap = useMemo(() => {
    const m = new Map<string, string>();
    groups?.forEach((g) => m.set(g.id, g.name));
    return m;
  }, [groups]);

  const filteredGuests = useMemo(() => {
    if (!guests) return [];
    return guests.filter((g) => {
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        if (!g.name.toLowerCase().includes(q)) return false;
      }
      if (groupFilter !== "all" && g.group_id !== groupFilter) return false;
      return true;
    });
  }, [guests, search, groupFilter]);

  function openCreate() {
    setForm(emptyGuestForm());
    setEditingId(null);
    setInvitedSubEvents(new Set());
    setShowForm(true);
  }

  function openEdit(guest: EventGuest) {
    setForm(guestToForm(guest));
    setEditingId(guest.id);
    setInvitedSubEvents(new Set());
    setShowForm(true);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: form });
    } else {
      createMutation.mutate(form);
    }
  }

  function toggleSubEvent(id: string) {
    setInvitedSubEvents((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState message={error instanceof Error ? error.message : "Failed to load guests"} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-dash-text">Guests</h2>
          <p className="mt-1 text-sm text-dash-muted">Manage your guest list and invitations</p>
        </div>
        <Button onClick={openCreate}>Add Guest</Button>
      </div>

      {/* Filters */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search guests..."
        />
        <Select value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)}>
          <option value="all">All Groups</option>
          {groups?.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </Select>
      </div>

      {/* Guest List */}
      {filteredGuests.length === 0 ? (
        <EmptyState
          title={guests && guests.length > 0 ? "No guests match your filters" : "No guests yet"}
          description={
            guests && guests.length > 0
              ? "Try adjusting your search or filter."
              : "Add guests to your event to start managing your guest list."
          }
          action={guests && guests.length === 0 ? <Button onClick={openCreate}>Add Guest</Button> : undefined}
        />
      ) : (
        <div className="space-y-3">
          {filteredGuests.map((guest) => (
            <Card key={guest.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-dash-text">{guest.name}</h3>
                    <RsvpBadge status={guest.rsvp_status} />
                  </div>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-dash-muted">
                    {guest.username && <span>Username: {guest.username}</span>}
                    {guest.email && <span>{guest.email}</span>}
                    {guest.phone && <span>{guest.phone}</span>}
                    {guest.group_id && groupMap.has(guest.group_id) && (
                      <Badge>{groupMap.get(guest.group_id)}</Badge>
                    )}
                    {guest.side && <Badge>{GUEST_SIDES.find((s) => s.value === guest.side)?.label ?? guest.side}</Badge>}
                    {guest.plus_ones > 0 && <span>+{guest.plus_ones} guests</span>}
                    {guest.table_number && <span>Table: {guest.table_number}</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => openEdit(guest)}>
                    Edit
                  </Button>
                  <Button
                    variant="danger"
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

      {/* Form Modal */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editingId ? "Edit Guest" : "Add Guest"}
        className="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Name" required>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                placeholder="Guest full name"
              />
            </FormField>
            <FormField label="Username">
              <Input
                value={form.username ?? ""}
                onChange={(e) => setForm({ ...form, username: e.target.value || null })}
                placeholder="Auto-generated if empty"
              />
            </FormField>
            <FormField label="Email">
              <Input
                type="email"
                value={form.email ?? ""}
                onChange={(e) => setForm({ ...form, email: e.target.value || null })}
                placeholder="guest@example.com"
              />
            </FormField>
            <FormField label="Phone">
              <Input
                value={form.phone ?? ""}
                onChange={(e) => setForm({ ...form, phone: e.target.value || null })}
                placeholder="Phone number"
              />
            </FormField>
            <FormField label="Guest Group">
              <Select
                value={form.group_id ?? ""}
                onChange={(e) => setForm({ ...form, group_id: e.target.value || null })}
              >
                <option value="">No group</option>
                {groups?.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </Select>
            </FormField>
            <FormField label="Side">
              <Select
                value={form.side ?? ""}
                onChange={(e) => setForm({ ...form, side: e.target.value || null })}
              >
                <option value="">Select side</option>
                {GUEST_SIDES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </Select>
            </FormField>
            <FormField label="Plus Ones">
              <Input
                type="number"
                min={0}
                value={form.plus_ones}
                onChange={(e) => setForm({ ...form, plus_ones: parseInt(e.target.value) || 0 })}
              />
            </FormField>
            <FormField label="Table Number">
              <Input
                value={form.table_number ?? ""}
                onChange={(e) => setForm({ ...form, table_number: e.target.value || null })}
                placeholder="Table assignment"
              />
            </FormField>
          </div>

          <FormField label="Dietary Requirements">
            <Textarea
              value={form.dietary ?? ""}
              onChange={(e) => setForm({ ...form, dietary: e.target.value || null })}
              rows={2}
              placeholder="Allergies, dietary needs..."
            />
          </FormField>

          {/* Invited Events as clickable chips */}
          {subEvents && subEvents.length > 0 && (
            <FormField label="Invited Events">
              <div className="flex flex-wrap gap-2">
                {subEvents.map((se) => {
                  const isInvited = invitedSubEvents.has(se.id);
                  return (
                    <button
                      key={se.id}
                      type="button"
                      onClick={() => toggleSubEvent(se.id)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                        isInvited
                          ? "border-dash-primary bg-dash-primary text-dash-primary-fg"
                          : "border-dash-border text-dash-text hover:bg-dash-bg",
                      )}
                    >
                      {se.name}
                    </button>
                  );
                })}
              </div>
            </FormField>
          )}

          {createMutation.isError && (
            <p className="text-sm text-dash-danger">
              {createMutation.error instanceof Error ? createMutation.error.message : "Failed to create"}
            </p>
          )}
          {updateMutation.isError && (
            <p className="text-sm text-dash-danger">
              {updateMutation.error instanceof Error ? updateMutation.error.message : "Failed to update"}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {editingId ? "Update" : "Add"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
