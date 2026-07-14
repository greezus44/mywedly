import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type GuestGroup } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Card, Input, Modal, Badge, EmptyState, LoadingSpinner, ErrorState } from "../../components/ui";

export function GroupsPage() {
  const { eventId } = useEventContext();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");

  const { data: groups, isLoading, isError, refetch } = useQuery({
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
    mutationFn: async () => {
      const maxOrder = groups?.length ?? 0;
      const { error } = await supabase.from("guest_groups").insert({
        event_id: eventId,
        name,
        sort_order: maxOrder,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest-groups", eventId] });
      setShowForm(false);
      setName("");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("guest_groups")
        .update({
          name,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingId!);
      if (error) throw error;
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
      const { error } = await supabase.from("guest_groups").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest-groups", eventId] });
    },
  });

  const openEdit = (group: GuestGroup) => {
    setEditingId(group.id);
    setName(group.name);
    setShowForm(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size={32} />
      </div>
    );
  }

  if (isError) {
    return <ErrorState message="Failed to load guest groups." onRetry={() => refetch()} />;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dash-text">Guest Groups</h2>
          <p className="mt-1 text-sm text-dash-muted">
            Organize guests into groups for easier management and event invitations.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingId(null);
            setName("");
            setShowForm(true);
          }}
        >
          Add Group
        </Button>
      </div>

      {groups && groups.length === 0 ? (
        <EmptyState
          title="No guest groups yet"
          description="Create groups like 'Bride's Family', 'Groom's Friends', etc."
          icon={<div className="text-4xl">👥</div>}
          action={<Button onClick={() => setShowForm(true)}>Create First Group</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {groups?.map((group) => (
            <Card key={group.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-dash-text">{group.name}</h3>
                  <p className="mt-1 text-xs text-dash-muted">
                    Created {new Date(group.created_at).toLocaleDateString()}
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
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Form Modal */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editingId ? "Edit Group" : "Add Group"}
      >
        <div className="space-y-4">
          <Input
            label="Group Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Bride's Family"
          />
          {(createMutation.isError || updateMutation.isError) && (
            <p className="text-sm text-dash-danger">
              Error: {((createMutation.error || updateMutation.error) as Error)?.message}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (editingId) updateMutation.mutate();
                else createMutation.mutate();
              }}
              loading={createMutation.isPending || updateMutation.isPending}
              disabled={!name.trim()}
            >
              {editingId ? "Update" : "Create"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
