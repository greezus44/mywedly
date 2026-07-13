import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Loader2, Users } from "lucide-react";
import { supabase, type UserEvent, type GuestGroup } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import {
  Card,
  EmptyState,
  Skeleton,
  Modal,
  FormField,
  Toast,
  type ToastType,
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

async function createGroup(input: {
  event_id: string;
  name: string;
  sort_order: number;
}): Promise<GuestGroup> {
  const { data, error } = await supabase
    .from("guest_groups")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as GuestGroup;
}

async function deleteGroup(id: string): Promise<void> {
  const { error } = await supabase.from("guest_groups").delete().eq("id", id);
  if (error) throw error;
}

export default function GroupsPage() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const { data: groups, isLoading } = useQuery({
    queryKey: ["guest-groups", event.id],
    queryFn: () => fetchGroups(event.id),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createGroup({
        event_id: event.id,
        name: name.trim(),
        sort_order: 0,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest-groups", event.id] });
      setToast({ message: "Group created!", type: "success" });
      setName("");
      setShowAdd(false);
    },
    onError: (err: Error) => {
      const msg = err.message.toLowerCase();
      if (msg.includes("row-level security")) {
        setToast({
          message: "You don't have permission to create groups for this event.",
          type: "error",
        });
      } else if (msg.includes("jwt")) {
        setToast({
          message: "Your session has expired. Please sign in again.",
          type: "error",
        });
      } else {
        setToast({
          message: `Unable to create the group: ${err.message}`,
          type: "error",
        });
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest-groups", event.id] });
      setToast({ message: "Group deleted", type: "success" });
    },
    onError: (err: Error) => {
      setToast({ message: err.message, type: "error" });
    },
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createMutation.mutate();
  };

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="mx-auto max-w-4xl space-y-6 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-xl font-bold text-gray-900">
              Groups
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Organize guests into groups for easier management.
            </p>
          </div>
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus className="h-4 w-4" /> Add Group
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : !groups || groups.length === 0 ? (
          <EmptyState
            icon={<Users className="h-12 w-12" />}
            title="No groups yet"
            description="Create groups like 'Bride's family' or 'College friends' to organize your guests."
            action={
              <Button size="sm" onClick={() => setShowAdd(true)}>
                <Plus className="h-4 w-4" /> Add Group
              </Button>
            }
          />
        ) : (
          <div className="space-y-3">
            {groups.map((group) => (
              <Card key={group.id} className="flex items-center justify-between p-4">
                <div>
                  <h3 className="font-medium text-gray-900">{group.name}</h3>
                  <p className="text-xs text-gray-500">
                    Sort order: {group.sort_order}
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (confirm("Delete this group?")) {
                      deleteMutation.mutate(group.id);
                    }
                  }}
                  className="text-gray-400 transition-colors hover:text-red-600"
                  aria-label="Delete group"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)}>
        <div className="p-6">
          <h2 className="font-heading text-xl font-bold text-gray-900">
            Add Group
          </h2>
          <form onSubmit={handleAdd} className="mt-4 space-y-4">
            <FormField label="Group name">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Bride's family"
                required
                autoFocus
              />
            </FormField>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowAdd(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Creating...
                  </>
                ) : (
                  "Create"
                )}
              </Button>
            </div>
          </form>
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
