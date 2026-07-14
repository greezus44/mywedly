import { useState, useEffect } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase, type Json } from "../../lib/supabase";
import { useEventContext } from "./event-layout";
import { SplitEditor } from "../../components/preview/SplitEditor";
import { LoginPreview } from "../../components/preview/PreviewRenderers";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Toggle, LoadingSpinner } from "../../components/ui";

interface LoginConfig {
  mode?: "open" | "password";
  password?: string;
  heading?: string;
  subheading?: string;
  placeholder?: string;
  buttonText?: string;
}

export default function LoginEditor() {
  const { event, eventId } = useEventContext();
  const queryClient = useQueryClient();

  const [config, setConfig] = useState<LoginConfig>(() => {
    const raw = (event.draft_login_config ?? event.login_config ?? {}) as LoginConfig;
    return {
      mode: raw.mode ?? "open",
      password: raw.password ?? "",
      heading: raw.heading ?? "Welcome",
      subheading: raw.subheading ?? "Please enter your name to continue",
      placeholder: raw.placeholder ?? "Your full name",
      buttonText: raw.buttonText ?? "Enter",
    };
  });

  useEffect(() => {
    const raw = (event.draft_login_config ?? event.login_config ?? {}) as LoginConfig;
    setConfig({
      mode: raw.mode ?? "open",
      password: raw.password ?? "",
      heading: raw.heading ?? "Welcome",
      subheading: raw.subheading ?? "Please enter your name to continue",
      placeholder: raw.placeholder ?? "Your full name",
      buttonText: raw.buttonText ?? "Enter",
    });
  }, [event]);

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
      queryClient.invalidateQueries({ queryKey: ["user_events", eventId] });
    },
  });

  const previewEvent = {
    ...event,
    login_config: config as unknown as Json,
  };

  return (
    <SplitEditor
      editor={
        <div className="space-y-6">
          <div>
            <h2 className="mb-1 text-lg font-semibold text-dash-text">Login Editor</h2>
            <p className="text-sm text-dash-muted">
              Configure how guests access your website.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="mode"
                  value="open"
                  checked={config.mode === "open"}
                  onChange={() => setConfig((c) => ({ ...c, mode: "open" }))}
                  className="accent-dash-primary"
                />
                <span className="text-sm font-medium text-dash-text">Open Access</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="mode"
                  value="password"
                  checked={config.mode === "password"}
                  onChange={() => setConfig((c) => ({ ...c, mode: "password" }))}
                  className="accent-dash-primary"
                />
                <span className="text-sm font-medium text-dash-text">Password Protected</span>
              </label>
            </div>
            <p className="text-xs text-dash-muted">
              {config.mode === "open"
                ? "Guests can access the website freely."
                : "Guests must enter a password to view the website."}
            </p>
          </div>

          {config.mode === "password" && (
            <Input
              label="Password"
              type="text"
              value={config.password ?? ""}
              onChange={(e) =>
                setConfig((c) => ({ ...c, password: e.target.value }))
              }
              placeholder="Enter a password"
            />
          )}

          <Input
            label="Heading"
            value={config.heading ?? ""}
            onChange={(e) =>
              setConfig((c) => ({ ...c, heading: e.target.value }))
            }
            placeholder="Welcome"
          />

          <Input
            label="Subheading"
            value={config.subheading ?? ""}
            onChange={(e) =>
              setConfig((c) => ({ ...c, subheading: e.target.value }))
            }
            placeholder="Please enter your name to continue"
          />

          <Input
            label="Input Placeholder"
            value={config.placeholder ?? ""}
            onChange={(e) =>
              setConfig((c) => ({ ...c, placeholder: e.target.value }))
            }
            placeholder="Your full name"
          />

          <Input
            label="Button Text"
            value={config.buttonText ?? ""}
            onChange={(e) =>
              setConfig((c) => ({ ...c, buttonText: e.target.value }))
            }
            placeholder="Enter"
          />

          {saveMutation.isError && (
            <p className="text-sm text-dash-danger">
              {saveMutation.error instanceof Error
                ? saveMutation.error.message
                : "Failed to save"}
            </p>
          )}
          {saveMutation.isSuccess && (
            <p className="text-sm text-green-600">Changes saved successfully!</p>
          )}

          <Button
            onClick={() => saveMutation.mutate()}
            loading={saveMutation.isPending}
            className="w-full"
          >
            {saveMutation.isPending ? <LoadingSpinner size="sm" /> : "Save Changes"}
          </Button>
        </div>
      }
      preview={
        <div className="p-4">
          <LoginPreview event={previewEvent} className="rounded-lg" />
        </div>
      }
    />
  );
}
