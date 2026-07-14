import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type EventGuest, type GuestGroup } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import {
  Input,
  Select,
  Card,
  Modal,
  LoadingSpinner,
  ErrorState,
  EmptyState,
} from "../../components/ui";
import { InvitationManager } from "./invitation-manager";
import {
  guestToForm,
  emptyGuestForm,
  RsvpBadge,
  RSVP_STATUS_OPTIONS,
  SIDE_OPTIONS,
  type GuestFormValues,
} from "./guest-form";
import { cn, generateUsername } from "../../lib/utils";

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

async function createGuest(
  eventId: string,
  form: GuestFormValues
): Promise<void> {
  const token = crypto.randomUUID();
  const username = form.username || generateUsername(form.name);
  const { error } = await supabase.from("event_guests").insert({
    event_id: eventId,
    name: form.name,
    username,
    email: form.email || null,
    phone: form.phone || null,
    group_id: form.group_id || null,
    group_name: form.group_name,
    side: form.side || null,
    rsvp_status: form.rsvp_status,
    plus_ones: form.plus_ones,
    dietary: form.dietary || null,
    message: form.message || null,
    table_number: form.table_number || null,
    token,
  });
  if (error) throw error;
}

async function updateGuest(
  id: string,
  form: GuestFormValues
): Promise<void> {
  const { error } = await supabase
    .from("event_guests")
    .update({
      name: form.name,
      username: form.username || generateUsername(form.name),
      email: form.email || null,
      phone: form.phone || null,
      group_id: form.group_id || null,
      group_name: form.group_name,
      side: form.side || null,
      rsvp_status: form.rsvp_status,
      plus_ones: form.plus_ones,
      dietary: form.dietary || null,
      message: form.message || null,
      table_number: form.table_number || null,
    })
    .eq("id", id);
  if (error) throw error;
}

async function deleteGuest(id: string): Promise<void> {
  const { error } = await supabase.from("event_guests").delete().eq("id", id);
  if (error) throw error;
}

