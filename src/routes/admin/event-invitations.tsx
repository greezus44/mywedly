import { useState, useMemo, useCallback, useEffect } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Mail, Users, Calendar, Link2, Plus, Trash2, Check } from "lucide-react";
import { supabase, Wedding, WeddingEvent, Guest } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Card, Badge, FormField, Toggle, EmptyState, Toast, ErrorState, Skeleton, Modal } from "../../components/ui/index";
import { formatDate } from "../../lib/utils";

type OutletContext = { wedding: Wedding | null };

interface EventInvitation {
  event_id: string;
  group_name: string;
  invited: boolean;
}

export default function EventInvitationsPage() {
  const { wedding } = useOutletContext<OutletContext>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [invitations, setInvitations] = useState<Record<string, string[]>>({});
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [saving, setSaving] = useState(false);

  const { data: events, isLoading: eventsLoading, isError: eventsError, refetch: refetchEvents } = useQuery<WeddingEvent[]>({
    queryKey: ["events", wedding?.id],
    queryFn: async () => {
      if (!wedding) return [];
      const { data, error } = await supabase.from("events").select("*").eq("wedding_id", wedding.id).order("order_index", { ascending: true });
      if (error) throw error;
      return data as WeddingEvent[];
    },
    enabled: !!wedding,
  });

  const { data: guests, isLoading: guestsLoading } = useQuery<Guest[]>({
    queryKey: ["guests", wedding?.id],
    queryFn: async () => {
      if (!wedding) return [];
      const { data, error } = await supabase.from("guests").select("*").eq("wedding_id", wedding.id);
      if (error) throw error;
      return data as Guest[];
    },
    enabled: !!wedding,
  });

  const groupNames = useMemo(() => {
    if (!guests) return [];
    const set = new Set<string>();
    guests.forEach((g) => { if (g.group_name) set.add(g.group_name); });
    return Array.from(set);
  }, [guests]);

  const toggleInvitation = useCallback((eventId: string, groupName: string) => {
    setInvitations((prev) => {
      const current = prev[eventId] || [];
      const updated = current.includes(groupName)
        ? current.filter((g) => g !== groupName)
        : [...current, groupName];
      return { ...prev, [eventId]: updated };
    });
  }, []);

  const handleSave = useCallback(async () => {
    if (!wedding) return;
    setSaving(true);
    try {
      // Store invitations in draft_content as a custom field
      const content = wedding.draft_content || wedding.content || {} as any;
      const updatedContent = { ...content, event_invitations: invitations } as any;
      const { error } = await supabase.from("weddings").update({ draft_content: updatedContent }).eq("id", wedding.id);
      if (error) throw error;
      queryClient.setQueryData(["wedding"], (old: Wedding | null) => old ? { ...old, draft_content: updatedContent } : old);
      setToast({ msg: "Invitations saved!", type: "success" });
      setTimeout(() => setToast(null), 3000);
    } catch (err: any) {
      setToast({ msg: "Failed: " + err.message, type: "error" });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setSaving(false);
    }
  }, [wedding, invitations, queryClient]);

  useEffect(() => {
    if (wedding) {
      const content = wedding.draft_content || wedding.content;
      if (content && (content as any).event_invitations) {
        setInvitations((content as any).event_invitations);
      }
    }
  }, [wedding?.id]);

  if (!wedding) return <ErrorState message="Could not load wedding data" onRetry={() => navigate("/admin")} />;
  if (eventsError) return <ErrorState message="Failed to load events" onRetry={() => refetchEvents()} />;

  const isLoading = eventsLoading || guestsLoading;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Event Invitations</h1>
          <p className="text-sm text-gray-500">Link events to guest groups</p>
        </div>
        <Button onClick={handleSave} loading={saving}>Save Changes</Button>
      </div>

      {groupNames.length === 0 && !isLoading ? (
        <Card className="p-6">
          <EmptyState icon={<Users className="w-10 h-10" />} title="No guest groups found" description="Create guest groups first to manage event invitations" action={<Button size="sm" onClick={() => navigate("/admin/guests")}><Users className="w-4 h-4" /> Go to Guests</Button>} />
        </Card>
      ) : isLoading ? (
        <div className="space-y-4"><Skeleton className="h-32" /><Skeleton className="h-32" /></div>
      ) : events && events.length > 0 ? (
        <div className="space-y-4">
          {events.map((event) => (
            <Card key={event.id} className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600"><Calendar className="w-5 h-5" /></div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-900">{event.title}</h3>
                  <p className="text-xs text-gray-500">{formatDate(event.event_date)} {event.venue && `• ${event.venue}`}</p>
                </div>
                <Badge color="blue">{invitations[event.id]?.length || 0} groups</Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                {groupNames.map((group) => {
                  const isInvited = invitations[event.id]?.includes(group);
                  return (
                    <button
                      key={group}
                      onClick={() => toggleInvitation(event.id, group)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isInvited ? "bg-green-100 text-green-700 border border-green-200" : "bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100"}`}
                    >
                      {isInvited ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                      {group}
                    </button>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-6">
          <EmptyState icon={<Calendar className="w-10 h-10" />} title="No events found" description="Create events first to manage invitations" action={<Button size="sm" onClick={() => navigate("/admin/events")}><Calendar className="w-4 h-4" /> Go to Events</Button>} />
        </Card>
      )}

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
