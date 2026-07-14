import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventMessage } from "../../lib/supabase";
import { Button, Card, LoadingSpinner, ErrorState, EmptyState, Modal } from "../../components/ui";
import { RichTextEditor } from "../../components/ui/RichTextEditor";
import { sanitizeHtml } from "../../lib/sanitize";
import { formatDateTime } from "../../lib/utils";

interface EventContextValue { event: UserEvent; eventId: string; }

export function WishesPage() {
  const { event, eventId } = useOutletContext<EventContextValue>();
  const queryClient = useQueryClient();
  const [showEditContent, setShowEditContent] = useState(false);
  const [pageContent, setPageContent] = useState<string>("");
  const [savingContent, setSavingContent] = useState(false);

  const { data: messages, isLoading, isError, error } = useQuery({
    queryKey: ["event-messages", eventId],
    queryFn: async () => { const { data, error } = await supabase.from("event_messages").select("*, event_guests(name)").eq("event_id", eventId).order("created_at", { ascending: false }); if (error) throw error; return data as (EventMessage & { event_guests: { name: string | null } | null })[]; },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("event_messages").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["event-messages", eventId] }),
  });

  const content = (event.draft_content ?? event.content ?? {}) as Record<string, unknown>;
  const wishesContent = (content.wishesPageContent as string) ?? "";

  const openEditContent = () => { setPageContent(wishesContent); setShowEditContent(true); };

  const saveContent = async () => {
    setSavingContent(true);
    try {
      const newContent = { ...content, wishesPageContent: pageContent };
      const { error } = await supabase.from("user_events").update({ draft_content: newContent }).eq("id", eventId);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["event", eventId] }); setShowEditContent(false);
    } catch { /* ignore */ }
    finally { setSavingContent(false); }
  };

  if (isLoading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>;
  if (isError) return <ErrorState title="Failed to load wishes" message={error instanceof Error ? error.message : "Unknown error"} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-dash-text">Wishes</h2>
        <Button size="sm" variant="secondary" onClick={openEditContent}>Edit Page Content</Button>
      </div>
      {!messages || messages.length === 0 ? (
        <EmptyState title="No wishes yet" description="Wishes from your guests will appear here." />
      ) : (
        <div className="space-y-3">
          {messages.map((msg) => (
            <Card key={msg.id}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-dash-text">{msg.event_guests?.name ?? "Guest"}</p>
                  <p className="mt-1 text-sm text-dash-text">{msg.message}</p>
                  <p className="mt-1 text-xs text-dash-muted">{formatDateTime(msg.created_at)}</p>
                </div>
                <button onClick={() => deleteMutation.mutate(msg.id)} className="text-xs text-dash-danger hover:underline">Delete</button>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Modal open={showEditContent} onClose={() => setShowEditContent(false)} title="Edit Wishes Page Content">
        <div className="space-y-4">
          <RichTextEditor value={pageContent} onChange={setPageContent} placeholder="Write a message for your guests..." />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowEditContent(false)}>Cancel</Button>
            <Button onClick={saveContent} loading={savingContent}>Save</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
