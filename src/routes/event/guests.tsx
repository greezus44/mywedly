import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useOutletContext } from "react-router-dom";
import { Plus, Trash2, Loader2, Search, Users, Mail, Phone } from "lucide-react";
import { supabase, type UserEvent, type EventGuest } from "../../lib/supabase";
import {
  Button,
  Card,
  Badge,
  Modal,
  FormField,
  Input,
  EmptyState,
  ErrorState,
  LoadingSpinner,
  Toast,
} from "../../components/ui";

const RSVP_BADGE_VARIANT: Record<string, "success" | "error" | "warning" | "default"> = {
  attending: "success",
  declined: "error",
  pending: "warning",
};

export default function GuestsPage() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [groupName, setGroupName] = useState("");
  const [side, setSide] = useState("");

  const { data: guests, isLoading, error, refetch } = useQuery<EventGuest[]>({
    queryKey: ["event-guests", event.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_guests")
        .select("*")
        .eq("event_id", event.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as EventGuest[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("event_guests")
        .insert({
          event_id: event.id,
          name,
          email: email || null,
          phone: phone || null,
          group_name: groupName || null,
          side: side || null,
          rsvp_status: "pending",
          plus_ones: 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-guests", event.id] });
      setShowAdd(false);
      resetForm();
      setToast({ message: "Guest added", type: "success" });
    },
    onError: (err: Error) => {
      setToast({ message: err.message, type: "error" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("event_guests").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-guests", event.id] });
      setToast({ message: "Guest removed", type: "success" });
    },
    onError: (err: Error) => {
      setToast({ message: err.message, type: "error" });
    },
  });

  const resetForm = () => {
    setName("");
    setEmail("");
    setPhone("");
    setGroupName("");
    setSide("");
  };

  const handleAdd = () => {
    if (!name.trim()) {
      setToast({ message: "Please enter a name", type: "error" });
      return;
    }
    addMutation.mutate();
  };

  const filteredGuests = (guests || []).filter((g) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      g.name?.toLowerCase().includes(q) ||
      g.email?.toLowerCase().includes(q) ||
      g.phone?.toLowerCase().includes(q) ||
      g.group_name?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Guests</h1>
          <p className="mt-1 text-sm text-gray-500">
            {guests?.length || 0} total guest{(guests?.length || 0) !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4" />
          Add Guest
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search guests by name, email, phone…"
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner className="h-8 w-8" />
        </div>
      ) : error ? (
        <ErrorState
          message={error instanceof Error ? error.message : "Failed to load guests"}
          onRetry={() => refetch()}
        />
      ) : !filteredGuests || filteredGuests.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Users className="h-12 w-12" />}
            title={search ? "No guests found" : "No guests yet"}
            description={search ? "Try a different search term." : "Add guests to your event."}
            action={
              !search ? (
                <Button onClick={() => setShowAdd(true)}>
                  <Plus className="h-4 w-4" />
                  Add Guest
                </Button>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {filteredGuests.map((guest) => (
            <Card key={guest.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-gray-900">
                      {guest.name || "Unknown"}
                    </h3>
                    <Badge variant={RSVP_BADGE_VARIANT[guest.rsvp_status] || "default"}>
                      {guest.rsvp_status}
                    </Badge>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                    {guest.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {guest.email}
                      </span>
                    )}
                    {guest.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {guest.phone}
                      </span>
                    )}
                    {guest.group_name && <Badge>{guest.group_name}</Badge>}
                    {guest.side && <Badge>{guest.side}</Badge>}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteMutation.mutate(guest.id)}
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
        title="Add Guest"
      >
        <div className="flex flex-col gap-4">
          <FormField label="Name">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Guest name"
              autoFocus
            />
          </FormField>

          <FormField label="Email">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="guest@example.com"
            />
          </FormField>

          <FormField label="Phone">
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 555 000 0000"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Group">
              <Input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g. Family"
              />
            </FormField>
            <FormField label="Side">
              <Input
                value={side}
                onChange={(e) => setSide(e.target.value)}
                placeholder="e.g. Bride/Groom"
              />
            </FormField>
          </div>

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
                "Add Guest"
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
