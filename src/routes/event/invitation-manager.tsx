import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type SubEvent, type GuestInvitationOverride } from "../../lib/supabase";
import { Button, Toggle, LoadingSpinner } from "../../components/ui";
import { formatDateShort } from "../../lib/utils";

interface InvitationManagerProps {
  guestId: string;
  eventId: string;
  onClose: () => void;
}

export function InvitationManager({ guestId, eventId, onClose }: InvitationManagerProps) {
  const queryClient = useQueryClient();

  const { data: subEvents, isLoading: seLoading } = useQuery({
    queryKey: ["sub-events", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sub_events")
        .select("*")
        .eq("parent_event_id", eventId)
        .order("event_date", { ascending: true });
      if (error) throw error;
      return (data ?? []) as SubEvent[];
    },
  });

  const { data: overrides, isLoading: ovLoading } = useQuery({
    queryKey: ["guest-invitation-overrides", guestId, eventId],
    queryFn: async () => {
      const subIds = (subEvents ?? []).map((s) => s.id);
      if (subIds.length === 0) return [];
      const { data, error } = await supabase
        .from("guest_invitation_overrides")
        .select("*")
        .eq("guest_id", guestId)
        .in("sub_event_id", subIds);
      if (error) throw error;
      return (data ?? []) as GuestInvitationOverride[];
    },
    enabled: (subEvents ?? []).length > 0,
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ subEventId, isInvited }: { subEventId: string; isInvited: boolean }) => {
      const existing = (overrides ?? []).find((o) => o.sub_event_id === subEventId);
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["guest-invitation-overrides", guestId, eventId] }),
  });

  const clearMutation = useMutation({
    mutationFn: async (subEventId: string) => {
      const { error } = await supabase
        .from("guest_invitation_overrides")
        .delete()
        .eq("guest_id", guestId)
        .eq("sub_event_id", subEventId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["guest-invitation-overrides", guestId, eventId] }),
  });

  if (seLoading || ovLoading) {
    return <div className="flex justify-center py-8"><LoadingSpinner /></div>;
  }

  if (!subEvents || subEvents.length === 0) {
    return (
      <div className="py-4">
        <p className="text-sm text-dash-muted text-center">No events created yet. Add events to manage invitations.</p>
        <div className="mt-4 flex justify-end">
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-dash-muted">
        Override the default invitation status for this guest on each event. Leave as "Default" to use group-based rules.
      </p>

      <div className="space-y-3">
        {subEvents.map((se) => {
          const override = (overrides ?? []).find((o) => o.sub_event_id === se.id);
          const isOverridden = !!override;
          const isInvited = override?.is_invited ?? true; // default: invited

          return (
            <div key={se.id} className="rounded-md border border-dash-border p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-dash-text">{se.name}</p>
                  {se.event_date && (
                    <p className="text-xs text-dash-muted">{formatDateShort(se.event_date)}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {isOverridden ? (
                    <>
                      <Toggle
                        checked={isInvited}
                        onChange={(v) => toggleMutation.mutate({ subEventId: se.id, isInvited: v })}
                        label={isInvited ? "Invited" : "Not invited"}
                      />
                      <button
                        type="button"
                        onClick={() => clearMutation.mutate(se.id)}
                        className="text-xs text-dash-muted hover:text-dash-text underline"
                      >
                        Reset
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-dash-muted">Default (group rules)</span>
                      <button
                        type="button"
                        onClick={() => toggleMutation.mutate({ subEventId: se.id, isInvited: true })}
                        className="text-xs text-dash-primary hover:underline"
                      >
                        Override
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end">
        <Button variant="secondary" onClick={onClose}>Done</Button>
      </div>
    </div>
  );
}
