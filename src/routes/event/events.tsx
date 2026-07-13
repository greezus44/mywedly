import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useOutletContext } from "react-router-dom";
import { Plus, Trash2, Loader2, Calendar, Clock, MapPin } from "lucide-react";
import { supabase, type UserEvent, type SubEvent } from "../../lib/supabase";
import { formatDateShort, formatTime12 } from "../../lib/utils";
import {
  Button,
  Card,
  Badge,
  Modal,
  FormField,
  Input,
  Textarea,
  EmptyState,
  ErrorState,
  LoadingSpinner,
  Toast,
} from "../../components/ui";
import { DatePicker, TimePicker } from "../../components/ui";

export default function EventsPage() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [venue, setVenue] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [dressCode, setDressCode] = useState("");

  const { data: subEvents, isLoading, error, refetch } = useQuery<SubEvent[]>({
    queryKey: ["sub-events", event.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sub_events")
        .select("*")
        .eq("parent_eventId", event.id)
        .order("order_index", { ascending: true });

      if (error) throw error;
      return (data || []) as SubEvent[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      const maxOrder = subEvents?.length || 0;
      const { data, error } = await supabase
        .from("sub_events")
        .insert({
          parent_eventId: event.id,
          name,
          date,
          time,
          venue: venue || null,
          address: address || null,
          description: description || null,
          dress_code: dressCode || null,
          rsvp_enabled: false,
          order_index: maxOrder,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-events", event.id] });
      setShowAdd(false);
      resetForm();
      setToast({ message: "Sub-event added", type: "success" });
    },
    onError: (err: Error) => {
      setToast({ message: err.message, type: "error" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sub_events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-events", event.id] });
      setToast({ message: "Sub-event deleted", type: "success" });
    },
    onError: (err: Error) => {
      setToast({ message: err.message, type: "error" });
    },
  });

  const resetForm = () => {
    setName("");
    setDate(null);
    setTime(null);
    setVenue("");
    setAddress("");
    setDescription("");
    setDressCode("");
  };

  const handleAdd = () => {
    if (!name.trim()) {
      setToast({ message: "Please enter a name", type: "error" });
      return;
    }
    addMutation.mutate();
  };

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Sub-Events</h1>
          <p className="mt-1 text-sm text-gray-500">
            Add individual events within your main event (e.g. ceremony, reception)
          </p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4" />
          Add Event
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner className="h-8 w-8" />
        </div>
      ) : error ? (
        <ErrorState
          message={error instanceof Error ? error.message : "Failed to load events"}
          onRetry={() => refetch()}
        />
      ) : !subEvents || subEvents.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Calendar className="h-12 w-12" />}
            title="No sub-events yet"
            description="Add events like ceremony, reception, or after-party."
            action={
              <Button onClick={() => setShowAdd(true)}>
                <Plus className="h-4 w-4" />
                Add Event
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {subEvents.map((sub) => (
            <Card key={sub.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-gray-900">
                    {sub.name || "Untitled"}
                  </h3>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                    {sub.date && (
                      <Badge>
                        <Calendar className="h-3 w-3" />
                        {formatDateShort(sub.date)}
                      </Badge>
                    )}
                    {sub.time && (
                      <Badge>
                        <Clock className="h-3 w-3" />
                        {formatTime12(sub.time)}
                      </Badge>
                    )}
                    {sub.venue && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {sub.venue}
                      </span>
                    )}
                  </div>
                  {sub.description && (
                    <p className="mt-2 text-sm text-gray-600">{sub.description}</p>
                  )}
                  {sub.dress_code && (
                    <p className="mt-1 text-xs text-gray-400">
                      Dress code: {sub.dress_code}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteMutation.mutate(sub.id)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Modal */}
      <Modal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        title="Add Sub-Event"
      >
        <div className="flex flex-col gap-4">
          <FormField label="Name">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ceremony"
              autoFocus
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <DatePicker
              value={date}
              onChange={(d) => setDate(d || null)}
              label="Date"
            />
            <TimePicker
              value={time}
              onChange={(t) => setTime(t || null)}
              label="Time"
            />
          </div>

          <FormField label="Venue">
            <Input
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="Venue name"
            />
          </FormField>

          <FormField label="Address">
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Full address"
            />
          </FormField>

          <FormField label="Description">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Additional details"
              rows={2}
            />
          </FormField>

          <FormField label="Dress Code">
            <Input
              value={dressCode}
              onChange={(e) => setDressCode(e.target.value)}
              placeholder="e.g. Black tie"
            />
          </FormField>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowAdd(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              disabled={addMutation.isPending || !name.trim()}
            >
              {addMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Adding…
                </>
              ) : (
                "Add Event"
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
