import { useState, useMemo, useCallback } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Users, Pencil, Trash2, Plus, FolderEdit } from "lucide-react";
import { supabase, Wedding, Guest } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card, Badge, FormField, Modal, EmptyState, Toast, ErrorState, Skeleton } from "../../components/ui/index";

type OutletContext = { wedding: Wedding | null };

interface GroupInfo {
  name: string;
  count: number;
  attending: number;
  pending: number;
  guests: Guest[];
}

export default function GuestGroupsPage() {
  const { wedding } = useOutletContext<OutletContext>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState("");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const { data: guests, isLoading, isError, refetch } = useQuery<Guest[]>({
    queryKey: ["guests", wedding?.id],
    queryFn: async () => {
      if (!wedding) return [];
      const { data, error } = await supabase.from("guests").select("*").eq("wedding_id", wedding.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data as Guest[];
    },
    enabled: !!wedding,
  });

  const groups = useMemo<GroupInfo[]>(() => {
    if (!guests) return [];
    const groupMap = new Map<string, Guest[]>();
    for (const g of guests) {
      const name = g.group_name || "Ungrouped";
      if (!groupMap.has(name)) groupMap.set(name, []);
      groupMap.get(name)!.push(g);
    }
    return Array.from(groupMap.entries()).map(([name, groupGuests]) => ({
      name,
      count: groupGuests.length,
      attending: groupGuests.filter((g) => g.rsvp_status === "attending").length,
      pending: groupGuests.filter((g) => g.rsvp_status === "pending").length,
      guests: groupGuests,
    }));
  }, [guests]);

  const renameGroupMutation = useMutation({
    mutationFn: async (data: { oldName: string; newName: string }) => {
      if (!wedding) throw new Error("No wedding");
      const { error } = await supabase.from("guests").update({ group_name: data.newName }).eq("wedding_id", wedding.id).eq("group_name", data.oldName);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests", wedding?.id] });
      setModalOpen(false);
      setToast({ msg: "Group renamed!", type: "success" });
      setTimeout(() => setToast(null), 3000);
    },
    onError: (err: any) => {
      setToast({ msg: "Failed: " + err.message, type: "error" });
      setTimeout(() => setToast(null), 3000);
    },
  });

  const deleteGroupMutation = useMutation({
    mutationFn: async (groupName: string) => {
      if (!wedding) throw new Error("No wedding");
      const { error } = await supabase.from("guests").update({ group_name: "" }).eq("wedding_id", wedding.id).eq("group_name", groupName);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests", wedding?.id] });
      setToast({ msg: "Group cleared", type: "success" });
      setTimeout(() => setToast(null), 3000);
    },
    onError: (err: any) => {
      setToast({ msg: "Failed: " + err.message, type: "error" });
      setTimeout(() => setToast(null), 3000);
    },
  });

  const openRename = useCallback((groupName: string) => {
    setEditingGroup(groupName);
    setNewGroupName(groupName === "Ungrouped" ? "" : groupName);
    setModalOpen(true);
  }, []);

  const handleRename = useCallback(() => {
    if (!newGroupName.trim() || !editingGroup) return;
    renameGroupMutation.mutate({ oldName: editingGroup, newName: newGroupName.trim() });
  }, [newGroupName, editingGroup, renameGroupMutation]);

  const handleDelete = useCallback((groupName: string) => {
    if (confirm(`Remove all guests from "${groupName}" group? (Guests won't be deleted)`)) {
      deleteGroupMutation.mutate(groupName);
    }
  }, [deleteGroupMutation]);

  if (!wedding) return <ErrorState message="Could not load wedding data" onRetry={() => navigate("/admin")} />;
  if (isError) return <ErrorState message="Failed to load guest groups" onRetry={() => refetch()} />;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Guest Groups</h1>
        <p className="text-sm text-gray-500">Organize guests into groups for easier management</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" />
        </div>
      ) : groups.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => (
            <Card key={group.name} className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600"><Users className="w-4 h-4" /></div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">{group.name}</h3>
                    <p className="text-xs text-gray-400">{group.count} guest{group.count !== 1 ? "s" : ""}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => openRename(group.name)}><Pencil className="w-3.5 h-3.5" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(group.name)}><Trash2 className="w-3.5 h-3.5 text-red-500" /></Button>
                </div>
              </div>
              <div className="flex gap-2">
                <Badge color="green">{group.attending} attending</Badge>
                <Badge color="gray">{group.pending} pending</Badge>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-400 mb-1">Members:</p>
                <p className="text-xs text-gray-600 truncate">{group.guests.slice(0, 5).map((g) => g.name).join(", ")}{group.guests.length > 5 ? ` +${group.guests.length - 5} more` : ""}</p>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-6">
          <EmptyState icon={<FolderEdit className="w-10 h-10" />} title="No groups yet" description="Groups are created automatically when you assign guests a group name" action={<Button size="sm" onClick={() => navigate("/admin/guests")}><Plus className="w-4 h-4" /> Add Guests</Button>} />
        </Card>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Rename Group">
        <div className="space-y-4">
          <FormField label="Group Name"><Input value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder="Enter group name" /></FormField>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleRename} loading={renameGroupMutation.isPending}>Save</Button>
          </div>
        </div>
      </Modal>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
