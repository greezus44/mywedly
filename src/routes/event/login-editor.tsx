import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type Json } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { LoginPreview, type LoginConfig } from "../../components/preview/PreviewRenderers";
import { TypographyControls } from "../../components/ui/TypographyControls";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card } from "../../components/ui";
import type { TypographyStyle } from "../../lib/typography";

function asTypography(value: unknown): TypographyStyle {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as TypographyStyle;
  }
  return {};
}

export function LoginEditor() {
  const { event, eventId } = useEventContext();
  const queryClient = useQueryClient();

  const initial = (event.draft_login_config ?? event.login_config) as LoginConfig | null;

  const [heading, setHeading] = useState<TypographyStyle>(asTypography(initial?.heading));
  const [subheading, setSubheading] = useState<TypographyStyle>(asTypography(initial?.subheading));
  const [placeholder, setPlaceholder] = useState(initial?.placeholder ?? "Enter your username");
  const [buttonLabel, setButtonLabel] = useState(initial?.buttonLabel ?? "Sign In");

  useEffect(() => {
    const cfg = (event.draft_login_config ?? event.login_config) as LoginConfig | null;
    setHeading(asTypography(cfg?.heading));
    setSubheading(asTypography(cfg?.subheading));
    setPlaceholder(cfg?.placeholder ?? "Enter your username");
    setButtonLabel(cfg?.buttonLabel ?? "Sign In");
  }, [event]);

  const liveLoginConfig: LoginConfig = {
    heading,
    subheading,
    placeholder,
    buttonLabel,
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("user_events")
        .update({
          draft_login_config: liveLoginConfig as unknown as Json,
        })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-dash-text">Login Editor</h2>
        <Button
          onClick={() => saveMutation.mutate()}
          loading={saveMutation.isPending}
        >
          Save
        </Button>
      </div>

      {saveMutation.isError && (
        <p className="text-sm text-dash-danger">
          {saveMutation.error instanceof Error ? saveMutation.error.message : "Save failed"}
        </p>
      )}
      {saveMutation.isSuccess && (
        <p className="text-sm text-green-600">Saved successfully!</p>
      )}

      <SplitEditor
        editor={
          <div className="space-y-6">
            <Card className="p-4 space-y-4">
              <TypographyControls
                label="Heading"
                value={heading}
                onChange={setHeading}
              />
            </Card>

            <Card className="p-4 space-y-4">
              <TypographyControls
                label="Subheading"
                value={subheading}
                onChange={setSubheading}
              />
            </Card>

            <Card className="p-4 space-y-3">
              <h3 className="text-sm font-semibold text-dash-text">Form Fields</h3>
              <Input
                label="Placeholder text"
                value={placeholder}
                onChange={(e) => setPlaceholder(e.target.value)}
                placeholder="Enter your username"
              />
              <Input
                label="Button label"
                value={buttonLabel}
                onChange={(e) => setButtonLabel(e.target.value)}
                placeholder="Sign In"
              />
            </Card>
          </div>
        }
        preview={
          <div className="rounded-lg border border-dash-border bg-dash-surface p-4 overflow-hidden">
            <LoginPreview
              event={event}
              theme={event.draft_theme ?? event.theme}
              loginConfig={liveLoginConfig}
            />
          </div>
        }
      />
    </div>
  );
}
