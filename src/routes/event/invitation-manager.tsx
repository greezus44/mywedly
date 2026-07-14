import { useState } from "react";
import type { GuestGroup, EventGuest } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { cn } from "../../lib/utils";

export function InvitationManager({
  subEventId,
  groups,
  guests,
  isGroupAssigned,
  getGuestOverride,
  onToggleGroup,
  onToggleGuestOverride,
}: {
  subEventId: string;
  groups: GuestGroup[];
  guests: EventGuest[];
  isGroupAssigned: (subEventId: string, groupId: string) => boolean;
  getGuestOverride: (subEventId: string, guestId: string) => boolean | null;
  onToggleGroup: (groupId: string) => void;
  onToggleGuestOverride: (guestId: string, isInvited: boolean) => void;
}) {
  const [showOverrides, setShowOverrides] = useState(false);

  return (
    <div className="space-y-4">
      <div>
        <h4 className="mb-2 text-sm font-semibold text-dash-text">Group Assignments</h4>
        <p className="mb-3 text-xs text-dash-muted">
          Select which groups are invited to this event.
        </p>
        <div className="flex flex-wrap gap-2">
          {groups.length === 0 ? (
            <p className="text-sm text-dash-muted">No groups created yet.</p>
          ) : (
            groups.map((group) => {
              const assigned = isGroupAssigned(subEventId, group.id);
              return (
                <button
                  key={group.id}
                  onClick={() => onToggleGroup(group.id)}
                  className={cn(
                    "rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
                    assigned
                      ? "border-dash-primary bg-dash-primary text-dash-primary-fg"
                      : "border-dash-border bg-dash-surface text-dash-text hover:bg-dash-bg"
                  )}
                >
                  {group.name}
                </button>
              );
            })
          )}
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-sm font-semibold text-dash-text">Manual Overrides</h4>
          <Button size="sm" variant="ghost" onClick={() => setShowOverrides(!showOverrides)}>
            {showOverrides ? "Hide" : "Show"}
          </Button>
        </div>
        {showOverrides && (
          <div className="max-h-64 space-y-1 overflow-y-auto scrollbar-thin">
            {guests.length === 0 ? (
              <p className="text-sm text-dash-muted">No guests added yet.</p>
            ) : (
              guests.map((guest) => {
                const override = getGuestOverride(subEventId, guest.id);
                return (
                  <div
                    key={guest.id}
                    className="flex items-center justify-between rounded-md border border-dash-border bg-dash-surface px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium text-dash-text">{guest.name}</p>
                      <p className="text-xs text-dash-muted">
                        {guest.group_name ?? "No group"}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => onToggleGuestOverride(guest.id, true)}
                        className={cn(
                          "rounded px-2 py-1 text-xs font-medium transition-colors",
                          override === true
                            ? "bg-green-100 text-green-700"
                            : "text-dash-muted hover:bg-dash-bg"
                        )}
                      >
                        Invite
                      </button>
                      <button
                        onClick={() => onToggleGuestOverride(guest.id, false)}
                        className={cn(
                          "rounded px-2 py-1 text-xs font-medium transition-colors",
                          override === false
                            ? "bg-red-100 text-red-700"
                            : "text-dash-muted hover:bg-dash-bg"
                        )}
                      >
                        Exclude
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
