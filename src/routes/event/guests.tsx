import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventGuest, type GuestGroup } from "../../lib/supabase";
import { Button, Card, Modal, Input, Select, EmptyState, LoadingSpinner, Badge } from "../../components/ui";
import { GuestForm, RsvpBadge } from "./guest-form";
import { generateUsername } from "../../lib/utils";
import { InvitationManager } from "./invitation-manager";

export function GuestsPage() {
  const { eventId } = useOutletContext<{ event: UserEvent; eventId: string }>();
  const queryClient = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<EventGuest | null>(null);
  const [showInvitations, setShowInvitations] = useState<EventGuest | null>(null);
  const [search, setSearch] = useState("");
  const [filterGroup, setFilterGroup] = useState("");

  const { data: guests, isLoading } = useQuery({
    queryKey: ["guests", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_guests")
        .select("*")
        .eq("event_id", eventId)
        .order("full_name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as EventGuest[];
    },
  });

  const { data: groups } = useQuery({
    queryKey: ["groups", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guest_groups")
        .select("*")
        .eq("event_id", eventId)
        .order("name");
      if (error) throw error;
      return (data ?? []) as GuestGroup[];
    },
  });

  function openCreate() {
    setEditing(null);
    setShowModal(true);
  }

  function openEdit(guest: EventGuest) {
    setEditing(guest);
    setShowModal(true);
  }

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("event_guests").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["guests", eventId] }),
  });

  const filtered = (guests ?? []).filter((g) => {
    const matchSearch = !search ||
      g.full_name.toLowerCase().includes(search.toLowerCase()) ||
      g.username.toLowerCase().includes(search.toLowerCase()) ||
      (g.email ?? "").toLowerCase().includes(search.toLowerCase());
    const matchGroup = !filterGroup || g.group_id === filterGroup;
    return matchSearch && matchGroup;
  });

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-dash-text">Guests</h2>
        <Button size="sm" onClick={openCreate}>Add guest</Button>
      </div>

      {/* Search + filter */}
      <div className="flex gap-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search guests…"
          className="flex-1"
        />
        {(groups ?? []).length > 0 && (
          <Select
            value={filterGroup}
            onChange={(e) => setFilterGroup(e.target.value)}
            className="w-40"
          >
            <option value="">All groups</option>
            {groups?.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </Select>
        )}
      </div>

      {/* Stats */}
      <div className="flex gap-4 text-sm text-dash-muted">
        <span>{guests?.length ?? 0} total</span>
        <span>{(guests ?? []).filter((g) => g.rsvp_status === "attending").length} attending</span>
        <span>{(guests ?? []).filter((g) => g.rsvp_status === "declined").length} declined</span>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><LoadingSpinner /></div>
      ) : !guests || guests.length === 0 ? (
        <EmptyState
          title="No guests yet"
          description="Add guests to start managing your invite list."
          action={<Button size="sm" onClick={openCreate}>Add first guest</Button>}
        />
      ) : filtered.length === 0 ? (
        <EmptyState title="No results" description="Try adjusting your search or filter." />
      ) : (
        <div className="space-y-2">
          {filtered.map((guest) => {
            const group = groups?.find((g) => g.id === guest.group_id);
            return (
              <Card key={guest.id} className="py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-dash-text truncate">{guest.full_name}</span>
                      <RsvpBadge status={guest.rsvp_status} />
                    </div>
                    <p className="text-xs text-dash-muted">@{guest.username}</p>
                    {group && <span className="text-xs text-dash-muted">{group.name}</span>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => setShowInvitations(guest)}>
                      Invitations
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(guest)}>Edit</Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(guest.id)}>Delete</Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? "Edit Guest" : "Add Guest"}
      >
        <GuestForm
          eventId={eventId}
          groups={groups ?? []}
          guest={editing}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["guests", eventId] });
            setShowModal(false);
          }}
          onCancel={() => setShowModal(false)}
        />
      </Modal>

      {/* Invitation manager modal */}
      {showInvitations && (
        <Modal
          open={!!showInvitations}
          onClose={() => setShowInvitations(null)}
          title={`Invitations — ${showInvitations.full_name}`}
        >
          <InvitationManager
            guestId={showInvitations.id}
            eventId={eventId}
            onClose={() => setShowInvitations(null)}
          />
        </Modal>
      )}
    </div>
  );
}
