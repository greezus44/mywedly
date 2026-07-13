import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Wedding, type GuestbookEntry } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { Card, Badge, EmptyState, Toast } from "../../components/ui/index";
import { cn } from "../../lib/utils";
import { Check, Trash2, MessageSquare } from "lucide-react";
export function MessagesPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("all");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const { data: wedding, isLoading: wLoading, error: wError } = useQuery<Wedding>({
    queryKey: ["wedding"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { data, error } = await supabase.from("weddings").select("*").eq("created_by", user.user.id).single();
      if (error) throw error;
      return data as Wedding;
    },
  });

  const { data: messages = [], isLoading: mLoading } = useQuery<GuestbookEntry[]>({
    queryKey: ["messages", wedding?.id],
    queryFn: async () => {
      if (!wedding) return [];
      const { data } = await supabase.from("guestbook").select("*").eq("wedding_id", wedding.id).order("created_at", { ascending: false });
      return (data || []) as GuestbookEntry[];
    },
    enabled: !!wedding,
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("guestbook").update({ is_approved: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["messages", wedding?.id] }); setToast({ message: "Message approved", type: "success" }); },
    onError: () => setToast({ message: "Failed to approve", type: "error" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("guestbook").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["messages", wedding?.id] }); setToast({ message: "Message deleted", type: "success" }); },
    onError: () => setToast({ message: "Failed to delete", type: "error" }),
  });

  const filtered = messages.filter((m) => {
    if (filter === "pending") return !m.is_approved;
    if (filter === "approved") return m.is_approved;
    return true;
  });

  if (wLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full p-8">
          <p className="font-ui text-sm text-gray-500">Loading messages...</p>
        </div>
      </AdminLayout>
    );
  }

  if (wError || !wedding) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full p-8">
          <p className="font-ui text-sm text-red-500">Unable to load wedding data.</p>
        </div>
      </AdminLayout>
    );
  }

  const pendingCount = messages.filter((m) => !m.is_approved).length;

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 overflow-y-auto">
        <div className="mb-6">
          <h1 className="font-ui text-xl font-bold text-gray-900">Messages</h1>
          <p className="font-ui text-sm text-gray-500 mt-1">{messages.length} total · {pendingCount} pending approval</p>
        </div>

        <div className="inline-flex items-center gap-1 bg-gray-100 rounded-lg p-1 mb-4">
          {(["all", "pending", "approved"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-4 py-1.5 rounded-md text-xs font-ui font-medium transition-all capitalize",
                filter === f ? "bg-white shadow-sm text-indigo-600" : "text-gray-500 hover:text-gray-700"
              )}
            >
              {f === "all" ? "All" : f === "pending" ? `Pending (${pendingCount})` : "Approved"}
            </button>
          ))}
        </div>

        {mLoading ? (
          <p className="font-ui text-sm text-gray-500">Loading messages...</p>
        ) : filtered.length === 0 ? (
          <Card className="p-0">
            <EmptyState
              icon={<MessageSquare size={40} />}
              title="No messages"
              description={filter === "pending" ? "No messages waiting for approval." : filter === "approved" ? "No approved messages yet." : "Guest messages will appear here."}
            />
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((msg) => (
              <Card key={msg.id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-ui text-sm font-semibold text-gray-900">{msg.author_name}</h3>
                      {msg.is_approved ? (
                        <Badge variant="success">Approved</Badge>
                      ) : (
                        <Badge variant="warning">Pending</Badge>
                      )}
                    </div>
                    <p className="font-ui text-xs text-gray-400">{new Date(msg.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {!msg.is_approved && (
                      <button
                        onClick={() => approveMutation.mutate(msg.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-ui font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                      >
                        <Check size={14} /> Approve
                      </button>
                    )}
                    <button
                      onClick={() => deleteMutation.mutate(msg.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <p className="font-ui text-sm text-gray-700 whitespace-pre-line mt-2">{msg.message}</p>
              </Card>
            ))}
          </div>
        )}
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </AdminLayout>
  );
}
