import { useState, type FormEvent } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type GuestGroup } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Card, Input, Badge, LoadingSpinner, ErrorState, EmptyState, Modal } from "../../components/ui";
import type { EventContextValue } from "./event-layout";

export function GroupsPage() {
  const { eventId } = useOutletContext<EventContextValue>();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState<GuestGroup | null>(null);
  const [name, setName] = useState("");

  const { data: groups, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["groups", eventId],
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

  const saveMutation = useMutation({
    mutationFn: async () => {
      const sortOrder = editingGroup
        ? editingGroup.sort_order
        : (groups?.length ?? 0);
      if (editingGroup) {
        const { error } = await supabase
          .from("guest_groups")
          .update({ name })
          .eq("id", editingGroup.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("guest_groups")
          .insert({ event_id: eventId, name, sort_order: sortOrder });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups", eventId] });
      queryClient.invalidateQueries({ queryKey: ["group-counts", eventId] });
      setShowForm(false);
      setEditingGroup(null);
      setName("");
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
      queryClient.invalidateQueries({ queryKey: ["groups", eventId] });
      queryClient.invalidateQueries({ queryKey: ["group-counts", eventId] });
    },
  });

  function handleEdit(group: GuestGroup) {
    setEditingGroup(group);
    setName(group.name);
    setShowForm(true);
  }

  function handleAdd() {
    setEditingGroup(null);
    setName("");
    setShowForm(true);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    saveMutation.mutate();
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState message={error?.message ?? "Failed to load groups"} onRetry={refetch} />
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-dash-text">Guest Groups</h2>
          <p className="text-sm text-dash-muted">Organize guests into groups for easier management.</p>
        </div>
        <Button onClick={handleAdd}>Add Group</Button>
      </div>

      {!groups || groups.length === 0 ? (
        <EmptyState
          title="No guest groups"
          description="Create groups to organize your guests (e.g. Bride's side, Groom's side)."
          icon={<span className="text-4xl">👥</span>}
          action={<Button onClick={handleAdd}>Create First Group</Button>}
        />
      ) : (
        <div className="space-y-3">
          {groups.map((group) => (
            <Card key={group.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="text-base font-semibold text-dash-text">{group.name}</h3>
                  <Badge variant="default">
                    {groupCounts?.[group.id] ?? 0} guest{(groupCounts?.[group.id] ?? 0) !== 1 ? "s" : ""}
                  </Badge>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(group)}>
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    loading={deleteMutation.isPending}
                    onClick={() => {
                      if (confirm(`Delete group "${group.name}"? Guests in this group will not be deleted.`)) {
                        deleteMutation.mutate(group.id);
                      }
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editingGroup ? "Edit Group" : "Add Group"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Group Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Bride's Family"
          />
          {saveMutation.isError && (
            <p className="text-sm text-dash-danger">
              {saveMutation.error?.message ?? "Failed to save"}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saveMutation.isPending}>
              {editingGroup ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default GroupsPage;
