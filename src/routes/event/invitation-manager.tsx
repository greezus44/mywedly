import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { LoadingSpinner, ErrorState, Badge } from "../../components/ui";
import { cn } from "../../lib/utils";

interface InvitationManagerProps {
  subEventId: string;
  eventId: string;
}

export function InvitationManager({ subEventId, eventId }: InvitationManagerProps) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  // Fetch guests for this event
  const {
    data: guests,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["event-guests-invite", eventId],
    queryFn: async () => {
      const { data, error: queryError } = await supabase
        .from("event_guests")
        .select("*")
        .eq("event_id", eventId)
        .order("name", { ascending: true });
      if (queryError) throw queryError;
      return data;
    },
  });

  // Fetch guest groups
  const { data: groups } = useQuery({
    queryKey: ["guest-groups-invite", eventId],
    queryFn: async () => {
      const { data, error: queryError } = await supabase
        .from("guest_groups")
        .select("*")
        .eq("event_id", eventId)
        .order("name", { ascending: true });
      if (queryError) throw queryError;
      return data;
    },
  });

  // Fetch group assignments for this sub-event
  const { data: groupAssignments } = useQuery({
    queryKey: ["sub-event-group-assignments", subEventId],
    queryFn: async () => {
      const { data, error: queryError } = await supabase
        .from("sub_event_group_assignments")
        .select("*")
        .eq("sub_event_id", subEventId);
      if (queryError) throw queryError;
      return data;
    },
  });

  // Fetch guest invitation overrides for this sub-event
  const { data: overrides } = useQuery({
    queryKey: ["guest-overrides", subEventId],
    queryFn: async () => {
      const { data, error: queryError } = await supabase
        .from("guest_invitation_overrides")
        .select("*")
        .eq("sub_event_id", subEventId);
      if (queryError) throw queryError;
      return data;
    },
  });

  const assignedGroupIds = useMemo(() => {
    return new Set((groupAssignments ?? []).map((a) => a.group_id));
  }, [groupAssignments]);

  const overrideMap = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const o of overrides ?? []) {
      map.set(o.guest_id, o.is_invited);
    }
    return map;
  }, [overrides]);

  // Determine if a guest is invited
  const isGuestInvited = (guestId: string, groupId: string | null): boolean => {
    if (overrideMap.has(guestId)) return overrideMap.get(guestId)!;
    if (groupId && assignedGroupIds.has(groupId)) return true;
    return true; // default: invited
  };

  const toggleGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      if (assignedGroupIds.has(groupId)) {
        const { error: deleteError } = await supabase
          .from("sub_event_group_assignments")
          .delete()
          .eq("sub_event_id", subEventId)
          .eq("group_id", groupId);
        if (deleteError) throw deleteError;
      } else {
        const { error: insertError } = await supabase
          .from("sub_event_group_assignments")
          .insert({ sub_event_id: subEventId, group_id: groupId });
        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-event-group-assignments", subEventId] });
    },
  });

  const toggleOverrideMutation = useMutation({
    mutationFn: async (guestId: string) => {
      const current = overrideMap.get(guestId);
      const newValue = !current;
      const { error: upsertError } = await supabase
        .from("guest_invitation_overrides")
        .upsert(
          {
            guest_id: guestId,
            sub_event_id: subEventId,
            is_invited: newValue,
          },
          { onConflict: "guest_id,sub_event_id" }
        );
      if (upsertError) throw upsertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest-overrides", subEventId] });
    },
  });

  const filteredGuests = useMemo(() => {
    if (!guests) return [];
    if (!search) return guests;
    return guests.filter((g) =>
      g.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [guests, search]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState message={error instanceof Error ? error.message : "Failed to load"} />;
  }

  return (
    <div className="space-y-4">
      {/* Group assignments */}
      {groups && groups.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-medium text-dash-text">Invite by Group</h4>
          <div className="flex flex-wrap gap-2">
            {groups.map((group) => (
              <button
                key={group.id}
                type="button"
                onClick={() => toggleGroupMutation.mutate(group.id)}
                className={cn(
                  "rounded-full border px-3 py-1 text-sm font-medium transition-colors",
                  assignedGroupIds.has(group.id)
                    ? "border-dash-primary bg-dash-primary/10 text-dash-primary"
                    : "border-dash-border text-dash-muted hover:text-dash-text"
                )}
              >
                {group.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Guest list */}
      <div>
        <h4 className="mb-2 text-sm font-medium text-dash-text">Individual Guests</h4>
        <Input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search guests..."
          className="mb-3"
        />
        <div className="max-h-64 space-y-2 overflow-y-auto scrollbar-thin">
          {filteredGuests.map((guest) => {
            const invited = isGuestInvited(guest.id, guest.group_id);
            return (
              <div
                key={guest.id}
                className="flex items-center justify-between rounded-lg border border-dash-border p-3"
              >
                <div>
                  <span className="text-sm font-medium text-dash-text">{guest.name}</span>
                  {guest.group_id && (
                    <Badge variant="default" className="ml-2">
                      {groups?.find((g) => g.id === guest.group_id)?.name ?? "Group"}
                    </Badge>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => toggleOverrideMutation.mutate(guest.id)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    invited
                      ? "border-green-300 bg-green-50 text-green-700"
                      : "border-dash-border text-dash-muted hover:text-dash-text"
                  )}
                >
                  {invited ? "Invited" : "Not Invited"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
