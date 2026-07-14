import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type EventGuest, type GuestGroup, type SubEvent } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Input";
import {
  Card,
  Modal,
  LoadingSpinner,
  ErrorState,
  EmptyState,
  Badge,
} from "../../components/ui";
import { GuestForm, guestToForm, type GuestFormFields, RsvpBadge } from "./guest-form";
import { generateUsername } from "../../lib/utils";

export function GuestsPage() {
  const { eventId } = useEventContext();
  const queryClient = useQueryClient();
  const [showEdit, setShowEdit] = useState(false);
  const [editing, setEditing] = useState<EventGuest | null>(null);
  const [search, setSearch] = useState("");
  const [filterGroup, setFilterGroup] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const { data: guests, isLoading, isError, error } = useQuery({
    queryKey: ["guests", eventId],
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
    queryKey: ["groups", eventId],
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

  const groupMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const g of groups ?? []) m.set(g.id, g.name);
    return m;
  }, [groups]);

  const filtered = useMemo(() => {
    if (!guests) return [];
    return guests.filter((g) => {
      if (search) {
        const q = search.toLowerCase();
        const match =
          g.name?.toLowerCase().includes(q) ||
          g.email?.toLowerCase().includes(q) ||
          g.username?.toLowerCase().includes(q) ||
          g.phone?.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (filterGroup && g.group_id !== filterGroup) return false;
      if (filterStatus && g.rsvp_status !== filterStatus) return false;
      return true;
    });
  }, [guests, search, filterGroup, filterStatus]);

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

  const handleAdd = () => {
    setEditing(null);
    setShowEdit(true);
  };

  const handleEdit = (guest: EventGuest) => {
    setEditing(guest);
    setShowEdit(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState title="Failed to load guests" description={error instanceof Error ? error.message : undefined} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-dash-text">Guests</h2>
        <Button onClick={handleAdd}>Add Guest</Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Input
          placeholder="Search by name, email, username..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select value={filterGroup} onChange={(e) => setFilterGroup(e.target.value)}>
          <option value="">All groups</option>
          {groups?.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </Select>
        <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="declined">Declined</option>
          <option value="maybe">Maybe</option>
        </Select>
      </div>

      {guests && guests.length === 0 ? (
        <EmptyState
          title="No guests yet"
          description="Add guests to your event and assign them to groups."
          action={<Button onClick={handleAdd}>Add Guest</Button>}
        />
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-dash-muted">No guests match your filters.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((guest) => (
            <Card key={guest.id} className="p-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-dash-text">{guest.name}</h3>
                    <RsvpBadge status={guest.rsvp_status} />
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-dash-muted">
                    {guest.username && <span>@{guest.username}</span>}
                    {guest.email && <span>✉️ {guest.email}</span>}
                    {guest.phone && <span>📞 {guest.phone}</span>}
                    {guest.group_id && groupMap.has(guest.group_id) && (
                      <span className="inline-flex items-center gap-1">
                        <Badge>{groupMap.get(guest.group_id)}</Badge>
                      </span>
                    )}
                    {guest.plus_ones > 0 && <span>+{guest.plus_ones} plus ones</span>}
                    {guest.table_number && <span>Table {guest.table_number}</span>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => handleEdit(guest)}>Edit</Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-dash-danger"
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

      {showEdit && (
        <GuestEditor
          eventId={eventId}
          guest={editing}
          groups={groups ?? []}
          onClose={() => setShowEdit(false)}
        />
      )}
    </div>
  );
}

function GuestEditor({
  eventId,
  guest,
  groups,
  onClose,
}: {
  eventId: string;
  guest: EventGuest | null;
  groups: GuestGroup[];
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [fields, setFields] = useState<GuestFormFields>(guestToForm(guest));

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        event_id: eventId,
        name: fields.name,
        username: fields.username || generateUsername(fields.name),
        email: fields.email || null,
        phone: fields.phone || null,
        group_name: fields.group_name || null,
        side: fields.side || null,
        group_id: fields.group_id || null,
        rsvp_status: fields.rsvp_status,
        plus_ones: fields.plus_ones,
        dietary: fields.dietary || null,
        message: fields.message || null,
        table_number: fields.table_number || null,
      };
      if (guest) {
        const { error } = await supabase
          .from("event_guests")
          .update(payload)
          .eq("id", guest.id);
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
      onClose();
    },
  });

  return (
    <Modal open onClose={onClose} title={guest ? "Edit Guest" : "Add Guest"} size="lg">
      <div className="space-y-4">
        <GuestForm
          fields={fields}
          onChange={setFields}
          groups={groups}
        />
        {saveMutation.isError && (
          <p className="text-sm text-dash-danger">
            {saveMutation.error instanceof Error ? saveMutation.error.message : "Save failed"}
          </p>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => saveMutation.mutate()}
            loading={saveMutation.isPending}
            disabled={!fields.name.trim()}
          >
            {guest ? "Update" : "Add"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
