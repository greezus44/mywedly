import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Json } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { LoginPreview, type LoginConfig, type LogoConfig } from "../../components/preview/PreviewRenderers";
import { EventThemeProvider } from "../../lib/theme-context";
import { TypographyControls } from "../../components/ui/TypographyControls";
import { Button } from "../../components/ui/Button";
import { Input, Toggle, FormField } from "../../components/ui";
import type { TypographyStyle } from "../../lib/typography";

const DEFAULT_HEADING: TypographyStyle = { text: "Welcome", fontFamily: "Georgia, serif", fontSize: 36, fontWeight: 700, color: "#78350f", align: "center" };
const DEFAULT_SUBHEADING: TypographyStyle = { text: "Enter your username to continue", fontFamily: "Georgia, serif", fontSize: 16, fontWeight: 400, color: "#92400e", align: "center" };

export function LoginEditor() {
  const { event, eventId } = useEventContext();
  const queryClient = useQueryClient();

  const [config, setConfig] = useState<LoginConfig>(
    (event.draft_login_config as LoginConfig | null) ?? (event.login_config as LoginConfig | null) ?? {}
  );
  const [logoConfig, setLogoConfig] = useState<LogoConfig>(
    (event.draft_logo_config as LogoConfig | null) ?? (event.logo_config as LogoConfig | null) ?? {}
  );
  const [savedMsg, setSavedMsg] = useState(false);

  useEffect(() => {
    // Sync if event changes externally
    setConfig((event.draft_login_config as LoginConfig | null) ?? (event.login_config as LoginConfig | null) ?? {});
  }, [event.draft_login_config, event.login_config]);

  function update<K extends keyof LoginConfig>(key: K, val: LoginConfig[K]) {
    setConfig((prev) => ({ ...prev, [key]: val }));
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("user_events")
        .update({
          draft_login_config: config as unknown as Json,
        })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 2000);
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dash-text">Login Editor</h2>
          <p className="text-sm text-dash-muted">Customise the guest login screen.</p>
        </div>
        <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
          {savedMsg ? "Saved!" : "Save Changes"}
        </Button>
      </div>

      {saveMutation.isError && (
        <p className="text-sm text-dash-danger">
          {saveMutation.error instanceof Error ? saveMutation.error.message : "Failed to save"}
        </p>
      )}

      <SplitEditor
        editorRatio={5}
        editor={
          <div className="space-y-6">
            <Toggle
              label="Show Logo"
              checked={config.showLogo ?? true}
              onChange={(v) => update("showLogo", v)}
            />

            <div className="border-t border-dash-border pt-4">
              <h3 className="mb-3 text-sm font-semibold text-dash-text">Heading Typography</h3>
              <TypographyControls
                value={(config.heading as TypographyStyle) ?? DEFAULT_HEADING}
                onChange={(v) => update("heading", v as unknown as Json)}
                showText
              />
            </div>

            <div className="border-t border-dash-border pt-4">
              <h3 className="mb-3 text-sm font-semibold text-dash-text">Subheading Typography</h3>
              <TypographyControls
                value={(config.subheading as TypographyStyle) ?? DEFAULT_SUBHEADING}
                onChange={(v) => update("subheading", v as unknown as Json)}
                showText
              />
            </div>

            <div className="border-t border-dash-border pt-4 space-y-4">
              <h3 className="text-sm font-semibold text-dash-text">Input & Button</h3>
              <Input
                label="Placeholder Text"
                value={config.placeholder ?? ""}
                onChange={(e) => update("placeholder", e.target.value)}
                placeholder="Enter your username"
              />
              <Input
                label="Button Text"
                value={config.buttonText ?? ""}
                onChange={(e) => update("buttonText", e.target.value)}
                placeholder="Enter Site"
              />
            </div>
          </div>
        }
        preview={
          <EventThemeProvider theme={event.draft_theme ?? event.theme}>
            <LoginPreview config={config} logoConfig={logoConfig} />
          </EventThemeProvider>
        }
        previewHeader={<span className="text-sm font-medium text-dash-text">Live Preview</span>}
      />
    </div>
  );
}
