import { useState, useEffect, useCallback } from "react";
import { supabase, type SubEvent, type GuestInvitationOverride } from "../../lib/supabase";
import { cn } from "../../lib/utils";
import { LoadingSpinner } from "../../components/ui";

interface InvitationManagerProps {
  eventId: string;
  guestId: string;
}

interface ResolvedInvitation {
  subEventId: string;
  invited: boolean;
  source: "group" | "override" | "default";
}

export function InvitationManager({ eventId, guestId }: InvitationManagerProps) {
  const [subEvents, setSubEvents] = useState<SubEvent[]>([]);
  const [overrides, setOverrides] = useState<Map<string, boolean>>(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: subs, error: subError } = await supabase
        .from("sub_events")
        .select("*")
        .eq("parent_event_id", eventId)
        .order("display_order", { ascending: true });

      if (subError) throw subError;
      setSubEvents((subs ?? []) as SubEvent[]);

      const { data: ovData, error: ovError } = await supabase
        .from("guest_invitation_overrides")
        .select("*")
        .eq("guest_id", guestId);

      if (ovError) throw ovError;

      const map = new Map<string, boolean>();
      for (const ov of (ovData ?? []) as GuestInvitationOverride[]) {
        map.set(ov.sub_event_id, ov.is_invited);
      }
      setOverrides(map);
    } catch (err) {
      console.error("Failed to load invitation data:", err);
    } finally {
      setLoading(false);
    }
  }, [eventId, guestId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleInvitation = async (subEventId: string, invited: boolean) => {
    setSaving(subEventId);
    try {
      const existing = overrides.has(subEventId);
      if (existing) {
        const { error } = await supabase
          .from("guest_invitation_overrides")
          .update({ is_invited: invited })
          .eq("guest_id", guestId)
          .eq("sub_event_id", subEventId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("guest_invitation_overrides")
          .insert({
            guest_id: guestId,
            sub_event_id: subEventId,
            is_invited: invited,
          });
        if (error) throw error;
      }

      setOverrides((prev) => {
        const next = new Map(prev);
        next.set(subEventId, invited);
        return next;
      });
    } catch (err) {
      console.error("Failed to update invitation:", err);
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner className="h-6 w-6" />
      </div>
    );
  }

  if (subEvents.length === 0) {
    return (
      <p className="text-sm text-dash-muted py-4">
        No events created yet. Create events first to manage invitations.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-dash-text">
        Invited Events
      </label>
      <p className="text-xs text-dash-muted mb-3">
        Click to toggle whether this guest is invited to each event.
      </p>
      <div className="flex flex-wrap gap-2">
        {subEvents.map((subEvent) => {
          const isInvited = overrides.has(subEvent.id)
            ? overrides.get(subEvent.id)!
            : true; // default: invited
          const isSaving = saving === subEvent.id;
          return (
            <button
              key={subEvent.id}
              type="button"
              disabled={isSaving}
              onClick={() => toggleInvitation(subEvent.id, !isInvited)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                isInvited
                  ? "border-dash-primary/30 bg-dash-primary/10 text-dash-primary"
                  : "border-dash-border bg-dash-bg text-dash-muted",
                isSaving && "opacity-50 cursor-wait"
              )}
            >
              {isSaving ? (
                <LoadingSpinner className="h-3 w-3" />
              ) : (
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    isInvited ? "bg-dash-primary" : "bg-dash-border"
                  )}
                />
              )}
              {subEvent.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
