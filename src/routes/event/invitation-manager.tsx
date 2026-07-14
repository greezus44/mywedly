import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type SubEvent, type GuestGroup } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input, Card, LoadingSpinner, ErrorState, EmptyState } from "../../components/ui";
import { resolveGuestInvitations, getInvitedSubEventIds } from "../../lib/invitations";
import { cn } from "../../lib/utils";

interface EventContextValue { event: UserEvent; eventId: string; }

export function InvitationManager() {
  const { eventId } = useOutletContext<EventContextValue>();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: subEvents, isLoading: subLoading } = useQuery({
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

  const { data: groups, isLoading: groupsLoading } = useQuery({
    queryKey: ["guest-groups", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guest_groups")
        .select("*")
        .eq("event_id", eventId)
        .order("name", { ascending: true });
      if (error) throw error;
      return data as GuestGroup[];
    },
  });

  const { data: guests, isLoading: guestsLoading } = useQuery({
    queryKey: ["event-guests", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_guests")
        .select("*")
        .eq("event_id", eventId)
        .order("name", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: assignments } = useQuery({
    queryKey: ["group-assignments", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sub_event_group_assignments")
        .select("id, sub_event_id, group_id")
        .in("group_id", (groups ?? []).map((g) => g.id));
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!(groups && groups.length > 0),
  });

  const toggleAssignment = useMutation({
    mutationFn: async ({ groupId, subEventId, assigned }: { groupId: string; subEventId: string; assigned: boolean }) => {
      if (assigned) {
        const { error } = await supabase
          .from("sub_event_group_assignments")
          .delete()
          .eq("group_id", groupId)
          .eq("sub_event_id", subEventId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("sub_event_group_assignments")
          .insert({ group_id: groupId, sub_event_id: subEventId });
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["group-assignments", eventId] }),
  });

  const toggleOverride = useMutation({
    mutationFn: async ({ guestId, subEventId, isInvited }: { guestId: string; subEventId: string; isInvited: boolean }) => {
      const { data: existing } = await supabase
        .from("guest_invitation_overrides")
        .select("id")
        .eq("guest_id", guestId)
        .eq("sub_event_id", subEventId)
        .maybeSingle();
      if (existing) {
        const { error } = await supabase
          .from("guest_invitation_overrides")
          .update({ is_invited: isInvited })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("guest_invitation_overrides")
          .insert({ guest_id: guestId, sub_event_id: subEventId, is_invited: isInvited });
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["guest-invitations", eventId] }),
  });

  const isLoading = subLoading || groupsLoading || guestsLoading;

  if (isLoading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>;

  const assignmentSet = new Set<string>();
  (assignments ?? []).forEach((a) => assignmentSet.add(`${a.group_id}:${a.sub_event_id}`));

  const filteredGuests = (guests ?? []).filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-dash-text">Invitation Manager</h2>

      {(subEvents ?? []).length === 0 ? (
        <EmptyState title="No sub-events" description="Create events first, then manage invitations here." />
      ) : (
        <>
          {/* Group assignments */}
          <Card>
            <h3 className="mb-3 text-sm font-semibold text-dash-text">Group Assignments</h3>
            <p className="mb-4 text-sm text-dash-muted">Assign groups to sub-events to bulk-invite all guests in each group.</p>
            {(groups ?? []).length === 0 ? (
              <p className="text-sm text-dash-muted">No groups created yet.</p>
            ) : (
              <div className="space-y-3">
                {(groups ?? []).map((group) => (
                  <div key={group.id} className="rounded border border-dash-border p-3">
                    <p className="mb-2 text-sm font-medium text-dash-text">{group.name}</p>
                    <div className="flex flex-wrap gap-2">
                      {(subEvents ?? []).map((se) => {
                        const isAssigned = assignmentSet.has(`${group.id}:${se.id}`);
                        return (
                          <button
                            key={se.id}
                            onClick={() => toggleAssignment.mutate({ groupId: group.id, subEventId: se.id, assigned: isAssigned })}
                            className={cn(
                              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                              isAssigned ? "bg-dash-primary text-dash-primary-fg" : "bg-dash-bg text-dash-muted hover:text-dash-text",
                            )}
                          >
                            {se.name}{isAssigned ? " ✓" : " +"}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Per-guest overrides */}
          <Card>
            <h3 className="mb-3 text-sm font-semibold text-dash-text">Per-Guest Invitations</h3>
            <Input
              placeholder="Search guests..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mb-3"
            />
            {filteredGuests.length === 0 ? (
              <p className="text-sm text-dash-muted">No guests found.</p>
            ) : (
              <div className="space-y-2">
                {filteredGuests.map((guest) => (
                  <GuestInvitationRow
                    key={guest.id}
                    guestId={guest.id}
                    guestName={guest.name}
                    subEvents={subEvents ?? []}
                    eventId={eventId}
                    onToggle={toggleOverride.mutate}
                  />
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

function GuestInvitationRow({
  guestId,
  guestName,
  subEvents,
  eventId,
  onToggle,
}: {
  guestId: string;
  guestName: string;
  subEvents: SubEvent[];
  eventId: string;
  onToggle: (args: { guestId: string; subEventId: string; isInvited: boolean }) => void;
}) {
  const { data: invitations } = useQuery({
    queryKey: ["guest-invitations", eventId, guestId],
    queryFn: async () => {
      const result = await resolveGuestInvitations(supabase, guestId, eventId);
      return result;
    },
  });

  const invitedIds = invitations ? getInvitedSubEventIds(invitations) : [];

  return (
    <div className="rounded border border-dash-border p-3">
      <p className="mb-2 text-sm font-medium text-dash-text">{guestName}</p>
      <div className="flex flex-wrap gap-2">
        {subEvents.map((se) => {
          const isInvited = invitedIds.includes(se.id);
          return (
            <button
              key={se.id}
              onClick={() => onToggle({ guestId, subEventId: se.id, isInvited: !isInvited })}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                isInvited ? "bg-dash-primary text-dash-primary-fg" : "bg-dash-bg text-dash-muted hover:text-dash-text",
              )}
            >
              {se.name}{isInvited ? " ✓" : " +"}
            </button>
          );
        })}
      </div>
    </div>
  );
}

