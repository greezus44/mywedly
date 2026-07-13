import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus, UsersRound, Edit2, Trash2, X, ChevronRight, UserPlus, UserMinus, Check,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Guest, GuestGroup } from "@/lib/supabase";
import { useHostWedding } from "@/lib/use-host-wedding";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import { Card, Badge, Modal, EmptyState, SectionTitle, Toast } from "@/components/ui";
import { cn } from "@/lib/utils";

export function AdminGroups() {
  const { wedding, loading } = useHostWedding();
  const weddingId = wedding?.id ?? "";

  const [groups, setGroups] = useState<GuestGroup[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [fetching, setFetching] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Modal state
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [renameTarget, setRenameTarget] = useState<GuestGroup | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<GuestGroup | null>(null);
  const [saving, setSaving] = useState(false);

  // Side panel state
  const [activeGroup, setActiveGroup] = useState<GuestGroup | null>(null);
  const [addGuestId, setAddGuestId] = useState("");

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ─── Load ───
  const loadAll = useCallback(async () => {
    if (!weddingId) { setFetching(false); return; }
    setFetching(true);
    const [gr, g] = await Promise.all([
      supabase.from("guest_groups").select("*").eq("wedding_id", weddingId).order("sort_order", { ascending: true }),
      supabase.from("guests").select("*").eq("wedding_id", weddingId).order("created_at", { ascending: false }),
    ]);
    if (gr.data) setGroups(gr.data as GuestGroup[]);
    if (g.data) setGuests(g.data as Guest[]);
    setFetching(false);
  }, [weddingId]);

  useEffect(() => { if (weddingId) loadAll(); }, [weddingId, loadAll]);

  // ─── Derived ───
  const groupMembers = useMemo(() => {
    const map = new Map<string, Guest[]>();
    for (const g of guests) {
      if (g.group_id) {
        const arr = map.get(g.group_id) ?? [];
        arr.push(g);
        map.set(g.group_id, arr);
      }
    }
    return map;
  }, [guests]);

  const ungroupedGuests = useMemo(() => guests.filter((g) => !g.group_id), [guests]);

  // Guests available to add to the active group (not already in it)
  const availableToAdd = useMemo(() => {
    if (!activeGroup) return [];
    const members = groupMembers.get(activeGroup.id) ?? [];
    const memberIds = new Set(members.map((m) => m.id));
    return guests.filter((g) => !memberIds.has(g.id));
  }, [guests, activeGroup, groupMembers]);

  // ─── Create ───
  const createGroup = async () => {
    if (!weddingId) return;
    const name = newName.trim();
    if (!name) { showToast("Enter a group name", "error"); return; }
    setSaving(true);
    const maxSort = groups.reduce((mx, g) => Math.max(mx, g.sort_order), -1);
    const { error } = await supabase.from("guest_groups").insert({
      wedding_id: weddingId,
      name,
      sort_order: maxSort + 1,
    });
    setSaving(false);
    if (error) { showToast(`Create failed: ${error.message}`, "error"); return; }
    showToast("Group created");
    setNewName("");
    setCreateOpen(false);
    await loadAll();
  };

  // ─── Rename ───
  const confirmRename = async () => {
    if (!renameTarget) return;
    const name = renameValue.trim();
    if (!name) { showToast("Enter a group name", "error"); return; }
    setSaving(true);
    const { error } = await supabase.from("guest_groups").update({ name }).eq("id", renameTarget.id);
    setSaving(false);
    if (error) { showToast(`Rename failed: ${error.message}`, "error"); return; }
    showToast("Group renamed");
    setRenameTarget(null);
    setRenameValue("");
    await loadAll();
  };

  // ─── Delete ───
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    // Unassign all members first
    const members = groupMembers.get(deleteTarget.id) ?? [];
    if (members.length > 0) {
      await supabase.from("guests").update({ group_id: null }).in("id", members.map((m) => m.id));
    }
    const { error } = await supabase.from("guest_groups").delete().eq("id", deleteTarget.id);
    setSaving(false);
    if (error) { showToast(`Delete failed: ${error.message}`, "error"); return; }
    showToast("Group deleted");
    if (activeGroup?.id === deleteTarget.id) setActiveGroup(null);
    setDeleteTarget(null);
    await loadAll();
  };

  // ─── Add guest to group ───
  const addGuest = async (guestId: string) => {
    if (!activeGroup || !guestId) return;
    const { error } = await supabase.from("guests").update({ group_id: activeGroup.id }).eq("id", guestId);
    if (error) { showToast(`Add failed: ${error.message}`, "error"); return; }
    showToast("Guest added to group");
    setAddGuestId("");
    await loadAll();
  };

  // ─── Remove guest from group ───
  const removeGuest = async (guestId: string) => {
    const { error } = await supabase.from("guests").update({ group_id: null }).eq("id", guestId);
    if (error) { showToast(`Remove failed: ${error.message}`, "error"); return; }
    showToast("Guest removed from group");
    await loadAll();
  };

  // ─── Bulk assign: add all ungrouped guests to a group ───
  const bulkAssign = async (groupId: string) => {
    if (!groupId || ungroupedGuests.length === 0) return;
    const { error } = await supabase.from("guests").update({ group_id: groupId }).in("id", ungroupedGuests.map((g) => g.id));
    if (error) { showToast(`Bulk assign failed: ${error.message}`, "error"); return; }
    showToast(`${ungroupedGuests.length} guests assigned`);
    await loadAll();
  };

  // ─── Render ───
  if (loading || fetching) {
    return (
      <div className="flex items-center justify-center py-24 text-sepia">
        <div className="animate-pulse">Loading groups…</div>
      </div>
    );
  }

  if (!wedding) {
    return <EmptyState title="No wedding found" description="Create a wedding to manage groups." />;
  }

  return (
    <div>
      <SectionTitle
        title="Groups"
        subtitle={`${groups.length} groups · ${ungroupedGuests.length} ungrouped guests`}
        action={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4" /> New Group
          </Button>
        }
      />

      {/* ─── Bulk assign bar ─── */}
      {ungroupedGuests.length > 0 && groups.length > 0 && (
        <Card className="p-4 mb-6 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <p className="text-sm text-sepia">
              <span className="font-medium text-onyx">{ungroupedGuests.length}</span> ungrouped guests
            </p>
            <p className="text-xs text-sepia/60">Bulk assign all ungrouped guests to a group.</p>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value=""
              onChange={(e) => { if (e.target.value) bulkAssign(e.target.value); }}
              className="sm:w-48"
            >
              <option value="">Choose group…</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </Select>
          </div>
        </Card>
      )}

      {/* ─── Group grid ─── */}
      {groups.length === 0 ? (
        <EmptyState
          title="No groups yet"
          description="Create groups to organize your guests — family, friends, colleagues, etc."
          action={<Button onClick={() => setCreateOpen(true)}><Plus className="w-4 h-4" /> New Group</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => {
            const members = groupMembers.get(group.id) ?? [];
            const isActive = activeGroup?.id === group.id;
            return (
              <Card
                key={group.id}
                className={cn(
                  "p-5 cursor-pointer transition-all hover:shadow-md",
                  isActive && "ring-2 ring-sepia/40"
                )}
              >
                <div
                  onClick={() => setActiveGroup(isActive ? null : group)}
                  className="flex items-start justify-between mb-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-mist flex items-center justify-center flex-shrink-0">
                      <UsersRound className="w-5 h-5 text-sepia" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-serif text-lg text-onyx truncate">{group.name}</h3>
                      <p className="text-xs text-sepia/60">{members.length} {members.length === 1 ? "member" : "members"}</p>
                    </div>
                  </div>
                  <ChevronRight className={cn("w-4 h-4 text-sepia/40 transition-transform", isActive && "rotate-90")} />
                </div>

                {/* Member avatars preview */}
                {members.length > 0 && (
                  <div className="flex -space-x-2 mb-3">
                    {members.slice(0, 5).map((m) => (
                      <div
                        key={m.id}
                        className="w-7 h-7 rounded-full bg-sand border-2 border-card flex items-center justify-center text-xs font-medium text-sepia"
                        title={m.full_name}
                      >
                        {(m.first_name ?? m.full_name)[0]?.toUpperCase()}
                      </div>
                    ))}
                    {members.length > 5 && (
                      <div className="w-7 h-7 rounded-full bg-mist border-2 border-card flex items-center justify-center text-xs text-sepia">
                        +{members.length - 5}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-3 border-t border-sand">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => { e.stopPropagation(); setRenameTarget(group); setRenameValue(group.name); }}
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Rename
                  </Button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteTarget(group); }}
                    className="ml-auto p-1.5 rounded-lg text-sepia/50 hover:bg-red-50 hover:text-red-600 transition-colors"
                    title="Delete group"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ─── Side panel: group members ─── */}
      {activeGroup && (
        <div className="fixed inset-0 z-40 flex justify-end animate-fade-in">
          <div className="absolute inset-0 bg-onyx/30 backdrop-blur-sm" onClick={() => setActiveGroup(null)} />
          <div className="relative z-10 w-full max-w-md bg-card border-l border-sand shadow-xl h-full overflow-y-auto animate-slide-in-right">
            <div className="sticky top-0 bg-card border-b border-sand px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="font-serif text-lg text-onyx">{activeGroup.name}</h2>
                <p className="text-xs text-sepia/60">{groupMembers.get(activeGroup.id)?.length ?? 0} members</p>
              </div>
              <button
                onClick={() => setActiveGroup(null)}
                className="text-sepia/60 hover:text-onyx w-8 h-8 flex items-center justify-center rounded-lg hover:bg-mist transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Add guest */}
              <div>
                <Label>Add Guest to Group</Label>
                <div className="flex gap-2">
                  <Select
                    value={addGuestId}
                    onChange={(e) => setAddGuestId(e.target.value)}
                  >
                    <option value="">Select a guest…</option>
                    {availableToAdd.map((g) => (
                      <option key={g.id} value={g.id}>{g.full_name}</option>
                    ))}
                  </Select>
                  <Button
                    size="sm"
                    onClick={() => addGuestId && addGuest(addGuestId)}
                    disabled={!addGuestId}
                  >
                    <UserPlus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Member list */}
              <div>
                <Label>Members</Label>
                {(groupMembers.get(activeGroup.id) ?? []).length === 0 ? (
                  <p className="text-sm text-sepia/60 py-6 text-center">No members in this group yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {(groupMembers.get(activeGroup.id) ?? []).map((member) => (
                      <li key={member.id} className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-mist/50 transition-colors">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-mist flex items-center justify-center text-xs font-medium text-sepia flex-shrink-0">
                            {(member.first_name ?? member.full_name)[0]?.toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-onyx truncate">{member.full_name}</p>
                            <p className="text-xs text-sepia/60 truncate">{member.email ?? "No email"}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeGuest(member.id)}
                          className="p-1.5 rounded-lg text-sepia/50 hover:bg-red-50 hover:text-red-600 transition-colors flex-shrink-0"
                          title="Remove from group"
                        >
                          <UserMinus className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Create modal ─── */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Group">
        <div className="space-y-4">
          <div>
            <Label>Group Name</Label>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Bride's Family"
              autoFocus
              onKeyDown={(e) => { if (e.key === "Enter") createGroup(); }}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={createGroup} disabled={saving}>
              <Plus className="w-4 h-4" /> Create
            </Button>
          </div>
        </div>
      </Modal>

      {/* ─── Rename modal ─── */}
      <Modal open={!!renameTarget} onClose={() => setRenameTarget(null)} title="Rename Group">
        <div className="space-y-4">
          <div>
            <Label>Group Name</Label>
            <Input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              autoFocus
              onKeyDown={(e) => { if (e.key === "Enter") confirmRename(); }}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setRenameTarget(null)}>Cancel</Button>
            <Button onClick={confirmRename} disabled={saving}>
              <Check className="w-4 h-4" /> Save
            </Button>
          </div>
        </div>
      </Modal>

      {/* ─── Delete modal ─── */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Group">
        <div className="space-y-4">
          <p className="text-sm text-sepia">
            Delete the group{" "}
            <span className="font-medium text-onyx">{deleteTarget?.name}</span>?
            Members will be unassigned but not deleted. This cannot be undone.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" onClick={confirmDelete} disabled={saving}>
              <Trash2 className="w-4 h-4" /> Delete
            </Button>
          </div>
        </div>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default AdminGroups;
