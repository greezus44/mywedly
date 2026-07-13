import { useState } from "react";
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
import { cn, formatDate, formatTime } from "../../lib/utils";
import { Button } from "../../components/ui/Button";
import {
  Card,
  Badge,
  EmptyState,
  FormField,
  Skeleton,
  ErrorState,
  Toast,
  Modal,
} from "../../components/ui";
import { Input, Select } from "../../components/ui/Input";
import {
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  Users,
  ChevronDown,
  ChevronRight,
  Calendar,
  UserPlus,
  Layers,
  AlertCircle,
  Shield,
  Info,
  Mail,
} from "lucide-react";

interface EventContext { event: UserEvent }

interface GroupWithMeta extends GuestGroup {
  memberCount: number;
  invitedSubEvents: { sub_event_id: string; sub_event_name: string }[];
}

function GroupsPage() {
  const { eventId } = useParams();
  const queryClient = useQueryClient();
  const { event } = useOutletContext<EventContext>();

  const [toast, setToast] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [newGroupName, setNewGroupName] = useState("");
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editGroupName, setEditGroupName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<GuestGroup | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Bulk selection state
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set());
  const [selectedSubEventIds, setSelectedSubEventIds] = useState<Set<string>>(new Set());

  // Assign guest modal
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignGuestId, setAssignGuestId] = useState("");
  const [assignGroupId, setAssignGroupId] = useState("");

  // Manual override state
  const [manualGuestId, setManualGuestId] = useState("");
  const [manualSubEventId, setManualSubEventId] = useState("");

  // ---- Queries ----

  // Fetch sub-events
  const {
    data: subEvents = [],
    isLoading: subEventsLoading,
  } = useQuery({
    queryKey: ["sub-events", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sub_events")
        .select("*")
        .eq("parent_event_id", eventId)
        .order("order_index", { ascending: true });
      if (error) throw error;
      return (data || []) as SubEvent[];
    },
    enabled: !!eventId,
  });

  // Fetch guest groups
  const {
    data: groups = [],
    isLoading: groupsLoading,
    isError: groupsError,
    refetch: refetchGroups,
  } = useQuery({
    queryKey: ["guest-groups", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guest_groups")
        .select("*")
        .eq("wedding_id", eventId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data || []) as GuestGroup[];
    },
    enabled: !!eventId,
  });

  // Fetch group members (all for this event's groups)
  const { data: groupMembers = [] } = useQuery({
    queryKey: ["group-members", eventId],
    queryFn: async () => {
      if (groups.length === 0) return [];
      const groupIds = groups.map((g) => g.id);
      const { data, error } = await supabase
        .from("guest_group_members")
        .select("*")
        .in("group_id", groupIds);
      if (error) throw error;
      return (data || []) as GuestGroupMember[];
    },
    enabled: !!eventId && groups.length > 0,
  });

  // Fetch group event invites
  const { data: groupInvites = [] } = useQuery({
    queryKey: ["group-event-invites", eventId],
    queryFn: async () => {
      if (groups.length === 0) return [];
      const groupIds = groups.map((g) => g.id);
      const { data, error } = await supabase
        .from("group_event_invites")
        .select("*")
        .in("group_id", groupIds);
      if (error) throw error;
      return (data || []) as GroupEventInvite[];
    },
    enabled: !!eventId && groups.length > 0,
  });

  // Fetch event guests
  const {
    data: guests = [],
    isLoading: guestsLoading,
  } = useQuery({
    queryKey: ["event-guests", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_guests")
        .select("*")
        .eq("event_id", eventId)
        .order("name", { ascending: true });
      if (error) throw error;
      return (data || []) as EventGuest[];
    },
    enabled: !!eventId,
  });

  // Fetch manual invites (guest_event_invites)
  const { data: manualInvites = [] } = useQuery({
    queryKey: ["guest-event-invites", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guest_event_invites")
        .select("*")
        .eq("event_id", eventId);
      if (error) throw error;
      return (data || []) as GuestEventInvite[];
    },
    enabled: !!eventId,
  });

  // ---- Derived data ----

  const groupsWithMeta: GroupWithMeta[] = groups.map((g) => {
    const members = groupMembers.filter((m) => m.group_id === g.id);
    const invites = groupInvites.filter((i) => i.group_id === g.id);
    const invitedSubEvents = invites.map((inv) => {
      const se = subEvents.find((s) => s.id === inv.sub_event_id);
      return { sub_event_id: inv.sub_event_id || "", sub_event_name: se?.name || "Main Event" };
    });
    return { ...g, memberCount: members.length, invitedSubEvents };
  });

  // ---- Mutations ----

  // Create group
  const createGroupMutation = useMutation({
    mutationFn: async (name: string) => {
      const maxSort = groups.length > 0 ? Math.max(...groups.map((g) => g.sort_order)) : -1;
      const payload = {
        wedding_id: eventId,
        name,
        sort_order: maxSort + 1,
      };
      const { error } = await supabase.from("guest_groups").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest-groups", eventId] });
      setNewGroupName("");
      setToast("Group created");
      setToastType("success");
    },
    onError: (err: Error) => {
      setToast(err.message || "Failed to create group");
      setToastType("error");
    },
  });

  // Rename group
  const renameGroupMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase
        .from("guest_groups")
        .update({ name, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest-groups", eventId] });
      setEditingGroupId(null);
      setEditGroupName("");
      setToast("Group renamed");
      setToastType("success");
    },
    onError: (err: Error) => {
      setToast(err.message || "Failed to rename group");
      setToastType("error");
    },
  });

  // Delete group
  const deleteGroupMutation = useMutation({
    mutationFn: async (group: GuestGroup) => {
      // Delete group_event_invites for this group
      const { error: invError } = await supabase
        .from("group_event_invites")
        .delete()
        .eq("group_id", group.id);
      if (invError) throw invError;
      // Delete guest_group_members for this group
      const { error: memError } = await supabase
        .from("guest_group_members")
        .delete()
        .eq("group_id", group.id);
      if (memError) throw memError;
      // Delete the group itself
      const { error } = await supabase.from("guest_groups").delete().eq("id", group.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest-groups", eventId] });
      queryClient.invalidateQueries({ queryKey: ["group-members", eventId] });
      queryClient.invalidateQueries({ queryKey: ["group-event-invites", eventId] });
      setDeleteTarget(null);
      setToast("Group deleted");
      setToastType("success");
    },
    onError: (err: Error) => {
      setToast(err.message || "Failed to delete group");
      setToastType("error");
    },
  });

  // Bulk invite groups to events
  const bulkInviteMutation = useMutation({
    mutationFn: async ({ groupIds, subEventIds }: { groupIds: string[]; subEventIds: string[] }) => {
      // Build all combinations, avoiding duplicates
      const existing = new Set(groupInvites.map((i) => `${i.group_id}:${i.sub_event_id || "null"}`));
      const rows = [];
      for (const gid of groupIds) {
        for (const seid of subEventIds) {
          const key = `${gid}:${seid}`;
          if (!existing.has(key)) {
            rows.push({
              group_id: gid,
              event_id: eventId,
              sub_event_id: seid,
            });
          }
        }
      }
      if (rows.length === 0) return;
      const { error } = await supabase.from("group_event_invites").insert(rows);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group-event-invites", eventId] });
      setSelectedGroupIds(new Set());
      setSelectedSubEventIds(new Set());
      setToast("Groups invited to selected events");
      setToastType("success");
    },
    onError: (err: Error) => {
      setToast(err.message || "Failed to invite groups");
      setToastType("error");
    },
  });

  // Bulk remove groups from events
  const bulkRemoveMutation = useMutation({
    mutationFn: async ({ groupIds, subEventIds }: { groupIds: string[]; subEventIds: string[] }) => {
      for (const gid of groupIds) {
        const { error } = await supabase
          .from("group_event_invites")
          .delete()
          .eq("group_id", gid)
          .in("sub_event_id", subEventIds);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group-event-invites", eventId] });
      setSelectedGroupIds(new Set());
      setSelectedSubEventIds(new Set());
      setToast("Groups removed from selected events");
      setToastType("success");
    },
    onError: (err: Error) => {
      setToast(err.message || "Failed to remove groups");
      setToastType("error");
    },
  });

  // Assign guest to group
  const assignGuestMutation = useMutation({
    mutationFn: async ({ guestId, groupId }: { guestId: string; groupId: string }) => {
      // Check if already exists
      const { data: existing, error: checkError } = await supabase
        .from("guest_group_members")
        .select("*")
        .eq("guest_id", guestId)
        .eq("group_id", groupId);
      if (checkError) throw checkError;
      if (existing && existing.length > 0) return; // Already assigned
      const { error } = await supabase.from("guest_group_members").insert({
        guest_id: guestId,
        group_id: groupId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group-members", eventId] });
      setAssignModalOpen(false);
      setAssignGuestId("");
      setAssignGroupId("");
      setToast("Guest assigned to group");
      setToastType("success");
    },
    onError: (err: Error) => {
      setToast(err.message || "Failed to assign guest");
      setToastType("error");
    },
  });

  // Remove guest from group
  const removeGuestFromGroupMutation = useMutation({
    mutationFn: async ({ guestId, groupId }: { guestId: string; groupId: string }) => {
      const { error } = await supabase
        .from("guest_group_members")
        .delete()
        .eq("guest_id", guestId)
        .eq("group_id", groupId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group-members", eventId] });
      setToast("Guest removed from group");
      setToastType("success");
    },
    onError: (err: Error) => {
      setToast(err.message || "Failed to remove guest");
      setToastType("error");
    },
  });

  // Add manual invite
  const addManualInviteMutation = useMutation({
    mutationFn: async ({ guestId, subEventId }: { guestId: string; subEventId: string }) => {
      // Check if already exists
      const { data: existing, error: checkError } = await supabase
        .from("guest_event_invites")
        .select("*")
        .eq("guest_id", guestId)
        .eq("event_id", eventId)
        .eq("sub_event_id", subEventId);
      if (checkError) throw checkError;
      if (existing && existing.length > 0) return;
      const { error } = await supabase.from("guest_event_invites").insert({
        guest_id: guestId,
        event_id: eventId,
        sub_event_id: subEventId,
        invite_type: "manual",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest-event-invites", eventId] });
      setManualGuestId("");
      setManualSubEventId("");
      setToast("Manual invite added");
      setToastType("success");
    },
    onError: (err: Error) => {
      setToast(err.message || "Failed to add manual invite");
      setToastType("error");
    },
  });

  // Remove manual invite
  const removeManualInviteMutation = useMutation({
    mutationFn: async ({ guestId, subEventId }: { guestId: string; subEventId: string }) => {
      const { error } = await supabase
        .from("guest_event_invites")
        .delete()
        .eq("guest_id", guestId)
        .eq("event_id", eventId)
        .eq("sub_event_id", subEventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest-event-invites", eventId] });
      setToast("Manual invite removed");
      setToastType("success");
    },
    onError: (err: Error) => {
      setToast(err.message || "Failed to remove manual invite");
      setToastType("error");
    },
  });

  // ---- Handlers ----

  const toggleGroupExpanded = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  const toggleGroupSelected = (groupId: string) => {
    setSelectedGroupIds((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  const toggleSubEventSelected = (subEventId: string) => {
    setSelectedSubEventIds((prev) => {
      const next = new Set(prev);
      if (next.has(subEventId)) next.delete(subEventId);
      else next.add(subEventId);
      return next;
    });
  };

  const startRename = (group: GuestGroup) => {
    setEditingGroupId(group.id);
    setEditGroupName(group.name);
  };

  const confirmRename = (groupId: string) => {
    if (!editGroupName.trim()) {
      setToast("Group name cannot be empty");
      setToastType("error");
      return;
    }
    renameGroupMutation.mutate({ id: groupId, name: editGroupName.trim() });
  };

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) {
      setToast("Group name cannot be empty");
      setToastType("error");
      return;
    }
    createGroupMutation.mutate(newGroupName.trim());
  };

  const handleBulkInvite = () => {
    if (selectedGroupIds.size === 0 || selectedSubEventIds.size === 0) {
      setToast("Select groups and events first");
      setToastType("error");
      return;
    }
    bulkInviteMutation.mutate({
      groupIds: Array.from(selectedGroupIds),
      subEventIds: Array.from(selectedSubEventIds),
    });
  };

  const handleBulkRemove = () => {
    if (selectedGroupIds.size === 0 || selectedSubEventIds.size === 0) {
      setToast("Select groups and events first");
      setToastType("error");
      return;
    }
    bulkRemoveMutation.mutate({
      groupIds: Array.from(selectedGroupIds),
      subEventIds: Array.from(selectedSubEventIds),
    });
  };

  const handleAssignGuest = () => {
    if (!assignGuestId || !assignGroupId) {
      setToast("Select a guest and a group");
      setToastType("error");
      return;
    }
    assignGuestMutation.mutate({ guestId: assignGuestId, groupId: assignGroupId });
  };

  const handleAddManualInvite = () => {
    if (!manualGuestId || !manualSubEventId) {
      setToast("Select a guest and an event");
      setToastType("error");
      return;
    }
    addManualInviteMutation.mutate({ guestId: manualGuestId, subEventId: manualSubEventId });
  };

  const getGuestName = (guestId: string) => guests.find((g) => g.id === guestId)?.name || "Unknown";
  const getSubEventName = (subEventId: string | null) => {
    if (!subEventId) return "Main Event";
    return subEvents.find((s) => s.id === subEventId)?.name || "Unknown Event";
  };

  const guestsInGroup = (groupId: string) => {
    const memberGuestIds = groupMembers
      .filter((m) => m.group_id === groupId)
      .map((m) => m.guest_id);
    return guests.filter((g) => memberGuestIds.includes(g.id));
  };

  const allSubEventOptions = [
    { id: "__main__", name: "Main Event", date: event.event_date, time: event.event_time },
    ...subEvents.map((s) => ({ id: s.id, name: s.name, date: s.date, time: s.time })),
  ];

  const isLoading = groupsLoading || subEventsLoading || guestsLoading;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading text-[var(--color-text)]">Guest Groups</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Create groups, assign guests, and invite groups to events in bulk.
          </p>
        </div>
        <Button onClick={() => setAssignModalOpen(true)}>
          <UserPlus className="w-4 h-4" /> Assign Guest
        </Button>
      </div>

      {/* Priority Info Banner */}
      <Card className="p-4 mb-6 bg-[var(--color-bg-subtle)]">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-[var(--color-text-muted)] mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-[var(--color-text)]">Invitation Priority</p>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <Badge variant="info">1. Manual Override</Badge>
              <span className="text-[var(--color-text-muted)]">→</span>
              <Badge variant="success">2. Group Invitation</Badge>
              <span className="text-[var(--color-text-muted)]">→</span>
              <Badge variant="default">3. Not Invited</Badge>
            </div>
            <p className="text-xs text-[var(--color-text-muted)] mt-2">
              Manual overrides take precedence over group invitations. If a guest is not invited via either method, they cannot RSVP to that event.
            </p>
          </div>
        </div>
      </Card>

      {/* Create new group */}
      <Card className="p-4 mb-6">
        <FormField label="Create New Group">
          <div className="flex gap-2">
            <Input
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="e.g. Bride's Family, Groom's Friends, Coworkers"
              onKeyDown={(e) => e.key === "Enter" && handleCreateGroup()}
            />
            <Button onClick={handleCreateGroup} loading={createGroupMutation.isPending} disabled={!newGroupName.trim()}>
              <Plus className="w-4 h-4" /> Add
            </Button>
          </div>
        </FormField>
      </Card>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-6 w-48 mb-4" />
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-4 w-64" />
            </Card>
          ))}
        </div>
      )}

      {/* Error */}
      {groupsError && (
        <ErrorState message="Failed to load groups" onRetry={() => refetchGroups()} />
      )}

      {/* Empty */}
      {!isLoading && !groupsError && groups.length === 0 && (
        <EmptyState
          icon={<Layers className="w-16 h-16" />}
          title="No guest groups yet"
          description="Create groups to organize your guests and invite them to events in bulk."
        />
      )}

      {/* Groups list */}
      {!isLoading && !groupsError && groups.length > 0 && (
        <>
          {/* Bulk Actions Bar */}
          <Card className="p-4 mb-6">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
                  Bulk Invite — Select Groups ({selectedGroupIds.size} selected)
                </p>
                <div className="flex flex-wrap gap-2">
                  {groupsWithMeta.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => toggleGroupSelected(g.id)}
                      className={cn(
                        "px-3 py-1.5 text-sm border transition-colors",
                        selectedGroupIds.has(g.id)
                          ? "bg-[var(--color-primary)] text-[var(--color-bg)] border-[var(--color-primary)]"
                          : "bg-[var(--color-surface)] text-[var(--color-text)] border-[var(--color-border)] hover:border-[var(--color-primary)]"
                      )}
                      style={{ borderRadius: "var(--radius)" }}
                    >
                      {g.name} ({g.memberCount})
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
                  Select Events ({selectedSubEventIds.size} selected)
                </p>
                <div className="flex flex-wrap gap-2">
                  {allSubEventOptions.map((se) => (
                    <button
                      key={se.id}
                      onClick={() => toggleSubEventSelected(se.id)}
                      className={cn(
                        "px-3 py-1.5 text-sm border transition-colors flex items-center gap-1.5",
                        selectedSubEventIds.has(se.id)
                          ? "bg-[var(--color-primary)] text-[var(--color-bg)] border-[var(--color-primary)]"
                          : "bg-[var(--color-surface)] text-[var(--color-text)] border-[var(--color-border)] hover:border-[var(--color-primary)]"
                      )}
                      style={{ borderRadius: "var(--radius)" }}
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      {se.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleBulkInvite}
                  loading={bulkInviteMutation.isPending}
                  disabled={selectedGroupIds.size === 0 || selectedSubEventIds.size === 0}
                  size="sm"
                >
                  <Mail className="w-3.5 h-3.5" /> Invite to Events
                </Button>
                <Button
                  onClick={handleBulkRemove}
                  loading={bulkRemoveMutation.isPending}
                  disabled={selectedGroupIds.size === 0 || selectedSubEventIds.size === 0}
                  size="sm"
                  variant="secondary"
                >
                  <X className="w-3.5 h-3.5" /> Remove from Events
                </Button>
              </div>
            </div>
          </Card>

          {/* Group Cards */}
          <div className="space-y-4">
            {groupsWithMeta.map((group) => {
              const isExpanded = expandedGroups.has(group.id);
              const isSelected = selectedGroupIds.has(group.id);
              const groupGuests = guestsInGroup(group.id);

              return (
                <Card key={group.id} className="overflow-hidden">
                  {/* Card header */}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <button
                          onClick={() => toggleGroupSelected(group.id)}
                          className={cn(
                            "w-5 h-5 border-2 flex items-center justify-center shrink-0 transition-colors",
                            isSelected
                              ? "bg-[var(--color-primary)] border-[var(--color-primary)]"
                              : "border-[var(--color-border)] hover:border-[var(--color-primary)]"
                          )}
                          style={{ borderRadius: "var(--radius)" }}
                        >
                          {isSelected && <Check className="w-3 h-3 text-[var(--color-bg)]" />}
                        </button>
                        {editingGroupId === group.id ? (
                          <div className="flex items-center gap-2 flex-1">
                            <Input
                              value={editGroupName}
                              onChange={(e) => setEditGroupName(e.target.value)}
                              onKeyDown={(e) => e.key === "Enter" && confirmRename(group.id)}
                              className="flex-1"
                              autoFocus
                            />
                            <button
                              onClick={() => confirmRename(group.id)}
                              disabled={renameGroupMutation.isPending}
                              className="p-1.5 hover:bg-green-50 transition-colors"
                              style={{ borderRadius: "var(--radius)" }}
                            >
                              <Check className="w-4 h-4 text-green-600" />
                            </button>
                            <button
                              onClick={() => { setEditingGroupId(null); setEditGroupName(""); }}
                              className="p-1.5 hover:bg-[var(--color-bg-subtle)] transition-colors"
                              style={{ borderRadius: "var(--radius)" }}
                            >
                              <X className="w-4 h-4 text-[var(--color-text-muted)]" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => toggleGroupExpanded(group.id)}
                            className="flex items-center gap-2 text-left min-w-0"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-[var(--color-text-muted)] shrink-0" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-[var(--color-text-muted)] shrink-0" />
                            )}
                            <h3 className="text-lg font-heading text-[var(--color-text)] truncate">{group.name}</h3>
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Badge variant="default">
                          <Users className="w-3 h-3 mr-1" />
                          {group.memberCount} {group.memberCount === 1 ? "guest" : "guests"}
                        </Badge>
                        {editingGroupId !== group.id && (
                          <>
                            <button
                              onClick={() => startRename(group)}
                              className="p-1.5 hover:bg-[var(--color-bg-subtle)] transition-colors"
                              style={{ borderRadius: "var(--radius)" }}
                              title="Rename"
                            >
                              <Pencil className="w-4 h-4 text-[var(--color-text-muted)]" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(group)}
                              className="p-1.5 hover:bg-red-50 transition-colors"
                              style={{ borderRadius: "var(--radius)" }}
                              title="Delete group"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Invited sub-events */}
                    {group.invitedSubEvents.length > 0 && (
                      <div className="mt-4 flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">Invited to:</span>
                        {group.invitedSubEvents.map((inv) => (
                          <Badge key={inv.sub_event_id || "main"} variant="info">
                            <Calendar className="w-3 h-3 mr-1" />
                            {inv.sub_event_name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Expanded guest list */}
                  {isExpanded && (
                    <div className="border-t border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-5">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-[var(--color-text)]">Guests in this group</h4>
                        <Button size="sm" variant="ghost" onClick={() => setAssignModalOpen(true)}>
                          <UserPlus className="w-3.5 h-3.5" /> Add Guest
                        </Button>
                      </div>
                      {groupGuests.length === 0 ? (
                        <p className="text-sm text-[var(--color-text-muted)] py-4 text-center">No guests assigned to this group yet.</p>
                      ) : (
                        <div className="space-y-1">
                          {groupGuests.map((guest) => (
                            <div
                              key={guest.id}
                              className="flex items-center justify-between p-2 bg-[var(--color-surface)] border border-[var(--color-border)]"
                              style={{ borderRadius: "var(--radius)" }}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 bg-[var(--color-bg-subtle)] flex items-center justify-center shrink-0" style={{ borderRadius: "var(--radius)" }}>
                                  <Users className="w-4 h-4 text-[var(--color-text-muted)]" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-[var(--color-text)] truncate">{guest.name}</p>
                                  {guest.email && <p className="text-xs text-[var(--color-text-muted)] truncate">{guest.email}</p>}
                                </div>
                              </div>
                              <button
                                onClick={() => removeGuestFromGroupMutation.mutate({ guestId: guest.id, groupId: group.id })}
                                disabled={removeGuestFromGroupMutation.isPending}
                                className="p-1.5 hover:bg-red-50 transition-colors shrink-0"
                                style={{ borderRadius: "var(--radius)" }}
                                title="Remove from group"
                              >
                                <X className="w-4 h-4 text-red-500" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </>
      )}

      {/* Manual Overrides Section */}
      {!isLoading && !groupsError && guests.length > 0 && (
        <div className="mt-8">
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-[var(--color-text)]" />
              <h2 className="text-lg font-heading text-[var(--color-text)]">Manual Overrides</h2>
            </div>
            <p className="text-sm text-[var(--color-text-muted)] mb-4">
              These invitations take precedence over group invitations. Use them to individually include or exclude guests from specific events.
            </p>

            {/* Add manual invite */}
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 mb-4">
              <Select
                value={manualGuestId}
                onChange={(e) => setManualGuestId(e.target.value)}
              >
                <option value="">Select guest...</option>
                {guests.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </Select>
              <Select
                value={manualSubEventId}
                onChange={(e) => setManualSubEventId(e.target.value)}
              >
                <option value="">Select event...</option>
                {allSubEventOptions.map((se) => (
                  <option key={se.id} value={se.id}>{se.name}</option>
                ))}
              </Select>
              <Button
                onClick={handleAddManualInvite}
                loading={addManualInviteMutation.isPending}
                disabled={!manualGuestId || !manualSubEventId}
              >
                <Plus className="w-4 h-4" /> Add
              </Button>
            </div>

            {/* Manual invites list */}
            {manualInvites.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)] py-4 text-center">No manual overrides yet.</p>
            ) : (
              <div className="space-y-1">
                {manualInvites.map((inv) => (
                  <div
                    key={`${inv.guest_id}-${inv.sub_event_id || "null"}`}
                    className="flex items-center justify-between p-3 bg-[var(--color-bg-subtle)] border border-[var(--color-border)]"
                    style={{ borderRadius: "var(--radius)" }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Shield className="w-4 h-4 text-[var(--color-primary)] shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[var(--color-text)] truncate">
                          {getGuestName(inv.guest_id)}
                        </p>
                        <p className="text-xs text-[var(--color-text-muted)]">
                          {getSubEventName(inv.sub_event_id)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeManualInviteMutation.mutate({ guestId: inv.guest_id, subEventId: inv.sub_event_id || "" })}
                      disabled={removeManualInviteMutation.isPending}
                      className="p-1.5 hover:bg-red-50 transition-colors shrink-0"
                      style={{ borderRadius: "var(--radius)" }}
                      title="Remove override"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Assign Guest Modal */}
      <Modal open={assignModalOpen} onClose={() => setAssignModalOpen(false)} title="Assign Guest to Group">
        <div className="space-y-4">
          <FormField label="Guest">
            <Select
              value={assignGuestId}
              onChange={(e) => setAssignGuestId(e.target.value)}
            >
              <option value="">Select guest...</option>
              {guests.map((g) => (
                <option key={g.id} value={g.id}>{g.name}{g.email ? ` (${g.email})` : ""}</option>
              ))}
            </Select>
          </FormField>

          <FormField label="Group">
            <Select
              value={assignGroupId}
              onChange={(e) => setAssignGroupId(e.target.value)}
            >
              <option value="">Select group...</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </Select>
          </FormField>

          {guests.length === 0 && (
            <p className="text-sm text-[var(--color-text-muted)] flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              No guests found. Add guests from the Guests tab first.
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setAssignModalOpen(false)}>Cancel</Button>
            <Button
              onClick={handleAssignGuest}
              loading={assignGuestMutation.isPending}
              disabled={!assignGuestId || !assignGroupId}
            >
              Assign
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Group Confirmation */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Group">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
            <div className="text-sm text-[var(--color-text)]">
              <p>
                Are you sure you want to delete the group <span className="font-medium">"{deleteTarget?.name}"</span>?
              </p>
              <p className="mt-2 text-[var(--color-text-muted)]">
                This will NOT delete the guests themselves — only the group and its member associations. All group event invitations for this group will also be removed.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button
              variant="danger"
              loading={deleteGroupMutation.isPending}
              onClick={() => deleteTarget && deleteGroupMutation.mutate(deleteTarget)}
            >
              Delete Group
            </Button>
          </div>
        </div>
      </Modal>

      {/* Toast */}
      {toast && <Toast message={toast} type={toastType} onClose={() => setToast(null)} />}
    </div>
  );
}

export default GroupsPage;
