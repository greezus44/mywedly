import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type GuestGroup } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import {
  Card,
  Modal,
  LoadingSpinner,
  ErrorState,
  EmptyState,
  Badge,
} from "../../components/ui";

export function GroupsPage() {
  const { eventId } = useEventContext();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");

  const {
    data: groups,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["guest-groups", eventId],
    queryFn: async () => {
      const { data, error: queryError } = await supabase
        .from("guest_groups")
        .select("*")
        .eq("event_id", eventId)
        .order("sort_order", { ascending: true });
      if (queryError) throw queryError;
      return data as GuestGroup[];
    },
  });

  // Fetch guest counts per group
  const { data: guests } = useQuery({
    queryKey: ["event-guests-groups", eventId],
    queryFn: async () => {
      const { data, error: queryError } = await supabase
        .from("event_guests")
        .select("group_id")
        .eq("event_id", eventId);
      if (queryError) throw queryError;
      return data;
    },
  });

  const guestCountByGroup = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const g of guests ?? []) {
      if (g.group_id) {
        map.set(g.group_id, (map.get(g.group_id) ?? 0) + 1);
      }
    }
    return map;
  }, [guests]);

  const createMutation = useMutation({
    mutationFn: async (groupName: string) => {
      const { error: createError } = await supabase
        .from("guest_groups")
        .insert({
          event_id: eventId,
          name: groupName,
          sort_order: groups?.length ?? 0,
        });
      if (createError) throw createError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest-groups", eventId] });
      setShowForm(false);
      setName("");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (groupName: string) => {
      const { error: updateError } = await supabase
        .from("guest_groups")
        .update({ name: groupName, updated_at: new Date().toISOString() })
        .eq("id", editingId!);
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest-groups", eventId] });
      setShowForm(false);
      setEditingId(null);
      setName("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error: deleteError } = await supabase
        .from("guest_groups")
        .delete()
        .eq("id", id);
      if (deleteError) throw deleteError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest-groups", eventId] });
    },
  });

  const handleEdit = (group: GuestGroup) => {
    setEditingId(group.id);
    setName(group.name);
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingId(null);
    setName("");
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate(name);
    } else {
      createMutation.mutate(name);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState message={error instanceof Error ? error.message : "Failed to load"} onRetry={() => refetch()} />;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-dash-text">Guest Groups</h2>
          <p className="mt-1 text-sm text-dash-muted">
            Organize guests into groups for easier management and invitations.
          </p>
        </div>
        <Button onClick={handleAdd}>+ Add Group</Button>
      </div>

      {!groups || groups.length === 0 ? (
        <EmptyState
          title="No groups yet"
          description="Create guest groups to organize your guests (e.g., Bride's family, Groom's friends)."
          icon={<span className="text-4xl">👥</span>}
          action={<Button onClick={handleAdd}>Add Group</Button>}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {groups.map((group) => (
            <Card key={group.id} hover>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-dash-text">{group.name}</h3>
                  <Badge variant="default" className="mt-1">
                    {guestCountByGroup.get(group.id) ?? 0} guests
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => handleEdit(group)}>
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    loading={deleteMutation.isPending}
                    onClick={() => {
                      if (confirm("Delete this group? Guests will remain but unassigned.")) {
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
        onClose={() => {
          setShowForm(false);
          setEditingId(null);
          setName("");
        }}
        title={editingId ? "Edit Group" : "Add Group"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Group Name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Bride's Family"
            required
          />
          {(createMutation.isError || updateMutation.isError) && (
            <p className="text-sm text-dash-danger">
              {createMutation.error instanceof Error
                ? createMutation.error.message
                : updateMutation.error instanceof Error
                ? updateMutation.error.message
                : "Save failed"}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
                setName("");
              }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>
              {editingId ? "Save" : "Add"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
