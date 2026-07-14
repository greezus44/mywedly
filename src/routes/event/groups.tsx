import { useState, type FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type GuestGroup } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Input, FormField, Card, Modal, LoadingSpinner, ErrorState, EmptyState, Badge } from "../../components/ui";

export function GroupsPage() {
  const { eventId } = useEventContext();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: groups, isLoading, isError, error: queryError } = useQuery({
    queryKey: ["guest-groups", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guest_groups")
        .select("*")
        .eq("event_id", eventId!)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as GuestGroup[];
    },
    enabled: !!eventId,
  });

  const createMutation = useMutation({
    mutationFn: async (groupName: string) => {
      const nextSort = (groups?.length ?? 0);
      const { error } = await supabase
        .from("guest_groups")
        .insert({
          event_id: eventId,
          name: groupName,
          sort_order: nextSort,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest-groups", eventId] });
      setShowForm(false);
      setName("");
      setError(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, groupName }: { id: string; groupName: string }) => {
      const { error } = await supabase
        .from("guest_groups")
        .update({ name: groupName, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest-groups", eventId] });
      setShowForm(false);
      setEditingId(null);
      setName("");
      setError(null);
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

  function openCreate() {
    setName("");
    setEditingId(null);
    setError(null);
    setShowForm(true);
  }

  function openEdit(group: GuestGroup) {
    setName(group.name);
    setEditingId(group.id);
    setError(null);
    setShowForm(true);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    if (editingId) {
      updateMutation.mutate({ id: editingId, groupName: name.trim() });
    } else {
      createMutation.mutate(name.trim());
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState message={queryError instanceof Error ? queryError.message : "Failed to load groups"} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-dash-text">Guest Groups</h2>
          <p className="mt-1 text-sm text-dash-muted">Organize guests into groups for easy management</p>
        </div>
        <Button onClick={openCreate}>Add Group</Button>
      </div>

      {groups && groups.length === 0 ? (
        <EmptyState
          title="No guest groups yet"
          description="Create groups to organize your guests (e.g. Bride's family, Groom's friends)."
          action={<Button onClick={openCreate}>Add Group</Button>}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {groups?.map((group) => (
            <Card key={group.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-semibold text-dash-text">{group.name}</h3>
                  <Badge className="mt-2">Sort: {group.sort_order}</Badge>
                </div>
                <div className="flex gap-1">
                  <Button variant="secondary" size="sm" onClick={() => openEdit(group)}>
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    loading={deleteMutation.isPending}
                    onClick={() => {
                      if (confirm(`Delete group "${group.name}"?`)) {
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
        title={editingId ? "Edit Group" : "Add Group"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Group Name" required error={error ?? undefined}>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Bride's Family"
              autoFocus
            />
          </FormField>
          {createMutation.isError && (
            <p className="text-sm text-dash-danger">
              {createMutation.error instanceof Error ? createMutation.error.message : "Failed to create"}
            </p>
          )}
          {updateMutation.isError && (
            <p className="text-sm text-dash-danger">
              {updateMutation.error instanceof Error ? updateMutation.error.message : "Failed to update"}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {editingId ? "Update" : "Add"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
