import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type GuestGroup } from "../../lib/supabase";
import { Input, Modal, LoadingSpinner, ErrorState, EmptyState, Card } from "../../components/ui";
import { Button } from "../../components/ui/Button";

export default function Groups() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: groups, isLoading, error: queryError } = useQuery({
    queryKey: ["guest_groups", event.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guest_groups")
        .select("*")
        .eq("event_id", event.id)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as GuestGroup[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingId) {
        const { error } = await supabase.from("guest_groups").update({ name }).eq("id", editingId).select().maybeSingle();
        if (error) throw error;
      } else {
        const maxOrder = groups?.reduce((max, g) => Math.max(max, g.sort_order), -1) ?? -1;
        const { error } = await supabase.from("guest_groups").insert({
          event_id: event.id, name, sort_order: maxOrder + 1,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest_groups", event.id] });
      setModalOpen(false);
      setName("");
      setEditingId(null);
      setError(null);
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Failed to save group.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("guest_groups").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest_groups", event.id] });
    },
  });

  function openAdd() { setName(""); setEditingId(null); setError(null); setModalOpen(true); }
  function openEdit(group: GuestGroup) { setName(group.name); setEditingId(group.id); setError(null); setModalOpen(true); }

  if (isLoading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>;
  if (queryError) return <ErrorState message="Failed to load guest groups." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dash-text">Guest Groups</h2>
          <p className="mt-1 text-sm text-dash-muted">Organize guests into groups for easier management.</p>
        </div>
        <Button onClick={openAdd}>Add Group</Button>
      </div>

      {!groups || groups.length === 0 ? (
        <EmptyState title="No groups yet" description="Create guest groups to organize your invitees." action={<Button onClick={openAdd}>Add Group</Button>} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <Card key={group.id} className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-dash-text">{group.name}</h3>
                <p className="mt-1 text-xs text-dash-muted">Order: {group.sort_order}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => openEdit(group)}>Edit</Button>
                <Button size="sm" variant="danger" loading={deleteMutation.isPending} onClick={() => deleteMutation.mutate(group.id)}>Delete</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setError(null); }} title={editingId ? "Edit Group" : "Add Group"}>
        <div className="space-y-4">
          <Input label="Group Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Family, Friends, Colleagues" autoFocus />
          {error && <div className="rounded-md border border-dash-danger/30 bg-red-50 px-4 py-3 text-sm text-dash-danger">{error}</div>}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => { setModalOpen(false); setError(null); }}>Cancel</Button>
            <Button loading={saveMutation.isPending} disabled={!name.trim()} onClick={() => saveMutation.mutate()}>{editingId ? "Save" : "Add"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
