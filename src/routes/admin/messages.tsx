import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Wedding, type GuestbookEntry } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card, Badge, EmptyState, Toast } from "../../components/ui/index";
import { formatDate, cn } from "../../lib/utils";
import { Check, Trash2, Search, MessageSquare, RefreshCw, Clock, CheckCircle } from "lucide-react";

export function MessagesPage() {
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("all");

  const weddingQuery = useQuery({
    queryKey: ["wedding"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { data, error } = await supabase.from("weddings").select("*").eq("created_by", user.user.id).single();
      if (error) throw error;
      return data as Wedding;
    },
  });

  const wedding = weddingQuery.data;

  const messagesQuery = useQuery({
    queryKey: ["guestbook-entries", wedding?.id],
    queryFn: async () => {
      if (!wedding) return [];
      const { data, error } = await supabase
        .from("guestbook_entries")
        .select("*")
        .eq("wedding_id", wedding.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as GuestbookEntry[];
    },
    enabled: !!wedding,
  });

  const messages = messagesQuery.data || [];

  const filteredMessages = messages.filter((m) => {
    const matchesSearch = !search ||
      m.author_name.toLowerCase().includes(search.toLowerCase()) ||
      m.message.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === "all" ||
      (filter === "pending" && !m.is_approved) ||
      (filter === "approved" && m.is_approved);
    return matchesSearch && matchesFilter;
  });

  const pendingCount = messages.filter((m) => !m.is_approved).length;

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("guestbook_entries")
        .update({ is_approved: true })
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw error;
      return data as GuestbookEntry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guestbook-entries"] });
      setToast({ message: "Message approved", type: "success" });
    },
    onError: () => setToast({ message: "Failed to approve message", type: "error" }),
  });

  const unapproveMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("guestbook_entries")
        .update({ is_approved: false })
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw error;
      return data as GuestbookEntry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guestbook-entries"] });
      setToast({ message: "Message unapproved", type: "success" });
    },
    onError: () => setToast({ message: "Failed to unapprove message", type: "error" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("guestbook_entries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guestbook-entries"] });
      setToast({ message: "Message deleted", type: "success" });
    },
    onError: () => setToast({ message: "Failed to delete message", type: "error" }),
  });

  if (weddingQuery.isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full p-20">
          <RefreshCw size={24} className="animate-spin text-[var(--color-primary)]" />
        </div>
      </AdminLayout>
    );
  }

  if (weddingQuery.isError || !wedding) {
    return (
      <AdminLayout>
        <div className="p-8">
          <EmptyState title="Unable to load messages" description="Please try again later." />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-[var(--color-bg)]">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div>
              <h1 className="font-heading text-2xl text-[var(--color-text)] mb-1">Messages</h1>
              <p className="font-ui text-sm text-[var(--color-text-muted)]">
                {messages.length} message{messages.length !== 1 ? "s" : ""}
                {pendingCount > 0 && ` · ${pendingCount} pending approval`}
              </p>
            </div>
          </div>

          {/* Search + Filter */}
          <div className="flex gap-3 mb-6 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search messages..."
                className="pl-10"
              />
            </div>
            <div className="inline-flex items-center gap-1 bg-white rounded-lg p-1 border border-[var(--color-border)]/20">
              {(["all", "pending", "approved"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "px-4 py-2 rounded-md text-xs font-ui font-medium uppercase tracking-wider transition-all",
                    filter === f ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]" : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Messages */}
          {messagesQuery.isLoading ? (
            <div className="flex justify-center py-12">
              <RefreshCw size={20} className="animate-spin text-[var(--color-primary)]" />
            </div>
          ) : filteredMessages.length === 0 ? (
            <Card className="p-8">
              <EmptyState
                icon={<MessageSquare size={32} />}
                title={search || filter !== "all" ? "No messages found" : "No messages yet"}
                description={search || filter !== "all" ? "Try a different search or filter." : "Guest messages will appear here."}
              />
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredMessages.map((msg) => (
                <Card key={msg.id} className="p-5">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center flex-shrink-0">
                        <span className="font-heading text-base text-[var(--color-primary)]">
                          {msg.author_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-ui text-sm font-medium text-[var(--color-text)]">{msg.author_name}</h3>
                        <p className="font-ui text-xs text-[var(--color-text-muted)]">{formatDate(msg.created_at)}</p>
                      </div>
                    </div>
                    {msg.is_approved ? (
                      <Badge variant="success"><CheckCircle size={12} className="mr-1" /> Approved</Badge>
                    ) : (
                      <Badge variant="warning"><Clock size={12} className="mr-1" /> Pending</Badge>
                    )}
                  </div>

                  <p className="font-body text-sm text-[var(--color-text)] leading-relaxed mb-4 whitespace-pre-line">
                    {msg.message}
                  </p>

                  <div className="flex items-center gap-2 pt-3 border-t border-[var(--color-border)]/10">
                    {msg.is_approved ? (
                      <Button variant="ghost" size="sm" onClick={() => unapproveMutation.mutate(msg.id)}>
                        Unapprove
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => approveMutation.mutate(msg.id)}>
                        <Check size={14} className="mr-1" /> Approve
                      </Button>
                    )}
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => { if (confirm("Delete this message?")) deleteMutation.mutate(msg.id); }}
                    >
                      <Trash2 size={14} className="mr-1" /> Delete
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </AdminLayout>
  );
}
