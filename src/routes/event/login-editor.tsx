import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type Json } from "../../lib/supabase";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { LoginPreview } from "../../components/preview/PreviewRenderers";
import { EventThemeProvider } from "../../lib/theme-context";
import { simplifiedToFullTheme, fullToSimplifiedTheme, type ThemeConfig } from "../../lib/theme";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Toggle } from "../../components/ui";
import { cn } from "../../lib/utils";

interface LoginConfig {
  mode: "open" | "password";
  password?: string;
  heading?: string;
  subheading?: string;
  placeholder?: string;
  cta?: string;
}

const DEFAULT_CONFIG: LoginConfig = {
  mode: "open",
  heading: "Enter your name to continue",
  subheading: "Please enter the name on your invitation",
  placeholder: "Your full name",
  cta: "Continue",
};

export default function LoginEditor() {
  const { event } = useOutletContext<{ event: UserEvent }>();
  const queryClient = useQueryClient();

  const [config, setConfig] = useState<LoginConfig>(
    (event.draft_login_config ?? event.login_config ?? DEFAULT_CONFIG) as LoginConfig,
  );

  useEffect(() => {
    setConfig(
      (event.draft_login_config ?? event.login_config ?? DEFAULT_CONFIG) as LoginConfig,
    );
  }, [event]);

  const themeConfig = (event.draft_theme ?? event.theme ?? {}) as unknown as ThemeConfig;
  const fullTheme = Object.keys(themeConfig).length
    ? themeConfig
    : simplifiedToFullTheme(fullToSimplifiedTheme({} as ThemeConfig));

  const previewEvent: Partial<UserEvent> = {
    ...event,
    login_config: config as unknown as Json,
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("user_events")
        .update({ draft_login_config: config as unknown as Json })
        .eq("id", event.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", event.id] });
    },
  });

  const update = (patch: Partial<LoginConfig>) => setConfig({ ...config, ...patch });

  return (
    <SplitEditor
      editorRatio={0.4}
      editor={
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-dash-text">Login Editor</h2>
            <Button
              size="sm"
              onClick={() => saveMutation.mutate()}
              loading={saveMutation.isPending}
            >
              Save Changes
            </Button>
          </div>

          {saveMutation.isSuccess && (
            <p className="text-sm text-green-600">Saved successfully!</p>
          )}
          {saveMutation.isError && (
            <p className="text-sm text-dash-danger">
              {saveMutation.error instanceof Error
                ? saveMutation.error.message
                : "Failed to save"}
            </p>
          )}

          <div>
            <span className="block text-sm font-medium text-dash-text mb-2">
              Access Mode
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => update({ mode: "open" })}
                className={cn(
                  "flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                  config.mode === "open"
                    ? "border-dash-primary bg-dash-primary/10 text-dash-primary"
                    : "border-dash-border text-dash-muted hover:text-dash-text",
                )}
              >
                Open Access
              </button>
              <button
                type="button"
                onClick={() => update({ mode: "password" })}
                className={cn(
                  "flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                  config.mode === "password"
                    ? "border-dash-primary bg-dash-primary/10 text-dash-primary"
                    : "border-dash-border text-dash-muted hover:text-dash-text",
                )}
              >
                Password Protected
              </button>
            </div>
          </div>

          {config.mode === "password" && (
            <Input
              label="Password"
              placeholder="Enter a password"
              value={config.password ?? ""}
              onChange={(e) => update({ password: e.target.value })}
            />
          )}

          <hr className="border-dash-border" />

          <Input
            label="Heading"
            value={config.heading ?? ""}
            onChange={(e) => update({ heading: e.target.value })}
          />
          <Input
            label="Subheading"
            value={config.subheading ?? ""}
            onChange={(e) => update({ subheading: e.target.value })}
          />
          <Input
            label="Placeholder"
            value={config.placeholder ?? ""}
            onChange={(e) => update({ placeholder: e.target.value })}
          />
          <Input
            label="Button Text"
            value={config.cta ?? ""}
            onChange={(e) => update({ cta: e.target.value })}
          />
        </div>
      }
      preview={
        <EventThemeProvider initialTheme={fullTheme}>
          <LoginPreview event={previewEvent} />
        </EventThemeProvider>
      }
    />
  );
}
