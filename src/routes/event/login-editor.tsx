import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type Json } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui";
import { TypographyControls } from "../../components/ui/TypographyControls";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { LoginPreview, type LoginConfig } from "../../components/preview/PreviewRenderers";
import type { TypographyStyle } from "../../lib/typography";

interface EventContextValue { event: UserEvent; eventId: string; }

const defaultConfig: LoginConfig = { placeholder: "Enter your username", buttonLabel: "Sign In" };

export function LoginEditor() {
  const { event, eventId } = useOutletContext<EventContextValue>();
  const queryClient = useQueryClient();
  const [config, setConfig] = useState<LoginConfig>(() => ((event.draft_login_config ?? event.login_config) as LoginConfig) ?? defaultConfig);

  useEffect(() => { setConfig(((event.draft_login_config ?? event.login_config) as LoginConfig) ?? defaultConfig); }, [event.draft_login_config, event.login_config]);

  const update = (patch: Partial<LoginConfig>) => setConfig((p) => ({ ...p, ...patch }));

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("user_events").update({ draft_login_config: config as unknown as Json }).eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["event", eventId] }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-dash-text">Login</h2>
        <Button size="sm" onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>Save</Button>
      </div>
      {saveMutation.isError && <p className="text-sm text-dash-danger">{saveMutation.error instanceof Error ? saveMutation.error.message : "Save failed"}</p>}
      {saveMutation.isSuccess && <p className="text-sm text-green-600">Saved</p>}
      <SplitEditor
        editor={
          <div className="space-y-4 rounded-lg border border-dash-border bg-dash-surface p-4">
            <TypographyControls label="Heading" value={(config.heading as TypographyStyle) ?? {}} onChange={(v) => update({ heading: v })} showText />
            <TypographyControls label="Subheading" value={(config.subheading as TypographyStyle) ?? {}} onChange={(v) => update({ subheading: v })} showText />
            <Input label="Placeholder" value={config.placeholder ?? ""} onChange={(e) => update({ placeholder: e.target.value })} placeholder="Enter your username" />
            <Input label="Button Label" value={config.buttonLabel ?? ""} onChange={(e) => update({ buttonLabel: e.target.value })} placeholder="Sign In" />
          </div>
        }
        preview={<LoginPreview config={config} theme={event.draft_theme ?? event.theme} eventName={event.draft_name ?? event.name ?? undefined} />}
      />
    </div>
  );
}
