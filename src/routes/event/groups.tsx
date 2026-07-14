import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type GuestGroup } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card, Modal, EmptyState, LoadingSpinner, ErrorState, Badge } from "../../components/ui";

export function GroupsPage() {
  const { event, eventId } = useOutletContext<{ event: UserEvent; eventId: string }>();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState<GuestGroup | null>(null);
  const [name, setName] = useState("");
  const [sortOrder, setSortOrder] = useState(0);

  const { data: groups, isLoading, isError } = useQuery({
    queryKey: ["guest-groups", eventId],
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

  const createMutation = useMutation({
    mutationFn: async () => {
      const maxSort = groups ? Math.max(...groups.map((g) => g.sort_order), 0) : 0;
      const { error } = await supabase.from("guest_groups").insert({
        event_id: eventId,
        name: name.trim(),
        sort_order: sortOrder || maxSort + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest-groups", eventId] });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingGroup) return;
      const { error } = await supabase
        .from("guest_groups")
        .update({ name: name.trim(), sort_order: sortOrder })
        .eq("id", editingGroup.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest-groups", eventId] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("guest_groups").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest-groups", eventId] });
    },
  });

  function resetForm() {
    setShowForm(false);
    setEditingGroup(null);
    setName("");
    setSortOrder(0);
  }

  function openEdit(group: GuestGroup) {
    setEditingGroup(group);
    setName(group.name);
    setSortOrder(group.sort_order);
    setShowForm(true);
  }

  function handleSave() {
    if (editingGroup) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-20">
        <ErrorState message="Failed to load guest groups" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-dash-text">Guest Groups</h2>
          <p className="text-sm text-dash-muted mt-1">
            Organize guests into groups for easier management and invitations.
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          Add Group
        </Button>
      </div>

      {groups && groups.length > 0 ? (
        <div className="space-y-3">
          {groups.map((group) => (
            <Card key={group.id} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-dash-bg text-dash-primary font-semibold">
                  {group.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-dash-text">{group.name}</h3>
                  <p className="text-xs text-dash-muted">
                    Order: {group.sort_order}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => openEdit(group)}>
                  Edit
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => deleteMutation.mutate(group.id)}
                  loading={deleteMutation.isPending}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            title="No guest groups"
            description="Create groups to organize your guests (e.g. Family, Friends, Coworkers)."
            icon={<span className="text-4xl">👥</span>}
            action={<Button onClick={() => setShowForm(true)}>Add Group</Button>}
          />
        </Card>
      )}

      {/* Form Modal */}
      <Modal
        open={showForm}
        onClose={resetForm}
        title={editingGroup ? "Edit Group" : "Add Group"}
      >
        <div className="space-y-4">
          <Input
            label="Group Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Family, Friends, Coworkers"
            autoFocus
          />
          <Input
            label="Sort Order"
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value))}
            placeholder="0"
          />
          {(createMutation.isError || updateMutation.isError) && (
            <p className="text-sm text-dash-danger">Failed to save group</p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={resetForm}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              loading={createMutation.isPending || updateMutation.isPending}
              disabled={!name.trim()}
            >
              {editingGroup ? "Save" : "Add"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
