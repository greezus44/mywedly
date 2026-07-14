import { useState, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventGuest, type GuestGroup } from "../../lib/supabase";
import { cn } from "../../lib/utils";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import {
  Modal,
  LoadingSpinner,
  ErrorState,
  EmptyState,
  IconButton,
} from "../../components/ui";
import {
  GuestForm,
  guestToForm,
  RsvpBadge,
  type GuestFormState,
} from "./guest-form";

export default function Guests() {
  const { eventId } = useOutletContext<{ event: UserEvent; eventId: string }>();
  const queryClient = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterGroup, setFilterGroup] = useState<string>("");
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const { data: guests, isLoading, isError } = useQuery({
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

  const saveMutation = useMutation({
    mutationFn: async (form: GuestFormState) => {
      const payload = {
        event_id: eventId,
        name: form.name,
        username: form.username || null,
        email: form.email || null,
        phone: form.phone || null,
        group_id: form.group_id || null,
        group_name: form.group_name || null,
        side: form.side || null,
        plus_ones: form.plus_ones,
        dietary: form.dietary || null,
        message: form.message || null,
        rsvp_status: form.rsvp_status,
        table_number: form.table_number ? Number(form.table_number) : null,
      };
      if (editingId) {
        const { error } = await supabase
          .from("event_guests")
          .update(payload)
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("event_guests").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests", eventId] });
      setShowModal(false);
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
      queryClient.invalidateQueries({ queryKey: ["guests", eventId] });
    },
  });

  const isUsernameTaken = (username: string, excludeId?: string) => {
    if (!guests) return false;
    return guests.some(
      (g) => g.username === username && g.id !== excludeId
    );
  };

  const filteredGuests = useMemo(() => {
    if (!guests) return [];
    return guests.filter((g) => {
      const matchesSearch =
        !search ||
        g.name.toLowerCase().includes(search.toLowerCase()) ||
        (g.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (g.username ?? "").toLowerCase().includes(search.toLowerCase());
      const matchesGroup =
        !filterGroup || g.group_id === filterGroup;
      return matchesSearch && matchesGroup;
    });
  }, [guests, search, filterGroup]);

  const groupedGuests = useMemo(() => {
    const map = new Map<string, { group: GuestGroup | null; guests: EventGuest[] }>();
    for (const g of filteredGuests) {
      const key = g.group_id ?? "__ungrouped__";
      if (!map.has(key)) {
        const group = groups?.find((gr) => gr.id === g.group_id) ?? null;
        map.set(key, { group, guests: [] });
      }
      map.get(key)!.guests.push(g);
    }
    return Array.from(map.entries()).sort((a, b) => {
      const aOrder = a[1].group?.sort_order ?? 999;
      const bOrder = b[1].group?.sort_order ?? 999;
      return aOrder - bOrder;
    });
  }, [filteredGuests, groups]);

  const toggleGroup = (key: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const openCreate = () => {
    setEditingId(null);
    setShowModal(true);
  };

  const openEdit = (guest: EventGuest) => {
    setEditingId(guest.id);
    setShowModal(true);
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (isError) {
    return <ErrorState title="Failed to load guests" />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Guests</h2>
          <p className="text-sm text-muted">
            Manage your guest list. {guests?.length ?? 0} total guests.
          </p>
        </div>
        <Button onClick={openCreate}>Add Guest</Button>
      </div>

      {/* Search & filter */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or username..."
          />
        </div>
        <div className="sm:w-56">
          <select
            value={filterGroup}
            onChange={(e) => setFilterGroup(e.target.value)}
            className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground focus:border-primary focus:outline-none"
          >
            <option value="">All Groups</option>
            {groups?.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Guest list grouped by group */}
      {filteredGuests.length > 0 ? (
        <div className="flex flex-col gap-4">
          {groupedGuests.map(([key, { group, guests: groupGuests }]) => {
            const isCollapsed = collapsedGroups.has(key);
            return (
              <div
                key={key}
                className="overflow-hidden rounded-lg border border-border bg-surface"
              >
                <button
                  onClick={() => toggleGroup(key)}
                  className="flex w-full items-center justify-between bg-surface-alt px-4 py-3 text-left hover:bg-muted/10"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      {isCollapsed ? "▶" : "▼"}
                    </span>
                    <span className="font-semibold text-foreground">
                      {group?.name ?? "Ungrouped"}
                    </span>
                    <span className="text-xs text-muted">
                      ({groupGuests.length})
                    </span>
                  </div>
                </button>
                {!isCollapsed && (
                  <div className="divide-y divide-border">
                    {groupGuests.map((guest) => (
                      <div
                        key={guest.id}
                        className="flex items-center justify-between px-4 py-3"
                      >
                        <div className="flex flex-1 flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">
                              {guest.name}
                            </span>
                            <RsvpBadge status={guest.rsvp_status} />
                          </div>
                          <div className="flex flex-wrap gap-3 text-xs text-muted">
                            {guest.email && <span>✉ {guest.email}</span>}
                            {guest.phone && <span>📞 {guest.phone}</span>}
                            {guest.username && <span>@{guest.username}</span>}
                            {guest.plus_ones > 0 && (
                              <span>+{guest.plus_ones} guest{guest.plus_ones > 1 ? "s" : ""}</span>
                            )}
                            {guest.table_number !== null && (
                              <span>🪑 Table {guest.table_number}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <IconButton onClick={() => openEdit(guest)} title="Edit">
                            ✏️
                          </IconButton>
                          <IconButton
                            onClick={() => deleteMutation.mutate(guest.id)}
                            title="Delete"
                            className="hover:text-danger"
                          >
                            🗑
                          </IconButton>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No guests found"
          description={
            search || filterGroup
              ? "Try adjusting your search or filter."
              : "Add guests to your list to get started."
          }
          action={
            !search && !filterGroup ? (
              <Button onClick={openCreate}>Add Guest</Button>
            ) : undefined
          }
        />
      )}

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? "Edit Guest" : "Add Guest"}
        size="lg"
      >
        <GuestForm
          initial={guestToForm(guests?.find((g) => g.id === editingId) ?? null)}
          groups={groups ?? []}
          onSubmit={(form) => saveMutation.mutate(form)}
          onCancel={() => setShowModal(false)}
          loading={saveMutation.isPending}
          error={
            saveMutation.isError
              ? saveMutation.error instanceof Error
                ? saveMutation.error.message
                : "Failed to save"
              : null
          }
          isUsernameTaken={isUsernameTaken}
          editingId={editingId}
        />
      </Modal>
    </div>
  );
}
