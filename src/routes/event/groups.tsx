import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type GuestGroup } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card, Modal, LoadingSpinner, ErrorState, EmptyState, Badge } from "../../components/ui";
import type { EventOutletContext } from "./event-layout";

export default function Groups(): React.ReactElement {
  const { eventId } = useOutletContext<EventOutletContext>();
  const queryClient = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [sortOrder, setSortOrder] = useState(0);

  const { data: groups, isLoading, error } = useQuery({
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

  // Count guests per group
  const { data: groupCounts } = useQuery({
    queryKey: ["group-counts", eventId],
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
      const maxOrder = groups?.length ?? 0;
      const { error } = await supabase.from("guest_groups").insert({
        event_id: eventId,
        wedding_id: eventId,
        name,
        sort_order: sortOrder || maxOrder,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest-groups", eventId] });
      setShowModal(false);
      setName("");
      setSortOrder(0);
      setEditingId(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingId) throw new Error("No group selected");
      const { error } = await supabase
        .from("guest_groups")
        .update({ name, sort_order: sortOrder })
        .eq("id", editingId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest-groups", eventId] });
      setShowModal(false);
      setName("");
      setSortOrder(0);
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("guest_groups").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest-groups", eventId] });
      queryClient.invalidateQueries({ queryKey: ["group-counts", eventId] });
    },
  });

  function handleEdit(group: GuestGroup): void {
    setEditingId(group.id);
    setName(group.name);
    setSortOrder(group.sort_order);
    setShowModal(true);
  }

  function handleAdd(): void {
    setEditingId(null);
    setName("");
    setSortOrder(groups?.length ?? 0);
    setShowModal(true);
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const saveError = createMutation.error || updateMutation.error;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error.message} />;
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dash-text">Guest Groups</h2>
          <p className="mt-1 text-sm text-dash-muted">
            Organize guests into groups for easier management and invitation assignment
          </p>
        </div>
        <Button onClick={handleAdd}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Group
        </Button>
      </div>

      {groups && groups.length > 0 ? (
        <div className="space-y-2">
          {groups.map((group) => (
            <Card key={group.id} className="flex items-center justify-between gap-4 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-dash-primary/10 text-dash-primary">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-5.13a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-dash-text">{group.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge>{groupCounts?.[group.id] ?? 0} guests</Badge>
                    <span className="text-xs text-dash-muted">Order: {group.sort_order}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="sm" onClick={() => handleEdit(group)}>
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  loading={deleteMutation.isPending}
                  onClick={() => {
                    if (confirm(`Delete group "${group.name}"? Guests in this group will not be deleted but will be ungrouped.`)) {
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
      ) : (
        <Card>
          <EmptyState
            icon={
              <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-5.13a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            }
            title="No guest groups"
            description="Create groups to organize your guests and assign invitations."
            action={<Button onClick={handleAdd}>Add Group</Button>}
          />
        </Card>
      )}

      {/* Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? "Edit Group" : "Add Group"}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (editingId) {
              updateMutation.mutate();
            } else {
              createMutation.mutate();
            }
          }}
          className="space-y-4"
        >
          <Input
            label="Group name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Bride's Family, Groom's Friends"
            required
            autoFocus
          />
          <Input
            label="Sort order"
            type="number"
            value={String(sortOrder)}
            onChange={(e) => setSortOrder(Number(e.target.value))}
            placeholder="0"
          />
          {saveError && (
            <div className="rounded-md border border-dash-danger/20 bg-dash-danger/5 px-4 py-3">
              <p className="text-sm text-dash-danger">
                {saveError instanceof Error ? saveError.message : "Failed to save"}
              </p>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={isSaving} disabled={isSaving}>
              {editingId ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
