import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MessageSquare,
  Check,
  Trash2,
  CheckCircle2,
  Clock,
  Inbox,
  Quote,
} from "lucide-react";
import { supabase, type Wedding, type GuestbookEntry } from "../../lib/supabase";
import { AdminLayout } from "./admin-layout";
import { Button } from "../../components/ui/Button";
import { Card, Badge, EmptyState, Toast } from "../../components/ui/index";
import { formatDate, cn } from "../../lib/utils";
import { useLang } from "../../lib/lang-context";

export function MessagesPage() {
  const queryClient = useQueryClient();
  const { lang } = useLang();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("all");

  const { data: wedding, isLoading: weddingLoading } = useQuery({
    queryKey: ["wedding"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("weddings")
        .select("*")
        .eq("created_by", user.user.id)
        .single();
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
      setToast({ message: "Message approved!", type: "success" });
    },
    onError: () => setToast({ message: "Failed to approve message", type: "error" }),
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
    onError: () => setToast({ message: "Failed to unapprove message", type: "error" }),
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
    onError: () => setToast({ message: "Failed to delete message", type: "error" }),
  });

  const stats = useMemo(() => {
    return {
      total: messages.length,
      approved: messages.filter((m) => m.is_approved).length,
      pending: messages.filter((m) => !m.is_approved).length,
    };
  }, [messages]);

  const filteredMessages = useMemo(() => {
    if (filter === "all") return messages;
    if (filter === "pending") return messages.filter((m) => !m.is_approved);
    if (filter === "approved") return messages.filter((m) => m.is_approved);
    return messages;
  }, [messages, filter]);

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this message? This cannot be undone.")) {
      deleteMutation.mutate(id);
    }
  };

  const isLoading = weddingLoading || messagesLoading;

  if (isLoading || !wedding) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <p className="font-ui text-sm text-[var(--color-text-muted)]">Loading messages...</p>
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
            <p className="font-ui text-xs uppercase tracking-wider-luxe text-[var(--color-primary)] mb-2">
              Messages
            </p>
            <h1 className="font-heading text-3xl text-[var(--color-text)]">Guest Messages</h1>
            <p className="font-ui text-sm text-[var(--color-text-muted)] mt-1">
              Review and approve well wishes from your guests.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <Card className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                <Inbox size={20} />
              </div>
              <div>
                <p className="font-heading text-2xl text-[var(--color-text)]">{stats.total}</p>
                <p className="font-ui text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
                  Total
                </p>
              </div>
            </Card>
            <Card className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-[var(--color-success)]/15 text-[var(--color-success)]">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <p className="font-heading text-2xl text-[var(--color-text)]">{stats.approved}</p>
                <p className="font-ui text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
                  Approved
                </p>
              </div>
            </Card>
            <Card className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-[var(--color-warning)]/15 text-[var(--color-warning)]">
                <Clock size={20} />
              </div>
              <div>
                <p className="font-heading text-2xl text-[var(--color-text)]">{stats.pending}</p>
                <p className="font-ui text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
                  Pending
                </p>
              </div>
            </Card>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 mb-4">
            {([
              { key: "all", label: "All", count: stats.total },
              { key: "pending", label: "Pending", count: stats.pending },
              { key: "approved", label: "Approved", count: stats.approved },
            ] as const).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={cn(
                  "px-4 py-2 rounded-lg font-ui text-xs uppercase tracking-wider-luxe transition-all",
                  filter === tab.key
                    ? "bg-[var(--color-primary)] text-white"
                    : "bg-[var(--color-bg-light)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                )}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {/* Messages */}
          {filteredMessages.length === 0 ? (
            <EmptyState
              icon={<MessageSquare size={32} />}
              title={filter === "pending" ? "No pending messages" : filter === "approved" ? "No approved messages" : "No messages yet"}
              description={
                filter === "pending"
                  ? "All messages have been reviewed."
                  : filter === "approved"
                  ? "Approve messages to see them here."
                  : "Guest messages will appear here once submitted."
              }
            />
          ) : (
            <div className="space-y-3">
              {filteredMessages.map((msg) => (
                <Card key={msg.id} className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center flex-shrink-0">
                        <Quote size={16} className="text-[var(--color-primary)]" />
                      </div>
                      <div>
                        <p className="font-ui text-sm font-medium text-[var(--color-text)]">
                          {msg.author_name}
                        </p>
                        <p className="font-ui text-xs text-[var(--color-text-muted)]">
                          {formatDate(msg.created_at, lang)}
                        </p>
                      </div>
                    </div>
                    {msg.is_approved ? (
                      <Badge variant="success">Approved</Badge>
                    ) : (
                      <Badge variant="warning">Pending</Badge>
                    )}
                  </div>

                  <p className="font-body text-sm text-[var(--color-text)] leading-relaxed mb-4 pl-13">
                    {msg.message}
                  </p>

                  <div className="flex items-center gap-2 pt-3 border-t border-[var(--color-border)]/10">
                    {msg.is_approved ? (
                      <Button
                        variant="ghost"
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
                        <Check size={14} className="mr-1.5" /> Approve
                      </Button>
                    )}
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(msg.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 size={14} className="mr-1.5" /> Delete
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
