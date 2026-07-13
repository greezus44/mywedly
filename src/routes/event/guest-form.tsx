import { useState, type FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type EventGuest, type GuestGroup } from "../../lib/supabase";
import { generateUsername } from "../../lib/utils";
import { Button, Modal, Input, Select } from "../../components/ui";

interface GuestFormModalProps {
  event: UserEvent;
  editing: EventGuest | null;
  open: boolean;
  onClose: () => void;
}

export function GuestFormModal({ event, editing, open, onClose }: GuestFormModalProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [groupId, setGroupId] = useState("");
  const [side, setSide] = useState("");
  const [username, setUsername] = useState("");
  const [plusOnes, setPlusOnes] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Sync form when editing changes or modal opens
  useState(() => {
    if (editing) {
      setName(editing.name);
      setEmail(editing.email ?? "");
      setPhone(editing.phone ?? "");
      setGroupId(editing.group_id ?? "");
      setSide(editing.side ?? "");
      setUsername(editing.username ?? "");
      setPlusOnes(editing.plus_ones);
    } else {
      setName(""); setEmail(""); setPhone(""); setGroupId("");
      setSide(""); setUsername(""); setPlusOnes(0);
    }
    setError(null);
  });

  const { data: groups } = useQuery({
    queryKey: ["guest_groups", event.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guest_groups")
        .select("*")
        .eq("event_id", event.id)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as GuestGroup[];
    },
  });

  const checkUsernameUnique = async (uname: string, excludeId?: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from("event_guests")
      .select("id")
      .eq("event_id", event.id)
      .eq("username", uname)
      .neq("id", excludeId ?? "");
    if (error) return false;
    return !data || data.length === 0;
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      let uname = username.trim();
      if (!uname) uname = generateUsername(name);
      const isUnique = await checkUsernameUnique(uname);
      if (!isUnique) uname = generateUsername(name);
      const group = (groups ?? []).find((g) => g.id === groupId);
      const { error } = await supabase.from("event_guests").insert({
        event_id: event.id, name, email: email || null, phone: phone || null,
        group_id: groupId || null, group_name: group?.name ?? null,
        side: side || null, username: uname, plus_ones: plusOnes,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event_guests", event.id] });
      handleClose();
    },
    onError: (err: Error) => setError(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editing) return;
      let uname = username.trim();
      if (!uname) uname = generateUsername(name);
      const isUnique = await checkUsernameUnique(uname, editing.id);
      if (!isUnique) throw new Error("Username is already taken. Please choose another.");
      const group = (groups ?? []).find((g) => g.id === groupId);
      const { error } = await supabase
        .from("event_guests")
        .update({
          name, email: email || null, phone: phone || null,
          group_id: groupId || null, group_name: group?.name ?? null,
          side: side || null, username: uname, plus_ones: plusOnes,
        })
        .eq("id", editing.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event_guests", event.id] });
      handleClose();
    },
    onError: (err: Error) => setError(err.message),
  });

  const handleClose = () => {
    setName(""); setEmail(""); setPhone(""); setGroupId("");
    setSide(""); setUsername(""); setPlusOnes(0);
    setError(null);
    onClose();
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Name is required"); return; }
    if (editing) updateMutation.mutate();
    else createMutation.mutate();
  };

  const handleAutoGenerate = () => {
    setUsername(generateUsername(name));
  };

  return (
    <Modal open={open} onClose={handleClose} title={editing ? "Edit Guest" : "Add Guest"} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)}
          placeholder="Guest full name" required autoFocus />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="guest@example.com" />
          <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="555-1234" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select label="Group" value={groupId} onChange={(e) => setGroupId(e.target.value)}>
            <option value="">No group</option>
            {(groups ?? []).map((g) => (<option key={g.id} value={g.id}>{g.name}</option>))}
          </Select>
          <Select label="Side" value={side} onChange={(e) => setSide(e.target.value)}>
            <option value="">No side</option>
            <option value="bride">Bride's side</option>
            <option value="groom">Groom's side</option>
            <option value="both">Both</option>
          </Select>
        </div>
        <div className="flex items-end gap-2">
          <Input label="Username" value={username} onChange={(e) => setUsername(e.target.value)}
            placeholder="Auto-generated if empty" />
          <Button type="button" variant="secondary" onClick={handleAutoGenerate} className="mb-1">
            Auto-Generate
          </Button>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-dash-text">Plus Ones</label>
          <input type="number" min={0} max={10} value={plusOnes}
            onChange={(e) => setPlusOnes(parseInt(e.target.value) || 0)}
            className="w-24 rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text focus:border-dash-primary focus:outline-none focus:ring-1 focus:ring-dash-primary" />
        </div>
        {error && <p className="text-sm text-dash-danger">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={handleClose}>Cancel</Button>
          <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>
            {editing ? "Update" : "Create"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
