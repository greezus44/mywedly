import { useState, useEffect, type FormEvent } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card, Modal, Badge } from "../../components/ui";
import { DatePicker } from "../../components/ui/DatePicker";
import { TimePicker } from "../../components/ui/TimePicker";

export default function Settings() {
  const { event, eventId } = useOutletContext<{ event: UserEvent; eventId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState(event.draft_name ?? event.name ?? "");
  const [eventType, setEventType] = useState(
    event.draft_event_type ?? event.event_type ?? "Wedding"
  );
  const [eventDate, setEventDate] = useState<string | null>(
    event.draft_event_date ?? event.event_date ?? null
  );
  const [eventTime, setEventTime] = useState<string | null>(
    event.draft_event_time ?? event.event_time ?? null
  );
  const [venue, setVenue] = useState(event.draft_venue ?? event.venue ?? "");
  const [address, setAddress] = useState(event.draft_address ?? event.address ?? "");
  const [showDelete, setShowDelete] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  useEffect(() => {
    setName(event.draft_name ?? event.name ?? "");
    setEventType(event.draft_event_type ?? event.event_type ?? "Wedding");
    setEventDate(event.draft_event_date ?? event.event_date ?? null);
    setEventTime(event.draft_event_time ?? event.event_time ?? null);
    setVenue(event.draft_venue ?? event.venue ?? "");
    setAddress(event.draft_address ?? event.address ?? "");
  }, [event]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("user_events")
        .update({
          draft_name: name,
          draft_event_type: eventType,
          draft_event_date: eventDate,
          draft_event_time: eventTime,
          draft_venue: venue,
          draft_address: address,
        })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      queryClient.invalidateQueries({ queryKey: ["user-events"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("user_events")
        .delete()
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-events"] });
      navigate("/dashboard");
    },
  });

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    saveMutation.mutate();
  };

  const handleDelete = () => {
    if (deleteConfirm === event.name) {
      deleteMutation.mutate();
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Website Settings</h2>
        <p className="text-sm text-muted">
          Update your website's basic information.
        </p>
      </div>

      {saveMutation.isError && (
        <p className="text-sm text-danger">
          {saveMutation.error instanceof Error
            ? saveMutation.error.message
            : "Failed to save"}
        </p>
      )}
      {saveMutation.isSuccess && (
        <Badge variant="success">Saved successfully!</Badge>
      )}

      <Card>
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <Input
            label="Website Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. John & Jane's Wedding"
            required
          />
          <Input
            label="Event Type"
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            placeholder="e.g. Wedding, Birthday, Anniversary"
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DatePicker
              label="Event Date"
              value={eventDate}
              onChange={setEventDate}
            />
            <TimePicker
              label="Event Time"
              value={eventTime}
              onChange={(t) => setEventTime(t)}
            />
          </div>
          <Input
            label="Venue"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            placeholder="e.g. Grand Ballroom Hotel"
          />
          <Input
            label="Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. 123 Main St, City, Country"
          />
          <div className="flex justify-end">
            <Button type="submit" loading={saveMutation.isPending}>
              Save Changes
            </Button>
          </div>
        </form>
      </Card>

      {/* Danger zone */}
      <Card className="border-danger/30">
        <h3 className="mb-2 text-sm font-semibold text-danger">Danger Zone</h3>
        <p className="mb-4 text-sm text-muted">
          Permanently delete this website and all its data. This cannot be undone.
        </p>
        <Button variant="danger" onClick={() => setShowDelete(true)}>
          Delete Website
        </Button>
      </Card>

      <Modal
        open={showDelete}
        onClose={() => setShowDelete(false)}
        title="Delete Website"
        size="md"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted">
            This will permanently delete{" "}
            <strong className="text-foreground">{event.name}</strong> and all
            associated data including guests, RSVPs, pages, and schedule items.
          </p>
          <p className="text-sm text-muted">
            Type <strong className="text-foreground">{event.name}</strong> to confirm:
          </p>
          <Input
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder={event.name}
            autoFocus
          />
          {deleteMutation.isError && (
            <p className="text-sm text-danger">
              {deleteMutation.error instanceof Error
                ? deleteMutation.error.message
                : "Failed to delete"}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setShowDelete(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              loading={deleteMutation.isPending}
              disabled={deleteConfirm !== event.name}
            >
              Delete Permanently
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
