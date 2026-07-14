import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type GuestGroup } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card, Modal, LoadingSpinner, ErrorState, EmptyState, Badge, FormField } from "../../components/ui";
import { formatDate } from "../../lib/utils";

export const GroupsPage: React.FC = () => {
  const { eventId } = useEventContext();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: groups, isLoading, isError, refetch } = useQuery({
    queryKey: ["guest-groups", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guest_groups")
        .select("*")
        .eq("event_id", eventId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as GuestGroup[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const sortOrder = editingId
        ? (groups?.find((g) => g.id === editingId)?.sort_order ?? groups?.length ?? 0)
        : (groups?.length ?? 0);
      if (editingId) {
        const { error } = await supabase
          .from("guest_groups")
          .update({ name: name.trim() })
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("guest_groups")
          .insert({
            event_id: eventId,
            name: name.trim(),
            sort_order: sortOrder,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest-groups", eventId] });
      setModalOpen(false);
      setName("");
      setEditingId(null);
      setError(null);
    },
    onError: (err: unknown) => {
      setError(err instanceof Error ? err.message : "Failed to save group");
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
      queryClient.invalidateQueries({ queryKey: ["guest-groups", eventId] });
    },
  });

  const openCreate = () => {
    setName("");
    setEditingId(null);
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (group: GuestGroup) => {
    setName(group.name);
    setEditingId(group.id);
    setError(null);
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!name.trim()) {
      setError("Group name is required");
      return;
    }
    saveMutation.mutate();
  };

  if (isLoading) {
    return <LoadingSpinner size="md" label="Loading groups..." />;
  }

  if (isError) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dash-text">Guest Groups</h2>
          <p className="text-sm text-dash-muted">Organize your guests into groups for easier management.</p>
        </div>
        <Button onClick={openCreate}>Add Group</Button>
      </div>

      {(!groups || groups.length === 0) && (
        <EmptyState
          title="No guest groups"
          description="Create groups to organize your guests (e.g. Bride's family, Groom's friends)."
          action={<Button onClick={openCreate}>Add Group</Button>}
        />
      )}

      {groups && groups.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <Card key={group.id} className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-dash-text">{group.name}</h3>
                <p className="mt-1 text-xs text-dash-muted">
                  Created {formatDate(group.created_at)}
                </p>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => openEdit(group)}>
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (confirm(`Delete group "${group.name}"?`)) {
                      deleteMutation.mutate(group.id);
                    }
                  }}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit Group" : "Add Group"}
      >
        <div className="space-y-4">
          <FormField label="Group name" required>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Bride's Family"
              autoFocus
            />
          </FormField>
          {error && <p className="text-sm text-dash-danger">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saveMutation.isPending} disabled={saveMutation.isPending}>
              {editingId ? "Update" : "Add"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
