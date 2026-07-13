import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Guest, GuestGroup, GuestGroupMember } from "@/lib/supabase";
import { useHostWedding } from "@/lib/use-host-wedding";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Card, Badge, Modal, EmptyState, SectionTitle } from "@/components/ui";
import { cn, formatDateShort } from "@/lib/utils";
import {
  Plus, Users, Trash2, Edit2, X, UserPlus, UserMinus,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type GroupWithCount = GuestGroup & { member_count: number };

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */

export function AdminGroups() {
  const { wedding } = useHostWedding();

  const [groups, setGroups] = useState<GroupWithCount[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [memberships, setMemberships] = useState<GuestGroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");

  const [editGroup, setEditGroup] = useState<GuestGroup | null>(null);
  const [editName, setEditName] = useState("");

  const [deleteGroup, setDeleteGroup] = useState<GuestGroup | null>(null);

  // Members panel
  const [viewGroup, setViewGroup] = useState<GuestGroup | null>(null);

  // Add-guests-to-group modal (opened from the members panel)
  const [addGuestsOpen, setAddGuestsOpen] = useState(false);
  const [addSelected, setAddSelected] = useState<Set<string>>(new Set());

  // Bulk-assign modal (opened from the page header)
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set());
  const [bulkTarget, setBulkTarget] = useState<string>("");

  const weddingId = wedding?.id;

  /* ---------------------------------------------------------------- */
  /* Data fetching                                                    */
  /* ---------------------------------------------------------------- */

  const fetchAll = useCallback(async () => {
    if (!weddingId) return;
    setLoading(true);
    setError(null);

    const [gRes, guRes] = await Promise.all([
      supabase.from("guest_groups").select("*").eq("wedding_id", weddingId).order("sort_order", { ascending: true }),
      supabase.from("guests").select("*").eq("wedding_id", weddingId).order("full_name", { ascending: true }),
    ]);

    if (gRes.error || guRes.error) {
      setError(gRes.error?.message || guRes.error?.message || "Failed to load data");
      setLoading(false);
      return;
    }

    const groupRows = (gRes.data ?? []) as GuestGroup[];
    const guestRows = (guRes.data ?? []) as Guest[];

    const groupIds = groupRows.map((g) => g.id);
    let memberRows: GuestGroupMember[] = [];
    if (groupIds.length > 0) {
      const mRes = await supabase
        .from("guest_group_members")
        .select("guest_id, group_id, created_at")
        .in("group_id", groupIds);
      if (mRes.error) {
        setError(mRes.error.message);
        setLoading(false);
        return;
      }
      memberRows = (mRes.data ?? []) as GuestGroupMember[];
    }

    const counts = new Map<string, number>();
    for (const m of memberRows) counts.set(m.group_id, (counts.get(m.group_id) ?? 0) + 1);

    setGroups(
      groupRows.map((g) => ({
        ...g,
        member_count: counts.get(g.id) ?? 0,
      })),
    );
    setGuests(guestRows);
    setMemberships(memberRows);
    setLoading(false);
  }, [weddingId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  /* ---------------------------------------------------------------- */
  /* Derived data                                                     */
  /* ---------------------------------------------------------------- */

  // Map guest_id -> set of group_ids
  const guestGroupMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const m of memberships) {
      if (!map.has(m.guest_id)) map.set(m.guest_id, new Set());
      map.get(m.guest_id)!.add(m.group_id);
    }
    return map;
  }, [memberships]);

  const assignedGuestIds = useMemo(() => {
    const ids = new Set<string>();
    for (const m of memberships) ids.add(m.guest_id);
    return ids;
  }, [memberships]);

  const unassignedGuests = useMemo(
    () => guests.filter((g) => !assignedGuestIds.has(g.id)),
    [guests, assignedGuestIds],
  );

  const membersOf = useCallback(
    (groupId: string): Guest[] => {
      const ids = new Set(memberships.filter((m) => m.group_id === groupId).map((m) => m.guest_id));
      return guests.filter((g) => ids.has(g.id));
    },
    [memberships, guests],
  );

  /* ---------------------------------------------------------------- */
  /* CRUD: Create                                                     */
  /* ---------------------------------------------------------------- */

  const handleCreate = async () => {
    if (!weddingId || !newName.trim()) return;
    setBusy(true);
    setError(null);
    const { data, error } = await supabase
      .from("guest_groups")
      .insert({ wedding_id: weddingId, name: newName.trim(), sort_order: groups.length })
      .select()
      .single();
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    setGroups((prev) => [...prev, { ...(data as GuestGroup), member_count: 0 }]);
    setCreateOpen(false);
    setNewName("");
  };

  /* ---------------------------------------------------------------- */
  /* CRUD: Rename                                                     */
  /* ---------------------------------------------------------------- */

  const handleRename = async () => {
    if (!editGroup || !editName.trim()) return;
    setBusy(true);
    setError(null);
    const { error } = await supabase
      .from("guest_groups")
      .update({ name: editName.trim(), updated_at: new Date().toISOString() })
      .eq("id", editGroup.id);
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    setGroups((prev) => prev.map((g) => (g.id === editGroup.id ? { ...g, name: editName.trim() } : g)));
    if (viewGroup?.id === editGroup.id) setViewGroup({ ...viewGroup, name: editName.trim() });
    setEditGroup(null);
    setEditName("");
  };

  /* ---------------------------------------------------------------- */
  /* CRUD: Delete (cascades to guest_group_members)                  */
  /* ---------------------------------------------------------------- */

  const handleDelete = async () => {
    if (!deleteGroup) return;
    setBusy(true);
    setError(null);
    const { error } = await supabase.from("guest_groups").delete().eq("id", deleteGroup.id);
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    setGroups((prev) => prev.filter((g) => g.id !== deleteGroup.id));
    setMemberships((prev) => prev.filter((m) => m.group_id !== deleteGroup.id));
    if (viewGroup?.id === deleteGroup.id) setViewGroup(null);
    setDeleteGroup(null);
  };

  /* ---------------------------------------------------------------- */
  /* Membership: add guests to a group                                */
  /* ---------------------------------------------------------------- */

  const handleAddGuests = async () => {
    if (!viewGroup || addSelected.size === 0) return;
    setBusy(true);
    setError(null);
    const rows = [...addSelected].map((guest_id) => ({ guest_id, group_id: viewGroup.id }));
    const { error } = await supabase.from("guest_group_members").insert(rows);
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    setMemberships((prev) => [...prev, ...rows.map((r) => ({ ...r, created_at: new Date().toISOString() }))]);
    setGroups((prev) => prev.map((g) => (g.id === viewGroup.id ? { ...g, member_count: g.member_count + rows.length } : g)));
    setAddSelected(new Set());
    setAddGuestsOpen(false);
  };

  /* ---------------------------------------------------------------- */
  /* Membership: remove a guest from a group                          */
  /* ---------------------------------------------------------------- */

  const handleRemoveMember = async (guestId: string) => {
    if (!viewGroup) return;
    setBusy(true);
    setError(null);
    const { error } = await supabase
      .from("guest_group_members")
      .delete()
      .eq("guest_id", guestId)
      .eq("group_id", viewGroup.id);
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    setMemberships((prev) => prev.filter((m) => !(m.guest_id === guestId && m.group_id === viewGroup.id)));
    setGroups((prev) => prev.map((g) => (g.id === viewGroup.id ? { ...g, member_count: Math.max(0, g.member_count - 1) } : g)));
  };

  /* ---------------------------------------------------------------- */
  /* Bulk assign: move selected guests into a target group            */
  /* ---------------------------------------------------------------- */

  const handleBulkAssign = async () => {
    if (!bulkTarget || bulkSelected.size === 0) return;
    setBusy(true);
    setError(null);

    const targetId = bulkTarget;
    const guestIds = [...bulkSelected];

    // Remove existing memberships for these guests (so they end up in exactly one group)
    const { error: delErr } = await supabase.from("guest_group_members").delete().in("guest_id", guestIds);
    if (delErr) {
      setBusy(false);
      setError(delErr.message);
      return;
    }

    const rows = guestIds.map((guest_id) => ({ guest_id, group_id: targetId }));
    const { error: insErr } = await supabase.from("guest_group_members").insert(rows);
    setBusy(false);
    if (insErr) {
      setError(insErr.message);
      return;
    }

    // Recompute memberships locally (optimistic), then refetch for accurate counts
    setMemberships((prev) => {
      const filtered = prev.filter((m) => !guestIds.includes(m.guest_id));
      return [...filtered, ...rows.map((r) => ({ ...r, created_at: new Date().toISOString() }))];
    });

    fetchAll();

    setBulkSelected(new Set());
    setBulkTarget("");
    setBulkOpen(false);
  };

  /* ---------------------------------------------------------------- */
  /* Helpers                                                          */
  /* ---------------------------------------------------------------- */

  const openEdit = (group: GuestGroup) => {
    setEditGroup(group);
    setEditName(group.name);
  };

  const toggleInSet = (set: Set<string>, id: string): Set<string> => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  };

  const groupForGuest = (guestId: string): GuestGroup | undefined => {
    const groupIds = guestGroupMap.get(guestId);
    if (!groupIds || groupIds.size === 0) return undefined;
    const gid = [...groupIds][0];
    return groups.find((g) => g.id === gid);
  };

  /* ---------------------------------------------------------------- */
  /* Render                                                           */
  /* ---------------------------------------------------------------- */

  if (!weddingId) {
    return (
      <div className="text-sepia text-sm">Loading wedding…</div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Guest Groups"
        subtitle="Organize guests into groups for invitations, seating, and communication."
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="md" onClick={() => setBulkOpen(true)} disabled={guests.length === 0}>
              <UserPlus className="w-4 h-4" />
              Bulk Assign
            </Button>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="w-4 h-4" />
              New Group
            </Button>
          </div>
        }
      />

      {error && (
        <div className="rounded-md border border-rose/40 bg-rose/10 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* ---------------------------------------------------------- */}
      {/* Group cards                                                */}
      {/* ---------------------------------------------------------- */}
      {loading ? (
        <div className="text-sepia text-sm">Loading groups…</div>
      ) : groups.length === 0 ? (
        <Card>
          <EmptyState
            title="No groups yet"
            description="Create your first guest group to start organizing your guest list."
            action={
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="w-4 h-4" />
                Create Group
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <Card
              key={group.id}
              className="group relative cursor-pointer transition-shadow hover:shadow-md"
            >
              {/* Clickable body */}
              <button
                className="text-left w-full"
                onClick={() => setViewGroup(group)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sepia/10 text-sepia">
                      <Users className="w-4 h-4" />
                    </div>
                    <h3 className="font-serif text-lg text-onyx truncate">{group.name}</h3>
                  </div>
                  <Badge>{group.member_count} {group.member_count === 1 ? "guest" : "guests"}</Badge>
                </div>
                <p className="mt-3 text-xs text-sepia/60">
                  Created {formatDateShort(group.created_at)}
                </p>
              </button>

              {/* Action buttons */}
              <div className="mt-4 flex items-center gap-1 border-t border-sand pt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); setViewGroup(group); }}
                >
                  <Users className="w-3.5 h-3.5" />
                  View Members
                </Button>
                <div className="ml-auto flex items-center gap-1">
                  <button
                    className="rounded-md p-1.5 text-sepia/60 transition-colors hover:bg-sepia/10 hover:text-onyx"
                    onClick={(e) => { e.stopPropagation(); openEdit(group); }}
                    title="Rename group"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    className="rounded-md p-1.5 text-sepia/60 transition-colors hover:bg-red-50 hover:text-red-600"
                    onClick={(e) => { e.stopPropagation(); setDeleteGroup(group); }}
                    title="Delete group"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ---------------------------------------------------------- */}
      {/* Create modal                                              */}
      {/* ---------------------------------------------------------- */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Group">
        <div className="space-y-4">
          <div>
            <Label>Group Name</Label>
            <Input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="e.g. Bride's Family, College Friends"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={busy || !newName.trim()}>
              {busy ? "Creating…" : "Create Group"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ---------------------------------------------------------- */}
      {/* Rename modal                                              */}
      {/* ---------------------------------------------------------- */}
      <Modal open={!!editGroup} onClose={() => setEditGroup(null)} title="Rename Group">
        <div className="space-y-4">
          <div>
            <Label>Group Name</Label>
            <Input
              autoFocus
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRename()}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditGroup(null)}>Cancel</Button>
            <Button onClick={handleRename} disabled={busy || !editName.trim()}>
              {busy ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ---------------------------------------------------------- */}
      {/* Delete confirm modal                                      */}
      {/* ---------------------------------------------------------- */}
      <Modal open={!!deleteGroup} onClose={() => setDeleteGroup(null)} title="Delete Group">
        <div className="space-y-4">
          <p className="text-sm text-sepia">
            Are you sure you want to delete{" "}
            <span className="font-medium text-onyx">"{deleteGroup?.name}"</span>?
          </p>
          <div className="rounded-md border border-sand bg-mist px-4 py-3 text-xs text-sepia/80">
            <p className="flex items-center gap-2">
              <Trash2 className="w-3.5 h-3.5 shrink-0" />
              All guest assignments to this group will be removed. The guests themselves are not deleted.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteGroup(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete} disabled={busy}>
              {busy ? "Deleting…" : "Delete Group"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ---------------------------------------------------------- */}
      {/* Members panel (side panel)                                */}
      {/* ---------------------------------------------------------- */}
      {viewGroup && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-onyx/30 backdrop-blur-sm animate-fade-in" onClick={() => setViewGroup(null)} />
          <aside className="relative z-10 flex h-full w-full max-w-md flex-col bg-card border-l border-sand shadow-2xl animate-slide-up">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-sand px-6 py-4">
              <div className="min-w-0">
                <h2 className="font-serif text-lg text-onyx truncate">{viewGroup.name}</h2>
                <p className="text-xs text-sepia/60 mt-0.5">
                  {membersOf(viewGroup.id).length} {membersOf(viewGroup.id).length === 1 ? "member" : "members"}
                </p>
              </div>
              <button
                onClick={() => setViewGroup(null)}
                className="rounded-md p-1.5 text-sepia/60 transition-colors hover:bg-sepia/10 hover:text-onyx"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Member list */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {membersOf(viewGroup.id).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="w-8 h-8 text-sepia/30 mb-2" />
                  <p className="text-sm text-sepia/70">No members yet</p>
                  <p className="text-xs text-sepia/50 mt-1">Add guests to this group to get started.</p>
                </div>
              ) : (
                <ul className="space-y-1.5">
                  {membersOf(viewGroup.id).map((guest) => (
                    <li
                      key={guest.id}
                      className="flex items-center gap-3 rounded-md border border-sand bg-mist/50 px-3 py-2"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sepia/10 text-xs font-medium text-sepia">
                        {guest.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-onyx truncate">{guest.full_name}</p>
                        {guest.email && <p className="text-xs text-sepia/50 truncate">{guest.email}</p>}
                      </div>
                      <button
                        onClick={() => handleRemoveMember(guest.id)}
                        disabled={busy}
                        className="rounded-md p-1.5 text-sepia/50 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                        title="Remove from group"
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-sand px-6 py-4">
              <Button
                className="w-full"
                variant="secondary"
                onClick={() => {
                  setAddSelected(new Set());
                  setAddGuestsOpen(true);
                }}
                disabled={unassignedGuests.length === 0}
              >
                <UserPlus className="w-4 h-4" />
                Add Guests to Group
              </Button>
              {unassignedGuests.length === 0 && (
                <p className="mt-2 text-center text-xs text-sepia/50">All guests are already assigned to a group.</p>
              )}
            </div>
          </aside>
        </div>
      )}

      {/* ---------------------------------------------------------- */}
      {/* Add guests to group modal                                  */}
      {/* ---------------------------------------------------------- */}
      <Modal
        open={addGuestsOpen}
        onClose={() => setAddGuestsOpen(false)}
        title={`Add Guests — ${viewGroup?.name ?? ""}`}
        className="max-w-xl"
      >
        <div className="space-y-4">
          {unassignedGuests.length === 0 ? (
            <p className="text-sm text-sepia/70 text-center py-6">
              There are no unassigned guests available.
            </p>
          ) : (
            <>
              <p className="text-sm text-sepia/70">
                Select guests to add to this group. Only guests not currently in a group are shown.
              </p>
              <ul className="max-h-72 space-y-1.5 overflow-y-auto">
                {unassignedGuests.map((guest) => {
                  const selected = addSelected.has(guest.id);
                  return (
                    <li key={guest.id}>
                      <button
                        onClick={() => setAddSelected((prev) => toggleInSet(prev, guest.id))}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-md border px-3 py-2 text-left transition-colors",
                          selected
                            ? "border-onyx/30 bg-onyx/5"
                            : "border-sand bg-white hover:bg-mist",
                        )}
                      >
                        <div
                          className={cn(
                            "flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors",
                            selected ? "border-onyx bg-onyx text-parchment" : "border-sepia/40",
                          )}
                        >
                          {selected && (
                            <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="currentColor">
                              <path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 011.4-1.4l3.8 3.8 6.8-6.8a1 1 0 011.4 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-onyx truncate">{guest.full_name}</p>
                          {guest.email && <p className="text-xs text-sepia/50 truncate">{guest.email}</p>}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
          <div className="flex items-center justify-between gap-2 pt-2">
            <span className="text-xs text-sepia/60">
              {addSelected.size > 0 && `${addSelected.size} selected`}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setAddGuestsOpen(false)}>Cancel</Button>
              <Button onClick={handleAddGuests} disabled={busy || addSelected.size === 0}>
                {busy ? "Adding…" : `Add ${addSelected.size > 0 ? addSelected.size : ""} Guest${addSelected.size === 1 ? "" : "s"}`}
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* ---------------------------------------------------------- */}
      {/* Bulk assign modal                                          */}
      {/* ---------------------------------------------------------- */}
      <Modal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        title="Bulk Assign Guests"
        className="max-w-xl"
      >
        <div className="space-y-4">
          <p className="text-sm text-sepia/70">
            Select multiple guests and assign them all to a single group. Guests already in a group will be moved.
          </p>

          {/* Guest selection */}
          <div>
            <Label>Select Guests</Label>
            {guests.length === 0 ? (
              <p className="text-sm text-sepia/60 py-2">No guests available. Add guests first.</p>
            ) : (
              <ul className="max-h-56 space-y-1.5 overflow-y-auto">
                {guests.map((guest) => {
                  const selected = bulkSelected.has(guest.id);
                  const currentGroup = groupForGuest(guest.id);
                  return (
                    <li key={guest.id}>
                      <button
                        onClick={() => setBulkSelected((prev) => toggleInSet(prev, guest.id))}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-md border px-3 py-2 text-left transition-colors",
                          selected ? "border-onyx/30 bg-onyx/5" : "border-sand bg-white hover:bg-mist",
                        )}
                      >
                        <div
                          className={cn(
                            "flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors",
                            selected ? "border-onyx bg-onyx text-parchment" : "border-sepia/40",
                          )}
                        >
                          {selected && (
                            <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="currentColor">
                              <path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 011.4-1.4l3.8 3.8 6.8-6.8a1 1 0 011.4 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-onyx truncate">{guest.full_name}</p>
                          {currentGroup && (
                            <p className="text-xs text-sepia/50 truncate">Currently in: {currentGroup.name}</p>
                          )}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Target group */}
          <div>
            <Label>Assign To</Label>
            {groups.length === 0 ? (
              <p className="text-sm text-sepia/60 py-2">No groups available. Create a group first.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {groups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => setBulkTarget(group.id)}
                    className={cn(
                      "flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors",
                      bulkTarget === group.id
                        ? "border-onyx bg-onyx/5 text-onyx"
                        : "border-sand bg-white text-sepia hover:bg-mist",
                    )}
                  >
                    <Users className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{group.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 pt-2">
            <span className="text-xs text-sepia/60">
              {bulkSelected.size > 0 && `${bulkSelected.size} selected`}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setBulkOpen(false)}>Cancel</Button>
              <Button
                onClick={handleBulkAssign}
                disabled={busy || bulkSelected.size === 0 || !bulkTarget}
              >
                {busy ? "Assigning…" : "Assign to Group"}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
