import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input, Card } from "../../components/ui";
import { TypographyControls } from "../../components/ui/TypographyControls";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { LoginPreview, type LoginConfig } from "../../components/preview/PreviewRenderers";
import type { TypographyStyle } from "../../lib/typography";

interface EventContextValue { event: UserEvent; eventId: string; }

export function LoginEditor() {
  const { event, eventId } = useOutletContext<EventContextValue>();
  const queryClient = useQueryClient();

  const [config, setConfig] = useState<LoginConfig>(() => (event.draft_login_config ?? event.login_config ?? {}) as LoginConfig);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setConfig((event.draft_login_config ?? event.login_config ?? {}) as LoginConfig);
  }, [event]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("user_events")
        .update({ draft_login_config: config })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const update = (patch: Partial<LoginConfig>) => setConfig((p) => ({ ...p, ...patch }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-dash-text">Login Page</h2>
        <div className="flex items-center gap-3">
          {saved && <span className="text-sm text-green-600">Saved!</span>}
          <Button size="sm" onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>Save</Button>
        </div>
      </div>

      <SplitEditor
        editor={
          <div className="space-y-6">
            <Card>
              <h3 className="mb-4 text-sm font-semibold text-dash-text">Heading</h3>
              <TypographyControls
                value={(config.heading as TypographyStyle) ?? { text: event.draft_name ?? "Welcome" }}
                onChange={(v) => update({ heading: v })}
                showText
              />
            </Card>
            <Card>
              <h3 className="mb-4 text-sm font-semibold text-dash-text">Subheading</h3>
              <TypographyControls
                value={(config.subheading as TypographyStyle) ?? { text: "Please sign in to view your invitation" }}
                onChange={(v) => update({ subheading: v })}
                showText
              />
            </Card>
            <Card>
              <Input
                label="Input Placeholder"
                value={config.placeholder ?? ""}
                onChange={(e) => update({ placeholder: e.target.value })}
                placeholder="Enter your username"
              />
            </Card>
            <Card>
              <Input
                label="Button Label"
                value={config.buttonLabel ?? ""}
                onChange={(e) => update({ buttonLabel: e.target.value })}
                placeholder="Sign In"
              />
            </Card>
          </div>
        }
        preview={
          <LoginPreview config={config} eventName={event.draft_name ?? undefined} />
        }
      />
    </div>
  );
}
