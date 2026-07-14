import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type Json } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Toggle, Card } from "../../components/ui";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { LoginPreview } from "../../components/preview/PreviewRenderers";
import type { EventOutletContext } from "./event-layout";

interface LoginConfig {
  mode?: "name" | "password";
  heading?: string;
  subtitle?: string;
  placeholder?: string;
  buttonText?: string;
  passwordPrompt?: string;
}

function getLoginConfig(event: UserEvent): LoginConfig {
  const draft = event.draft_login_config as Record<string, unknown> | null;
  const published = event.login_config as Record<string, unknown> | null;
  const cfg = (draft ?? published ?? {}) as Record<string, unknown>;
  return {
    mode: (cfg.mode as "name" | "password") || "name",
    heading: (cfg.heading as string) || "Enter your name to continue",
    subtitle: (cfg.subtitle as string) || "Please enter the name on your invitation",
    placeholder: (cfg.placeholder as string) || "Your full name",
    buttonText: (cfg.buttonText as string) || "View Invitation",
    passwordPrompt: (cfg.passwordPrompt as string) || "Enter your password to continue",
  };
}

export default function LoginEditor(): React.ReactElement {
  const { event, eventId } = useOutletContext<EventOutletContext>();
  const queryClient = useQueryClient();

  const [config, setConfig] = useState<LoginConfig>(() => getLoginConfig(event));

  useEffect(() => {
    setConfig(getLoginConfig(event));
  }, [event]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("user_events")
        .update({ draft_login_config: config as unknown as Json })
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-event", eventId] });
    },
  });

  // Build a preview event with the current config
  const previewEvent: UserEvent = {
    ...event,
    login_config: { ...config },
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dash-text">Login Page</h2>
          <p className="mt-1 text-sm text-dash-muted">
            Configure how guests access your invitation website
          </p>
        </div>
        <Button
          onClick={() => saveMutation.mutate()}
          loading={saveMutation.isPending}
          disabled={saveMutation.isPending}
        >
          Save Changes
        </Button>
      </div>

      {saveMutation.isError && (
        <div className="mb-4 rounded-md border border-dash-danger/20 bg-dash-danger/5 px-4 py-3">
          <p className="text-sm text-dash-danger">
            {saveMutation.error instanceof Error ? saveMutation.error.message : "Failed to save"}
          </p>
        </div>
      )}
      {saveMutation.isSuccess && (
        <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3">
          <p className="text-sm text-green-700">Changes saved successfully</p>
        </div>
      )}

      <SplitEditor
        editor={
          <div className="space-y-6 p-5">
            <Card>
              <h3 className="text-sm font-semibold text-dash-text mb-4">Authentication Mode</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="mode"
                    value="name"
                    checked={config.mode === "name"}
                    onChange={() => setConfig({ ...config, mode: "name" })}
                    className="h-4 w-4 text-dash-primary focus:ring-dash-primary"
                  />
                  <div>
                    <span className="text-sm font-medium text-dash-text">Name-based login</span>
                    <p className="text-xs text-dash-muted">Guests enter their name to find their invitation</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="mode"
                    value="password"
                    checked={config.mode === "password"}
                    onChange={() => setConfig({ ...config, mode: "password" })}
                    className="h-4 w-4 text-dash-primary focus:ring-dash-primary"
                  />
                  <div>
                    <span className="text-sm font-medium text-dash-text">Password login</span>
                    <p className="text-xs text-dash-muted">Guests enter a shared password to access the site</p>
                  </div>
                </label>
              </div>
            </Card>

            <Card>
              <h3 className="text-sm font-semibold text-dash-text mb-4">Content</h3>
              <div className="space-y-4">
                <Input
                  label={config.mode === "password" ? "Password prompt" : "Heading"}
                  value={config.mode === "password" ? config.passwordPrompt ?? "" : config.heading ?? ""}
                  onChange={(e) =>
                    config.mode === "password"
                      ? setConfig({ ...config, passwordPrompt: e.target.value })
                      : setConfig({ ...config, heading: e.target.value })
                  }
                />
                <Input
                  label="Subtitle"
                  value={config.subtitle ?? ""}
                  onChange={(e) => setConfig({ ...config, subtitle: e.target.value })}
                />
                {config.mode === "name" && (
                  <Input
                    label="Placeholder"
                    value={config.placeholder ?? ""}
                    onChange={(e) => setConfig({ ...config, placeholder: e.target.value })}
                  />
                )}
                <Input
                  label="Button text"
                  value={config.buttonText ?? ""}
                  onChange={(e) => setConfig({ ...config, buttonText: e.target.value })}
                />
              </div>
            </Card>

            <Card>
              <Toggle
                checked={config.mode === "password"}
                onChange={(checked) =>
                  setConfig({ ...config, mode: checked ? "password" : "name" })
                }
                label="Use password protection"
                description="Require a shared password instead of guest name lookup"
              />
            </Card>
          </div>
        }
        preview={
          <div className="event-themed bg-event-bg">
            <LoginPreview event={previewEvent} />
          </div>
        }
      />
    </div>
  );
}
