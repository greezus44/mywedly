import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventMessage } from "../../lib/supabase";
import type { EventContent } from "../../components/preview/PreviewRenderers";
import { Button } from "../../components/ui/Button";
import { Card, LoadingSpinner, ErrorState, EmptyState } from "../../components/ui";
import { RichTextEditor } from "../../components/ui/RichTextEditor";
import { RichTextContent } from "../../lib/sanitize";
import { formatDateTime } from "../../lib/utils";

interface EventContextValue { event: UserEvent; eventId: string; }

export function WishesPage() {
  const { event, eventId } = useOutletContext<EventContextValue>();
  const queryClient = useQueryClient();

  const { data: messages, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["event-messages", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_messages")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as EventMessage[];
    },
  });

  const { data: guests } = useQuery({
    queryKey: ["event-guests", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_guests")
        .select("id, name")
        .eq("event_id", eventId);
      if (error) throw error;
      return (data ?? []) as Array<{ id: string; name: string }>;
    },
  });

  const [pageContent, setPageContent] = useState<string>("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const content = (event.draft_content ?? event.content ?? {}) as EventContent;
    // Look for a "wishes" section or use content.wishesPage
    const wishesHtml = (content as Record<string, unknown>).wishesPage as string | undefined;
    setPageContent(wishesHtml ?? "");
  }, [event]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("event_messages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["event-messages", eventId] }),
  });

  const saveContentMutation = useMutation({
    mutationFn: async () => {
      const content = (event.draft_content ?? event.content ?? {}) as EventContent;
      const updated = { ...content, wishesPage: pageContent } as Record<string, unknown>;
      const { error } = await supabase
        .from("user_events")
        .update({ draft_content: updated })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const guestName = (guestId: string) => guests?.find((g) => g.id === guestId)?.name ?? "Unknown Guest";

  if (isLoading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>;
  if (isError) return <ErrorState title="Failed to load wishes" message={error instanceof Error ? error.message : "Unknown error"} onRetry={() => refetch()} />;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-dash-text">Wishes</h2>

      {/* Wishes page content editor */}
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-dash-text">Wishes Page Content</h3>
          <div className="flex items-center gap-3">
            {saved && <span className="text-sm text-green-600">Saved!</span>}
            <Button size="sm" onClick={() => saveContentMutation.mutate()} loading={saveContentMutation.isPending}>Save</Button>
          </div>
        </div>
        <RichTextEditor
          value={pageContent}
          onChange={setPageContent}
          placeholder="Add a message that appears above the wishes..."
        />
      </Card>

      {/* Wishes list */}
      <Card>
        <h3 className="mb-4 text-sm font-semibold text-dash-text">Guest Wishes ({messages?.length ?? 0})</h3>
        {!messages || messages.length === 0 ? (
          <EmptyState title="No wishes yet" description="Wishes from guests will appear here." />
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <div key={msg.id} className="rounded border border-dash-border p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-dash-text">{guestName(msg.guest_id)}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-dash-muted">{formatDateTime(msg.created_at)}</span>
                    <button
                      onClick={() => deleteMutation.mutate(msg.id)}
                      className="text-xs text-dash-danger hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <RichTextContent html={msg.message} className="text-sm text-dash-text" />
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
