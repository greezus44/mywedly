import React, { useState, useMemo, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type EventGuest, type GuestGroup, type SubEvent } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input, Select } from "../../components/ui/Input";
import { Card, Modal, LoadingSpinner, ErrorState, EmptyState, Badge } from "../../components/ui";
import { cn, generateUsername } from "../../lib/utils";
import { RsvpBadge, guestToForm, EMPTY_GUEST_FORM, type GuestFormFields } from "./guest-form";
import type { EventOutletContext } from "./event-layout";

const SIDES = ["", "Bride", "Groom", "Both", "Family", "Friend", "Other"];

export default function Guests(): React.ReactElement {
  const { eventId } = useOutletContext<EventOutletContext>();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [filterGroup, setFilterGroup] = useState<string>("all");
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<GuestFormFields>(EMPTY_GUEST_FORM);
  const [usernameError, setUsernameError] = useState<string | null>(null);

  // Fetch guests
  const { data: guests, isLoading, error } = useQuery({
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

  // Fetch group assignments (for all sub-events of this event)
  const { data: allAssignments } = useQuery({
    queryKey: ["all-sub-event-group-assignments", eventId],
    queryFn: async () => {
      if (!subEvents || subEvents.length === 0) return [];
      const subEventIds = subEvents.map((s) => s.id);
      const { data, error } = await supabase
        .from("sub_event_group_assignments")
        .select("*")
        .in("sub_event_id", subEventIds);
      if (error) throw error;
      return data as { id: string; sub_event_id: string; group_id: string }[];
    },
    enabled: !!subEvents && subEvents.length > 0,
  });

  // Fetch all overrides for this event's guests
  const { data: allOverrides, refetch: refetchOverrides } = useQuery({
    queryKey: ["all-guest-invitation-overrides", eventId],
    queryFn: async () => {
      if (!subEvents || subEvents.length === 0) return [];
      const subEventIds = subEvents.map((s) => s.id);
      const { data, error } = await supabase
        .from("guest_invitation_overrides")
        .select("*")
        .in("sub_event_id", subEventIds);
      if (error) throw error;
      return data as { id: string; sub_event_id: string; guest_id: string; is_invited: boolean }[];
    },
    enabled: !!subEvents && subEvents.length > 0,
  });

  // Check username uniqueness
  async function checkUsername(username: string, excludeId?: string): Promise<boolean> {
    if (!username) return true;
    let query = supabase
      .from("event_guests")
      .select("id")
      .eq("event_id", eventId)
      .eq("username", username);
    if (excludeId) {
      query = query.neq("id", excludeId);
    }
    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    return !data;
  }

  const createMutation = useMutation({
    mutationFn: async () => {
      if (form.username) {
        const isUnique = await checkUsername(form.username);
        if (!isUnique) throw new Error("Username already taken. Please choose another.");
      }
      const token = crypto.randomUUID();
      const { error } = await supabase.from("event_guests").insert({
        event_id: eventId,
        name: form.name,
        username: form.username || null,
        email: form.email || null,
        phone: form.phone || null,
        group_name: form.group_name || null,
        side: form.side || null,
        group_id: form.group_id,
        plus_ones: form.plus_ones || 0,
        table_number: form.table_number,
        token,
        rsvp_status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-guests", eventId] });
      setShowModal(false);
      setForm(EMPTY_GUEST_FORM);
      setEditingId(null);
      setUsernameError(null);
    },
    onError: (err: Error) => setUsernameError(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingId) throw new Error("No guest selected");
      if (form.username) {
        const isUnique = await checkUsername(form.username, editingId);
        if (!isUnique) throw new Error("Username already taken. Please choose another.");
      }
      const { error } = await supabase
        .from("event_guests")
        .update({
          name: form.name,
          username: form.username || null,
          email: form.email || null,
          phone: form.phone || null,
          group_name: form.group_name || null,
          side: form.side || null,
          group_id: form.group_id,
          plus_ones: form.plus_ones || 0,
          table_number: form.table_number,
        })
        .eq("id", editingId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-guests", eventId] });
      setShowModal(false);
      setForm(EMPTY_GUEST_FORM);
      setEditingId(null);
      setUsernameError(null);
    },
    onError: (err: Error) => setUsernameError(err.message),
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

  const toggleOverrideMutation = useMutation({
    mutationFn: async ({ guestId, subEventId, isInvited }: { guestId: string; subEventId: string; isInvited: boolean }) => {
      // Check if override exists
      const { data: existing, error: fetchError } = await supabase
        .from("guest_invitation_overrides")
        .select("id")
        .eq("guest_id", guestId)
        .eq("sub_event_id", subEventId)
        .maybeSingle();
      if (fetchError) throw fetchError;

      if (existing) {
        // Delete override (revert to group-based)
        const { error } = await supabase
          .from("guest_invitation_overrides")
          .delete()
          .eq("guest_id", guestId)
          .eq("sub_event_id", subEventId);
        if (error) throw error;
      } else {
        // Create override
        const { error } = await supabase
          .from("guest_invitation_overrides")
          .insert({ guest_id: guestId, sub_event_id: subEventId, is_invited: isInvited });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      refetchOverrides();
    },
  });

  // Compute invited sub-events per guest
  const guestInvitations = useMemo(() => {
    const map = new Map<string, Map<string, boolean>>();
    const assignmentMap = new Map<string, Set<string>>();
    for (const a of allAssignments ?? []) {
      if (!assignmentMap.has(a.group_id)) assignmentMap.set(a.group_id, new Set());
      assignmentMap.get(a.group_id)!.add(a.sub_event_id);
    }
    const overrideMap = new Map<string, Map<string, boolean>>();
    for (const o of allOverrides ?? []) {
      if (!overrideMap.has(o.guest_id)) overrideMap.set(o.guest_id, new Map());
      overrideMap.get(o.guest_id)!.set(o.sub_event_id, o.is_invited);
    }
    for (const guest of guests ?? []) {
      const subMap = new Map<string, boolean>();
      const guestGroupSubEvents = guest.group_id
        ? assignmentMap.get(guest.group_id) ?? new Set<string>()
        : new Set<string>();
      const guestOverrides = overrideMap.get(guest.id) ?? new Map<string, boolean>();
      for (const sub of subEvents ?? []) {
        if (guestOverrides.has(sub.id)) {
          subMap.set(sub.id, guestOverrides.get(sub.id) ?? false);
        } else {
          subMap.set(sub.id, guestGroupSubEvents.has(sub.id));
        }
      }
      map.set(guest.id, subMap);
    }
    return map;
  }, [guests, subEvents, allAssignments, allOverrides]);

  // Group guests by group
  const groupedGuests = useMemo(() => {
    const filtered = (guests ?? []).filter((g) => {
      if (filterGroup !== "all") {
        if (filterGroup === "ungrouped" && g.group_id) return false;
        if (filterGroup !== "ungrouped" && g.group_id !== filterGroup) return false;
      }
      if (search && !g.name.toLowerCase().includes(search.toLowerCase()) &&
          !(g.username ?? "").toLowerCase().includes(search.toLowerCase()) &&
          !(g.email ?? "").toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      return true;
    });

    const groups_map = new Map<string, EventGuest[]>();
    const ungrouped: EventGuest[] = [];
    for (const guest of filtered) {
      if (guest.group_id) {
        if (!groups_map.has(guest.group_id)) groups_map.set(guest.group_id, []);
        groups_map.get(guest.group_id)!.push(guest);
      } else {
        ungrouped.push(guest);
      }
    }
    return { groups_map, ungrouped };
  }, [guests, search, filterGroup]);

  function handleEdit(guest: EventGuest): void {
    setEditingId(guest.id);
    setForm(guestToForm(guest));
    setUsernameError(null);
    setShowModal(true);
  }

  function handleAdd(): void {
    setEditingId(null);
    setForm(EMPTY_GUEST_FORM);
    setUsernameError(null);
    setShowModal(true);
  }

  function toggleGroupCollapse(groupId: string): void {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const saveError = createMutation.error || updateMutation.error;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error.message} />;
  }

  const renderGuest = (guest: EventGuest) => {
    const invitations = guestInvitations.get(guest.id);
    return (
      <Card key={guest.id} className="py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-dash-text">{guest.name}</h3>
              {guest.username && (
                <Badge variant="default">@{guest.username}</Badge>
              )}
              <RsvpBadge status={guest.rsvp_status} />
              {guest.side && <Badge>{guest.side}</Badge>}
              {guest.plus_ones > 0 && <Badge>+{guest.plus_ones}</Badge>}
            </div>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-dash-muted">
              {guest.email && <span>{guest.email}</span>}
              {guest.phone && <span>{guest.phone}</span>}
              {guest.table_number != null && <span>Table {guest.table_number}</span>}
            </div>
            {/* Invited events as chips */}
            {subEvents && subEvents.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {subEvents.map((sub) => {
                  const isInvited = invitations?.get(sub.id) ?? false;
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
                      disabled={toggleOverrideMutation.isPending}
                      className={cn(
                        "rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
                        isInvited
                          ? "border-dash-primary/30 bg-dash-primary/10 text-dash-primary"
                          : "border-dash-border bg-dash-bg text-dash-muted hover:bg-dash-surface",
                      )}
                      title={isInvited ? "Click to uninvite" : "Click to invite"}
                    >
                      {sub.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <div className="flex gap-1 shrink-0">
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
    );
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dash-text">Guests</h2>
          <p className="mt-1 text-sm text-dash-muted">
            {guests?.length ?? 0} total guests
          </p>
        </div>
        <Button onClick={handleAdd}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Guest
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, username, or email..."
          className="sm:max-w-xs"
        />
        <Select
          value={filterGroup}
          onChange={(e) => setFilterGroup(e.target.value)}
          className="sm:max-w-[200px]"
        >
          <option value="all">All Groups</option>
          <option value="ungrouped">Ungrouped</option>
          {groups?.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </Select>
      </div>

      {/* Guest list */}
      {guests && guests.length > 0 ? (
        <div className="space-y-4">
          {/* Grouped guests */}
          {groups?.map((group) => {
            const groupGuests = groupedGuests.groups_map.get(group.id) ?? [];
            if (groupGuests.length === 0 && filterGroup !== group.id) return null;
            const isCollapsed = collapsedGroups.has(group.id);
            return (
              <div key={group.id}>
                <button
                  onClick={() => toggleGroupCollapse(group.id)}
                  className="flex items-center gap-2 mb-2 text-sm font-semibold text-dash-text hover:text-dash-primary transition-colors"
                >
                  <svg
                    className={cn("h-4 w-4 transition-transform", isCollapsed ? "" : "rotate-90")}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  {group.name}
                  <Badge>{groupGuests.length}</Badge>
                </button>
                {!isCollapsed && (
                  <div className="ml-6 space-y-2">{groupGuests.map(renderGuest)}</div>
                )}
              </div>
            );
          })}
          {/* Ungrouped guests */}
          {groupedGuests.ungrouped.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-dash-text">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-5.13a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Ungrouped
                <Badge>{groupedGuests.ungrouped.length}</Badge>
              </div>
              <div className="ml-6 space-y-2">{groupedGuests.ungrouped.map(renderGuest)}</div>
            </div>
          )}
          {/* No results */}
          {groupedGuests.groups_map.size === 0 && groupedGuests.ungrouped.length === 0 && (
            <Card>
              <EmptyState title="No guests found" description="Try adjusting your search or filter." />
            </Card>
          )}
        </div>
      ) : (
        <Card>
          <EmptyState
            icon={
              <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-5.13a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            }
            title="No guests yet"
            description="Add guests to your event and organize them into groups."
            action={<Button onClick={handleAdd}>Add Guest</Button>}
          />
        </Card>
      )}

      {/* Guest modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? "Edit Guest" : "Add Guest"}
        size="lg"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (editingId) {
              updateMutation.mutate();
            } else {
              createMutation.mutate();
            }
          }}
          className="space-y-4"
        >
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => {
              const name = e.target.value;
              setForm({ ...form, name });
              if (!editingId) {
                setForm((prev) => ({ ...prev, name, username: generateUsername(name) }));
              }
            }}
            placeholder="Guest full name"
            required
            autoFocus
          />
          <Input
            label="Username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            placeholder="auto-generated from name"
            error={usernameError ?? undefined}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="guest@example.com"
            />
            <Input
              label="Phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+1 555-0100"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="Group"
              value={form.group_id ?? ""}
              onChange={(e) => {
                const gid = e.target.value || null;
                const group = groups?.find((g) => g.id === gid);
                setForm({ ...form, group_id: gid, group_name: group?.name ?? "" });
              }}
            >
              <option value="">No group</option>
              {groups?.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </Select>
            <Select
              label="Side"
              value={form.side}
              onChange={(e) => setForm({ ...form, side: e.target.value })}
            >
              {SIDES.map((s) => (
                <option key={s} value={s}>{s || "—"}</option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Plus ones"
              type="number"
              min={0}
              value={String(form.plus_ones)}
              onChange={(e) => setForm({ ...form, plus_ones: Number(e.target.value) })}
            />
            <Input
              label="Table number"
              type="number"
              min={0}
              value={form.table_number != null ? String(form.table_number) : ""}
              onChange={(e) => setForm({ ...form, table_number: e.target.value ? Number(e.target.value) : null })}
              placeholder="—"
            />
          </div>
          {saveError && (
            <div className="rounded-md border border-dash-danger/20 bg-dash-danger/5 px-4 py-3">
              <p className="text-sm text-dash-danger">
                {saveError instanceof Error ? saveError.message : "Failed to save"}
              </p>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={isSaving} disabled={isSaving}>
              {editingId ? "Update" : "Add"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
