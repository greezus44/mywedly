import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, type Json } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { LoginPreview } from "../../components/preview/PreviewRenderers";
import { Input, Toggle, Button } from "../../components/ui";
import { EventThemeProvider } from "../../lib/theme-context";

interface LoginConfig {
  mode?: "open" | "password";
  password?: string;
  heading?: string;
  description?: string;
  buttonText?: string;
}

export default function LoginEditor() {
  const { event, eventId } = useEventContext();
  const queryClient = useQueryClient();

  const currentConfig = (event.login_config ?? {}) as LoginConfig;
  const [mode, setMode] = useState<"open" | "password">(currentConfig.mode ?? "open");
  const [password, setPassword] = useState(currentConfig.password ?? "");
  const [heading, setHeading] = useState(currentConfig.heading ?? "Welcome");
  const [description, setDescription] = useState(
    currentConfig.description ?? "Enter your name to find your invitation"
  );
  const [buttonText, setButtonText] = useState(currentConfig.buttonText ?? "Find My Invitation");

  const draftEvent: typeof event = {
    ...event,
    login_config: {
      mode,
      password,
      heading,
      description,
      buttonText,
    } as Json,
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const newConfig: LoginConfig = {
        mode,
        password: mode === "password" ? password : undefined,
        heading,
        description,
        buttonText,
      };
      const { error } = await supabase
        .from("user_events")
        .update({ login_config: newConfig as Json })
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
        <div>
          <h2 className="text-xl font-semibold text-dash-text">Login Editor</h2>
          <p className="text-sm text-dash-muted">Configure how guests access your website.</p>
        </div>
        <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
          Save Changes
        </Button>
      </div>

      {saveMutation.isError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          Error saving: {saveMutation.error?.message}
        </div>
      )}
      {saveMutation.isSuccess && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">
          Login settings saved successfully!
        </div>
      )}

      <SplitEditor
        editor={
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-dash-text mb-2">
                Access Mode
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 rounded-md border border-dash-border p-3 cursor-pointer hover:bg-dash-bg">
                  <input
                    type="radio"
                    name="mode"
                    checked={mode === "open"}
                    onChange={() => setMode("open")}
                    className="accent-dash-primary"
                  />
                  <div>
                    <p className="text-sm font-medium text-dash-text">Open Access</p>
                    <p className="text-xs text-dash-muted">Guests can access without a password.</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 rounded-md border border-dash-border p-3 cursor-pointer hover:bg-dash-bg">
                  <input
                    type="radio"
                    name="mode"
                    checked={mode === "password"}
                    onChange={() => setMode("password")}
                    className="accent-dash-primary"
                  />
                  <div>
                    <p className="text-sm font-medium text-dash-text">Password Protected</p>
                    <p className="text-xs text-dash-muted">Guests need a password to access.</p>
                  </div>
                </label>
              </div>
            </div>

            {mode === "password" && (
              <Input
                label="Password"
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter access password"
              />
            )}

            <Input
              label="Heading"
              value={heading}
              onChange={(e) => setHeading(e.target.value)}
              placeholder="Welcome"
            />
            <Input
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter your name to find your invitation"
            />
            <Input
              label="Button Text"
              value={buttonText}
              onChange={(e) => setButtonText(e.target.value)}
              placeholder="Find My Invitation"
            />
          </div>
        }
        preview={
          <EventThemeProvider theme={event.theme}>
            <LoginPreview event={draftEvent} />
          </EventThemeProvider>
        }
      />
    </div>
  );
}
