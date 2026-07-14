import { useState, useMemo, useEffect, type FormEvent } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import {
  supabase,
  type EventGuest,
  type GuestGroup,
  type SubEvent,
  type GuestInvitationOverride,
} from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Input, Select, Textarea } from "../../components/ui/Input";
import {
  Modal,
  LoadingSpinner,
  ErrorState,
  EmptyState,
  Card,
  Badge,
} from "../../components/ui";
import {
  guestToForm,
  emptyGuestForm,
  RsvpBadge,
  InvitedChip,
  type GuestFormValues,
} from "./guest-form";
import { generateUsername, cn } from "../../lib/utils";

async function fetchGuests(eventId: string): Promise<EventGuest[]> {
  const { data, error } = await supabase
    .from("event_guests")
    .select("*")
    .eq("event_id", eventId)
    .order("name", { ascending: true });
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

async function fetchSubEvents(eventId: string): Promise<SubEvent[]> {
  const { data, error } = await supabase
    .from("sub_events")
    .select("*")
    .eq("parent_event_id", eventId)
    .order("display_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as SubEvent[];
}

export default function Guests() {
  const { eventId } = useEventContext();
  const queryClient = useQueryClient();

  const { data: guests, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["event_guests", eventId],
    queryFn: () => fetchGuests(eventId),
  });

  const { data: groups } = useQuery({
    queryKey: ["guest_groups", eventId],
    queryFn: () => fetchGroups(eventId),
  });

  const { data: subEvents } = useQuery({
    queryKey: ["sub_events", eventId],
    queryFn: () => fetchSubEvents(eventId),
  });

  const [search, setSearch] = useState("");
  const [filterGroup, setFilterGroup] = useState<string>("all");
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<EventGuest | null>(null);
  const [form, setForm] = useState<GuestFormValues>(emptyGuestForm());
  const [usernameError, setUsernameError] = useState<string | null>(null);

  // Fetch overrides for all guests
  const { data: overrides } = useQuery<GuestInvitationOverride[]>({
    queryKey: ["guest_invitation_overrides", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guest_invitation_overrides")
        .select("*")
        .in(
          "sub_event_id",
          (subEvents ?? []).map((s) => s.id)
        );
      if (error) throw error;
      return (data ?? []) as GuestInvitationOverride[];
    },
    enabled: !!subEvents && subEvents.length > 0,
  });

  // Fetch group assignments
  const { data: groupAssignments } = useQuery({
    queryKey: ["sub_event_group_assignments_all", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sub_event_group_assignments")
        .select("*")
        .in(
          "sub_event_id",
          (subEvents ?? []).map((s) => s.id)
        );
      if (error) throw error;
      return (data ?? []) as { sub_event_id: string; group_id: string }[];
    },
    enabled: !!subEvents && subEvents.length > 0,
  });

  // Compute invited sub-events per guest
  const guestInvitations = useMemo(() => {
    const map = new Map<string, Map<string, boolean>>();
    if (!guests) return map;

    const assignmentMap = new Map<string, Set<string>>();
    for (const a of groupAssignments ?? []) {
      if (!assignmentMap.has(a.group_id)) assignmentMap.set(a.group_id, new Set());
      assignmentMap.get(a.group_id)!.add(a.sub_event_id);
    }

    const overrideMap = new Map<string, Map<string, boolean>>();
    for (const o of overrides ?? []) {
      if (!overrideMap.has(o.guest_id)) overrideMap.set(o.guest_id, new Map());
      overrideMap.get(o.guest_id)!.set(o.sub_event_id, o.is_invited);
    }

    for (const guest of guests) {
      const invited = new Map<string, boolean>();
      for (const sub of subEvents ?? []) {
        const override = overrideMap.get(guest.id)?.get(sub.id);
        if (override !== undefined) {
          invited.set(sub.id, override);
        } else if (guest.group_id && assignmentMap.has(guest.group_id)) {
          invited.set(sub.id, assignmentMap.get(guest.group_id)!.has(sub.id));
        } else {
          invited.set(sub.id, false);
        }
      }
      map.set(guest.id, invited);
    }
    return map;
  }, [guests, subEvents, overrides, groupAssignments]);

  // Filtered guests
  const filtered = useMemo(() => {
    if (!guests) return [];
    return guests.filter((g) => {
      const matchesSearch =
        !search ||
        g.name.toLowerCase().includes(search.toLowerCase()) ||
        (g.username ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (g.email ?? "").toLowerCase().includes(search.toLowerCase());
      const matchesGroup =
        filterGroup === "all" || g.group_id === filterGroup || (filterGroup === "none" && !g.group_id);
      return matchesSearch && matchesGroup;
    });
  }, [guests, search, filterGroup]);

  // Group guests by group_id
  const groupedGuests = useMemo(() => {
    const map = new Map<string, EventGuest[]>();
    for (const g of filtered) {
      const key = g.group_id ?? "__none__";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(g);
    }
    return map;
  }, [filtered]);

  const toggleCollapse = (key: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Mutations
  const saveMutation = useMutation({
    mutationFn: async () => {
      // Check username uniqueness
      if (form.username) {
        const { data: existing, error: checkError } = await supabase
          .from("event_guests")
          .select("id")
          .eq("event_id", eventId)
          .eq("username", form.username)
          .neq("id", editing?.id ?? "")
          .maybeSingle();
        if (checkError) throw checkError;
        if (existing) {
          setUsernameError("This username is already taken.");
          throw new Error("Username not unique");
        }
      }
      setUsernameError(null);

      const groupName = groups?.find((g) => g.id === form.group_id)?.name ?? null;

      const payload = {
        event_id: eventId,
        name: form.name,
        username: form.username || null,
        email: form.email || null,
        phone: form.phone || null,
        group_id: form.group_id,
        group_name: groupName,
        side: form.side || null,
        plus_ones: form.plus_ones,
        dietary: form.dietary || null,
        message: form.message || null,
        table_number: form.table_number,
      };

      if (editing) {
        const { error } = await supabase
          .from("event_guests")
          .update(payload)
          .eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("event_guests")
          .insert({
            ...payload,
            token: crypto.randomUUID(),
            rsvp_status: "pending",
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event_guests", eventId] });
      queryClient.invalidateQueries({ queryKey: ["group_counts", eventId] });
      setShowModal(false);
      setEditing(null);
      setForm(emptyGuestForm());
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
      queryClient.invalidateQueries({ queryKey: ["event_guests", eventId] });
      queryClient.invalidateQueries({ queryKey: ["group_counts", eventId] });
    },
  });

  const toggleInvitationMutation = useMutation({
    mutationFn: async ({ guestId, subEventId, invited }: { guestId: string; subEventId: string; invited: boolean }) => {
      // Upsert override
      const { data: existing } = await supabase
        .from("guest_invitation_overrides")
        .select("id")
        .eq("guest_id", guestId)
        .eq("sub_event_id", subEventId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("guest_invitation_overrides")
          .update({ is_invited: invited })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("guest_invitation_overrides")
          .insert({ guest_id: guestId, sub_event_id: subEventId, is_invited: invited });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest_invitation_overrides", eventId] });
    },
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyGuestForm());
    setUsernameError(null);
    setShowModal(true);
  };

  const openEdit = (guest: EventGuest) => {
    setEditing(guest);
    setForm(guestToForm(guest));
    setUsernameError(null);
    setShowModal(true);
  };

  const handleGenerateUsername = () => {
    setForm((f) => ({ ...f, username: generateUsername(f.name) }));
    setUsernameError(null);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    saveMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8">
        <ErrorState
          message={error instanceof Error ? error.message : "Failed to load guests"}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-4 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-dash-text">Guests</h1>
          <p className="mt-1 text-sm text-dash-muted">
            {guests?.length ?? 0} total guests. Click event chips to toggle invitations.
          </p>
        </div>
        <Button size="sm" onClick={openCreate}>
          + Add Guest
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search guests..."
          className="flex-1"
        />
        <Select
          value={filterGroup}
          onChange={(e) => setFilterGroup(e.target.value)}
          className="sm:w-48"
        >
          <option value="all">All Groups</option>
          <option value="none">No Group</option>
          {groups?.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </Select>
      </div>

      {/* Guest list */}
      {filtered.length === 0 ? (
        <EmptyState
          title={guests && guests.length > 0 ? "No matching guests" : "No guests yet"}
          description={
            guests && guests.length > 0
              ? "Try adjusting your search or filter."
              : "Add your first guest to start managing invitations."
          }
          action={
            guests && guests.length > 0 ? undefined : (
              <Button onClick={openCreate}>Add Guest</Button>
            )
          }
        />
      ) : (
        <div className="space-y-4">
          {Array.from(groupedGuests.entries()).map(([groupKey, groupGuests]) => {
            const groupName =
              groupKey === "__none__"
                ? "No Group"
                : groups?.find((g) => g.id === groupKey)?.name ?? "Unknown";
            const isCollapsed = collapsedGroups.has(groupKey);

            return (
              <div key={groupKey} className="overflow-hidden rounded-xl border border-dash-border">
                <button
                  type="button"
                  onClick={() => toggleCollapse(groupKey)}
                  className="flex w-full items-center justify-between bg-dash-bg px-4 py-3 hover:bg-dash-surface"
                >
                  <div className="flex items-center gap-2">
                    <svg
                      className={cn("h-4 w-4 text-dash-muted transition-transform", !isCollapsed && "rotate-90")}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="text-sm font-semibold text-dash-text">{groupName}</span>
                    <Badge>{groupGuests.length}</Badge>
                  </div>
                </button>

                {!isCollapsed && (
                  <div className="divide-y divide-dash-border">
                    {groupGuests.map((guest) => {
                      const invitations = guestInvitations.get(guest.id);
                      return (
                        <div key={guest.id} className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-dash-text">{guest.name}</h3>
                                <RsvpBadge status={guest.rsvp_status} />
                              </div>
                              <div className="mt-1 flex flex-wrap gap-2 text-xs text-dash-muted">
                                {guest.username && <span>@{guest.username}</span>}
                                {guest.email && <span>· {guest.email}</span>}
                                {guest.phone && <span>· {guest.phone}</span>}
                                {guest.plus_ones > 0 && (
                                  <span>· +{guest.plus_ones} guest(s)</span>
                                )}
                              </div>

                              {/* Invited events chips */}
                              {subEvents && subEvents.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                  <span className="text-xs text-dash-muted">Events:</span>
                                  {subEvents.map((sub) => {
                                    const invited = invitations?.get(sub.id) ?? false;
                                    return (
                                      <InvitedChip
                                        key={sub.id}
                                        label={sub.name}
                                        invited={invited}
                                        loading={toggleInvitationMutation.isPending}
                                        onClick={() =>
                                          toggleInvitationMutation.mutate({
                                            guestId: guest.id,
                                            subEventId: sub.id,
                                            invited: !invited,
                                          })
                                        }
                                      />
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEdit(guest)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteMutation.mutate(guest.id)}
                                loading={deleteMutation.isPending}
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

      {/* Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? "Edit Guest" : "Add Guest"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Guest full name"
            required
            autoFocus
          />
          <div>
            <div className="flex items-end gap-2">
              <Input
                label="Username"
                value={form.username}
                onChange={(e) => {
                  setForm((f) => ({ ...f, username: e.target.value }));
                  setUsernameError(null);
                }}
                placeholder="unique_username"
                error={usernameError ?? undefined}
              />
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={handleGenerateUsername}
                className="mb-0.5"
              >
                Auto
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="guest@example.com"
            />
            <Input
              label="Phone"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="+1 555-0100"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="Group"
              value={form.group_id ?? ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, group_id: e.target.value || null }))
              }
            >
              <option value="">No Group</option>
              {groups?.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </Select>
            <Input
              label="Side"
              value={form.side}
              onChange={(e) => setForm((f) => ({ ...f, side: e.target.value }))}
              placeholder="e.g. Bride / Groom"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Plus Ones"
              type="number"
              min={0}
              value={form.plus_ones}
              onChange={(e) =>
                setForm((f) => ({ ...f, plus_ones: Number(e.target.value) }))
              }
            />
            <Input
              label="Table Number"
              type="number"
              value={form.table_number ?? ""}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  table_number: e.target.value ? Number(e.target.value) : null,
                }))
              }
            />
          </div>
          <Textarea
            label="Dietary Requirements"
            value={form.dietary}
            onChange={(e) => setForm((f) => ({ ...f, dietary: e.target.value }))}
            placeholder="Allergies, preferences..."
            rows={2}
          />
          <Textarea
            label="Message"
            value={form.message}
            onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
            placeholder="Optional message"
            rows={2}
          />

          {saveMutation.isError && (
            <p className="text-sm text-dash-danger">
              {saveMutation.error instanceof Error
                ? saveMutation.error.message
                : "Failed to save"}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={saveMutation.isPending}>
              {saveMutation.isPending ? <LoadingSpinner size="sm" /> : "Save"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
