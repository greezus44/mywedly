import React, { useState, useMemo, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type EventGuest, type GuestGroup, type GuestInvitationOverride, type SubEvent } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import {
  Input,
  Modal,
  Card,
  LoadingSpinner,
  ErrorState,
  EmptyState,
  Badge,
} from "../../components/ui";
import { cn, generateUsername } from "../../lib/utils";
import {
  GuestForm,
  guestToForm,
  emptyGuestForm,
  RsvpBadge,
  type GuestFormState,
} from "./guest-form";
import type { EventOutletContext } from "./event-layout";

export default function Guests() {
  const { eventId } = useOutletContext<EventOutletContext>();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [filterGroupId, setFilterGroupId] = useState<string>("all");
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<GuestFormState>(emptyGuestForm());
  const [usernameError, setUsernameError] = useState<string | null>(null);

  // Fetch guests
  const { data: guests, isLoading, error, refetch } = useQuery({
    queryKey: ["event-guests", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_guests")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as EventGuest[];
    },
  });

  // Fetch groups
  const { data: groups } = useQuery({
    queryKey: ["guest-groups", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guest_groups")
        .select("*")
        .eq("event_id", eventId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as GuestGroup[];
    },
  });

  // Fetch sub-events
  const { data: subEvents } = useQuery({
    queryKey: ["sub-events", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sub_events")
        .select("*")
        .eq("parent_event_id", eventId)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as SubEvent[];
    },
  });

  // Fetch invitation overrides — use select("*") to include id field
  const { data: overrides } = useQuery({
    queryKey: ["guest-invitation-overrides", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guest_invitation_overrides")
        .select("*")
        .eq("guest_id", guests?.map((g) => g.id) ?? []);
      if (error) throw error;
      return data as GuestInvitationOverride[];
    },
    enabled: !!guests && guests.length > 0,
  });

  // Fetch group assignments
  const { data: groupAssignments } = useQuery({
    queryKey: ["sub-event-group-assignments", eventId],
    queryFn: async () => {
      const subEventIds = subEvents?.map((s) => s.id) ?? [];
      if (subEventIds.length === 0) return [];
      const { data, error } = await supabase
        .from("sub_event_group_assignments")
        .select("*")
        .in("sub_event_id", subEventIds);
      if (error) throw error;
      return data;
    },
    enabled: !!subEvents && subEvents.length > 0,
  });

  // Build override map: guestId -> { subEventId -> is_invited }
  const overrideMap = useMemo(() => {
    const map = new Map<string, Map<string, boolean>>();
    for (const o of overrides ?? []) {
      if (!map.has(o.guest_id)) map.set(o.guest_id, new Map());
      map.get(o.guest_id)!.set(o.sub_event_id, o.is_invited);
    }
    return map;
  }, [overrides]);

  // Build group assignment map: subEventId -> Set<groupId>
  const groupAssignmentMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const a of groupAssignments ?? []) {
      if (!map.has(a.sub_event_id)) map.set(a.sub_event_id, new Set());
      map.get(a.sub_event_id)!.add(a.group_id);
    }
    return map;
  }, [groupAssignments]);

  // Check if guest is invited to a sub-event
  const isInvitedTo = useCallback(
    (guest: EventGuest, subEventId: string): boolean => {
      const guestOverrides = overrideMap.get(guest.id);
      if (guestOverrides && guestOverrides.has(subEventId)) {
        return guestOverrides.get(subEventId)!;
      }
      // Check group assignment
      if (guest.group_id) {
        const assignedGroups = groupAssignmentMap.get(subEventId);
        if (assignedGroups && assignedGroups.has(guest.group_id)) {
          return true;
        }
      }
      // Default: invited if no assignments exist for this sub-event
      const assignedGroups = groupAssignmentMap.get(subEventId);
      if (!assignedGroups || assignedGroups.size === 0) {
        return true;
      }
      return false;
    },
    [overrideMap, groupAssignmentMap]
  );

  // Toggle invitation override
  const toggleOverride = useMutation({
    mutationFn: async ({
      guestId,
      subEventId,
      isInvited,
    }: {
      guestId: string;
      subEventId: string;
      isInvited: boolean;
    }) => {
      // Check if override exists
      const existing = overrides?.find(
        (o) => o.guest_id === guestId && o.sub_event_id === subEventId
      );
      if (existing) {
        const { error } = await supabase
          .from("guest_invitation_overrides")
          .update({ is_invited: isInvited })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("guest_invitation_overrides")
          .insert({
            guest_id: guestId,
            sub_event_id: subEventId,
            is_invited: isInvited,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest-invitation-overrides", eventId] });
    },
  });

  // Create guest
  const createMutation = useMutation({
    mutationFn: async () => {
      const token = generateUsername(form.name || "guest") + Date.now().toString(36);
      const { error } = await supabase
        .from("event_guests")
        .insert({
          event_id: eventId,
          name: form.name,
          username: form.username || null,
          email: form.email || null,
          phone: form.phone || null,
          group_id: form.group_id || null,
          side: form.side || null,
          rsvp_status: form.rsvp_status,
          plus_ones: form.plus_ones,
          dietary: form.dietary || null,
          message: form.message || null,
          table_number: form.table_number || null,
          token,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-guests", eventId] });
      setModalOpen(false);
      setForm(emptyGuestForm());
      setUsernameError(null);
    },
  });

  // Update guest
  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingId) return;
      const { error } = await supabase
        .from("event_guests")
        .update({
          name: form.name,
          username: form.username || null,
          email: form.email || null,
          phone: form.phone || null,
          group_id: form.group_id || null,
          side: form.side || null,
          rsvp_status: form.rsvp_status,
          plus_ones: form.plus_ones,
          dietary: form.dietary || null,
          message: form.message || null,
          table_number: form.table_number || null,
        })
        .eq("id", editingId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-guests", eventId] });
      setModalOpen(false);
      setEditingId(null);
      setForm(emptyGuestForm());
      setUsernameError(null);
    },
  });

  // Delete guest
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

  // Validate username uniqueness
  const validateUsername = useCallback(
    async (username: string, excludeId?: string) => {
      if (!username) {
        setUsernameError(null);
        return;
      }
      const { data, error } = await supabase
        .from("event_guests")
        .select("id")
        .eq("event_id", eventId)
        .eq("username", username)
        .neq("id", excludeId ?? "")
        .maybeSingle();
      if (error) return;
      if (data) {
        setUsernameError("This username is already taken.");
      } else {
        setUsernameError(null);
      }
    },
    [eventId]
  );

  // Filter and group guests
  const filteredGuests = useMemo(() => {
    let list = guests ?? [];
    if (filterGroupId !== "all") {
      if (filterGroupId === "none") {
        list = list.filter((g) => !g.group_id);
      } else {
        list = list.filter((g) => g.group_id === filterGroupId);
      }
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (g) =>
          g.name.toLowerCase().includes(q) ||
          (g.username ?? "").toLowerCase().includes(q) ||
          (g.email ?? "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [guests, filterGroupId, search]);

  const groupedGuests = useMemo(() => {
    const map = new Map<string, EventGuest[]>();
    for (const guest of filteredGuests) {
      const key = guest.group_id ?? "__ungrouped__";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(guest);
    }
    return map;
  }, [filteredGuests]);

  const toggleCollapse = (key: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleAdd = () => {
    setEditingId(null);
    setForm(emptyGuestForm());
    setUsernameError(null);
    setModalOpen(true);
  };

  const handleEdit = (guest: EventGuest) => {
    setEditingId(guest.id);
    setForm(guestToForm(guest));
    setUsernameError(null);
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (editingId) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };

  const handleAutoUsername = () => {
    const username = generateUsername(form.name || "guest");
    setForm({ ...form, username });
    validateUsername(username, editingId ?? undefined);
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <ErrorState
          title="Failed to load guests"
          message={error.message}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl space-y-6 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-dash-text">Guests</h2>
            <p className="mt-1 text-sm text-dash-muted">
              {guests?.length ?? 0} total guests
            </p>
          </div>
          <Button onClick={handleAdd}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Guest
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search guests..."
            className="flex-1"
          />
          <select
            value={filterGroupId}
            onChange={(e) => setFilterGroupId(e.target.value)}
            className="rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text focus:outline-none focus:ring-2 focus:ring-dash-primary/30"
          >
            <option value="all">All groups</option>
            <option value="none">Ungrouped</option>
            {groups?.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>

        {/* Guest list grouped */}
        {filteredGuests.length > 0 ? (
          <div className="space-y-4">
            {Array.from(groupedGuests.entries()).map(([groupKey, groupGuests]) => {
              const groupName =
                groupKey === "__ungrouped__"
                  ? "Ungrouped"
                  : groups?.find((g) => g.id === groupKey)?.name ?? "Unknown";
              const isCollapsed = collapsedGroups.has(groupKey);
              return (
                <div key={groupKey}>
                  <button
                    onClick={() => toggleCollapse(groupKey)}
                    className="flex w-full items-center gap-2 rounded-lg bg-dash-surface px-3 py-2 text-left"
                  >
                    <svg
                      className={cn("h-4 w-4 transition-transform", isCollapsed && "-rotate-90")}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                    <span className="font-semibold text-dash-text">{groupName}</span>
                    <Badge>{groupGuests.length}</Badge>
                  </button>
                  {!isCollapsed && (
                    <div className="mt-2 space-y-2">
                      {groupGuests.map((guest) => (
                        <Card key={guest.id} className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-dash-text">
                                  {guest.name}
                                </h3>
                                <RsvpBadge status={guest.rsvp_status} />
                              </div>
                              <div className="mt-1 flex flex-wrap gap-2 text-xs text-dash-muted">
                                {guest.email && <span>{guest.email}</span>}
                                {guest.phone && <span>{guest.phone}</span>}
                                {guest.username && <span>@{guest.username}</span>}
                                {guest.table_number && <span>Table: {guest.table_number}</span>}
                              </div>
                              {/* Invited events chips */}
                              {subEvents && subEvents.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-1.5">
                                  {subEvents.map((se) => {
                                    const invited = isInvitedTo(guest, se.id);
                                    return (
                                      <button
                                        key={se.id}
                                        onClick={() =>
                                          toggleOverride.mutate({
                                            guestId: guest.id,
                                            subEventId: se.id,
                                            isInvited: !invited,
                                          })
                                        }
                                        className={cn(
                                          "rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
                                          invited
                                            ? "border-dash-primary bg-dash-primary/10 text-dash-primary"
                                            : "border-dash-border text-dash-muted hover:bg-dash-bg"
                                        )}
                                      >
                                        {se.name}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" onClick={() => handleEdit(guest)}>
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteMutation.mutate(guest.id)}
                              >
                                <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.107 48.107 0 013.478-.397m7.5 0v-.916c0-1.616-1.314-2.9-2.94-2.9H10.5c-1.626 0-2.94 1.284-2.94 2.9v.916" />
                                </svg>
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title={search || filterGroupId !== "all" ? "No matching guests" : "No guests yet"}
            description={
              search || filterGroupId !== "all"
                ? "Try adjusting your search or filter."
                : "Add guests to start managing your invitation list."
            }
            action={<Button onClick={handleAdd}>Add First Guest</Button>}
          />
        )}
      </div>

      {/* Add/Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit Guest" : "Add Guest"}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              loading={createMutation.isPending || updateMutation.isPending}
              disabled={!form.name.trim() || !!usernameError}
            >
              {editingId ? "Update" : "Add"}
            </Button>
          </>
        }
      >
        <GuestForm
          form={form}
          setForm={(f) => {
            setForm(f);
            if (f.username !== form.username) {
              validateUsername(f.username, editingId ?? undefined);
            }
          }}
          groups={groups ?? []}
          usernameError={usernameError}
          onAutoUsername={handleAutoUsername}
        />
      </Modal>
    </div>
  );
}
