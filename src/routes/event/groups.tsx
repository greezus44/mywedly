import { useState, useEffect } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type GuestGroup, type SubEvent, type EventGuest } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Card, Badge, EmptyState, Skeleton, ErrorState, Modal, Toast, FormField } from "../../components/ui";
import { Input, Select } from "../../components/ui/Input";
import { Users, Plus, Trash2, Pencil, UserPlus, CalendarCheck, AlertCircle } from "lucide-react";

interface OutletContext { event: UserEvent; }

export default function GroupsPage() {
  const { event } = useOutletContext<OutletContext>();
  const { eventId } = useParams();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editingGroup, setEditingGroup] = useState<GuestGroup | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [groupName, setGroupName] = useState("");
  const [showAssign, setShowAssign] = useState(false);
  const [assignGroupId, setAssignGroupId] = useState<string | null>(null);
  const [showBulk, setShowBulk] = useState(false);
  const [bulkGroupId, setBulkGroupId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // Fetch groups
  const { data: groups, isLoading, error } = useQuery({
    queryKey: ["guest_groups", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guest_groups")
        .select("*")
        .eq("wedding_id", eventId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as GuestGroup[];
    },
  });

  // Fetch sub-events
  const { data: subEvents } = useQuery({
    queryKey: ["sub_events", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sub_events")
        .select("*")
        .eq("parent_event_id", eventId)
        .order("order_index", { ascending: true });
      if (error) throw error;
      return data as SubEvent[];
    },
  });

  // Fetch guests for member counts and assignment
  const { data: guests } = useQuery({
    queryKey: ["guests", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_guests")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as EventGuest[];
    },
  });

  // Fetch group members
  const { data: groupMembers } = useQuery({
    queryKey: ["group_members", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guest_group_members")
        .select("*")
        .in("group_id", groups?.map((g) => g.id) || []);
      if (error) throw error;
      return data as { guest_id: string; group_id: string; created_at: string }[];
    },
    enabled: !!groups?.length,
  });

  // Fetch group event invites
  const { data: groupInvites } = useQuery({
    queryKey: ["group_event_invites", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("group_event_invites")
        .select("*")
        .in("group_id", groups?.map((g) => g.id) || []);
      if (error) throw error;
      return data as { group_id: string; event_id: string; sub_event_id: string | null; created_at: string }[];
    },
    enabled: !!groups?.length,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const sortOrder = groups?.length || 0;
      const { error } = await supabase.from("guest_groups").insert({
        wedding_id: eventId,
        name: groupName,
        sort_order: sortOrder,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest_groups", eventId] });
      setShowCreate(false);
      setGroupName("");
      setToast({ msg: "Group created", type: "success" });
    },
    onError: (err: Error) => {
      setToast({ msg: `Failed to create group: ${err.message}`, type: "error" });
    },
  });

  const renameMutation = useMutation({
    mutationFn: async () => {
      if (!editingGroup) return;
      const { error } = await supabase
        .from("guest_groups")
        .update({ name: groupName, updated_at: new Date().toISOString() })
        .eq("id", editingGroup.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest_groups", eventId] });
      setEditingGroup(null);
      setGroupName("");
      setToast({ msg: "Group renamed", type: "success" });
    },
    onError: (err: Error) => {
      setToast({ msg: `Failed to rename: ${err.message}`, type: "error" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("guest_groups").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest_groups", eventId] });
      queryClient.invalidateQueries({ queryKey: ["group_members", eventId] });
      queryClient.invalidateQueries({ queryKey: ["group_event_invites", eventId] });
      setDeleteId(null);
      setToast({ msg: "Group deleted", type: "success" });
    },
    onError: (err: Error) => {
      setToast({ msg: `Failed to delete: ${err.message}`, type: "error" });
      setDeleteId(null);
    },
  });

  const assignGuestMutation = useMutation({
    mutationFn: async ({ guestId, groupId, action }: { guestId: string; groupId: string; action: "add" | "remove" }) => {
      if (action === "add") {
        const { error } = await supabase.from("guest_group_members").insert({ guest_id: guestId, group_id: groupId });
        if (error) throw error;
      } else {
        const { error } = await supabase.from("guest_group_members").delete().eq("guest_id", guestId).eq("group_id", groupId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group_members", eventId] });
      setToast({ msg: "Group membership updated", type: "success" });
    },
    onError: (err: Error) => {
      setToast({ msg: `Failed to update membership: ${err.message}`, type: "error" });
    },
  });

  const bulkInviteMutation = useMutation({
    mutationFn: async ({ groupId, subEventId, action }: { groupId: string; subEventId: string | null; action: "invite" | "remove" }) => {
      if (action === "invite") {
        const { error } = await supabase.from("group_event_invites").insert({
          group_id: groupId,
          event_id: eventId!,
          sub_event_id: subEventId,
        });
        if (error) throw error;
      } else {
        let query = supabase.from("group_event_invites").delete().eq("group_id", groupId).eq("event_id", eventId);
        if (subEventId) {
          query = query.eq("sub_event_id", subEventId);
        } else {
          query = query.is("sub_event_id", null);
        }
        const { error } = await query;
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group_event_invites", eventId] });
      setShowBulk(false);
      setToast({ msg: "Bulk invitation updated", type: "success" });
    },
    onError: (err: Error) => {
      setToast({ msg: `Failed to update invitation: ${err.message}`, type: "error" });
    },
  });

  const getGroupMemberCount = (groupId: string) => {
    return groupMembers?.filter((m) => m.group_id === groupId).length || 0;
  };

  const getGroupInvites = (groupId: string) => {
    return groupInvites?.filter((i) => i.group_id === groupId) || [];
  };

  const isGuestInGroup = (guestId: string, groupId: string) => {
    return groupMembers?.some((m) => m.guest_id === guestId && m.group_id === groupId) || false;
  };

  if (isLoading) return <div className="p-8"><Skeleton className="h-64" /></div>;
  if (error) return <ErrorState message={error.message} onRetry={() => queryClient.invalidateQueries({ queryKey: ["guest_groups", eventId] })} />;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-heading text-2xl text-gray-900">Guest Groups</h2>
          <p className="text-sm text-gray-500 mt-1">Organize guests into groups and bulk-invite them to sub-events.</p>
        </div>
        <Button size="sm" onClick={() => { setEditingGroup(null); setGroupName(""); setShowCreate(true); }}>
          <Plus className="w-4 h-4" /> New Group
        </Button>
      </div>

      {/* Priority note */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-blue-900 font-medium">How group invitations work</p>
          <p className="text-sm text-blue-700 mt-1">Bulk-inviting a group to a sub-event adds all group members as invitees. Individual guest overrides via <code className="text-xs bg-blue-100 px-1 py-0.5 rounded">guest_event_invites</code> take priority over group-level invitations.</p>
        </div>
      </div>

      {!groups || groups.length === 0 ? (
        <EmptyState
          icon={<Users className="w-12 h-12" />}
          title="No groups yet"
          description="Create groups like 'Family', 'Friends', or 'Coworkers' to organize guests and bulk-invite them."
          action={<Button onClick={() => setShowCreate(true)}><Plus className="w-4 h-4" /> New Group</Button>}
        />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => {
            const memberCount = getGroupMemberCount(group.id);
            const invites = getGroupInvites(group.id);
            return (
              <Card key={group.id} className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-heading text-lg text-gray-900">{group.name}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">{memberCount} {memberCount === 1 ? "guest" : "guests"}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { setEditingGroup(group); setGroupName(group.name); setShowCreate(true); }}
                      className="p-1.5 text-gray-400 hover:text-gray-900 transition-colors rounded"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteId(group.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 transition-colors rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Invited sub-event badges */}
                <div className="mb-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-2">Invited to</p>
                  {invites.length === 0 ? (
                    <p className="text-xs text-gray-400">Not invited to any events</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {invites.map((inv) => {
                        const subName = inv.sub_event_id
                          ? subEvents?.find((s) => s.id === inv.sub_event_id)?.name || "Unknown"
                          : "Main Event";
                        return (
                          <Badge key={`${inv.group_id}-${inv.sub_event_id || "main"}`} variant="info">
                            <CalendarCheck className="w-3 h-3 mr-1" /> {subName}
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button size="sm" variant="secondary" onClick={() => { setAssignGroupId(group.id); setShowAssign(true); }}>
                    <UserPlus className="w-3.5 h-3.5" /> Assign Guests
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setBulkGroupId(group.id); setShowBulk(true); }}>
                    <CalendarCheck className="w-3.5 h-3.5" /> Bulk Invite
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Rename Modal */}
      <Modal open={showCreate} onClose={() => { setShowCreate(false); setEditingGroup(null); setGroupName(""); }} title={editingGroup ? "Rename Group" : "New Group"}>
        <div className="space-y-4">
          <FormField label="Group Name">
            <Input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Family" />
          </FormField>
          <div className="flex gap-3 pt-2">
            <Button
              onClick={() => editingGroup ? renameMutation.mutate() : createMutation.mutate()}
              loading={createMutation.isPending || renameMutation.isPending}
              disabled={!groupName}
            >
              {editingGroup ? "Save" : "Create"}
            </Button>
            <Button variant="ghost" onClick={() => { setShowCreate(false); setEditingGroup(null); setGroupName(""); }}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* Assign Guests Modal */}
      <Modal open={showAssign} onClose={() => { setShowAssign(false); setAssignGroupId(null); }} title="Assign Guests to Group">
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {!guests || guests.length === 0 ? (
            <p className="text-sm text-gray-500">No guests available. Add guests first.</p>
          ) : (
            guests.map((g) => {
              const inGroup = assignGroupId ? isGuestInGroup(g.id, assignGroupId) : false;
              return (
                <div key={g.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{g.name}</p>
                    <p className="text-xs text-gray-500">{g.email || "No email"} {g.group_name && `· ${g.group_name}`}</p>
                  </div>
                  <Button
                    size="sm"
                    variant={inGroup ? "danger" : "secondary"}
                    loading={assignGuestMutation.isPending}
                    onClick={() => assignGroupId && assignGuestMutation.mutate({
                      guestId: g.id,
                      groupId: assignGroupId,
                      action: inGroup ? "remove" : "add",
                    })}
                  >
                    {inGroup ? "Remove" : "Add"}
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </Modal>

      {/* Bulk Invite Modal */}
      <Modal open={showBulk} onClose={() => { setShowBulk(false); setBulkGroupId(null); }} title="Bulk Invite Group to Events">
        <div className="space-y-3">
          <p className="text-sm text-gray-600">Select which events to invite all group members to:</p>
          {!subEvents || subEvents.length === 0 ? (
            <p className="text-sm text-gray-500">No sub-events available. Create sub-events first.</p>
          ) : (
            subEvents.map((sub) => {
              const isInvited = bulkGroupId ? groupInvites?.some((i) => i.group_id === bulkGroupId && i.sub_event_id === sub.id) : false;
              return (
                <div key={sub.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{sub.name}</p>
                    <p className="text-xs text-gray-500">{sub.date || "No date set"}</p>
                  </div>
                  <Button
                    size="sm"
                    variant={isInvited ? "danger" : "primary"}
                    loading={bulkInviteMutation.isPending}
                    onClick={() => bulkGroupId && bulkInviteMutation.mutate({
                      groupId: bulkGroupId,
                      subEventId: sub.id,
                      action: isInvited ? "remove" : "invite",
                    })}
                  >
                    {isInvited ? "Remove" : "Invite"}
                  </Button>
                </div>
              );
            })
          )}
          {/* Main event invite */}
          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900">Main Event (No sub-event)</p>
              <p className="text-xs text-gray-500">Invite to the main event only</p>
            </div>
            <Button
              size="sm"
              variant={bulkGroupId && groupInvites?.some((i) => i.group_id === bulkGroupId && !i.sub_event_id) ? "danger" : "primary"}
              loading={bulkInviteMutation.isPending}
              onClick={() => bulkGroupId && bulkInviteMutation.mutate({
                groupId: bulkGroupId,
                subEventId: null,
                action: bulkGroupId && groupInvites?.some((i) => i.group_id === bulkGroupId && !i.sub_event_id) ? "remove" : "invite",
              })}
            >
              {bulkGroupId && groupInvites?.some((i) => i.group_id === bulkGroupId && !i.sub_event_id) ? "Remove" : "Invite"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Group">
        <p className="text-sm text-gray-600 mb-6">Are you sure you want to delete this group? Guests will remain but lose their group association.</p>
        <div className="flex gap-3">
          <Button variant="danger" onClick={() => deleteMutation.mutate(deleteId!)} loading={deleteMutation.isPending}>
            Delete
          </Button>
          <Button variant="ghost" onClick={() => setDeleteId(null)}>Cancel</Button>
        </div>
      </Modal>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
