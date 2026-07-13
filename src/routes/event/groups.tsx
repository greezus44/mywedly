import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useOutletContext } from "react-router-dom";
import { Plus, Trash2, Loader2, Users } from "lucide-react";
import { supabase, type UserEvent, type GuestGroup } from "../../lib/supabase";
import {
  Button,
  Card,
  Modal,
  FormField,
  Input,
  EmptyState,
  ErrorState,
  LoadingSpinner,
  Toast,
} from "../../components/ui";

export default function GroupsPage() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const { data: groups, isLoading, error, refetch } = useQuery<GuestGroup[]>({
    queryKey: ["guest-groups", event.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guest_groups")
        .select("*")
        .eq("event_id", event.id)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return (data || []) as GuestGroup[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("guest_groups")
        .insert({
          event_id: event.id,
          name,
          sort_order: 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest-groups", event.id] });
      setShowAdd(false);
      setName("");
      setToast({ message: "Group created", type: "success" });
    },
    onError: (err: Error) => {
      const msg = err.message || "";
      if (msg.includes("row-level security")) {
        setToast({
          message: "You don't have permission to create groups for this event.",
          type: "error",
        });
      } else if (msg.includes("JWT")) {
        setToast({
          message: "Your session has expired. Please sign in again.",
          type: "error",
        });
      } else {
        setToast({
          message: `Unable to create the group: ${msg}`,
          type: "error",
        });
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("guest_groups").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest-groups", event.id] });
      setToast({ message: "Group deleted", type: "success" });
    },
    onError: (err: Error) => {
      setToast({ message: err.message, type: "error" });
    },
  });

  const handleAdd = () => {
    if (!name.trim()) {
      setToast({ message: "Please enter a group name", type: "error" });
      return;
    }
    addMutation.mutate();
  };

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Groups</h1>
          <p className="mt-1 text-sm text-gray-500">
            Organize guests into groups (e.g. family, friends, colleagues)
          </p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4" />
          Add Group
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner className="h-8 w-8" />
        </div>
      ) : error ? (
        <ErrorState
          message={error instanceof Error ? error.message : "Failed to load groups"}
          onRetry={() => refetch()}
        />
      ) : !groups || groups.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Users className="h-12 w-12" />}
            title="No groups yet"
            description="Create groups to organize your guests."
            action={
              <Button onClick={() => setShowAdd(true)}>
                <Plus className="h-4 w-4" />
                Add Group
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {groups.map((group) => (
            <Card key={group.id} className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    {group.name || "Unnamed Group"}
                  </h3>
                  <p className="mt-0.5 text-xs text-gray-400">
                    Sort order: {group.sort_order}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteMutation.mutate(group.id)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Modal */}
      <Modal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        title="Add Group"
      >
        <div className="flex flex-col gap-4">
          <FormField label="Group Name">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Bride's Family"
              autoFocus
            />
          </FormField>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowAdd(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              disabled={addMutation.isPending || !name.trim()}
            >
              {addMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating…
                </>
              ) : (
                "Create Group"
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
