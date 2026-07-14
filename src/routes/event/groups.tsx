import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type GuestGroup } from "../../lib/supabase";
import { useOutletContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import {
  Card,
  Modal,
  Input,
  LoadingSpinner,
  ErrorState,
  EmptyState,
} from "../../components/ui";

export default function Groups() {
  const { eventId } = useOutletContext();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [sortOrder, setSortOrder] = useState(0);

  const { data: groups, isLoading, isError } = useQuery({
    queryKey: ["guest_groups", eventId],
    enabled: !!eventId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guest_groups")
        .select("*")
        .eq("event_id", eventId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as GuestGroup[];
    },
  });

  const { data: groupCounts } = useQuery({
    queryKey: ["guest_group_counts", eventId],
    enabled: !!eventId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_guests")
        .select("group_id")
        .eq("event_id", eventId);
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data ?? []).forEach((g) => {
        if (g.group_id) counts[g.group_id] = (counts[g.group_id] ?? 0) + 1;
      });
      return counts;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const maxOrder = groups?.reduce((max, g) => Math.max(max, g.sort_order), 0) ?? 0;
      const { data, error } = await supabase
        .from("guest_groups")
        .insert({
          event_id: eventId,
          wedding_id: eventId,
          name: name,
          sort_order: editingId ? sortOrder : maxOrder + 1,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest_groups", eventId] });
      setShowModal(false);
      setName("");
      setSortOrder(0);
      setEditingId(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingId) throw new Error("No group selected");
      const { data, error } = await supabase
        .from("guest_groups")
        .update({
          name: name,
          sort_order: sortOrder,
        })
        .eq("id", editingId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest_groups", eventId] });
      setShowModal(false);
      setName("");
      setSortOrder(0);
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("guest_groups")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest_groups", eventId] });
      queryClient.invalidateQueries({ queryKey: ["guest_group_counts", eventId] });
    },
  });

  const handleAdd = () => {
    setEditingId(null);
    setName("");
    setSortOrder(0);
    setShowModal(true);
  };

  const handleEdit = (group: GuestGroup) => {
    setEditingId(group.id);
    setName(group.name);
    setSortOrder(group.sort_order);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    if (editingId) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState description="Failed to load guest groups" />;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-dash-text">Guest Groups</h2>
          <p className="mt-1 text-sm text-dash-muted">
            Organize guests into groups for targeted invitations
          </p>
        </div>
        <Button onClick={handleAdd}>Add Group</Button>
      </div>

      {!groups || groups.length === 0 ? (
        <EmptyState
          title="No groups yet"
          description="Create groups to organize your guests and assign them to events."
          icon={<span className="text-4xl">👥</span>}
          action={<Button onClick={handleAdd}>Add Group</Button>}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {groups.map((group) => (
            <Card key={group.id} className="flex items-center justify-between p-4">
              <div>
                <h3 className="text-base font-semibold text-dash-text">
                  {group.name}
                </h3>
                <p className="text-sm text-dash-muted">
                  {groupCounts?.[group.id] ?? 0} guests · Sort order: {group.sort_order}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(group)}
                >
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteMutation.mutate(group.id)}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? "Edit Group" : "Add Group"}
        size="md"
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Group Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Bride's Family"
            autoFocus
          />
          <Input
            label="Sort Order"
            type="number"
            value={String(sortOrder)}
            onChange={(e) => setSortOrder(Number(e.target.value))}
          />
          {(createMutation.isError || updateMutation.isError) && (
            <p className="text-sm text-dash-danger">
              {createMutation.error?.message || updateMutation.error?.message}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              loading={createMutation.isPending || updateMutation.isPending}
              disabled={!name.trim()}
            >
              {editingId ? "Update" : "Create"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
