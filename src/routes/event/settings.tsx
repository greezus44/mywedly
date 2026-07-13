import { useState, useEffect } from "react";
import { useOutletContext, useParams, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase, UserEvent, EventType, EVENT_TYPES } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input, Select } from "../../components/ui/Input";
import { FormField, Toggle, Modal, ErrorState, Toast } from "../../components/ui/index";
import { DatePicker } from "../../components/ui/DatePicker";
import { TimePicker } from "../../components/ui/TimePicker";
import { Trash2, Copy, Save } from "lucide-react";

type Ctx = { event: UserEvent | null };

export default function Settings() {
  const { event } = useOutletContext<Ctx>();
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [eventType, setEventType] = useState<EventType>("other");
  const [eventDate, setEventDate] = useState<string | null>(null);
  const [eventTime, setEventTime] = useState<string | null>(null);
  const [venue, setVenue] = useState("");
  const [address, setAddress] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [isArchived, setIsArchived] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [duplicating, setDuplicating] = useState(false);

  useEffect(() => {
    if (event) {
      setName(event.name);
      setEventType(event.event_type);
      setEventDate(event.event_date);
      setEventTime(event.event_time);
      setVenue(event.venue || "");
      setAddress(event.address || "");
      setIsPublished(event.is_published);
      setIsArchived(event.is_archived);
    }
  }, [event?.id]);

  const handleSave = async () => {
    if (!eventId) return;
    if (!name.trim()) { setToast({ message: "Name is required", type: "error" }); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from("user_events").update({
        name, event_type: eventType, event_date: eventDate, event_time: eventTime,
        venue: venue || null, address: address || null, is_published: isPublished, is_archived: isArchived,
      }).eq("id", eventId);
      if (error) throw error;
      queryClient.setQueryData(["event", eventId], (old: UserEvent | null) => old ? {
        ...old, name, event_type: eventType, event_date: eventDate, event_time: eventTime,
        venue: venue || null, address: address || null, is_published: isPublished, is_archived: isArchived,
      } : old);
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setToast({ message: "Settings saved", type: "success" });
    } catch (err: any) {
      setToast({ message: "Failed: " + err.message, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!eventId) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from("user_events").delete().eq("id", eventId);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["events"] });
      navigate("/dashboard");
    } catch (err: any) {
      setToast({ message: "Failed: " + err.message, type: "error" });
      setDeleting(false);
    }
  };

  const handleDuplicate = async () => {
    if (!event || !eventId) return;
    setDuplicating(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error("Not authenticated");

      const { id, created_at, updated_at, published_at, ...rest } = event;
      const copy = {
        ...rest,
        creator_id: userId,
        name: `${event.name} (Copy)`,
        is_published: false,
        is_archived: false,
        published_at: null,
      };
      const { data, error } = await supabase.from("user_events").insert(copy).select().single();
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setToast({ message: "Event duplicated", type: "success" });
      if (data) navigate(`/event/${data.id}`);
    } catch (err: any) {
      setToast({ message: "Failed: " + err.message, type: "error" });
    } finally {
      setDuplicating(false);
    }
  };

  if (!event) return <ErrorState message="Could not load event data" onRetry={() => navigate("/dashboard")} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500">Manage event details</p>
        </div>
        <Button onClick={handleSave} loading={saving}><Save className="w-4 h-4" /> Save Changes</Button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-gray-900">Event Details</h3>
        <FormField label="Event Name"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Event name" /></FormField>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Event Type">
            <Select value={eventType} onChange={(e) => setEventType(e.target.value as EventType)}>
              {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </Select>
          </FormField>
          <div />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Event Date"><DatePicker value={eventDate} onChange={setEventDate} /></FormField>
          <FormField label="Event Time"><TimePicker value={eventTime} onChange={setEventTime} /></FormField>
        </div>
        <FormField label="Venue"><Input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="Venue name" /></FormField>
        <FormField label="Address"><Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Venue address" /></FormField>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-gray-900">Status</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">Published</p>
            <p className="text-xs text-gray-500">Make this event visible to guests</p>
          </div>
          <Toggle checked={isPublished} onChange={setIsPublished} />
        </div>
        <div className="flex items-center justify-between border-t border-gray-100 pt-4">
          <div>
            <p className="text-sm font-medium text-gray-900">Archived</p>
            <p className="text-xs text-gray-500">Archive this event to hide it from your dashboard</p>
          </div>
          <Toggle checked={isArchived} onChange={setIsArchived} />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-gray-900">Actions</h3>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={handleDuplicate} loading={duplicating}><Copy className="w-4 h-4" /> Duplicate Event</Button>
          <Button variant="danger" onClick={() => setDeleteOpen(true)}><Trash2 className="w-4 h-4" /> Delete Event</Button>
        </div>
      </div>

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete Event">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Are you sure you want to delete <span className="font-semibold text-gray-900">{event.name}</span>? This action cannot be undone and all associated data (guests, RSVPs, schedule, messages) will be permanently removed.</p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete} loading={deleting}>Delete Permanently</Button>
          </div>
        </div>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
