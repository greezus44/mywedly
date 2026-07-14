import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { isValidSlug, slugify } from "../../lib/utils";

const EVENT_TYPES = ["Wedding", "Birthday", "Anniversary", "Engagement", "Other"];

export function SettingsPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: "",
    event_type: "",
    event_date: "",
    event_time: "",
    venue: "",
    address: "",
    slug: "",
    rsvp_deadline: "",
  });
  const [saving, setSaving] = useState(false);
  const [slugError, setSlugError] = useState<string | null>(null);

  const { data: event } = useQuery({
    queryKey: ["event", eventId],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_events").select("*").eq("id", eventId!).single();
      if (error) throw error;
      return data as UserEvent;
    },
    enabled: !!eventId,
  });

  useEffect(() => {
    if (event) {
      setForm({
        name: event.draft_name ?? event.name ?? "",
        event_type: event.draft_event_type ?? event.event_type ?? "",
        event_date: event.draft_event_date ?? event.event_date ?? "",
        event_time: event.draft_event_time ?? event.event_time ?? "",
        venue: event.draft_venue ?? event.venue ?? "",
        address: event.draft_address ?? event.address ?? "",
        slug: event.draft_slug ?? event.slug ?? "",
        rsvp_deadline: event.draft_rsvp_deadline ?? event.rsvp_deadline ?? "",
      });
    }
  }, [event]);

  const update = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === "slug") setSlugError(null);
  };

  const save = async () => {
    if (!event) return;
    if (form.slug && !isValidSlug(form.slug)) {
      setSlugError("Slug can only contain lowercase letters, numbers, and hyphens.");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("user_events")
      .update({
        draft_name: form.name,
        draft_event_type: form.event_type || null,
        draft_event_date: form.event_date || null,
        draft_event_time: form.event_time || null,
        draft_venue: form.venue || null,
        draft_address: form.address || null,
        draft_slug: form.slug || slugify(form.name),
        draft_rsvp_deadline: form.rsvp_deadline || null,
      })
      .eq("id", event.id);
    setSaving(false);
    if (!error) qc.invalidateQueries({ queryKey: ["event", eventId] });
  };

  if (!event) return <div>Loading…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-1">Settings</h2>
        <p className="text-sm text-gray-500">Update the details of your event.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <Input
          label="Event Name"
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          placeholder="e.g. Jane & John's Wedding"
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
          <select
            value={form.event_type}
            onChange={(e) => update("event_type", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--event-primary,#8B7355)]"
          >
            <option value="">Select type…</option>
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Event Date"
            type="date"
            value={form.event_date}
            onChange={(e) => update("event_date", e.target.value)}
          />
          <Input
            label="Event Time"
            type="time"
            value={form.event_time}
            onChange={(e) => update("event_time", e.target.value)}
          />
        </div>

        <Input
          label="Venue"
          value={form.venue}
          onChange={(e) => update("venue", e.target.value)}
          placeholder="e.g. The Grand Ballroom"
        />
        <Input
          label="Address"
          value={form.address}
          onChange={(e) => update("address", e.target.value)}
          placeholder="e.g. 123 Main Street, City"
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">URL Slug</label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">/e/</span>
            <input
              value={form.slug}
              onChange={(e) => update("slug", e.target.value)}
              placeholder="auto-generated"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--event-primary,#8B7355)]"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => update("slug", slugify(form.name))}
              disabled={!form.name.trim()}
            >
              Auto
            </Button>
          </div>
          {slugError && <p className="mt-1 text-xs text-red-500">{slugError}</p>}
        </div>

        <Input
          label="RSVP Deadline"
          type="date"
          value={form.rsvp_deadline}
          onChange={(e) => update("rsvp_deadline", e.target.value)}
        />

        <Button onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}
