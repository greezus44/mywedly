import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type EventGuest, type SubEvent, type GuestGroup, type SubEventGroupAssignment, type GuestInvitationOverride } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Input, Card, Badge, LoadingSpinner, ErrorState, EmptyState, Toggle } from "../../components/ui";
import { cn } from "../../lib/utils";

export function InvitationManager() {
  const { eventId } = useEventContext();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null);

  // Load sub-events for this parent event
  const { data: subEvents, isLoading: subLoading, isError: subError, error: subErr, refetch: subRefetch } = useQuery({
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
    enabled: !!eventId,
  });

  // Load guests
  const { data: guests, isLoading: guestLoading, isError: guestError, error: guestErr, refetch: guestRefetch } = useQuery({
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

  // Load groups
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

  // Load group assignments
  const { data: assignments } = useQuery({
    queryKey: ["sub-event-assignments", eventId],
    queryFn: async () => {
      if (!subEvents || subEvents.length === 0) return [];
      const subEventIds = subEvents.map((s) => s.id);
      const { data, error } = await supabase
        .from("sub_event_group_assignments")
        .select("*")
        .in("sub_event_id", subEventIds);
      if (error) throw error;
      return data as SubEventGroupAssignment[];
    },
    enabled: !!eventId && !!subEvents && subEvents.length > 0,
  });

  // Load overrides
  const { data: overrides } = useQuery({
    queryKey: ["invitation-overrides", eventId],
    queryFn: async () => {
      if (!guests || guests.length === 0) return [];
      const guestIds = guests.map((g) => g.id);
      const { data, error } = await supabase
        .from("guest_invitation_overrides")
        .select("*")
        .in("guest_id", guestIds);
      if (error) throw error;
      return data as GuestInvitationOverride[];
    },
    enabled: !!eventId && !!guests && guests.length > 0,
  });

  // Build a map: subEventId -> Set(groupId) from assignments
  const assignmentMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const a of assignments ?? []) {
      if (!map.has(a.sub_event_id)) map.set(a.sub_event_id, new Set());
      map.get(a.sub_event_id)!.add(a.group_id);
    }
    return map;
  }, [assignments]);

  // Build a map: guestId + subEventId -> override
  const overrideMap = useMemo(() => {
    const map = new Map<string, GuestInvitationOverride>();
    for (const o of overrides ?? []) {
      map.set(`${o.guest_id}:${o.sub_event_id}`, o);
    }
    return map;
  }, [overrides]);

  // Resolve whether a guest is invited to a sub-event
  function isGuestInvited(guest: EventGuest, subEvent: SubEvent): { invited: boolean; explicit: boolean } {
    const overrideKey = `${guest.id}:${subEvent.id}`;
    const override = overrideMap.get(overrideKey);
    if (override) {
      return { invited: override.is_invited, explicit: true };
    }
    // Check group membership
    const assignedGroupIds = assignmentMap.get(subEvent.id);
    if (assignedGroupIds && guest.group_id && assignedGroupIds.has(guest.group_id)) {
      return { invited: true, explicit: false };
    }
    return { invited: false, explicit: false };
  }

  // Toggle override
  const toggleMutation = useMutation({
    mutationFn: async ({ guestId, subEventId, invited }: { guestId: string; subEventId: string; invited: boolean }) => {
      const existing = overrideMap.get(`${guestId}:${subEventId}`);
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
      queryClient.invalidateQueries({ queryKey: ["invitation-overrides", eventId] });
    },
  });

  // Toggle group assignment
  const toggleGroupMutation = useMutation({
    mutationFn: async ({ subEventId, groupId, assigned }: { subEventId: string; groupId: string; assigned: boolean }) => {
      if (assigned) {
        const { error } = await supabase
          .from("sub_event_group_assignments")
          .insert({ sub_event_id: subEventId, group_id: groupId });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("sub_event_group_assignments")
          .delete()
          .eq("sub_event_id", subEventId)
          .eq("group_id", groupId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-event-assignments", eventId] });
    },
  });

  const filteredGuests = (guests ?? []).filter((g) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return g.name?.toLowerCase().includes(q) || g.group_name?.toLowerCase().includes(q);
  });

  const selectedGuest = guests?.find((g) => g.id === selectedGuestId) ?? null;

  if (subLoading || guestLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner />
      </div>
    );
  }

  if (subError || guestError) {
    return (
      <ErrorState
        title="Failed to load data"
        message={(subErr ?? guestErr) instanceof Error ? (subErr ?? guestErr)?.message ?? "" : "An unexpected error occurred."}
        onRetry={() => { subRefetch(); guestRefetch(); }}
      />
    );
  }

  if (!subEvents || subEvents.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-dash-text">Invitation Manager</h2>
          <p className="text-sm text-dash-muted">Control which guests are invited to which Events.</p>
        </div>
        <EmptyState
          title="No Events to manage"
          description="Create Events first, then you can manage guest invitations for each one."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-dash-text">Invitation Manager</h2>
        <p className="text-sm text-dash-muted">Control which guests are invited to which Events.</p>
      </div>

      {/* Group Assignments per Sub-Event */}
      <Card>
        <h3 className="mb-4 text-sm font-semibold text-dash-text">Group Assignments</h3>
        <p className="mb-4 text-xs text-dash-muted">
          Assign guest groups to Events. All guests in a group will be invited by default.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-dash-border text-dash-muted">
              <tr>
                <th className="pb-2 pr-4 font-medium">Event</th>
                {groups?.map((g) => (
                  <th key={g.id} className="pb-2 px-2 font-medium text-center">{g.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {subEvents.map((sub) => (
                <tr key={sub.id} className="border-b border-dash-border/50">
                  <td className="py-3 pr-4 font-medium text-dash-text">{sub.name}</td>
                  {groups?.map((g) => {
                    const assignedGroupIds = assignmentMap.get(sub.id);
                    const isAssigned = assignedGroupIds?.has(g.id) ?? false;
                    return (
                      <td key={g.id} className="py-3 px-2 text-center">
                        <Toggle
                          checked={isAssigned}
                          onChange={(v) => toggleGroupMutation.mutate({ subEventId: sub.id, groupId: g.id, assigned: v })}
                          disabled={toggleGroupMutation.isPending}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          {(!groups || groups.length === 0) && (
            <p className="py-4 text-center text-sm text-dash-muted">No groups created yet.</p>
          )}
        </div>
      </Card>

      {/* Guest-level Overrides */}
      <Card>
        <h3 className="mb-4 text-sm font-semibold text-dash-text">Guest Overrides</h3>
        <p className="mb-4 text-xs text-dash-muted">
          Override individual guest invitations. Explicitly invited or excluded guests take precedence over group assignments.
        </p>
        <Input
          placeholder="Search guests…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-4"
        />

        {!filteredGuests || filteredGuests.length === 0 ? (
          <EmptyState title={search ? "No guests found" : "No guests yet"} description={search ? "Try a different search." : "Add guests to manage their invitations."} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-dash-border text-dash-muted">
                <tr>
                  <th className="pb-2 pr-4 font-medium">Guest</th>
                  <th className="pb-2 pr-4 font-medium">Group</th>
                  {subEvents.map((s) => (
                    <th key={s.id} className="pb-2 px-2 text-center font-medium">{s.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredGuests.map((guest) => (
                  <tr key={guest.id} className={cn("border-b border-dash-border/50", selectedGuestId === guest.id && "bg-dash-primary/5")}>
                    <td className="py-3 pr-4">
                      <button
                        type="button"
                        onClick={() => setSelectedGuestId(selectedGuestId === guest.id ? null : guest.id)}
                        className="font-medium text-dash-text hover:underline"
                      >
                        {guest.name}
                      </button>
                    </td>
                    <td className="py-3 pr-4 text-dash-muted">
                      {guest.group_id ? groups?.find((g) => g.id === guest.group_id)?.name ?? "—" : "—"}
                    </td>
                    {subEvents.map((sub) => {
                      const { invited, explicit } = isGuestInvited(guest, sub);
                      return (
                        <td key={sub.id} className="py-3 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => toggleMutation.mutate({ guestId: guest.id, subEventId: sub.id, invited: !invited })}
                            disabled={toggleMutation.isPending}
                            className={cn(
                              "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
                              invited
                                ? explicit
                                  ? "border-green-300 bg-green-50 text-green-700"
                                  : "border-dash-primary/30 bg-dash-primary/10 text-dash-primary"
                                : "border-dash-border bg-dash-surface text-dash-muted"
                            )}
                            title={explicit ? "Explicit override" : "From group assignment"}
                          >
                            {invited ? "Invited" : "Not invited"}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {selectedGuest && (
        <Card>
          <h3 className="mb-2 text-sm font-semibold text-dash-text">
            {selectedGuest.name} — Invitation Summary
          </h3>
          <div className="flex flex-wrap gap-2">
            {subEvents.map((sub) => {
              const { invited, explicit } = isGuestInvited(selectedGuest, sub);
              return (
                <Badge key={sub.id} variant={invited ? "success" : "default"}>
                  {sub.name}: {invited ? "Invited" : "Not invited"}{explicit ? " (override)" : ""}
                </Badge>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
