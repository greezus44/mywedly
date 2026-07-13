import { useParams, useOutletContext, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Select } from "../../components/ui/Input";
import { Card, FormField, Toast, Modal } from "../../components/ui";
import { Trash2, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { isValidSlug, slugify } from "../../lib/theme";

type Ctx = { event: UserEvent };
export default function SettingsPage() {
  const { event } = useOutletContext<Ctx>();
  const { eventId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<string | null>(null);
  const [showDelete, setShowDelete] = useState(false);

  const saveMutation = useMutation({
    mutationFn: async (patch: Record<string, unknown>) => { const { error } = await supabase.from("user_events").update(patch).eq("id", eventId); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["event", eventId] }); setToast("Settings saved"); },
    onError: (e: Error) => setToast(`Failed: ${e.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => { const { error } = await supabase.from("user_events").delete().eq("id", eventId); if (error) throw error; },
    onSuccess: () => { navigate("/dashboard"); },
    onError: (e: Error) => { setToast(`Failed: ${e.message}`); setShowDelete(false); },
  });

  return (
    <div className="p-6 max-w-2xl">
      <h2 className="font-heading text-2xl text-gray-900 mb-6">Settings</h2>
      <div className="space-y-6">
        <Card className="space-y-4 p-5">
          <h3 className="text-sm font-medium text-gray-700">Event Details</h3>
          <FormField label="Event Name"><Input defaultValue={event.draft_name || event.name || ""} onBlur={(e) => saveMutation.mutate({ draft_name: e.target.value })} /></FormField>
          <FormField label="Event Type"><Select defaultValue={event.draft_event_type || event.event_type || "Wedding"} onBlur={(e) => saveMutation.mutate({ draft_event_type: e.target.value })}><option>Wedding</option><option>Engagement</option><option>Anniversary</option><option>Birthday</option><option>Other</option></Select></FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Date"><Input type="date" defaultValue={event.draft_event_date || event.event_date || ""} onBlur={(e) => saveMutation.mutate({ draft_event_date: e.target.value })} /></FormField>
            <FormField label="Time"><Input type="time" defaultValue={event.draft_event_time || event.event_time || ""} onBlur={(e) => saveMutation.mutate({ draft_event_time: e.target.value })} /></FormField>
          </div>
          <FormField label="Venue"><Input defaultValue={event.draft_venue || event.venue || ""} onBlur={(e) => saveMutation.mutate({ draft_venue: e.target.value })} /></FormField>
          <FormField label="Address"><Textarea defaultValue={event.draft_address || event.address || ""} onBlur={(e) => saveMutation.mutate({ draft_address: e.target.value })} rows={2} /></FormField>
        </Card>
        <Card className="space-y-4 p-5">
          <h3 className="text-sm font-medium text-gray-700">URL</h3>
          <FormField label="Custom Slug" hint="Lowercase letters, numbers, and hyphens only"><Input value={event.draft_slug || event.slug || ""} onChange={(e) => { const slug = slugify(e.target.value); saveMutation.mutate({ draft_slug: slug }); }} placeholder="john-and-jane" />{event.draft_slug && !isValidSlug(event.draft_slug) && <p className="text-xs text-red-500 mt-1">Invalid slug format</p>}</FormField>
        </Card>
        <Card className="space-y-4 p-5">
          <h3 className="text-sm font-medium text-gray-700">RSVP</h3>
          <FormField label="RSVP Deadline"><Input type="datetime-local" defaultValue={event.draft_rsvp_deadline || event.rsvp_deadline || ""} onBlur={(e) => saveMutation.mutate({ draft_rsvp_deadline: e.target.value })} /></FormField>
        </Card>
        <Card className="border-red-200 p-5">
          <h3 className="text-sm font-medium text-red-600 mb-2">Danger Zone</h3>
          <p className="text-xs text-gray-500 mb-4">Deleting an event removes all associated guests, RSVPs, and data. This cannot be undone.</p>
          <Button variant="danger" onClick={() => setShowDelete(true)}><Trash2 className="w-4 h-4" /> Delete Event</Button>
        </Card>
      </div>
      <Modal open={showDelete} onClose={() => setShowDelete(false)} title="Delete Event?">
        <div className="flex items-start gap-3 mb-6"><AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" /><p className="text-sm text-gray-600">Are you sure you want to permanently delete "{event.draft_name || event.name}"? All guest data and RSVPs will be lost.</p></div>
        <div className="flex gap-3"><Button variant="danger" onClick={() => deleteMutation.mutate()} loading={deleteMutation.isPending}>Delete Permanently</Button><Button variant="ghost" onClick={() => setShowDelete(false)}>Cancel</Button></div>
      </Modal>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
