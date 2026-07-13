import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Wedding, type GuestbookEntry } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { Button } from "../../components/ui/Button";
import { Card, Badge, EmptyState, Toast } from "../../components/ui/index";
import { formatDate } from "../../lib/utils";
import { MessageCircle, Check, Trash2, X } from "lucide-react";

export function MessagesPage() {
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("all");

  const { data: wedding, isLoading } = useQuery({
    queryKey: ["wedding"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { data, error } = await supabase.from("weddings").select("*").eq("created_by", user.user.id).single();
      if (error) throw error;
      return data as Wedding;
    },
  });

  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ["messages", wedding?.id],
    queryFn: async () => {
      if (!wedding) return [];
      const { data } = await supabase.from("guestbook_entries").select("*").eq("wedding_id", wedding.id).order("created_at", { ascending: false });
      return (data || []) as GuestbookEntry[];
    },
    enabled: !!wedding,
  });

  const approveMessage = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("guestbook_entries").update({ is_approved: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["messages"] }); setToast("Message approved"); },
  });

  const unapproveMessage = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("guestbook_entries").update({ is_approved: false }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["messages"] }); setToast("Message unapproved"); },
  });

  const deleteMessage = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("guestbook_entries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["messages"] }); setToast("Message deleted"); },
  });

  if (isLoading) return <AdminLayout><div className="flex items-center justify-center h-full"><div className="animate-pulse text-gray-400">Loading...</div></div></AdminLayout>;
  if (!wedding) return <AdminLayout><div className="p-6 text-gray-500">Wedding not found</div></AdminLayout>;

  const filteredMessages = (messages || []).filter((m) => {
    if (filter === "pending") return !m.is_approved;
    if (filter === "approved") return m.is_approved;
    return true;
  });

  const pendingCount = (messages || []).filter((m) => !m.is_approved).length;

  return (
    <AdminLayout>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <MessageCircle size={18} className="text-indigo-600" />
              <h1 className="font-ui text-xl font-bold text-gray-900">Guestbook Messages</h1>
              {pendingCount > 0 && <Badge variant="warning">{pendingCount} pending</Badge>}
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1 mb-6">
            {([
              { key: "all", label: "All", count: messages?.length || 0 },
              { key: "pending", label: "Pending", count: pendingCount },
              { key: "approved", label: "Approved", count: (messages?.length || 0) - pendingCount },
            ] as const).map((tab) => (
              <button key={tab.key} onClick={() => setFilter(tab.key)} className={`px-4 py-2 font-ui text-xs font-medium rounded-lg transition-all ${filter === tab.key ? "bg-indigo-50 text-indigo-600" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}>
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {messagesLoading ? (
            <div className="text-center py-8 text-gray-400 font-ui text-sm">Loading messages...</div>
          ) : filteredMessages.length > 0 ? (
            <div className="space-y-3">
              {filteredMessages.map((msg) => (
                <Card key={msg.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-ui text-sm font-semibold text-gray-900">{msg.author_name}</h3>
                        <Badge variant={msg.is_approved ? "success" : "warning"}>{msg.is_approved ? "Approved" : "Pending"}</Badge>
                      </div>
                      <p className="font-ui text-xs text-gray-400">{formatDate(msg.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {msg.is_approved ? (
                        <button onClick={() => unapproveMessage.mutate(msg.id)} title="Unapprove" className="p-1.5 hover:bg-amber-50 rounded-lg transition-colors"><X size={14} className="text-amber-500" /></button>
                      ) : (
                        <button onClick={() => approveMessage.mutate(msg.id)} title="Approve" className="p-1.5 hover:bg-green-50 rounded-lg transition-colors"><Check size={14} className="text-green-500" /></button>
                      )}
                      <button onClick={() => { if (confirm("Delete this message?")) deleteMessage.mutate(msg.id); }} title="Delete" className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} className="text-red-500" /></button>
                    </div>
                  </div>
                  <p className="font-ui text-sm text-gray-600 whitespace-pre-line">{msg.message}</p>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState icon={<MessageCircle size={48} />} title={filter === "pending" ? "No pending messages" : filter === "approved" ? "No approved messages" : "No messages yet"} description="Guestbook messages from your guests will appear here." />
          )}
        </div>
      </div>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </AdminLayout>
  );
}
