import { useState, useEffect, type FormEvent } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase, type GuestGroup } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import {
  Modal,
  LoadingSpinner,
  ErrorState,
  EmptyState,
  Card,
  Badge,
} from "../../components/ui";

async function fetchGroups(eventId: string): Promise<GuestGroup[]> {
  const { data, error } = await supabase
    .from("guest_groups")
    .select("*")
    .eq("event_id", eventId)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return (data ?? []) as GuestGroup[];
}

async function fetchGroupCounts(
  eventId: string
): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from("event_guests")
    .select("group_id")
    .eq("event_id", eventId)
    .not("group_id", "is", null);

  if (error) throw error;

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    const gid = (row as { group_id: string | null }).group_id;
    if (gid) counts[gid] = (counts[gid] ?? 0) + 1;
  }
  return counts;
}

export default function Groups() {
  const { event, eventId } = useEventContext();
  const queryClient = useQueryClient();

  const {
    data: groups,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["guest_groups", eventId],
    queryFn: () => fetchGroups(eventId),
  });

  const { data: groupCounts } = useQuery({
    queryKey: ["group_counts", eventId],
    queryFn: () => fetchGroupCounts(eventId),
  });

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<GuestGroup | null>(null);
  const [name, setName] = useState("");
  const [sortOrder, setSortOrder] = useState(0);

  const resetForm = () => {
    setName("");
    setSortOrder(0);
    setEditing(null);
  };

  const openCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const openEdit = (group: GuestGroup) => {
    setEditing(group);
    setName(group.name);
    setSortOrder(group.sort_order);
    setShowModal(true);
  };

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
          .insert({
            event_id: eventId,
            wedding_id: eventId,
            name,
            sort_order: sortOrder,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest_groups", eventId] });
      setShowModal(false);
      resetForm();
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
      queryClient.invalidateQueries({ queryKey: ["group_counts", eventId] });
      queryClient.invalidateQueries({ queryKey: ["event_guests", eventId] });
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    saveMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8">
        <ErrorState
          message={error instanceof Error ? error.message : "Failed to load groups"}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-4 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-dash-text">Guest Groups</h1>
          <p className="mt-1 text-sm text-dash-muted">
            Organize guests into groups for easier invitation management.
          </p>
        </div>
        <Button size="sm" onClick={openCreate}>
          + Add Group
        </Button>
      </div>

      {groups && groups.length === 0 ? (
        <EmptyState
          title="No groups yet"
          description="Create groups like 'Family', 'Friends', or 'Coworkers' to organize your guests."
          action={<Button onClick={openCreate}>Add Group</Button>}
        />
      ) : (
        <div className="space-y-3">
          {groups?.map((group) => (
            <Card key={group.id} className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-dash-primary/10 text-sm font-semibold text-dash-primary">
                    {group.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-dash-text">{group.name}</h3>
                    <div className="mt-0.5 flex items-center gap-2">
                      <Badge variant="default">
                        {groupCounts?.[group.id] ?? 0} guests
                      </Badge>
                      <span className="text-xs text-dash-muted">
                        Order: {group.sort_order}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEdit(group)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMutation.mutate(group.id)}
                    loading={deleteMutation.isPending}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? "Edit Group" : "Add Group"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Group Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Family"
            required
            autoFocus
          />
          <Input
            label="Sort Order"
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value))}
            min={0}
          />
          {saveMutation.isError && (
            <p className="text-sm text-dash-danger">
              {saveMutation.error instanceof Error
                ? saveMutation.error.message
                : "Failed to save"}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={saveMutation.isPending}>
              {saveMutation.isPending ? <LoadingSpinner size="sm" /> : "Save"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
