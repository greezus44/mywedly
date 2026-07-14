import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  supabase,
  type SubEvent,
  type GuestGroup,
  type EventGuest,
  type SubEventGroupAssignment,
  type GuestInvitationOverride,
} from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import {
  Card,
  LoadingSpinner,
  ErrorState,
  EmptyState,
  Badge,
  Toggle,
} from "../../components/ui";
import { cn } from "../../lib/utils";

interface InvitationManagerProps {
  subEvent: SubEvent;
  groups: GuestGroup[];
  eventId: string;
  onBack: () => void;
}

export function InvitationManager({
  subEvent,
  groups,
  eventId,
  onBack,
}: InvitationManagerProps) {
  const queryClient = useQueryClient();
  const [showManual, setShowManual] = useState(false);

  const { data: guests, isLoading: gLoading } = useQuery({
    queryKey: ["event_guests", eventId],
    enabled: !!eventId,
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

  const { data: assignments, isLoading: aLoading } = useQuery({
    queryKey: ["sub_event_group_assignments", subEvent.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sub_event_group_assignments")
        .select("*")
        .eq("sub_event_id", subEvent.id);
      if (error) throw error;
      return data as SubEventGroupAssignment[];
    },
  });

  const guestIds = useMemo(() => guests?.map((g) => g.id) ?? [], [guests]);

  const { data: overrides, isLoading: oLoading } = useQuery({
    queryKey: ["guest_invitation_overrides", subEvent.id],
    enabled: guestIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guest_invitation_overrides")
        .select("*")
        .eq("sub_event_id", subEvent.id)
        .in("guest_id", guestIds);
      if (error) throw error;
      return data as GuestInvitationOverride[];
    },
  });

  const assignedGroupIds = useMemo(
    () => new Set(assignments?.map((a) => a.group_id) ?? []),
    [assignments]
  );

  const overrideMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    overrides?.forEach((o) => {
      map[o.guest_id] = o.is_invited;
    });
    return map;
  }, [overrides]);

  const isGuestInvited = (guest: EventGuest): { invited: boolean; source: "group" | "manual" | "none" } => {
    if (guest.id in overrideMap) {
      return { invited: overrideMap[guest.id], source: "manual" };
    }
    if (guest.group_id && assignedGroupIds.has(guest.group_id)) {
      return { invited: true, source: "group" };
    }
    return { invited: false, source: "none" };
  };

  const toggleGroupAssignment = useMutation({
    mutationFn: async (groupId: string) => {
      const existing = assignments?.find((a) => a.group_id === groupId);
      if (existing) {
        const { error } = await supabase
          .from("sub_event_group_assignments")
          .delete()
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("sub_event_group_assignments")
          .insert({
            sub_event_id: subEvent.id,
            group_id: groupId,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["sub_event_group_assignments", subEvent.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["guest_invitation_overrides", subEvent.id],
      });
    },
  });

  const toggleGuestOverride = useMutation({
    mutationFn: async (guest: EventGuest) => {
      const { invited } = isGuestInvited(guest);
      const existing = overrides?.find((o) => o.guest_id === guest.id);

      if (existing) {
        if (existing.is_invited === !invited) {
          // Override is already the opposite - delete it to revert to group default
          const { error } = await supabase
            .from("guest_invitation_overrides")
            .delete()
            .eq("id", existing.id);
          if (error) throw error;
        } else {
          // Toggle the override
          const { error } = await supabase
            .from("guest_invitation_overrides")
            .update({ is_invited: !invited })
            .eq("id", existing.id);
          if (error) throw error;
        }
      } else {
        // Create new override with opposite of current state
        const { error } = await supabase
          .from("guest_invitation_overrides")
          .insert({
            sub_event_id: subEvent.id,
            guest_id: guest.id,
            is_invited: !invited,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["guest_invitation_overrides", subEvent.id],
      });
    },
  });

  if (gLoading || aLoading || oLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const invitedCount = guests?.filter((g) => isGuestInvited(g).invited).length ?? 0;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            ← Back
          </Button>
          <div>
            <h2 className="text-lg font-semibold text-dash-text">
              {subEvent.name} — Invitations
            </h2>
            <p className="text-sm text-dash-muted">
              {invitedCount} of {guests?.length ?? 0} guests invited
            </p>
          </div>
        </div>
      </div>

      {/* Group assignments */}
      <Card className="mb-6 p-4">
        <h3 className="mb-3 text-sm font-semibold text-dash-text">
          Group Assignments
        </h3>
        <p className="mb-3 text-sm text-dash-muted">
          Assign entire groups to this event. All guests in the group will be invited.
        </p>
        {groups.length === 0 ? (
          <p className="text-sm text-dash-muted">
            No groups available. Create groups in the Guest Groups tab.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {groups.map((group) => (
              <div
                key={group.id}
                className="flex items-center justify-between rounded-md border border-dash-border p-3"
              >
                <div>
                  <p className="text-sm font-medium text-dash-text">
                    {group.name}
                  </p>
                  <p className="text-xs text-dash-muted">
                    {guests?.filter((g) => g.group_id === group.id).length ?? 0} guests
                  </p>
                </div>
                <Toggle
                  checked={assignedGroupIds.has(group.id)}
                  onChange={() => toggleGroupAssignment.mutate(group.id)}
                />
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Manual overrides */}
      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-dash-text">
            Manual Guest Overrides
          </h3>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowManual(!showManual)}
          >
            {showManual ? "Hide" : "Show"}
          </Button>
        </div>
        <p className="mb-3 text-sm text-dash-muted">
          Override individual guest invitations. Manual changes take precedence over group assignments.
        </p>
        {showManual && (
          <>
            {!guests || guests.length === 0 ? (
              <EmptyState title="No guests" description="Add guests first." />
            ) : (
              <div className="max-h-96 overflow-y-auto scrollbar-thin">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-dash-surface">
                    <tr className="text-left text-dash-muted">
                      <th className="pb-2">Guest</th>
                      <th className="pb-2">Group</th>
                      <th className="pb-2">Source</th>
                      <th className="pb-2 text-right">Invited</th>
                    </tr>
                  </thead>
                  <tbody>
                    {guests.map((guest) => {
                      const { invited, source } = isGuestInvited(guest);
                      return (
                        <tr key={guest.id} className="border-t border-dash-border">
                          <td className="py-2 text-dash-text">{guest.name}</td>
                          <td className="py-2 text-dash-muted">
                            {groups.find((g) => g.id === guest.group_id)?.name ?? "—"}
                          </td>
                          <td className="py-2">
                            {source === "group" && (
                              <Badge variant="info">Group</Badge>
                            )}
                            {source === "manual" && (
                              <Badge variant="warning">Manual</Badge>
                            )}
                            {source === "none" && (
                              <span className="text-dash-muted">—</span>
                            )}
                          </td>
                          <td className="py-2 text-right">
                            <button
                              onClick={() => toggleGuestOverride.mutate(guest)}
                              className={cn(
                                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                                invited
                                  ? "border-dash-primary bg-dash-primary text-dash-primary-fg"
                                  : "border-dash-border text-dash-muted hover:bg-dash-bg"
                              )}
                            >
                              {invited ? "Invited" : "Not Invited"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
        {toggleGuestOverride.isError && (
          <p className="mt-2 text-sm text-dash-danger">
            {toggleGuestOverride.error instanceof Error
              ? toggleGuestOverride.error.message
              : "Failed to update"}
          </p>
        )}
      </Card>
    </div>
  );
}
