import React, { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type EventGuest, type GuestGroup, type SubEvent, type GuestInvitationOverride } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import {
  Modal,
  Input,
  Select,
  LoadingSpinner,
  ErrorState,
  EmptyState,
  Badge,
} from "../../components/ui";
import {
  EMPTY_GUEST_FORM,
  guestToForm,
  RsvpBadge,
  type GuestFormValues,
} from "./guest-form";
import { generateUsername, cn } from "../../lib/utils";

export default function GuestsPage() {
  const { eventId } = useEventContext();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<GuestFormValues>(EMPTY_GUEST_FORM);
  const [search, setSearch] = useState("");
  const [filterGroupId, setFilterGroupId] = useState<string>("all");
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch guests
  const {
    data: guests,
    isLoading,
    isError,
    error: guestsError,
    refetch,
  } = useQuery({
    queryKey: ["event-guests", eventId],
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

  // Fetch groups
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

  // Fetch group assignments (to determine which guests are invited by group)
  const { data: assignments } = useQuery({
    queryKey: ["all-sub-event-assignments", eventId],
    queryFn: async () => {
      const subEventIds = subEvents?.map((s) => s.id) ?? [];
      if (subEventIds.length === 0) return [];
      const { data, error } = await supabase
        .from("sub_event_group_assignments")
        .select("sub_event_id, group_id")
        .in("sub_event_id", subEventIds);
      if (error) throw error;
      return data as { sub_event_id: string; group_id: string }[];
    },
    enabled: !!subEvents && subEvents.length > 0,
  });

  // Fetch all overrides for this event's guests
  const { data: overrides } = useQuery({
    queryKey: ["all-guest-overrides", eventId],
    queryFn: async () => {
      const subEventIds = subEvents?.map((s) => s.id) ?? [];
      if (subEventIds.length === 0) return [];
      const { data, error } = await supabase
        .from("guest_invitation_overrides")
        .select("*")
        .in("sub_event_id", subEventIds);
      if (error) throw error;
      return data as GuestInvitationOverride[];
    },
    enabled: !!subEvents && subEvents.length > 0,
  });

  // Compute invited sub-events per guest
  const guestInvitedSubEvents = useMemo(() => {
    const map = new Map<string, Set<string>>();
    if (!guests || !subEvents) return map;

    // Group assignments: group_id -> set of sub_event_ids
    const groupToSubEvents = new Map<string, Set<string>>();
    for (const a of assignments ?? []) {
      if (!groupToSubEvents.has(a.group_id)) groupToSubEvents.set(a.group_id, new Set());
      groupToSubEvents.get(a.group_id)!.add(a.sub_event_id);
    }

    // Overrides: guest_id -> map of sub_event_id -> is_invited
    const overrideMap = new Map<string, Map<string, boolean>>();
    for (const o of overrides ?? []) {
      if (!overrideMap.has(o.guest_id)) overrideMap.set(o.guest_id, new Map());
      overrideMap.get(o.guest_id)!.set(o.sub_event_id, o.is_invited);
    }

    for (const guest of guests) {
      const invited = new Set<string>();
      // Check group-based invitations
      if (guest.group_id && groupToSubEvents.has(guest.group_id)) {
        for (const subId of groupToSubEvents.get(guest.group_id)!) {
          invited.add(subId);
        }
      }
      // Apply overrides (manual overrides take precedence)
      const guestOverrides = overrideMap.get(guest.id);
      if (guestOverrides) {
        for (const [subId, isInvited] of guestOverrides) {
          if (isInvited) {
            invited.add(subId);
          } else {
            invited.delete(subId);
          }
        }
      }
      map.set(guest.id, invited);
    }
    return map;
  }, [guests, subEvents, assignments, overrides]);

  const toggleGuestInvitation = useMutation({
    mutationFn: async ({ guestId, subEventId, invited }: { guestId: string; subEventId: string; invited: boolean }) => {
      const existing = overrides?.find(
        (o) => o.guest_id === guestId && o.sub_event_id === subEventId
      );
      if (existing) {
        const { error } = await supabase
          .from("guest_invitation_overrides")
          .update({ is_invited: invited })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("guest_invitation_overrides")
          .insert({ sub_event_id: subEventId, guest_id: guestId, is_invited: invited });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-guest-overrides", eventId] });
    },
    onError: (err: Error) => setError(err.message),
  });

  const validateUsername = useCallback(
    async (username: string, excludeId?: string): Promise<boolean> => {
      if (!username.trim()) return true;
      const { data, error } = await supabase
        .from("event_guests")
        .select("id")
        .eq("event_id", eventId)
        .eq("username", username.trim())
        .neq("id", excludeId ?? "")
        .maybeSingle();
      if (error) return false;
      return !data;
    },
    [eventId]
  );

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!form.name.trim()) throw new Error("Guest name is required.");
      // Validate username uniqueness
      if (form.username.trim()) {
        const isUnique = await validateUsername(form.username.trim());
        if (!isUnique) throw new Error("Username is already taken. Please choose another.");
      }
      const { error } = await supabase.from("event_guests").insert({
        event_id: eventId,
        name: form.name.trim(),
        username: form.username.trim() || null,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        group_id: form.group_id,
        group_name: groups?.find((g) => g.id === form.group_id)?.name ?? null,
        side: form.side || null,
        plus_ones: form.plus_ones,
        rsvp_status: form.rsvp_status,
        dietary: form.dietary.trim() || null,
        message: form.message.trim() || null,
        table_number: form.table_number,
        token: crypto.randomUUID(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-guests", eventId] });
      queryClient.invalidateQueries({ queryKey: ["group-guest-counts", eventId] });
      queryClient.invalidateQueries({ queryKey: ["all-guest-overrides", eventId] });
      setShowModal(false);
      setForm(EMPTY_GUEST_FORM);
      setUsernameError(null);
    },
    onError: (err: Error) => {
      if (err.message.includes("Username")) {
        setUsernameError(err.message);
      } else {
        setError(err.message);
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!form.name.trim()) throw new Error("Guest name is required.");
      if (form.username.trim()) {
        const isUnique = await validateUsername(form.username.trim(), editingId ?? undefined);
        if (!isUnique) throw new Error("Username is already taken. Please choose another.");
      }
      const { error } = await supabase
        .from("event_guests")
        .update({
          name: form.name.trim(),
          username: form.username.trim() || null,
          email: form.email.trim() || null,
          phone: form.phone.trim() || null,
          group_id: form.group_id,
          group_name: groups?.find((g) => g.id === form.group_id)?.name ?? null,
          side: form.side || null,
          plus_ones: form.plus_ones,
          rsvp_status: form.rsvp_status,
          dietary: form.dietary.trim() || null,
          message: form.message.trim() || null,
          table_number: form.table_number,
        })
        .eq("id", editingId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-guests", eventId] });
      queryClient.invalidateQueries({ queryKey: ["group-guest-counts", eventId] });
      queryClient.invalidateQueries({ queryKey: ["all-guest-overrides", eventId] });
      setShowModal(false);
      setForm(EMPTY_GUEST_FORM);
      setEditingId(null);
      setUsernameError(null);
    },
    onError: (err: Error) => {
      if (err.message.includes("Username")) {
        setUsernameError(err.message);
      } else {
        setError(err.message);
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("event_guests").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-guests", eventId] });
      queryClient.invalidateQueries({ queryKey: ["group-guest-counts", eventId] });
      queryClient.invalidateQueries({ queryKey: ["all-guest-overrides", eventId] });
    },
  });

  // Filter and group guests
  const filteredGuests = useMemo(() => {
    if (!guests) return [];
    let result = guests;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (g) =>
          g.name?.toLowerCase().includes(q) ||
          g.username?.toLowerCase().includes(q) ||
          g.email?.toLowerCase().includes(q)
      );
    }
    if (filterGroupId !== "all") {
      if (filterGroupId === "none") {
        result = result.filter((g) => !g.group_id);
      } else {
        result = result.filter((g) => g.group_id === filterGroupId);
      }
    }
    return result;
  }, [guests, search, filterGroupId]);

  const groupedGuests = useMemo(() => {
    const map = new Map<string, EventGuest[]>();
    for (const guest of filteredGuests) {
      const key = guest.group_id ?? "__ungrouped";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(guest);
    }
    return map;
  }, [filteredGuests]);

  const toggleGroupCollapse = (key: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const openCreate = () => {
    setForm(EMPTY_GUEST_FORM);
    setEditingId(null);
    setUsernameError(null);
    setError(null);
    setShowModal(true);
  };

  const openEdit = (guest: EventGuest) => {
    setForm(guestToForm(guest));
    setEditingId(guest.id);
    setUsernameError(null);
    setError(null);
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (editingId) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };

  const handleUsernameBlur = async () => {
    if (!form.username.trim()) {
      setUsernameError(null);
      return;
    }
    const isUnique = await validateUsername(form.username.trim(), editingId ?? undefined);
    setUsernameError(isUnique ? null : "Username is already taken.");
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const mutationError = error ?? (deleteMutation.error as Error | null)?.message;

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState message={guestsError?.message} onRetry={() => refetch()} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-dash-text">Guests</h1>
          <p className="text-sm text-dash-muted">
            Manage your guest list and event invitations.
          </p>
        </div>
        <Button onClick={openCreate}>+ Add Guest</Button>
      </div>

      {mutationError && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-dash-danger">{mutationError}</p>
      )}

      {/* Search & filter */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search guests..."
          className="flex-1"
        />
        <Select
          value={filterGroupId}
          onChange={(e) => setFilterGroupId(e.target.value)}
          className="sm:w-48"
        >
          <option value="all">All Groups</option>
          <option value="none">Ungrouped</option>
          {groups?.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </Select>
      </div>

      {/* Guest list grouped */}
      {!filteredGuests || filteredGuests.length === 0 ? (
        <EmptyState
          title={search || filterGroupId !== "all" ? "No matching guests" : "No guests yet"}
          description={
            search || filterGroupId !== "all"
              ? "Try adjusting your search or filter."
              : "Add guests to start building your guest list."
          }
          icon={<span className="text-4xl">👥</span>}
          action={!search && filterGroupId === "all" ? <Button onClick={openCreate}>+ Add Guest</Button> : undefined}
        />
      ) : (
        <div className="flex flex-col gap-4">
          {Array.from(groupedGuests.entries()).map(([groupKey, groupGuests]) => {
            const group = groups?.find((g) => g.id === groupKey);
            const groupName = groupKey === "__ungrouped" ? "Ungrouped" : group?.name ?? "Unknown";
            const isCollapsed = collapsedGroups.has(groupKey);
            return (
              <div key={groupKey} className="rounded-lg border border-dash-border bg-dash-surface">
                <button
                  type="button"
                  onClick={() => toggleGroupCollapse(groupKey)}
                  className="flex w-full items-center justify-between px-4 py-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{isCollapsed ? "▶" : "▼"}</span>
                    <h3 className="text-sm font-semibold text-dash-text">{groupName}</h3>
                    <Badge variant="info">{groupGuests.length}</Badge>
                  </div>
                </button>
                {!isCollapsed && (
                  <div className="border-t border-dash-border">
                    {groupGuests.map((guest) => {
                      const invitedSubEvents = guestInvitedSubEvents.get(guest.id) ?? new Set<string>();
                      return (
                        <div
                          key={guest.id}
                          className="flex flex-col gap-3 border-b border-dash-border/50 px-4 py-3 last:border-0"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-semibold text-dash-text">{guest.name}</h4>
                                <RsvpBadge status={guest.rsvp_status} />
                                {guest.plus_ones > 0 && (
                                  <Badge variant="default">+{guest.plus_ones}</Badge>
                                )}
                              </div>
                              <div className="mt-1 flex flex-wrap gap-3 text-xs text-dash-muted">
                                {guest.username && <span>@{guest.username}</span>}
                                {guest.email && <span>{guest.email}</span>}
                                {guest.phone && <span>{guest.phone}</span>}
                                {guest.table_number != null && <span>Table {guest.table_number}</span>}
                              </div>
                              {/* Invited events as clickable chips */}
                              {subEvents && subEvents.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                  {subEvents.map((sub) => {
                                    const isInvited = invitedSubEvents.has(sub.id);
                                    return (
                                      <button
                                        key={sub.id}
                                        type="button"
                                        onClick={() =>
                                          toggleGuestInvitation.mutate({
                                            guestId: guest.id,
                                            subEventId: sub.id,
                                            invited: !isInvited,
                                          })
                                        }
                                        disabled={toggleGuestInvitation.isPending}
                                        className={cn(
                                          "rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
                                          isInvited
                                            ? "border-dash-primary bg-dash-primary text-dash-primary-fg"
                                            : "border-dash-border bg-dash-bg text-dash-muted hover:border-dash-primary/50"
                                        )}
                                      >
                                        {isInvited ? "✓ " : ""}
                                        {sub.name}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm" onClick={() => openEdit(guest)}>
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
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Guest modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? "Edit Guest" : "Add Guest"}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button loading={isSaving} onClick={handleSubmit} disabled={!form.name.trim()}>
              {editingId ? "Update" : "Create"}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input
              label="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Guest name"
              autoFocus
            />
          </div>
          <div>
            <Input
              label="Username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              onBlur={handleUsernameBlur}
              placeholder="Auto-generated if empty"
              error={usernameError ?? undefined}
            />
            <button
              type="button"
              onClick={() => setForm({ ...form, username: generateUsername(form.name) })}
              className="mt-1 text-xs text-dash-primary hover:underline"
            >
              Auto-generate
            </button>
          </div>
          <Select
            label="Group"
            value={form.group_id ?? ""}
            onChange={(e) => setForm({ ...form, group_id: e.target.value || null })}
          >
            <option value="">No group</option>
            {groups?.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </Select>
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="guest@example.com"
          />
          <Input
            label="Phone"
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="555-1234"
          />
          <Input
            label="Side"
            value={form.side}
            onChange={(e) => setForm({ ...form, side: e.target.value })}
            placeholder="e.g. Bride / Groom"
          />
          <Input
            label="Plus Ones"
            type="number"
            min={0}
            value={form.plus_ones}
            onChange={(e) => setForm({ ...form, plus_ones: parseInt(e.target.value) || 0 })}
          />
          <Input
            label="Table Number"
            type="number"
            min={0}
            value={form.table_number ?? ""}
            onChange={(e) => setForm({ ...form, table_number: e.target.value ? parseInt(e.target.value) : null })}
          />
          <Select
            label="RSVP Status"
            value={form.rsvp_status}
            onChange={(e) => setForm({ ...form, rsvp_status: e.target.value })}
          >
            <option value="pending">Pending</option>
            <option value="attending">Attending</option>
            <option value="not_attending">Not Attending</option>
            <option value="maybe">Maybe</option>
          </Select>
          <div className="sm:col-span-2">
            <Input
              label="Dietary Requirements"
              value={form.dietary}
              onChange={(e) => setForm({ ...form, dietary: e.target.value })}
              placeholder="e.g. Vegetarian, gluten-free"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
