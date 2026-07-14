import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

interface TimelineMoment {
  time: string;
  title: string;
  description: string;
}

export function TimelinePage() {
  const { eventId } = useParams<{ eventId: string }>();
  const qc = useQueryClient();
  const [moments, setMoments] = useState<TimelineMoment[]>([]);
  const [saving, setSaving] = useState(false);

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
      const content = (event.draft_content ?? event.content ?? {}) as Record<string, unknown>;
      setMoments((content.timeline as unknown as TimelineMoment[]) || []);
    }
  }, [event]);

  const save = async () => {
    if (!event) return;
    setSaving(true);
    const content = {
      ...((event.draft_content ?? event.content ?? {}) as Record<string, unknown>),
      timeline: moments,
    };
    const { error } = await supabase
      .from("user_events")
      .update({ draft_content: content })
      .eq("id", event.id);
    setSaving(false);
    if (!error) qc.invalidateQueries({ queryKey: ["event", eventId] });
  };

  const update = (index: number, field: keyof TimelineMoment, value: string) => {
    setMoments((prev) => prev.map((m, i) => (i === index ? { ...m, [field]: value } : m)));
  };

  const add = () => {
    setMoments((prev) => [...prev, { time: "", title: "", description: "" }]);
  };

  const remove = (index: number) => {
    setMoments((prev) => prev.filter((_, i) => i !== index));
  };

  if (!event) return <div>Loading…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-1">Timeline</h2>
          <p className="text-sm text-gray-500">Add the key moments of your event day.</p>
        </div>
        <Button variant="outline" size="sm" onClick={add}>Add Moment</Button>
      </div>

      {moments.length > 0 ? (
        <div className="space-y-4">
          {moments.map((moment, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Moment {i + 1}</span>
                <button onClick={() => remove(i)} className="text-xs text-red-500 hover:underline">Remove</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input
                  label="Time"
                  value={moment.time}
                  onChange={(e) => update(i, "time", e.target.value)}
                  placeholder="4:00 PM"
                />
                <Input
                  label="Title"
                  value={moment.title}
                  onChange={(e) => update(i, "title", e.target.value)}
                  placeholder="Ceremony"
                />
                <Input
                  label="Description"
                  value={moment.description}
                  onChange={(e) => update(i, "description", e.target.value)}
                  placeholder="Garden venue"
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white border border-dashed border-gray-300 rounded-xl">
          <p className="text-sm text-gray-500 mb-3">No timeline moments yet.</p>
          <Button variant="outline" size="sm" onClick={add}>Add your first moment</Button>
        </div>
      )}

      <Button onClick={save} disabled={saving}>
        {saving ? "Saving…" : "Save Timeline"}
      </Button>
    </div>
  );
}
