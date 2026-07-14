import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Json } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { Button } from "../../components/ui/Button";
import { Card, Toggle, Input, FormField } from "../../components/ui";
import { TypographyControls } from "../../components/ui/TypographyControls";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { LoginPreview } from "../../components/preview/PreviewRenderers";
import type { TypographyStyle } from "../../lib/typography";

interface LoginConfig {
  heading?: TypographyStyle;
  subheading?: TypographyStyle;
  placeholder?: string;
  buttonText?: string;
  showUsernameHint?: boolean;
}

function asConfig(json: Json | null | undefined): LoginConfig {
  if (!json || typeof json !== "object" || Array.isArray(json)) return {};
  return json as LoginConfig;
}

const DEFAULT_CONFIG: LoginConfig = {
  buttonText: "Enter",
  placeholder: "Enter your username",
  showUsernameHint: true,
};

export function LoginEditor() {
  const { event, eventId } = useEventContext();
  const queryClient = useQueryClient();
  const [config, setConfig] = useState<LoginConfig>({
    ...DEFAULT_CONFIG,
    ...asConfig(event.draft_login_config),
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setConfig({ ...DEFAULT_CONFIG, ...asConfig(event.draft_login_config) });
  }, [event.draft_login_config]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("user_events")
        .update({ draft_login_config: config as unknown as Json })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const update = (patch: Partial<LoginConfig>) => {
    setConfig((prev) => ({ ...prev, ...patch }));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dash-text">Login Editor</h2>
          <p className="text-sm text-dash-muted">Customize the guest login page.</p>
        </div>
        <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
          {saved ? "Saved!" : "Save"}
        </Button>
      </div>

      <SplitEditor
        editor={
          <div className="space-y-4">
            <Card>
              <h3 className="mb-3 text-sm font-semibold text-dash-text">Heading</h3>
              <TypographyControls
                value={config.heading || {}}
                onChange={(heading) => update({ heading })}
                showText
              />
            </Card>

            <Card>
              <h3 className="mb-3 text-sm font-semibold text-dash-text">Subheading</h3>
              <TypographyControls
                value={config.subheading || {}}
                onChange={(subheading) => update({ subheading })}
                showText
              />
            </Card>

            <Card>
              <h3 className="mb-3 text-sm font-semibold text-dash-text">Form Options</h3>
              <div className="space-y-4">
                <Input
                  label="Placeholder Text"
                  value={config.placeholder || ""}
                  onChange={(e) => update({ placeholder: e.target.value })}
                  placeholder="Enter your username"
                />
                <Input
                  label="Button Text"
                  value={config.buttonText || ""}
                  onChange={(e) => update({ buttonText: e.target.value })}
                  placeholder="Enter"
                />
                <Toggle
                  checked={config.showUsernameHint ?? true}
                  onChange={(showUsernameHint) => update({ showUsernameHint })}
                  label="Show username hint"
                />
              </div>
            </Card>
          </div>
        }
        preview={
          <div className="rounded-lg border border-dash-border p-4">
            <LoginPreview loginConfig={config as unknown as Json} />
          </div>
        }
      />

      {saveMutation.isError && (
        <p className="text-sm text-dash-danger">
          {saveMutation.error instanceof Error ? saveMutation.error.message : "Failed to save."}
        </p>
      )}
    </div>
  );
}
