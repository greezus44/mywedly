import { useState, useMemo } from "react";
import { useOutletContext, useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Pencil, Trash2, Users, Mail, Phone, X } from "lucide-react";
import { supabase, UserEvent, EventGuest } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input, Select } from "../../components/ui/Input";
import { Card, Badge, Modal, FormField, EmptyState, Skeleton, Toast, ErrorState } from "../../components/ui/index";
import { generateToken } from "../../lib/utils";

type Ctx = { event: UserEvent | null };

const RSVP_COLORS: Record<string, "gray" | "green" | "red" | "yellow"> = {
  attending: "green",
  not_attending: "red",
  maybe: "yellow",
  pending: "gray",
};

const RSVP_LABELS: Record<string, string> = {
  attending: "Attending",
  not_attending: "Not Attending",
  maybe: "Maybe",
  pending: "Pending",
};

interface GuestForm {
  name: string;
  email: string;
  phone: string;
  group_name: string;
  side: string;
}

const EMPTY_FORM: GuestForm = { name: "", email: "", phone: "", group_name: "", side: "" };

export default function GuestsPage() {
  const { event } = useOutletContext<Ctx>();
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("all");
  const [sideFilter, setSideFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<GuestForm>(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const { data: guests, isLoading, error, refetch } = useQuery<EventGuest[]>({
    queryKey: ["guests", eventId],
    queryFn: async () => {
      if (!eventId) return [];
      const { data, error } = await supabase
        .from("event_guests")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as EventGuest[];
    },
    enabled: !!eventId,
    staleTime: 30000,
  });

  const addMutation = useMutation({
    mutationFn: async (newGuest: GuestForm) => {
      if (!eventId) throw new Error("No event ID");
      const { data, error } = await supabase
        .from("event_guests")
        .insert({
          event_id: eventId,
          name: newGuest.name,
          email: newGuest.email,
          phone: newGuest.phone,
          group_name: newGuest.group_name,
          side: newGuest.side,
          token: generateToken(),
          rsvp_status: "pending",
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests", eventId] });
      setModalOpen(false);
      setForm(EMPTY_FORM);
      showToast("Guest added successfully");
    },
    onError: (err: any) => showToast("Failed to add guest: " + err.message, "error"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<GuestForm> }) => {
      const { error } = await supabase.from("event_guests").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests", eventId] });
      setModalOpen(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      showToast("Guest updated successfully");
    },
    onError: (err: any) => showToast("Failed to update guest: " + err.message, "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("event_guests").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests", eventId] });
      setDeleteId(null);
      showToast("Guest deleted");
    },
    onError: (err: any) => showToast("Failed to delete guest: " + err.message, "error"),
  });

  const groups = useMemo(() => {
    if (!guests) return [];
    return Array.from(new Set(guests.map((g) => g.group_name).filter(Boolean)));
  }, [guests]);

  const sides = useMemo(() => {
    if (!guests) return [];
    return Array.from(new Set(guests.map((g) => g.side).filter(Boolean)));
  }, [guests]);

  const filteredGuests = useMemo(() => {
    if (!guests) return [];
    return guests.filter((g) => {
      if (groupFilter !== "all" && g.group_name !== groupFilter) return false;
      if (sideFilter !== "all" && g.side !== sideFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !g.name.toLowerCase().includes(q) &&
          !g.email.toLowerCase().includes(q) &&
          !g.phone.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [guests, search, groupFilter, sideFilter]);

  const summary = useMemo(() => {
    if (!guests) return { total: 0, attending: 0, declined: 0, pending: 0, plusOnes: 0 };
    return guests.reduce(
      (acc, g) => {
        acc.total++;
        acc.plusOnes += g.plus_ones || 0;
        if (g.rsvp_status === "attending") acc.attending++;
        else if (g.rsvp_status === "not_attending") acc.declined++;
        else acc.pending++;
        return acc;
      },
      { total: 0, attending: 0, declined: 0, pending: 0, plusOnes: 0 }
    );
  }, [guests]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const handleOpenEdit = (guest: EventGuest) => {
    setEditingId(guest.id);
    setForm({
      name: guest.name,
      email: guest.email,
      phone: guest.phone,
      group_name: guest.group_name,
      side: guest.side,
    });
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      showToast("Name is required", "error");
      return;
    }
    if (editingId) {
      updateMutation.mutate({ id: editingId, updates: form });
    } else {
      addMutation.mutate(form);
    }
  };

  if (!event) return <ErrorState message="Could not load event data" onRetry={() => navigate("/dashboard")} />;
  if (error) return <ErrorState message={error.message} onRetry={() => refetch()} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Guest List</h1>
          <p className="text-sm text-gray-500">Manage your event guests</p>
        </div>
        <Button onClick={handleOpenAdd}>
          <Plus className="w-4 h-4" /> Add Guest
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <Card className="p-4">
          <p className="text-xs text-gray-500 mb-1">Total Guests</p>
          <p className="text-2xl font-bold text-gray-900">{summary.total}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500 mb-1">Attending</p>
          <p className="text-2xl font-bold text-green-600">{summary.attending}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500 mb-1">Declined</p>
          <p className="text-2xl font-bold text-red-600">{summary.declined}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500 mb-1">Pending</p>
          <p className="text-2xl font-bold text-gray-500">{summary.pending}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500 mb-1">Plus Ones</p>
          <p className="text-2xl font-bold text-gray-900">{summary.plusOnes}</p>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or phone..."
              className="pl-9"
            />
          </div>
          <Select value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)} className="sm:w-40">
            <option value="all">All Groups</option>
            {groups.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </Select>
          <Select value={sideFilter} onChange={(e) => setSideFilter(e.target.value)} className="sm:w-40">
            <option value="all">All Sides</option>
            {sides.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : filteredGuests.length === 0 ? (
          <EmptyState
            icon={<Users className="w-12 h-12" />}
            title={search || groupFilter !== "all" || sideFilter !== "all" ? "No guests found" : "No guests yet"}
            description={search || groupFilter !== "all" || sideFilter !== "all" ? "Try adjusting your filters" : "Add your first guest to get started"}
            action={
              !search && groupFilter === "all" && sideFilter === "all" ? (
                <Button onClick={handleOpenAdd}>
                  <Plus className="w-4 h-4" /> Add Guest
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 text-left">
                  <th className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">Name</th>
                  <th className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">Email</th>
                  <th className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">Phone</th>
                  <th className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">Group</th>
                  <th className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">Side</th>
                  <th className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">RSVP</th>
                  <th className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide text-center">Plus Ones</th>
                  <th className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredGuests.map((guest) => (
                  <tr key={guest.id} className="hover:bg-gray-50">
                    <td className="px-3 py-3 text-sm font-medium text-gray-900">{guest.name}</td>
                    <td className="px-3 py-3 text-sm text-gray-600">
                      {guest.email ? (
                        <span className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-gray-400" />
                          {guest.email}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-600">
                      {guest.phone ? (
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          {guest.phone}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-600">{guest.group_name || <span className="text-gray-400">—</span>}</td>
                    <td className="px-3 py-3 text-sm text-gray-600">{guest.side || <span className="text-gray-400">—</span>}</td>
                    <td className="px-3 py-3">
                      <Badge color={RSVP_COLORS[guest.rsvp_status] || "gray"}>
                        {RSVP_LABELS[guest.rsvp_status] || guest.rsvp_status}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-600 text-center">{guest.plus_ones || 0}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(guest)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteId(guest.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Edit Guest" : "Add Guest"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Name" hint="Required">
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Guest name"
              autoFocus
            />
          </FormField>
          <FormField label="Email">
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="guest@example.com"
            />
          </FormField>
          <FormField label="Phone">
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+1 234 567 890"
            />
          </FormField>
          <FormField label="Group">
            <Input
              value={form.group_name}
              onChange={(e) => setForm({ ...form, group_name: e.target.value })}
              placeholder="e.g. Family, Friends, Colleagues"
            />
          </FormField>
          <FormField label="Side">
            <Select value={form.side} onChange={(e) => setForm({ ...form, side: e.target.value })}>
              <option value="">No side</option>
              <option value="groom">Groom</option>
              <option value="bride">Bride</option>
              <option value="host">Host</option>
              <option value="guest">Guest</option>
            </Select>
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={addMutation.isPending || updateMutation.isPending}>
              {editingId ? "Save Changes" : "Add Guest"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Guest" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Are you sure you want to delete this guest? This action cannot be undone.</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button variant="danger" loading={deleteMutation.isPending} onClick={() => deleteId && deleteMutation.mutate(deleteId)}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
