import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Wedding, type GuestbookEntry } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card, Badge, EmptyState, Toast } from "../../components/ui/index";
import { formatDate } from "../../lib/utils";
import { Search, Check, Trash2, MessageSquare, Clock, CheckCircle2 } from "lucide-react";

export function MessagesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("all");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const { data: wedding, isLoading: weddingLoading, error: weddingError } = useQuery({
    queryKey: ["wedding"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { data, error } = await supabase.from("weddings").select("*").eq("created_by", user.user.id).single();
      if (error) throw error;
      return data as Wedding;
    },
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ["messages", wedding?.id],
    queryFn: async () => {
      if (!wedding) return [];
      const { data, error } = await supabase
        .from("guestbook_entries")
        .select("*")
        .eq("wedding_id", wedding.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as GuestbookEntry[];
    },
    enabled: !!wedding,
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("guestbook_entries")
        .update({ is_approved: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      setToast({ message: "Message approved", type: "success" });
    },
    onError: (err) => setToast({ message: err.message || "Failed to approve", type: "error" }),
  });

  const unapproveMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("guestbook_entries")
        .update({ is_approved: false })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      setToast({ message: "Message unapproved", type: "success" });
    },
    onError: (err) => setToast({ message: err.message || "Failed to unapprove", type: "error" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("guestbook_entries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      setToast({ message: "Message deleted", type: "success" });
    },
    onError: (err) => setToast({ message: err.message || "Failed to delete", type: "error" }),
  });

  const filteredMessages = useMemo(() => {
    return messages.filter((m) => {
      const matchesSearch =
        !search ||
        m.author_name.toLowerCase().includes(search.toLowerCase()) ||
        m.message.toLowerCase().includes(search.toLowerCase());
      const matchesFilter =
        filter === "all" ||
        (filter === "pending" && !m.is_approved) ||
        (filter === "approved" && m.is_approved);
      return matchesSearch && matchesFilter;
    });
  }, [messages, search, filter]);

  const stats = useMemo(() => ({
    total: messages.length,
    pending: messages.filter((m) => !m.is_approved).length,
    approved: messages.filter((m) => m.is_approved).length,
  }), [messages]);

  const handleDelete = (id: string) => {
    if (confirm("Delete this message? This cannot be undone.")) {
      deleteMutation.mutate(id);
    }
  };

  if (weddingLoading || messagesLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full p-8">
          <div className="font-ui text-sm text-gray-400">Loading messages...</div>
        </div>
      </AdminLayout>
    );
  }

  if (weddingError || !wedding) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full p-8">
          <p className="font-ui text-sm text-red-500">Unable to load wedding data</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6 md:p-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="font-heading text-2xl text-[var(--color-text)]">Messages</h1>
            <p className="font-ui text-sm text-[var(--color-text-muted)]">
              {stats.total} total · {stats.pending} pending · {stats.approved} approved
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <Card className="p-4 text-center">
              <MessageSquare size={20} className="text-[var(--color-primary)] mx-auto mb-2" />
              <div className="font-heading text-2xl text-[var(--color-text)]">{stats.total}</div>
              <div className="font-ui text-xs uppercase tracking-wider-luxe text-[var(--color-text-muted)]">Total</div>
            </Card>
            <Card className="p-4 text-center">
              <Clock size={20} className="text-[var(--color-warning)] mx-auto mb-2" />
              <div className="font-heading text-2xl text-[var(--color-text)]">{stats.pending}</div>
              <div className="font-ui text-xs uppercase tracking-wider-luxe text-[var(--color-text-muted)]">Pending</div>
            </Card>
            <Card className="p-4 text-center">
              <CheckCircle2 size={20} className="text-[var(--color-success)] mx-auto mb-2" />
              <div className="font-heading text-2xl text-[var(--color-text)]">{stats.approved}</div>
              <div className="font-ui text-xs uppercase tracking-wider-luxe text-[var(--color-text-muted)]">Approved</div>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 mb-6 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search messages..."
                className="pl-10"
              />
            </div>
            <div className="inline-flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              {([
                { key: "all", label: "All" },
                { key: "pending", label: "Pending" },
                { key: "approved", label: "Approved" },
              ] as const).map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`px-4 py-1.5 rounded-md text-xs font-ui font-medium transition-all ${
                    filter === f.key ? "bg-white shadow-sm text-[var(--color-primary)]" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Messages */}
          {filteredMessages.length === 0 ? (
            <Card className="p-0">
              <EmptyState
                icon={<MessageSquare size={32} />}
                title={search || filter !== "all" ? "No messages found" : "No messages yet"}
                description={search || filter !== "all" ? "Try adjusting your filters" : "Guest messages will appear here for approval."}
              />
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredMessages.map((msg) => (
                <Card key={msg.id} className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center flex-shrink-0">
                        <span className="font-heading text-sm text-[var(--color-primary)]">
                          {msg.author_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-heading text-base text-[var(--color-text)]">{msg.author_name}</h3>
                        <p className="font-ui text-xs text-[var(--color-text-muted)]">{formatDate(msg.created_at)}</p>
                      </div>
                    </div>
                    <Badge variant={msg.is_approved ? "success" : "warning"}>
                      {msg.is_approved ? "Approved" : "Pending"}
                    </Badge>
                  </div>
                  <p className="font-body text-sm text-[var(--color-text)] leading-relaxed mb-4 whitespace-pre-line">
                    {msg.message}
                  </p>
                  <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                    {msg.is_approved ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => unapproveMutation.mutate(msg.id)}
                        disabled={unapproveMutation.isPending}
                      >
                        Unapprove
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => approveMutation.mutate(msg.id)}
                        disabled={approveMutation.isPending}
                      >
                        <Check size={14} className="mr-1.5" />
                        Approve
                      </Button>
                    )}
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(msg.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 size={14} className="mr-1.5" />
                      Delete
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
