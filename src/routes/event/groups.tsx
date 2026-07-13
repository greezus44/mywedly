import { useState, useMemo } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  supabase,
  type UserEvent,
  type SubEvent,
  type GuestGroup,
  type GuestGroupMember,
  type GroupEventInvite,
  type GuestEventInvite,
  type EventGuest,
} from "../../lib/supabase";
import { cn } from "../../lib/utils";
import { Button } from "../../components/ui/Button";
import { Card, Badge, EmptyState, Skeleton, ErrorState, Toast, Modal } from "../../components/ui";
import { Input } from "../../components/ui/Input";
import {
  Plus,
  Trash2,
  Pencil,
  Users,
  ChevronDown,
  ChevronRight,
  UserPlus,
  X,
  Info,
  Check,
  Calendar,
  UserCheck,
} from "lucide-react";

interface EventContext {
  event: UserEvent;
}

interface GroupWithMeta extends GuestGroup {
  guestCount: number;
  members: EventGuest[];
  invitedSubEventIds: string[];
}

const PRIORITY_NOTE = "1. Manual Override  2. Group Invitation  3. Not Invited";

export default function GroupsPage() {
  const { eventId } = useParams();
  const { event } = useOutletContext<EventContext>();
  const queryClient = useQueryClient();

  const [newGroupName, setNewGroupName] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [assignModalGroup, setAssignModalGroup] = useState<string | null>(null);
  const [selectedSubEvents, setSelectedSubEvents] = useState<Record<string, boolean>>({});
  const [assignGuestSearch, setAssignGuestSearch] = useState("");
  const [assignSelectedGuests, setAssignSelectedGuests] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const groupsKey = ["guest-groups", eventId];
  const subEventsKey = ["sub-events", eventId];
  const membersKey = ["guest-group-members", eventId];
  const guestsKey = ["event-guests", eventId];
  const groupInvitesKey = ["group-event-invites", eventId];
  const guestInvitesKey = ["guest-event-invites", eventId];

  const { data: groups, isLoading: groupsLoading, isError: groupsError, error: groupsErr, refetch: refetchGroups } = useQuery({
    queryKey: groupsKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guest_groups")
        .select("*")
        .eq("wedding_id", eventId)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as GuestGroup[];
    },
    enabled: !!eventId,
  });

  const { data: subEvents } = useQuery({
    queryKey: subEventsKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sub_events")
        .select("*")
        .eq("parent_event_id", eventId)
        .order("order_index", { ascending: true });
      if (error) throw error;
      return data as SubEvent[];
    },
    enabled: !!eventId,
  });

  const { data: members } = useQuery({
    queryKey: membersKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guest_group_members")
        .select("*, guest_groups!inner(wedding_id)")
        .eq("guest_groups.wedding_id", eventId);
      if (error) throw error;
      return data as (GuestGroupMember & { guest_groups: { wedding_id: string } })[];
    },
    enabled: !!eventId,
  });

  const { data: guests } = useQuery({
    queryKey: guestsKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_guests")
        .select("*")
        .eq("event_id", eventId)
        .order("name", { ascending: true });
      if (error) throw error;
      return data as EventGuest[];
    },
    enabled: !!eventId,
  });

  const { data: groupInvites } = useQuery({
    queryKey: groupInvitesKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("group_event_invites")
        .select("*, guest_groups!inner(wedding_id)")
        .eq("guest_groups.wedding_id", eventId);
      if (error) throw error;
      return data as (GroupEventInvite & { guest_groups: { wedding_id: string } })[];
    },
    enabled: !!eventId,
  });

  const { data: guestInvites } = useQuery({
    queryKey: guestInvitesKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guest_event_invites")
        .select("*, event_guests!inner(event_id)")
        .eq("event_guests.event_id", eventId);
      if (error) throw error;
      return data as (GuestEventInvite & { event_guests: { event_id: string } })[];
    },
    enabled: !!eventId,
  });

  const enrichedGroups: GroupWithMeta[] = useMemo(() => {
    if (!groups) return [];
    return groups.map((g) => {
      const groupMemberRows = (members || []).filter((m) => m.group_id === g.id);
      const groupGuests = groupMemberRows
        .map((m) => (guests || []).find((gst) => gst.id === m.guest_id))
        .filter((x): x is EventGuest => Boolean(x));
      const invitedSubEventIds = (groupInvites || [])
        .filter((gi) => gi.group_id === g.id)
        .map((gi) => gi.sub_event_id)
        .filter((id): id is string => Boolean(id));
      return {
        ...g,
        guestCount: groupGuests.length,
        members: groupGuests,
        invitedSubEventIds,
      };
    });
  }, [groups, members, guests, groupInvites]);

  // Manual overrides: guest_event_invites with invite_type
  const manualOverrides = useMemo(() => {
    return (guestInvites || []).map((gi) => {
      const guest = (guests || []).find((g) => g.id === gi.guest_id);
      const subEvent = (subEvents || []).find((se) => se.id === gi.sub_event_id);
      return {
        ...gi,
        guestName: guest?.name || "Unknown guest",
        subEventName: subEvent?.name || "Entire event",
      };
    });
  }, [guestInvites, guests, subEvents]);

  const createGroupMutation = useMutation({
    mutationFn: async () => {
      if (!eventId) throw new Error("Missing event id");
      if (!newGroupName.trim()) throw new Error("Group name is required");
      const orderIndex = (groups?.length || 0);
      const { data, error } = await supabase
        .from("guest_groups")
        .insert({
          wedding_id: eventId,
          name: newGroupName.trim(),
          sort_order: orderIndex,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupsKey });
      queryClient.invalidateQueries({ queryKey: membersKey });
      setNewGroupName("");
      setToast({ message: "Group created", type: "success" });
    },
    onError: (err: Error) => {
      setToast({ message: `Failed to create group: ${err.message}`, type: "error" });
    },
  });

  const renameGroupMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase
        .from("guest_groups")
        .update({ name, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupsKey });
      setRenamingId(null);
      setRenameValue("");
      setToast({ message: "Group renamed", type: "success" });
    },
    onError: (err: Error) => {
      setToast({ message: `Failed to rename: ${err.message}`, type: "error" });
    },
  });

  const deleteGroupMutation = useMutation({
    mutationFn: async (id: string) => {
      // Remove members association (does NOT delete guests themselves)
      const { error: mErr } = await supabase
        .from("guest_group_members")
        .delete()
        .eq("group_id", id);
      if (mErr) throw mErr;
      const { error: giErr } = await supabase
        .from("group_event_invites")
        .delete()
        .eq("group_id", id);
      if (giErr) throw giErr;
      const { error: gErr } = await supabase
        .from("guest_groups")
        .delete()
        .eq("id", id);
      if (gErr) throw gErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupsKey });
      queryClient.invalidateQueries({ queryKey: membersKey });
      queryClient.invalidateQueries({ queryKey: groupInvitesKey });
      setDeleteId(null);
      setToast({ message: "Group deleted (guests kept)", type: "success" });
    },
    onError: (err: Error) => {
      setToast({ message: `Failed to delete group: ${err.message}`, type: "error" });
      setDeleteId(null);
    },
  });

  const bulkInviteMutation = useMutation({
    mutationFn: async ({ groupId, subEventIds }: { groupId: string; subEventIds: string[] }) => {
      if (!eventId) throw new Error("Missing event id");
      if (subEventIds.length === 0) {
        // Remove all invites for this group
        const { error } = await supabase
          .from("group_event_invites")
          .delete()
          .eq("group_id", groupId)
          .eq("event_id", eventId);
        if (error) throw error;
        return;
      }
      // Remove existing invites for this group, then insert new ones
      const { error: delErr } = await supabase
        .from("group_event_invites")
        .delete()
        .eq("group_id", groupId)
        .eq("event_id", eventId);
      if (delErr) throw delErr;
      const rows = subEventIds.map((seId) => ({
        group_id: groupId,
        event_id: eventId,
        sub_event_id: seId,
      }));
      const { error: insErr } = await supabase.from("group_event_invites").insert(rows);
      if (insErr) throw insErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupInvitesKey });
      queryClient.invalidateQueries({ queryKey: guestInvitesKey });
      setSelectedSubEvents({});
      setToast({ message: "Bulk invitation updated", type: "success" });
    },
    onError: (err: Error) => {
      setToast({ message: `Failed to update invites: ${err.message}`, type: "error" });
    },
  });

  const removeGroupInviteMutation = useMutation({
    mutationFn: async ({ groupId, subEventId }: { groupId: string; subEventId: string }) => {
      if (!eventId) throw new Error("Missing event id");
      const { error } = await supabase
        .from("group_event_invites")
        .delete()
        .eq("group_id", groupId)
        .eq("sub_event_id", subEventId)
        .eq("event_id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupInvitesKey });
      setToast({ message: "Sub-event invitation removed", type: "success" });
    },
    onError: (err: Error) => {
      setToast({ message: `Failed to remove invite: ${err.message}`, type: "error" });
    },
  });

  const assignGuestsMutation = useMutation({
    mutationFn: async ({ groupId, guestIds }: { groupId: string; guestIds: string[] }) => {
      // Remove existing members for this group, then insert new ones
      const { error: delErr } = await supabase
        .from("guest_group_members")
        .delete()
        .eq("group_id", groupId);
      if (delErr) throw delErr;
      if (guestIds.length === 0) return;
      const rows = guestIds.map((gid) => ({ group_id: groupId, guest_id: gid }));
      const { error: insErr } = await supabase.from("guest_group_members").insert(rows);
      if (insErr) throw insErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: membersKey });
      setAssignModalGroup(null);
      setAssignGuestSearch("");
      setAssignSelectedGuests({});
      setToast({ message: "Guests assigned to group", type: "success" });
    },
    onError: (err: Error) => {
      setToast({ message: `Failed to assign guests: ${err.message}`, type: "error" });
    },
  });

  const deleteManualOverrideMutation = useMutation({
    mutationFn: async ({ guestId, subEventId }: { guestId: string; subEventId: string | null }) => {
      let query = supabase
        .from("guest_event_invites")
        .delete()
        .eq("guest_id", guestId);
      if (subEventId) {
        query = query.eq("sub_event_id", subEventId);
      } else {
        query = query.is("sub_event_id", null);
      }
      const { error } = await query;
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: guestInvitesKey });
      setToast({ message: "Manual override removed", type: "success" });
    },
    onError: (err: Error) => {
      setToast({ message: `Failed to remove override: ${err.message}`, type: "error" });
    },
  });

  const startRename = (g: GuestGroup) => {
    setRenamingId(g.id);
    setRenameValue(g.name);
  };

  const submitRename = () => {
    if (!renamingId || !renameValue.trim()) return;
    renameGroupMutation.mutate({ id: renamingId, name: renameValue.trim() });
  };

  const openAssignModal = (groupId: string) => {
    const currentMemberIds = (members || [])
      .filter((m) => m.group_id === groupId)
      .map((m) => m.guest_id);
    const initial: Record<string, boolean> = {};
    currentMemberIds.forEach((id) => { initial[id] = true; });
    setAssignSelectedGuests(initial);
    setAssignGuestSearch("");
    setAssignModalGroup(groupId);
  };

  const toggleAssignGuest = (guestId: string) => {
    setAssignSelectedGuests((prev) => ({ ...prev, [guestId]: !prev[guestId] }));
  };

  const submitAssign = () => {
    if (!assignModalGroup) return;
    const selected = Object.entries(assignSelectedGuests)
      .filter(([, v]) => v)
      .map(([id]) => id);
    assignGuestsMutation.mutate({ groupId: assignModalGroup, guestIds: selected });
  };

  const openBulkInvite = (groupId: string) => {
    const current = (groupInvites || [])
      .filter((gi) => gi.group_id === groupId)
      .reduce<Record<string, boolean>>((acc, gi) => {
        if (gi.sub_event_id) acc[gi.sub_event_id] = true;
        return acc;
      }, {});
    setSelectedSubEvents(current);
    setExpandedId(expandedId === groupId ? null : groupId);
  };

  const toggleSubEvent = (seId: string) => {
    setSelectedSubEvents((prev) => ({ ...prev, [seId]: !prev[seId] }));
  };

  const submitBulkInvite = (groupId: string) => {
    const selected = Object.entries(selectedSubEvents)
      .filter(([, v]) => v)
      .map(([id]) => id);
    bulkInviteMutation.mutate({ groupId, subEventIds: selected });
  };

  const filteredGuestsForAssign = (guests || []).filter((g) =>
    g.name.toLowerCase().includes(assignGuestSearch.toLowerCase()) ||
    g.email.toLowerCase().includes(assignGuestSearch.toLowerCase())
  );

  const inviteTypeVariant = (type: string): "success" | "warning" | "default" => {
    if (type === "override") return "warning";
    if (type === "invited") return "success";
    return "default";
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-2xl">Guest Groups</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Organize guests into groups and bulk-invite them to sub-events for {event.draft_name || event.name}.
          </p>
        </div>
      </div>

      {/* Priority note */}
      <Card className="p-4 flex items-start gap-3 bg-blue-50/50 border-blue-200">
        <Info className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-blue-900">Invitation Priority</p>
          <p className="text-xs text-blue-700 mt-0.5">
            When resolving whether a guest is invited to a sub-event, the system checks in this order:
          </p>
          <p className="text-xs font-mono text-blue-900 mt-1.5 font-medium">{PRIORITY_NOTE}</p>
        </div>
      </Card>

      {/* Inline create */}
      <Card className="p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Input
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="New group name (e.g. Bride's Family, Groomsmen, VIP)"
            className="flex-1 min-w-[200px]"
            onKeyDown={(e) => {
              if (e.key === "Enter" && newGroupName.trim()) createGroupMutation.mutate();
            }}
          />
          <Button onClick={() => createGroupMutation.mutate()} loading={createGroupMutation.isPending} disabled={!newGroupName.trim()}>
            <Plus className="w-4 h-4" /> Create Group
          </Button>
        </div>
      </Card>

      {groupsLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : groupsError ? (
        <ErrorState message={(groupsErr as Error)?.message || "Failed to load groups"} onRetry={() => refetchGroups()} />
      ) : enrichedGroups.length === 0 ? (
        <EmptyState
          icon={<Users className="w-12 h-12" />}
          title="No guest groups yet"
          description="Create groups like 'Bride's Family' or 'College Friends' to bulk-invite guests to sub-events."
        />
      ) : (
        <div className="space-y-3">
          {enrichedGroups.map((g) => {
            const isExpanded = expandedId === g.id;
            const isRenaming = renamingId === g.id;
            return (
              <Card key={g.id} className="overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : g.id)}
                        className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-subtle)] transition-colors mt-0.5"
                        style={{ borderRadius: "var(--radius)" }}
                      >
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                      <div className="min-w-0 flex-1">
                        {isRenaming ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={renameValue}
                              onChange={(e) => setRenameValue(e.target.value)}
                              className="max-w-xs"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") submitRename();
                                if (e.key === "Escape") { setRenamingId(null); setRenameValue(""); }
                              }}
                            />
                            <Button size="sm" onClick={submitRename} loading={renameGroupMutation.isPending}>Save</Button>
                            <Button size="sm" variant="ghost" onClick={() => { setRenamingId(null); setRenameValue(""); }}>Cancel</Button>
                          </div>
                        ) : (
                          <>
                            <h3 className="font-heading text-lg truncate">{g.name}</h3>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <Badge variant="info">
                                <Users className="w-3 h-3 mr-1" /> {g.guestCount} {g.guestCount === 1 ? "guest" : "guests"}
                              </Badge>
                              {g.invitedSubEventIds.length > 0 && (
                                <Badge variant="success">
                                  <Calendar className="w-3 h-3 mr-1" /> {g.invitedSubEventIds.length} sub-event{g.invitedSubEventIds.length === 1 ? "" : "s"}
                                </Badge>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Button size="sm" variant="secondary" onClick={() => openAssignModal(g.id)}>
                        <UserPlus className="w-3.5 h-3.5" /> Assign
                      </Button>
                      <button
                        onClick={() => startRename(g)}
                        className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-subtle)] transition-colors"
                        style={{ borderRadius: "var(--radius)" }}
                        title="Rename"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteId(g.id)}
                        className="p-1.5 text-[var(--color-text-muted)] hover:text-red-600 hover:bg-red-50 transition-colors"
                        style={{ borderRadius: "var(--radius)" }}
                        title="Delete group"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Invited sub-event badges */}
                  {g.invitedSubEventIds.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                      <span className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">Invited to:</span>
                      {g.invitedSubEventIds.map((seId) => {
                        const se = (subEvents || []).find((s) => s.id === seId);
                        return (
                          <span
                            key={seId}
                            className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-green-50 text-green-700"
                            style={{ borderRadius: "var(--radius)" }}
                          >
                            {se?.name || "Unknown"}
                            <button
                              onClick={() => removeGroupInviteMutation.mutate({ groupId: g.id, subEventId: seId })}
                              className="hover:text-red-600 transition-colors"
                              title="Remove this invitation"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Expandable bulk invite + guest list */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-[var(--color-border)] space-y-4">
                      {/* Guest list */}
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
                          Guests in this group ({g.guestCount})
                        </p>
                        {g.members.length === 0 ? (
                          <p className="text-sm text-[var(--color-text-muted)] italic">No guests assigned yet.</p>
                        ) : (
                          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {g.members.map((m) => (
                              <div key={m.id} className="flex items-center gap-2 px-3 py-2 bg-[var(--color-bg-subtle)]" style={{ borderRadius: "var(--radius)" }}>
                                <UserCheck className="w-3.5 h-3.5 text-[var(--color-text-muted)] shrink-0" />
                                <div className="min-w-0">
                                  <div className="text-sm truncate">{m.name}</div>
                                  {m.email && <div className="text-xs text-[var(--color-text-muted)] truncate">{m.email}</div>}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Bulk invite to sub-events */}
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
                          Bulk invite to sub-events
                        </p>
                        {(!subEvents || subEvents.length === 0) ? (
                          <p className="text-sm text-[var(--color-text-muted)] italic">
                            No sub-events available. Create sub-events in the Events tab first.
                          </p>
                        ) : (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              {subEvents.map((se) => {
                                const checked = !!selectedSubEvents[se.id];
                                return (
                                  <button
                                    key={se.id}
                                    onClick={() => toggleSubEvent(se.id)}
                                    className={cn(
                                      "inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border transition-colors",
                                      checked
                                        ? "bg-[var(--color-primary)] text-[var(--color-bg)] border-[var(--color-primary)]"
                                        : "bg-[var(--color-surface)] text-[var(--color-text)] border-[var(--color-border)] hover:border-[var(--color-primary)]"
                                    )}
                                    style={{ borderRadius: "var(--radius)" }}
                                  >
                                    {checked && <Check className="w-3.5 h-3.5" />}
                                    {se.name}
                                  </button>
                                );
                              })}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                onClick={() => submitBulkInvite(g.id)}
                                loading={bulkInviteMutation.isPending}
                              >
                                Apply Invitations
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setSelectedSubEvents({})}
                              >
                                Clear Selection
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Manual Overrides Section */}
      <div className="pt-4">
        <div className="flex items-center gap-2 mb-3">
          <h2 className="font-heading text-xl">Manual Overrides</h2>
          <Badge variant="warning">Per-guest</Badge>
        </div>
        <p className="text-sm text-[var(--color-text-muted)] mb-4">
          Individual guest invitations that override group settings. These take the highest priority.
        </p>

        {manualOverrides.length === 0 ? (
          <Card className="p-6">
            <EmptyState
              icon={<UserCheck className="w-10 h-10" />}
              title="No manual overrides"
              description="When you set per-guest invitations (e.g. from the Guests tab), they will appear here."
            />
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="divide-y divide-[var(--color-border)]">
              {manualOverrides.map((ov, idx) => (
                <div key={`${ov.guest_id}-${ov.sub_event_id || "all"}-${idx}`} className="p-4 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 flex items-center justify-center bg-amber-50 text-amber-700 shrink-0" style={{ borderRadius: "var(--radius)" }}>
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{ov.guestName}</div>
                      <div className="text-xs text-[var(--color-text-muted)] flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" /> {ov.subEventName}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={inviteTypeVariant(ov.invite_type)}>{ov.invite_type}</Badge>
                    <button
                      onClick={() => deleteManualOverrideMutation.mutate({ guestId: ov.guest_id, subEventId: ov.sub_event_id })}
                      className="p-1.5 text-[var(--color-text-muted)] hover:text-red-600 hover:bg-red-50 transition-colors"
                      style={{ borderRadius: "var(--radius)" }}
                      title="Remove override"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Delete group confirmation */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Group">
        <p className="text-sm text-[var(--color-text-muted)] mb-2">
          Are you sure you want to delete this group?
        </p>
        <p className="text-sm text-[var(--color-text-muted)] mb-6">
          <strong>This does NOT delete the guests themselves</strong> — they remain in your guest list. Only the group and its sub-event invitations are removed.
        </p>
        <div className="flex gap-3">
          <Button variant="danger" onClick={() => deleteId && deleteGroupMutation.mutate(deleteId)} loading={deleteGroupMutation.isPending}>
            Delete Group
          </Button>
          <Button variant="ghost" onClick={() => setDeleteId(null)}>Cancel</Button>
        </div>
      </Modal>

      {/* Assign guests to group modal */}
      <Modal open={!!assignModalGroup} onClose={() => setAssignModalGroup(null)} title="Assign Guests to Group">
        <div className="space-y-4">
          <Input
            value={assignGuestSearch}
            onChange={(e) => setAssignGuestSearch(e.target.value)}
            placeholder="Search guests by name or email..."
            autoFocus
          />
          <div className="max-h-80 overflow-y-auto space-y-1 border border-[var(--color-border)] p-2" style={{ borderRadius: "var(--radius)" }}>
            {filteredGuestsForAssign.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)] text-center py-6">
                {guests?.length === 0 ? "No guests in this event yet." : "No guests match your search."}
              </p>
            ) : (
              filteredGuestsForAssign.map((g) => {
                const checked = !!assignSelectedGuests[g.id];
                return (
                  <button
                    key={g.id}
                    onClick={() => toggleAssignGuest(g.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 text-left transition-colors",
                      checked ? "bg-[var(--color-bg-subtle)]" : "hover:bg-[var(--color-bg-subtle)]"
                    )}
                    style={{ borderRadius: "var(--radius)" }}
                  >
                    <div className={cn(
                      "w-4 h-4 border flex items-center justify-center shrink-0",
                      checked ? "bg-[var(--color-primary)] border-[var(--color-primary)]" : "border-[var(--color-border)]"
                    )} style={{ borderRadius: "2px" }}>
                      {checked && <Check className="w-3 h-3 text-[var(--color-bg)]" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm truncate">{g.name}</div>
                      {g.email && <div className="text-xs text-[var(--color-text-muted)] truncate">{g.email}</div>}
                    </div>
                    {g.group_name && (
                      <Badge variant="default">{g.group_name}</Badge>
                    )}
                  </button>
                );
              })
            )}
          </div>
          <div className="flex items-center justify-between gap-3 pt-2">
            <span className="text-xs text-[var(--color-text-muted)]">
              {Object.values(assignSelectedGuests).filter(Boolean).length} selected
            </span>
            <div className="flex gap-3">
              <Button onClick={submitAssign} loading={assignGuestsMutation.isPending}>
                Save Assignment
              </Button>
              <Button variant="ghost" onClick={() => setAssignModalGroup(null)}>Cancel</Button>
            </div>
          </div>
        </div>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

