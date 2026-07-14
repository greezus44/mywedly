import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

export function LoginEditor() {
  const { eventId } = useParams<{ eventId: string }>();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
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
      const loginConfig = (event.draft_login_config ?? event.login_config ?? {}) as Record<string, unknown>;
      setTitle((loginConfig.title as string) || "");
      setSubtitle((loginConfig.subtitle as string) || "");
    }
  }, [event]);

  const save = async () => {
    if (!event) return;
    setSaving(true);
    const loginConfig = {
      ...((event.draft_login_config ?? event.login_config ?? {}) as Record<string, unknown>),
      title,
      subtitle,
    };
    const { error } = await supabase
      .from("user_events")
      .update({ draft_login_config: loginConfig })
      .eq("id", event.id);
    setSaving(false);
    if (!error) qc.invalidateQueries({ queryKey: ["event", eventId] });
  };

  if (!event) return <div>Loading…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-1">Login Page</h2>
        <p className="text-sm text-gray-500">Guests see this page when they sign in to view your event.</p>
      </div>

      <div className="space-y-4 bg-white p-5 border border-gray-200 rounded-xl">
        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Welcome to our wedding"
        />
        <Input
          label="Subtitle"
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          placeholder="e.g. Please sign in to continue"
        />

        <Button onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <p className="text-sm font-medium text-gray-700 mb-3">Preview</p>
        <div className="text-center space-y-2 py-6">
          {title ? (
            <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
          ) : (
            <h3 className="text-xl font-semibold text-gray-300">Login title appears here</h3>
          )}
          {subtitle ? (
            <p className="text-sm text-gray-500">{subtitle}</p>
          ) : (
            <p className="text-sm text-gray-300">Login subtitle appears here</p>
          )}
        </div>
      </div>
    </div>
  );
}
