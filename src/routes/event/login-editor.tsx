import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type UserEvent, type Json } from "../../lib/supabase";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { LoginPreview } from "../../components/preview/PreviewRenderers";
import { Input, Toggle } from "../../components/ui";
import { Button } from "../../components/ui/Button";
import { EventThemeProvider } from "../../lib/theme-context";
import { jsonToTheme } from "../../lib/theme";
import type { EventOutletContext } from "./event-layout";

interface LoginConfig {
  heading?: string;
  subtitle?: string;
  placeholder?: string;
  buttonText?: string;
  requireGuestName?: boolean;
  backgroundImage?: string;
  passwordMode?: "none" | "optional" | "required";
  password?: string;
}

function parseConfig(json: Json | null | undefined): LoginConfig {
  if (!json || typeof json !== "object") return {};
  return json as LoginConfig;
}

export default function LoginEditor() {
  const { event, eventId } = useOutletContext<EventOutletContext>();
  const queryClient = useQueryClient();

  const existing = parseConfig(event.draft_login_config ?? event.login_config);
  const [config, setConfig] = useState<LoginConfig>({
    heading: existing.heading ?? "Welcome",
    subtitle: existing.subtitle ?? "Enter your name to view the invitation",
    placeholder: existing.placeholder ?? "Your full name",
    buttonText: existing.buttonText ?? "View Invitation",
    requireGuestName: existing.requireGuestName ?? true,
    passwordMode: existing.passwordMode ?? "none",
    password: existing.password ?? "",
  });
  const [saved, setSaved] = useState(false);

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
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const previewEvent = {
    ...event,
    login_config: config as unknown as Json,
  };

  const theme = jsonToTheme(event.draft_theme ?? event.theme);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-dash-border bg-dash-surface px-4 py-3">
        <h2 className="text-lg font-semibold text-dash-text">Login Editor</h2>
        <div className="flex items-center gap-2">
          {saved && <span className="text-sm text-green-600">Saved!</span>}
          <Button
            onClick={() => saveMutation.mutate()}
            loading={saveMutation.isPending}
          >
            Save Changes
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <SplitEditor
          editorRatio={0.4}
          editor={
            <div className="space-y-5 p-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-dash-text">
                  Password Mode
                </label>
                <div className="flex flex-col gap-2">
                  {(["none", "optional", "required"] as const).map((mode) => (
                    <label
                      key={mode}
                      className="flex items-center gap-2 text-sm text-dash-text"
                    >
                      <input
                        type="radio"
                        name="passwordMode"
                        checked={config.passwordMode === mode}
                        onChange={() =>
                          setConfig({ ...config, passwordMode: mode })
                        }
                        className="accent-dash-primary"
                      />
                      <span className="capitalize">{mode}</span>
                      {mode === "none" && (
                        <span className="text-xs text-dash-muted">
                          (no password)
                        </span>
                      )}
                      {mode === "optional" && (
                        <span className="text-xs text-dash-muted">
                          (guests can skip)
                        </span>
                      )}
                      {mode === "required" && (
                        <span className="text-xs text-dash-muted">
                          (must enter)
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              </div>

              {config.passwordMode && config.passwordMode !== "none" && (
                <Input
                  label="Password"
                  type="text"
                  value={config.password ?? ""}
                  onChange={(e) =>
                    setConfig({ ...config, password: e.target.value })
                  }
                  placeholder="Enter a password for guests"
                />
              )}

              <hr className="border-dash-border" />

              <Input
                label="Heading"
                value={config.heading ?? ""}
                onChange={(e) =>
                  setConfig({ ...config, heading: e.target.value })
                }
                placeholder="Welcome"
              />

              <Input
                label="Subtitle"
                value={config.subtitle ?? ""}
                onChange={(e) =>
                  setConfig({ ...config, subtitle: e.target.value })
                }
                placeholder="Enter your name to view the invitation"
              />

              <Input
                label="Name Placeholder"
                value={config.placeholder ?? ""}
                onChange={(e) =>
                  setConfig({ ...config, placeholder: e.target.value })
                }
                placeholder="Your full name"
              />

              <Input
                label="Button Text"
                value={config.buttonText ?? ""}
                onChange={(e) =>
                  setConfig({ ...config, buttonText: e.target.value })
                }
                placeholder="View Invitation"
              />

              <Toggle
                checked={config.requireGuestName ?? true}
                onChange={(v) =>
                  setConfig({ ...config, requireGuestName: v })
                }
                label="Require guest name"
              />
            </div>
          }
          preview={
            <div className="p-4">
              <EventThemeProvider initialTheme={theme}>
                <LoginPreview event={previewEvent} />
              </EventThemeProvider>
            </div>
          }
        />
      </div>
    </div>
  );
}
