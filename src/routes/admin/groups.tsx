import { useCallback, useEffect, useState } from "react";
import {
  Plus, Pencil, Trash2, Save, X, Users, UsersRound, UserPlus,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Guest, GuestGroup } from "@/lib/supabase";
import { useHostWedding } from "@/lib/use-host-wedding";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import { Card, Badge, Modal, EmptyState, SectionTitle, Toast } from "@/components/ui";

type GroupWithMembers = GuestGroup & { members: Guest[] };

export function AdminGroups() {
  const { wedding, loading } = useHostWedding();

  const [groups, setGroups] = useState<GroupWithMembers[]>([]);
  const [allGuests, setAllGuests] = useState<Guest[]>([]);
  const [fetching, setFetching] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<GroupWithMembers | null>(null);
  const [managingGroup, setManagingGroup] = useState<GroupWithMembers | null>(null);
  const [addGuestId, setAddGuestId] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const weddingId = wedding?.id ?? null;

  const fetchGroups = useCallback(async () => {
    if (!weddingId) return;
    setFetching(true);
    const [gr, g] = await Promise.all([
      supabase.from("guest_groups").select("*").eq("wedding_id", weddingId).order("sort_order", { ascending: true }),
      supabase.from("guests").select("*").eq("wedding_id", weddingId).order("full_name", { ascending: true }),
    ]);
    const groupList = (gr.data ?? []) as GuestGroup[];
    const guestList = (g.data ?? []) as Guest[];
    setAllGuests(guestList);
    setGroups(
      groupList.map((group) => ({
        ...group,
        members: guestList.filter((gu) => gu.group_id === group.id),
      })),
    );
    setFetching(false);
  }, [weddingId]);

  useEffect(() => {
    if (weddingId) fetchGroups();
  }, [weddingId, fetchGroups]);

  // ─── Create group ───
  const createGroup = async () => {
    if (!weddingId || !newName.trim()) return;
    setSaving(true);
    const maxSort = groups.reduce((max, g) => Math.max(max, g.sort_order), -1);
    const { error } = await supabase.from("guest_groups").insert({
      wedding_id: weddingId,
      name: newName.trim(),
      sort_order: maxSort + 1,
    });
    setSaving(false);
    if (error) {
      setToast({ message: "Failed to create group", type: "error" });
    } else {
      setToast({ message: "Group created", type: "success" });
      setNewName("");
      setIsCreating(false);
      await fetchGroups();
    }
  };

  // ─── Rename group ───
  const renameGroup = async () => {
    if (!renamingId || !renameValue.trim()) return;
    const { error } = await supabase.from("guest_groups").update({ name: renameValue.trim() }).eq("id", renamingId);
    if (error) {
      setToast({ message: "Failed to rename group", type: "error" });
    } else {
      setToast({ message: "Group renamed", type: "success" });
      setRenamingId(null);
      setRenameValue("");
      await fetchGroups();
    }
  };

  // ─── Delete group ───
  const deleteGroup = async (group: GroupWithMembers) => {
    // Unassign all members first
    if (group.members.length > 0) {
      await supabase.from("guests").update({ group_id: null }).eq("group_id", group.id);
    }
    const { error } = await supabase.from("guest_groups").delete().eq("id", group.id);
    setDeleteTarget(null);
    if (error) {
      setToast({ message: "Failed to delete group", type: "error" });
    } else {
      setToast({ message: "Group deleted", type: "success" });
      await fetchGroups();
    }
  };

  // ─── Add guest to group ───
  const addGuestToGroup = async (groupId: string, guestId: string) => {
    if (!guestId) return;
    const { error } = await supabase.from("guests").update({ group_id: groupId }).eq("id", guestId);
    if (error) {
      setToast({ message: "Failed to add guest", type: "error" });
    } else {
      setToast({ message: "Guest added to group", type: "success" });
      setAddGuestId("");
      await fetchGroups();
      // Update managingGroup if open
      setManagingGroup((prev) => {
        if (!prev || prev.id !== groupId) return prev;
        const guest = allGuests.find((g) => g.id === guestId);
        return { ...prev, members: [...prev.members, ...(guest ? [guest] : [])] };
      });
    }
  };

  // ─── Remove guest from group ───
  const removeGuestFromGroup = async (groupId: string, guestId: string) => {
    const { error } = await supabase.from("guests").update({ group_id: null }).eq("id", guestId);
    if (error) {
      setToast({ message: "Failed to remove guest", type: "error" });
    } else {
      setToast({ message: "Guest removed", type: "success" });
      await fetchGroups();
      setManagingGroup((prev) => {
        if (!prev || prev.id !== groupId) return prev;
        return { ...prev, members: prev.members.filter((m) => m.id !== guestId) };
      });
    }
  };

  if (loading || fetching) {
    return <div className="flex items-center justify-center py-24 text-sepia">Loading groups…</div>;
  }

  if (!wedding) {
    return <EmptyState title="No wedding found" description="Create a wedding to manage groups." />;
  }

  // Guests not in any group (for the add dropdown)
  const ungroupedGuests = allGuests.filter((g) => !g.group_id);

  return (
    <div>
      <SectionTitle
        title="Guest Groups"
        subtitle="Organize guests into groups for easier event invitations."
        action={
          !isCreating && (
            <Button size="sm" onClick={() => setIsCreating(true)}>
              <Plus className="w-4 h-4" /> New Group
            </Button>
          )
        }
      />

      {/* ─── Create group inline ─── */}
      {isCreating && (
        <Card className="p-4 mb-4">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Label>Group Name</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Bride's Family, Groomsmen, College Friends"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && createGroup()}
              />
            </div>
            <Button size="sm" onClick={createGroup} disabled={saving || !newName.trim()}>
              <Save className="w-4 h-4" /> Create
            </Button>
            <Button variant="outline" size="sm" onClick={() => { setIsCreating(false); setNewName(""); }}>
              <X className="w-4 h-4" /> Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* ─── Groups grid ─── */}
      {groups.length === 0 && !isCreating ? (
        <EmptyState
          title="No groups yet"
          description="Create groups to organize your guests and send targeted event invitations."
          action={
            <Button size="sm" onClick={() => setIsCreating(true)}>
              <Plus className="w-4 h-4" /> New Group
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <Card key={group.id} className="p-5 flex flex-col">
              {renamingId === group.id ? (
                <div className="flex items-end gap-2 mb-3">
                  <div className="flex-1">
                    <Input
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      autoFocus
                      onKeyDown={(e) => e.key === "Enter" && renameGroup()}
                    />
                  </div>
                  <Button size="sm" onClick={renameGroup}>
                    <Save className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { setRenamingId(null); setRenameValue(""); }}>
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                      <UsersRound className="w-5 h-5 text-purple-600" />
                    </div>
                    <h3 className="font-serif text-base text-onyx truncate">{group.name}</h3>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setRenamingId(group.id); setRenameValue(group.name); }}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTarget(group)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 mb-3">
                <Badge variant="info">
                  <Users className="w-3 h-3 mr-1" />
                  {group.members.length} {group.members.length === 1 ? "member" : "members"}
                </Badge>
              </div>

              {/* Member preview */}
              {group.members.length > 0 ? (
                <div className="space-y-1.5 flex-1 mb-3">
                  {group.members.slice(0, 4).map((member) => (
                    <div key={member.id} className="flex items-center gap-2 text-sm text-sepia/70">
                      <div className="w-6 h-6 rounded-full bg-mist flex items-center justify-center shrink-0">
                        <Users className="w-3 h-3 text-sepia/50" />
                      </div>
                      <span className="truncate">{member.full_name}</span>
                    </div>
                  ))}
                  {group.members.length > 4 && (
                    <p className="text-xs text-sepia/50 pl-8">+{group.members.length - 4} more</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-sepia/40 flex-1 mb-3">No members yet.</p>
              )}

              <Button variant="outline" size="sm" onClick={() => setManagingGroup(group)}>
                <UserPlus className="w-3.5 h-3.5" /> Manage Members
              </Button>
            </Card>
          ))}
        </div>
      )}

      {/* ─── Manage members modal ─── */}
      <Modal
        open={!!managingGroup}
        onClose={() => { setManagingGroup(null); setAddGuestId(""); }}
        title={managingGroup ? `Manage: ${managingGroup.name}` : ""}
        className="max-w-xl"
      >
        {managingGroup && (
          <div className="space-y-4">
            {/* Add guest */}
            <div>
              <Label>Add Guest to Group</Label>
              <div className="flex gap-2">
                <Select
                  value={addGuestId}
                  onChange={(e) => setAddGuestId(e.target.value)}
                  className="flex-1"
                >
                  <option value="">Select a guest…</option>
                  {ungroupedGuests.map((g) => (
                    <option key={g.id} value={g.id}>{g.full_name}</option>
                  ))}
                </Select>
                <Button
                  size="sm"
                  onClick={() => addGuestToGroup(managingGroup.id, addGuestId)}
                  disabled={!addGuestId}
                >
                  <UserPlus className="w-4 h-4" /> Add
                </Button>
              </div>
              {ungroupedGuests.length === 0 && (
                <p className="text-xs text-sepia/50 mt-1">All guests are already assigned to a group.</p>
              )}
            </div>

            {/* Member list */}
            <div>
              <Label>Current Members ({managingGroup.members.length})</Label>
              {managingGroup.members.length === 0 ? (
                <p className="text-sm text-sepia/50 py-6 text-center bg-mist/30 rounded-lg">No members in this group.</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {managingGroup.members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between py-2 px-3 rounded-lg bg-mist/30"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-card border border-sand flex items-center justify-center shrink-0">
                          <Users className="w-3.5 h-3.5 text-sepia/60" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-onyx truncate">{member.full_name}</p>
                          {member.email && (
                            <p className="text-xs text-sepia/50 truncate">{member.email}</p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeGuestFromGroup(managingGroup.id, member.id)}
                        className="text-red-600 hover:bg-red-50 shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ─── Delete confirm ─── */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Group">
        <p className="text-sm text-sepia mb-2">
          Are you sure you want to delete{" "}
          <span className="font-medium text-onyx">{deleteTarget?.name}</span>?
        </p>
        {deleteTarget && deleteTarget.members.length > 0 && (
          <p className="text-sm text-sepia/70 mb-6">
            The {deleteTarget.members.length} {deleteTarget.members.length === 1 ? "member" : "members"} in this group will be unassigned but not deleted.
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => deleteTarget && deleteGroup(deleteTarget)}>
            <Trash2 className="w-4 h-4" /> Delete
          </Button>
        </div>
      </Modal>

      {/* ─── Toast ─── */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
