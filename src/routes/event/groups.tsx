import { useState, type FormEvent } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type GuestGroup } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import {
  Card,
  Modal,
  LoadingSpinner,
  ErrorState,
  EmptyState,
  IconButton,
} from "../../components/ui";

export default function Groups() {
  const { eventId } = useOutletContext<{ event: UserEvent; eventId: string }>();
  const queryClient = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [sortOrder, setSortOrder] = useState(0);

  const { data: groups, isLoading, isError } = useQuery({
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
    enabled: !!eventId,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingId) {
        const { error } = await supabase
          .from("guest_groups")
          .update({ name, sort_order: sortOrder })
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("guest_groups")
          .insert({
            name,
            event_id: eventId,
            wedding_id: eventId,
            sort_order: sortOrder,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups", eventId] });
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
      queryClient.invalidateQueries({ queryKey: ["groups", eventId] });
    },
  });

  const openCreate = () => {
    setName("");
    setSortOrder(groups?.length ?? 0);
    setEditingId(null);
    setShowModal(true);
  };

  const openEdit = (group: GuestGroup) => {
    setName(group.name);
    setSortOrder(group.sort_order);
    setEditingId(group.id);
    setShowModal(true);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    saveMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (isError) {
    return <ErrorState title="Failed to load groups" />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Guest Groups</h2>
          <p className="text-sm text-muted">
            Organize your guests into groups for easier management.
          </p>
        </div>
        <Button onClick={openCreate}>Add Group</Button>
      </div>

      {groups && groups.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <Card key={group.id} className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground">{group.name}</h3>
                <p className="text-xs text-muted">Order: {group.sort_order}</p>
              </div>
              <div className="flex gap-1">
                <IconButton onClick={() => openEdit(group)} title="Edit">
                  ✏️
                </IconButton>
                <IconButton
                  onClick={() => deleteMutation.mutate(group.id)}
                  title="Delete"
                  className="hover:text-danger"
                >
                  🗑
                </IconButton>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No groups yet"
          description="Create groups to organize your guests (e.g. Bride's Family, Groom's Friends)."
          action={<Button onClick={openCreate}>Add Group</Button>}
        />
      )}

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? "Edit Group" : "Add Group"}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Group Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Bride's Family"
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
            <p className="text-sm text-danger">
              {saveMutation.error instanceof Error
                ? saveMutation.error.message
                : "Failed to save"}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={saveMutation.isPending}>
              {editingId ? "Update" : "Add"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
