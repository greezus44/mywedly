import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type SubEvent, type GuestGroup, type EventGuest } from "../../lib/supabase";
import { cn } from "../../lib/utils";
import { Button } from "../../components/ui/Button";
import { Card, Toggle, Badge, LoadingSpinner, EmptyState } from "../../components/ui";

interface InvitationManagerProps {
  eventId: string;
  subEvent: SubEvent;
}

export function InvitationManager({ eventId, subEvent }: InvitationManagerProps) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

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

  const { data: guests } = useQuery({
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
  });

  const { data: assignments } = useQuery({
    queryKey: ["sub-event-group-assignments", subEvent.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sub_event_group_assignments")
        .select("*")
        .eq("sub_event_id", subEvent.id);
      if (error) throw error;
      return data;
    },
  });

  const { data: overrides } = useQuery({
    queryKey: ["guest-invitation-overrides", subEvent.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guest_invitation_overrides")
        .select("*")
        .eq("sub_event_id", subEvent.id);
      if (error) throw error;
      return data;
    },
  });

  const assignGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      const { error } = await supabase
        .from("sub_event_group_assignments")
        .insert({ sub_event_id: subEvent.id, group_id: groupId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["sub-event-group-assignments", subEvent.id],
      });
    },
  });

  const unassignGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      const { error } = await supabase
        .from("sub_event_group_assignments")
        .delete()
        .eq("sub_event_id", subEvent.id)
        .eq("group_id", groupId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["sub-event-group-assignments", subEvent.id],
      });
    },
  });

  const toggleOverrideMutation = useMutation({
    mutationFn: async ({ guestId, isInvited }: { guestId: string; isInvited: boolean }) => {
      const existing = overrides?.find((o) => o.guest_id === guestId);
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
            sub_event_id: subEvent.id,
            guest_id: guestId,
            is_invited: isInvited,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["guest-invitation-overrides", subEvent.id],
      });
    },
  });

  const assignedGroupIds = new Set(assignments?.map((a) => a.group_id) ?? []);
  const overrideMap = new Map(
    overrides?.map((o) => [o.guest_id, o.is_invited]) ?? []
  );

  const isGuestInvited = (guest: EventGuest): boolean => {
    if (overrideMap.has(guest.id)) return overrideMap.get(guest.id)!;
    return guest.group_id ? assignedGroupIds.has(guest.group_id) : false;
  };

  const filteredGuests = useMemo(() => {
    if (!guests) return [];
    if (!search) return guests;
    return guests.filter((g) =>
      g.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [guests, search]);

  const invitedCount = guests?.filter(isGuestInvited).length ?? 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-foreground">
            Invitations for: {subEvent.name}
          </h4>
          <p className="text-xs text-muted">
            {invitedCount} of {guests?.length ?? 0} guests invited
          </p>
        </div>
      </div>

      {/* Group assignments */}
      <Card>
        <h5 className="mb-3 text-xs font-semibold uppercase text-muted">
          Group Assignments
        </h5>
        {groups && groups.length > 0 ? (
          <div className="flex flex-col gap-2">
            {groups.map((group) => {
              const isAssigned = assignedGroupIds.has(group.id);
              const groupGuestCount =
                guests?.filter((g) => g.group_id === group.id).length ?? 0;
              return (
                <div
                  key={group.id}
                  className="flex items-center justify-between rounded-md border border-border bg-surface-alt px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {group.name}
                    </span>
                    <Badge>{groupGuestCount} guests</Badge>
                  </div>
                  <Toggle
                    checked={isAssigned}
                    onChange={(checked) => {
                      if (checked) assignGroupMutation.mutate(group.id);
                      else unassignGroupMutation.mutate(group.id);
                    }}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted">
            No groups available. Create groups first.
          </p>
        )}
      </Card>

      {/* Manual overrides */}
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h5 className="text-xs font-semibold uppercase text-muted">
            Manual Overrides
          </h5>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search guests..."
            className="h-8 w-48 rounded-md border border-border bg-surface px-3 text-xs text-foreground focus:border-primary focus:outline-none"
          />
        </div>
        {filteredGuests.length > 0 ? (
          <div className="flex max-h-60 flex-col gap-1 overflow-y-auto">
            {filteredGuests.map((guest) => {
              const invited = isGuestInvited(guest);
              const hasOverride = overrideMap.has(guest.id);
              return (
                <div
                  key={guest.id}
                  className="flex items-center justify-between rounded-md px-3 py-1.5 hover:bg-surface-alt"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-foreground">{guest.name}</span>
                    {guest.group_name && (
                      <span className="text-xs text-muted">{guest.group_name}</span>
                    )}
                    {hasOverride && <Badge variant="info">override</Badge>}
                  </div>
                  <Toggle
                    checked={invited}
                    onChange={(checked) =>
                      toggleOverrideMutation.mutate({
                        guestId: guest.id,
                        isInvited: checked,
                      })
                    }
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState title="No guests found" />
        )}
      </Card>
    </div>
  );
}
