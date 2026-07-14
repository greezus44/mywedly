import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { LoginPreview, type LoginConfig } from "../../components/preview/PreviewRenderers";
import { TypographyControls } from "../../components/ui/TypographyControls";
import { Button } from "../../components/ui";

interface EventContextValue { event: UserEvent; eventId: string; }

export function LoginEditor() {
  const { event, eventId } = useOutletContext<EventContextValue>();
  const queryClient = useQueryClient();
  const [config, setConfig] = useState<LoginConfig>(() => (event.draft_login_config ?? event.login_config ?? {}) as LoginConfig);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const update = (patch: Partial<LoginConfig>) => setConfig((p) => ({ ...p, ...patch }));

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("user_events").update({ draft_login_config: config as unknown as Record<string, unknown> }).eq("id", eventId);
      if (error) throw error;
    },
    onMutate: () => { setSaving(true); setSavedMsg(null); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["event", eventId] }); setSaving(false); setSavedMsg("Saved!"); setTimeout(() => setSavedMsg(null), 2000); },
    onError: (e) => { setSaving(false); setSavedMsg(e instanceof Error ? e.message : "Failed to save"); },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-dash-text">Login Page</h2>
        <div className="flex items-center gap-3">
          {savedMsg && <span className="text-sm text-dash-muted">{savedMsg}</span>}
          <Button size="sm" onClick={() => saveMutation.mutate()} loading={saving}>Save</Button>
        </div>
      </div>
      <SplitEditor
        editor={
          <div className="space-y-4">
            <TypographyControls label="Heading" value={config.heading ?? {}} onChange={(v) => update({ heading: v })} showText />
            <TypographyControls label="Subheading" value={config.subheading ?? {}} onChange={(v) => update({ subheading: v })} showText />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-dash-text">Placeholder Text</label>
              <input value={config.placeholder ?? ""} onChange={(e) => update({ placeholder: e.target.value })} placeholder="Enter your username" className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text focus:border-dash-primary focus:outline-none" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-dash-text">Button Label</label>
              <input value={config.buttonLabel ?? ""} onChange={(e) => update({ buttonLabel: e.target.value })} placeholder="Sign In" className="w-full rounded-lg border border-dash-border bg-dash-surface px-3 py-2 text-sm text-dash-text focus:border-dash-primary focus:outline-none" />
            </div>
          </div>
        }
        preview={<LoginPreview config={config} eventName={event.draft_name ?? event.name ?? undefined} />}
      />
    </div>
  );
}
