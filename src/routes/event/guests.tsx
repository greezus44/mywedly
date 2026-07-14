import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type EventGuest, type GuestGroupMember, type EventRsvp } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card, LoadingSpinner, ErrorState, EmptyState, Badge, Modal } from "../../components/ui";
import {
  GuestForm,
  RsvpBadge,
  guestToForm,
  emptyGuestForm,
  type GuestFormValues,
} from "./guest-form";
import { generateUsername } from "../../lib/utils";

export function GuestsPage() {
  const { eventId } = useEventContext();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<EventGuest | null>(null);
  const [importing, setImporting] = useState(false);
  const [bulkText, setBulkText] = useState("");

  const { data: guests, isLoading, isError, refetch } = useQuery({
    queryKey: ["guests", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_guests")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as EventGuest[];
    },
  });

  const { data: rsvps } = useQuery({
    queryKey: ["guest-rsvps", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_rsvps")
        .select("*")
        .eq("event_id", eventId);
      if (error) throw error;
      return data as EventRsvp[];
    },
  });

  const { data: memberships } = useQuery({
    queryKey: ["guest-memberships", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guest_group_members")
        .select("*, guest_groups!inner(event_id)")
        .eq("guest_groups.event_id", eventId);
      if (error) throw error;
      return (data ?? []) as (GuestGroupMember & { guest_groups: { event_id: string } })[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: GuestFormValues) => {
      const username = values.username || generateUsername(values.name);
      const { data, error } = await supabase
        .from("event_guests")
        .insert({
          event_id: eventId,
          name: values.name,
          username,
          email: values.email || null,
          phone: values.phone || null,
          plus_one_allowed: values.plus_one_allowed,
          group_id: values.group_id || null,
        })
        .select()
        .maybeSingle();
      if (error) throw error;
      // Add to group if selected
      if (values.group_id && data) {
        await supabase
          .from("guest_group_members")
          .insert({ group_id: values.group_id, guest_id: (data as EventGuest).id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests", eventId] });
      queryClient.invalidateQueries({ queryKey: ["group-members", eventId] });
      queryClient.invalidateQueries({ queryKey: ["guest-memberships", eventId] });
      setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ guestId, values }: { guestId: string; values: GuestFormValues }) => {
      const { error } = await supabase
        .from("event_guests")
        .update({
          name: values.name,
          username: values.username,
          email: values.email || null,
          phone: values.phone || null,
          plus_one_allowed: values.plus_one_allowed,
          group_id: values.group_id || null,
        })
        .eq("id", guestId);
      if (error) throw error;
      // Update group membership: remove existing, add new
      await supabase
        .from("guest_group_members")
        .delete()
        .eq("guest_id", guestId);
      if (values.group_id) {
        await supabase
          .from("guest_group_members")
          .insert({ group_id: values.group_id, guest_id: guestId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests", eventId] });
      queryClient.invalidateQueries({ queryKey: ["group-members", eventId] });
      queryClient.invalidateQueries({ queryKey: ["guest-memberships", eventId] });
      setEditing(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("event_guests")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests", eventId] });
    },
  });

  const bulkImportMutation = useMutation({
    mutationFn: async () => {
      const names = bulkText
        .split("\n")
        .map((n) => n.trim())
        .filter(Boolean);
      if (names.length === 0) return;
      const rows = names.map((name) => ({
        event_id: eventId,
        name,
        username: generateUsername(name),
        plus_one_allowed: false,
      }));
      const { error } = await supabase
        .from("event_guests")
        .insert(rows);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests", eventId] });
      setBulkText("");
      setImporting(false);
    },
  });

  function getRsvpStatus(guestId: string): EventRsvp["status"] | undefined {
    return rsvps?.find((r) => r.guest_id === guestId)?.status;
  }

  const filteredGuests = guests?.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    g.username.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState message="Failed to load guests." onRetry={() => refetch()} />;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dash-text">Guests</h1>
          <p className="mt-1 text-sm text-dash-muted">
            Manage your guest list and track RSVPs.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setImporting(true)}>
            Bulk Import
          </Button>
          <Button onClick={() => { setEditing(null); setShowForm(true); }}>
            Add Guest
          </Button>
        </div>
      </div>

      <Input
        type="text"
        placeholder="Search guests…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {filteredGuests.length > 0 ? (
        <div className="space-y-3">
          {filteredGuests.map((guest) => (
            <Card key={guest.id}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-dash-text">{guest.name}</h3>
                    <RsvpBadge status={getRsvpStatus(guest.id)} />
                  </div>
                  <p className="mt-1 text-sm text-dash-muted">@{guest.username}</p>
                  {guest.email && <p className="text-sm text-dash-muted">{guest.email}</p>}
                  {guest.phone && <p className="text-sm text-dash-muted">{guest.phone}</p>}
                  {guest.plus_one_allowed && <Badge variant="primary">+1 allowed</Badge>}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => { setEditing(guest); setShowForm(true); }}>
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (window.confirm(`Delete ${guest.name}?`)) {
                        deleteMutation.mutate(guest.id);
                      }
                    }}
                  >
                    ✕
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        !showForm && (
          <EmptyState
            title="No guests yet"
            description={search ? "No guests match your search." : "Add guests to your event."}
            action={<Button onClick={() => { setEditing(null); setShowForm(true); }}>Add Guest</Button>}
          />
        )
      )}

      {/* Add/Edit Modal */}
      <Modal
        open={showForm}
        onClose={() => { setShowForm(false); setEditing(null); }}
        title={editing ? "Edit Guest" : "Add Guest"}
      >
        <GuestForm
          eventId={eventId}
          initial={editing ? guestToForm(editing) : emptyGuestForm()}
          submitting={createMutation.isPending || updateMutation.isPending}
          onCancel={() => { setShowForm(false); setEditing(null); }}
          onSubmit={async (values) => {
            if (editing) {
              await updateMutation.mutateAsync({ guestId: editing.id, values });
            } else {
              await createMutation.mutateAsync(values);
            }
          }}
        />
        {(createMutation.isError || updateMutation.isError) && (
          <p className="mt-2 text-sm text-dash-danger">
            {(createMutation.error || updateMutation.error) instanceof Error
              ? (createMutation.error || updateMutation.error)?.message
              : "Save failed."}
          </p>
        )}
      </Modal>

      {/* Bulk Import Modal */}
      <Modal
        open={importing}
        onClose={() => setImporting(false)}
        title="Bulk Import Guests"
      >
        <div className="space-y-4">
          <p className="text-sm text-dash-muted">
            Enter one guest name per line. Usernames will be auto-generated.
          </p>
          <textarea
            className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text focus:border-dash-primary focus:outline-none focus:ring-1 focus:ring-dash-primary"
            rows={8}
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder={"John Doe\nJane Smith\nBob Johnson"}
          />
          <div className="flex gap-2">
            <Button
              onClick={() => bulkImportMutation.mutate()}
              loading={bulkImportMutation.isPending}
              disabled={!bulkText.trim() || bulkImportMutation.isPending}
            >
              Import
            </Button>
            <Button variant="secondary" onClick={() => setImporting(false)}>
              Cancel
            </Button>
          </div>
          {bulkImportMutation.isError && (
            <p className="text-sm text-dash-danger">
              {bulkImportMutation.error instanceof Error ? bulkImportMutation.error.message : "Import failed."}
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}
