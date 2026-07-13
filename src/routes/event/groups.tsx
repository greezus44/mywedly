import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type GuestGroup } from "../../lib/supabase";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Card, Modal, EmptyState, LoadingSpinner, ErrorState } from "../../components/ui";
import { cn } from "../../lib/utils";

export default function Groups() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<GuestGroup | null>(null);
  const [name, setName] = useState("");
  const [sortOrder, setSortOrder] = useState(0);

  const { data: groups, isLoading, error, refetch } = useQuery({
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
      if (editing) {
        const { error } = await supabase
          .from("guest_groups")
          .update({ name, sort_order: sortOrder })
          .eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("guest_groups")
          .insert({ name, sort_order: sortOrder, event_id: event.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest_groups", event.id] });
      setShowModal(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("guest_groups").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["guest_groups", event.id] }),
  });

  function openNew() {
    setEditing(null);
    setName("");
    setSortOrder(groups?.length ?? 0);
    setShowModal(true);
  }

  function openEdit(group: GuestGroup) {
    setEditing(group);
    setName(group.name);
    setSortOrder(group.sort_order);
    setShowModal(true);
  }

  if (isLoading) return <div className="flex justify-center py-12"><LoadingSpinner className="h-8 w-8" /></div>;
  if (error) return <ErrorState message="Failed to load guest groups." onRetry={() => refetch()} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-dash-text">Guest Groups</h2>
        <Button onClick={openNew}>+ Add Group</Button>
      </div>

      {!groups || groups.length === 0 ? (
        <EmptyState
          title="No guest groups yet"
          description="Create groups to organize your guests (e.g., Family, Friends, Colleagues)."
          action={<Button onClick={openNew}>+ Add Group</Button>}
        />
      ) : (
        <div className="space-y-2">
          {groups.map((group) => (
            <Card key={group.id} className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-dash-text">{group.name}</h3>
                  <p className="text-xs text-dash-muted">Order: {group.sort_order}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(group)}>Edit</Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-600"
                    onClick={() => deleteMutation.mutate(group.id)}
                  >Delete</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? "Edit Group" : "Add Group"}>
        <div className="space-y-4">
          <Input label="Group Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Family" autoFocus />
          <Input
            label="Sort Order"
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value))}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button loading={saveMutation.isPending} disabled={!name.trim()} onClick={() => saveMutation.mutate()}>
              {editing ? "Save" : "Add"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
