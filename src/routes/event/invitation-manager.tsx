import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type SubEvent, type GuestGroup, type GuestInvitationOverride, type EventGuest } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input, Select } from "../../components/ui/Input";
import { Card, LoadingSpinner, ErrorState, Badge, EmptyState } from "../../components/ui";

interface InvitationManagerProps {
  subEvent: SubEvent;
}

async function fetchInvitationData(subEventId: string, parentEventId: string) {
  // Fetch all guests for the parent event
  const { data: guests, error: guestError } = await supabase
    .from("event_guests")
    .select("*")
    .eq("event_id", parentEventId)
    .order("name", { ascending: true });
  if (guestError) throw guestError;

  // Fetch all groups for the parent event
  const { data: groups, error: groupError } = await supabase
    .from("guest_groups")
    .select("*")
    .eq("event_id", parentEventId)
    .order("sort_order", { ascending: true });
  if (groupError) throw groupError;

  // Fetch group assignments for this sub-event
  const { data: assignments, error: assignError } = await supabase
    .from("sub_event_group_assignments")
    .select("*")
    .eq("sub_event_id", subEventId);
  if (assignError) throw assignError;

  // Fetch guest invitation overrides for this sub-event
  const { data: overrides, error: overrideError } = await supabase
    .from("guest_invitation_overrides")
    .select("*")
    .eq("sub_event_id", subEventId);
  if (overrideError) throw overrideError;

  return {
    guests: (guests ?? []) as EventGuest[],
    groups: (groups ?? []) as GuestGroup[],
    assignments: (assignments ?? []) as { id: string; sub_event_id: string; group_id: string; created_at: string }[],
    overrides: (overrides ?? []) as GuestInvitationOverride[],
  };
}

