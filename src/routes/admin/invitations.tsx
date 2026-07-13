import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import type {
  WeddingEvent,
  GuestGroup,
  Guest,
  GuestGroupMember,
  GroupEventInvite,
  GuestEventInvite,
} from "@/lib/supabase";
import { useHostWedding } from "@/lib/use-host-wedding";
import { Button } from "@/components/ui/Button";
import { Card, Badge, EmptyState, SectionTitle } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  Mail, Users, UserPlus, UserMinus, Check, X, ChevronDown,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type InviteStatus =
  | "invited_via_group"
  | "manually_included"
  | "manually_excluded"
  | "not_invited";

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export function AdminInvitations() {
  const { wedding } = useHostWedding();

  const [events, setEvents] = useState<WeddingEvent[]>([]);
  const [groups, setGroups] = useState<GuestGroup[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [memberships, setMemberships] = useState<GuestGroupMember[]>([]);

  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [eventDropdownOpen, setEventDropdownOpen] = useState(false);

  const [groupInvites, setGroupInvites] = useState<GroupEventInvite[]>([]);
  const [guestInvites, setGuestInvites] = useState<GuestEventInvite[]>([]);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const weddingId = wedding?.id;

  /* ---------------------------------------------------------------- */
  /* Initial data fetch: events, groups, guests, memberships          */
  /* ---------------------------------------------------------------- */

  const fetchBaseData = useCallback(async () => {
    if (!weddingId) return;
    setLoading(true);
    setError(null);

    const [eRes, gRes, guRes] = await Promise.all([
      supabase
        .from("events")
        .select("*")
        .eq("wedding_id", weddingId)
        .order("sort_order", { ascending: true }),
      supabase
        .from("guest_groups")
        .select("*")
        .eq("wedding_id", weddingId)
        .order("sort_order", { ascending: true }),
      supabase
        .from("guests")
        .select("*")
        .eq("wedding_id", weddingId)
        .order("full_name", { ascending: true }),
    ]);

    if (eRes.error || gRes.error || guRes.error) {
      setError(
        eRes.error?.message ||
          gRes.error?.message ||
          guRes.error?.message ||
          "Failed to load data",
      );
      setLoading(false);
      return;
    }

    const eventRows = (eRes.data ?? []) as WeddingEvent[];
    const groupRows = (gRes.data ?? []) as GuestGroup[];
    const guestRows = (guRes.data ?? []) as Guest[];

    setEvents(eventRows);
    setGroups(groupRows);
    setGuests(guestRows);

    // Fetch all memberships for the wedding's groups
    let memberRows: GuestGroupMember[] = [];
    if (groupRows.length > 0) {
      const groupIds = groupRows.map((g) => g.id);
      const mRes = await supabase
        .from("guest_group_members")
        .select("guest_id, group_id")
        .in("group_id", groupIds);
      if (mRes.error) {
        setError(mRes.error.message);
        setLoading(false);
        return;
      }
      memberRows = (mRes.data ?? []) as GuestGroupMember[];
    }
    setMemberships(memberRows);

    // Auto-select first event
    if (eventRows.length > 0 && !selectedEventId) {
      setSelectedEventId(eventRows[0].id);
    }

    setLoading(false);
  }, [weddingId]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------------------------------------------------------------- */
  /* Fetch invitation data for the selected event                     */
  /* ---------------------------------------------------------------- */

  const fetchInvitations = useCallback(async () => {
    if (!selectedEventId) return;
    setError(null);

    const [giRes, geiRes] = await Promise.all([
      supabase
        .from("group_event_invites")
        .select("*")
        .eq("event_id", selectedEventId),
      supabase
        .from("guest_event_invites")
        .select("*")
        .eq("event_id", selectedEventId),
    ]);

    if (giRes.error || geiRes.error) {
      setError(
        giRes.error?.message || geiRes.error?.message || "Failed to load invitations",
      );
      return;
    }

    setGroupInvites((giRes.data ?? []) as GroupEventInvite[]);
    setGuestInvites((geiRes.data ?? []) as GuestEventInvite[]);
  }, [selectedEventId]);

  useEffect(() => {
    fetchBaseData();
  }, [fetchBaseData]);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  /* ---------------------------------------------------------------- */
  /* Derived data                                                     */
  /* ---------------------------------------------------------------- */

  // Set of invited group IDs for the selected event
  const invitedGroupIds = useMemo(() => {
    return new Set(groupInvites.map((gi) => gi.group_id));
  }, [groupInvites]);

  // Map: guest_id -> Set of group_ids they belong to
  const guestGroupMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const m of memberships) {
      if (!map.has(m.guest_id)) map.set(m.guest_id, new Set());
      map.get(m.guest_id)!.add(m.group_id);
    }
    return map;
  }, [memberships]);

  // Map: guest_id -> GuestEventInvite (manual override)
  const guestOverrideMap = useMemo(() => {
    const map = new Map<string, GuestEventInvite>();
    for (const gei of guestInvites) {
      map.set(gei.guest_id, gei);
    }
    return map;
  }, [guestInvites]);

  // Compute invitation status for a single guest
  const getInviteStatus = useCallback(
    (guestId: string): InviteStatus => {
      const override = guestOverrideMap.get(guestId);
      if (override?.invite_type === "exclude") return "manually_excluded";
      if (override?.invite_type === "include") return "manually_included";

      const guestGroupIds = guestGroupMap.get(guestId);
      if (guestGroupIds) {
        for (const gid of guestGroupIds) {
          if (invitedGroupIds.has(gid)) return "invited_via_group";
        }
      }

      return "not_invited";
    },
    [guestOverrideMap, guestGroupMap, invitedGroupIds],
  );

  // Summary: how many guests are invited
  const invitedCount = useMemo(() => {
    return guests.filter((g) => {
      const status = getInviteStatus(g.id);
      return status !== "not_invited" && status !== "manually_excluded";
    }).length;
  }, [guests, getInviteStatus]);

  const selectedEvent = useMemo(
    () => events.find((e) => e.id === selectedEventId) ?? null,
    [events, selectedEventId],
  );

  /* ---------------------------------------------------------------- */
  /* Group invite toggle                                              */
  /* ---------------------------------------------------------------- */

  const toggleGroupInvite = async (groupId: string) => {
    if (!selectedEventId) return;
    setBusy(true);
    setError(null);

    const isInvited = invitedGroupIds.has(groupId);

    if (isInvited) {
      const { error: delErr } = await supabase
        .from("group_event_invites")
        .delete()
        .eq("group_id", groupId)
        .eq("event_id", selectedEventId);

      setBusy(false);
      if (delErr) {
        setError(delErr.message);
        return;
      }
      setGroupInvites((prev) =>
        prev.filter((gi) => !(gi.group_id === groupId && gi.event_id === selectedEventId)),
      );
    } else {
      const { data, error: insErr } = await supabase
        .from("group_event_invites")
        .insert({ group_id: groupId, event_id: selectedEventId })
        .select()
        .single();

      setBusy(false);
      if (insErr) {
        setError(insErr.message);
        return;
      }
      if (data) {
        setGroupInvites((prev) => [...prev, data as GroupEventInvite]);
      }
    }
  };

  /* ---------------------------------------------------------------- */
  /* Guest override toggle                                            */
  /* ---------------------------------------------------------------- */

  const setGuestOverride = async (
    guestId: string,
    type: "include" | "exclude",
  ) => {
    if (!selectedEventId) return;
    setBusy(true);
    setError(null);

    // Remove any existing override for this guest+event
    const { error: delErr } = await supabase
      .from("guest_event_invites")
      .delete()
      .eq("guest_id", guestId)
      .eq("event_id", selectedEventId);

    if (delErr) {
      setBusy(false);
      setError(delErr.message);
      return;
    }

    // Insert the new override
    const { data, error: insErr } = await supabase
      .from("guest_event_invites")
      .insert({
        guest_id: guestId,
        event_id: selectedEventId,
        invite_type: type,
      })
      .select()
      .single();

    setBusy(false);
    if (insErr) {
      setError(insErr.message);
      return;
    }

    // Update local state: remove old, add new
    setGuestInvites((prev) => {
      const filtered = prev.filter(
        (gei) => !(gei.guest_id === guestId && gei.event_id === selectedEventId),
      );
      if (data) return [...filtered, data as GuestEventInvite];
      return filtered;
    });
  };

  const clearGuestOverride = async (guestId: string) => {
    if (!selectedEventId) return;
    setBusy(true);
    setError(null);

    const { error: delErr } = await supabase
      .from("guest_event_invites")
      .delete()
      .eq("guest_id", guestId)
      .eq("event_id", selectedEventId);

    setBusy(false);
    if (delErr) {
      setError(delErr.message);
      return;
    }

    setGuestInvites((prev) =>
      prev.filter(
        (gei) => !(gei.guest_id === guestId && gei.event_id === selectedEventId),
      ),
    );
  };

  /* ---------------------------------------------------------------- */
  /* Helpers                                                          */
  /* ---------------------------------------------------------------- */

  const groupNamesForGuest = (guestId: string): string[] => {
    const gids = guestGroupMap.get(guestId);
    if (!gids || gids.size === 0) return [];
    const names: string[] = [];
    for (const gid of gids) {
      const g = groups.find((gr) => gr.id === gid);
      if (g) names.push(g.name);
    }
    return names;
  };

  const memberCountForGroup = (groupId: string): number => {
    return memberships.filter((m) => m.group_id === groupId).length;
  };

  /* ---------------------------------------------------------------- */
  /* Render                                                           */
  /* ---------------------------------------------------------------- */

  if (!weddingId) {
    return <div className="text-sepia text-sm">Loading wedding…</div>;
  }

  if (loading) {
    return <div className="text-sepia text-sm">Loading invitations…</div>;
  }

  if (events.length === 0) {
    return (
      <div className="space-y-6">
        <SectionTitle
          title="Invitations"
          subtitle="Manage who is invited to each event."
        />
        <Card>
          <EmptyState
            title="No events yet"
            description="Create events first before managing invitations."
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionTitle
        title="Invitations"
        subtitle="Manage who is invited to each event — by group, with individual overrides."
      />

      {error && (
        <div className="rounded-md border border-rose/40 bg-rose/10 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* ---------------------------------------------------------- */}
      {/* Event selector                                             */}
      {/* ---------------------------------------------------------- */}
      <div className="relative">
        <label className="block text-xs font-medium uppercase tracking-widest text-sepia mb-2">
          Select Event
        </label>
        <button
          onClick={() => setEventDropdownOpen((v) => !v)}
          className={cn(
            "flex w-full items-center justify-between gap-3 rounded-md border bg-card px-4 py-3 text-left transition-colors",
            eventDropdownOpen
              ? "border-onyx/30"
              : "border-sand hover:border-sepia/40",
          )}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sepia/10 text-sepia">
              <Mail className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="font-serif text-base text-onyx truncate">
                {selectedEvent?.name ?? "Choose an event"}
              </p>
              {selectedEvent && (
                <p className="text-xs text-sepia/60">
                  {new Date(selectedEvent.starts_at).toLocaleDateString("en-US", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                  {selectedEvent.venue_name ? ` · ${selectedEvent.venue_name}` : ""}
                </p>
              )}
            </div>
          </div>
          <ChevronDown
            className={cn(
              "w-4 h-4 text-sepia/60 shrink-0 transition-transform",
              eventDropdownOpen && "rotate-180",
            )}
          />
        </button>

        {eventDropdownOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setEventDropdownOpen(false)}
            />
            <div className="absolute z-20 mt-1 w-full rounded-md border border-sand bg-card shadow-lg overflow-hidden">
              {events.map((ev) => (
                <button
                  key={ev.id}
                  onClick={() => {
                    setSelectedEventId(ev.id);
                    setEventDropdownOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-mist",
                    ev.id === selectedEventId && "bg-onyx/5",
                  )}
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sepia/10 text-sepia">
                    <Mail className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-onyx truncate">{ev.name}</p>
                    <p className="text-xs text-sepia/60">
                      {new Date(ev.starts_at).toLocaleDateString("en-US", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  {ev.id === selectedEventId && (
                    <Check className="w-4 h-4 text-onyx shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ---------------------------------------------------------- */}
      {/* Summary                                                    */}
      {/* ---------------------------------------------------------- */}
      {selectedEventId && (
        <div className="flex items-center gap-3 rounded-md border border-sand bg-mist/60 px-4 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-onyx/5 text-onyx">
            <Users className="w-4 h-4" />
          </div>
          <p className="text-sm text-sepia">
            <span className="font-medium text-onyx">{invitedCount}</span>
            {" of "}
            <span className="font-medium text-onyx">{guests.length}</span>
            {" guest"}
            {guests.length === 1 ? "" : "s"}
            {" invited to "}
            <span className="font-medium text-onyx">{selectedEvent?.name}</span>
          </p>
        </div>
      )}

      {/* ---------------------------------------------------------- */}
      {/* Groups Invited                                             */}
      {/* ---------------------------------------------------------- */}
      {selectedEventId && (
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-sepia" />
            <h2 className="font-serif text-lg text-onyx">Groups Invited</h2>
          </div>
          <p className="text-sm text-sepia/70 mb-4">
            Toggle which groups are invited to{" "}
            <span className="font-medium text-onyx">{selectedEvent?.name}</span>.
            All members of an invited group are included unless individually
            overridden below.
          </p>

          {groups.length === 0 ? (
            <EmptyState
              title="No groups yet"
              description="Create guest groups first to invite them to events."
            />
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {groups.map((group) => {
                const isInvited = invitedGroupIds.has(group.id);
                const count = memberCountForGroup(group.id);
                return (
                  <button
                    key={group.id}
                    onClick={() => toggleGroupInvite(group.id)}
                    disabled={busy}
                    className={cn(
                      "flex items-center gap-3 rounded-md border px-4 py-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                      isInvited
                        ? "border-onyx/30 bg-onyx/5"
                        : "border-sand bg-white hover:bg-mist",
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors",
                        isInvited
                          ? "border-onyx bg-onyx text-parchment"
                          : "border-sepia/40",
                      )}
                    >
                      {isInvited && <Check className="w-3.5 h-3.5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-onyx truncate">
                        {group.name}
                      </p>
                      <p className="text-xs text-sepia/60">
                        {count} {count === 1 ? "member" : "members"}
                      </p>
                    </div>
                    {isInvited && (
                      <Badge variant="success">
                        <Check className="w-3 h-3 mr-1" />
                        Invited
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* ---------------------------------------------------------- */}
      {/* Individual Overrides                                       */}
      {/* ---------------------------------------------------------- */}
      {selectedEventId && (
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-sepia" />
            <h2 className="font-serif text-lg text-onyx">
              Individual Overrides
            </h2>
          </div>
          <p className="text-sm text-sepia/70 mb-4">
            Manually include or exclude individual guests. Exclusions override
            group invitations; inclusions add guests even if their group isn&apos;t
            invited.
          </p>

          {guests.length === 0 ? (
            <EmptyState
              title="No guests yet"
              description="Add guests first before managing individual invitations."
            />
          ) : (
            <div className="space-y-2">
              {/* Legend */}
              <div className="flex flex-wrap items-center gap-3 rounded-md border border-sand bg-mist/50 px-4 py-2.5 text-xs text-sepia/70">
                <span className="font-medium text-sepia">Legend:</span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-full bg-blue-400" />
                  Invited via group
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
                  Manually included
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
                  Manually excluded
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-full bg-sepia/30" />
                  Not invited
                </span>
              </div>

              {guests.map((guest) => {
                const status = getInviteStatus(guest.id);
                const gNames = groupNamesForGuest(guest.id);

                return (
                  <div
                    key={guest.id}
                    className="flex flex-col gap-3 rounded-md border border-sand bg-white px-4 py-3 sm:flex-row sm:items-center"
                  >
                    {/* Name + groups */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sepia/10 text-xs font-medium text-sepia">
                          {guest.full_name.charAt(0).toUpperCase()}
                        </div>
                        <p className="text-sm font-medium text-onyx truncate">
                          {guest.full_name}
                        </p>
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1 pl-10">
                        {gNames.length > 0 ? (
                          gNames.map((name) => (
                            <span
                              key={name}
                              className="inline-flex items-center rounded bg-sand/40 px-1.5 py-0.5 text-xs text-sepia/70"
                            >
                              {name}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-sepia/40">
                            No groups
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Status badge */}
                    <div className="shrink-0">
                      {status === "invited_via_group" && (
                        <Badge variant="info">Invited via group</Badge>
                      )}
                      {status === "manually_included" && (
                        <Badge variant="success">
                          <Check className="w-3 h-3 mr-1" />
                          Manually included
                        </Badge>
                      )}
                      {status === "manually_excluded" && (
                        <Badge variant="danger">
                          <X className="w-3 h-3 mr-1" />
                          Manually excluded
                        </Badge>
                      )}
                      {status === "not_invited" && (
                        <span className="inline-flex items-center rounded-full bg-sepia/10 px-2.5 py-0.5 text-xs font-medium text-sepia/60">
                          Not invited
                        </span>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex shrink-0 items-center gap-1.5">
                      {status === "manually_included" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => clearGuestOverride(guest.id)}
                          disabled={busy}
                        >
                          <X className="w-3.5 h-3.5" />
                          Clear
                        </Button>
                      ) : status === "manually_excluded" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => clearGuestOverride(guest.id)}
                          disabled={busy}
                        >
                          <X className="w-3.5 h-3.5" />
                          Clear
                        </Button>
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setGuestOverride(guest.id, "include")
                            }
                            disabled={busy}
                            className="border-green-300 text-green-700 hover:bg-green-50"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            Include
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setGuestOverride(guest.id, "exclude")
                            }
                            disabled={busy}
                            className="border-red-300 text-red-700 hover:bg-red-50"
                          >
                            <UserMinus className="w-3.5 h-3.5" />
                            Exclude
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
