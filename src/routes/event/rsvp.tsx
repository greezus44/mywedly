import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, Check, X, Clock, Save } from "lucide-react";
import { supabase, type UserEvent, type EventRsvp } from "../../lib/supabase";
import { cn, formatDate, formatTime, isRsvpClosed, getRsvpStatus, formatDeadline, toDatetimeLocal, fromDatetimeLocal } from "../../lib/utils";
import { Button } from "../../components/ui/Button";
import { Card, Badge, EmptyState, FormField, Skeleton, ErrorState, Toast } from "../../components/ui";
import { Input } from "../../components/ui/Input";

function RsvpPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const queryClient = useQueryClient();
  const [deadlineInput, setDeadlineInput] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const { data: event, isLoading: eventLoading } = useQuery<UserEvent>({
    queryKey: ["event", eventId],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_events").select("*").eq("id", eventId!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
  });

  const { data: rsvps, isLoading: rsvpsLoading, isError, refetch } = useQuery<EventRsvp[]>({
    queryKey: ["rsvps", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_rsvps")
        .select("*")
        .eq("event_id", eventId!)
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
  });

  useEffect(() => {
    setDeadlineInput(toDatetimeLocal(event?.rsvp_deadline || null));
  }, [event]);

  const deadlineMutation = useMutation({
    mutationFn: async (deadline: string | null) => {
      const { data, error } = await supabase
        .from("user_events")
        .update({ rsvp_deadline: deadline, updated_at: new Date().toISOString() })
        .eq("id", eventId!)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["event", eventId], data);
      setToast({ message: "RSVP deadline updated", type: "success" });
    },
    onError: () => setToast({ message: "Failed to update deadline", type: "error" }),
  });

  const handleDeadlineSave = useCallback(() => {
    const iso = deadlineInput ? fromDatetimeLocal(deadlineInput) : null;
    deadlineMutation.mutate(iso);
  }, [deadlineInput, deadlineMutation]);

  const isLoading = eventLoading || rsvpsLoading;

  const stats = {
    attending: (rsvps || []).filter((r) => r.status === "attending").length,
    declined: (rsvps || []).filter((r) => r.status === "declined").length,
    pending: (rsvps || []).filter((r) => r.status === "pending").length,
    total: rsvps?.length || 0,
  };

  const rsvpStatus = getRsvpStatus(event?.rsvp_deadline || null);
  const closed = isRsvpClosed(event?.rsvp_deadline || null);

  if (isLoading) {
    return (
      <div className="p-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !event) {
    return <ErrorState message="Failed to load RSVPs" onRetry={refetch} />;
  }

  const statusBadgeVariant = (status: string): "default" | "success" | "warning" | "error" => {
    switch (status) {
      case "attending": return "success";
      case "declined": return "error";
      default: return "warning";
    }
  };

  return (
    <div>
      <div className="px-6 lg:px-8 py-6 border-b border-onyx/10">
        <h1 className="font-heading text-3xl text-onyx">RSVP Management</h1>
        <p className="mt-1 text-sm text-onyx/50">Track responses and manage your RSVP deadline</p>
      </div>

      <div className="p-6 lg:p-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium uppercase tracking-wider text-onyx/50">Total</span>
              <span className="text-2xl text-onyx/20">∑</span>
            </div>
            <p className="font-heading text-3xl text-onyx">{stats.total}</p>
          </Card>
          <Card className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium uppercase tracking-wider text-onyx/50">Attending</span>
              <Check className="w-5 h-5 text-green-600/40" />
            </div>
            <p className="font-heading text-3xl text-green-700">{stats.attending}</p>
          </Card>
          <Card className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium uppercase tracking-wider text-onyx/50">Declined</span>
              <X className="w-5 h-5 text-red-600/40" />
            </div>
            <p className="font-heading text-3xl text-red-700">{stats.declined}</p>
          </Card>
          <Card className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium uppercase tracking-wider text-onyx/50">Pending</span>
              <Clock className="w-5 h-5 text-amber-600/40" />
            </div>
            <p className="font-heading text-3xl text-amber-700">{stats.pending}</p>
          </Card>
        </div>

        {/* Deadline */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <CalendarClock className="w-5 h-5 text-onyx/50" />
            <h2 className="font-heading text-xl text-onyx">RSVP Deadline</h2>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="flex-1">
              <FormField label="Deadline Date & Time">
                <Input
                  type="datetime-local"
                  value={deadlineInput}
                  onChange={(e) => setDeadlineInput(e.target.value)}
                />
              </FormField>
            </div>
            <Button onClick={handleDeadlineSave} loading={deadlineMutation.isPending}>
              <Save className="w-4 h-4" /> Save Deadline
            </Button>
          </div>
          <div className="mt-4 flex items-center gap-3">
            {event.rsvp_deadline ? (
              <>
                <Badge variant={closed ? "error" : rsvpStatus === "closing-soon" ? "warning" : "success"}>
                  {closed ? "Closed" : rsvpStatus === "closing-soon" ? "Closing Soon" : "Open"}
                </Badge>
                <p className="text-sm text-onyx/50">
                  {formatDeadline(event.rsvp_deadline)}
                </p>
              </>
            ) : (
              <p className="text-sm text-onyx/40">No deadline set — RSVPs remain open indefinitely</p>
            )}
          </div>
        </Card>

        {/* RSVP Table */}
        {rsvps && rsvps.length > 0 ? (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-onyx/10">
                    <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-onyx/60">Guest</th>
                    <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-onyx/60">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-onyx/60">+1s</th>
                    <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-onyx/60">Dietary</th>
                    <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-onyx/60">Message</th>
                    <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-onyx/60">Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {rsvps.map((rsvp) => (
                    <tr key={rsvp.id} className="border-b border-onyx/5 hover:bg-cream/20 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-onyx">{rsvp.guest_name}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={statusBadgeVariant(rsvp.status)}>{rsvp.status}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-onyx/70">{rsvp.plus_ones}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-onyx/70 max-w-[160px] truncate">{rsvp.dietary || "—"}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-onyx/70 max-w-[200px] truncate">{rsvp.message || "—"}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-onyx/50">
                          {formatDate(rsvp.submitted_at)}
                        </p>
                        <p className="text-xs text-onyx/40">
                          {formatTime(rsvp.submitted_at.split("T")[1] || null)}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          <EmptyState
            icon={<Clock className="w-12 h-12" />}
            title="No RSVPs yet"
            description="Responses will appear here once guests start replying"
          />
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default RsvpPage;
