import { useState, useCallback, useMemo } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Plus, Search, Users, Pencil, Trash2, Mail, Phone } from "lucide-react";
import { supabase, Wedding, Guest } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Select } from "../../components/ui/Input";
import { Card, Badge, FormField, Modal, EmptyState, Toast, ErrorState, Skeleton } from "../../components/ui/index";
import { generateToken, formatDate } from "../../lib/utils";

type OutletContext = { wedding: Wedding | null };

const EMPTY_GUEST: Omit<Guest, "id" | "wedding_id" | "created_at" | "rsvp_submitted_at"> = {
  name: "",
  email: "",
  phone: "",
  group_name: "",
  side: "",
  token: "",
  rsvp_status: "pending",
  plus_ones: 0,
  actual_attendance: 0,
  dietary: "",
  message: "",
};

const RSVP_STATUS_COLORS: Record<string, "gray" | "green" | "red" | "yellow"> = {
  pending: "gray",
  attending: "green",
  not_attending: "red",
  maybe: "yellow",
};

export default function GuestsPage() {
  const { wedding } = useOutletContext<OutletContext>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [formData, setFormData] = useState<typeof EMPTY_GUEST>(EMPTY_GUEST);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const { data: guests, isLoading, isError, refetch } = useQuery<Guest[]>({
    queryKey: ["guests", wedding?.id],
    queryFn: async () => {
      if (!wedding) return [];
      const { data, error } = await supabase.from("guests").select("*").eq("wedding_id", wedding.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data as Guest[];
    },
    enabled: !!wedding,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: { guest: typeof formData; id?: string }) => {
      if (!wedding) throw new Error("No wedding");
      if (data.id) {
        const { error } = await supabase.from("guests").update(data.guest).eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("guests").insert({ ...data.guest, wedding_id: wedding.id, token: generateToken() });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests", wedding?.id] });
      setModalOpen(false);
      setToast({ msg: "Guest saved successfully!", type: "success" });
      setTimeout(() => setToast(null), 3000);
    },
    onError: (err: any) => {
      setToast({ msg: "Failed: " + err.message, type: "error" });
      setTimeout(() => setToast(null), 3000);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("guests").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests", wedding?.id] });
      setToast({ msg: "Guest deleted", type: "success" });
      setTimeout(() => setToast(null), 3000);
    },
    onError: (err: any) => {
      setToast({ msg: "Failed: " + err.message, type: "error" });
      setTimeout(() => setToast(null), 3000);
    },
  });

  const filteredGuests = useMemo(() => {
    if (!guests) return [];
    return guests.filter((g) => {
      const matchesSearch = !search || g.name.toLowerCase().includes(search.toLowerCase()) || g.email.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || g.rsvp_status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [guests, search, statusFilter]);

  const openAdd = useCallback(() => {
    setEditingGuest(null);
    setFormData(EMPTY_GUEST);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((guest: Guest) => {
    setEditingGuest(guest);
    const { id, wedding_id, created_at, rsvp_submitted_at, ...rest } = guest;
    setFormData(rest);
    setModalOpen(true);
  }, []);

  const handleSave = useCallback(() => {
    if (!formData.name.trim()) {
      setToast({ msg: "Name is required", type: "error" });
      setTimeout(() => setToast(null), 3000);
      return;
    }
    saveMutation.mutate({ guest: formData, id: editingGuest?.id });
  }, [formData, editingGuest, saveMutation]);

  const handleDelete = useCallback((id: string) => {
    if (confirm("Delete this guest?")) deleteMutation.mutate(id);
  }, [deleteMutation]);

  const update = useCallback((patch: Partial<typeof formData>) => {
    setFormData((prev) => ({ ...prev, ...patch }));
  }, []);

  if (!wedding) return <ErrorState message="Could not load wedding data" onRetry={() => navigate("/admin")} />;
  if (isError) return <ErrorState message="Failed to load guests" onRetry={() => refetch()} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Guest List</h1>
          <p className="text-sm text-gray-500">{guests?.length ?? 0} total guests</p>
        </div>
        <Button onClick={openAdd}><Plus className="w-4 h-4" /> Add Guest</Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email..." className="pl-9" />
          </div>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="sm:w-40">
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="attending">Attending</option>
            <option value="not_attending">Not Attending</option>
            <option value="maybe">Maybe</option>
          </Select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3"><Skeleton className="h-12" /><Skeleton className="h-12" /><Skeleton className="h-12" /><Skeleton className="h-12" /></div>
        ) : filteredGuests.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Group</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">RSVP</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredGuests.map((guest) => (
                  <tr key={guest.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">{guest.name}</p>
                      {guest.side && <p className="text-xs text-gray-400">{guest.side}</p>}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {guest.email && <p className="text-xs text-gray-500 flex items-center gap-1"><Mail className="w-3 h-3" /> {guest.email}</p>}
                      {guest.phone && <p className="text-xs text-gray-500 flex items-center gap-1"><Phone className="w-3 h-3" /> {guest.phone}</p>}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {guest.group_name ? <Badge>{guest.group_name}</Badge> : <span className="text-xs text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Badge color={RSVP_STATUS_COLORS[guest.rsvp_status] || "gray"}>{guest.rsvp_status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(guest)}><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(guest.id)}><Trash2 className="w-3.5 h-3.5 text-red-500" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={<Users className="w-10 h-10" />} title={search || statusFilter !== "all" ? "No guests found" : "No guests yet"} description={search || statusFilter !== "all" ? "Try adjusting your filters" : "Add your first guest to get started"} action={!search && statusFilter === "all" ? <Button size="sm" onClick={openAdd}><Plus className="w-4 h-4" /> Add Guest</Button> : undefined} />
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingGuest ? "Edit Guest" : "Add Guest"} size="lg">
        <div className="space-y-4">
          <FormField label="Full Name"><Input value={formData.name} onChange={(e) => update({ name: e.target.value })} placeholder="Guest name" /></FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Email"><Input type="email" value={formData.email} onChange={(e) => update({ email: e.target.value })} placeholder="email@example.com" /></FormField>
            <FormField label="Phone"><Input value={formData.phone} onChange={(e) => update({ phone: e.target.value })} placeholder="Phone number" /></FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Group"><Input value={formData.group_name} onChange={(e) => update({ group_name: e.target.value })} placeholder="e.g. Family, Friends" /></FormField>
            <FormField label="Side"><Select value={formData.side} onChange={(e) => update({ side: e.target.value })}>
              <option value="">Select side</option>
              <option value="groom">Groom's side</option>
              <option value="bride">Bride's side</option>
              <option value="both">Both</option>
            </Select></FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Plus Ones"><Input type="number" min={0} value={formData.plus_ones} onChange={(e) => update({ plus_ones: Number(e.target.value) })} /></FormField>
            <FormField label="RSVP Status"><Select value={formData.rsvp_status} onChange={(e) => update({ rsvp_status: e.target.value as Guest["rsvp_status"] })}>
              <option value="pending">Pending</option>
              <option value="attending">Attending</option>
              <option value="not_attending">Not Attending</option>
              <option value="maybe">Maybe</option>
            </Select></FormField>
          </div>
          <FormField label="Dietary Requirements"><Input value={formData.dietary} onChange={(e) => update({ dietary: e.target.value })} placeholder="e.g. Vegetarian, Halal" /></FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saveMutation.isPending}>{editingGuest ? "Save Changes" : "Add Guest"}</Button>
          </div>
        </div>
      </Modal>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