export function GuestsPage() {
  const { eventId } = useEventContext();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingGuest, setEditingGuest] = useState<EventGuest | null>(null);
  const [form, setForm] = useState<GuestFormValues>(emptyGuestForm());
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("all");
  const [showInvitations, setShowInvitations] = useState(false);
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null);

  const { data: guests, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["guests", eventId],
    queryFn: () => fetchGuests(eventId),
  });

  const { data: groups } = useQuery({
    queryKey: ["groups", eventId],
    queryFn: () => fetchGroups(eventId),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingGuest) {
        await updateGuest(editingGuest.id, form);
      } else {
        await createGuest(eventId, form);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests", eventId] });
      setShowModal(false);
      setEditingGuest(null);
      setForm(emptyGuestForm());
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteGuest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests", eventId] });
    },
  });

  const filteredGuests = useMemo(() => {
    if (!guests) return [];
    return guests.filter((guest) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        if (
          !guest.name.toLowerCase().includes(q) &&
          !(guest.email ?? "").toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      if (groupFilter !== "all") {
        if (groupFilter === "none") {
          if (guest.group_id) return false;
        } else if (guest.group_id !== groupFilter) {
          return false;
        }
      }
      return true;
    });
  }, [guests, search, groupFilter]);

  const openCreate = () => {
    setEditingGuest(null);
    setForm(emptyGuestForm());
    setShowModal(true);
  };

  const openEdit = (guest: EventGuest) => {
    setEditingGuest(guest);
    setForm(guestToForm(guest));
    setShowModal(true);
  };

  const openInvitations = (guestId: string) => {
    setSelectedGuestId(guestId);
    setShowInvitations(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dash-text">Guests</h2>
          <p className="text-sm text-dash-muted">
            Manage your guest list and invitations
          </p>
        </div>
        <Button onClick={openCreate}>Add guest</Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
          >
            <option value="all">All groups</option>
            <option value="none">No group</option>
            {groups?.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner className="h-8 w-8" />
        </div>
      )}

      {isError && (
        <ErrorState
          title="Failed to load guests"
          description={error instanceof Error ? error.message : undefined}
          onRetry={() => refetch()}
        />
      )}

      {guests && guests.length === 0 && (
        <EmptyState
          title="No guests yet"
          description="Add guests to your invitation list to get started."
          action={<Button onClick={openCreate}>Add guest</Button>}
        />
      )}

      {guests && guests.length > 0 && filteredGuests.length === 0 && (
        <EmptyState
          title="No matching guests"
          description="Try adjusting your search or filter."
        />
      )}

      {filteredGuests.length > 0 && (
        <div className="space-y-2">
          {filteredGuests.map((guest) => {
            const groupName = groups?.find((g) => g.id === guest.group_id)?.name;
            return (
              <Card key={guest.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-dash-text">{guest.name}</h3>
                      <RsvpBadge status={guest.rsvp_status} />
                    </div>
                    <div className="mt-1 flex flex-wrap gap-3 text-sm text-dash-muted">
                      {guest.email && <span>{guest.email}</span>}
                      {guest.phone && <span>{guest.phone}</span>}
                      {groupName && (
                        <span className="rounded-full bg-dash-bg px-2 py-0.5 text-xs">
                          {groupName}
                        </span>
                      )}
                      {guest.side && (
                        <span className="capitalize">{guest.side}</span>
                      )}
                      {guest.plus_ones > 0 && (
                        <span>+{guest.plus_ones} plus one{guest.plus_ones > 1 ? "s" : ""}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openInvitations(guest.id)}
                    >
                      Invitations
                    </Button>
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

      {/* Create/Edit modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingGuest ? "Edit Guest" : "Add Guest"}
        size="lg"
      >
        <div className="space-y-3">
          <Input
            label="Name"
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Guest name"
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Username"
              type="text"
              value={form.username ?? ""}
              onChange={(e) => setForm({ ...form, username: e.target.value || null })}
              placeholder="Auto-generated"
            />
            <Select
              label="Group"
              value={form.group_id ?? ""}
              onChange={(e) => {
                const groupId = e.target.value || null;
                const groupName = groups?.find((g) => g.id === groupId)?.name ?? null;
                setForm({ ...form, group_id: groupId, group_name: groupName });
              }}
            >
              <option value="">No group</option>
              {groups?.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Email"
              type="email"
              value={form.email ?? ""}
              onChange={(e) => setForm({ ...form, email: e.target.value || null })}
              placeholder="email@example.com"
            />
            <Input
              label="Phone"
              type="tel"
              value={form.phone ?? ""}
              onChange={(e) => setForm({ ...form, phone: e.target.value || null })}
              placeholder="Phone number"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Side"
              value={form.side ?? ""}
              onChange={(e) => setForm({ ...form, side: e.target.value || null })}
            >
              {SIDE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
            <Select
              label="RSVP status"
              value={form.rsvp_status}
              onChange={(e) => setForm({ ...form, rsvp_status: e.target.value })}
            >
              {RSVP_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Plus ones"
              type="number"
              min={0}
              value={form.plus_ones}
              onChange={(e) => setForm({ ...form, plus_ones: Number(e.target.value) || 0 })}
            />
            <Input
              label="Table number"
              type="text"
              value={form.table_number ?? ""}
              onChange={(e) => setForm({ ...form, table_number: e.target.value || null })}
              placeholder="e.g. Table 1"
            />
          </div>
          <Input
            label="Dietary requirements"
            type="text"
            value={form.dietary ?? ""}
            onChange={(e) => setForm({ ...form, dietary: e.target.value || null })}
            placeholder="Allergies or preferences"
          />

          {saveMutation.isError && (
            <p className="text-sm text-dash-danger">
              {saveMutation.error instanceof Error ? saveMutation.error.message : "Save failed"}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              loading={saveMutation.isPending}
              disabled={!form.name.trim()}
            >
              {editingGuest ? "Save changes" : "Add guest"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Invitations modal */}
      <Modal
        open={showInvitations}
        onClose={() => {
          setShowInvitations(false);
          setSelectedGuestId(null);
        }}
        title="Manage Invitations"
        size="lg"
      >
        {selectedGuestId && (
          <InvitationManager eventId={eventId} guestId={selectedGuestId} />
        )}
      </Modal>
    </div>
  );
}
