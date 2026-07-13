import { useState, type FormEvent } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type GuestGroup } from "../../lib/supabase";
import {
  Button,
  Card,
  Modal,
  Input,
  Badge,
  EmptyState,
  ErrorState,
  LoadingSpinner,
} from "../../components/ui";

export default function GroupsPage() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<GuestGroup | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: groups, isLoading, isError, refetch } = useQuery({
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

  const createMutation = useMutation({
    mutationFn: async () => {
      const sortOrder = groups?.length ?? 0;
      const { error } = await supabase.from("guest_groups").insert({
        name,
        event_id: event.id,
        sort_order: sortOrder,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest_groups", event.id] });
      setModalOpen(false);
      setName("");
      setError(null);
    },
    onError: (err: Error) => setError(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editing) return;
      const { error } = await supabase
        .from("guest_groups")
        .update({ name })
        .eq("id", editing.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest_groups", event.id] });
      setModalOpen(false);
      setEditing(null);
      setName("");
      setError(null);
    },
    onError: (err: Error) => setError(err.message),
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

  const openCreate = () => {
    setEditing(null);
    setName("");
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (g: GuestGroup) => {
    setEditing(g);
    setName(g.name);
    setError(null);
    setModalOpen(true);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Group name is required");
      return;
    }
    if (editing) updateMutation.mutate();
    else createMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  if (isError) {
    return <ErrorState message="Failed to load guest groups." onRetry={() => refetch()} />;
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
          title="No groups yet"
          description="Create groups to organize your guests (e.g. Family, Friends, Colleagues)."
          icon={<span className="text-4xl">👥</span>}
          action={<Button onClick={openCreate}>Add Group</Button>}
        />
      )}

      {groups && groups.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((g) => (
            <Card key={g.id} className="flex items-center justify-between gap-2">
              <div>
                <h3 className="font-medium text-dash-text">{g.name}</h3>
                <Badge variant="default" className="mt-1">Group</Badge>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => openEdit(g)}>
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  loading={deleteMutation.isPending}
                  onClick={() => {
                    if (confirm(`Delete group "${g.name}"?`)) deleteMutation.mutate(g.id);
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
        title={editing ? "Edit Group" : "Add Group"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Group Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Family, Friends, Colleagues"
            autoFocus
            error={error ?? undefined}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>
              {editing ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
