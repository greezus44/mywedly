import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type SubEvent, type GuestGroup, type EventGuest, type SubEventGroupAssignment, type GuestInvitationOverride } from "../../lib/supabase";
import { Toggle, Badge, LoadingSpinner } from "../../components/ui";

interface InvitationManagerProps {
  subEvent: SubEvent;
  event: UserEvent;
  onClose: () => void;
}

export function InvitationManager({ subEvent, event, onClose }: InvitationManagerProps) {
  const queryClient = useQueryClient();

  const { data: groups } = useQuery({
    queryKey: ["guest_groups", event.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guest_groups")
        .select("*")
        .eq("event_id", event.id)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as GuestGroup[];
    },
  });

  const { data: guests } = useQuery({
    queryKey: ["event_guests", event.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_guests")
        .select("*")
        .eq("event_id", event.id)
        .order("name", { ascending: true });
      if (error) throw error;
      return data as EventGuest[];
    },
  });

  const { data: assignments } = useQuery({
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

  const { data: overrides } = useQuery({
    queryKey: ["guest_invitation_overrides", subEvent.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guest_invitation_overrides")
        .select("*")
        .eq("sub_event_id", subEvent.id);
      if (error) throw error;
      return data as GuestInvitationOverride[];
    },
  });

  const toggleGroupAssignment = useMutation({
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
      queryClient.invalidateQueries({ queryKey: ["sub_event_group_assignments", subEvent.id] });
    },
  });

  const toggleGuestOverride = useMutation({
    mutationFn: async ({ guestId, isInvited }: { guestId: string; isInvited: boolean }) => {
      const existing = (overrides ?? []).find((o) => o.guest_id === guestId);
      if (existing) {
        const { error } = await supabase
          .from("guest_invitation_overrides")
          .delete()
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("guest_invitation_overrides")
          .insert({ sub_event_id: subEvent.id, guest_id: guestId, is_invited: isInvited });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest_invitation_overrides", subEvent.id] });
    },
  });

  return (
    <div className="space-y-4">
      <div>
        <h4 className="mb-2 text-sm font-semibold text-dash-text">Assign Groups</h4>
        {(!groups || groups.length === 0) && (
          <p className="text-sm text-dash-muted">No groups created. Create groups first.</p>
        )}
        <div className="space-y-2">
          {(groups ?? []).map((g) => {
            const isAssigned = (assignments ?? []).some((a) => a.group_id === g.id);
            return (
              <div key={g.id} className="flex items-center justify-between rounded-lg border border-dash-border bg-dash-bg px-3 py-2">
                <span className="text-sm text-dash-text">{g.name}</span>
                <Toggle
                  checked={isAssigned}
                  onChange={(checked) => toggleGroupAssignment.mutate({ groupId: g.id, assign: checked })}
                />
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h4 className="mb-2 text-sm font-semibold text-dash-text">Manual Overrides</h4>
        <p className="mb-2 text-xs text-dash-muted">
          Toggle individual guests to override group assignments.
        </p>
        <div className="max-h-60 space-y-1 overflow-y-auto scrollbar-thin">
          {(guests ?? []).map((guest) => {
            const override = (overrides ?? []).find((o) => o.guest_id === guest.id);
            const inAssignedGroup = (groups ?? []).some(
              (g) => (assignments ?? []).some((a) => a.group_id === g.id) && guest.group_id === g.id
            );
            const isInvited = override ? override.is_invited : inAssignedGroup;
            return (
              <div key={guest.id} className="flex items-center justify-between rounded-lg border border-dash-border bg-dash-bg px-3 py-1.5">
                <span className="text-sm text-dash-text">{guest.name}</span>
                <div className="flex items-center gap-2">
                  {override && <Badge variant="info">override</Badge>}
                  <Toggle
                    checked={isInvited}
                    onChange={() => toggleGuestOverride.mutate({ guestId: guest.id, isInvited: !isInvited })}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {(toggleGroupAssignment.isError || toggleGuestOverride.isError) && (
        <p className="text-sm text-dash-danger">Failed to update invitations</p>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-dash-border bg-dash-surface px-4 py-2 text-sm font-medium text-dash-text hover:bg-dash-bg"
        >
          Done
        </button>
      </div>
    </div>
  );
}
