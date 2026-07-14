import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type GuestGroup } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import {
  Input,
  Card,
  Modal,
  LoadingSpinner,
  ErrorState,
  EmptyState,
  Badge,
} from "../../components/ui";
import type { EventOutletContext } from "./event-layout";

export default function Groups() {
  const { eventId } = useOutletContext<EventOutletContext>();
  const queryClient = useQueryClient();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: groups, isLoading, error, refetch } = useQuery({
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

  // Get guest counts per group
  const { data: guestCounts } = useQuery({
    queryKey: ["guest-counts-by-group", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_guests")
        .select("group_id")
        .eq("event_id", eventId)
        .not("group_id", "is", null);
      if (error) throw error;
      const counts: Record<string, number> = {};
      for (const row of data ?? []) {
        const gid = row.group_id as string;
        counts[gid] = (counts[gid] ?? 0) + 1;
      }
      return counts;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const sortOrder = groups?.length ?? 0;
      const { error } = await supabase
        .from("guest_groups")
        .insert({
          event_id: eventId,
          name,
          sort_order: sortOrder,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest-groups", eventId] });
      setModalOpen(false);
      setName("");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingId) return;
      const { error } = await supabase
        .from("guest_groups")
        .update({ name })
        .eq("id", editingId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest-groups", eventId] });
      setModalOpen(false);
      setEditingId(null);
      setName("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!deleteId) return;
      const { error } = await supabase
        .from("guest_groups")
        .delete()
        .eq("id", deleteId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest-groups", eventId] });
      queryClient.invalidateQueries({ queryKey: ["guest-counts-by-group", eventId] });
      setDeleteId(null);
    },
  });

  const handleAdd = () => {
    setEditingId(null);
    setName("");
    setModalOpen(true);
  };

  const handleEdit = (group: GuestGroup) => {
    setEditingId(group.id);
    setName(group.name);
    setModalOpen(true);
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
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <ErrorState
          title="Failed to load groups"
          message={error.message}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl space-y-6 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-dash-text">Guest Groups</h2>
            <p className="mt-1 text-sm text-dash-muted">
              Organize guests into groups for easier management
            </p>
          </div>
          <Button onClick={handleAdd}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Group
          </Button>
        </div>

        {groups && groups.length > 0 ? (
          <div className="space-y-3">
            {groups.map((group) => (
              <Card key={group.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-dash-primary/10 text-dash-primary">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.059 2.772m0 0a3 3 0 00-4.682 2.72 8.986 8.986 0 003.74.479" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-dash-text">
                      {group.name}
                    </h3>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge>
                        {guestCounts?.[group.id] ?? 0} guests
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(group)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDeleteId(group.id)}
                  >
                    <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.107 48.107 0 013.478-.397m7.5 0v-.916c0-1.616-1.314-2.9-2.94-2.9H10.5c-1.626 0-2.94 1.284-2.94 2.9v.916m7.5 0a48.108 48.108 0 00-3.478-.397" />
                    </svg>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No groups yet"
            description="Create groups to organize your guests (e.g. Family, Friends, Coworkers)."
            icon={
              <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.059 2.772m0 0a3 3 0 00-4.682 2.72 8.986 8.986 0 003.74.479" />
              </svg>
            }
            action={<Button onClick={handleAdd}>Add First Group</Button>}
          />
        )}
      </div>

      {/* Add/Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit Group" : "Add Group"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              loading={createMutation.isPending || updateMutation.isPending}
              disabled={!name.trim()}
            >
              {editingId ? "Update" : "Create"}
            </Button>
          </>
        }
      >
        <Input
          label="Group Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Family, Friends, Coworkers"
        />
      </Modal>

      {/* Delete confirmation */}
      <Modal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete Group"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => deleteMutation.mutate()}
              loading={deleteMutation.isPending}
            >
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-dash-text">
          Are you sure you want to delete this group? Guests in this group will
          remain but will no longer be associated with a group.
        </p>
      </Modal>
    </div>
  );
}