export function InvitationManager({ subEvent }: InvitationManagerProps) {
  const queryClient = useQueryClient();
  const parentEventId = subEvent.parent_event_id;

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["invitation-data", subEvent.id],
    queryFn: () => fetchInvitationData(subEvent.id, parentEventId),
  });

  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("all");

  const assignedGroupIds = new Set(data?.assignments.map((a) => a.group_id) ?? []);
  const overrideMap = new Map(data?.overrides.map((o) => [o.guest_id, o.is_invited]) ?? []);

  // Toggle group assignment
  const toggleGroupMutation = useMutation({
    mutationFn: async ({ groupId, assign }: { groupId: string; assign: boolean }) => {
      if (assign) {
        const { error } = await supabase
          .from("sub_event_group_assignments")
          .insert({ sub_event_id: subEvent.id, group_id: groupId });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("sub_event_group_assignments")
          .delete()
          .eq("sub_event_id", subEvent.id)
          .eq("group_id", groupId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitation-data", subEvent.id] });
    },
  });

  // Toggle guest override
  const toggleGuestMutation = useMutation({
    mutationFn: async ({ guestId, invited }: { guestId: string; invited: boolean }) => {
      // Check if override exists
      const existing = data?.overrides.find((o) => o.guest_id === guestId);
      if (existing) {
        const { error } = await supabase
          .from("guest_invitation_overrides")
          .update({ is_invited: invited })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("guest_invitation_overrides")
          .insert({ sub_event_id: subEvent.id, guest_id: guestId, is_invited: invited });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitation-data", subEvent.id] });
    },
  });

  // Resolve invitation status for a guest
  const resolveInvited = (guest: EventGuest): { invited: boolean; source: string } => {
    // Override takes precedence
    if (overrideMap.has(guest.id)) {
      return { invited: overrideMap.get(guest.id)!, source: "override" };
    }
    // Group assignment
    if (guest.group_id && assignedGroupIds.has(guest.group_id)) {
      return { invited: true, source: "group" };
    }
    // If there are group assignments but guest's group isn't assigned
    if (assignedGroupIds.size > 0 && guest.group_id && !assignedGroupIds.has(guest.group_id)) {
      return { invited: false, source: "group" };
    }
    // Default: invited if no group assignments
    if (assignedGroupIds.size === 0) {
      return { invited: true, source: "default" };
    }
    // Guest has no group and there are group assignments
    return { invited: false, source: "default" };
  };

  const filteredGuests = useMemo(() => {
    if (!data?.guests) return [];
    let guests = data.guests;
    if (search.trim()) {
      const q = search.toLowerCase();
      guests = guests.filter(
        (g) =>
          g.name?.toLowerCase().includes(q) ||
          g.email?.toLowerCase().includes(q),
      );
    }
    if (groupFilter !== "all") {
      if (groupFilter === "none") {
        guests = guests.filter((g) => !g.group_id);
      } else {
        guests = guests.filter((g) => g.group_id === groupFilter);
      }
    }
    return guests;
  }, [data?.guests, search, groupFilter]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : "Failed to load"}
        onRetry={() => refetch()}
      />
    );
  }

  const { guests, groups } = data ?? { guests: [], groups: [], assignments: [], overrides: [] };

  return (
    <div className="flex flex-col gap-4">
      {/* Group Assignments */}
      <Card>
        <h3 className="mb-3 text-sm font-semibold text-dash-text">Group Invitations</h3>
        <p className="mb-3 text-sm text-dash-muted">
          Invite entire groups to this event. Individual guests can be overridden below.
        </p>
        {groups.length === 0 ? (
          <p className="text-sm text-dash-muted">No groups created yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {groups.map((group) => {
              const isAssigned = assignedGroupIds.has(group.id);
              return (
                <button
                  key={group.id}
                  type="button"
                  onClick={() =>
                    toggleGroupMutation.mutate({
                      groupId: group.id,
                      assign: !isAssigned,
                    })
                  }
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                    isAssigned
                      ? "border-dash-primary bg-dash-primary text-dash-primary-fg"
                      : "border-dash-border bg-dash-surface text-dash-text hover:bg-dash-bg",
                  )}
                >
                  {isAssigned ? "✓ " : ""}
                  {group.name}
                </button>
              );
            })}
          </div>
        )}
      </Card>

      {/* Guest Overrides */}
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-dash-text">Individual Guest Invitations</h3>
          <span className="text-sm text-dash-muted">
            {filteredGuests.filter((g) => resolveInvited(g).invited).length} invited
          </span>
        </div>

        {/* Filters */}
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            label="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
          />
          <Select
            label="Group"
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
          >
            <option value="all">All Groups</option>
            <option value="none">No Group</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </Select>
        </div>

        {filteredGuests.length === 0 ? (
          <EmptyState
            title="No guests found"
            description="Add guests or adjust your filters."
          />
        ) : (
          <div className="space-y-2">
            {filteredGuests.map((guest) => {
              const { invited, source } = resolveInvited(guest);
              const groupName = groups.find((g) => g.id === guest.group_id)?.name;
              return (
                <div
                  key={guest.id}
                  className="flex items-center justify-between rounded-lg border border-dash-border bg-dash-bg p-3"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-dash-text">{guest.name}</span>
                      {groupName && <Badge color="default">{groupName}</Badge>}
                    </div>
                    {guest.email && (
                      <p className="text-sm text-dash-muted">{guest.email}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge color={invited ? "success" : "default"}>
                      {invited ? "Invited" : "Not Invited"}
                    </Badge>
                    <Button
                      variant={invited ? "secondary" : "primary"}
                      size="sm"
                      loading={toggleGuestMutation.isPending}
                      onClick={() =>
                        toggleGuestMutation.mutate({
                          guestId: guest.id,
                          invited: !invited,
                        })
                      }
                    >
                      {invited ? "Uninvite" : "Invite"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

function cn(...inputs: (string | undefined | null | false)[]): string {
  return inputs.filter(Boolean).join(" ");
}
