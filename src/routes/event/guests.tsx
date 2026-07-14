import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type EventGuest, type GuestGroup, type SubEvent } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { GuestForm, RsvpBadge, guestToForm, type GuestFormFields } from "./guest-form";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import {
  Card,
  Modal,
  Badge,
  LoadingSpinner,
  ErrorState,
  EmptyState,
} from "../../components/ui";
import { generateUsername, cn } from "../../lib/utils";

export function GuestsPage() {
  const { eventId } = useEventContext();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<GuestFormFields>(guestToForm({} as EventGuest));
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("all");

  // Fetch guests
  const {
    data: guests,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["event-guests", eventId],
    queryFn: async () => {
      const { data, error: queryError } = await supabase
        .from("event_guests")
        .select("*")
        .eq("event_id", eventId)
        .order("name", { ascending: true });
      if (queryError) throw queryError;
      return data as EventGuest[];
    },
  });

  // Fetch groups
  const { data: groups } = useQuery({
    queryKey: ["guest-groups-for-guests", eventId],
    queryFn: async () => {
      const { data, error: queryError } = await supabase
        .from("guest_groups")
        .select("*")
        .eq("event_id", eventId)
        .order("name", { ascending: true });
      if (queryError) throw queryError;
      return data as GuestGroup[];
    },
  });

  // Fetch sub-events
  const { data: subEvents } = useQuery({
    queryKey: ["sub-events-for-guests", eventId],
    queryFn: async () => {
      const { data, error: queryError } = await supabase
        .from("sub_events")
        .select("*")
        .eq("parent_event_id", eventId)
        .order("display_order", { ascending: true });
      if (queryError) throw queryError;
      return data as SubEvent[];
    },
  });

  // Fetch invitation overrides for all guests
  const { data: overrides } = useQuery({
    queryKey: ["guest-invitation-overrides", eventId],
    queryFn: async () => {
      const { data, error: queryError } = await supabase
        .from("guest_invitation_overrides")
        .select("*")
        .in(
          "guest_id",
          (guests ?? []).map((g) => g.id)
        );
      if (queryError) throw queryError;
      return data;
    },
    enabled: !!guests && guests.length > 0,
  });

  const groupMap = useMemo(() => {
    const map = new Map<string, GuestGroup>();
    for (const g of groups ?? []) {
      map.set(g.id, g);
    }
    return map;
  }, [groups]);

  // Build map of guest_id -> set of invited sub_event_ids (from overrides)
  const invitedMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const o of overrides ?? []) {
      if (o.is_invited) {
        const set = map.get(o.guest_id) ?? new Set<string>();
        set.add(o.sub_event_id);
        map.set(o.guest_id, set);
      }
    }
    return map;
  }, [overrides]);

  const filteredGuests = useMemo(() => {
    if (!guests) return [];
    return guests.filter((g) => {
      if (search && !g.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (groupFilter !== "all" && g.group_id !== groupFilter) return false;
      return true;
    });
  }, [guests, search, groupFilter]);

  const createMutation = useMutation({
    mutationFn: async (input: GuestFormFields) => {
      const guestData = {
        ...formToGuestData(input),
        event_id: eventId,
        username: input.username || generateUsername(input.name),
      };
      const { data, error: createError } = await supabase
        .from("event_guests")
        .insert(guestData)
        .select()
        .single();
      if (createError) throw createError;
      return data as EventGuest;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-guests", eventId] });
      queryClient.invalidateQueries({ queryKey: ["guest-invitation-overrides", eventId] });
      setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (input: GuestFormFields) => {
      const { error: updateError } = await supabase
        .from("event_guests")
        .update(formToGuestData(input))
        .eq("id", editingId!);
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-guests", eventId] });
      setShowForm(false);
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error: deleteError } = await supabase.from("event_guests").delete().eq("id", id);
      if (deleteError) throw deleteError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-guests", eventId] });
    },
  });

  const toggleOverrideMutation = useMutation({
    mutationFn: async (input: { guestId: string; subEventId: string; isInvited: boolean }) => {
      const { error: upsertError } = await supabase
        .from("guest_invitation_overrides")
        .upsert(
          {
            guest_id: input.guestId,
            sub_event_id: input.subEventId,
            is_invited: input.isInvited,
          },
          { onConflict: "guest_id,sub_event_id" }
        );
      if (upsertError) throw upsertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest-invitation-overrides", eventId] });
    },
  });

  function formToGuestData(input: GuestFormFields) {
    return {
      name: input.name,
      username: input.username || null,
      email: input.email || null,
      phone: input.phone || null,
      group_name: input.group_name || null,
      side: input.side || null,
      group_id: input.group_id || null,
      plus_ones: input.plus_ones,
      dietary: input.dietary || null,
      message: input.message || null,
      table_number: input.table_number || null,
      rsvp_status: input.rsvp_status || null,
    };
  }

  const handleEdit = (guest: EventGuest) => {
    setEditingId(guest.id);
    setForm(guestToForm(guest));
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingId(null);
    setForm(guestToForm({} as EventGuest));
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate(form);
    } else {
      createMutation.mutate(form);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState message={error instanceof Error ? error.message : "Failed to load"} onRetry={() => refetch()} />;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-dash-text">Guests</h2>
          <p className="mt-1 text-sm text-dash-muted">
            Manage your guest list and their invitation details.
          </p>
        </div>
        <Button onClick={handleAdd}>+ Add Guest</Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name..."
          />
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-dash-text">Group</span>
            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text"
            >
              <option value="all">All Groups</option>
              {(groups ?? []).map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </Card>

      {!guests || guests.length === 0 ? (
        <EmptyState
          title="No guests yet"
          description="Add guests to your event to start managing invitations."
          icon={<span className="text-4xl">👥</span>}
          action={<Button onClick={handleAdd}>Add Guest</Button>}
        />
      ) : filteredGuests.length === 0 ? (
        <EmptyState
          title="No matching guests"
          description="Try adjusting your search or filter."
          icon={<span className="text-4xl">🔍</span>}
        />
      ) : (
        <div className="space-y-3">
          {filteredGuests.map((guest) => {
            const group = guest.group_id ? groupMap.get(guest.group_id) : null;
            const invitedSet = invitedMap.get(guest.id);

            return (
              <Card key={guest.id} hover>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-dash-text">{guest.name}</h3>
                      <RsvpBadge status={guest.rsvp_status} />
                      {group && <Badge variant="primary">{group.name}</Badge>}
                      {guest.plus_ones > 0 && (
                        <span className="text-xs text-dash-muted">
                          +{guest.plus_ones} plus one{guest.plus_ones > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-3 text-sm text-dash-muted">
                      {guest.email && <span>✉️ {guest.email}</span>}
                      {guest.phone && <span>📞 {guest.phone}</span>}
                      {guest.username && <span>@{guest.username}</span>}
                      {guest.table_number && <span>🍽️ Table {guest.table_number}</span>}
                    </div>
                    {/* Invited events chips */}
                    {subEvents && subEvents.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {subEvents.map((sub) => {
                          const isInvited = invitedSet?.has(sub.id) ?? true;
                          return (
                            <button
                              key={sub.id}
                              type="button"
                              onClick={() =>
                                toggleOverrideMutation.mutate({
                                  guestId: guest.id,
                                  subEventId: sub.id,
                                  isInvited: !isInvited,
                                })
                              }
                              className={cn(
                                "rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
                                isInvited
                                  ? "border-dash-primary bg-dash-primary/10 text-dash-primary"
                                  : "border-dash-border text-dash-muted hover:text-dash-text"
                              )}
                            >
                              {sub.name}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(guest)}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      loading={deleteMutation.isPending}
                      onClick={() => {
                        if (confirm("Delete this guest?")) {
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

      {/* Form modal */}
      <Modal
        open={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingId(null);
        }}
        title={editingId ? "Edit Guest" : "Add Guest"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <GuestForm
            form={form}
            onChange={(patch) => setForm((p) => ({ ...p, ...patch }))}
            groups={groups ?? []}
          />
          {(createMutation.isError || updateMutation.isError) && (
            <p className="text-sm text-dash-danger">
              {createMutation.error instanceof Error
                ? createMutation.error.message
                : updateMutation.error instanceof Error
                ? updateMutation.error.message
                : "Save failed"}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>
              {editingId ? "Save" : "Add"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
