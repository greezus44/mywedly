import { useCallback, useEffect, useState } from "react";
import {
  Calendar, Users, UserPlus, UserMinus, Check, X, Mail, Save,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Guest, GuestGroup, WeddingEvent } from "@/lib/supabase";
import { useHostWedding } from "@/lib/use-host-wedding";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Label, Select } from "@/components/ui/Input";
import { Card, Badge, EmptyState, SectionTitle, Toast } from "@/components/ui";

type GroupWithMembers = GuestGroup & { members: Guest[] };

type GuestOverride = {
  guest_id: string;
  type: "include" | "exclude";
};

export function AdminInvitations() {
  const { wedding, loading } = useHostWedding();

  const [events, setEvents] = useState<WeddingEvent[]>([]);
  const [groups, setGroups] = useState<GroupWithMembers[]>([]);
  const [allGuests, setAllGuests] = useState<Guest[]>([]);
  const [fetching, setFetching] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [invitedGroupIds, setInvitedGroupIds] = useState<Set<string>>(new Set());
  const [overrides, setOverrides] = useState<Map<string, "include" | "exclude">>(new Map());
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const weddingId = wedding?.id ?? null;

  const fetchAll = useCallback(async () => {
    if (!weddingId) return;
    setFetching(true);
    const [ev, gr, g] = await Promise.all([
      supabase.from("events").select("*").eq("wedding_id", weddingId).order("starts_at", { ascending: true }),
      supabase.from("guest_groups").select("*").eq("wedding_id", weddingId).order("sort_order", { ascending: true }),
      supabase.from("guests").select("*").eq("wedding_id", weddingId).order("full_name", { ascending: true }),
    ]);
    const eventList = (ev.data ?? []) as WeddingEvent[];
    const groupList = (gr.data ?? []) as GuestGroup[];
    const guestList = (g.data ?? []) as Guest[];
    setEvents(eventList);
    setAllGuests(guestList);
    setGroups(
      groupList.map((group) => ({
        ...group,
        members: guestList.filter((gu) => gu.group_id === group.id),
      })),
    );
    if (eventList.length > 0 && !selectedEventId) {
      setSelectedEventId(eventList[0].id);
    }
    setFetching(false);
  }, [weddingId]);

  // ─── Load existing invitations when event changes ───
  const loadInvitations = useCallback(async (eventId: string) => {
    if (!eventId) {
      setInvitedGroupIds(new Set());
      setOverrides(new Map());
      return;
    }

    // Load group invites
    const { data: groupInvites } = await supabase
      .from("group_event_invites")
      .select("group_id")
      .eq("event_id", eventId);

    const groupSet = new Set<string>();
    (groupInvites ?? []).forEach((gi: { group_id: string }) => groupSet.add(gi.group_id));
    setInvitedGroupIds(groupSet);

    // Load guest overrides
    const { data: guestInvites } = await supabase
      .from("guest_event_invites")
      .select("guest_id, invite_type")
      .eq("event_id", eventId);

    const overrideMap = new Map<string, "include" | "exclude">();
    (guestInvites ?? []).forEach((gi: { guest_id: string; invite_type: string }) => {
      overrideMap.set(gi.guest_id, gi.invite_type as "include" | "exclude");
    });
    setOverrides(overrideMap);
  }, []);

  useEffect(() => {
    if (weddingId) fetchAll();
  }, [weddingId, fetchAll]);

  useEffect(() => {
    if (selectedEventId) loadInvitations(selectedEventId);
  }, [selectedEventId, loadInvitations]);

  // ─── Toggle group invite ───
  const toggleGroup = (groupId: string) => {
    setInvitedGroupIds((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  // ─── Toggle guest override ───
  const toggleOverride = (guestId: string, type: "include" | "exclude") => {
    setOverrides((prev) => {
      const next = new Map(prev);
      if (next.get(guestId) === type) {
        next.delete(guestId);
      } else {
        next.set(guestId, type);
      }
      return next;
    });
  };

  // ─── Compute invited guests ───
  // Precedence: manual exclude > manual include > group invite
  const invitedGuestIds = new Set<string>();
  for (const guest of allGuests) {
    const override = overrides.get(guest.id);
    if (override === "exclude") continue; // manual exclude wins
    if (override === "include") {
      invitedGuestIds.add(guest.id);
      continue;
    }
    // No override — check group membership
    if (guest.group_id && invitedGroupIds.has(guest.group_id)) {
      invitedGuestIds.add(guest.id);
    }
  }

  const invitedCount = invitedGuestIds.size;
  const totalGuests = allGuests.length;

  // ─── Save invitations ───
  const save = async () => {
    if (!selectedEventId) return;
    setSaving(true);

    // Clear existing group invites for this event
    await supabase.from("group_event_invites").delete().eq("event_id", selectedEventId);
    // Insert new group invites
    const groupRows = Array.from(invitedGroupIds).map((group_id) => ({
      group_id,
      event_id: selectedEventId,
    }));
    if (groupRows.length > 0) {
      await supabase.from("group_event_invites").insert(groupRows);
    }

    // Clear existing guest overrides for this event
    await supabase.from("guest_event_invites").delete().eq("event_id", selectedEventId);
    // Insert new overrides
    const guestRows = Array.from(overrides.entries()).map(([guest_id, invite_type]) => ({
      guest_id,
      event_id: selectedEventId,
      invite_type,
    }));
    if (guestRows.length > 0) {
      await supabase.from("guest_event_invites").insert(guestRows);
    }

    setSaving(false);
    setToast({ message: "Invitations saved", type: "success" });
  };

  if (loading || fetching) {
    return <div className="flex items-center justify-center py-24 text-sepia">Loading invitations…</div>;
  }

  if (!wedding) {
    return <EmptyState title="No wedding found" description="Create a wedding to manage invitations." />;
  }

  if (events.length === 0) {
    return (
      <div>
        <SectionTitle title="Invitations" subtitle="Manage who is invited to each event." />
        <EmptyState
          title="No events yet"
          description="Create events first, then you can manage invitations for them."
        />
      </div>
    );
  }

  const selectedEvent = events.find((e) => e.id === selectedEventId);

  return (
    <div>
      <SectionTitle
        title="Invitations"
        subtitle="Invite groups and add individual overrides per event."
        action={
          <Button size="sm" onClick={save} disabled={saving}>
            <Save className="w-4 h-4" /> {saving ? "Saving…" : "Save Invitations"}
          </Button>
        }
      />

      {/* ─── Event selector ─── */}
      <Card className="p-5 mb-6">
        <Label>Select Event</Label>
        <Select
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
          className="max-w-md"
        >
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.name} ({event.kind})
            </option>
          ))}
        </Select>
        {selectedEvent && (
          <div className="flex items-center gap-3 mt-3 text-xs text-sepia/60">
            <Badge variant="info">{selectedEvent.kind}</Badge>
            {selectedEvent.starts_at && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(selectedEvent.starts_at).toLocaleDateString("en-US", {
                  weekday: "short", day: "numeric", month: "long", year: "numeric",
                })}
              </span>
            )}
          </div>
        )}
      </Card>

      {/* ─── Summary ─── */}
      <Card className="p-5 mb-6 bg-gradient-to-br from-mist to-parchment">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-sepia/60 mb-1">Invitation Summary</p>
            <p className="text-2xl font-serif text-onyx">
              {invitedCount} <span className="text-base text-sepia/60">of {totalGuests} guests invited</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="success">
              <Check className="w-3 h-3 mr-1" />
              {invitedCount} invited
            </Badge>
            <Badge variant="default">
              <X className="w-3 h-3 mr-1" />
              {totalGuests - invitedCount} excluded
            </Badge>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ─── Group invites ─── */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-sepia" />
            <h3 className="text-sm font-medium text-onyx">Group Invitations</h3>
          </div>
          {groups.length === 0 ? (
            <p className="text-sm text-sepia/50 py-8 text-center">
              No groups yet. Create groups to invite entire groups at once.
            </p>
          ) : (
            <div className="space-y-2">
              {groups.map((group) => {
                const isInvited = invitedGroupIds.has(group.id);
                return (
                  <button
                    key={group.id}
                    onClick={() => toggleGroup(group.id)}
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded-lg border transition-all text-left",
                      isInvited
                        ? "border-green-300 bg-green-50"
                        : "border-sand bg-white hover:bg-mist/30",
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn(
                        "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                        isInvited ? "bg-green-100" : "bg-mist",
                      )}>
                        <Users className={cn("w-5 h-5", isInvited ? "text-green-600" : "text-sepia/50")} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-onyx truncate">{group.name}</p>
                        <p className="text-xs text-sepia/50">{group.members.length} members</p>
                      </div>
                    </div>
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                      isInvited ? "border-green-500 bg-green-500" : "border-sand",
                    )}>
                      {isInvited && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </Card>

        {/* ─── Individual overrides ─── */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="w-4 h-4 text-sepia" />
            <h3 className="text-sm font-medium text-onyx">Individual Overrides</h3>
          </div>
          <p className="text-xs text-sepia/60 mb-4">
            Include or exclude individual guests. Overrides take precedence over group invitations.
          </p>
          {allGuests.length === 0 ? (
            <p className="text-sm text-sepia/50 py-8 text-center">No guests yet.</p>
          ) : (
            <div className="space-y-1.5 max-h-96 overflow-y-auto">
              {allGuests.map((guest) => {
                const override = overrides.get(guest.id);
                const groupInvited = guest.group_id ? invitedGroupIds.has(guest.group_id) : false;
                const isInvited = override === "include" || (!override && groupInvited);
                const isExcluded = override === "exclude";

                return (
                  <div
                    key={guest.id}
                    className={cn(
                      "flex items-center justify-between p-2.5 rounded-lg border transition-colors",
                      isExcluded
                        ? "border-red-200 bg-red-50"
                        : override === "include"
                          ? "border-green-200 bg-green-50"
                          : "border-sand/50 bg-white",
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={cn(
                        "w-2 h-2 rounded-full shrink-0",
                        isExcluded ? "bg-red-400" : isInvited ? "bg-green-400" : "bg-sand",
                      )} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-onyx truncate">{guest.full_name}</p>
                        {guest.group_id && (
                          <p className="text-xs text-sepia/50 truncate">
                            {groups.find((g) => g.id === guest.group_id)?.name ?? "Unknown group"}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant={override === "include" ? "primary" : "ghost"}
                        size="sm"
                        onClick={() => toggleOverride(guest.id, "include")}
                        className={cn(override !== "include" && "text-green-600")}
                        title="Manually include"
                      >
                        <UserPlus className="w-3 h-3" />
                      </Button>
                      <Button
                        variant={override === "exclude" ? "danger" : "ghost"}
                        size="sm"
                        onClick={() => toggleOverride(guest.id, "exclude")}
                        className={cn(override !== "exclude" && "text-red-600 hover:bg-red-50")}
                        title="Manually exclude"
                      >
                        <UserMinus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-sand/50 text-xs text-sepia/60">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-400" /> Invited
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-400" /> Excluded
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sand" /> Not invited
            </span>
          </div>
        </Card>
      </div>

      {/* ─── Toast ─── */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
