import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useOutletContext } from "react-router-dom";
import { supabase, type UserEvent, type EventMessage } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { RichTextEditor } from "../../components/ui/RichTextEditor";
import { LoadingSpinner, ErrorState, Modal } from "../../components/ui";
import { formatDateTime } from "../../lib/utils";

interface EventContextValue { event: UserEvent; eventId: string; }

interface WishesContent {
  heading?: string;
  subheading?: string;
  placeholder?: string;
  submitLabel?: string;
}

export function WishesPage() {
  const { event, eventId } = useOutletContext<EventContextValue>();
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<"messages" | "settings">("messages");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Page content settings
  const [wishesContent, setWishesContent] = useState<WishesContent>(() => {
    const raw = (event.content as Record<string, unknown> | null) ?? {};
    const w = (raw.wishes as WishesContent | undefined) ?? {};
    return w;
  });
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const { data: messages, isLoading, isError, error } = useQuery({
    queryKey: ["event-messages", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_messages")
        .select("*, event_guests(full_name, username)")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as (EventMessage & { event_guests: { full_name: string | null; username: string } | null })[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("event_messages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-messages", eventId] });
      setDeleteTarget(null);
    },
  });

  const saveSettings = async () => {
    setSaving(true);
    setSaveSuccess(false);
    const existing = (event.content as Record<string, unknown> | null) ?? {};
    const updated = { ...existing, wishes: wishesContent };
    const { error } = await supabase
      .from("user_events")
      .update({ draft_content: updated })
      .eq("id", eventId);
    setSaving(false);
    if (!error) {
      setSaveSuccess(true);
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-dash-text">Wishes</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTab("messages")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${tab === "messages" ? "bg-dash-primary/10 text-dash-primary" : "text-dash-muted hover:text-dash-text"}`}
          >
            Messages {messages ? `(${messages.length})` : ""}
          </button>
          <button
            onClick={() => setTab("settings")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${tab === "settings" ? "bg-dash-primary/10 text-dash-primary" : "text-dash-muted hover:text-dash-text"}`}
          >
            Page Settings
          </button>
        </div>
      </div>

      {tab === "messages" && (
        <>
          {isLoading ? (
            <div className="flex justify-center py-12"><LoadingSpinner /></div>
          ) : isError ? (
            <ErrorState title="Failed to load wishes" message={error instanceof Error ? error.message : "Unknown error"} />
          ) : !messages || messages.length === 0 ? (
            <div className="rounded-lg border border-dash-border bg-dash-surface p-8 text-center">
              <p className="text-dash-muted">No wishes submitted yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg) => {
                const guestName = msg.event_guests?.full_name || msg.event_guests?.username || "Guest";
                return (
                  <div key={msg.id} className="rounded-lg border border-dash-border bg-dash-surface p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <span className="text-sm font-medium text-dash-text">{guestName}</span>
                          <span className="text-xs text-dash-muted">{formatDateTime(msg.created_at)}</span>
                        </div>
                        <p className="text-sm text-dash-muted whitespace-pre-wrap">{msg.message}</p>
                      </div>
                      <button
                        onClick={() => setDeleteTarget(msg.id)}
                        className="shrink-0 rounded p-1 text-dash-muted transition-colors hover:bg-red-50 hover:text-dash-danger"
                        title="Delete wish"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {tab === "settings" && (
        <div className="space-y-4 rounded-lg border border-dash-border bg-dash-surface p-4">
          <h3 className="text-sm font-semibold text-dash-text">Wishes Page Content</h3>
          <div>
            <label className="mb-1 block text-xs font-medium text-dash-muted">Page Heading</label>
            <input
              type="text"
              value={wishesContent.heading ?? ""}
              onChange={(e) => setWishesContent((p) => ({ ...p, heading: e.target.value }))}
              placeholder="Wishes & Messages"
              className="w-full rounded-lg border border-dash-border bg-dash-bg px-3 py-2 text-sm text-dash-text focus:border-dash-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-dash-muted">Subheading</label>
            <input
              type="text"
              value={wishesContent.subheading ?? ""}
              onChange={(e) => setWishesContent((p) => ({ ...p, subheading: e.target.value }))}
              placeholder="Leave us a message"
              className="w-full rounded-lg border border-dash-border bg-dash-bg px-3 py-2 text-sm text-dash-text focus:border-dash-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-dash-muted">Input Placeholder</label>
            <input
              type="text"
              value={wishesContent.placeholder ?? ""}
              onChange={(e) => setWishesContent((p) => ({ ...p, placeholder: e.target.value }))}
              placeholder="Write your message here..."
              className="w-full rounded-lg border border-dash-border bg-dash-bg px-3 py-2 text-sm text-dash-text focus:border-dash-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-dash-muted">Submit Button Label</label>
            <input
              type="text"
              value={wishesContent.submitLabel ?? ""}
              onChange={(e) => setWishesContent((p) => ({ ...p, submitLabel: e.target.value }))}
              placeholder="Send Wish"
              className="w-full rounded-lg border border-dash-border bg-dash-bg px-3 py-2 text-sm text-dash-text focus:border-dash-primary focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-3 pt-2">
            <Button size="sm" onClick={saveSettings} loading={saving}>Save</Button>
            {saveSuccess && <span className="text-sm text-green-600">Saved!</span>}
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Wish">
        <div className="space-y-4">
          <p className="text-sm text-dash-muted">Are you sure you want to delete this wish? This cannot be undone.</p>
          {deleteMutation.isError && (
            <p className="text-sm text-dash-danger">
              {deleteMutation.error instanceof Error ? deleteMutation.error.message : "Delete failed"}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button
              variant="danger"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
              loading={deleteMutation.isPending}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
