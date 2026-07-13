import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Loader2, Users, Search, Mail, Phone } from "lucide-react";
import { supabase, type UserEvent, type EventGuest } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import {
  Card,
  Badge,
  EmptyState,
  Skeleton,
  Modal,
  FormField,
  Toast,
  type ToastType,
} from "../../components/ui";

async function fetchGuests(eventId: string): Promise<EventGuest[]> {
  const { data, error } = await supabase
    .from("event_guests")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as EventGuest[];
}

async function createGuest(input: {
  event_id: string;
  name: string;
  email: string;
  phone: string;
  group_name: string | null;
  side: string | null;
}): Promise<EventGuest> {
  const { data, error } = await supabase
    .from("event_guests")
    .insert({
      ...input,
      rsvp_status: "pending",
      plus_ones: 0,
      token: crypto.randomUUID(),
    })
    .select()
    .single();
  if (error) throw error;
  return data as EventGuest;
}

async function deleteGuest(id: string): Promise<void> {
  const { error } = await supabase.from("event_guests").delete().eq("id", id);
  if (error) throw error;
}

const STATUS_VARIANT: Record<string, "success" | "error" | "warning"> = {
  attending: "success",
  declined: "error",
  pending: "warning",
};

export default function GuestsPage() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [groupName, setGroupName] = useState("");
  const [side, setSide] = useState("");

  const { data: guests, isLoading } = useQuery({
    queryKey: ["guests", event.id],
    queryFn: () => fetchGuests(event.id),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createGuest({
        event_id: event.id,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        group_name: groupName.trim() || null,
        side: side.trim() || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests", event.id] });
      setToast({ message: "Guest added!", type: "success" });
      resetForm();
      setShowAdd(false);
    },
    onError: (err: Error) => {
      setToast({ message: err.message, type: "error" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteGuest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests", event.id] });
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

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createMutation.mutate();
  };

  const filtered = guests?.filter((g) =>
    !search ||
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    g.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="mx-auto max-w-4xl space-y-6 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-xl font-bold text-gray-900">
              Guests
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              {guests?.length ?? 0} guest{(guests?.length ?? 0) !== 1 ? "s" : ""} total
            </p>
          </div>
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus className="h-4 w-4" /> Add Guest
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search guests..."
            className="pl-10"
          />
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        ) : !filtered || filtered.length === 0 ? (
          <EmptyState
            icon={<Users className="h-12 w-12" />}
            title={search ? "No guests found" : "No guests yet"}
            description={
              search
                ? "Try a different search term."
                : "Add guests to your event to start tracking RSVPs."
            }
            action={
              !search && (
                <Button size="sm" onClick={() => setShowAdd(true)}>
                  <Plus className="h-4 w-4" /> Add Guest
                </Button>
              )
            }
          />
        ) : (
          <div className="space-y-3">
            {filtered.map((guest) => (
              <Card key={guest.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900">{guest.name}</h3>
                      <Badge variant={STATUS_VARIANT[guest.rsvp_status]}>
                        {guest.rsvp_status}
                      </Badge>
                    </div>
                    <div className="mt-1.5 space-y-0.5 text-sm text-gray-600">
                      {guest.email && (
                        <p className="flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-gray-400" />
                          {guest.email}
                        </p>
                      )}
                      {guest.phone && (
                        <p className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-gray-400" />
                          {guest.phone}
                        </p>
                      )}
                      {guest.group_name && (
                        <p className="text-xs text-gray-500">
                          Group: {guest.group_name}
                          {guest.side && ` • ${guest.side}`}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm("Remove this guest?")) {
                        deleteMutation.mutate(guest.id);
                      }
                    }}
                    className="text-gray-400 transition-colors hover:text-red-600"
                    aria-label="Remove guest"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)}>
        <div className="p-6">
          <h2 className="font-heading text-xl font-bold text-gray-900">
            Add Guest
          </h2>
          <form onSubmit={handleAdd} className="mt-4 space-y-4">
            <FormField label="Name">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                required
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
            <FormField label="Group">
              <Input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g. Bride's family"
              />
            </FormField>
            <FormField label="Side">
              <Input
                value={side}
                onChange={(e) => setSide(e.target.value)}
                placeholder="e.g. Bride / Groom"
              />
            </FormField>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowAdd(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Adding...
                  </>
                ) : (
                  "Add"
                )}
              </Button>
            </div>
          </form>
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
